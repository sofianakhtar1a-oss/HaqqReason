import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "./globals.css";
import "./scene.css";
import "./modules.css";
import "./finitions.css";
import "./premium.css";
import { BarreVueUtilisateur } from "@/components/compte/BarreVueUtilisateur";
import { Synchronisation } from "@/components/compte/Synchronisation";
import { InstallationRequise } from "@/components/InstallationRequise";
import { FenetrePremium } from "@/components/premium/FenetrePremium";
import { PaletteRecherche } from "@/components/PaletteRecherche";
import { ServiceHorsLigne } from "@/components/ServiceHorsLigne";
import { FilDOr } from "@/components/scene/FilDOr";
import { Lampe } from "@/components/scene/Lampe";
import { Mouvements } from "@/components/scene/Mouvements";
import { PortailRegle } from "@/components/scene/PortailRegle";
import { Ouverture, SCRIPT_OUVERTURE } from "@/components/scene/Ouverture";
import { googleConfigure } from "@/lib/compte/jeton";
import { compteCourant } from "@/lib/compte/session";
import { variablesManquantes } from "@/lib/env";
import { attributsPremium } from "@/lib/premium/page";
import { adresseDuSite } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: adresseDuSite(),
  title: { default: "HaqqReason", template: "%s · HaqqReason" },
  description: "Bibliothèque d'apologétique islamique : la véracité de l'islam, la défense de l'islam et la réfutation des autres croyances.",
  applicationName: "HaqqReason",
  appleWebApp: { capable: true, title: "HaqqReason", statusBarStyle: "black-translucent" },
  // Code de vérification Google Search Console (balise meta), facultatif.
  verification: process.env.GOOGLE_SITE_VERIFICATION?.trim() ? { google: process.env.GOOGLE_SITE_VERIFICATION.trim() } : undefined,
  keywords: ["islam", "apologétique", "véracité de l'islam", "défense de l'islam", "réfutation", "tawhid", "coran", "hadith", "sources"],
  openGraph: { type: "website", siteName: "HaqqReason", locale: "fr_FR" },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icones/icone-192.png", sizes: "192x192", type: "image/png" }], apple: "/icones/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0b1233",
  colorScheme: "dark light",
};

/** Applique le thème choisi avant le premier affichage, pour éviter tout clignotement. */
const SCRIPT_THEME = `try{var t=localStorage.getItem("hr-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Lire les en-têtes rend chaque page à la demande : indispensable pour le nonce de sécurité (CSP).
  const enTetes = await headers();
  const nonce = enTetes.get("x-nonce") ?? undefined;
  const manquantes = variablesManquantes();
  // Le compte connecté est inscrit sur la page : le navigateur sait tout de suite à qui sont les données.
  const compte = manquantes.length === 0 ? await compteCourant() : null;
  // Posé par le proxy, jamais par le navigateur : le créateur regarde le site comme un utilisateur.
  const vueUtilisateur = enTetes.get("x-vue-utilisateur") === "1";
  // L'offre Premium : en service ou non, abonné ou non (pour le badge doré et les cadenas).
  const premium = manquantes.length === 0 ? await attributsPremium(compte, vueUtilisateur) : {};

  return (
    <html
      lang="fr"
      data-theme="dark"
      data-comptes={googleConfigure() ? "1" : undefined}
      data-compte={compte?.id}
      data-compte-nom={compte?.nom}
      data-compte-email={compte?.email}
      data-vue={vueUtilisateur ? "utilisateur" : undefined}
      data-offre={premium.offre}
      data-premium={premium.premium}
      data-prix-mois={premium.prixMois}
      data-prix-annee={premium.prixAnnee}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} suppressHydrationWarning />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: SCRIPT_OUVERTURE }} suppressHydrationWarning />
        {/* L'atmosphère : trois nappes de lumière qui dérivent lentement, et un grain de vélin. */}
        <div className="atmosphere" aria-hidden="true">
          <span className="atmosphere-nappe" />
          <span className="atmosphere-nappe" />
          <span className="atmosphere-nappe" />
        </div>
        {vueUtilisateur && <BarreVueUtilisateur />}
        {compte && <Synchronisation />}
        {manquantes.length > 0 ? <InstallationRequise manquantes={manquantes} /> : children}
        {manquantes.length === 0 && <PaletteRecherche />}
        {premium.offre && <FenetrePremium />}
        <ServiceHorsLigne />
        {/* La porte de lumière lit sa durée dans les réglages, sans retenir l'affichage de la page. */}
        {manquantes.length === 0 && (
          <Suspense fallback={null}>
            <PortailRegle />
          </Suspense>
        )}
        {manquantes.length === 0 && <Ouverture />}
        {manquantes.length === 0 && <FilDOr />}
        <Lampe />
        <Mouvements />
      </body>
    </html>
  );
}
