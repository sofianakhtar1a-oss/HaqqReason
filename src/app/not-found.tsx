import { LienAccueil } from "@/components/LienAccueil";
import { Rosace } from "@/components/Rosace";
import { Ciel } from "@/components/scene/Ciel";

export default function Introuvable() {
  return (
    <main className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
      <Ciel nombre={24} graine={404} className="ciel-fixe" />
      {/* L'astrolabe a perdu le nord : son aiguille cherche, sans trouver. */}
      <div className="perdu apparait-doux" aria-hidden="true">
        <Rosace />
        <span className="perdu-aiguille" />
        <span className="perdu-code">404</span>
      </div>
      <h1 className="apparait mt-10 text-4xl font-extrabold" style={{ "--delai": "0.3s" } as React.CSSProperties}>
        Cette page n&apos;existe pas
      </h1>
      <p className="apparait mt-3 text-encre-douce" style={{ "--delai": "0.4s" } as React.CSSProperties}>
        L&apos;astrolabe a perdu le nord. Le lien est peut-être incomplet, ou le contenu a été déplacé.
      </p>
      <div className="apparait mt-8" style={{ "--delai": "0.5s" } as React.CSSProperties}>
        <LienAccueil className="bouton bouton-principal">Revenir à l&apos;accueil</LienAccueil>
      </div>
    </main>
  );
}
