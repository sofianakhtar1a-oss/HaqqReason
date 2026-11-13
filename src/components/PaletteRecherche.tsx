"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Clock, LoaderCircle, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { memoriserRecherche, recherchesRecentes } from "@/lib/client/recherches-locales";
import type { Resultat } from "@/lib/recherche";
import { motsDeRequete } from "@/lib/recherche-texte";
import { Extrait, IconeResultat, lienResultat } from "./ResultatRecherche";

/*
 * Palette de recherche : Ctrl+K (ou Cmd+K sur Mac) depuis n'importe quelle page.
 * Résultats instantanés, navigation au clavier, accès rapide aux trois blocs.
 */

export const EVENEMENT_RECHERCHE = "haqqreason:recherche";

type Element = { cle: string; titre: string; sousTitre?: string; href: string; resultat?: Resultat };

const RACCOURCIS: Element[] = [
  { cle: "biblio", titre: "La bibliothèque", href: "/explorer" },
  { cle: "veracite", titre: "La véracité de l'islam", href: "/explorer/veracite-de-l-islam" },
  { cle: "defense", titre: "La défense de l'islam", href: "/explorer/defense-de-l-islam" },
  { cle: "refutation", titre: "La réfutation des autres croyances", href: "/explorer/refutation-des-autres-croyances" },
  { cle: "avancee", titre: "Recherche avancée (filtres)", href: "/recherche" },
];

