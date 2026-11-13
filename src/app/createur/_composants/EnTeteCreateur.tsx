import Link from "next/link";
import { LayoutGrid, LogOut, Trash2, Wrench } from "lucide-react";
import { EnTete } from "@/components/EnTete";
import { seDeconnecter } from "../actions";

/** En-tête de toutes les pages de gestion du contenu. */
export function EnTeteCreateur() {
  return (
    <EnTete outils={false}>
      <nav aria-label="Mode créateur" className="flex items-center gap-1">
        <Link href="/createur" className="lien-nav" title="Espace créateur">
          <LayoutGrid className="size-5" aria-hidden="true" />
          <span className="hidden xl:inline">Espace</span>
        </Link>
        <Link href="/createur/outils" className="lien-nav" title="Outils : import, sauvegardes, qualité, statistiques, synonymes, modèles">
          <Wrench className="size-5" aria-hidden="true" />
          <span className="hidden xl:inline">Outils</span>
        </Link>
        <Link href="/createur/corbeille" className="lien-nav" title="Corbeille">
          <Trash2 className="size-5" aria-hidden="true" />
          <span className="hidden xl:inline">Corbeille</span>
        </Link>
        <form action={seDeconnecter}>
          <button type="submit" className="bouton-icone" aria-label="Se déconnecter" title="Se déconnecter">
            <LogOut className="size-5" aria-hidden="true" />
          </button>
        </form>
      </nav>
    </EnTete>
  );
}
