/*
 * Modules réservés : chemins protégés, adresse de retour, jeton d'accès.
 * Lancer : npm run test:acces
 */
process.env.SESSION_SECRET ??= "x".repeat(48);
const { cheminReserve, moduleDuChemin, retourSur, signerAccesModules, verifierAccesModules, lireReglageAcces } = await import("../src/lib/acces-modules-jeton");

let e = 0;
const ok = (n: string, c: boolean) => {
  console.log((c ? "OK " : "ECHEC ") + n);
  if (!c) e++;
};

ok("les preuves sont réservées", cheminReserve("/explorer") && cheminReserve("/explorer/veracite-de-l-islam") && cheminReserve("/explorer/article/abc"));
ok("l'Islam authentique est réservé", cheminReserve("/islam") && cheminReserve("/islam/x"));
ok("le graphe et ses aperçus sont réservés", cheminReserve("/graphe") && cheminReserve("/api/apercu-noeud"));
ok("la recherche est réservée", cheminReserve("/recherche") && cheminReserve("/api/recherche") && cheminReserve("/api/recherche/signaler") && cheminReserve("/api/sens"));
ok("fichiers, débat, nouveautés et sources sont réservés", ["/fichiers/1", "/debat", "/nouveautes", "/sources/auteur/1"].every(cheminReserve));
ok("le reste du site reste ouvert", !["/", "/langues", "/alambic", "/ecrire", "/utilisateur", "/acces", "/sophismes", "/contribuer", "/islamique", "/explorers", "/createur/bibliotheque"].some(cheminReserve));
ok("module nommé selon l'adresse", moduleDuChemin("/islam") === "islam" && moduleDuChemin("/graphe") === "preuves");
ok("retour accepté sur une page réservée", retourSur("/explorer/article/12?q=a") === "/explorer/article/12?q=a");
ok("retour refusé ailleurs", ["//evil.com", "https://evil.com", "/\\evil", "/createur", "/api/recherche", "/langues", 42].every((r) => retourSur(r) === "/explorer"));

const jeton = await signerAccesModules(3);
ok("jeton valable pour la version actuelle", await verifierAccesModules(jeton, 3));
ok("jeton refusé après changement du mot de passe", !(await verifierAccesModules(jeton, 4)));
ok("jeton refusé si les modules sont fermés", !(await verifierAccesModules(jeton, null)));
ok("jeton modifié refusé", !(await verifierAccesModules(jeton.slice(0, -2) + "xx", 3)));
ok("sans jeton, pas d'accès", !(await verifierAccesModules(undefined, 3)));
ok("lecture du réglage stocké", lireReglageAcces({ empreinte: "h", version: 2 })?.version === 2 && lireReglageAcces({ version: "2" }) === null && lireReglageAcces(null) === null);

console.log(e ? `\n${e} échec(s)` : "\nTout est bon.");
process.exit(e ? 1 : 0);
