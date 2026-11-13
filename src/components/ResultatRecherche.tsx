import Link from "next/link";
import { BookOpenText, FileText, FolderOpen, MessagesSquare, ScrollText } from "lucide-react";
import type { Resultat } from "@/lib/recherche";
import { extraitSurligne } from "@/lib/recherche-texte";

const LIBELLES: Record<Resultat["type"], string> = {
  article: "Article",
  verset: "Verset dans un article",
  hadith: "Hadith dans un article",
  objection: "Objection dans un article",
  document: "Document",
  page: "Page d'un document",
  dossier: "Dossier",
};

/** Adresse d'un résultat. Un brouillon s'ouvre dans l'espace créateur (il n'existe pas encore pour les lecteurs). */
export function lienResultat(r: Resultat, q: string): string {
  const brouillon = r.statut === "brouillon";
  switch (r.type) {
    case "dossier":
      return brouillon ? `/createur/categorie/${r.id}` : `/explorer/categorie/${r.id}`;
    case "document":
      return `/explorer/document/${r.id}`;
    case "page":
      return `/explorer/document/${r.id}?page=${r.page ?? 1}&q=${encodeURIComponent(q)}`;
    default:
      return brouillon ? `/createur/article/${r.id}` : `/explorer/article/${r.id}`;
  }
}

export function IconeResultat({ type, className = "size-5" }: { type: Resultat["type"]; className?: string }) {
  const Icone = type === "dossier" ? FolderOpen : type === "document" || type === "page" ? FileText : type === "verset" || type === "hadith" ? BookOpenText : type === "objection" ? MessagesSquare : ScrollText;
  return <Icone className={className} strokeWidth={1.5} aria-hidden="true" />;
}

export function Extrait({ texte, mots, longueur }: { texte: string; mots: string[]; longueur?: number }) {
  const segments = extraitSurligne(texte, mots, longueur);
  if (segments.length === 0) return null;
  return (
    <>
      {segments.map((s, i) => (s.surligne ? <mark key={i}>{s.texte}</mark> : <span key={i}>{s.texte}</span>))}
    </>
  );
}

export function CarteResultat({ r, q, mots, createur }: { r: Resultat; q: string; mots: string[]; createur: boolean }) {
  return (
    <li className="resultat">
      <Link href={lienResultat(r, q)} className="carte-article flex gap-4">
        <span className="mt-0.5 text-accent">
          <IconeResultat type={r.type} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-lg font-bold">{r.titre}</span>
            {r.type === "page" && <span className="badge badge-publie">Page {r.page}</span>}
            {createur && r.statut === "brouillon" && <span className="badge badge-brouillon">Brouillon</span>}
            {r.approchant && <span className="badge badge-brouillon">Approchant</span>}
          </span>
          <span className="mt-0.5 block text-sm text-encre-douce">
            {LIBELLES[r.type]}
            {r.chemin ? ` dans ${r.chemin}` : ""}
          </span>
          {r.fenetre && (
            <span className="mt-2 block leading-relaxed text-encre-douce">
              <Extrait texte={r.fenetre} mots={mots} />
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}
