/*
 * L'Assistant de bout en bout, sur le VRAI site (next start, build de production) :
 *   navigateur simulé → routes /api/assistant/* → base PostgreSQL (toutes les migrations, via un
 *   petit PostgREST local) → fausse passerelle IA qui note tout ce qu'elle reçoit.
 * On vérifie qu'il n'y a plus aucune clé à fournir (seule la connexion Google compte), le repli
 * sur un autre modèle quand l'offre gratuite en refuse un, les quotas par compte, l'isolation des
 * comptes, le flux en direct, le texte des PDF, les erreurs, l'arrêt en cours de route, et que le
 * jeton du site n'apparaît jamais dans les réponses ni dans les journaux du serveur.
 * Prérequis : npm run build. Lancer : npm run test:assistant:e2e
 */
import { spawn } from "node:child_process";
import { SignJWT } from "jose";
import { ouvrirBase, servirPostgrest } from "./outils/postgrest-pglite.mjs";
import { JETON_ESSAI, servirPasserelle } from "./outils/passerelle-factice.mjs";

const PORT = 3107;
const BASE = `http://127.0.0.1:${PORT}`;
const SECRET = "e2e-".repeat(12);

let echecs = 0;
const ok = (nom: string, cond: unknown) => {
  console.log(`${cond ? "OK " : "ECHEC "}${nom}`);
  if (!cond) echecs++;
};

const db = await ouvrirBase();
await servirPostgrest(db, 9921);
// Comme l'offre gratuite de la passerelle : pas de Claude, ni du premier modèle de ChatGPT.
const passerelle = await servirPasserelle(9922, { refuses: ["anthropic/claude-haiku-5.5", "openai/gpt-6-luna"] });

