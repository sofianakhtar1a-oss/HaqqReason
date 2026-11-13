// Génère les trois secrets à coller dans .env.local (et plus tard dans Vercel).
// Lancer : npm run secrets
import { randomBytes } from "node:crypto";

console.log("\nCopie ces trois lignes dans ton fichier .env.local (et dans Vercel) :\n");
console.log(`SESSION_SECRET=${randomBytes(48).toString("base64url")}`);
console.log(`SETUP_TOKEN=${randomBytes(18).toString("base64url")}`);
console.log(`CRON_SECRET=${randomBytes(32).toString("base64url")}`);
console.log("\nSETUP_TOKEN est le « code d'installation » demandé une seule fois, à la création de ton accès créateur.\n");
