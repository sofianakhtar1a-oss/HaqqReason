import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CadreCreateur } from "@/components/CadreCreateur";
import { lireCompteCreateur } from "@/lib/auth-store";
import { sessionCreateur } from "@/lib/session";
import { FormulaireConnexion } from "./FormulaireConnexion";

export const metadata: Metadata = { title: "Connexion créateur", robots: { index: false } };

export default async function PageConnexion() {
  if (!(await lireCompteCreateur())) redirect("/createur/configuration");
  if (await sessionCreateur()) redirect("/createur");

  return (
    <CadreCreateur>
      <FormulaireConnexion />
      <p className="mt-6 border-t border-trait pt-5 text-center text-encre-douce">
        Tu veux seulement lire ?{" "}
        <Link href="/explorer" className="font-semibold text-encre underline-offset-4 hover:underline">
          Ouvrir le mode utilisateur
        </Link>
      </p>
    </CadreCreateur>
  );
}