const journalServeur: string[] = [];
const serveur = spawn("npx", ["next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    SUPABASE_URL: "http://127.0.0.1:9921",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_essai",
    SUPABASE_SECRET_KEY: "sb_secret_essai",
    SESSION_SECRET: SECRET,
    SETUP_TOKEN: "0123456789abcdef",
    ASSISTANT_PASSERELLE_BASE: "http://127.0.0.1:9922/v1",
    AI_GATEWAY_API_KEY: JETON_ESSAI,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
serveur.stdout.on("data", (d) => journalServeur.push(String(d)));
serveur.stderr.on("data", (d) => journalServeur.push(String(d)));
const fin = async (code: number) => {
  serveur.kill("SIGTERM");
  await new Promise((r) => setTimeout(r, 300));
  process.exit(code);
};
for (let i = 0; ; i++) {
  try {
    const r = await fetch(`${BASE}/robots.txt`);
    if (r.ok) break;
  } catch {
    // Pas encore prêt.
  }
  if (i > 120) {
    console.log(journalServeur.join(""));
    console.log("ECHEC le serveur ne démarre pas");
    await fin(1);
  }
  await new Promise((r) => setTimeout(r, 500));
}

/* ---------- Comptes et sessions ---------- */
async function compte(sub: string, nom: string) {
  const l = (await db.query<{ id: string; session_version: number }>(`select * from compte_ouvrir($1, $2, $3)`, [sub, `${sub}@exemple.fr`, nom])).rows[0];
  const jeton = await new SignJWT({ uid: l.id, nom, email: `${sub}@exemple.fr`, sv: l.session_version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("utilisateur")
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(SECRET));
  return { id: l.id, cookie: `__Host-hr_compte=${jeton}` };
}
const A = await compte("e2e-a", "Amine A");
const B = await compte("e2e-b", "Bilal B");
const C = await compte("e2e-c", "Chaima C");
const E = await compte("e2e-e", "Elias E");
const Q = await compte("e2e-q", "Quota Q");

type Reponse = { statut: number; corps: Record<string, unknown> & { erreur?: string; message?: string } };
async function appel(qui: { cookie: string } | null, methode: string, chemin: string, corps?: unknown, extra: Record<string, string> = {}): Promise<Reponse> {
  const r = await fetch(`${BASE}${chemin}`, {
    method: methode,
    headers: { Origin: BASE, "Sec-Fetch-Site": "same-origin", ...(corps !== undefined ? { "Content-Type": "application/json" } : {}), ...(qui ? { Cookie: qui.cookie } : {}), ...extra },
    body: corps !== undefined ? JSON.stringify(corps) : undefined,
    redirect: "manual",
  });
  const texte = await r.text();
  let c: Record<string, unknown> = {};
  try {
    c = JSON.parse(texte);
  } catch {
    c = { brut: texte };
  }
  return { statut: r.status, corps: c as Reponse["corps"] };
}

type Ev = { t: string; [k: string]: unknown };
async function question(qui: { cookie: string }, corps: Record<string, unknown>): Promise<{ statut: number; evenements: Ev[]; texte: string; erreur?: Reponse["corps"]; brut: string }> {
  const r = await fetch(`${BASE}/api/assistant/message`, {
    method: "POST",
    headers: { Origin: BASE, "Sec-Fetch-Site": "same-origin", "Content-Type": "application/json", Cookie: qui.cookie },
    body: JSON.stringify(corps),
  });
  const brut = await r.text();
  if (!r.ok) return { statut: r.status, evenements: [], texte: "", erreur: JSON.parse(brut), brut };
  const evenements = brut
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Ev);
  return { statut: r.status, evenements, texte: evenements.filter((e) => e.t === "texte").map((e) => e.v).join(""), brut };
}
type Requete = { chemin: string; jeton: string; corps: { model: string; stream: boolean; max_completion_tokens: number; stream_options: { include_usage: boolean }; providerOptions: { gateway: { caching: string } }; messages: { role: string; content: string }[] } };
const journal = passerelle.journal as unknown as Requete[];
const derniere = () => journal.at(-1)!;
const sql = async <T,>(q: string, p: unknown[] = []) => (await db.query<T>(q, p)).rows;
const compter = async (q: string, p: unknown[] = []) => Number((await sql<{ n: number }>(q, p))[0].n);

/* ---------- Entrée : session, origine, plus aucune clé ---------- */
ok("sans session : 401", (await appel(null, "GET", "/api/assistant/etat")).statut === 401);
ok("depuis un autre site : 403", (await appel(A, "PATCH", "/api/assistant/reglages", { ia: "google" }, { Origin: "https://pirate.example", "Sec-Fetch-Site": "cross-site" })).statut === 403);
// Une clé reliée du temps où chacun fournissait la sienne : elle doit disparaître.
await db.query(`insert into assistant_cles (utilisateur_id, fournisseur, cle_chiffree, apercu) values ($1, 'openai', 'v1.QUJD', 'sk-proj-…abcd')`, [A.id]);
const etat0 = await appel(A, "GET", "/api/assistant/etat");
const quota0 = etat0.corps.quota as { questionsRestantes: number; questionsJour: number; partMois: number };
ok("état d'un compte neuf : ChatGPT par défaut, toutes ses questions gratuites, aucune clé demandée", etat0.statut === 200 && (etat0.corps.reglages as { ia: string }).ia === "openai" && quota0.questionsRestantes === 30 && quota0.partMois === 0 && !("cles" in etat0.corps));
ok("les anciennes clés du compte sont effacées", (await compter(`select count(*)::int n from assistant_cles where utilisateur_id = $1`, [A.id])) === 0);
ok("la route des clés n'existe plus", [404, 405].includes((await appel(A, "PUT", "/api/assistant/cle", { fournisseur: "openai", cle: "sk-proj-x" })).statut));
const choix = await appel(A, "PATCH", "/api/assistant/reglages", { ia: "google" });
ok("choisir son IA : gardé sur le compte", choix.statut === 200 && (choix.corps.reglages as { ia: string }).ia === "google" && ((await appel(A, "GET", "/api/assistant/etat")).corps.reglages as { ia: string }).ia === "google");
ok("une IA inconnue est refusée", (await appel(A, "PATCH", "/api/assistant/reglages", { ia: "mistral" })).statut === 400);

/* ---------- Chat général avec ChatGPT : repli sur le modèle que l'offre gratuite sert ---------- */
const cg = await appel(A, "POST", "/api/assistant/conversations", { espace: "general" });
const idGeneral = (cg.corps.conversation as { id: string }).id;
ok("conversation créée", cg.statut === 201 && /^[0-9a-f-]{36}$/.test(idGeneral));
const avant = journal.length;
const q1 = await question(A, { conversationId: idGeneral, texte: "Qu'est-ce qu'un syllogisme ?", ia: "openai" });
const types = q1.evenements.map((e) => e.t);
ok("réponse en flux : début, réflexion, texte, fin", q1.statut === 200 && types[0] === "debut" && types.includes("reflexion") && types.filter((x) => x === "texte").length > 3 && types.at(-1) === "fin");
ok("le texte arrive entier", q1.texte.startsWith("Tu demandes : « Qu'est-ce qu'un syllogisme ? »") && q1.texte.includes("console.log"));
ok("GPT-6 Luna refusé par l'offre gratuite : GPT-5.4 mini répond, et le début du flux le dit", journal.length === avant + 2 && journal[avant].corps.model === "openai/gpt-6-luna" && journal[avant + 1].corps.model === "openai/gpt-5.4-mini" && (q1.evenements[0] as { modele: string }).modele === "openai/gpt-5.4-mini");
const finQ1 = q1.evenements.at(-1) as { etat: string; cout: number; usage: { entree: number; sortie: number }; id: string };
ok("fin : état complet, jetons et coût donné par la passerelle", finQ1.etat === "complet" && finQ1.usage.sortie > 0 && finQ1.cout === 0.000123 && /^[0-9a-f-]{36}$/.test(finQ1.id));
const r1 = derniere();
ok("l'appel part avec le jeton du site, jamais une clé d'utilisateur", r1.jeton === JETON_ESSAI && r1.chemin === "/v1/chat/completions");
ok("requête conforme : flux avec consommation, longueur maximale, cache automatique", r1.corps.stream === true && r1.corps.stream_options.include_usage === true && r1.corps.max_completion_tokens === 8000 && r1.corps.providerOptions.gateway.caching === "auto");
ok("consigne du site en premier (au nom de ChatGPT), question en dernier", r1.corps.messages[0].role === "system" && r1.corps.messages[0].content.includes("assistant de HaqqReason") && r1.corps.messages[0].content.includes("propulsé par ChatGPT") && r1.corps.messages.at(-1)?.content === "Qu'est-ce qu'un syllogisme ?");
const enBase = await sql<{ role: string; etat: string; modele: string; jetons_sortie: number; cout_usd: string }>(`select role, etat, modele, jetons_sortie, cout_usd from assistant_messages where conversation_id = $1 order by cree_le`, [idGeneral]);
ok("en base : la question puis la réponse, avec le modèle qui a répondu et ses jetons", enBase.length === 2 && enBase[0].role === "user" && enBase[1].etat === "complet" && enBase[1].modele === "openai/gpt-5.4-mini" && enBase[1].jetons_sortie > 0 && Number(enBase[1].cout_usd) === 0.000123);
ok("titre donné par la première question", (await sql<{ titre: string }>(`select titre from assistant_conversations where id = $1`, [idGeneral]))[0].titre === "Qu'est-ce qu'un syllogisme ?");
ok("consommation journalisée", (await compter(`select count(*)::int n from assistant_usage where utilisateur_id = $1 and statut = 'ok'`, [A.id])) === 1);
ok("le quota du jour a baissé d'une question", ((await appel(A, "GET", "/api/assistant/etat")).corps.quota as { questionsRestantes: number }).questionsRestantes === 29);

const avant2 = journal.length;
await question(A, { conversationId: idGeneral, texte: "Et un enthymème ?", ia: "openai" });
const r2 = derniere();
ok("ensuite, le modèle qui marche est demandé directement", journal.length === avant2 + 1 && r2.corps.model === "openai/gpt-5.4-mini");
ok("l'historique suit, rôles alternés", r2.corps.messages.map((m) => m.role).join(",") === "system,user,assistant,user" && r2.corps.messages[1].content === "Qu'est-ce qu'un syllogisme ?");

const regen = await question(A, { conversationId: idGeneral, reessayer: true, ia: "openai" });
const apres = await sql<{ role: string }>(`select role from assistant_messages where conversation_id = $1 order by cree_le`, [idGeneral]);
ok("régénérer : la dernière réponse est remplacée, la question n'est pas dupliquée", regen.statut === 200 && apres.map((m) => m.role).join(",") === "user,assistant,user,assistant");

/* ---------- Gemini et Claude ---------- */
const qG = await question(A, { conversationId: idGeneral, texte: "Bonjour Gemini", ia: "google" });
ok("Gemini : réponse complète, demandée à Gemini 3.5 Flash-Lite au nom de Gemini", qG.statut === 200 && derniere().corps.model === "google/gemini-3.5-flash-lite" && derniere().corps.messages[0].content.includes("propulsé par Gemini") && (qG.evenements.at(-1) as { etat: string }).etat === "complet");
const avantClaude = await compter(`select count(*)::int n from assistant_usage where utilisateur_id = $1`, [A.id]);
const qC = await question(A, { conversationId: idGeneral, texte: "Bonjour Claude", ia: "anthropic" });
ok("Claude hors de l'offre gratuite : refus clair qui nomme Claude, la question est gardée", qC.statut === 502 && qC.erreur?.erreur === "modele_indisponible" && qC.erreur?.fournisseur === "anthropic" && String(qC.erreur?.message).startsWith("Claude n'est pas compris") && typeof qC.erreur?.questionId === "string");
ok("…ce refus ne coûte rien au quota", (await compter(`select count(*)::int n from assistant_usage where utilisateur_id = $1`, [A.id])) === avantClaude);
ok("…et l'état signale Claude indisponible", ((await appel(A, "GET", "/api/assistant/etat")).corps.indisponibles as string[]).includes("anthropic"));

/* ---------- Isolation entre comptes ---------- */
ok("un autre compte ne voit pas la conversation", (await appel(B, "GET", `/api/assistant/conversations/${idGeneral}`)).statut === 404);
ok("ni ne la renomme, ni ne la supprime", (await appel(B, "PATCH", `/api/assistant/conversations/${idGeneral}`, { titre: "piraté" })).statut === 404 && (await appel(B, "DELETE", `/api/assistant/conversations/${idGeneral}`)).statut === 404);
const avantB = journal.length;
const intrus = await question(B, { conversationId: idGeneral, texte: "Je lis la conversation d'Amine" });
ok("ni n'y écrit (rien n'est envoyé à la passerelle)", intrus.statut === 404 && journal.length === avantB);
ok("sa liste est vide, et son réglage est le sien", ((await appel(B, "GET", "/api/assistant/conversations?espace=general")).corps.conversations as unknown[]).length === 0 && ((await appel(B, "GET", "/api/assistant/etat")).corps.reglages as { ia: string }).ia === "openai");

/* ---------- ChatPDF ---------- */
const cp = await appel(A, "POST", "/api/assistant/conversations", { espace: "pdf" });
const idPdf = (cp.corps.conversation as { id: string }).id;
const texte1 = `[Page 1]\nLa raison et la révélation. ${"Introduction développée. ".repeat(80)}\n\n[Page 2]\nPremière thèse : la raison mène à la vérité.\n\n[Page 3]\nDeuxième partie.\n\n[Page 4]\nConclusion.`;
const doc1 = await appel(A, "POST", "/api/assistant/documents", { conversationId: idPdf, nom: "C:\\Documents\\traite.pdf", pages: 4, pagesVides: 0, empreinte: "1".repeat(64), texte: texte1 });
const fiche1 = doc1.corps.document as { id: string; numero: number; nom: string; caracteres: number };
ok("PDF importé : numéro 1, nom nettoyé, taille comptée par le serveur", doc1.statut === 201 && fiche1.numero === 1 && fiche1.nom === "traite.pdf" && fiche1.caracteres === texte1.length);
ok("le même PDF n'entre pas deux fois", (await appel(A, "POST", "/api/assistant/documents", { conversationId: idPdf, nom: "copie.pdf", pages: 4, pagesVides: 0, empreinte: "1".repeat(64), texte: texte1 })).corps.erreur === "doublon");
const doc2 = await appel(A, "POST", "/api/assistant/documents", { conversationId: idPdf, nom: "second.pdf", pages: 1, pagesVides: 0, empreinte: "2".repeat(64), texte: "[Page 1]\nUn second document, plus court." });
const fiche2 = doc2.corps.document as { id: string; numero: number };
ok("second PDF : numéro 2", fiche2.numero === 2);
ok("un PDF ne rejoint pas une conversation d'un autre compte", (await appel(B, "POST", "/api/assistant/documents", { conversationId: idPdf, nom: "x.pdf", pages: 1, pagesVides: 0, empreinte: "3".repeat(64), texte: "[Page 1]\nx" })).statut === 404);
const arabe = `[Page 1]\n${"بسم الله الرحمن الرحيم ".repeat(75_000)}`;
ok("un texte de plus de 3 Mo (ici en arabe, 2 octets par lettre) est refusé clairement", (await appel(A, "POST", "/api/assistant/documents", { conversationId: idPdf, nom: "gros.pdf", pages: 1, pagesVides: 0, empreinte: "9".repeat(64), texte: arabe })).statut === 413);
ok("un PDF ne rejoint pas le chat général", (await appel(A, "POST", "/api/assistant/documents", { conversationId: idGeneral, nom: "x.pdf", pages: 1, pagesVides: 0, empreinte: "4".repeat(64), texte: "[Page 1]\nx" })).statut === 404);

const q3 = await question(A, { conversationId: idPdf, texte: "Quelle est la première thèse ?", ia: "openai" });
const r3 = derniere();
const debut3 = q3.evenements[0] as { contexte: { mode: string; documents: { numero: number; pages: string }[] } };
ok("petits PDF : lecture complète annoncée", debut3.contexte.mode === "complet" && debut3.contexte.documents.map((d) => `${d.numero}:${d.pages}`).join(" ") === "1:1-4 2:1");
ok("texte intégral à la suite de la consigne", r3.corps.messages[0].content.includes('<document index="1" nom="traite.pdf" pages="4">') && r3.corps.messages[0].content.includes("[Page 2]\nPremière thèse"));
ok("consigne ChatPDF : documents numérotés et références", r3.corps.messages[0].content.includes("Doc 2 : « second.pdf » (1 page)") && r3.corps.messages[0].content.includes("[Doc 2, p. 14]"));
ok("la réponse cite ses pages", q3.texte.includes("[Doc 1, p. 2]"));
const q4 = await question(A, { conversationId: idPdf, texte: "Et la conclusion ?", ia: "openai" });
ok("question suivante : les documents sont relus depuis le cache", (q4.evenements.at(-1) as { usage: { lectureCache: number } }).usage.lectureCache > 0);

const page2 = await appel(A, "GET", `/api/assistant/documents/${fiche1.id}?page=2`);
ok("vérifier une référence : la page 2 seule", page2.statut === 200 && page2.corps.texte === "Première thèse : la raison mène à la vérité.");
ok("la page d'un PDF d'un autre compte est introuvable", (await appel(B, "GET", `/api/assistant/documents/${fiche1.id}?page=2`)).statut === 404);
ok("ni décochable, ni supprimable par un autre compte", (await appel(B, "PATCH", `/api/assistant/documents/${fiche1.id}`, { actif: false })).statut === 404 && (await appel(B, "DELETE", `/api/assistant/documents/${fiche1.id}`)).statut === 404);

await appel(A, "PATCH", `/api/assistant/documents/${fiche2.id}`, { actif: false });
await question(A, { conversationId: idPdf, texte: "Résume.", ia: "openai" });
const r5 = derniere();
ok("document décoché : l'IA ne le lit plus", r5.corps.messages[0].content.includes('index="1"') && !r5.corps.messages[0].content.includes('index="2"') && !r5.corps.messages[0].content.includes("second.pdf"));
await appel(A, "DELETE", `/api/assistant/documents/${fiche2.id}`);
const doc3 = await appel(A, "POST", "/api/assistant/documents", { conversationId: idPdf, nom: "troisieme.pdf", pages: 1, pagesVides: 0, empreinte: "5".repeat(64), texte: "[Page 1]\nTroisième." });
ok("un numéro retiré n'est pas redonné : les anciennes références restent justes", (doc3.corps.document as { numero: number }).numero === 3);

// Un long document : lecture par extraits.
const pages = Array.from({ length: 220 }, (_, i) => `[Page ${i + 1}]\n${"Remarques générales sur la méthode historique. ".repeat(40)}${i === 150 ? "Le manuscrit de Birmingham date du VIIe siècle selon le radiocarbone." : ""}`);
const long = await appel(A, "POST", "/api/assistant/documents", { conversationId: idPdf, nom: "long.pdf", pages: 220, pagesVides: 0, empreinte: "6".repeat(64), texte: pages.join("\n\n") });
ok("long PDF importé", long.statut === 201);
const q6 = await question(A, { conversationId: idPdf, texte: "Que dit-on du manuscrit de Birmingham ?", ia: "openai" });
const r6 = derniere();
const debut6 = q6.evenements[0] as { contexte: { mode: string } };
const dernierMessage = r6.corps.messages.at(-1)!.content;
ok("documents longs : lecture par extraits, avec la question", debut6.contexte.mode === "extraits" && dernierMessage.startsWith("<extraits>") && dernierMessage.includes("<question>\nQue dit-on du manuscrit de Birmingham ?\n</question>"));
ok("le passage utile est dans les extraits, la consigne ne porte plus les documents", dernierMessage.includes("Birmingham date du VIIe siècle") && !r6.corps.messages[0].content.includes("<documents>"));
const histo6 = await sql<{ contenu: string }>(`select contenu from assistant_messages where conversation_id = $1 and role = 'user' order by cree_le desc limit 1`, [idPdf]);
ok("l'historique garde la question seule (sans les extraits)", histo6[0].contenu === "Que dit-on du manuscrit de Birmingham ?");
ok("pas de PDF coché : refus clair", await (async () => {
  const cv = await appel(A, "POST", "/api/assistant/conversations", { espace: "pdf" });
  const r = await question(A, { conversationId: (cv.corps.conversation as { id: string }).id, texte: "?" });
  return r.statut === 400 && r.erreur?.erreur === "sans_document";
})());

/* ---------- Erreurs de la passerelle ---------- */
const cc = await appel(C, "POST", "/api/assistant/conversations", { espace: "general" });
const idC = (cc.corps.conversation as { id: string }).id;
const credit = await question(C, { conversationId: idC, texte: "SANS_CREDIT Bonjour", ia: "google" });
ok("crédit gratuit du site épuisé : message clair, la question est gardée", credit.statut === 502 && credit.erreur?.erreur === "credit_site" && String(credit.erreur?.message).includes("crédit gratuit") && typeof credit.erreur?.questionId === "string");
const msgC = await sql<{ role: string; etat: string }>(`select role, etat from assistant_messages where conversation_id = $1 order by cree_le`, [idC]);
ok("en base : la question et l'erreur (affichée au rechargement)", msgC.map((m) => `${m.role}:${m.etat}`).join(",") === "user:complet,assistant:erreur");
ok("la tentative ne compte pas dans le quota", (await compter(`select count(*)::int n from assistant_usage where utilisateur_id = $1`, [C.id])) === 0);
const verif = await question(C, { conversationId: idC, texte: "VERIFICATION Bonjour", ia: "google" });
ok("passerelle pas encore activée (moyen de paiement) : message clair", verif.statut === 502 && verif.erreur?.erreur === "activation");
const coupure = await question(C, { conversationId: idC, texte: "COUPURE Bonjour", ia: "google" });
const finCoupure = coupure.evenements.at(-1) as { etat: string };
ok("erreur au milieu du flux : le début est gardé, marqué « interrompu », et l'erreur est dite", coupure.statut === 200 && finCoupure.etat === "interrompu" && coupure.evenements.some((e) => e.t === "erreur") && coupure.texte.startsWith("Tu demandes"));

/* ---------- Quotas ---------- */
const cq = await appel(Q, "POST", "/api/assistant/conversations", { espace: "general" });
const idQ = (cq.corps.conversation as { id: string }).id;
await db.query(`insert into assistant_usage (utilisateur_id, modele, statut, cout_usd, cree_le) select $1, 'openai/gpt-5.4-mini', 'ok', 0.0001, now() - interval '11 minutes' from generate_series(1, 30)`, [Q.id]);
const avantQuota = journal.length;
const jour = await question(Q, { conversationId: idQ, texte: "Encore une ?", ia: "openai" });
ok("30 questions aujourd'hui : refus avant tout envoi, la question n'est pas enregistrée", jour.statut === 429 && jour.erreur?.erreur === "quota_jour" && journal.length === avantQuota && (await compter(`select count(*)::int n from assistant_messages where utilisateur_id = $1`, [Q.id])) === 0);
ok("l'état le dit : plus de question aujourd'hui", ((await appel(Q, "GET", "/api/assistant/etat")).corps.quota as { questionsRestantes: number }).questionsRestantes === 0);
await db.query(`delete from assistant_usage where utilisateur_id = $1`, [Q.id]);
await db.query(`insert into assistant_usage (utilisateur_id, modele, statut, cout_usd, cree_le) values ($1, 'openai/gpt-5.4-mini', 'ok', 0.6, now() - interval '11 minutes')`, [Q.id]);
const mois = await question(Q, { conversationId: idQ, texte: "Et maintenant ?", ia: "openai" });
ok("part du crédit du mois utilisée : refus clair", mois.statut === 429 && mois.erreur?.erreur === "quota_mois" && journal.length === avantQuota);
await db.query(`delete from assistant_usage where utilisateur_id = $1`, [Q.id]);
await db.query(`insert into assistant_usage (utilisateur_id, modele, statut, cout_usd) select $1, 'openai/gpt-5.4-mini', 'ok', 0 from generate_series(1, 12)`, [Q.id]);
const rythme = await question(Q, { conversationId: idQ, texte: "Vite !", ia: "openai" });
ok("trop de questions en dix minutes : refus, sans envoi", rythme.statut === 429 && rythme.erreur?.erreur === "rythme" && journal.length === avantQuota);

/* ---------- Arrêt en cours de route ---------- */
const ce = await appel(E, "POST", "/api/assistant/conversations", { espace: "general" });
const idE = (ce.corps.conversation as { id: string }).id;
const arret = new AbortController();
const flux = await fetch(`${BASE}/api/assistant/message`, {
  method: "POST",
  headers: { Origin: BASE, "Sec-Fetch-Site": "same-origin", "Content-Type": "application/json", Cookie: E.cookie },
  body: JSON.stringify({ conversationId: idE, texte: "LENT Raconte longuement", ia: "google" }),
  signal: arret.signal,
});
const lecteur = flux.body!.getReader();
let recu = "";
while (!recu.includes('"t":"texte"')) recu += new TextDecoder().decode((await lecteur.read()).value);
arret.abort();
await new Promise((r) => setTimeout(r, 2500));
const coupe = await sql<{ etat: string; contenu: string; jetons_sortie: number }>(`select etat, contenu, jetons_sortie from assistant_messages where conversation_id = $1 and role = 'assistant'`, [idE]);
ok("arrêt en cours de route : la réponse partielle est gardée, marquée « interrompue »", coupe.length === 1 && coupe[0].etat === "interrompu" && coupe[0].contenu.startsWith("Tu demandes") && coupe[0].jetons_sortie > 0);
ok("…et sa consommation est journalisée", (await compter(`select count(*)::int n from assistant_usage where utilisateur_id = $1 and statut = 'interrompu'`, [E.id])) === 1);

/* ---------- Suppression ---------- */
ok("supprimer une conversation efface ses PDF", (await appel(A, "DELETE", `/api/assistant/conversations/${idPdf}`)).statut === 200 && (await compter(`select count(*)::int n from assistant_documents where conversation_id = $1`, [idPdf])) === 0);

/* ---------- La page ---------- */
const page = await fetch(`${BASE}/assistant`, { headers: { Cookie: A.cookie }, redirect: "manual" });
const html = await page.text();
ok("la page s'ouvre avec un compte, sans parler de clé", page.status === 200 && html.includes("Le Vizir") && !/relie ta clé|clé API/i.test(html));
const sansCompte = await fetch(`${BASE}/assistant`, { redirect: "manual" });
ok("sans compte : renvoi vers la connexion, puis retour à l'assistant", [303, 307, 308].includes(sansCompte.status) && (sansCompte.headers.get("location") ?? "").includes("/connexion?retour=%2Fassistant"));

/* ---------- Le jeton du site ne fuit pas ---------- */
const journaux = journalServeur.join("");
ok("le refus de l'offre gratuite est noté dans le journal du serveur", journaux.includes("[vizir] passerelle 403"));
ok("le jeton du site n'apparaît ni dans les journaux, ni dans les réponses", !journaux.includes(JETON_ESSAI) && !q1.brut.includes(JETON_ESSAI) && !JSON.stringify(etat0.corps).includes(JETON_ESSAI));

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
await passerelle.fermer();
await fin(echecs ? 1 : 0);
