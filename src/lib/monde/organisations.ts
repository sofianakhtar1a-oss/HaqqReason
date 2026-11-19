// Fichier produit par scripts/monde/construire.mjs : ne pas modifier à la main (source : scripts/monde/curation-plus.mjs).
import type { OrganisationId } from "./types";

/** Les organisations dont les pays sont membres (la liste des membres est sur chaque pays : Pays.orgs). */
export const ORGANISATIONS: Readonly<Record<OrganisationId, { nom: string; court: string; texte: string }>> = {
  "ue": {
    "nom": "Union européenne",
    "court": "UE",
    "texte": "27 États européens qui partagent un marché unique, des institutions communes et, pour 21 d'entre eux, l'euro."
  },
  "ua": {
    "nom": "Union africaine",
    "court": "UA",
    "texte": "Les 54 États africains membres de l'ONU, et la République arabe sahraouie démocratique."
  },
  "la": {
    "nom": "Ligue arabe",
    "court": "Ligue arabe",
    "texte": "22 États arabes d'Afrique et d'Asie, réunis depuis 1945 ; son siège est au Caire."
  },
  "oci": {
    "nom": "Organisation de la coopération islamique",
    "court": "OCI",
    "texte": "57 États de quatre continents ; la deuxième organisation intergouvernementale du monde après l'ONU. Son siège est à Djeddah."
  },
  "oif": {
    "nom": "Organisation internationale de la Francophonie",
    "court": "Francophonie",
    "texte": "Les États qui ont le français en partage, membres de plein droit de l'OIF (sans les membres associés ni les observateurs)."
  },
  "asean": {
    "nom": "Association des nations de l'Asie du Sud-Est",
    "court": "ASEAN",
    "texte": "11 États d'Asie du Sud-Est ; le Timor oriental est le dernier arrivé, en 2025."
  },
  "mercosur": {
    "nom": "Marché commun du Sud",
    "court": "Mercosur",
    "texte": "L'union douanière d'Amérique du Sud ; la Bolivie y est entrée en 2024, le Venezuela est suspendu depuis 2016."
  },
  "g20": {
    "nom": "Groupe des vingt",
    "court": "G20",
    "texte": "19 pays, l'Union européenne et l'Union africaine : les plus grandes économies du monde."
  },
  "commonwealth": {
    "nom": "Commonwealth des nations",
    "court": "Commonwealth",
    "texte": "56 États, presque tous anciens territoires de l'Empire britannique ; le Gabon et le Togo l'ont rejoint en 2022."
  },
  "otan": {
    "nom": "Organisation du traité de l'Atlantique nord",
    "court": "OTAN",
    "texte": "L'alliance militaire de 32 États d'Europe et d'Amérique du Nord ; la Suède est le dernier membre, en 2024."
  }
};
