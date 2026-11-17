"use client";

import { Check, CornerDownLeft, Eye, Flame, RotateCcw, Volume2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { composerSeance, type Exercice, melanger } from "@/lib/langues/exercices";
import { apercuDelai, cleJour, estDue, nouvelleCarte } from "@/lib/langues/srs";
import type { Element, Note } from "@/lib/langues/types";
import { type Resultat, verifier } from "@/lib/langues/verification";
import { parler, taire, voixDisponible } from "@/lib/langues/voix";
import { noter, useDonnees } from "./donnees";

/*
 * Une séance de révision, en plein écran.
 * Mode guidé : découverte des mots nouveaux, puis exercices variés choisis selon la mémoire de chaque mot.
 * Mode cartes : des cartes mémoire classiques, avec quatre réponses et le délai que chacune donnera.
 * Seule la première réponse d'un mot compte pour sa mémoire ; une erreur le fait revenir plus loin.
 */

export type Lancement = { titre: string; elements: Element[]; reserve?: Element[]; mode: "guidee" | "cartes"; libre?: boolean };

const NOTE: Record<Resultat, Note> = { juste: 3, presque: 2, faux: 1 };

function composer(l: Lancement, cartes: ReturnType<typeof useDonnees>["cartes"], libre: boolean): Exercice[] {
  const maintenant = Date.now();
  if (l.mode === "guidee") {
    let ex = composerSeance({ elements: l.elements, cartes, maintenant, reserve: l.reserve, libre, taille: libre ? 15 : 12 });
    // Sans voix sur l'appareil, l'exercice d'écoute devient un choix écrit.
    if (!voixDisponible()) ex = ex.map((e) => (e.type === "ecoute" ? { type: "qcm", cle: e.cle, el: e.el, sens: "en-fr", choix: e.choix, bonne: e.bonne } : e));
    return ex;
  }
  const dus = l.elements.filter((e) => estDue(cartes.get(e.id), maintenant));
  const nouveaux = l.elements.filter((e) => !cartes.get(e.id) || cartes.get(e.id)!.etat === "nouveau").slice(0, 8);
  const choisis = libre ? melanger(l.elements).slice(0, 20) : [...dus.slice(0, 20), ...nouveaux].slice(0, 20);
  return choisis.map((el) => ({ type: "carte", cle: `${el.id}:memoire`, el }));
}

type Bilan = { juste: number; presque: number; faux: number; nouveaux: number };

export function Seance({ lancement, onFermer }: { lancement: Lancement; onFermer: () => void }) {
  const { cartes } = useDonnees();
  const [libre, setLibre] = useState(Boolean(lancement.libre));
  const [file, setFile] = useState<Exercice[]>(() => composer(lancement, cartes, Boolean(lancement.libre)));
  const [i, setI] = useState(0);
  const [retour, setRetour] = useState<{ resultat: Resultat; attendu: string; donne?: string } | null>(null);
  const [bilan, setBilan] = useState<Bilan>({ juste: 0, presque: 0, faux: 0, nouveaux: 0 });
  const notes = useRef(new Map<string, Resultat>());
  const repris = useRef(new Set<string>());
  const racine = useRef<HTMLDivElement>(null);
  const [confirmer, setConfirmer] = useState(false);

  const ex = file[i];
  const fini = i >= file.length;
  const total = file.length;

  useEffect(() => {
    const avant = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    racine.current?.focus({ preventScroll: true });
    return () => {
      document.documentElement.style.overflow = avant;
      taire();
    };
  }, []);

  /** Note un mot (une seule fois par séance) ; une erreur le remet dans la file. */
  const compter = useCallback(
    (el: Element, r: Resultat, note?: Note) => {
      if (!notes.current.has(el.id)) {
        notes.current.set(el.id, r);
        const avant = cartes.get(el.id);
        noter(el.id, note ?? NOTE[r]);
        setBilan((b) => ({ ...b, [r]: b[r] + 1, nouveaux: b.nouveaux + (!avant || avant.etat === "nouveau" ? 1 : 0) }));
      }
      if (r === "faux" && !repris.current.has(el.id) && lancement.mode === "guidee") {
        repris.current.add(el.id);
        const choix = file.find((e) => e.type === "qcm" && e.el.id !== el.id && e.sens === "en-fr");
        const leurres = choix && choix.type === "qcm" ? choix.choix.filter((c) => c !== el.fr).slice(0, 3) : [];
        const reprise: Exercice =
          leurres.length >= 2
            ? { type: "qcm", cle: `${el.id}:reprise`, el, sens: "en-fr", bonne: el.fr, choix: melanger([el.fr, ...leurres]) }
            : { type: "ecriture", cle: `${el.id}:reprise`, el };
        setFile((f) => {
          const n = [...f];
          n.splice(Math.min(n.length, i + 4), 0, reprise);
          return n;
        });
      }
    },
    [cartes, file, i, lancement.mode],
  );

  const repondre = useCallback(
    (el: Element, r: Resultat, attendu: string, donne?: string) => {
      compter(el, r);
      setRetour({ resultat: r, attendu, donne });
      if (r !== "juste") void parler(el.en);
    },
    [compter],
  );

  const suivant = useCallback(() => {
    setRetour(null);
    setI((n) => n + 1);
  }, []);

  // Entrée pour continuer, Échap pour quitter.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (fini || i === 0) onFermer();
        else setConfirmer((c) => !c);
      } else if (e.key === "Enter" && retour) {
        e.preventDefault();
        suivant();
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [fini, i, onFermer, retour, suivant]);

  const recommencer = (enLibre: boolean) => {
    notes.current.clear();
    repris.current.clear();
    setLibre(enLibre);
    setFile(composer({ ...lancement }, cartes, enLibre));
    setI(0);
    setRetour(null);
    setBilan({ juste: 0, presque: 0, faux: 0, nouveaux: 0 });
  };

  const avancement = total ? Math.min(1, (i + (retour ? 1 : 0)) / total) : 0;

  return createPortal(
    <div ref={racine} className="lg lg-seance" role="dialog" aria-modal="true" aria-label={`Séance : ${lancement.titre}`} tabIndex={-1} data-accent="azur">
      <header className="lg-seance-tete">
        <button type="button" className="bouton-icone" aria-label="Quitter la séance" onClick={() => (fini || i === 0 ? onFermer() : setConfirmer(true))}>
          <X className="size-5" aria-hidden="true" />
        </button>
        <div className="lg-seance-barre" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(i, total)} aria-label="Avancement de la séance">
          <span style={{ transform: `scaleX(${fini ? 1 : avancement})` }} />
        </div>
        <span className="lg-seance-compte">{fini ? total : Math.min(i + 1, total)}/{total}</span>
      </header>

      <main className="lg-seance-scene">
        {total === 0 ? (
          <Vide titre={lancement.titre} onLibre={() => recommencer(true)} onFermer={onFermer} />
        ) : fini ? (
          <Fin bilan={bilan} libre={libre} onEncore={() => recommencer(libre)} onFermer={onFermer} />
        ) : (
          <div key={`${ex.cle}:${i}`} className="lg-exercice">
            {ex.type === "carte" && lancement.mode === "guidee" && <Decouverte el={ex.el} onSuivant={suivant} />}
            {ex.type === "carte" && lancement.mode === "cartes" && (
              <CarteMemoire
                el={ex.el}
                onNote={(n) => {
                  compter(ex.el, n === 1 ? "faux" : n === 2 ? "presque" : "juste", n);
                  suivant();
                }}
              />
            )}
            {ex.type === "qcm" && <Choix ex={ex} retour={retour} onRepondre={repondre} />}
            {ex.type === "ecoute" && <Choix ex={ex} retour={retour} onRepondre={repondre} />}
            {ex.type === "trou" && <Choix ex={ex} retour={retour} onRepondre={repondre} />}
            {ex.type === "ecriture" && <Ecriture el={ex.el} retour={retour} onRepondre={repondre} />}
            {ex.type === "paires" && (
              <Paires
                els={ex.els}
                onFini={(erreurs) => {
                  ex.els.forEach((el) => compter(el, erreurs.has(el.id) ? "faux" : "juste"));
                  setRetour({ resultat: erreurs.size ? "presque" : "juste", attendu: "" });
                }}
              />
            )}
          </div>
        )}
      </main>

      {retour && !fini && ex && <Retour retour={retour} el={ex.type === "paires" ? null : ex.el} onSuivant={suivant} />}

      {confirmer && (
        <div className="lg-confirmer" role="alertdialog" aria-label="Quitter la séance ?">
          <div className="lg-confirmer-carte">
            <p className="font-display text-xl font-bold">Quitter la séance ?</p>
            <p className="mt-1 text-encre-douce">Les réponses déjà données sont gardées.</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" className="bouton" onClick={() => setConfirmer(false)}>
                Continuer
              </button>
              <button type="button" className="bouton bouton-principal" onClick={onFermer}>
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

/* ---------- Les morceaux de la séance ---------- */

function Ecouter({ texte, grand, auto }: { texte: string; grand?: boolean; auto?: boolean }) {
  const [parle, setParle] = useState(false);
  const dire = useCallback(() => {
    setParle(true);
    void parler(texte).then(() => setParle(false));
  }, [texte]);
  useEffect(() => {
    if (!auto) return;
    const m = setTimeout(dire, 250);
    return () => clearTimeout(m);
  }, [auto, dire]);
  if (!voixDisponible()) return null;
  return (
    <button type="button" className={grand ? "lg-ecoute-grand" : "lg-ecoute"} data-parle={parle || undefined} onClick={dire} aria-label={`Écouter « ${texte} »`}>
      <Volume2 className={grand ? "size-9" : "size-4"} aria-hidden="true" />
    </button>
  );
}

function Mot({ el, taille = "grand" }: { el: Element; taille?: "grand" | "moyen" }) {
  return (
    <div className="lg-mot" data-taille={taille}>
      <p className="lg-mot-en" lang="en">
        {el.en}
      </p>
      <p className="lg-mot-infos">
        {el.api && <span lang="en">{el.api}</span>}
        {el.nature && <span>{el.nature}</span>}
        <Ecouter texte={el.en} />
      </p>
    </div>
  );
}

function Exemple({ el }: { el: Element }) {
  if (!el.exEn) return null;
  return (
    <figure className="lg-exemple">
      <blockquote lang="en">
        {el.exEn}
        <Ecouter texte={el.exEn} />
      </blockquote>
      {el.exFr && <figcaption>{el.exFr}</figcaption>}
    </figure>
  );
}

function Decouverte({ el, onSuivant }: { el: Element; onSuivant: () => void }) {
  useEffect(() => {
    const t = (e: KeyboardEvent) => e.key === "Enter" && (e.preventDefault(), onSuivant());
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, [onSuivant]);
  useEffect(() => void parler(el.en), [el.en]);
  return (
    <>
      <p className="lg-consigne">Nouveau mot</p>
      <div className="lg-fiche">
        <Mot el={el} />
        <p className="lg-fiche-fr">{el.fr}</p>
        <Exemple el={el} />
      </div>
      <div className="lg-actions-bas">
        <button type="button" className="bouton bouton-principal lg-continuer" onClick={onSuivant} autoFocus>
          Je l&apos;ai noté
          <CornerDownLeft className="size-4 opacity-70" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

function CarteMemoire({ el, onNote }: { el: Element; onNote: (n: Note) => void }) {
  const { cartes } = useDonnees();
  const [retournee, setRetournee] = useState(false);
  const [maintenant] = useState(() => Date.now());
  const carte = cartes.get(el.id) ?? nouvelleCarte(el.id, maintenant);
  const reponses: { n: Note; nom: string; touche: string }[] = [
    { n: 1, nom: "À revoir", touche: "1" },
    { n: 2, nom: "Difficile", touche: "2" },
    { n: 3, nom: "Bien", touche: "3" },
    { n: 4, nom: "Facile", touche: "4" },
  ];
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      if (!retournee && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRetournee(true);
      } else if (retournee && ["1", "2", "3", "4"].includes(e.key)) onNote(Number(e.key) as Note);
    };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, [onNote, retournee]);
  useEffect(() => void parler(el.en), [el.en]);
  return (
    <>
      <p className="lg-consigne">{retournee ? "Tu le savais ?" : "Que veut dire ce mot ?"}</p>
      <button type="button" className="lg-carte3d" data-retournee={retournee || undefined} onClick={() => setRetournee(true)} aria-label={retournee ? undefined : "Retourner la carte"} disabled={retournee}>
        <span className="lg-carte3d-face">
          <Mot el={el} />
          <span className="lg-carte3d-aide">
            <Eye className="size-4" aria-hidden="true" />
            Touche pour retourner
          </span>
        </span>
        <span className="lg-carte3d-face lg-carte3d-dos">
          <span className="lg-mot-en lg-mot-petit" lang="en">
            {el.en}
          </span>
          <span className="lg-fiche-fr">{el.fr}</span>
          {el.exEn && (
            <span className="lg-exemple lg-exemple-dos">
              <span lang="en">{el.exEn}</span>
              {el.exFr && <small>{el.exFr}</small>}
            </span>
          )}
        </span>
      </button>
      <div className="lg-actions-bas">
        {retournee ? (
          <div className="lg-notes">
            {reponses.map((r) => (
              <button key={r.n} type="button" className="lg-note" data-note={r.n} onClick={() => onNote(r.n)}>
                <span>{r.nom}</span>
                <small>{apercuDelai(carte, r.n, maintenant)}</small>
              </button>
            ))}
          </div>
        ) : (
          <button type="button" className="bouton bouton-principal lg-continuer" onClick={() => setRetournee(true)} autoFocus>
            Retourner
          </button>
        )}
      </div>
    </>
  );
}

type ExChoix = Extract<Exercice, { type: "qcm" | "ecoute" | "trou" }>;

function Choix({ ex, retour, onRepondre }: { ex: ExChoix; retour: { resultat: Resultat } | null; onRepondre: (el: Element, r: Resultat, attendu: string, donne?: string) => void }) {
  const [choisi, setChoisi] = useState<string | null>(null);
  const choisir = useCallback(
    (c: string) => {
      if (choisi !== null) return;
      setChoisi(c);
      onRepondre(ex.el, c === ex.bonne ? "juste" : "faux", ex.bonne, c);
    },
    [choisi, ex, onRepondre],
  );
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= ex.choix.length && !(e.target as HTMLElement).closest("input")) choisir(ex.choix[n - 1]);
    };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, [choisir, ex.choix]);

  const versLAnglais = ex.type === "trou" || (ex.type === "qcm" && ex.sens === "fr-en");
  return (
    <>
      {ex.type === "qcm" && ex.sens === "en-fr" && (
        <>
          <p className="lg-consigne">Choisis la traduction</p>
          <Mot el={ex.el} />
        </>
      )}
      {ex.type === "qcm" && ex.sens === "fr-en" && (
        <>
          <p className="lg-consigne">Comment dit-on, en anglais…</p>
          <p className="lg-question-fr">{ex.el.fr}</p>
        </>
      )}
      {ex.type === "ecoute" && (
        <>
          <p className="lg-consigne">Écoute, puis choisis le sens</p>
          <Ecouter texte={ex.el.en} grand auto />
          <p className="lg-ecoute-revele" lang="en" data-visible={retour ? "" : undefined}>
            {retour ? ex.el.en : " "}
          </p>
        </>
      )}
      {ex.type === "trou" && (
        <>
          <p className="lg-consigne">Complète la phrase</p>
          <p className="lg-trou" lang="en">
            {ex.avant}
            <span className="lg-trou-vide" data-rempli={choisi !== null || undefined}>
              {choisi !== null ? ex.bonne : " "}
            </span>
            {ex.apres}
          </p>
          {ex.el.exFr && <p className="lg-trou-fr">{ex.el.exFr}</p>}
        </>
      )}
      <div className="lg-choix" data-anglais={versLAnglais || undefined}>
        {ex.choix.map((c, k) => (
          <button
            key={c}
            type="button"
            className="lg-choix-bouton"
            lang={versLAnglais ? "en" : "fr"}
            disabled={choisi !== null}
            data-etat={choisi === null ? undefined : c === ex.bonne ? "bonne" : c === choisi ? "fausse" : "autre"}
            onClick={() => choisir(c)}
          >
            <kbd aria-hidden="true">{k + 1}</kbd>
            <span>{c}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function Ecriture({ el, retour, onRepondre }: { el: Element; retour: { resultat: Resultat } | null; onRepondre: (el: Element, r: Resultat, attendu: string, donne?: string) => void }) {
  const [valeur, setValeur] = useState("");
  const [indice, setIndice] = useState(0);
  const champ = useRef<HTMLInputElement>(null);
  useEffect(() => champ.current?.focus(), []);
  const sans = el.en.replace(/^to /, "");
  const valider = () => {
    if (retour || !valeur.trim()) return;
    const r = verifier(valeur, el.en);
    onRepondre(el, indice > 1 && r === "juste" ? "presque" : r, el.en, valeur);
  };
  return (
    <>
      <p className="lg-consigne">Écris en anglais</p>
      <p className="lg-question-fr">{el.fr}</p>
      {el.nature && <p className="lg-question-nature">{el.nature}</p>}
      <form
        className="lg-ecriture"
        onSubmit={(e) => {
          e.preventDefault();
          valider();
        }}
      >
        <input
          ref={champ}
          className="lg-ecriture-champ"
          lang="en"
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          readOnly={Boolean(retour)}
          data-resultat={retour?.resultat}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={indice ? `${sans.slice(0, indice)}${"·".repeat(Math.max(0, sans.length - indice))}` : "Ta réponse"}
          aria-label="Ta réponse en anglais"
          enterKeyHint="done"
        />
        {!retour && (
          <div className="lg-ecriture-actions">
            <button type="button" className="bouton" onClick={() => setIndice((n) => Math.min(sans.length - 1, n + 1))} disabled={indice >= sans.length - 1}>
              Un indice
            </button>
            <button type="submit" className="bouton bouton-principal" disabled={!valeur.trim()}>
              Vérifier
            </button>
          </div>
        )}
      </form>
    </>
  );
}

function Paires({ els, onFini }: { els: Element[]; onFini: (erreurs: Set<string>) => void }) {
  const droite = useMemo(() => melanger(els), [els]);
  const [gauche, setGauche] = useState<string | null>(null);
  const [trouves, setTrouves] = useState<Set<string>>(new Set());
  const [secoue, setSecoue] = useState<string | null>(null);
  const erreurs = useRef(new Set<string>());
  const essayer = (idG: string | null, idD: string | null) => {
    if (!idG || !idD) return;
    if (idG === idD) {
      const n = new Set(trouves).add(idG);
      setTrouves(n);
      setGauche(null);
      if (n.size === els.length) onFini(erreurs.current);
    } else {
      erreurs.current.add(idG);
      erreurs.current.add(idD);
      setSecoue(`${idG}|${idD}`);
      setTimeout(() => setSecoue(null), 450);
      setGauche(null);
    }
  };
  return (
    <>
      <p className="lg-consigne">Associe chaque mot à sa traduction</p>
      <div className="lg-paires">
        <div className="lg-paires-col">
          {els.map((el) => (
            <button
              key={el.id}
              type="button"
              lang="en"
              className="lg-paire"
              aria-pressed={gauche === el.id}
              disabled={trouves.has(el.id)}
              data-trouve={trouves.has(el.id) || undefined}
              data-secoue={secoue?.split("|")[0] === el.id || undefined}
              onClick={() => {
                setGauche(el.id);
                void parler(el.en);
              }}
            >
              {el.en}
            </button>
          ))}
        </div>
        <div className="lg-paires-col">
          {droite.map((el) => (
            <button
              key={el.id}
              type="button"
              className="lg-paire"
              disabled={trouves.has(el.id) || !gauche}
              data-trouve={trouves.has(el.id) || undefined}
              data-secoue={secoue?.split("|")[1] === el.id || undefined}
              onClick={() => essayer(gauche, el.id)}
            >
              {el.fr}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

const TITRES: Record<Resultat, string> = { juste: "Exact !", presque: "Presque !", faux: "Pas tout à fait" };

function Retour({ retour, el, onSuivant }: { retour: { resultat: Resultat; attendu: string; donne?: string }; el: Element | null; onSuivant: () => void }) {
  const bouton = useRef<HTMLButtonElement>(null);
  useEffect(() => bouton.current?.focus({ preventScroll: true }), []);
  return (
    <div className="lg-retour" data-resultat={retour.resultat} role="status">
      <div className="lg-retour-corps">
        <span className="lg-retour-icone" aria-hidden="true">
          {retour.resultat === "faux" ? <X className="size-5" /> : <Check className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="lg-retour-titre">{TITRES[retour.resultat]}</p>
          {el && retour.resultat !== "juste" && (
            <p className="lg-retour-texte">
              {retour.resultat === "presque" ? "Orthographe exacte : " : "La réponse : "}
              <strong lang={retour.attendu === el.fr ? "fr" : "en"}>{retour.attendu}</strong>
              <span className="text-encre-douce" lang={retour.attendu === el.fr ? "en" : "fr"}>
                {" "}
                · {retour.attendu === el.fr ? el.en : el.fr}
              </span>
            </p>
          )}
          {el?.exEn && retour.resultat !== "juste" && (
            <p className="lg-retour-exemple" lang="en">
              {el.exEn}
            </p>
          )}
        </div>
        <button ref={bouton} type="button" className="bouton bouton-principal lg-continuer" onClick={onSuivant}>
          Continuer
          <CornerDownLeft className="size-4 opacity-70" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function Vide({ titre, onLibre, onFermer }: { titre: string; onLibre: () => void; onFermer: () => void }) {
  return (
    <div className="lg-fin">
      <Check className="lg-fin-icone size-12" strokeWidth={1.3} aria-hidden="true" />
      <p className="font-display text-3xl font-bold">Rien à revoir pour l&apos;instant</p>
      <p className="mx-auto mt-2 max-w-[40ch] text-encre-douce">Les mots de « {titre} » reviendront quand ta mémoire commencera à les oublier. Tu peux tout de même t&apos;entraîner librement.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <button type="button" className="bouton" onClick={onFermer}>
          Revenir
        </button>
        <button type="button" className="bouton bouton-principal" onClick={onLibre} autoFocus>
          <RotateCcw className="size-4" aria-hidden="true" />
          M&apos;entraîner quand même
        </button>
      </div>
    </div>
  );
}

function Fin({ bilan, libre, onEncore, onFermer }: { bilan: Bilan; libre: boolean; onEncore: () => void; onFermer: () => void }) {
  const total = bilan.juste + bilan.presque + bilan.faux;
  const taux = total ? Math.round(((bilan.juste + bilan.presque * 0.5) / total) * 100) : 0;
  const { journal } = useDonnees();
  const [jour] = useState(() => cleJour(Date.now()));
  const auj = journal.get(jour)?.revues ?? 0;
  return (
    <div className="lg-fin">
      <div className="lg-fin-anneau" style={{ ["--taux" as string]: `${taux}%` }} role="img" aria-label={`${taux} % de réussite`}>
        <span>{taux}%</span>
      </div>
      <p className="font-display text-3xl font-bold">{taux >= 85 ? "Superbe séance" : taux >= 60 ? "Belle séance" : "Séance utile"}</p>
      <p className="mx-auto mt-2 max-w-[44ch] text-encre-douce">
        {total} mot{total > 1 ? "s" : ""} révisé{total > 1 ? "s" : ""}
        {bilan.nouveaux ? `, dont ${bilan.nouveaux} nouveau${bilan.nouveaux > 1 ? "x" : ""}` : ""}. {bilan.faux ? "Les mots manqués reviendront dès demain." : "Ils reviendront juste avant que tu ne les oublies."}
      </p>
      <dl className="lg-fin-chiffres">
        <div>
          <dt>Justes</dt>
          <dd>{bilan.juste}</dd>
        </div>
        <div>
          <dt>Presque</dt>
          <dd>{bilan.presque}</dd>
        </div>
        <div>
          <dt>À revoir</dt>
          <dd>{bilan.faux}</dd>
        </div>
        <div>
          <dt>
            <Flame className="inline size-3.5" aria-hidden="true" /> Aujourd&apos;hui
          </dt>
          <dd>{auj}</dd>
        </div>
      </dl>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <button type="button" className="bouton" onClick={onEncore}>
          <RotateCcw className="size-4" aria-hidden="true" />
          {libre ? "Encore un tour" : "Une autre séance"}
        </button>
        <button type="button" className="bouton bouton-principal" onClick={onFermer} autoFocus>
          Terminer
        </button>
      </div>
    </div>
  );
}
