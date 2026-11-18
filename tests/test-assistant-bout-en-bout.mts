/*
 * L'Assistant de bout en bout, sur le VRAI site (next start, build de production) :
 *   navigateur simulé → routes /api/assistant/* → base PostgreSQL (toutes les migrations, via un
 *   petit PostgREST local) → fausse API Anthropic qui note tout ce qu'elle reçoit.
 * On vérifie l'isolation des comptes, que chaque appel part avec la clé de SON utilisateur,
 * le flux en direct, le texte des PDF et le cache, les erreurs, l'arrêt en cours de route,
 * et qu'aucune clé n'apparaît jamais dans les réponses ni dans les journaux du serveur.
 * Prérequis : npm run build. Lancer : npm run test:assistant:e2e
 */
import { spawn } from "node:child_process";
import { SignJWT } from "jose";
import { ouvrirBase, servirPostgrest } from "./outils/postgrest-pglite.mjs";
import { servirAnthropic } from "./outils/anthropic-factice.mjs";

const PORT = 3107;
const BASE = `http://127.0.0.1:${PORT}`;
const SECRET = "e2e-".repeat(12);
const CLES = {
  a: `sk-ant-api03-${"Aa1_".repeat(10)}fin`,
  c: `sk-ant-api03-CREDIT${"c".repeat(30)}`,
  d: `sk-ant-api03-SANSEFFORT${"d".repeat(30)}`,
  e: `sk-ant-api03-LENT${"e".repeat(30)}`,
  revoquee: `sk-ant-api03-REVOQUEE${"x".repeat(30)}`,
};

let echecs = 0;
const ok = (nom: string, cond: unknown) => {
  console.log(`${cond ? "OK " : "ECHEC "}${nom}`);
  if (!cond) echecs++;
};

const db = await ouvrirBase();
await servirPostgrest(db, 9921);
const anthropic = await servirAnthropic(9922);

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
    ASSISTANT_ANTHROPIC_BASE: "http://127.0.0.1:9922",
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
const D = await compte("e2e-d", "Dounia D");
const E = await compte("e2e-e", "Elias E");

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
const derniereRequete = () => anthropic.journal.at(-1) as { cle: string; corps: Record<string, unknown> & { system: { text: string; cache_control?: unknown }[]; messages: { role: string; content: { text: string; cache_control?: unknown }[] }[] } };
const sql = async <T,>(q: string, p: unknown[] = []) => (await db.query<T>(q, p)).rows;

/* ---------- Entrée : session, origine ---------- */
ok("sans session : 401", (await appel(null, "GET", "/api/assistant/etat")).statut === 401);
ok("depuis un autre site : 403", (await appel(A, "PUT", "/api/assistant/cle", { cle: CLES.a }, { Origin: "https://pirate.example", "Sec-Fetch-Site": "cross-site" })).statut === 403);
const etat0 = await appel(A, "GET", "/api/assistant/etat");
ok("état d'un compte neuf : pas de clé, rien dépensé", etat0.statut === 200 && etat0.corps.cle === null && (etat0.corps.bilan as { moisCout: number }).moisCout === 0);

/* ---------- La clé ---------- */
ok("clé mal formée refusée sans appel à Anthropic", (await appel(A, "PUT", "/api/assistant/cle", { cle: "bonjour" })).corps.erreur === "format");
const revoquee = await appel(A, "PUT", "/api/assistant/cle", { cle: CLES.revoquee });
ok("clé refusée par Anthropic : message clair", revoquee.statut === 400 && revoquee.corps.erreur === "cle_invalide");
const relie = await appel(A, "PUT", "/api/assistant/cle", { cle: CLES.a, modele: "claude-sonnet-5-5", effort: "medium" });
const ficheA = relie.corps.cle as { apercu: string; modele: string; statut: string };
ok("clé vérifiée puis reliée", relie.statut === 200 && ficheA.statut === "valide" && ficheA.apercu === `sk-ant-…${CLES.a.slice(-4)}`);
ok("la réponse ne contient jamais la clé", !JSON.stringify(relie.corps).includes(CLES.a.slice(14, 40)));
const ligneCle = (await sql<{ cle_chiffree: string }>(`select cle_chiffree from assistant_cles where utilisateur_id = $1`, [A.id]))[0];
ok("en base : chiffrée, jamais en clair", ligneCle.cle_chiffree.startsWith("v1.") && !ligneCle.cle_chiffree.includes("sk-ant"));
ok("essais de clé comptés (anti-test de clés volées)", Number((await sql<{ n: number }>(`select count(*)::int n from assistant_verifications where utilisateur_id = $1`, [A.id]))[0].n) === 2);
ok("l'état ne renvoie que l'aperçu", JSON.stringify((await appel(A, "GET", "/api/assistant/etat")).corps).includes(ficheA.apercu) && !JSON.stringify((await appel(A, "GET", "/api/assistant/etat")).corps).includes(CLES.a));

