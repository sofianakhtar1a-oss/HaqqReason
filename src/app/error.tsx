"use client";

import { Rosace } from "@/components/Rosace";
import { Ciel } from "@/components/scene/Ciel";

const delai = (s: number) => ({ "--delai": `${s}s` }) as React.CSSProperties;

export default function Erreur({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-16">
      <Ciel nombre={18} graine={503} className="ciel-fixe" />
      {/* L'astrolabe hésite, son aiguille bute : le serveur n'a pas répondu (voir .panne). */}
      <div className="perdu panne apparait-doux mb-8" aria-hidden="true">
        <Rosace />
        <span className="perdu-aiguille" />
      </div>
      <h1 className="apparait text-4xl font-extrabold" style={delai(0.2)}>
        Le serveur n&apos;a pas pu répondre
      </h1>
      <p className="apparait mt-3 text-encre-douce" style={delai(0.3)}>
        Réessaie dans un instant. Si l&apos;application vient d&apos;être installée, vérifie que le fichier SQL a bien
        été exécuté dans Supabase et que les clés Supabase sont correctes.
      </p>
      <button type="button" onClick={reset} className="apparait bouton bouton-principal mt-8 self-start" style={delai(0.4)}>
        Réessayer
      </button>
    </main>
  );
}
