import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CloudUpload, LogIn, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { CadreCreateur } from "@/components/CadreCreateur";
import { googleConfigure, retourSur } from "@/lib/compte/jeton";
import { compteCourant } from "@/lib/compte/session";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

const ERREURS: Record<string, string> = {
  annule: "La connexion a été annulée. Tu peux réessayer quand tu veux.",
  expire: "La demande de connexion a expiré. Réessaie : cela ne prend que quelques secondes.",
  google: "Google n'a pas confirmé ton identité. Vérifie que ton adresse est bien validée chez Google, puis réessaie.",
  base: "Le site n'a pas pu ouvrir ton compte pour l'instant. Réessaie dans un moment.",
  reglage: "La connexion avec Google n'est pas encore activée sur ce site.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PageConnexion({ searchParams }: Props) {
  const sp = await searchParams;
  const retour = retourSur(typeof sp.retour === "string" ? sp.retour : null);
  if (await compteCourant()) redirect(retour);
  const erreur = typeof sp.erreur === "string" ? ERREURS[sp.erreur] : undefined;
  const active = googleConfigure();

  return (
    <CadreCreateur>
      <h1 className="text-3xl font-extrabold">Connexion</h1>
      <p className="mt-3 text-encre-douce">
        Le mode utilisateur s&apos;ouvre avec ton compte Google. Tes documents, ta progression et tes favoris sont enregistrés sur ton compte, pas sur un seul appareil.
      </p>

      {erreur && (
        <p className="message message-erreur mt-5" role="alert">
          {erreur}
        </p>
      )}

      {active ? (
        // Un lien ordinaire : il mène au serveur, qui prépare la demande puis envoie chez Google.
        <a href={`/api/compte/google?retour=${encodeURIComponent(retour)}`} className="bouton bouton-principal mt-6 w-full">
          <LogIn className="size-5" aria-hidden="true" />
          Continuer avec Google
        </a>
      ) : (
        <Link href="/utilisateur" className="bouton bouton-principal mt-6 w-full">
          Ouvrir le mode utilisateur
        </Link>
      )}

      <ul className="mt-7 grid gap-4 text-[0.95rem] text-encre-douce">
        <li className="flex gap-3">
          <MonitorSmartphone className="mt-0.5 size-5 shrink-0 text-or" aria-hidden="true" />
          <span>Tu retrouves ton travail sur ton téléphone comme sur ton ordinateur.</span>
        </li>
        <li className="flex gap-3">
          <CloudUpload className="mt-0.5 size-5 shrink-0 text-or" aria-hidden="true" />
          <span>Changer d&apos;appareil ou vider ton navigateur n&apos;efface plus rien.</span>
        </li>
        <li className="flex gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-or" aria-hidden="true" />
          <span>Le site ne reçoit que ton nom et ton adresse e-mail. Il n&apos;a accès ni à tes e-mails, ni à tes fichiers Google, et ne connaît jamais ton mot de passe.</span>
        </li>
      </ul>

      <p className="mt-6 border-t border-trait pt-5 text-center text-encre-douce">
        Tu veux seulement lire ?{" "}
        <Link href="/explorer" className="font-semibold text-encre underline-offset-4 hover:underline">
          Ouvrir la bibliothèque
        </Link>
      </p>
    </CadreCreateur>
  );
}
