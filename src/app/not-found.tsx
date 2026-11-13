import Link from "next/link";

export default function Introuvable() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-16">
      <h1 className="text-4xl font-extrabold">Cette page n&apos;existe pas</h1>
      <p className="mt-3 text-encre-douce">Le lien est peut-être incomplet, ou le contenu a été déplacé.</p>
      <Link href="/" className="bouton bouton-principal mt-8 self-start">
        Revenir à l&apos;accueil
      </Link>
    </main>
  );
}
