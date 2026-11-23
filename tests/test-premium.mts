// L'offre Premium : catalogue, réglages, périodes, accès offerts et signature des avis de Stripe.
// Lancer : npm run test:premium
import Stripe from "stripe";
import {
  accesOffert,
  clePeriode,
  configParDefaut,
  economieAnnuelle,
  FONCTIONS,
  MODULES_PREMIUM,
  nettoyerConfig,
  PAR_ID,
  prixLisible,
  regleEffective,
  regleLisible,
  remiseLisible,
  semaineIso,
  vendeurComplet,
} from "../src/lib/premium/catalogue";

let echecs = 0;
const ok = (nom: string, cond: boolean) => {
  console.log(`${cond ? "OK  " : "ECHEC"} ${nom}`);
  if (!cond) echecs++;
};

// Le catalogue
ok("chaque partie a un identifiant unique", new Set(FONCTIONS.map((f) => f.id)).size === FONCTIONS.length);
ok("chaque partie appartient à un module connu", FONCTIONS.every((f) => MODULES_PREMIUM.some((m) => m.id === f.module)));
ok("chaque identifiant est accepté par la base", FONCTIONS.every((f) => /^[a-z][a-z0-9.-]{0,59}$/.test(f.id)));
ok("chaque module a au moins une partie", MODULES_PREMIUM.every((m) => FONCTIONS.some((f) => f.module === m.id)));
ok("les réglages par défaut gardent du gratuit dans chaque atelier", ["truchement", "alambic", "calame", "portulan", "ecorche"].every((m) => FONCTIONS.some((f) => f.module === m && f.defaut.acces !== "premium")));
ok("les réglages par défaut réservent quelque chose à Premium", FONCTIONS.some((f) => f.defaut.acces === "premium"));
ok("la bibliothèque et les vidéos restent ouvertes par défaut", FONCTIONS.filter((f) => f.module === "bibliotheque" || f.module === "islam").every((f) => f.defaut.acces === "libre"));

// La configuration
const d = configParDefaut();
ok("par défaut, l'offre est éteinte", d.active === false);
ok("prix par défaut : 4,99 € et 39,99 €", d.prixMois === 499 && d.prixAnnee === 3999 && prixLisible(d.prixMois) === "4,99 €" && prixLisible(d.prixAnnee) === "39,99 €");
const eco = economieAnnuelle(d);
ok("l'année fait gagner plus de trois mois (33 %)", eco.moisOfferts === 3 && eco.pourcent === 33);
const sale = nettoyerConfig({
  active: "oui",
  prixMois: -5,
  prixAnnee: "1e9",
  essaiJours: 400,
  modules: { truchement: "premium", alambic: "nimporte" },
  regles: { "truchement.dictees": { acces: "limite", limite: 0, periode: "decennie" }, "inconnu.x": { acces: "libre" } },
  vendeur: { nom: "  Sofian  ", siret: "123 456 789 00012<script>", email: "pas-une-adresse", adresse: "1 rue \u0007de Laval" },
  offerts: [{ email: "Ami@Exemple.FR", jusqu: "2027-01-31" }, { email: "ami@exemple.fr" }, { email: "faux" }, { email: "b@exemple.fr", jusqu: "demain" }],
  accroche: "x".repeat(500),
});
ok("« oui » n'allume pas l'offre (seul true l'allume)", sale.active === false);
ok("les prix sont ramenés dans les bornes", sale.prixMois === 99 && sale.prixAnnee === 99999);
ok("l'essai est plafonné à 30 jours", sale.essaiJours === 30);
ok("un mode de module inconnu est ignoré", sale.modules.truchement === "premium" && sale.modules.alambic === "parties");
ok("une limite nulle redevient au moins 1, une période inconnue reprend la sienne", sale.regles["truchement.dictees"].limite >= 1 && sale.regles["truchement.dictees"].periode === "semaine");
ok("une partie inconnue n'entre pas dans la configuration", !("inconnu.x" in sale.regles));
ok("le vendeur est nettoyé (espaces, chiffres du SIRET, caractères de contrôle, e-mail invalide)", sale.vendeur.nom === "Sofian" && sale.vendeur.siret === "123 456 789 00012" && sale.vendeur.email === "" && sale.vendeur.adresse === "1 rue de Laval");
ok("les comptes offerts : minuscules, sans doublon ni adresse invalide, date lisible ou aucune", sale.offerts.length === 2 && sale.offerts[0].email === "ami@exemple.fr" && sale.offerts[0].jusqu === "2027-01-31" && sale.offerts[1].jusqu === null);
ok("l'accroche est coupée à 240 caractères", sale.accroche.length === 240);
ok("vendeur incomplet tant qu'il manque l'adresse, le SIRET ou l'e-mail", !vendeurComplet(sale.vendeur) && vendeurComplet({ ...sale.vendeur, email: "contact@exemple.fr" }));

