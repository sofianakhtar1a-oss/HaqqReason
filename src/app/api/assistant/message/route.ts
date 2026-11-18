import { after, type NextRequest } from "next/server";
import { consigneGenerale, consignePdf, questionAvecExtraits } from "@/lib/assistant/consignes";
import { construireContexte, historiquePourApi } from "@/lib/assistant/contexte";
import {
  ajouterMessage,
  bilan,
  documentsActifs,
  journaliserUsage,
  lireConversation,
  lireMessages,
  lireReglages,
  modifierConversation,
  supprimerMessages,
  toucherConversation,
  type Message,
} from "@/lib/assistant/donnees";
import { entree, erreurDonnees, lireCorps, refus, texteLibre } from "@/lib/assistant/http";
import { LIMITES } from "@/lib/assistant/limites";
import { estimerJetons, fournisseurValide, infoFournisseur, MAX_JETONS_REPONSE, USAGE_VIDE, type Usage } from "@/lib/assistant/modeles";
import { coutReponse, demarrer, type Demande, type ErreurIA } from "@/lib/assistant/passerelle";
import type { EtatMessage, EvenementFlux, InfoContexte } from "@/lib/assistant/protocole";

/*
 * POST { conversationId, texte, ia? } — ou { conversationId, reessayer: true } pour reprendre la
 * dernière question — : la réponse de l'IA choisie, relayée au fil de l'eau (NDJSON).
 *
 *   • le compte vient de la session Google vérifiée en base ; la conversation, l'historique et les PDF
 *     sont tous lus AVEC l'identifiant de ce compte : impossible d'utiliser ceux d'un autre ;
 *   • l'appel passe par la passerelle IA de Vercel, sans aucune clé (passerelle.ts) : il est pris
 *     sur le crédit gratuit du site, et chaque compte a son quota (questions par jour, part du
 *     crédit par mois), vérifié ici avant d'envoyer quoi que ce soit ;
 *   • chaque réponse est journalisée (jetons, coût estimé) : c'est ce qui compte le quota.
 */

export const maxDuration = 300;

/** Au-delà, la réponse est arrêtée proprement (et gardée) avant la limite de la fonction. */
const DUREE_MAX_MS = 270_000;

type Corps = { conversationId?: unknown; texte?: unknown; ia?: unknown; reessayer?: unknown };

