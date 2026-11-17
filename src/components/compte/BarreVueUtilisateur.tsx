import { Eye, PenLine } from "lucide-react";

/**
 * Affichée tout en haut de chaque page quand le créateur regarde le site « comme un utilisateur ».
 * C'est la seule différence avec ce que voit un visiteur. Le bouton est un lien ordinaire :
 * rentrer dans l'espace créateur quitte la vue (voir proxy.ts).
 */
export function BarreVueUtilisateur() {
  return (
    <div className="barre-vue sans-impression" role="status">
      <span className="barre-vue-texte">
        <Eye className="size-4 shrink-0" aria-hidden="true" />
        <span className="sm:hidden">Vue utilisateur</span>
        <span className="hidden sm:inline">Tu vois le site comme un utilisateur</span>
      </span>
      <a href="/createur" className="barre-vue-bouton">
        <PenLine className="size-4" aria-hidden="true" />
        Revenir au mode créateur
      </a>
    </div>
  );
}
