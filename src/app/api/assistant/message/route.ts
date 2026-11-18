import { after, type NextRequest } from "next/server";
import { demarrer, type Demande, type ErreurIA } from "@/lib/assistant/ia";
import { consigneGenerale, consignePdf, questionAvecExtraits } from "@/lib/assistant/consignes";
import { construireContexte, historiquePourApi } from "@/lib/assistant/contexte";
import {
  ajouterMessage,
  bilan,
  documentsActifs,
  journaliserUsage,
  lireCle,
  lireConversation,
  lireMessages,
  lireReglages,
  marquerCleInvalide,
  modifierConversation,
  supprimerMessages,
  toucherConversation,
  type Message,
} from "@/lib/assistant/donnees";
import { entree, erreurDonnees, lireCorps, refus, texteLibre } from "@/lib/assistant/http";
import { LIMITES } from "@/lib/assistant/limites";
import { coutEstime, EFFORTS, effortValide, estimerJetons, formaterCout, infoFournisseur, modele as ficheModele, modeleValide, USAGE_VIDE, type Usage } from "@/lib/assistant/modeles";
import type { EtatMessage, EvenementFlux, InfoContexte } from "@/lib/assistant/protocole";

/*
 * POST { conversationId, texte, modele?, effort? } — ou { conversationId, reessayer: true } pour
 * reprendre la dernière question — : la réponse de Claude, relayée au fil de l'eau (NDJSON).
 *
 * Isolation et facturation :
 *   • le compte vient de la session Google vérifiée en base ; la conversation, l'historique, les PDF
 *     et la clé sont tous lus AVEC l'identifiant de ce compte : impossible d'utiliser ceux d'un autre ;
 *   • l'appel part vers l'IA du modèle choisi (Claude, ChatGPT ou Gemini) avec LA CLÉ DE CE COMPTE pour
 *     cette IA, déchiffrée en mémoire le temps de l'appel : les jetons sont facturés sur son compte,
 *     dans ses propres limites. Le site n'a de clé chez aucune IA : sans clé reliée, rien n'est envoyé ;
 *   • chaque appel est journalisé (jetons, coût estimé) pour que l'utilisateur suive sa dépense,
 *     avec un plafond mensuel facultatif qu'il fixe lui-même.
 */

export const maxDuration = 300;

/** Au-delà, la réponse est arrêtée proprement (et gardée) avant la limite de la fonction. */
const DUREE_MAX_MS = 270_000;
/** Sous ce poids, l'historique n'est pas mis en cache (l'écriture en cache coûte 25 % de plus). */
const HISTORIQUE_A_CACHER = 1_500;

type Corps = { conversationId?: unknown; texte?: unknown; modele?: unknown; effort?: unknown; reessayer?: unknown };

