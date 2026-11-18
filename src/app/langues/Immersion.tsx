"use client";

import { ArrowLeft, Captions, FileUp, ListVideo, Maximize2, Mic2, Type, MousePointerClick, Pause, Play, Repeat, SkipBack, SkipForward } from "lucide-react";
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dureeLisible } from "@/lib/alambic/transcription/exports";
import { analyserPhrase } from "@/lib/alambic/transcription/client";
import { motA, phraseA } from "@/lib/alambic/transcription/phrases";
import { type Analyse, type Phrase, texteDe, type Transcription } from "@/lib/alambic/transcription/types";
import { avancee, horodaterTraduction } from "@/lib/langues/karaoke";
import { ecrire, ecrireBlob, lireBlob, type MediaLangue } from "@/lib/langues/stockage";
import { type Controle, controleElement, controleVide, controleYoutube, Horloge } from "../alambic/transcription/controle";
import type { Cible } from "../alambic/transcription/Glose";
import { useTraductions } from "../alambic/transcription/useTraductions";
import { GloseMot } from "./GloseMot";

/*
 * L'immersion : la vidéo au centre, la phrase dite en grand juste dessous, mot par mot.
 * Toucher un mot met en pause et le traduit dans sa phrase ; la phrase entière se traduit en français.
 * Le texte complet suit la voix, et chaque phrase y ramène.
 */

/**
 * Sous-titres : « source » (la langue de la vidéo, un mot touché se traduit), « deux » (la phrase et sa traduction dessous),
 * « traduction » (uniquement la traduction).
 */
type Affichage = "source" | "deux" | "traduction";
/** Karaoké : quelles lignes s'allument mot à mot (la langue de la vidéo, sa traduction, les deux, aucune). */
type Karaoke = "source" | "traduction" | "deux" | "aucun";
type Reglages = { affichage: Affichage; karaoke: Karaoke; pauseAuMot: boolean; boucle: boolean; vitesse: number; texte: boolean; taille: number; tailleSt: number };
const CLE = "haqqreason-truchement-immersion";
const VITESSES = [0.75, 0.9, 1];
const TAILLE_MIN = 35;
const TAILLE_ST_MIN = 60;
const TAILLE_ST_MAX = 180;

function reglagesInitiaux(): Reglages {
  const defaut: Reglages = { affichage: "deux", karaoke: "deux", pauseAuMot: true, boucle: false, vitesse: 1, texte: true, taille: 100, tailleSt: 100 };
  try {
    const lu = JSON.parse(localStorage.getItem(CLE) ?? "{}") as Partial<Reglages> & { francais?: boolean };
    // Réglage d'avant : « Français » coché ou non.
    const affichage: Affichage = lu.affichage ?? (lu.francais === false ? "source" : "deux");
    const taille = Math.min(100, Math.max(TAILLE_MIN, Number(lu.taille) || 100));
    const tailleSt = Math.min(TAILLE_ST_MAX, Math.max(TAILLE_ST_MIN, Number(lu.tailleSt) || 100));
    const karaoke: Karaoke = (["source", "traduction", "deux", "aucun"] as const).includes(lu.karaoke as Karaoke) ? (lu.karaoke as Karaoke) : "deux";
    return { ...defaut, ...lu, affichage, karaoke, taille, tailleSt, boucle: false };
  } catch {
    return defaut;
  }
}

const NOM_LANGUE = { en: "Anglais", fr: "Français" } as const;

type Media = { type: "fichier"; url: string; video: boolean } | { type: "youtube"; id: string } | null;