/* ---------- Chat général ---------- */
const cg = await appel(A, "POST", "/api/assistant/conversations", { espace: "general" });
const idGeneral = (cg.corps.conversation as { id: string }).id;
ok("conversation créée", cg.statut === 201 && /^[0-9a-f-]{36}$/.test(idGeneral));
const avant = anthropic.journal.length;
const q1 = await question(A, { conversationId: idGeneral, texte: "Qu'est-ce qu'un syllogisme ?" });
const types = q1.evenements.map((e) => e.t);
ok("réponse en flux : début, réflexion, texte, fin", q1.statut === 200 && types[0] === "debut" && types.includes("reflexion") && types.filter((x) => x === "texte").length > 3 && types.at(-1) === "fin");
ok("le texte arrive entier", q1.texte.startsWith("Tu demandes : « Qu'est-ce qu'un syllogisme ? »") && q1.texte.includes("console.log"));
const finQ1 = q1.evenements.at(-1) as { etat: string; cout: number; usage: { entree: number; sortie: number }; id: string };
ok("fin : état complet, jetons et coût estimé", finQ1.etat === "complet" && finQ1.usage.sortie > 0 && finQ1.cout > 0 && /^[0-9a-f-]{36}$/.test(finQ1.id));
const r1 = derniereRequete();
ok("une seule requête, partie avec LA clé de cet utilisateur", anthropic.journal.length === avant + 1 && r1.cle === CLES.a);
ok("requête conforme : modèle, flux, effort, longueur maximale, sans température", r1.corps.model === "claude-sonnet-5-5" && r1.corps.stream === true && (r1.corps.output_config as { effort: string }).effort === "medium" && r1.corps.max_tokens === 16000 && !("temperature" in r1.corps));
ok("consigne générale du site, question en dernier", r1.corps.system[0].text.includes("assistant de HaqqReason") && r1.corps.messages.at(-1)?.content[0].text === "Qu'est-ce qu'un syllogisme ?");
const enBase = await sql<{ role: string; etat: string; jetons_sortie: number; cout_usd: string }>(`select role, etat, jetons_sortie, cout_usd from assistant_messages where conversation_id = $1 order by cree_le`, [idGeneral]);
ok("en base : la question puis la réponse complète, avec ses jetons", enBase.length === 2 && enBase[0].role === "user" && enBase[1].etat === "complet" && enBase[1].jetons_sortie > 0 && Number(enBase[1].cout_usd) > 0);
ok("titre donné par la première question", (await sql<{ titre: string }>(`select titre from assistant_conversations where id = $1`, [idGeneral]))[0].titre === "Qu'est-ce qu'un syllogisme ?");
ok("consommation journalisée", Number((await sql<{ n: number }>(`select count(*)::int n from assistant_usage where utilisateur_id = $1 and statut = 'ok'`, [A.id]))[0].n) === 1);
const etat1 = await appel(A, "GET", "/api/assistant/etat");
ok("bilan du mois mis à jour", (etat1.corps.bilan as { moisAppels: number; moisCout: number }).moisAppels === 1 && (etat1.corps.bilan as { moisCout: number }).moisCout > 0);

await question(A, { conversationId: idGeneral, texte: "Et un enthymème ?", modele: "claude-haiku-5-5", effort: "low" });
const r2 = derniereRequete();
ok("l'historique suit, rôles alternés", r2.corps.messages.map((m) => m.role).join(",") === "user,assistant,user" && r2.corps.messages[0].content[0].text === "Qu'est-ce qu'un syllogisme ?");
ok("modèle et effort choisis pour cette question", r2.corps.model === "claude-haiku-5-5" && (r2.corps.output_config as { effort: string }).effort === "low" && r2.corps.max_tokens === 8192);

