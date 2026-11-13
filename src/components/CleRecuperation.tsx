"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { formaterCle, groupesDeCle, GROUPES_CLE } from "@/lib/recovery-key";

const RANGS = ["premier", "deuxième", "troisième", "quatrième", "cinquième"];

/**
 * Affiche la clé de récupération une seule et unique fois.
 * Le créateur doit prouver qu'il l'a notée (en ressaisissant un groupe tiré au hasard) avant de continuer.
 */
export function CleRecuperation({ cle, suite }: { cle: string; suite: string }) {
  const groupes = groupesDeCle(cle);
  const [rang] = useState(() => crypto.getRandomValues(new Uint32Array(1))[0] % GROUPES_CLE);
  const [saisie, setSaisie] = useState("");
  const confirme = saisie.trim().toUpperCase() === groupes[rang];
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  function telecharger() {
    const contenu = [
      "HaqqReason — Clé de récupération du mode créateur",
      `Générée le ${date}`,
      "",
      formaterCle(cle),
      "",
      "Cette clé permet de définir un nouveau mot de passe créateur si tu oublies l'actuel.",
      "Garde-la hors ligne, en lieu sûr. Ne la partage avec personne.",
      "Quiconque possède cette clé peut prendre le contrôle de HaqqReason.",
      "",
    ].join("\r\n");
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([contenu], { type: "text/plain;charset=utf-8" }));
    lien.download = "HaqqReason-cle-de-recuperation.txt";
    lien.click();
    URL.revokeObjectURL(lien.href);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Ta clé de récupération</h1>
      <p className="mt-3 text-encre-douce">
        Si tu oublies ton mot de passe, cette clé est le seul moyen de reprendre la main. Note-la ou imprime-la
        maintenant : elle ne sera plus jamais affichée.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2" aria-label={`Clé de récupération : ${groupes.join(" ")}`}>
        {groupes.map((groupe, i) => (
          <span key={i} className="cle-groupe">
            {groupe}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => window.print()} className="bouton bouton-discret flex-1">
          <Printer className="size-5" aria-hidden="true" />
          Imprimer
        </button>
        <button type="button" onClick={telecharger} className="bouton bouton-discret flex-1">
          <Download className="size-5" aria-hidden="true" />
          Télécharger
        </button>
      </div>

      <p className="message message-erreur mt-5">
        Range cette clé dans un endroit sûr, hors de ton téléphone et de ton ordinateur si possible. Personne, pas même
        l&apos;application, ne pourra te la redonner.
      </p>

      <div className="mt-6">
        <label htmlFor="verification-cle" className="etiquette">
          Pour continuer, saisis le {RANGS[rang]} groupe de la clé
        </label>
        <input
          id="verification-cle"
          className="champ uppercase tracking-[0.2em]"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          maxLength={4}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
        />
      </div>

      {confirme ? (
        <Link href={suite} className="bouton bouton-principal mt-5 w-full">
          J&apos;ai noté ma clé, continuer
        </Link>
      ) : (
        <button type="button" disabled className="bouton bouton-principal mt-5 w-full">
          J&apos;ai noté ma clé, continuer
        </button>
      )}

      {/* Feuille visible uniquement à l'impression */}
      <div className="feuille-impression" aria-hidden="true">
        <h2 style={{ fontSize: "22pt", margin: 0 }}>HaqqReason</h2>
        <p style={{ fontSize: "14pt" }}>Clé de récupération du mode créateur</p>
        <p>Générée le {date}</p>
        <p className="cle-imprimee">{formaterCle(cle)}</p>
        <p>Cette clé permet de définir un nouveau mot de passe créateur en cas d&apos;oubli.</p>
        <p>À conserver en lieu sûr. Ne jamais la partager, la photographier ou l&apos;envoyer par message.</p>
        <p>Quiconque possède cette clé peut prendre le contrôle de HaqqReason.</p>
      </div>
    </div>
  );
}
