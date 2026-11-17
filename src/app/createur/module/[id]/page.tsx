import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { etatModule } from "@/lib/modules/donnees";
import { estModule, MODULES } from "@/lib/modules/modules";
import { exigerCreateur } from "@/lib/session";
import { EnTeteCreateur } from "../../_composants/EnTeteCreateur";
import { EditeurModule } from "./EditeurModule";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: estModule(id) ? `${MODULES[id].nom} · Créateur` : "Module", robots: { index: false } };
}

export default async function PageModule({ params }: Props) {
  await exigerCreateur();
  const { id } = await params;
  if (!estModule(id)) notFound();
  let etat;
  try {
    etat = await etatModule(id);
  } catch {
    return (
      <>
        <EnTeteCreateur />
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-10 sm:px-8">
          <h1 className="text-3xl font-extrabold">{MODULES[id].nom}</h1>
          <p className="message message-erreur mt-6">La base de données ne répond pas. Réessaie dans un instant.</p>
        </main>
      </>
    );
  }
  return (
    <>
      <EnTeteCreateur />
      <EditeurModule id={id} etatInitial={etat} />
    </>
  );
}
