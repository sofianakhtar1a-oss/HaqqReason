"use server";

import { revalidatePath } from "next/cache";
import { journaliser } from "@/lib/audit";
import { adresseValide, type ConfigPremium, configParDefaut, nettoyerConfig } from "@/lib/premium/catalogue";
import { ecrireConfigPremium, lireConfigPremium, prerequisOffre } from "@/lib/premium/config";
import { assurerProduit, erreurStripe, stripeConfigure, synchroniserPrix } from "@/lib/premium/stripe";
import { sessionCreateur } from "@/lib/session";

export type Reponse = { ok: true; message: string } | { ok: false; erreur: string };
const SESSION = "Ta session a expiré. Reconnecte-toi, puis recommence.";

function rafraichir() {
  revalidatePath("/createur/premium");
  revalidatePath("/premium");
  revalidatePath("/conditions-vente");
}

/** Ce que le formulaire peut changer ; l'interrupteur et les comptes offerts ont leurs propres actions. */
type Modifiable = Pick<ConfigPremium, "prixMois" | "prixAnnee" | "essaiJours" | "modules" | "regles" | "vendeur" | "accroche">;

export async function enregistrerReglagesPremium(brut: Modifiable): Promise<Reponse> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  try {
    const actuel = await lireConfigPremium(true);
    const propre = nettoyerConfig({ ...actuel, ...brut, active: actuel.active, offerts: actuel.offerts, versionCgv: actuel.versionCgv });
    if (brut.vendeur?.email && !adresseValide(brut.vendeur.email.trim())) return { ok: false, erreur: "L'adresse e-mail du vendeur n'est pas valide." };
    if (propre.prixAnnee >= propre.prixMois * 12) return { ok: false, erreur: "Le prix à l'année doit rester inférieur à douze mois au mois : sinon personne ne le choisira." };
    // Les conditions de vente changent dès que le prix, l'essai ou le vendeur changent : nouvelle version datée.
    const change = actuel.prixMois !== propre.prixMois || actuel.prixAnnee !== propre.prixAnnee || actuel.essaiJours !== propre.essaiJours || JSON.stringify(actuel.vendeur) !== JSON.stringify(propre.vendeur);
    const aujourdhui = new Date().toISOString().slice(0, 10);
    let message = "Réglages enregistrés : ils s'appliquent d'ici quinze secondes.";
    if (actuel.active && stripeConfigure() && (actuel.prixMois !== propre.prixMois || actuel.prixAnnee !== propre.prixAnnee)) {
      // Le nouveau prix est créé chez Stripe tout de suite, pour les prochains abonnés.
      try {
        await synchroniserPrix(propre.prixMois, propre.prixAnnee);
        message = "Prix enregistrés et envoyés à Stripe : ils valent pour les nouveaux abonnés. Les abonnés actuels gardent le leur.";
      } catch (e) {
        return { ok: false, erreur: `Rien n'a changé : ${erreurStripe(e)}` };
      }
    }
    await ecrireConfigPremium({ ...propre, versionCgv: change ? aujourdhui : actuel.versionCgv });
    await journaliser("premium.reglages", { prixMois: propre.prixMois, prixAnnee: propre.prixAnnee, essai: propre.essaiJours });
    rafraichir();
    return { ok: true, message };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : "L'enregistrement a échoué." };
  }
}

/** Allumer ou éteindre l'offre payante. Allumer vérifie d'abord que tout est prêt, et prépare Stripe. */
export async function basculerOffre(allumer: boolean): Promise<Reponse> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  try {
    const actuel = await lireConfigPremium(true);
    if (allumer) {
      const p = await prerequisOffre(actuel);
      if (!p.stripe) return { ok: false, erreur: "Stripe n'est pas encore réglé (clé et secret du webhook dans Vercel)." };
      if (!p.base) return { ok: false, erreur: "La base n'est pas prête : exécute le script 021_premium.sql dans Supabase." };
      if (!p.comptes) return { ok: false, erreur: "La connexion des comptes Google n'est pas en service." };
      if (!p.vendeur) return { ok: false, erreur: "Complète d'abord les informations du vendeur (nom, adresse, SIRET, e-mail) : elles sont obligatoires dans les conditions de vente." };
      try {
        await synchroniserPrix(actuel.prixMois, actuel.prixAnnee);
      } catch (e) {
        return { ok: false, erreur: `Stripe refuse : ${erreurStripe(e)}` };
      }
    }
    await ecrireConfigPremium({ ...actuel, active: allumer });
    await journaliser(allumer ? "premium.allumee" : "premium.eteinte", {});
    rafraichir();
    return { ok: true, message: allumer ? "L'offre Premium est en service : les visiteurs voient les parties réservées et peuvent s'abonner." : "L'offre est éteinte : tout le site est de nouveau ouvert à tous. Les abonnés en cours restent abonnés." };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : "Le changement a échoué." };
  }
}

/** Vérifie la clé Stripe pour de vrai : crée (ou retrouve) le produit et les deux prix. */
export async function verifierStripe(): Promise<Reponse> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  if (!stripeConfigure()) return { ok: false, erreur: "Il manque la clé Stripe ou le secret du webhook dans Vercel." };
  try {
    const c = await lireConfigPremium(true);
    await assurerProduit();
    await synchroniserPrix(c.prixMois, c.prixAnnee);
    return { ok: true, message: "Stripe répond : le produit « HaqqReason Premium » et ses deux prix sont prêts." };
  } catch (e) {
    return { ok: false, erreur: erreurStripe(e) };
  }
}

export async function ajouterOffert(email: string, jusqu: string, note: string): Promise<Reponse> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  const e = email.trim().toLowerCase();
  if (!adresseValide(e)) return { ok: false, erreur: "Cette adresse e-mail n'est pas valide." };
  if (jusqu && !/^\d{4}-\d{2}-\d{2}$/.test(jusqu)) return { ok: false, erreur: "La date n'est pas lisible." };
  try {
    const c = await lireConfigPremium(true);
    const offerts = [{ email: e, jusqu: jusqu || null, note: note.trim().slice(0, 120) }, ...c.offerts.filter((o) => o.email !== e)];
    await ecrireConfigPremium({ ...c, offerts });
    await journaliser("premium.offert", {});
    rafraichir();
    return { ok: true, message: `Accès Premium offert à ${e}${jusqu ? ` jusqu'au ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${jusqu}T12:00:00Z`))}` : ", sans date de fin"}.` };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "L'enregistrement a échoué." };
  }
}

export async function retirerOffert(email: string): Promise<Reponse> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  try {
    const c = await lireConfigPremium(true);
    await ecrireConfigPremium({ ...c, offerts: c.offerts.filter((o) => o.email !== email.trim().toLowerCase()) });
    await journaliser("premium.offert_retire", {});
    rafraichir();
    return { ok: true, message: "Accès offert retiré." };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Le retrait a échoué." };
  }
}

/** Les réglages conseillés des parties (gratuit, limité, Premium), sans toucher aux prix ni au vendeur. */
export async function reglagesConseilles(): Promise<Reponse> {
  if (!(await sessionCreateur())) return { ok: false, erreur: SESSION };
  try {
    const c = await lireConfigPremium(true);
    const d = configParDefaut();
    await ecrireConfigPremium({ ...c, modules: d.modules, regles: d.regles });
    await journaliser("premium.conseilles", {});
    rafraichir();
    return { ok: true, message: "Les réglages conseillés sont remis : assez de gratuit pour découvrir, et l'essentiel réservé à Premium." };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Le changement a échoué." };
  }
}
