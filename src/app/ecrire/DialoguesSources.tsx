"use client";

import type { Editor } from "@tiptap/core";
import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { libelleReference, lireReference, SOURATES, texteDeLaPlage } from "@/lib/atelier/coran";
import { degreDepuis, degreEnFrancais, RECUEILS } from "@/lib/atelier/hadiths";
import { chargerCoran } from "./coran-client";
import { Fenetre } from "./Fenetre";

/** Insérer un verset (ou une plage de versets) par sa référence : le texte arabe se remplit seul. */
export function DialogueVerset({ editor, surFermer }: { editor: Editor; surFermer: () => void }) {
  const [saisie, setSaisie] = useState("");
  const [numeros, setNumeros] = useState(true);
  const [coran, setCoran] = useState<string[][] | null>(null);
  const [erreurChargement, setErreurChargement] = useState("");
  useEffect(() => {
    let vivant = true;
    chargerCoran().then(
      (c) => vivant && setCoran(c.sourates),
      (e: Error) => vivant && setErreurChargement(e.message),
    );
    return () => {
      vivant = false;
    };
  }, []);
  const lu = useMemo(() => (saisie.trim() ? lireReference(saisie) : null), [saisie]);
  const reference = lu && !("erreur" in lu) ? lu : null;
  const texte = reference && coran ? texteDeLaPlage(coran, reference, numeros && reference.fin > reference.debut) : "";

  const inserer = () => {
    if (!reference || !texte) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: "verset",
        attrs: { reference: libelleReference(reference) },
        content: [{ type: "versetArabe", content: [{ type: "text", text: texte }] }, { type: "versetTraduction" }],
      })
      .run();
    surFermer();
  };

  return (
    <Fenetre
      titre="Verset par sa référence"
      sousTitre="2:255, 2:1-5, « Al-Baqara 255 »… Le texte arabe se remplit seul ; la traduction reste à toi."
      surFermer={surFermer}
      largeur={38}
      pied={
        <button type="button" className="bouton bouton-principal" disabled={!texte} onClick={inserer}>
          Insérer le verset
        </button>
      }
    >
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          inserer();
        }}
      >
        <input className="champ" value={saisie} onChange={(e) => setSaisie(e.target.value)} placeholder="2:255" aria-label="Référence du verset" autoFocus list="calame-sourates" />
        <datalist id="calame-sourates">
          {SOURATES.map((s, i) => (
            <option key={s} value={`${s} `}>
              {i + 1}
            </option>
          ))}
        </datalist>
        {lu && "erreur" in lu && <p className="inspecteur-aide" data-alerte="">{lu.erreur}</p>}
        {reference && reference.fin > reference.debut && (
          <label className="inspecteur-bascule">
            <input type="checkbox" checked={numeros} onChange={(e) => setNumeros(e.target.checked)} />
            <span>Numéroter chaque verset (۝)</span>
          </label>
        )}
        {erreurChargement && <p className="inspecteur-aide" data-alerte="">{erreurChargement}</p>}
        {reference && !coran && !erreurChargement && (
          <p className="inspecteur-aide">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Chargement du texte…
          </p>
        )}
        {texte && (
          <figure className="calame-apercu-verset">
            <p lang="ar" dir="rtl">
              {texte}
            </p>
            <figcaption>Coran, {libelleReference(reference!)}</figcaption>
          </figure>
        )}
        <p className="inspecteur-aide">Texte coranique : Tanzil.net (« Quran Simple »), reproduit sans modification.</p>
      </form>
    </Fenetre>
  );
}

type Hadith = { recueil: string; numero: number; texte: string; degres: { nom: string; degre: string }[]; chapitre: string; sahihParConsensus: boolean };

/** Insérer un hadith par son recueil et son numéro : texte arabe et degré quand il est connu. */
export function DialogueHadith({ editor, surFermer }: { editor: Editor; surFermer: () => void }) {
  const [recueil, setRecueil] = useState<string>("bukhari");
  const [numero, setNumero] = useState("");
  const [etat, setEtat] = useState<{ chargement: boolean; erreur: string; hadith: Hadith | null }>({ chargement: false, erreur: "", hadith: null });

  const chercher = async () => {
    const n = Number(numero);
    if (!Number.isInteger(n) || n < 1) {
      setEtat({ chargement: false, erreur: "Donne un numéro de hadith.", hadith: null });
      return;
    }
    setEtat({ chargement: true, erreur: "", hadith: null });
    try {
      const r = await fetch(`/api/calame/hadith?recueil=${encodeURIComponent(recueil)}&numero=${n}`);
      const d = (await r.json()) as Hadith & { erreur?: string };
      if (!r.ok || d.erreur) setEtat({ chargement: false, erreur: d.erreur ?? "Hadith introuvable.", hadith: null });
      else setEtat({ chargement: false, erreur: "", hadith: d });
    } catch {
      setEtat({ chargement: false, erreur: "Pas de connexion : le hadith n'a pas pu être cherché.", hadith: null });
    }
  };

  const h = etat.hadith;
  const degre = h ? degreDepuis(h.degres, h.sahihParConsensus) : "";
  const inserer = () => {
    if (!h) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: "hadith",
        attrs: { recueil: h.recueil, numero: String(h.numero), degre },
        content: [{ type: "hadithArabe", content: [{ type: "text", text: h.texte }] }, { type: "hadithTraduction" }],
      })
      .run();
    surFermer();
  };

  return (
    <Fenetre
      titre="Hadith par sa référence"
      sousTitre="Le recueil et le numéro : le texte arabe et le degré (quand il est connu) se remplissent seuls."
      surFermer={surFermer}
      largeur={40}
      pied={
        <button type="button" className="bouton bouton-principal" disabled={!h} onClick={inserer}>
          Insérer le hadith
        </button>
      }
    >
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void chercher();
        }}
      >
        <div className="flex gap-2">
          <select className="champ flex-1" value={recueil} onChange={(e) => setRecueil(e.target.value)} aria-label="Recueil">
            {RECUEILS.map((r) => (
              <option key={r.cle} value={r.cle}>
                {r.nom}
              </option>
            ))}
          </select>
          <input className="champ w-28" inputMode="numeric" value={numero} onChange={(e) => setNumero(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="n°" aria-label="Numéro du hadith" autoFocus />
          <button type="submit" className="bouton bouton-discret" disabled={etat.chargement}>
            {etat.chargement ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : "Chercher"}
          </button>
        </div>
        {etat.erreur && <p className="inspecteur-aide" data-alerte="">{etat.erreur}</p>}
        {h && (
          <figure className="calame-apercu-verset">
            <p lang="ar" dir="rtl">
              {h.texte}
            </p>
            <figcaption>
              {h.recueil}, n° {h.numero}
            </figcaption>
            {h.sahihParConsensus ? (
              <p className="inspecteur-aide">Recueil authentique (ṣaḥīḥ) par consensus.</p>
            ) : h.degres.length > 0 ? (
              <ul className="calame-degres">
                {h.degres.map((d) => (
                  <li key={d.nom}>
                    {d.nom} : {degreEnFrancais(d.degre)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="inspecteur-aide">Degré non renseigné pour ce hadith : à préciser.</p>
            )}
          </figure>
        )}
        <p className="inspecteur-aide">Texte arabe et degrés : fawazahmed0/hadith-api (domaine public).</p>
      </form>
    </Fenetre>
  );
}
