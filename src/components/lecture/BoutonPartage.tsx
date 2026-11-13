"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

/** Partage le lien de la page (menu de partage du téléphone, ou copie du lien sur ordinateur). */
export function BoutonPartage({ titre }: { titre: string }) {
  const [copie, setCopie] = useState(false);
  async function partager() {
    const url = window.location.href.split("#")[0].split("?")[0];
    if (navigator.share) {
      try {
        await navigator.share({ title: titre, url });
        return;
      } catch {
        /* partage annulé */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      window.prompt("Copie ce lien :", url);
    }
  }
  return (
    <button type="button" className="bouton bouton-discret !min-h-10 text-sm" onClick={() => void partager()}>
      {copie ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
      {copie ? "Lien copié" : "Partager"}
    </button>
  );
}
