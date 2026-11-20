import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { enHtml, feuilleDeStyle, feuilleLimitee } from "@/lib/atelier/html";
import { nettoyerReglages } from "@/lib/atelier/modele";
import type { Noeud } from "@/lib/atelier/neutre";
import { jetonDeLecture, lirePublication, nomCookieLecture } from "@/lib/atelier/publications";
import { deverrouillerLecture } from "./actions";
import "../lire.css";

/*
 * Une page publiée depuis le Calame, en lecture seule. Le texte est mis en page ici, par le serveur,
 * à partir du document (texte échappé, liens et images vérifiés) : rien de ce qu'envoie le navigateur
 * n'est recopié tel quel dans la page.
 */

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await lirePublication(id);
  return { title: p ? p.titre || "Document" : "Page introuvable", robots: { index: false, follow: false } };
}

export default async function PageLecture({ params, searchParams }: Props) {
  const { id } = await params;
  const p = await lirePublication(id);
  if (!p) notFound();

  if (p.motDePasse && (await cookies()).get(nomCookieLecture(id))?.value !== jetonDeLecture(p)) {
    const erreur = (await searchParams).erreur === "1";
    return (
      <main className="lecture-publiee lecture-protegee">
        <form action={deverrouillerLecture} className="lecture-protegee-carte">
          <h1>{p.titre || "Document"}</h1>
          <p>Cette page est protégée par un mot de passe.</p>
          <input type="hidden" name="id" value={id} />
          <input className="champ" type="password" name="motDePasse" autoComplete="current-password" aria-label="Mot de passe" required autoFocus />
          {erreur && (
            <p className="message message-erreur" role="alert">
              Ce n&apos;est pas le bon mot de passe.
            </p>
          )}
          <button type="submit" className="bouton bouton-principal">
            Lire
          </button>
        </form>
      </main>
    );
  }

  const styles = nettoyerReglages({ styles: p.styles }).styles;
  const { corps } = enHtml(p.contenu as Noeud, { sourceImage: (f) => p.images[f] ?? null });
  const date = new Date(p.maj).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return (
    <main className="lecture-publiee">
      <style>{feuilleLimitee(feuilleDeStyle(styles), ".lecture-publiee-texte")}</style>
      <article className="lecture-publiee-texte" lang="fr">
        <h1>{p.titre || "Document"}</h1>
        <p className="lecture-publiee-meta">
          {p.auteur ? `${p.auteur} · ` : ""}mis à jour le {date} · écrit avec le Calame
        </p>
        <div dangerouslySetInnerHTML={{ __html: corps }} />
      </article>
    </main>
  );
}
