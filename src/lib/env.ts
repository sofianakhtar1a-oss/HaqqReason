import "server-only";

/** Variables d'environnement indispensables. Elles ne quittent jamais le serveur. */
const REQUISES = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SESSION_SECRET",
  "SETUP_TOKEN",
] as const;

type NomVariable = (typeof REQUISES)[number];

/** Liste les variables manquantes ou trop faibles (noms uniquement, jamais les valeurs). */
export function variablesManquantes(): string[] {
  const problemes: string[] = [];
  for (const nom of REQUISES) {
    const valeur = process.env[nom]?.trim();
    if (!valeur) {
      problemes.push(nom);
    } else if (nom === "SESSION_SECRET" && valeur.length < 32) {
      problemes.push("SESSION_SECRET (32 caractères minimum)");
    } else if (nom === "SETUP_TOKEN" && valeur.length < 16) {
      problemes.push("SETUP_TOKEN (16 caractères minimum)");
    }
  }
  return problemes;
}

export function env(nom: NomVariable): string {
  const valeur = process.env[nom]?.trim();
  if (!valeur) {
    throw new Error(`Variable d'environnement manquante : ${nom}`);
  }
  return valeur;
}
