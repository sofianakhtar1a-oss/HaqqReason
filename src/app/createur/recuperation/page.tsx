import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CadreCreateur } from "@/components/CadreCreateur";
import { lireCompteCreateur } from "@/lib/auth-store";
import { FormulaireRecuperation } from "./FormulaireRecuperation";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default async function PageRecuperation() {
  if (!(await lireCompteCreateur())) redirect("/createur/configuration");
  return (
    <CadreCreateur>
      <FormulaireRecuperation />
    </CadreCreateur>
  );
}
