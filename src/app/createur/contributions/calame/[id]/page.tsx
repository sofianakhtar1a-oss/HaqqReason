import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { enHtml, feuilleDeStyle, feuilleLimitee } from "@/lib/atelier/html";
import { STYLES_PAR_DEFAUT } from "@/lib/atelier/modele";
import type { Noeud } from "@/lib/atelier/neutre";
import { DOSSIER_PROPOSITIONS } from "@/lib/atelier/propositions";
import { exigerCreateur } from "@/lib/session";
import { ESPACE } from "@/lib/stockage";
import { dbAdmin } from "@/lib/supabase";
import "../../../../lire/lire.css";

export const metadata: Metadata = { title: "Texte proposé depuis le Calame", robots: { index: false, follow: false } };

/** Le texte complet d'une proposition envoyée depuis le Calame, pour le créateur seul. */
export default async function PropositionCalame({ params }: { params: Promise<{ id: string }> }) {
  await exigerCreateur();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await dbAdmin().storage.from(ESPACE).download(`${DOSSIER_PROPOSITIONS}/${id}.json`);
  if (!data) notFound();
  let proposition: { titre?: string; contenu?: Noeud };
  try {
    proposition = JSON.parse(await data.text()) as { titre?: string; contenu?: Noeud };
  } catch {
    notFound();
  }
  const { corps } = enHtml(proposition.contenu ?? { type: "doc", content: [] });
  return (
    <main className="lecture-publiee">
      <p className="w-full max-w-3xl">
        <Link href="/createur/contributions" className="bouton bouton-discret bouton-petit">
          Retour aux contributions
        </Link>
      </p>
      <style>{feuilleLimitee(feuilleDeStyle(STYLES_PAR_DEFAUT), ".lecture-publiee-texte")}</style>
      <article className="lecture-publiee-texte" lang="fr">
        <h1>{proposition.titre || "Texte proposé"}</h1>
        <div dangerouslySetInnerHTML={{ __html: corps }} />
      </article>
    </main>
  );
}
