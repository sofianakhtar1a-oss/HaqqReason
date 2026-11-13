import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, BookOpen, DatabaseBackup, FileUp, Languages, LayoutTemplate, TriangleAlert } from "lucide-react";
import { FilAriane } from "@/components/FilAriane";
import { exigerCreateur } from "@/lib/session";
import { EnTeteCreateur } from "../_composants/EnTeteCreateur";

export const metadata: Metadata = { title: "Outils", robots: { index: false } };

const OUTILS = [
  { href: "/createur/sources", titre: "Sources et références", texte: "Ouvrages, auteurs, citations, niveaux de vérification.", Icone: BookOpen },
  { href: "/createur/outils/importer", titre: "Importer des contenus", texte: "Markdown, Word, texte, HTML, export Notion (.zip).", Icone: FileUp },
  { href: "/createur/outils/sauvegardes", titre: "Sauvegardes", texte: "Exporter toute la bibliothèque, copies automatiques, restauration.", Icone: DatabaseBackup },
  { href: "/createur/qualite", titre: "Contrôle qualité", texte: "Sources manquantes, hadiths sans degré, liens cassés.", Icone: TriangleAlert },
  { href: "/createur/statistiques", titre: "Statistiques", texte: "Articles les plus lus, sujets cherchés sans résultat.", Icone: BarChart3 },
  { href: "/createur/synonymes", titre: "Synonymes de recherche", texte: "Relier des mots qui désignent la même chose.", Icone: Languages },
  { href: "/createur/modeles", titre: "Modèles d'articles", texte: "Tes structures d'articles réutilisables.", Icone: LayoutTemplate },
];

export default async function Outils() {
  await exigerCreateur();
  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane etapes={[{ href: "/createur", libelle: "Espace créateur" }, { href: "/createur/outils", libelle: "Outils" }]} />
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Outils</h1>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {OUTILS.map(({ href, titre, texte, Icone }) => (
            <li key={href}>
              <Link href={href} className="verre flex h-full gap-4 rounded-3xl p-6 hover:border-or">
                <Icone className="size-7 shrink-0 text-or" strokeWidth={1.5} aria-hidden="true" />
                <span>
                  <span className="block font-display text-xl font-bold">{titre}</span>
                  <span className="mt-1 block text-encre-douce">{texte}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
