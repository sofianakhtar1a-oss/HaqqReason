/*
 * Force d'un mot de passe, estimée en temps réel.
 *
 * On estime le nombre d'essais qu'il faudrait à un attaquant qui connaît les habitudes humaines :
 * mots de passe courants, suites (« 1234 », « azerty »), répétitions, années, mot + chiffres.
 * Le temps affiché suppose une attaque hors ligne rapide (10 milliards d'essais par seconde) :
 * c'est le cas réaliste pour un fichier chiffré volé, que l'attaquant peut essayer sans limite.
 *
 * Pur : testé dans tests/test-logique.mts.
 */

export type Force = {
  /** 0 (catastrophique) à 4 (excellent). */
  niveau: 0 | 1 | 2 | 3 | 4;
  libelle: string;
  /** log2 du nombre d'essais estimé. */
  bits: number;
  duree: string;
  conseils: string[];
};

const COURANTS = new Set(
  (
    "123456 1234567 12345678 123456789 1234567890 password motdepasse azerty azertyuiop qwerty qwertyuiop soleil bonjour " +
    "loulou doudou chouchou marseille paris france iloveyou jetaime nicolas julien camille 000000 111111 123123 654321 " +
    "abc123 admin welcome dragon football princesse coucou bisous allah bismillah inshallah mashallah islam muslim " +
    "musulman coran quran mecque makkah medine mohamed muhammad mohammed ahmed karim sofiane sofian rachid amine " +
    "fatima yasmine sarah azerty123 password1 motdepasse1 secret test letmein monkey sunshine master shadow " +
    "liverpool chelsea arsenal barcelona realmadrid psg om ol 147258369 159753 azertyu wxcvbn"
  ).split(" "),
);

const RANGEES = ["azertyuiop", "qsdfghjklm", "wxcvbn", "qwertyuiop", "asdfghjkl", "zxcvbnm", "abcdefghijklmnopqrstuvwxyz", "0123456789", "1234567890"];

function tailleAlphabet(mdp: string): number {
  let n = 0;
  if (/[a-z]/.test(mdp)) n += 26;
  if (/[A-Z]/.test(mdp)) n += 26;
  if (/[0-9]/.test(mdp)) n += 10;
  if (/[^a-zA-Z0-9]/.test(mdp)) n += 33;
  if (/[^\x00-\x7f]/.test(mdp)) n += 40;
  return Math.max(n, 1);
}

