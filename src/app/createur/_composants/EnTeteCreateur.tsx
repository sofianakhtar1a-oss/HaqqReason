import Link from "next/link";
import { Eye, LayoutGrid, LogOut, Trash2, Wrench } from "lucide-react";
import { EnTete } from "@/components/EnTete";
import { seDeconnecter } from "../actions";

/** En-tête de toutes les pages de gestion du contenu. */
export function EnTeteCreateur() {
  return (
    <EnTete outils={false} compte={false}>
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
        <form method="post" action="/createur/vue-utilisateur">
          <button type="submit" className="lien-nav" title="Voir le site exactement comme un utilisateur (un bouton en haut permet de revenir)">
            <Eye className="size-5" aria-hidden="true" />
            <span className="hidden whitespace-nowrap xl:inline">Vue utilisateur</span>
          </button>
        </form>
        <form action={seDeconnecter}>
          <button type="submit" className="bouton-icone" aria-label="Se déconnecter" title="Se déconnecter">
            <LogOut className="size-5" aria-hidden="true" />
          </button>
        </form>
      </nav>
    </EnTete>
  );
}
