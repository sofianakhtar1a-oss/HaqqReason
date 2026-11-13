import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CadreCreateur } from "@/components/CadreCreateur";
import { lireCompteCreateur } from "@/lib/auth-store";
import { sessionCreateur } from "@/lib/session";
import { FormulaireConfiguration } from "./FormulaireConfiguration";

export const metadata: Metadata = { title: "Première configuration", robots: { index: false } };

export default async function PageConfiguration() {
  // Si le compte existe déjà, cette page ne sert plus — sauf pendant l'affichage de la clé, juste après la création.
  const compte = await lireCompteCreateur();
  if (compte && !(await sessionCreateur())) redirect("/createur/connexion");

  // Le formulaire reste monté après la création : c'est lui qui affiche la clé de récupération, une seule fois.
  return (
    <CadreCreateur>
      <FormulaireConfiguration dejaConfigure={compte !== null} />
    </CadreCreateur>
  );
}
