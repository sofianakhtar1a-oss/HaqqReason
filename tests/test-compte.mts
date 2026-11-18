/* Tests des comptes utilisateurs : jetons de session, retour de connexion, identité Google, écritures.
 * Lancer : npm run test:compte   (aucun réseau : Google est simulé sur place) */
import { exportJWK, generateKeyPair, SignJWT } from "jose";

process.env.SESSION_SECRET = "secret-de-test-secret-de-test-secret-de-test-1234";
process.env.GOOGLE_CLIENT_ID = "client-de-test.apps.googleusercontent.com";

let e = 0;
const ok = (nom: string, cond: boolean, detail?: unknown) => {
  console.log(`${cond ? "OK" : "ÉCHEC"} ${nom}`);
  if (!cond) {
    e++;
    if (detail !== undefined) console.log("   ", JSON.stringify(detail)?.slice(0, 400));
  }
};

const jeton = await import("../src/lib/compte/jeton");
const session = await import("../src/lib/session-token");

// ---------- La page de retour : jamais un autre site ----------
ok("retour : une page du site est acceptée", jeton.retourSur("/langues?x=1") === "/langues?x=1");
for (const mauvais of ["https://pirate.example", "//pirate.example", "/\\pirate.example", "javascript:alert(1)", "", null, "/api/compte/donnees", "/createur", "/connexion?retour=/", `/${"a".repeat(400)}`]) {
  ok(`retour : « ${String(mauvais).slice(0, 30)} » est remplacé par l'accueil des espaces`, jeton.retourSur(mauvais) === "/utilisateur");
}
ok("les espaces personnels demandent un compte", ["/utilisateur", "/ecrire", "/alambic", "/langues", "/favoris", "/compte"].every(jeton.espacePersonnel));
ok("la bibliothèque et l'accueil restent ouverts", ["/", "/explorer", "/explorer/article/x", "/islam", "/recherche", "/contribuer", "/ecrire-autre", "/languesx"].every((c) => !jeton.espacePersonnel(c)));

// ---------- La connexion Google est active sans aucun code secret ----------
{
  const avant = process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_ID;
  ok("sans réglage, l'identifiant public de HaqqReason est utilisé", jeton.identifiantClientGoogle() === jeton.CLIENT_GOOGLE_HAQQREASON && jeton.CLIENT_GOOGLE_HAQQREASON.endsWith(".apps.googleusercontent.com"));
  ok("la connexion Google est active dès que les sessions peuvent être signées", jeton.googleConfigure());
  process.env.GOOGLE_CONNEXION = "non";
  ok("GOOGLE_CONNEXION=non la coupe", !jeton.googleConfigure());
  delete process.env.GOOGLE_CONNEXION;
  process.env.GOOGLE_CLIENT_ID = avant;
  ok("GOOGLE_CLIENT_ID, s'il existe, remplace l'identifiant d'origine", jeton.identifiantClientGoogle() === avant);
}

// ---------- Le jeton de session ----------
const compte = { id: "0f8fad5b-d9cb-469f-a165-70867728950e", nom: "Aïcha", email: "aicha@exemple.fr", sv: 3 };
const signe = await jeton.signerCompte(compte);
const relu = await jeton.verifierCompte(signe);
ok("un jeton de session se relit", relu?.id === compte.id && relu.nom === "Aïcha" && relu.email === compte.email && relu.sv === 3 && typeof relu.emis === "number");
ok("un jeton trafiqué est refusé", (await jeton.verifierCompte(`${signe.slice(0, -3)}abc`)) === null && (await jeton.verifierCompte("n'importe quoi")) === null && (await jeton.verifierCompte(undefined)) === null);
const createur = await session.signerSession({ sv: 1, debut: Math.floor(Date.now() / 1000), ina: 30, max: 12 });
ok("la session du créateur n'ouvre pas un compte utilisateur", (await jeton.verifierCompte(createur)) === null);
ok("un compte utilisateur n'ouvre pas le mode créateur", (await session.verifierSession(signe)) === null);
const cle = new TextEncoder().encode(process.env.SESSION_SECRET);
const sansUuid = await new SignJWT({ uid: "1 or 1=1", sv: 1 }).setProtectedHeader({ alg: "HS256" }).setSubject("utilisateur").setExpirationTime("1h").sign(cle);
ok("un identifiant de compte mal formé est refusé", (await jeton.verifierCompte(sansUuid)) === null);
const perime = await new SignJWT({ uid: compte.id, sv: 1 }).setProtectedHeader({ alg: "HS256" }).setSubject("utilisateur").setExpirationTime(Math.floor(Date.now() / 1000) - 60).sign(cle);
ok("un jeton expiré est refusé", (await jeton.verifierCompte(perime)) === null);
const aller = await jeton.signerAllerRetour({ etat: "e", nonce: "n", retour: "/ecrire" });
ok("l'aller-retour chez Google se relit, et n'est pas un jeton de session", (await jeton.verifierAllerRetour(aller))?.retour === "/ecrire" && (await jeton.verifierCompte(aller)) === null && (await jeton.verifierAllerRetour(signe)) === null);

