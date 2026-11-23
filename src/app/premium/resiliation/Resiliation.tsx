"use client";

import { Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { rechargerDroits } from "@/lib/client/premium";

type Props = {
  titulaire: string;
  email: string;
  formule: string;
  prix: string;
  fin: string | null;
  dejaResilie: boolean;
};

const date = (iso: string | null) => (iso ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(iso)) : "la fin de la période payée");
const dateHeure = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(iso));

/**
 * Résilier en trois gestes : « Résilier mon contrat » (sur « Mon compte »), le récapitulatif ici,
 * puis « Confirmer la résiliation ». La confirmation se garde : elle se télécharge et s'imprime.
 */
export function Resiliation({ titulaire, email, formule, prix, fin, dejaResilie }: Props) {
  const router = useRouter();
  const [etape, setEtape] = useState<"recapitulatif" | "confirmation" | "fait">(dejaResilie ? "fait" : "recapitulatif");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [recu, setRecu] = useState<{ fin: string | null; le: string } | null>(null);

  const envoyer = async (vers: "resilier" | "reprendre") => {
    setEnvoi(true);
    setErreur("");
    try {
      const r = await fetch(`/api/premium/${vers}`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}" });
      const v = (await r.json().catch(() => ({}))) as { ok?: boolean; fin?: string | null; le?: string; message?: string };
      if (!r.ok || !v.ok) throw new Error(v.message ?? "La demande n'a pas abouti. Réessaie dans un moment.");
      await rechargerDroits(true);
      if (vers === "resilier") {
        setRecu({ fin: v.fin ?? fin, le: v.le ?? new Date().toISOString() });
        setEtape("fait");
      } else {
        router.push("/compte?abonnement=repris");
      }
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "La demande n'a pas abouti.");
    }
    setEnvoi(false);
  };

  const telecharger = () => {
    const le = recu?.le ?? new Date().toISOString();
    const texte = [
      "HaqqReason Premium — confirmation de résiliation",
      "",
      `Titulaire : ${titulaire}${email ? ` (${email})` : ""}`,
      `Abonnement : ${formule}, ${prix}`,
      `Résiliation demandée le : ${dateHeure(le)}`,
      `Fin de l'accès et des prélèvements : ${date(recu?.fin ?? fin)}`,
      "",
      "Plus aucun paiement ne sera prélevé après cette date. Tes documents et ta progression restent sur ton compte.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([texte], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "haqqreason-confirmation-resiliation.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (etape === "fait") {
    return (
      <section className="verre panneau mt-8" aria-labelledby="titre-confirme">
        <h2 id="titre-confirme" className="font-display text-2xl font-bold">
          Résiliation enregistrée
        </h2>
        <p className="mt-3 text-encre-douce">
          {recu ? `Demande enregistrée le ${dateHeure(recu.le)}. ` : ""}Ton accès Premium reste ouvert jusqu&apos;au {date(recu?.fin ?? fin)} ; plus rien ne sera prélevé ensuite.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="bouton bouton-discret" onClick={telecharger}>
            <Download className="size-5" aria-hidden="true" />
            Télécharger la confirmation
          </button>
          <button type="button" className="bouton bouton-discret" onClick={() => window.print()}>
            Imprimer
          </button>
          <button type="button" className="bouton bouton-principal" onClick={() => envoyer("reprendre")} disabled={envoi}>
            {envoi && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
            Finalement, garder mon abonnement
          </button>
        </div>
        <p className="mt-3 min-h-6 font-semibold text-danger" role="alert">
          {erreur}
        </p>
      </section>
    );
  }

  return (
    <section className="verre panneau mt-8" aria-labelledby="titre-recap">
      <h2 id="titre-recap" className="font-display text-2xl font-bold">
        Ton contrat
      </h2>
      <dl className="mt-4 grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-6">
        <dt className="font-semibold">Titulaire</dt>
        <dd className="text-encre-douce">
          {titulaire}
          {email && email !== titulaire ? ` (${email})` : ""}
        </dd>
        <dt className="font-semibold">Abonnement</dt>
        <dd className="text-encre-douce">
          HaqqReason Premium, {formule}, {prix}
        </dd>
        <dt className="font-semibold">Fin de l&apos;accès</dt>
        <dd className="text-encre-douce">{date(fin)} (la période déjà payée reste à toi)</dd>
      </dl>
      {etape === "recapitulatif" ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="bouton bouton-danger" onClick={() => setEtape("confirmation")}>
            Résilier mon contrat
          </button>
          <Link href="/compte" className="bouton bouton-discret">
            Garder mon abonnement
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <p className="font-semibold">Tu confirmes la résiliation ? Après le {date(fin)}, plus aucun paiement ne sera prélevé.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="bouton bouton-danger" onClick={() => envoyer("resilier")} disabled={envoi} autoFocus>
              {envoi && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
              Confirmer la résiliation
            </button>
            <button type="button" className="bouton bouton-discret" onClick={() => setEtape("recapitulatif")} disabled={envoi}>
              Revenir
            </button>
          </div>
        </div>
      )}
      <p className="mt-3 min-h-6 font-semibold text-danger" role="alert">
        {erreur}
      </p>
    </section>
  );
}
