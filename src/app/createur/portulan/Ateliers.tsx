"use client";

import { Check, Globe2, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { CHAMPS_FICHE, type ChampFiche, NOMS_CHAMPS, type Nouveaute } from "@/lib/monde/edition";
import { actualiserPopulations, effacerNouveaute, enregistrerFiche, enregistrerPaysDuJour, lireFiche, marquerSignalement, publierNouveaute, retirerPaysDuJour, type Reponse } from "./actions";

/*
 * Les outils de l'atelier du Portulan (côté navigateur) : chacun appelle une action du serveur,
 * qui revérifie la session du créateur, et dit en clair ce qui s'est passé.
 */

type PaysCourt = { code: string; nom: string };

function Retour({ r }: { r: Reponse | null }) {
  if (!r) return null;
  return (
    <p className={`mt-3 text-sm ${r.ok ? "text-emeraude" : "text-danger"}`} role="status">
      {r.ok ? (r.message ?? "C'est fait.") : r.erreur}
    </p>
  );
}

/* ---------- Corriger une fiche sans toucher au code ---------- */

export function CorrecteurFiche({ pays }: { pays: PaysCourt[] }) {
  const [code, setCode] = useState("");
  const [origine, setOrigine] = useState<Partial<Record<ChampFiche, string>>>({});
  const [valeurs, setValeurs] = useState<Partial<Record<ChampFiche, string>>>({});
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const [enCours, demarrer] = useTransition();

  const choisir = (c: string) => {
    setCode(c);
    setReponse(null);
    if (!c) return;
    demarrer(async () => {
      const r = await lireFiche(c);
      if (!r.ok) return setReponse(r);
      setOrigine(r.origine);
      setValeurs(r.corrections);
    });
  };
  const enregistrer = (champs: Partial<Record<ChampFiche, string>>) =>
    demarrer(async () => {
      const r = await enregistrerFiche(code, champs as Record<string, string>);
      setReponse(r);
      if (r.ok) setValeurs(champs);
    });

  return (
    <div>
      <label className="etiquette" htmlFor="atelier-fiche">
        Le pays
      </label>
      <select id="atelier-fiche" className="champ mt-1" value={code} onChange={(e) => choisir(e.target.value)}>
        <option value="">Choisir un pays…</option>
        {pays.map((p) => (
          <option key={p.code} value={p.code}>
            {p.nom}
          </option>
        ))}
      </select>
      {code && (
        <form
          className="mt-5 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            enregistrer(valeurs);
          }}
        >
          {CHAMPS_FICHE.map((c) => (
            <label key={c} className="block">
              <span className="etiquette text-sm">
                {NOMS_CHAMPS[c]}
                {valeurs[c] ? <span className="ml-2 text-or">· corrigé</span> : null}
              </span>
              <textarea
                className="champ mt-1 min-h-20"
                value={valeurs[c] ?? ""}
                maxLength={600}
                placeholder={origine[c] ?? "Rien d'origine : écris le texte à montrer."}
                onChange={(e) => setValeurs((v) => ({ ...v, [c]: e.target.value }))}
              />
            </label>
          ))}
          <p className="text-sm text-encre-douce">Un champ vide garde le texte d&apos;origine (en grisé). Les joueurs voient la correction d&apos;ici une minute, sur la fiche et sur la page publique du pays.</p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="bouton bouton-principal" disabled={enCours}>
              {enCours ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
              Enregistrer la fiche
            </button>
            <button type="button" className="bouton bouton-discret" disabled={enCours || !Object.values(valeurs).some(Boolean)} onClick={() => enregistrer({})}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Revenir au texte d&apos;origine
            </button>
          </div>
        </form>
      )}
      <Retour r={reponse} />
    </div>
  );
}

/* ---------- Le pays du jour ---------- */

export type JourAtelier = { jour: string; libelle: string; tirage: PaysCourt; choisi: { code: string; nom: string; anecdote?: string } | null };