export function Immersion({ media: m, onFermer }: { media: MediaLangue; onFermer: () => void }) {
  const t = m;
  const dernier = useRef<MediaLangue>(m);
  const [media, setMedia] = useState<Media>(() => (m.source.type === "youtube" ? { type: "youtube", id: m.source.id } : null));
  const [reglages, setReglages] = useState<Reglages>(reglagesInitiaux);
  const controleRef = useRef<Controle>(controleVide);
  const [controle, setControle] = useState<Controle>(controleVide);
  const [horloge] = useState(() => new Horloge(controleRef));
  const [actif, setActif] = useState({ phrase: -1, mot: -1, tr: -1 });
  const actifRef = useRef(actif);
  // Les deux lignes de sous-titres : l'horloge y règle l'avancée du mot en cours (--k), sans rendu React.
  const ligneSource = useRef<HTMLParagraphElement>(null);
  const ligneTr = useRef<HTMLParagraphElement>(null);
  const phTrRef = useRef<Phrase | null>(null);
  const [lecture, setLecture] = useState(false);
  const [glose, setGlose] = useState<Cible | null>(null);
  // Le mot touché est-il dans la traduction (et non dans la phrase de la vidéo) ?
  const [gloseTr, setGloseTr] = useState(false);
  const [analysesTr, setAnalysesTr] = useState<Record<number, Analyse>>({});
  const [erreurTr, setErreurTr] = useState<string | null>(null);
  const analysesTrEnCours = useRef(new Set<number>());
  const [tactile, setTactile] = useState(false);
  const element = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const hoteYt = useRef<HTMLDivElement>(null);
  const curseur = useRef<HTMLInputElement>(null);
  const temps = useRef<HTMLSpanElement>(null);
  const liste = useRef<HTMLOListElement>(null);
  const reglagesRef = useRef(reglages);
  useEffect(() => {
    reglagesRef.current = reglages;
  }, [reglages]);

  const enregistrer = useCallback((maj: Pick<Transcription, "traductions" | "analyses">) => {
    dernier.current = { ...dernier.current, ...maj };
    void ecrire("medias", dernier.current).catch(() => undefined);
  }, []);
  // Une vidéo française se traduit en anglais ; une vidéo anglaise, en français.
  const langue: "en" | "fr" = t.langue === "fr" ? "fr" : "en";
  const autre: "en" | "fr" = langue === "fr" ? "en" : "fr";
  const { traductions, analyses, erreur, traduire, analyser } = useTraductions(t, enregistrer, autre);

  // Le son ou la vidéo d'un fichier : gardé sur l'appareil.
  useEffect(() => {
    if (t.source.type !== "fichier") return;
    let url = "";
    let fini = false;
    void lireBlob(t.id).then((b) => {
      if (fini || !b) return;
      url = URL.createObjectURL(b);
      setMedia({ type: "fichier", url, video: t.source.type === "fichier" && t.source.video });
    });
    return () => {
      fini = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [t]);

  // Branchement du lecteur.
  useEffect(() => {
    const brancher = (c: Controle | null) => {
      controleRef.current = c ?? controleVide;
      setControle(c ?? controleVide);
      if (c) {
        c.vitesse(reglagesRef.current.vitesse);
        if (t.position) c.aller(t.position);
      }
    };
    if (media?.type === "fichier" && element.current) {
      const el = element.current;
      const pret = () => brancher(controleElement(el));
      if (el.readyState >= 1) pret();
      else el.addEventListener("loadedmetadata", pret, { once: true });
      return () => {
        el.removeEventListener("loadedmetadata", pret);
        brancher(null);
      };
    }
    if (media?.type === "youtube" && hoteYt.current) {
      let fini = false;
      let detruire = () => undefined as void;
      const hote = document.createElement("div");
      hoteYt.current.replaceChildren(hote);
      void controleYoutube(hote, media.id).then((c) => {
        if (fini) return c.detruire();
        detruire = c.detruire;
        brancher(c);
      });
      return () => {
        fini = true;
        brancher(null);
        detruire();
      };
    }
  }, [media, t]);

  useEffect(() => {
    const maj = () => setLecture(controle.enLecture());
    maj();
    return controle.surEtat(maj);
  }, [controle]);

  // L'horloge : phrase et mot en cours, curseur, boucle sur la phrase.
  useEffect(() => {
    horloge.demarrer();
    const desabonner = horloge.abonner((s) => {
      const c = controleRef.current;
      const duree = t.duree || c.duree() || 1;
      if (curseur.current && document.activeElement !== curseur.current) curseur.current.value = String(Math.min(duree, s));
      if (temps.current) temps.current.textContent = dureeLisible(s);
      if (!c.pret()) return;
      const a = actifRef.current;
      if (reglagesRef.current.boucle && a.phrase >= 0 && c.enLecture()) {
        const ph = t.phrases[a.phrase];
        if (s > ph.fin + 0.15) {
          c.aller(ph.debut);
          return;
        }
      }
      const p = phraseA(t.phrases, s);
      const enCours = p >= 0 && s <= t.phrases[p].fin + 0.6;
      const mo = enCours ? motA(t.phrases[p], s) : -1;
      const tr = phTrRef.current;
      const moTr = enCours && tr && tr.id === p ? motA(tr, s) : -1;
      if (p !== a.phrase || mo !== a.mot || moTr !== a.tr) {
        actifRef.current = { phrase: p, mot: mo, tr: moTr };
        setActif(actifRef.current);
      }
      // Le mot en cours se remplit de lumière au rythme de la voix (variable CSS, 60 images/s).
      const k = reglagesRef.current.karaoke;
      if (k === "source" || k === "deux") remplir(ligneSource.current, p >= 0 ? t.phrases[p].mots[mo] : undefined, s);
      if (k === "traduction" || k === "deux") remplir(ligneTr.current, tr && tr.id === p ? tr.mots[moTr] : undefined, s);
    });
    return () => {
      desabonner();
      horloge.arreter();
    };
  }, [horloge, t]);

  // Traduction de la phrase en cours et des voisines, par petits lots.
  const courante = Math.max(0, actif.phrase);
  const avecTraduction = reglages.affichage !== "source";
  useEffect(() => {
    if (!avecTraduction) return;
    traduire([courante - 1, courante, courante + 1, courante + 2, courante + 3].filter((x) => x >= 0 && x < t.phrases.length));
  }, [courante, avecTraduction, traduire, t.phrases.length]);

  // La traduction affichée, découpée en mots touchables (même horodatage que la phrase d'origine).
  const phraseTraduite = useCallback(
    (id: number): Phrase | null => {
      const p = t.phrases[id];
      const texte = traductions[id];
      if (!p || !texte) return null;
      // Chaque mot traduit reçoit son instant, calé sur la voix (et sur le sens des mots quand l'analyse est là).
      return { id, debut: p.debut, fin: p.fin, paragraphe: p.paragraphe, mots: horodaterTraduction(p, texte, analyses[id]?.mots) };
    },
    [t.phrases, traductions, analyses],
  );

  // Un mot de la traduction s'explique dans la langue de la vidéo (anglais → français, français → anglais).
  const analyserTraduction = useCallback(
    (id: number) => {
      const p = phraseTraduite(id);
      if (!p || analysesTr[id] || analysesTrEnCours.current.has(id)) return;
      analysesTrEnCours.current.add(id);
      const contexte = id > 0 ? (traductions[id - 1] ?? "") : "";
      analyserPhrase(autre, p.mots.map((m) => m.t), contexte, undefined, langue)
        .then((a: Analyse) => {
          setAnalysesTr((avant) => ({ ...avant, [id]: a }));
          setErreurTr(null);
        })
        .catch((e) => setErreurTr(e instanceof Error ? e.message : "L'analyse a échoué."))
        .finally(() => analysesTrEnCours.current.delete(id));
    },
    [phraseTraduite, analysesTr, traductions, autre, langue],
  );

  useEffect(() => {
    if (!glose) return;
    if (gloseTr) analyserTraduction(glose.phrase);
    else analyser(glose.phrase);
  }, [glose, gloseTr, analyser, analyserTraduction]);

  // Le texte complet suit la voix.
  useEffect(() => {
    if (!reglages.texte || actif.phrase < 0) return;
    const li = liste.current?.querySelector<HTMLElement>(`[data-id="${actif.phrase}"]`);
    const boite = liste.current;
    if (!li || !boite) return;
    const haut = li.offsetTop - boite.offsetTop;
    if (haut < boite.scrollTop + 40 || haut > boite.scrollTop + boite.clientHeight - 80) boite.scrollTo({ top: haut - boite.clientHeight / 3, behavior: "smooth" });
  }, [actif.phrase, reglages.texte]);

  // Position retenue, réglages retenus.
  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(reglages));
    } catch {
      // Navigation privée.
    }
  }, [reglages]);
  useEffect(() => {
    const garder = () => {
      const s = controleRef.current.temps();
      if (s <= 0) return;
      dernier.current = { ...dernier.current, position: s, vu: Date.now() };
      void ecrire("medias", dernier.current).catch(() => undefined);
    };
    const minuteur = setInterval(garder, 8000);
    window.addEventListener("pagehide", garder);
    return () => {
      clearInterval(minuteur);
      window.removeEventListener("pagehide", garder);
      garder();
    };
  }, [t]);

  const aller = useCallback((s: number, jouer = true) => {
    controleRef.current.aller(s);
    if (jouer) controleRef.current.jouer();
  }, []);

  const versPhrase = useCallback(
    (d: number) => {
      const c = controleRef.current;
      const p = Math.max(0, actifRef.current.phrase);
      // « Précédente » au milieu d'une phrase : on la reprend d'abord au début.
      const cible = d < 0 && c.temps() - t.phrases[p].debut > 1.2 ? p : Math.min(t.phrases.length - 1, Math.max(0, p + d));
      aller(t.phrases[cible].debut, true);
    },
    [aller, t.phrases],
  );

  const basculer = useCallback(() => (controleRef.current.enLecture() ? controleRef.current.pause() : controleRef.current.jouer()), []);

  // Clavier : espace, flèches gauche/droite (phrase), R (répéter), Échap.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement;
      if (cible.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === " ") {
        e.preventDefault();
        basculer();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        versPhrase(e.key === "ArrowLeft" ? -1 : 1);
      } else if (e.key.toLowerCase() === "r") versPhrase(0);
      else if (e.key === "Escape") {
        if (glose) setGlose(null);
        else onFermer();
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [basculer, glose, onFermer, versPhrase]);

  // Un clic hors de la carte la ferme.
  useEffect(() => {
    if (!glose || tactile) return;
    const dehors = (e: PointerEvent) => {
      const c = e.target as HTMLElement;
      if (c.closest(".tr-glose, .lg-st-mot")) return;
      setGlose(null);
    };
    window.addEventListener("pointerdown", dehors);
    return () => window.removeEventListener("pointerdown", dehors);
  }, [glose, tactile]);

  const toucherMot = (phrase: number, mot: number, el: HTMLElement, viaDoigt: boolean, dansTraduction = false) => {
    setTactile(viaDoigt);
    setGloseTr(dansTraduction);
    if (reglages.pauseAuMot) controleRef.current.pause();
    setGlose({ phrase, mot, el, via: "toucher" });
  };

  const ph = actif.phrase >= 0 ? t.phrases[actif.phrase] : t.phrases[0];
  const precedente = actif.phrase > 0 ? t.phrases[actif.phrase - 1] : null;
  const suivante = t.phrases[(actif.phrase < 0 ? 0 : actif.phrase) + 1] ?? null;
  const video = media?.type === "youtube" || (media?.type === "fichier" && media.video);
  const phraseGlose = glose ? (gloseTr ? phraseTraduite(glose.phrase) : t.phrases[glose.phrase]) : null;
  const phTr = useMemo(() => phraseTraduite(ph.id), [phraseTraduite, ph.id]);
  useEffect(() => {
    phTrRef.current = phTr;
  }, [phTr]);
  const kSource = reglages.karaoke === "source" || reglages.karaoke === "deux";
  const kTr = reglages.karaoke === "traduction" || reglages.karaoke === "deux";
  const motTr = actif.phrase === ph.id && kTr ? actif.tr : -1;
  const duree = t.duree || controle.duree();

  return (
    <div className="lg-immersion" data-texte={reglages.texte || undefined}>
      <div className="lg-immersion-tete">
        <button type="button" className="lg-retour-lien" onClick={onFermer}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Mes vidéos
        </button>
        <h2 className="lg-immersion-titre" dir="auto">
          {t.titre}
        </h2>
      </div>

      <div className="lg-immersion-grille">
        <div className="lg-immersion-principal">
          <div className="lg-ecran" data-video={video || undefined} style={video ? { width: `${reglages.taille}%` } : undefined}>
            {media?.type === "fichier" &&
              (media.video ? (
                <video ref={element} src={media.url} playsInline preload="metadata" onClick={basculer} />
              ) : (
                <>
                  <audio ref={element} src={media.url} preload="metadata" />
                  <button type="button" className="lg-ecran-son" onClick={basculer} aria-label={lecture ? "Pause" : "Lecture"}>
                    <span className="lg-onde" data-lecture={lecture || undefined} aria-hidden="true">
                      {Array.from({ length: 24 }, (_, k) => (
                        <i key={k} style={{ ["--h" as string]: 0.25 + ((k * 37) % 70) / 100 }} />
                      ))}
                    </span>
                  </button>
                </>
              ))}
            {media?.type === "youtube" && <div ref={hoteYt} className="lg-youtube" />}
            {!media && t.source.type === "fichier" && (
              <label className="lg-rebrancher">
                <FileUp className="size-7" strokeWidth={1.4} aria-hidden="true" />
                <span className="font-semibold">Le fichier n&apos;est pas gardé sur cet appareil</span>
                <span className="text-sm text-encre-douce">Choisis à nouveau « {t.source.nom} » pour l&apos;écouter.</span>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    void ecrireBlob(t.id, f).catch(() => undefined);
                    setMedia({ type: "fichier", url: URL.createObjectURL(f), video: f.type.startsWith("video/") });
                  }}
                />
              </label>
            )}
          </div>

          <div
            className="lg-soustitres"
            aria-live="off"
            data-affichage={reglages.affichage}
            style={{ "--st-echelle": reglages.tailleSt / 100 } as React.CSSProperties}
          >
            {precedente && (
              <p className="lg-st-voisine" lang={reglages.affichage === "traduction" && traductions[precedente.id] ? autre : langue}>
                <button type="button" onClick={() => aller(precedente.debut)}>
                  {reglages.affichage === "traduction" ? (traductions[precedente.id] ?? texteDe(precedente)) : texteDe(precedente)}
                </button>
              </p>
            )}
            {reglages.affichage === "traduction" ? (
              phTr ? (
                <PhraseCliquable
                  phrase={phTr}
                  langue={autre}
                  actif={motTr}
                  karaoke={kTr}
                  ligne={ligneTr}
                  className="lg-st-courante lg-st-seule"
                  onMot={(i, el, doigt) => toucherMot(ph.id, i, el, doigt, true)}
                  onAppui={() => reglages.pauseAuMot && controleRef.current.pause()}
                  glose={glose?.phrase === ph.id && gloseTr ? glose.mot : -1}
                />
              ) : (
                <p className="lg-st-courante lg-st-seule" lang={autre} data-vide>
                  {erreur ? erreur : "Traduction en cours…"}
                </p>
              )
            ) : (
              <PhraseCliquable
                phrase={ph}
                langue={langue}
                actif={actif.phrase === ph.id && kSource ? actif.mot : -1}
                karaoke={kSource}
                ligne={ligneSource}
                onMot={(i, el, doigt) => toucherMot(ph.id, i, el, doigt)}
                onAppui={() => reglages.pauseAuMot && controleRef.current.pause()}
                glose={glose?.phrase === ph.id && !gloseTr ? glose.mot : -1}
              />
            )}
            {reglages.affichage === "deux" &&
              (phTr ? (
                <PhraseCliquable
                  phrase={phTr}
                  langue={autre}
                  actif={motTr}
                  karaoke={kTr}
                  ligne={ligneTr}
                  className="lg-st-fr"
                  onMot={(i, el, doigt) => toucherMot(ph.id, i, el, doigt, true)}
                  onAppui={() => reglages.pauseAuMot && controleRef.current.pause()}
                  glose={glose?.phrase === ph.id && gloseTr ? glose.mot : -1}
                />
              ) : (
                <p className="lg-st-fr" lang={autre} data-vide>
                  {erreur ? erreur : " "}
                </p>
              ))}
            {suivante && (
              <p className="lg-st-voisine" lang={reglages.affichage === "traduction" && traductions[suivante.id] ? autre : langue}>
                <button type="button" onClick={() => aller(suivante.debut)}>
                  {reglages.affichage === "traduction" ? (traductions[suivante.id] ?? texteDe(suivante)) : texteDe(suivante)}
                </button>
              </p>
            )}
          </div>

          <div className="lg-commandes">
            <input
              ref={curseur}
              type="range"
              className="lg-curseur"
              min={0}
              max={Math.max(1, duree)}
              step={0.1}
              defaultValue={t.position ?? 0}
              aria-label="Position"
              onChange={(e) => controleRef.current.aller(Number(e.target.value))}
            />
            <div className="lg-commandes-rang">
              <span ref={temps} className="lg-temps">
                0:00
              </span>
              <span className="flex-1" />
              <button type="button" className="tr-cmd" aria-label="Phrase précédente" title="Phrase précédente (←)" onClick={() => versPhrase(-1)}>
                <SkipBack className="size-5" aria-hidden="true" />
              </button>
              <button type="button" className="lg-cmd-lecture" aria-label={lecture ? "Pause" : "Lecture"} onClick={basculer}>
                {lecture ? <Pause className="size-6" fill="currentColor" aria-hidden="true" /> : <Play className="size-6" fill="currentColor" aria-hidden="true" />}
              </button>
              <button type="button" className="tr-cmd" aria-label="Phrase suivante" title="Phrase suivante (→)" onClick={() => versPhrase(1)}>
                <SkipForward className="size-5" aria-hidden="true" />
              </button>
              <span className="flex-1" />
              <span className="lg-temps lg-temps-total">{dureeLisible(duree)}</span>
            </div>
            <div className="lg-options" role="group" aria-label="Options de lecture">
              <button type="button" className="lg-option" aria-pressed={reglages.boucle} onClick={() => setReglages((r) => ({ ...r, boucle: !r.boucle }))} title="Répéter la phrase en boucle">
                <Repeat className="size-4" aria-hidden="true" />
                Boucle
              </button>
              <button
                type="button"
                className="lg-option"
                onClick={() => {
                  const v = VITESSES[(VITESSES.indexOf(reglages.vitesse) + 1) % VITESSES.length];
                  controleRef.current.vitesse(v);
                  setReglages((r) => ({ ...r, vitesse: v }));
                }}
                title="Vitesse de lecture"
              >
                <span className="lg-option-vitesse">{String(reglages.vitesse).replace(".", ",")}×</span>
                Vitesse
              </button>
              <button type="button" className="lg-option" aria-pressed={reglages.pauseAuMot} onClick={() => setReglages((r) => ({ ...r, pauseAuMot: !r.pauseAuMot }))} title="Mettre en pause quand on touche un mot">
                <MousePointerClick className="size-4" aria-hidden="true" />
                Pause au mot
              </button>
              <button type="button" className="lg-option" aria-pressed={reglages.texte} onClick={() => setReglages((r) => ({ ...r, texte: !r.texte }))} title="Afficher le texte complet">
                <ListVideo className="size-4" aria-hidden="true" />
                Texte
              </button>
            </div>
            <div className="lg-reglages-st" role="radiogroup" aria-label="Sous-titres">
              <span className="lg-reglages-st-titre">
                <Captions className="size-4" aria-hidden="true" />
                Sous-titres
              </span>
              {(
                [
                  ["source", `${NOM_LANGUE[langue]}`, `${NOM_LANGUE[langue]} seul : touche un mot pour sa traduction en ${NOM_LANGUE[autre].toLowerCase()}`],
                  ["deux", `${NOM_LANGUE[langue]} + ${NOM_LANGUE[autre].toLowerCase()}`, `La phrase en ${NOM_LANGUE[langue].toLowerCase()}, sa traduction dessous`],
                  ["traduction", `${NOM_LANGUE[autre]}`, `Uniquement la traduction en ${NOM_LANGUE[autre].toLowerCase()}`],
                ] as const
              ).map(([valeur, libelle, aide]) => (
                <button
                  key={valeur}
                  type="button"
                  role="radio"
                  aria-checked={reglages.affichage === valeur}
                  className="lg-st-choix"
                  title={aide}
                  onClick={() => setReglages((r) => ({ ...r, affichage: valeur }))}
                >
                  {libelle}
                </button>
              ))}
            </div>
            <div className="lg-reglages-st" role="radiogroup" aria-label="Karaoké">
              <span className="lg-reglages-st-titre">
                <Mic2 className="size-4" aria-hidden="true" />
                Karaoké
              </span>
              {(
                [
                  ["source", NOM_LANGUE[langue], `Les mots ${langue === "en" ? "anglais" : "français"} s'allument quand ils sont dits`],
                  ["traduction", NOM_LANGUE[autre], `Les mots de la traduction s'allument en même temps que la voix`],
                  ["deux", "Les deux", "Les deux lignes s'allument ensemble"],
                  ["aucun", "Aucun", "Sous-titres fixes"],
                ] as const
              ).map(([valeur, libelle, aide]) => (
                <button
                  key={valeur}
                  type="button"
                  role="radio"
                  aria-checked={reglages.karaoke === valeur}
                  className="lg-st-choix"
                  title={aide}
                  onClick={() => setReglages((r) => ({ ...r, karaoke: valeur }))}
                >
                  {libelle}
                </button>
              ))}
            </div>
            {video && (
              <label className="lg-taille">
                <Maximize2 className="size-4 shrink-0" aria-hidden="true" />
                <span className="lg-taille-titre">Taille de l&apos;image</span>
                <input
                  type="range"
                  min={TAILLE_MIN}
                  max={100}
                  step={5}
                  value={reglages.taille}
                  onChange={(e) => setReglages((r) => ({ ...r, taille: Number(e.target.value) }))}
                  aria-valuetext={`${reglages.taille} %`}
                />
                <span className="lg-taille-valeur">{reglages.taille} %</span>
              </label>
            )}
            <label className="lg-taille">
              <Type className="size-4 shrink-0" aria-hidden="true" />
              <span className="lg-taille-titre">Taille des sous-titres</span>
              <input
                type="range"
                min={TAILLE_ST_MIN}
                max={TAILLE_ST_MAX}
                step={10}
                value={reglages.tailleSt}
                onChange={(e) => setReglages((r) => ({ ...r, tailleSt: Number(e.target.value) }))}
                aria-valuetext={`${reglages.tailleSt} %`}
              />
              <span className="lg-taille-valeur">{reglages.tailleSt} %</span>
            </label>
          </div>
        </div>

        {reglages.texte && (
          <aside className="lg-transcript" aria-label="Texte complet">
            <p className="lg-transcript-titre">
              <Captions className="size-4" aria-hidden="true" />
              Texte complet
              <span className="text-encre-douce">{t.phrases.length} phrases</span>
            </p>
            <ol ref={liste} className="lg-transcript-liste">
              {t.phrases.map((p) => (
                <li key={p.id} data-id={p.id} data-actif={p.id === actif.phrase || undefined}>
                  <button type="button" onClick={() => aller(p.debut)}>
                    <span className="lg-transcript-t">{dureeLisible(p.debut)}</span>
                    <span lang={langue}>{texteDe(p)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>

      {glose && phraseGlose && (
        <GloseMot
          cible={glose}
          phrase={phraseGlose}
          analyse={gloseTr ? analysesTr[glose.phrase] : analyses[glose.phrase]}
          traduction={gloseTr ? texteDe(t.phrases[glose.phrase]) : traductions[glose.phrase]}
          erreur={gloseTr ? erreurTr : erreur}
          origine={{ type: "video", titre: t.titre, ref: t.id, t: phraseGlose.debut }}
          tactile={tactile}
          langue={gloseTr ? autre : langue}
          onFermer={() => setGlose(null)}
          onMot={(i, el) => setGlose({ phrase: glose.phrase, mot: i, el, via: "toucher" })}
          onEcouter={(s) => {
            setGlose(null);
            aller(s);
          }}
        />
      )}
    </div>
  );
}

/** Règle l'avancée (0 → 1) du mot allumé d'une ligne. Appelé à chaque image par l'horloge. */
function remplir(ligne: HTMLElement | null, mot: Phrase["mots"][number] | undefined, s: number) {
  const el = ligne?.querySelector<HTMLElement>(".lg-st-mot[data-ici]");
  if (el) el.style.setProperty("--k", avancee(mot, s).toFixed(3));
}

function PhraseCliquable({
  phrase,
  langue,
  actif,
  glose,
  onMot,
  onAppui,
  karaoke = false,
  ligne,
  className = "lg-st-courante",
}: {
  phrase: Phrase;
  langue: "en" | "fr";
  actif: number;
  glose: number;
  karaoke?: boolean;
  ligne?: RefObject<HTMLParagraphElement | null>;
  className?: string;
  onMot: (i: number, el: HTMLElement, doigt: boolean) => void;
  onAppui: () => void;
}) {
  const pointeur = useRef("mouse");
  const mots = useMemo(() => phrase.mots, [phrase]);
  return (
    <p
      ref={ligne}
      className={className}
      lang={langue}
      data-karaoke={karaoke || undefined}
      onPointerDown={(e) => {
        pointeur.current = e.pointerType;
        // La phrase se fige dès l'appui : elle ne change pas sous le doigt avant le clic.
        if ((e.target as HTMLElement).closest(".lg-st-mot")) onAppui();
      }}
    >
      {mots.map((m, i) => (
        <span key={i}>
          <button
            type="button"
            className="lg-st-mot"
            data-dit={i <= actif || undefined}
            data-ici={i === actif || undefined}
            aria-pressed={i === glose}
            onClick={(e) => onMot(i, e.currentTarget, pointeur.current !== "mouse")}
          >
            <span className="lg-k">{m.t}</span>
          </button>{" "}
        </span>
      ))}
    </p>
  );
}
