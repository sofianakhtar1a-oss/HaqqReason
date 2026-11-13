import type { Metadata } from "next";
import { FilAriane } from "@/components/FilAriane";
import { arbreCategories, listerBlocsAdmin } from "@/lib/contenu-admin";
import { exigerCreateur } from "@/lib/session";
import { EnTeteCreateur } from "../../_composants/EnTeteCreateur";
import { Importeur } from "./Importeur";

export const metadata: Metadata = { title: "Importer des contenus", robots: { index: false } };

export default async function Importer() {
  await exigerCreateur();
  const [arbre, blocs] = await Promise.all([arbreCategories(), listerBlocsAdmin()]);
  const titresBlocs = new Map(blocs.map((b) => [b.id, b.titre]));
  const options = arbre.map((c) => ({ id: c.id, libelle: `${"   ".repeat(c.profondeur)}${c.titre}`, bloc: titresBlocs.get(c.bloc_id) ?? "" }));

  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane
          etapes={[
            { href: "/createur", libelle: "Espace créateur" },
            { href: "/createur/outils", libelle: "Outils" },
            { href: "/createur/outils/importer", libelle: "Importer" },
          ]}
        />
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Importer des contenus</h1>
        <p className="mt-3 max-w-[64ch] text-lg text-encre-douce">
          Transforme tes fichiers existants en articles : Markdown, Word (.docx), texte, pages HTML, et l&apos;export complet de Notion (fichier .zip).
          Chaque document devient un article en brouillon, que tu relis avant de publier.
        </p>
        {options.length === 0 ? (
          <p className="verre mt-8 rounded-3xl p-6 text-encre-douce">Crée d&apos;abord une catégorie dans l&apos;un des trois blocs : elle servira de destination.</p>
        ) : (
          <Importeur categories={options} />
        )}
      </main>
    </>
  );
}
