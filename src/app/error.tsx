"use client";

export default function Erreur({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-16">
      <h1 className="text-4xl font-extrabold">Le serveur n&apos;a pas pu répondre</h1>
      <p className="mt-3 text-encre-douce">
        Réessaie dans un instant. Si l&apos;application vient d&apos;être installée, vérifie que le fichier SQL a bien
        été exécuté dans Supabase et que les clés Supabase sont correctes.
      </p>
      <button type="button" onClick={reset} className="bouton bouton-principal mt-8 self-start">
        Réessayer
      </button>
    </main>
  );
}
