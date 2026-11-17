import type { Metadata } from "next";
import { listerBlocsAdmin } from "@/lib/contenu-admin";
import { exigerCreateur } from "@/lib/session";
import { EnTeteCreateur } from "../_composants/EnTeteCreateur";
import { GestionBloc } from "../_composants/GestionBloc";

export const metadata: Metadata = { title: "L'Islam authentique · Créateur", robots: { index: false } };

/** « L'Islam authentique » : un seul bloc, invisible, qui accueille directement les catégories créées ici. */
export default async function IslamCreateur() {
  await exigerCreateur();
  const [bloc] = await listerBlocsAdmin("islam");
  if (!bloc) {
    return (
      <>
        <EnTeteCreateur />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-6 sm:px-8">
          <p className="verre panneau max-w-2xl">Le module n&apos;est pas encore installé : lance la migration 012_islam_un_bloc.sql dans Supabase.</p>
        </main>
      </>
    );
  }
  return <GestionBloc bloc={bloc} />;
}