const regen = await question(A, { conversationId: idGeneral, reessayer: true });
const apres = await sql<{ role: string }>(`select role from assistant_messages where conversation_id = $1 order by cree_le`, [idGeneral]);
ok("régénérer : la dernière réponse est remplacée, la question n'est pas dupliquée", regen.statut === 200 && apres.map((m) => m.role).join(",") === "user,assistant,user,assistant");

/* ---------- Isolation entre comptes ---------- */
ok("un autre compte ne voit pas la conversation", (await appel(B, "GET", `/api/assistant/conversations/${idGeneral}`)).statut === 404);
ok("ni ne la renomme, ni ne la supprime", (await appel(B, "PATCH", `/api/assistant/conversations/${idGeneral}`, { titre: "piraté" })).statut === 404 && (await appel(B, "DELETE", `/api/assistant/conversations/${idGeneral}`)).statut === 404);
const avantB = anthropic.journal.length;
const intrus = await question(B, { conversationId: idGeneral, texte: "Utilise la clé d'Amine" });
ok("ni n'y écrit (et donc n'utilise pas la clé d'un autre)", intrus.statut === 404 && anthropic.journal.length === avantB);
ok("sa liste est vide", ((await appel(B, "GET", "/api/assistant/conversations?espace=general")).corps.conversations as unknown[]).length === 0);
const cb = await appel(B, "POST", "/api/assistant/conversations", { espace: "general" });
const sansCle = await question(B, { conversationId: (cb.corps.conversation as { id: string }).id, texte: "Bonjour" });
ok("sans clé reliée : rien n'est envoyé à Anthropic (le site n'a pas de clé à lui)", sansCle.statut === 409 && sansCle.erreur?.erreur === "sans_cle" && anthropic.journal.length === avantB);
ok("la question refusée n'est pas enregistrée", Number((await sql<{ n: number }>(`select count(*)::int n from assistant_messages where utilisateur_id = $1`, [B.id]))[0].n) === 0);

/* ---------- ChatPDF ---------- */
const cp = await appel(A, "POST", "/api/assistant/conversations", { espace: "pdf" });
const idPdf = (cp.corps.conversation as { id: string }).id;
const texte1 = "[Page 1]\nLa raison et la révélation.\n\n[Page 2]\nPremière thèse : la raison mène à la vérité.\n\n[Page 3]\nDeuxième partie.\n\n[Page 4]\nConclusion.";
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

const q3 = await question(A, { conversationId: idPdf, texte: "Quelle est la première thèse ?" });
const r3 = derniereRequete();
const debut3 = q3.evenements[0] as { contexte: { mode: string; documents: { numero: number; pages: string }[] } };
ok("petits PDF : lecture complète annoncée", debut3.contexte.mode === "complet" && debut3.contexte.documents.map((d) => `${d.numero}:${d.pages}`).join(" ") === "1:1-4 2:1");
ok("texte intégral dans la consigne, marqué pour le cache", r3.corps.system.length === 2 && r3.corps.system[1].text.includes('<document index="1" nom="traite.pdf" pages="4">') && r3.corps.system[1].text.includes("[Page 2]\nPremière thèse") && Boolean(r3.corps.system[1].cache_control));
ok("consigne ChatPDF : documents numérotés et références", r3.corps.system[0].text.includes("Doc 2 : « second.pdf » (1 page)") && r3.corps.system[0].text.includes("[Doc 2, p. 14]"));
ok("la réponse cite ses pages", q3.texte.includes("[Doc 1, p. 2]"));
const fin3 = q3.evenements.at(-1) as { usage: { ecritureCache: number; lectureCache: number } };
ok("première question : les documents sont écrits en cache", fin3.usage.ecritureCache > 0);
const q4 = await question(A, { conversationId: idPdf, texte: "Et la conclusion ?" });
const fin4 = q4.evenements.at(-1) as { usage: { ecritureCache: number; lectureCache: number } };
ok("question suivante : les documents sont relus depuis le cache", fin4.usage.lectureCache > 0);

const page2 = await appel(A, "GET", `/api/assistant/documents/${fiche1.id}?page=2`);
ok("vérifier une référence : la page 2 seule", page2.statut === 200 && page2.corps.texte === "Première thèse : la raison mène à la vérité.");
ok("la page d'un PDF d'un autre compte est introuvable", (await appel(B, "GET", `/api/assistant/documents/${fiche1.id}?page=2`)).statut === 404);
ok("ni décochable, ni supprimable par un autre compte", (await appel(B, "PATCH", `/api/assistant/documents/${fiche1.id}`, { actif: false })).statut === 404 && (await appel(B, "DELETE", `/api/assistant/documents/${fiche1.id}`)).statut === 404);