export function PaletteRecherche() {
  const router = useRouter();
  const [ouverte, setOuverte] = useState(false);
  const [q, setQ] = useState("");
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [total, setTotal] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [actif, setActif] = useState(0);
  const [recentes, setRecentes] = useState<string[]>([]);
  const champ = useRef<HTMLInputElement>(null);
  const requete = useRef(0);

  const ouvrir = useCallback(() => {
    setRecentes(recherchesRecentes());
    setOuverte(true);
  }, []);

  useEffect(() => {
    const clavier = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (ouverte) setOuverte(false);
        else ouvrir();
      }
    };
    const evenement = () => ouvrir();
    window.addEventListener("keydown", clavier);
    window.addEventListener(EVENEMENT_RECHERCHE, evenement);
    return () => {
      window.removeEventListener("keydown", clavier);
      window.removeEventListener(EVENEMENT_RECHERCHE, evenement);
    };
  }, [ouverte, ouvrir]);

  useEffect(() => {
    if (ouverte) requestAnimationFrame(() => champ.current?.focus());
  }, [ouverte]);

  // Résultats instantanés (après une courte pause dans la frappe).
  useEffect(() => {
    const texte = q.trim();
    if (!ouverte || texte.length < 2) return;
    const numero = ++requete.current;
    const minuteur = setTimeout(async () => {
      setChargement(true);
      try {
        const reponse = await fetch(`/api/recherche?q=${encodeURIComponent(texte)}&limite=8`);
        const donnees = (await reponse.json()) as { resultats: Resultat[]; total: number };
        if (numero === requete.current) {
          setResultats(donnees.resultats);
          setTotal(donnees.total);
          setActif(0);
        }
      } catch {
        if (numero === requete.current) setResultats([]);
      } finally {
        if (numero === requete.current) setChargement(false);
      }
    }, 180);
    return () => clearTimeout(minuteur);
  }, [q, ouverte]);

  const texte = q.trim();
  const elements: Element[] =
    texte.length < 2
      ? [
          ...recentes.map((r) => ({ cle: `recente-${r}`, titre: r, sousTitre: "Recherche récente", href: `/recherche?q=${encodeURIComponent(r)}` })),
          ...RACCOURCIS,
        ]
      : [
          ...resultats.map((r) => ({ cle: `${r.type}-${r.id}-${r.page ?? ""}`, titre: r.titre, sousTitre: r.chemin, href: lienResultat(r, texte), resultat: r })),
          { cle: "tous", titre: total > resultats.length ? `Voir les ${total} résultats` : "Recherche avancée avec filtres", href: `/recherche?q=${encodeURIComponent(texte)}` },
        ];

  function aller(e: Element) {
    if (texte.length >= 2) memoriserRecherche(texte);
    setOuverte(false);
    setQ("");
    setResultats([]);
    router.push(e.href);
  }

  if (!ouverte) return null;
  const mots = motsDeRequete(texte);

  return (
    <div className="palette-fond" onMouseDown={(e) => e.target === e.currentTarget && setOuverte(false)}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Rechercher dans HaqqReason">
        <div className="flex items-center gap-3 border-b border-trait px-4">
          {chargement ? <LoaderCircle className="size-5 shrink-0 animate-spin text-or" aria-hidden="true" /> : <Search className="size-5 shrink-0 text-or" aria-hidden="true" />}
          <input
            ref={champ}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOuverte(false);
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActif((a) => Math.min(a + 1, elements.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActif((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && elements[actif]) {
                e.preventDefault();
                aller(elements[actif]);
              }
            }}
            className="min-h-14 flex-1 bg-transparent text-lg outline-none placeholder:text-encre-douce"
            placeholder="Rechercher un sujet, un verset, un mot arabe…"
            aria-label="Rechercher"
            aria-controls="palette-liste"
            aria-activedescendant={elements[actif] ? `palette-${actif}` : undefined}
            role="combobox"
            aria-expanded="true"
            maxLength={200}
          />
          <button type="button" className="bouton-icone" aria-label="Fermer" onClick={() => setOuverte(false)}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <ul id="palette-liste" role="listbox" className="overflow-y-auto p-2">
          {texte.length >= 2 && !chargement && resultats.length === 0 && (
            <li className="px-3 py-4 text-encre-douce">Aucun résultat pour « {texte} ». Essaie un autre mot, ou la recherche avancée.</li>
          )}
          {elements.map((e, i) => (
            <li
              key={e.cle}
              id={`palette-${i}`}
              role="option"
              aria-selected={i === actif}
              data-actif={i === actif}
              className="palette-element flex cursor-pointer gap-3 rounded-xl px-3 py-2.5"
              onMouseEnter={() => setActif(i)}
              onClick={() => aller(e)}
            >
              <span className="mt-0.5 text-encre-douce">
                {e.resultat ? <IconeResultat type={e.resultat.type} /> : e.cle.startsWith("recente") ? <Clock className="size-5" aria-hidden="true" /> : <ArrowRight className="size-5" aria-hidden="true" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  {e.titre}
                  {e.resultat?.type === "page" && <span className="ml-2 text-sm text-encre-douce">page {e.resultat.page}</span>}
                </span>
                {e.sousTitre && <span className="block truncate text-sm text-encre-douce">{e.sousTitre}</span>}
                {e.resultat?.fenetre && (
                  <span className="mt-1 block text-sm text-encre-douce">
                    <Extrait texte={e.resultat.fenetre} mots={mots} longueur={150} />
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-trait px-4 py-2 text-sm text-encre-douce">
          <kbd>↑</kbd> <kbd>↓</kbd> pour choisir, <kbd>Entrée</kbd> pour ouvrir, <kbd>Échap</kbd> pour fermer. Astuces : « phrase exacte », -exclure, trinité OU tawhid.
        </p>
      </div>
    </div>
  );
}

/** Bouton « Rechercher » des en-têtes : ouvre la palette. */
export function BoutonRecherche() {
  return (
    <button
      type="button"
      className="bouton bouton-discret !min-h-11 !px-3 sm:!px-4"
      onClick={() => window.dispatchEvent(new Event(EVENEMENT_RECHERCHE))}
      aria-label="Rechercher (Ctrl+K)"
      title="Rechercher (Ctrl+K)"
    >
      <Search className="size-5" aria-hidden="true" />
      <span className="hidden text-encre-douce md:inline">
        Rechercher <kbd>Ctrl K</kbd>
      </span>
    </button>
  );
}
