/*
 * Pour essayer l'Assistant dans un navigateur, sans clé ni base réelles : le site de production
 * (npm run build) démarre avec une base PostgreSQL locale (toutes les migrations) et une fausse
 * API Anthropic. Les cookies de comptes d'essai sont écrits dans le fichier donné en argument.
 *   npx tsx tests/outils/serveur-essai.mts /tmp/assistant-essai.json [port]
 * Clés d'essai acceptées par la fausse API : toute clé « sk-ant-api03-… » (voir anthropic-factice.mjs).
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { SignJWT } from "jose";
import { ouvrirBase, servirPostgrest } from "./postgrest-pglite.mjs";
import { servirAnthropic } from "./anthropic-factice.mjs";

const sortie = process.argv[2] ?? "/tmp/assistant-essai.json";
const port = Number(process.argv[3] ?? 3110);
const SECRET = "essai-".repeat(8);

const db = await ouvrirBase();
await servirPostgrest(db, 9931);
await servirAnthropic(9932);

const comptes: Record<string, { id: string; jeton: string }> = {};
for (const [sub, nom] of [
  ["essai-sofian", "Sofian Essai"],
  ["essai-neuf", "Nouveau Compte"],
]) {
  const l = (await db.query<{ id: string; session_version: number }>(`select * from compte_ouvrir($1, $2, $3)`, [sub, `${sub}@exemple.fr`, nom])).rows[0];
  const jeton = await new SignJWT({ uid: l.id, nom, email: `${sub}@exemple.fr`, sv: l.session_version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("utilisateur")
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(SECRET));
  comptes[sub] = { id: l.id, jeton };
}
writeFileSync(sortie, JSON.stringify({ port, cookie: "__Host-hr_compte", comptes }, null, 2));

const serveur = spawn("npx", ["next", "start", "-p", String(port), "-H", "127.0.0.1"], {
  env: {
    ...process.env,
    NODE_ENV: "production",
    SUPABASE_URL: "http://127.0.0.1:9931",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_essai",
    SUPABASE_SECRET_KEY: "sb_secret_essai",
    SESSION_SECRET: SECRET,
    SETUP_TOKEN: "0123456789abcdef",
    ASSISTANT_ANTHROPIC_BASE: "http://127.0.0.1:9932",
  },
  stdio: "inherit",
});
const arreter = () => {
  serveur.kill("SIGTERM");
  process.exit(0);
};
process.on("SIGINT", arreter);
process.on("SIGTERM", arreter);
console.log(`Assistant d'essai : http://127.0.0.1:${port}/assistant (cookies dans ${sortie})`);
