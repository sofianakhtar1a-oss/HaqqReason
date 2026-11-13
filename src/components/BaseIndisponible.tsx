export function BaseIndisponible() {
  return (
    <div className="verre panneau mt-10 max-w-2xl">
      <h2 className="text-2xl font-bold">La base de données ne répond pas</h2>
      <p className="mt-3 text-encre-douce">
        Si l&apos;application vient d&apos;être installée, vérifie que le fichier <code>001_socle.sql</code> a bien été
        exécuté dans Supabase et que les trois clés Supabase sont correctes. Sinon, réessaie dans un instant.
      </p>
    </div>
  );
}