// ---------- L'identité renvoyée par Google (Google simulé) ----------
const { privateKey, publicKey } = await generateKeyPair("RS256");
const { privateKey: autreCle } = await generateKeyPair("RS256");
const jwk = { ...(await exportJWK(publicKey)), kid: "cle-1", alg: "RS256", use: "sig" };
const vraiFetch = globalThis.fetch;
globalThis.fetch = (async (entree: RequestInfo | URL) => {
  const url = String(entree instanceof Request ? entree.url : entree);
  if (url.startsWith("https://www.googleapis.com/oauth2/v3/certs")) return Response.json({ keys: [jwk] });
  // Plus aucun échange de code : le site ne parle à Google que pour lire ses clés publiques.
  throw new Error(`appel réseau inattendu : ${url}`);
}) as typeof fetch;

const google = await import("../src/lib/compte/google");
const fabriquer = (charge: Record<string, unknown>, options: { cle?: CryptoKey; emetteur?: string; public?: string; expire?: number; emis?: number } = {}) =>
  new SignJWT({ nonce: "nonce-attendu", email: "aicha@exemple.fr", email_verified: true, name: "Aïcha B.", ...charge })
    .setProtectedHeader({ alg: "RS256", kid: "cle-1" })
    .setSubject("google-123")
    .setIssuer(options.emetteur ?? "https://accounts.google.com")
    .setAudience(options.public ?? process.env.GOOGLE_CLIENT_ID!)
    .setIssuedAt(options.emis ?? Math.floor(Date.now() / 1000))
    .setExpirationTime(options.expire ?? Math.floor(Date.now() / 1000) + 600)
    .sign(options.cle ?? privateKey);
const verifier = (jetonGoogle: string | null) => google.identiteDepuisJeton(jetonGoogle, "nonce-attendu");

const identite = await verifier(await fabriquer({}));
ok("Google confirme : on obtient l'identifiant, le nom et l'adresse", identite?.sub === "google-123" && identite.nom === "Aïcha B." && identite.email === "aicha@exemple.fr", identite);
ok("une réponse prévue pour une autre demande (nonce) est refusée", (await verifier(await fabriquer({ nonce: "un-autre" }))) === null);
ok("un jeton sans nonce est refusé", (await verifier(await fabriquer({ nonce: undefined }))) === null && (await google.identiteDepuisJeton(await fabriquer({}), "")) === null);
ok("un jeton destiné à une autre application est refusé", (await verifier(await fabriquer({}, { public: "une-autre-application" }))) === null);
ok("un jeton qui ne vient pas de Google est refusé", (await verifier(await fabriquer({}, { emetteur: "https://faux-google.example" }))) === null);
ok("un jeton signé par une autre clé est refusé", (await verifier(await fabriquer({}, { cle: autreCle }))) === null);
ok("un jeton expiré est refusé", (await verifier(await fabriquer({}, { expire: Math.floor(Date.now() / 1000) - 60 }))) === null);
ok("un jeton émis il y a plus d'une heure est refusé", (await verifier(await fabriquer({}, { emis: Math.floor(Date.now() / 1000) - 7200, expire: Math.floor(Date.now() / 1000) + 600 }))) === null);
ok("une adresse que Google n'a pas vérifiée est refusée", (await verifier(await fabriquer({ email_verified: false }))) === null);
ok("sans nom, on prend le début de l'adresse", (await verifier(await fabriquer({ name: "" })))?.nom === "aicha");
ok("sans jeton, ou avec n'importe quoi, la connexion échoue proprement", (await verifier(null)) === null && (await verifier("pas-un-jeton")) === null && (await verifier("x".repeat(9000))) === null);
const sansSignature = (await fabriquer({})).split(".").slice(0, 2).join(".") + ".";
ok("un jeton sans signature est refusé", (await verifier(sansSignature)) === null);