export async function POST(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const u = e.compte.id;
  const corps = await lireCorps<Corps>(requete, 200_000);
  if (!corps) return refus(400, "illisible");
  const conversationId = typeof corps.conversationId === "string" ? corps.conversationId : "";
  const reessayer = corps.reessayer === true;
  const saisie = reessayer ? null : texteLibre(corps.texte, LIMITES.questionMax);
  if (!reessayer && !saisie) return refus(400, "question", `La question est vide, ou trop longue (${LIMITES.questionMax.toLocaleString("fr-FR")} caractères au plus).`);

  /* ---------- 1. Le compte : son IA, son quota, sa conversation ---------- */
  let reglages: Awaited<ReturnType<typeof lireReglages>>;
  let b: Awaited<ReturnType<typeof bilan>>;
  let conversation: Awaited<ReturnType<typeof lireConversation>>;
  try {
    [reglages, b, conversation] = await Promise.all([lireReglages(u), bilan(u), lireConversation(u, conversationId)]);
  } catch (err) {
    return erreurDonnees(err);
  }
  if (!conversation) return refus(404, "absent", "Cette conversation n'existe plus.");
  const fournisseur = fournisseurValide(corps.ia) ?? reglages.ia;
  const ia = infoFournisseur(fournisseur);
  if (b.dixMinutes >= LIMITES.appelsDixMinutes) return refus(429, "rythme", "Beaucoup de questions en peu de temps : attends quelques minutes avant la suivante.");
  if (b.aujourdhui >= LIMITES.questionsJour) {
    return refus(429, "quota_jour", `Tu as utilisé tes ${LIMITES.questionsJour} questions gratuites d'aujourd'hui. Elles reviennent à minuit.`);
  }
  if (b.moisCout >= LIMITES.budgetMoisCompte) {
    return refus(429, "quota_mois", "Tu as utilisé ta part du crédit gratuit de ce mois-ci. Elle revient le 1er du mois prochain.");
  }
  const conv = conversation;

  /* ---------- 2. L'historique, les PDF, la question ---------- */
  let historique: Message[];
  let documents: Awaited<ReturnType<typeof documentsActifs>> = [];
  try {
    [historique, documents] = await Promise.all([lireMessages(u, conv.id, LIMITES.messagesHistorique), conv.espace === "pdf" ? documentsActifs(u, conv.id) : Promise.resolve([])]);
  } catch (err) {
    return erreurDonnees(err);
  }
  if (conv.espace === "pdf" && documents.length === 0) return refus(400, "sans_document", "Importe ou coche au moins un PDF : c'est lui que l'IA va lire.");

  let question: string;
  let questionId: string;
  try {
    if (reessayer) {
      // Reprendre : on efface la réponse qui suit la dernière question (erreur, coupure, ou réponse à refaire).
      const derniere = historique.findLastIndex((m) => m.role === "user");
      if (derniere === -1) return refus(400, "rien", "Il n'y a pas de question à reprendre.");
      await supprimerMessages(u, conv.id, historique.slice(derniere + 1).map((m) => m.id));
      question = historique[derniere].contenu;
      questionId = historique[derniere].id;
      historique = historique.slice(0, derniere);
    } else {
      question = saisie as string;
      const m = await ajouterMessage(u, conv.id, { role: "user", contenu: question });
      questionId = m.id;
      if (!conv.titre.trim()) await modifierConversation(u, conv.id, { titre: titreDe(question) });
    }
  } catch (err) {
    return erreurDonnees(err);
  }

  /* ---------- 3. Ce que l'IA reçoit ---------- */
  let consigne: string;
  let documentsComplets: string | undefined;
  let contenuQuestion = question;
  let infoContexte: InfoContexte | null = null;
  const questionPrecedente = historique.findLast((m) => m.role === "user")?.contenu;
  if (conv.espace === "pdf") {
    const ctx = construireContexte(documents, question, { integrale: conv.lecture === "integrale", questionPrecedente });
    consigne = consignePdf({ fournisseur, mode: ctx.mode, documents: documents.map((d) => ({ numero: d.numero, nom: d.nom, pages: d.pages })) });
    // Lecture complète : les documents entiers, juste après la consigne (début stable, gardé en cache par l'IA).
    // Extraits : ils voyagent avec la question.
    if (ctx.mode === "complet") documentsComplets = ctx.texte;
    else contenuQuestion = questionAvecExtraits(ctx.texte, question);
    infoContexte = { mode: ctx.mode, jetons: ctx.jetons, documents: ctx.documents.map(({ numero, nom, pages }) => ({ numero, nom, pages })), integraleImpossible: ctx.integraleImpossible };
  } else {
    consigne = consigneGenerale(undefined, fournisseur);
  }

  const echanges = historiquePourApi(
    [...historique.filter((m) => m.etat !== "erreur").map((m) => ({ role: m.role, contenu: m.contenu })), { role: "user" as const, contenu: question }],
    LIMITES.jetonsHistorique,
  );
  const demande: Demande = {
    consigne,
    documents: documentsComplets,
    messages: echanges.map((m, i) => ({ role: m.role, texte: i === echanges.length - 1 ? contenuQuestion : m.contenu })),
    maxJetons: MAX_JETONS_REPONSE,
  };

  /* ---------- 4. L'appel, par la passerelle ---------- */
  const controleur = new AbortController();
  let dureeDepassee = false;
  const minuteur = setTimeout(() => {
    dureeDepassee = true;
    controleur.abort();
  }, DUREE_MAX_MS);
  const quitter = () => controleur.abort();
  requete.signal.addEventListener("abort", quitter);
  const nettoyer = () => {
    clearTimeout(minuteur);
    requete.signal.removeEventListener("abort", quitter);
  };

  const ouverture = await demarrer(fournisseur, demande, controleur.signal);
  if (!ouverture.ok) {
    nettoyer();
    const erreur = ouverture.erreur;
    try {
      // Rien n'a été produit : la question reste, avec l'erreur en guise de réponse ; le quota n'est pas touché.
      await Promise.all([ajouterMessage(u, conv.id, { role: "assistant", contenu: erreur.message, modele: ouverture.modele ?? "", etat: "erreur" }), toucherConversation(u, conv.id)]);
    } catch {
      // La question reste enregistrée ; l'erreur s'affiche quand même.
    }
    return refus(erreur.code === "limite_debit" ? 429 : 502, erreur.code, erreur.message, { questionId, fournisseur, reessayerDans: erreur.reessayerDans });
  }
  const modele = ouverture.modele;

  /* ---------- 5. Le relais, au fil de l'eau ---------- */
  let finir: () => void = () => {};
  const termine = new Promise<void>((r) => {
    finir = r;
  });
  // Même si le navigateur se ferme en cours de route, la réponse partielle et la consommation sont enregistrées.
  after(() => termine);

  const encodeur = new TextEncoder();
  const flux = new ReadableStream<Uint8Array>({
    async start(sortie) {
      const envoyer = (ev: EvenementFlux) => {
        try {
          sortie.enqueue(encodeur.encode(`${JSON.stringify(ev)}\n`));
        } catch {
          // Le navigateur est parti : on continue d'écouter pour tout enregistrer.
        }
      };
      let texte = "";
      let usage: Usage = { ...USAGE_VIDE };
      let coutDonne: number | null = null;
      let raison = "";
      let erreur: ErreurIA | null = null;
      let reflexion = false;

      envoyer({ t: "debut", questionId, modele, contexte: infoContexte });
      try {
        for await (const ev of ouverture.evenements) {
          if (ev.type === "texte") {
            texte += ev.texte;
            envoyer({ t: "texte", v: ev.texte });
          } else if (ev.type === "reflexion") {
            if (!reflexion) envoyer({ t: "reflexion" });
            reflexion = true;
          } else if (ev.type === "usage") {
            usage = ev.usage;
            coutDonne = ev.cout;
          } else if (ev.type === "arret") raison = ev.raison;
          else if (ev.type === "erreur") erreur = ev.erreur;
        }
      } catch {
        if (!controleur.signal.aborted) erreur ??= { code: "reseau", statut: 0, message: `La connexion avec ${ia.nom} a été coupée pendant la réponse.` };
      }
      nettoyer();

      const coupe = controleur.signal.aborted;
      if (dureeDepassee) raison = "duree";
      // Réponse arrêtée en route : ce qui a été produit compte quand même, on l'estime sur le texte reçu.
      if (coupe && texte && usage.sortie < estimerJetons(texte)) usage = { ...usage, sortie: estimerJetons(texte) };
      const etat: EtatMessage = erreur && !texte ? "erreur" : coupe || erreur ? "interrompu" : "complet";
      const cout = coutReponse(modele, usage, coupe ? null : coutDonne);
      const consomme = usage.entree + usage.sortie + usage.lectureCache + usage.ecritureCache > 0;
      let id: string | null = null;
      try {
        const m = await ajouterMessage(u, conv.id, { role: "assistant", contenu: etat === "erreur" ? (erreur?.message ?? "Erreur.") : texte || "(réponse vide)", modele, etat, usage, cout });
        id = m.id;
        await Promise.all([
          // Une erreur sans rien produit ne compte pas dans le quota.
          etat !== "erreur" || consomme ? journaliserUsage(u, conv.id, modele, usage, cout, etat === "complet" ? "ok" : etat) : Promise.resolve(),
          toucherConversation(u, conv.id),
        ]);
      } catch {
        // Base momentanément indisponible : la réponse a quand même été affichée.
      }
      if (erreur) envoyer({ t: "erreur", code: erreur.code, message: erreur.message });
      envoyer({ t: "fin", id, etat, raison, usage, cout });
      try {
        sortie.close();
      } catch {
        // Déjà fermé par le départ du navigateur.
      }
      finir();
    },
    cancel() {
      controleur.abort();
    },
  });

  return new Response(flux, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "private, no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

/** Le titre d'une nouvelle conversation : le début de la première question. */
function titreDe(question: string): string {
  const ligne = question.replace(/\s+/g, " ").trim();
  if (ligne.length <= 70) return ligne;
  const coupe = ligne.slice(0, 70);
  const espace = coupe.lastIndexOf(" ");
  return `${coupe.slice(0, espace > 40 ? espace : 70)}…`;
}
