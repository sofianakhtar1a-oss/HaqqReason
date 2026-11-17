import { suffixeCompte, tiroir } from "./compte";

const BASES = ["haqqreason-calame", "haqqreason-langues", "haqqreason-transcriptions", "haqqreason-synchro"];
const CLES = [
  "haqqreason-regles-anglais",
  "hr-favoris",
  "hr-historique",
  "hr-collections",
  "hr-recherches-sauvegardees",
  "hr-recherches-recentes",
  "haqqreason-contributions-suivies",
  "haqqreason-synchro-etat",
  "haqqreason-reprises-en-attente",
  "calame-dernier-document",
];

/**
 * Retire de CET appareil les données personnelles du compte connecté (sur un ordinateur partagé, par exemple).
 * Rien n'est touché sur le compte : tout revient à la prochaine connexion.
 */
export async function effacerAppareil(): Promise<void> {
  await Promise.all(
    BASES.map(
      (nom) =>
        new Promise<void>((resolve) => {
          try {
            const demande = indexedDB.deleteDatabase(tiroir(nom));
            // « blocked » : la base est encore ouverte par cette page ; elle sera effacée dès que la page se ferme.
            demande.onsuccess = demande.onerror = demande.onblocked = () => resolve();
          } catch {
            resolve();
          }
        }),
    ),
  );
  try {
    for (const cle of CLES) localStorage.removeItem(tiroir(cle));
    if (suffixeCompte() === "") localStorage.removeItem("haqqreason-proprietaire");
  } catch {
    /* stockage indisponible : rien à effacer */
  }
  try {
    await caches.delete("hr-favoris");
  } catch {
    /* pas de cache hors ligne */
  }
}