const retourGoogle = "https://haqqreason.vercel.app/api/compte/google/retour";
const adresse = new URL(google.adresseAutorisation({ retour: retourGoogle, etat: "etat-1", nonce: "nonce-1" }));
const pa = adresse.searchParams;
ok("la demande à Google ne réclame que l'identité (aucun accès aux e-mails ni aux fichiers)", adresse.origin === "https://accounts.google.com" && pa.get("scope") === "openid email profile" && pa.get("state") === "etat-1" && pa.get("nonce") === "nonce-1");
ok("Google renvoie le jeton par formulaire, jamais dans l'adresse", pa.get("response_type") === "id_token" && pa.get("response_mode") === "form_post" && pa.get("redirect_uri") === retourGoogle && pa.get("client_id") === process.env.GOOGLE_CLIENT_ID);
const requete = (hote: string, proto?: string) => new Request(`http://interne/api`, { headers: { host: hote, ...(proto ? { "x-forwarded-proto": proto } : {}) } });
ok("l'adresse de retour suit le domaine visité, toujours en https hors de la machine locale", google.adresseRetour(requete("haqqreason.com", "http")) === "https://haqqreason.com/api/compte/google/retour" && google.adresseRetour(requete("localhost:3000")) === "http://localhost:3000/api/compte/google/retour");
globalThis.fetch = vraiFetch;

// ---------- Les écritures reçues d'un appareil ----------
const { nettoyerEcritures } = await import("../src/lib/compte/donnees");
const { OBJET_MAX } = await import("../src/lib/compte/limites");
const propre = nettoyerEcritures([
  { m: "regles", c: "lecon", v: { etoiles: 3 }, q: 1000 },
  { m: "calame-documents", c: "d1", v: null, q: 2000 },
  { m: "table-inconnue", c: "x", v: 1, q: 1 },
  { m: "regles", c: "", v: 1, q: 1 },
  { m: "regles", c: "x".repeat(201), v: 1, q: 1 },
  { m: "regles", c: "sans-heure", v: 1 },
  { m: "regles", c: "negatif", v: 1, q: -5 },
  { m: "regles", c: "futur", v: 1, q: Date.now() + 86_400_000 * 365 },
  { m: "calame-documents", c: "enorme", v: { t: "x".repeat(OBJET_MAX + 10) }, q: 1 },
  "n'importe quoi",
  null,
]);
ok("seules les écritures bien formées sont gardées", propre.valides.length === 3 && propre.valides.map((x) => x.c).join() === "lecon,d1,futur", propre.valides.map((x) => x.c));
ok("une suppression voyage comme une valeur nulle", propre.valides[1].v === null);
ok("une horloge très en avance est ramenée au présent", propre.valides[2].q <= Date.now() + 6 * 60_000);
ok("un objet trop lourd est signalé, pas envoyé à la base", propre.tropLourdes.length === 1 && propre.tropLourdes[0].c === "enorme");
ok("autre chose qu'une liste ne donne rien", nettoyerEcritures({ m: "regles" }).valides.length === 0);

console.log(e === 0 ? "\nTous les tests des comptes passent." : `\n${e} test(s) en échec.`);
process.exit(e === 0 ? 0 : 1);