await appel(A, "PATCH", `/api/assistant/documents/${fiche2.id}`, { actif: false });
await question(A, { conversationId: idPdf, texte: "Résume." });
const r5 = derniereRequete();
ok("document décoché : Claude ne le lit plus", r5.corps.system[1].text.includes('index="1"') && !r5.corps.system[1].text.includes('index="2"') && !r5.corps.system[0].text.includes("second.pdf"));
await appel(A, "DELETE", `/api/assistant/documents/${fiche2.id}`);
const doc3 = await appel(A, "POST", "/api/assistant/documents", { conversationId: idPdf, nom: "troisieme.pdf", pages: 1, pagesVides: 0, empreinte: "5".repeat(64), texte: "[Page 1]\nTroisième." });
ok("un numéro retiré n'est pas redonné : les anciennes références restent justes", (doc3.corps.document as { numero: number }).numero === 3);

// Un très long document : lecture par extraits.
const pages = Array.from({ length: 220 }, (_, i) => `[Page ${i + 1}]\n${"Remarques générales sur la méthode historique. ".repeat(40)}${i === 150 ? "Le manuscrit de Birmingham date du VIIe siècle selon le radiocarbone." : ""}`);
const long = await appel(A, "POST", "/api/assistant/documents", { conversationId: idPdf, nom: "long.pdf", pages: 220, pagesVides: 0, empreinte: "6".repeat(64), texte: pages.join("\n\n") });
ok("long PDF importé", long.statut === 201);
const q6 = await question(A, { conversationId: idPdf, texte: "Que dit-on du manuscrit de Birmingham ?" });
const r6 = derniereRequete();
const debut6 = q6.evenements[0] as { contexte: { mode: string } };
const dernierMessage = r6.corps.messages.at(-1)!.content[0].text;
ok("documents longs : lecture par extraits, avec la question", debut6.contexte.mode === "extraits" && dernierMessage.startsWith("<extraits>") && dernierMessage.includes("<question>\nQue dit-on du manuscrit de Birmingham ?\n</question>"));
ok("le passage utile est dans les extraits, la consigne ne porte plus les documents", dernierMessage.includes("Birmingham date du VIIe siècle") && r6.corps.system.length === 1);
const histo6 = await sql<{ contenu: string }>(`select contenu from assistant_messages where conversation_id = $1 and role = 'user' order by cree_le desc limit 1`, [idPdf]);
ok("l'historique garde la question seule (sans les extraits)", histo6[0].contenu === "Que dit-on du manuscrit de Birmingham ?");
ok("pas de PDF coché : refus clair", await (async () => {
  const cv = await appel(A, "POST", "/api/assistant/conversations", { espace: "pdf" });
  const r = await question(A, { conversationId: (cv.corps.conversation as { id: string }).id, texte: "?" });
  return r.statut === 400 && r.erreur?.erreur === "sans_document";
})());

/* ---------- Erreurs d'Anthropic, repli, arrêt ---------- */
ok("clé de C reliée", (await appel(C, "PUT", "/api/assistant/cle", { cle: CLES.c })).statut === 200);
const cc = await appel(C, "POST", "/api/assistant/conversations", { espace: "general" });
const idC = (cc.corps.conversation as { id: string }).id;
const credit = await question(C, { conversationId: idC, texte: "Bonjour" });
ok("crédit épuisé : message en français, la question est gardée", credit.statut === 502 && credit.erreur?.erreur === "credit_epuise" && String(credit.erreur?.message).includes("Billing") && typeof credit.erreur?.questionId === "string");
const msgC = await sql<{ role: string; etat: string }>(`select role, etat from assistant_messages where conversation_id = $1 order by cree_le`, [idC]);
ok("en base : la question et l'erreur (affichée au rechargement)", msgC.map((m) => `${m.role}:${m.etat}`).join(",") === "user:complet,assistant:erreur");
ok("la tentative compte dans le rythme, sans coût", Number((await sql<{ n: number }>(`select count(*)::int n from assistant_usage where utilisateur_id = $1 and statut = 'erreur' and cout_usd = 0`, [C.id]))[0].n) === 1);

