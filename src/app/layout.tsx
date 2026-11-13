import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "./globals.css";
import { InstallationRequise } from "@/components/InstallationRequise";
import { PaletteRecherche } from "@/components/PaletteRecherche";
import { ServiceHorsLigne } from "@/components/ServiceHorsLigne";
import { variablesManquantes } from "@/lib/env";
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
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const manquantes = variablesManquantes();

  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col antialiased">
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} suppressHydrationWarning />
        {manquantes.length > 0 ? <InstallationRequise manquantes={manquantes} /> : children}
        {manquantes.length === 0 && <PaletteRecherche />}
        <ServiceHorsLigne />
      </body>
    </html>
  );
}
