import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CadreCreateur } from "@/components/CadreCreateur";
import { sessionCreateur } from "@/lib/session";
import { deuxiemeEtapeEnCours } from "../../actions";
import { FormulaireCode } from "./FormulaireCode";

export const metadata: Metadata = { title: "Code de vérification", robots: { index: false } };

export default async function PageCode() {
  if (await sessionCreateur()) redirect("/createur");
  if ((await deuxiemeEtapeEnCours()) === null) redirect("/createur/connexion");
  return (
    <CadreCreateur>
      <FormulaireCode />
    </CadreCreateur>
  );
}