// La règle qui s'applique
const c = nettoyerConfig({ modules: { alambic: "libre", ecorche: "premium" } });
ok("module « tout gratuit » : chaque partie est gratuite", regleEffective(c, "alambic.lot").acces === "libre");
ok("module « tout Premium » : chaque partie est réservée", regleEffective(c, "ecorche.explorer").acces === "premium");
ok("partie par partie : la règle de la partie", regleEffective(c, "truchement.histoires-c").acces === "premium" && regleEffective(c, "truchement.dictees").limite === 3);
ok("une partie inconnue reste ouverte", regleEffective(c, "rien.du.tout").acces === "libre");
ok("règle lisible", regleLisible(regleEffective(c, "truchement.dictees"), PAR_ID.get("truchement.dictees")!) === "3 dictées par semaine" && regleLisible({ acces: "limite", limite: 1, periode: "jour" }, PAR_ID.get("truchement.dictee-surprise")!) === "1 dictée par jour");

// Les périodes, à l'heure de Paris
ok("semaine ISO : 1er janvier 2027 est en semaine 53 de 2026", JSON.stringify(semaineIso(2027, 1, 1)) === JSON.stringify({ annee: 2026, semaine: 53 }));
ok("semaine ISO : 23 novembre 2026 est en semaine 48", semaineIso(2026, 11, 23).semaine === 48);
ok("semaine ISO : 29 décembre 2025 est en semaine 1 de 2026", JSON.stringify(semaineIso(2025, 12, 29)) === JSON.stringify({ annee: 2026, semaine: 1 }));
const minuitParis = new Date("2026-11-23T23:30:00Z"); // 0 h 30 le 24 à Paris
ok("le jour suit l'heure de Paris", clePeriode("jour", minuitParis) === "j-2026-11-24");
ok("clé de semaine en minuscules (acceptée par la base)", clePeriode("semaine", new Date("2026-11-23T10:00:00Z")) === "s-2026-w48");
ok("clé de mois", clePeriode("mois", new Date("2026-11-30T23:30:00Z")) === "m-2026-12");
ok("« en tout » ne change jamais", clePeriode("total") === "total");
ok("chaque clé est acceptée par la base", ["jour", "semaine", "mois", "total"].every((p) => /^[a-z0-9-]{1,20}$/.test(clePeriode(p as "jour"))));
ok("remise lisible", remiseLisible("jour") === "demain" && remiseLisible("semaine") === "lundi" && remiseLisible("mois", new Date("2026-11-23T10:00:00Z")) === "le 1er décembre" && remiseLisible("mois", new Date("2026-12-15T10:00:00Z")) === "le 1er janvier");

// Les accès offerts
const offerts = { offerts: [{ email: "prof@exemple.fr", jusqu: "2026-12-31", note: "" }, { email: "ami@exemple.fr", jusqu: null, note: "" }] };
ok("accès offert reconnu, sans tenir compte des majuscules", accesOffert(offerts, " Prof@Exemple.fr ", new Date("2026-12-31T20:00:00Z"))?.jusqu === "2026-12-31");
ok("accès offert terminé le lendemain", accesOffert(offerts, "prof@exemple.fr", new Date("2027-01-01T10:00:00Z")) === null);
ok("accès offert sans date de fin", accesOffert(offerts, "ami@exemple.fr", new Date("2040-01-01"))?.jusqu === null);
ok("adresse inconnue ou vide : pas d'accès", accesOffert(offerts, "autre@exemple.fr") === null && accesOffert(offerts, "") === null);

// La signature des avis de Stripe (aucune connexion réseau : tout se calcule ici)
const stripe = new Stripe("sk_test_00000000000000000000000000");
const secret = "whsec_essai0123456789abcdefABCDEF";
const corps = JSON.stringify({ id: "evt_1Essai", object: "event", type: "invoice.paid", data: { object: { id: "in_1" } } });
const signature = stripe.webhooks.generateTestHeaderString({ payload: corps, secret });
let lu = "";
try {
  lu = stripe.webhooks.constructEvent(corps, signature, secret).id;
} catch {
  lu = "";
}
ok("un avis bien signé est accepté", lu === "evt_1Essai");
const refuse = (nom: string, essai: () => unknown) => {
  let r = false;
  try {
    essai();
  } catch {
    r = true;
  }
  ok(nom, r);
};
refuse("un avis modifié après signature est refusé", () => stripe.webhooks.constructEvent(corps.replace("invoice.paid", "customer.subscription.deleted"), signature, secret));
refuse("un avis signé avec un autre secret est refusé", () => stripe.webhooks.constructEvent(corps, stripe.webhooks.generateTestHeaderString({ payload: corps, secret: "whsec_autre0123456789abcdefABCD" }), secret));
refuse("un vieil avis rejoué est refusé", () => stripe.webhooks.constructEvent(corps, stripe.webhooks.generateTestHeaderString({ payload: corps, secret, timestamp: Math.floor(Date.now() / 1000) - 3600 }), secret));
refuse("un avis sans signature est refusé", () => stripe.webhooks.constructEvent(corps, "", secret));

console.log(echecs === 0 ? "\nTous les tests Premium passent." : `\n${echecs} test(s) en échec.`);
process.exit(echecs === 0 ? 0 : 1);
