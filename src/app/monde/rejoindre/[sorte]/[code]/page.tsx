import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EnTete } from "@/components/EnTete";
import { googleConfigure } from "@/lib/compte/jeton";
import { compteCourant } from "@/lib/compte/session";
import { TEXTES_INVITATION } from "@/lib/monde/invitations";
import { codeInvitationValide, estSorteInvitation, fragmentInvitation } from "@/lib/monde/pages-publiques";
import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";
import "../../../pays/pays.css";

/*
 * Une invitation du Portulan (un duel, un salon, un ami, une classe), à l'adresse qu'on partage :
 * les messageries en tirent un aperçu ; qui est connecté entre tout droit dans le Portulan ;
 * les autres passent d'abord par la connexion, puis y arrivent avec le même code.
 */

type Props = { params: Promise<{ sorte: string; code: string }> };

async function lire(params: Props["params"]) {
  const { sorte, code: brut } = await params;
  const code = brut.toUpperCase();
  if (!estSorteInvitation(sorte) || !codeInvitationValide(sorte, code)) return null;
  return { sorte, code };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const i = await lire(params);
  if (!i) return { title: "Invitation introuvable", robots: { index: false } };
  const t = TEXTES_INVITATION[i.sorte];
  return {
    title: `${t.titre} au Portulan`,
    description: `${t.ligne} Code : ${i.code}.`,
    robots: { index: false, follow: false },
    openGraph: { type: "website", title: `${t.titre} au Portulan`, description: t.ligne, locale: "fr_FR" },
    twitter: { card: "summary_large_image", title: `${t.titre} au Portulan` },
  };
}

export default async function PageInvitation({ params }: Props) {
  const i = await lire(params);
  if (!i) notFound();
  const cible = `/monde${fragmentInvitation(i.sorte, i.code)}`;
  if (!googleConfigure() || (await compteCourant())) redirect(cible);
  const t = TEXTES_INVITATION[i.sorte];
  return (
    <>
      <EnTete />
      <main className="pp pp-invitation">
        <header className="pp-index-tete">
          <p className="pp-region">Le Portulan</p>
          <h1 className="pp-nom">{t.titre}</h1>
          <p className="pp-chapo">{t.texte}</p>
        </header>
        <section className="pp-jouer" aria-label="L'invitation">
          <p className="pp-invitation-code">
            Le code : <strong>{i.code}</strong>
          </p>
          <p>Connecte-toi avec ton compte Google : tu arriveras directement dans l&apos;invitation, avec ce code.</p>
          <Link href={`/connexion?retour=${encodeURIComponent(cible)}`} className="bouton bouton-principal">
            {t.bouton}
          </Link>
        </section>
        <p className="pp-sources">
          Pas encore de compte ? La connexion Google en crée un, en un instant. En attendant, découvre <Link href="/monde/pays">les pays du monde</Link>.
        </p>
      </main>
    </>
  );
}
