"use client";

import { Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { toutesNouveautes } from "@/lib/monde/edition";
import { useEdition } from "@/lib/monde/edition-client";
import { localeInterface } from "./traduction";

/*
 * « Quoi de neuf » : ce qui a changé au Portulan, annoncé par le créateur depuis son atelier
 * (et les nouveautés d'origine). Un point doré tant que la dernière n'a pas été lue.
 */

const CLE_VU = "haqqreason-portulan-nouveautes-vu";
const abonnes = new Set<() => void>();
const lireVu = () => {
  try {
    return localStorage.getItem(CLE_VU) ?? "";
  } catch {
    return "";
  }
};
const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
};

const dateLongue = (jour: string) => new Intl.DateTimeFormat(localeInterface(), { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${jour}T12:00:00Z`));

export function QuoiDeNeuf() {
  const edition = useEdition();
  const liste = toutesNouveautes(edition?.nouveautes ?? []);
  const vu = useSyncExternalStore(abonner, lireVu, () => "x");
  const [ouvert, setOuvert] = useState(false);
  const derniere = liste[0];
  const fermer = useCallback(() => setOuvert(false), []);
  if (!derniere) return null;
  const neuf = vu !== derniere.id;
  const ouvrir = () => {
    setOuvert(true);
    try {
      localStorage.setItem(CLE_VU, derniere.id);
    } catch {
      // Stockage refusé : le point reviendra, rien de grave.
    }
    abonnes.forEach((f) => f());
  };
  return (
    <>
      <button type="button" className="pt-nouveau" onClick={ouvrir} data-neuf={neuf || undefined} aria-haspopup="dialog">
        <Sparkles className="size-4" aria-hidden="true" />
        <span className="pt-nouveau-quoi">Quoi de neuf</span>
        <span className="pt-nouveau-titre">{derniere.titre}</span>
        {neuf && <span className="pt-nouveau-point" aria-label="Pas encore lu" />}
      </button>
      {ouvert && createPortal(<PanneauNouveautes liste={liste} onFermer={fermer} />, document.body)}
    </>
  );
}

function PanneauNouveautes({ liste, onFermer }: { liste: ReturnType<typeof toutesNouveautes>; onFermer: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", touche);
    return () => {
      window.removeEventListener("keydown", touche);
      avant?.focus?.();
    };
  }, [onFermer]);
  return (
    <div className="pt pt-fenetre pt-nouveautes-fond" data-accent="safran" role="presentation" onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div ref={ref} className="pt-nouveautes" role="dialog" aria-modal="true" aria-labelledby="pt-nouveautes-titre">
        <div className="pt-nouveautes-tete">
          <h2 id="pt-nouveautes-titre" className="pt-nouveautes-titre">
            Quoi de neuf au Portulan
          </h2>
          <button type="button" className="pt-icone" onClick={onFermer} aria-label="Fermer">
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <ol className="pt-nouveautes-liste">
          {liste.map((n) => (
            <li key={n.id}>
              <time dateTime={n.le}>{dateLongue(n.le)}</time>
              <h3>{n.titre}</h3>
              {n.texte && <p>{n.texte}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