/** Retire les motifs prévisibles et renvoie ce qu'il reste de vraiment aléatoire, avec un coût en bits pour chaque motif. */
function analyser(mdp: string): { bits: number; motifs: string[] } {
  const bas = mdp.toLowerCase();
  const motifs: string[] = [];
  const sansAccents = bas.normalize("NFD").replace(/[̀-ͯ]/g, "");

  if (COURANTS.has(sansAccents) || COURANTS.has(sansAccents.replace(/[0-9!?.@#_-]+$/, ""))) {
    motifs.push("courant");
    // Un mot de passe de la liste, éventuellement suivi de quelques chiffres : trouvé en quelques secondes.
    const suffixe = sansAccents.replace(/^[^0-9!?.@#_-]*/, "");
    return { bits: 10 + suffixe.length * 3.3, motifs };
  }

  let reste = mdp;
  let bits = 0;

  // Suites du clavier ou de l'alphabet (à l'endroit ou à l'envers), d'au moins 4 caractères.
  for (const rangee of RANGEES) {
    for (const r of [rangee, [...rangee].reverse().join("")]) {
      for (let longueur = r.length; longueur >= 4; longueur--) {
        for (let i = 0; i + longueur <= r.length; i++) {
          const morceau = r.slice(i, i + longueur);
          const pos = reste.toLowerCase().indexOf(morceau);
          if (pos >= 0) {
            reste = reste.slice(0, pos) + reste.slice(pos + longueur);
            bits += 6;
            motifs.push("suite");
          }
        }
      }
    }
  }

  // Un même caractère répété (« aaaa », « 1111 »).
  reste = reste.replace(/(.)\1{2,}/g, (m) => {
    bits += 4 + Math.log2(m.length);
    motifs.push("repetition");
    return "";
  });

  // Années (1900–2039).
  reste = reste.replace(/(19|20)\d{2}/g, () => {
    bits += 7;
    motifs.push("annee");
    return "";
  });

  // Un mot (lettres seules) suivi de chiffres : le schéma le plus courant.
  if (/^[a-zA-ZÀ-ÿ]{3,}[0-9]{1,4}[!?.]?$/.test(reste)) {
    const lettres = reste.match(/[a-zA-ZÀ-ÿ]+/)?.[0] ?? "";
    const chiffres = reste.length - lettres.length;
    motifs.push("mot-chiffres");
    // Mot de dictionnaire (~ 2^17) avec une majuscule éventuelle, puis les chiffres.
    bits += 17 + (/[A-Z]/.test(lettres) ? 1 : 0) + chiffres * 3.3;
    return { bits, motifs };
  }

  // Lettres seules : probablement un mot ou deux mots accolés.
  if (/^[a-zA-ZÀ-ÿ]+$/.test(reste) && reste.length >= 3) {
    motifs.push("mots");
    bits += Math.min(reste.length * 2.2, 17 * Math.ceil(reste.length / 7));
    return { bits, motifs };
  }

  bits += reste.length * Math.log2(tailleAlphabet(mdp));
  return { bits, motifs };
}

function duree(bits: number): string {
  // Moyenne : la moitié de l'espace à parcourir, à 1e10 essais par seconde.
  const secondes = Math.pow(2, bits - 1) / 1e10;
  if (secondes < 1) return "instantanément";
  const paliers: [number, string, string][] = [
    [60, "seconde", "secondes"],
    [3600, "minute", "minutes"],
    [86400, "heure", "heures"],
    [86400 * 30, "jour", "jours"],
    [86400 * 365, "mois", "mois"],
    [86400 * 365 * 100, "an", "ans"],
  ];
  const unites = [1, 60, 3600, 86400, 86400 * 30, 86400 * 365];
  for (let i = 0; i < paliers.length; i++) {
    if (secondes < paliers[i][0]) {
      const n = Math.max(1, Math.round(secondes / unites[i]));
      return `${n} ${n > 1 ? paliers[i][2] : paliers[i][1]}`;
    }
  }
  const siecles = secondes / (86400 * 365 * 100);
  if (siecles < 1000) return `${Math.round(siecles)} siècle${Math.round(siecles) > 1 ? "s" : ""}`;
  return "plus que l'âge de l'univers";
}

export function evaluer(mdp: string): Force {
  if (!mdp) return { niveau: 0, libelle: "Aucun", bits: 0, duree: "instantanément", conseils: [] };
  const { bits: brut, motifs } = analyser(mdp);
  const bits = Math.round(brut * 10) / 10;
  const niveau: Force["niveau"] = bits < 28 ? 0 : bits < 40 ? 1 : bits < 55 ? 2 : bits < 75 ? 3 : 4;
  const libelle = ["Très faible", "Faible", "Moyen", "Solide", "Excellent"][niveau];

  const conseils: string[] = [];
  if (motifs.includes("courant")) conseils.push("C'est l'un des mots de passe les plus utilisés : il est essayé en premier.");
  if (motifs.includes("suite")) conseils.push("Évite les suites du clavier ou de l'alphabet.");
  if (motifs.includes("repetition")) conseils.push("Évite de répéter le même caractère.");
  if (motifs.includes("annee")) conseils.push("Une année (de naissance, par exemple) se devine vite.");
  if (motifs.includes("mot-chiffres")) conseils.push("Un mot suivi de chiffres est le schéma que les attaquants essaient en premier.");
  if (niveau < 3 && mdp.length < 14) conseils.push("Le plus efficace : allonger. Quatre ou cinq mots au hasard, séparés par des tirets, font un excellent mot de passe.");
  return { niveau, libelle, bits, duree: duree(bits), conseils: conseils.slice(0, 2) };
}

/** Sans les caractères qu'on confond à la lecture (0/O, 1/l/I). */
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Mot de passe généré : 4 groupes de 5 caractères tirés au hasard (crypto.getRandomValues),
 * soit environ 116 bits d'aléa réel — hors de portée de toute attaque.
 */
export function genererMotDePasse(aleatoire: (n: number) => number): string {
  return Array.from({ length: 4 }, () => Array.from({ length: 5 }, () => ALPHABET[aleatoire(ALPHABET.length)]).join("")).join("-");
}

/** Tirage uniforme et cryptographique entre 0 et n-1 (sans biais de modulo). */
export function tirage(n: number): number {
  const limite = Math.floor(0x100000000 / n) * n;
  const tampon = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(tampon);
    if (tampon[0] < limite) return tampon[0] % n;
  }
}