export async function POST(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const u = e.compte.id;
  const corps = await lireCorps<Corps>(requete, 600_000);
  if (!corps) return refus(400, "illisible");
  const conversationId = typeof corps.conversationId === "string" ? corps.conversationId : "";
  const reessayer = corps.reessayer === true;
  const saisie = reessayer ? null : texteLibre(corps.texte, LIMITES.questionMax);
  if (!reessayer && !saisie) return refus(400, "question", "La question est vide, ou trop longue (100 000 caractères au plus).");

  /* ---------- 1. Le compte : ses réglages, son rythme, sa conversation, la clé de l'IA choisie ---------- */
  let reglages: Awaited<ReturnType<typeof lireReglages>>;
  let b: Awaited<ReturnType<typeof bilan>>;
  let conversation: Awaited<ReturnType<typeof lireConversation>>;
  try {
    [reglages, b, conversation] = await Promise.all([lireReglages(u), bilan(u), lireConversation(u, conversationId)]);
  } catch (err) {
    return erreurDonnees(err);
  }
  if (!conversation) return refus(404, "absent", "Cette conversation n'existe plus.");
  const modele = modeleValide(corps.modele) ?? reglages.modele;
  const effort = effortValide(corps.effort) ?? reglages.effort;
  const fournisseur = ficheModele(modele).fournisseur;
  const ia = infoFournisseur(fournisseur);
  let cle: Awaited<ReturnType<typeof lireCle>>;
  try {
    cle = await lireCle(u, fournisseur);
  } catch (err) {
    return erreurDonnees(err);
  }
  const surIa = { fournisseur };
  if (!cle) return refus(409, "sans_cle", `Relie d'abord ta clé ${ia.nom} (${ia.entreprise}) : chaque réponse est facturée sur ton propre compte.`, surIa);
  if (!cle.cle) return refus(409, "cle_illisible", `Ta clé ${ia.nom} enregistrée ne peut plus être lue (le secret du site a changé). Colle-la de nouveau dans les réglages.`, surIa);
  if (cle.fiche.statut === "invalide") return refus(409, "cle_invalide", `${ia.entreprise} a refusé ta clé ${ia.nom} (révoquée ou supprimée). Colle une nouvelle clé dans les réglages.`, surIa);
  if (b.dixMinutes >= LIMITES.appelsDixMinutes) return refus(429, "rythme", "Beaucoup de questions en peu de temps : attends quelques minutes avant la suivante.");
  if (b.aujourdhui >= LIMITES.appelsJour) return refus(429, "jour", `Tu as atteint la limite de ${LIMITES.appelsJour} questions par jour sur ce site. Elle se remet à zéro à minuit.`);
  if (reglages.plafond !== null && b.moisCout >= reglages.plafond) {
    return refus(402, "plafond", `Tu as atteint le plafond mensuel que tu t'es fixé (${formaterCout(reglages.plafond)}, estimation du site). Relève-le dans les réglages pour continuer.`);
  }
  const conv = conversation;
  const cleApi = cle.cle;

  /* ---------- 2. L'historique, les PDF, la question ---------- */
  let historique: Message[];
  let documents: Awaited<ReturnType<typeof documentsActifs>> = [];
  try {
    [historique, documents] = await Promise.all([lireMessages(u, conv.id, LIMITES.messagesHistorique), conv.espace === "pdf" ? documentsActifs(u, conv.id) : Promise.resolve([])]);
  } catch (err) {
    return erreurDonnees(err);
  }
  if (conv.espace === "pdf" && documents.length === 0) return refus(400, "sans_document", "Importe ou coche au moins un PDF : c'est lui que Claude va lire.");

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
    // Lecture complète : les documents entiers, juste après la consigne, relus depuis le cache à la question suivante.
    // Extraits : ils voyagent avec la question ; la consigne et l'historique restent en cache.
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
  const poidsHistorique = echanges.slice(0, -1).reduce((s, m) => s + estimerJetons(m.contenu), 0);
  const demande: Demande = {
    modele,
    consigne,
    documents: documentsComplets,
    // Point de cache sur le dernier échange passé : la question suivante relira tout ce début depuis le cache.
    messages: echanges.map((m, i) => ({ role: m.role, texte: i === echanges.length - 1 ? contenuQuestion : m.contenu, cache: i === echanges.length - 2 && poidsHistorique >= HISTORIQUE_A_CACHER })),
    maxJetons: EFFORTS.find((x) => x.id === effort)?.maxJetons ?? 16_000,
    effort,
  };

  /* ---------- 4. L'appel, avec la clé de l'utilisateur pour cette IA ---------- */
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

  const ouverture = await demarrer(fournisseur, cleApi, demande, controleur.signal);
  if (!ouverture.ok) {
    nettoyer();
    const erreur = ouverture.erreur;
    try {
      await Promise.all([
        ajouterMessage(u, conv.id, { role: "assistant", contenu: erreur.message, modele, etat: "erreur" }),
        journaliserUsage(u, conv.id, modele, USAGE_VIDE, 0, "erreur"),
        erreur.code === "cle_invalide" ? marquerCleInvalide(u, fournisseur) : Promise.resolve(),
        toucherConversation(u, conv.id),
      ]);
    } catch {
      // La question reste enregistrée ; l'erreur s'affiche quand même.
    }
    return refus(erreur.code === "limite_debit" ? 429 : 502, erreur.code, erreur.message, { questionId, fournisseur, reessayerDans: erreur.reessayerDans });
  }

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
      let raison = "";
      let erreur: ErreurIA | null = null;
      let reflexion = false;

      envoyer({ t: "debut", questionId, modele, effort, contexte: infoContexte });
      try {
        for await (const ev of ouverture.evenements) {
          if (ev.type === "texte") {
            texte += ev.texte;
            envoyer({ t: "texte", v: ev.texte });
          } else if (ev.type === "reflexion") {
            if (!reflexion) envoyer({ t: "reflexion" });
            reflexion = true;
          } else if (ev.type === "usage") usage = ev.usage;
          else if (ev.type === "arret") raison = ev.raison;
          else if (ev.type === "erreur") erreur = ev.erreur;
        }
      } catch {
        if (!controleur.signal.aborted) erreur ??= { code: "reseau", statut: 0, message: `La connexion avec ${ia.entreprise} a été coupée pendant la réponse.` };
      }
      nettoyer();

      const coupe = controleur.signal.aborted;
      if (dureeDepassee) raison = "duree";
      // Réponse arrêtée en route : Anthropic facture ce qui a été produit, on l'estime sur le texte reçu.
      if (coupe && texte && usage.sortie < estimerJetons(texte)) usage = { ...usage, sortie: estimerJetons(texte) };
      const etat: EtatMessage = erreur && !texte ? "erreur" : coupe || erreur ? "interrompu" : "complet";
      const cout = coutEstime(modele, usage);
      let id: string | null = null;
      try {
        const m = await ajouterMessage(u, conv.id, { role: "assistant", contenu: etat === "erreur" ? (erreur?.message ?? "Erreur.") : texte || "(réponse vide)", modele, etat, usage, cout });
        id = m.id;
        await Promise.all([
          journaliserUsage(u, conv.id, modele, usage, cout, etat === "complet" ? "ok" : etat),
          toucherConversation(u, conv.id),
          erreur?.code === "cle_invalide" ? marquerCleInvalide(u, fournisseur) : Promise.resolve(),
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