export function ChoixPaysDuJour({ jours, pays }: { jours: JourAtelier[]; pays: PaysCourt[] }) {
  const [jour, setJour] = useState(jours[0]?.jour ?? "");
  const [code, setCode] = useState("");
  const [anecdote, setAnecdote] = useState("");
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const [enCours, demarrer] = useTransition();
  return (
    <div>
      <ol className="grid gap-1.5">
        {jours.map((j) => (
          <li key={j.jour} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-trait py-2">
            <span className="w-36 shrink-0 text-sm text-encre-douce">{j.libelle}</span>
            <span className="min-w-0 flex-1">
              {j.choisi ? (
                <>
                  <strong>{j.choisi.nom}</strong> <span className="text-sm text-or">choisi</span>
                  {j.choisi.anecdote && <span className="block text-sm text-encre-douce">« {j.choisi.anecdote} »</span>}
                </>
              ) : (
                <span className="text-encre-douce">{j.tirage.nom} (tiré au sort)</span>
              )}
            </span>
            {j.choisi && (
              <button
                type="button"
                className="bouton bouton-discret !min-h-9 text-sm"
                disabled={enCours}
                onClick={() =>
                  demarrer(async () => {
                    setReponse(await retirerPaysDuJour(j.jour));
                  })
                }
              >
                Revenir au tirage
              </button>
            )}
          </li>
        ))}
      </ol>
      <form
        className="mt-5 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          demarrer(async () => {
            const r = await enregistrerPaysDuJour(jour, code, anecdote);
            setReponse(r);
            if (r.ok) setAnecdote("");
          });
        }}
      >
        <label className="block">
          <span className="etiquette text-sm">Le jour</span>
          <select className="champ mt-1" value={jour} onChange={(e) => setJour(e.target.value)}>
            {jours.map((j) => (
              <option key={j.jour} value={j.jour}>
                {j.libelle}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="etiquette text-sm">Le pays</span>
          <select className="champ mt-1" value={code} onChange={(e) => setCode(e.target.value)} required>
            <option value="">Choisir…</option>
            {pays.map((p) => (
              <option key={p.code} value={p.code}>
                {p.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="etiquette text-sm">Une anecdote à montrer ce jour-là (facultatif)</span>
          <textarea className="champ mt-1 min-h-20" value={anecdote} maxLength={400} onChange={(e) => setAnecdote(e.target.value)} />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="bouton bouton-principal" disabled={enCours || !code}>
            <Globe2 className="size-4" aria-hidden="true" />
            Choisir ce pays
          </button>
        </div>
      </form>
      <Retour r={reponse} />
    </div>
  );
}

/* ---------- Quoi de neuf ---------- */

export function Annonces({ liste, aujourdhui }: { liste: (Nouveaute & { origine: boolean })[]; aujourdhui: string }) {
  const [titre, setTitre] = useState("");
  const [texte, setTexte] = useState("");
  const [le, setLe] = useState(aujourdhui);
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const [enCours, demarrer] = useTransition();
  return (
    <div>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          demarrer(async () => {
            const r = await publierNouveaute(titre, texte, le);
            setReponse(r);
            if (r.ok) {
              setTitre("");
              setTexte("");
            }
          });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
          <label className="block">
            <span className="etiquette text-sm">Le titre</span>
            <input className="champ mt-1" value={titre} maxLength={90} onChange={(e) => setTitre(e.target.value)} required />
          </label>
          <label className="block">
            <span className="etiquette text-sm">La date</span>
            <input className="champ mt-1" type="date" value={le} onChange={(e) => setLe(e.target.value)} required />
          </label>
        </div>
        <label className="block">
          <span className="etiquette text-sm">Le texte (une ou deux phrases)</span>
          <textarea className="champ mt-1 min-h-20" value={texte} maxLength={400} onChange={(e) => setTexte(e.target.value)} />
        </label>
        <div>
          <button type="submit" className="bouton bouton-principal" disabled={enCours || !titre.trim()}>
            Publier la nouveauté
          </button>
        </div>
      </form>
      <Retour r={reponse} />
      <ol className="mt-6 grid gap-3">
        {liste.map((n) => (
          <li key={n.id} className="flex items-start gap-3 border-b border-trait pb-3">
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-encre-douce">
                {n.le}
                {n.origine ? " · d'origine" : ""}
              </span>
              <strong className="block">{n.titre}</strong>
              {n.texte && <span className="block text-sm text-encre-douce">{n.texte}</span>}
            </span>
            {!n.origine && (
              <button
                type="button"
                className="bouton bouton-discret !min-h-9 text-sm"
                aria-label={`Retirer « ${n.titre} »`}
                disabled={enCours}
                onClick={() =>
                  demarrer(async () => {
                    setReponse(await effacerNouveaute(n.id));
                  })
                }
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- Un signalement traité, ou rouvert ---------- */

export function BoutonSignalement({ id, traite }: { id: string; traite: boolean }) {
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState("");
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className="bouton bouton-discret !min-h-9 text-sm"
        disabled={enCours}
        onClick={() =>
          demarrer(async () => {
            const r = await marquerSignalement(id, !traite);
            setErreur(r.ok ? "" : r.erreur);
          })
        }
      >
        {traite ? "Rouvrir" : "Marquer comme traité"}
      </button>
      {erreur && <span className="text-sm text-danger">{erreur}</span>}
    </span>
  );
}

/* ---------- La population ---------- */

export function BoutonPopulation() {
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const [enCours, demarrer] = useTransition();
  return (
    <div>
      <button
        type="button"
        className="bouton bouton-discret"
        disabled={enCours}
        onClick={() =>
          demarrer(async () => {
            setReponse(await actualiserPopulations());
          })
        }
      >
        {enCours ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-4" aria-hidden="true" />}
        Relire la Banque mondiale maintenant
      </button>
      <Retour r={reponse} />
    </div>
  );
}