ok("clé de D reliée", (await appel(D, "PUT", "/api/assistant/cle", { cle: CLES.d })).statut === 200);
const cd = await appel(D, "POST", "/api/assistant/conversations", { espace: "general" });
const avantD = anthropic.journal.length;
const repli = await question(D, { conversationId: (cd.corps.conversation as { id: string }).id, texte: "Bonjour" });
ok("réglage d'effort refusé par le modèle : nouvel essai sans lui, réponse complète", repli.statut === 200 && anthropic.journal.length === avantD + 2 && !("output_config" in derniereRequete().corps) && (repli.evenements.at(-1) as { etat: string }).etat === "complet");

const plafond = await appel(A, "PATCH", "/api/assistant/cle", { plafond: 0.0001 });
ok("plafond mensuel réglé", plafond.statut === 200 && (plafond.corps.cle as { plafond: number }).plafond === 0);
await appel(A, "PATCH", "/api/assistant/cle", { plafond: "0,0001" });
const avantPlafond = anthropic.journal.length;
const bloque = await question(A, { conversationId: idGeneral, texte: "Encore une ?" });
ok("plafond atteint : refus avant tout envoi", bloque.statut === 402 && bloque.erreur?.erreur === "plafond" && anthropic.journal.length === avantPlafond);
await appel(A, "PATCH", "/api/assistant/cle", { plafond: null });

ok("clé de E reliée", (await appel(E, "PUT", "/api/assistant/cle", { cle: CLES.e })).statut === 200);
const ce = await appel(E, "POST", "/api/assistant/conversations", { espace: "general" });
const idE = (ce.corps.conversation as { id: string }).id;
const arret = new AbortController();
const flux = await fetch(`${BASE}/api/assistant/message`, {
  method: "POST",
  headers: { Origin: BASE, "Sec-Fetch-Site": "same-origin", "Content-Type": "application/json", Cookie: E.cookie },
  body: JSON.stringify({ conversationId: idE, texte: "Raconte longuement" }),
  signal: arret.signal,
});
const lecteur = flux.body!.getReader();
let recu = "";
while (!recu.includes('"t":"texte"')) recu += new TextDecoder().decode((await lecteur.read()).value);
arret.abort();
await new Promise((r) => setTimeout(r, 2500));
const coupe = await sql<{ etat: string; contenu: string; jetons_sortie: number }>(`select etat, contenu, jetons_sortie from assistant_messages where conversation_id = $1 and role = 'assistant'`, [idE]);
ok("arrêt en cours de route : la réponse partielle est gardée, marquée « interrompue »", coupe.length === 1 && coupe[0].etat === "interrompu" && coupe[0].contenu.startsWith("Tu demandes") && coupe[0].jetons_sortie > 0);
ok("…et sa consommation est journalisée", Number((await sql<{ n: number }>(`select count(*)::int n from assistant_usage where utilisateur_id = $1 and statut = 'interrompu'`, [E.id]))[0].n) === 1);

/* ---------- Retirer la clé ---------- */
ok("retirer sa clé", (await appel(D, "DELETE", "/api/assistant/cle")).statut === 200 && (await appel(D, "GET", "/api/assistant/etat")).corps.cle === null);
ok("supprimer une conversation efface ses PDF", (await appel(A, "DELETE", `/api/assistant/conversations/${idPdf}`)).statut === 200 && Number((await sql<{ n: number }>(`select count(*)::int n from assistant_documents where conversation_id = $1`, [idPdf]))[0].n) === 0);

/* ---------- La page ---------- */
const page = await fetch(`${BASE}/assistant`, { headers: { Cookie: A.cookie }, redirect: "manual" });
const html = await page.text();
ok("la page s'ouvre avec un compte", page.status === 200 && html.includes("Le Vizir"));
const sansCompte = await fetch(`${BASE}/assistant`, { redirect: "manual" });
ok("sans compte : renvoi vers la connexion, puis retour à l'assistant", [303, 307, 308].includes(sansCompte.status) && (sansCompte.headers.get("location") ?? "").includes("/connexion?retour=%2Fassistant"));

/* ---------- Aucune clé dans les journaux ---------- */
const journaux = journalServeur.join("");
ok("aucune clé API n'apparaît dans les journaux du serveur", !Object.values(CLES).some((c) => journaux.includes(c.slice(13))));

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
await fin(echecs ? 1 : 0);
