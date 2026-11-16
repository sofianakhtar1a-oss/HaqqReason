"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Check, Copy, Download, Languages, MoonStar, SunMedium, Type, X } from "lucide-react";
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { dureeLisible, versSrt, versTexte, versVtt } from "@/lib/alambic/transcription/exports";
import { motA, phraseA } from "@/lib/alambic/transcription/phrases";
import { estRtl, nomLangue, type Phrase, type Transcription } from "@/lib/alambic/transcription/types";
import { type Controle, controleVide, Horloge } from "./controle";
import { type Cible, Popover, Tiroir } from "./Glose";
import { Lecteur, type MediaLecture, type Mode } from "./Lecteur";
import { useTraductions } from "./useTraductions";
import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";

/*
 * La liseuse : on lit la vidéo comme un livre.
 * La phrase dite s'éclaire d'un lavis d'or (comme une enluminure), une perle suit le mot prononcé,
 * le texte défile de lui-même, et un clic sur n'importe quel mot y ramène le son.
 */

type Theme = "papier" | "nuit";
type Reglages = { theme: Theme; taille: number; enRegard: boolean };
const TAILLES = [1.02, 1.14, 1.27, 1.42, 1.6];
const CLE = "haqqreason-liseuse";

function reglagesInitiaux(): Reglages {
  const site: Theme = document.documentElement.dataset.theme === "light" ? "papier" : "nuit";
  try {
    const r = JSON.parse(localStorage.getItem(CLE) ?? "{}") as Partial<Reglages>;
    return { theme: r.theme === "papier" || r.theme === "nuit" ? r.theme : site, taille: Math.min(4, Math.max(0, r.taille ?? 2)), enRegard: Boolean(r.enRegard) };
  } catch {
    return { theme: site, taille: 2, enRegard: false };
  }
}

function telecharger(nom: string, contenu: string, type: string) {
  const url = URL.createObjectURL(new Blob([contenu], { type: `${type};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const nomFichier = (titre: string) =>
  titre
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "transcription";

type Props = {
  t: Transcription;
  media: MediaLecture;
  onFermer: () => void;
  onMaj: (maj: Pick<Transcription, "traductions" | "analyses">) => void;
  onRebrancher: (f: File) => void;
};

export function Liseuse({ t, media, onFermer, onMaj, onRebrancher }: Props) {
  const rtl = estRtl(t.langue);
  const video = media?.type === "youtube" || (media?.type === "fichier" && media.video);
  const [reglages, setReglages] = useState<Reglages>(reglagesInitiaux);
  const [mode, setMode] = useState<Mode>(video ? "scene" : "barre");
  const [controle, setControle] = useState<Controle>(controleVide);
  const controleRef = useRef<Controle>(controleVide);
  const [horloge] = useState(() => new Horloge(controleRef));
  const [actif, setActif] = useState({ phrase: -1, mot: -1 });
  const actifRef = useRef(actif);
  const [lecture, setLecture] = useState(false);
  const [suivre, setSuivre] = useState(true);
  const [reprise, setReprise] = useState(0);
  const [directionReprise, setDirectionReprise] = useState<"haut" | "bas" | null>(null);
  const [barreCachee, setBarreCachee] = useState(false);
  const [menu, setMenu] = useState<"affichage" | "export" | null>(null);
  const [glose, setGlose] = useState<Cible | null>(null);
  const [copie, setCopie] = useState<"texte" | "bilingue" | "erreur" | null>(null);
  const defilement = useRef<HTMLElement>(null);
  const progres = useRef<HTMLSpanElement>(null);
  const racine = useRef<HTMLDivElement>(null);
  const defilementAuto = useRef(0);
  const minuteurs = useRef<{ ouvrir?: number; fermer?: number }>({});
  const dernierPointeur = useRef<string>("mouse");
  const { traductions, analyses, erreur, traduire, analyser, effacerErreur } = useTraductions(t, onMaj);

  const onControle = useCallback((c: Controle | null) => {
    controleRef.current = c ?? controleVide;
    setControle(c ?? controleVide);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(reglages));
    } catch {
      // Navigation privée : les réglages valent pour la séance.
    }
  }, [reglages]);

  // Page figée derrière la liseuse, et focus pour le clavier.
  useEffect(() => {
    const avant = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    racine.current?.focus({ preventScroll: true });
    return () => {
      document.documentElement.style.overflow = avant;
    };
  }, []);

  // L'horloge : phrase et mot en cours, et filet de progression.
  useEffect(() => {
    horloge.demarrer();
    const se = horloge.abonner((s) => {
      const duree = t.duree || controleRef.current.duree() || 1;
      if (progres.current) progres.current.style.transform = `scaleX(${Math.min(1, s / duree)})`;
      if (!controleRef.current.pret()) return;
      const p = phraseA(t.phrases, s);
      const m = p >= 0 && s <= t.phrases[p].fin + 0.6 ? motA(t.phrases[p], s) : -1;
      if (p !== actifRef.current.phrase || m !== actifRef.current.mot) {
        actifRef.current = { phrase: p, mot: m };
        setActif(actifRef.current);
      }
    });
    return () => {
      se();
      horloge.arreter();
    };
  }, [horloge, t.phrases, t.duree]);

  useEffect(() => {
    const maj = () => setLecture(controle.enLecture());
    maj();
    return controle.surEtat(maj);
  }, [controle]);

  const paragraphes = useMemo(() => {
    const groupes: Phrase[][] = [];
    for (const p of t.phrases) (groupes[p.paragraphe] ??= []).push(p);
    return groupes.filter(Boolean);
  }, [t.phrases]);
  const paraActif = actif.phrase >= 0 ? t.phrases[actif.phrase].paragraphe : -1;

  // Le texte suit la voix, sans à-coups : il ne bouge que si la phrase sort de la zone de lecture.
  useEffect(() => {
    if (!suivre || actif.phrase < 0) return;
    void reprise;
    const el = defilement.current?.querySelector<HTMLElement>(`.tr-ph[data-id="${actif.phrase}"]`);
    const zone = defilement.current;
    if (!el || !zone) return;
    const r = el.getBoundingClientRect();
    const h = window.innerHeight;
    const basLibre = mode === "barre" ? h - 110 : mode === "scene" && window.innerWidth < 1100 ? h - 40 : h - 60;
    const hautLibre = mode === "scene" && window.innerWidth < 1100 ? (document.querySelector(".tr-lecteur")?.getBoundingClientRect().bottom ?? 0) + 24 : 96;
    if (r.top < hautLibre || r.bottom > Math.min(basLibre, hautLibre + (basLibre - hautLibre) * 0.7)) {
      defilementAuto.current = Date.now();
      zone.scrollBy({ top: r.top - (hautLibre + (basLibre - hautLibre) * 0.22), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }, [actif.phrase, suivre, mode, reprise]);

  const reprendre = () => {
    setSuivre(true);
    setReprise((n) => n + 1);
  };

  // Pastille « Reprendre le fil » : la flèche montre où se trouve la voix.
  const situerLaVoix = () => {
    const el = defilement.current?.querySelector(`.tr-ph[data-id="${actifRef.current.phrase}"]`);
    setDirectionReprise(el ? (el.getBoundingClientRect().top < window.innerHeight / 2 ? "haut" : "bas") : null);
  };

  // Défilement à la main : on cesse de suivre (une pastille propose de reprendre le fil).
  const lacherLeFil = () => {
    if (controleRef.current.enLecture() && Date.now() - defilementAuto.current > 50) {
      setSuivre(false);
      situerLaVoix();
    }
  };

  // Barre du haut : elle s'efface quand on descend, revient quand on remonte.
  const dernierHaut = useRef(0);
  const surDefilement = () => {
    const y = defilement.current?.scrollTop ?? 0;
    const d = y - dernierHaut.current;
    if (Math.abs(d) > 6) setBarreCachee(d > 0 && y > 120 && menu === null);
    dernierHaut.current = y;
    if (!suivre) situerLaVoix();
    if (glose?.via === "survol") setGlose(null);
  };

  // Traduction en regard : on traduit les paragraphes qui approchent de l'écran.
  useEffect(() => {
    if (!reglages.enRegard || !defilement.current) return;
    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue;
          const n = Number((e.target as HTMLElement).dataset.p);
          traduire(paragraphes[n]?.map((p) => p.id) ?? []);
        }
      },
      { root: defilement.current, rootMargin: "600px 0px" },
    );
    defilement.current.querySelectorAll(".tr-para").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [reglages.enRegard, paragraphes, traduire]);

  useEffect(() => {
    if (glose) analyser(glose.phrase);
  }, [glose, analyser]);

  const aller = useCallback((s: number, jouer = true) => {
    controleRef.current.aller(s);
    if (jouer) controleRef.current.jouer();
    setSuivre(true);
  }, []);

  // Clavier : espace, flèches (5 s), Maj + flèches (phrase), Échap.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement;
      if (cible.closest("input, textarea, select, [contenteditable]")) return;
      const c = controleRef.current;
      if (e.key === " " && !cible.closest("button, [role=slider]")) {
        e.preventDefault();
        if (c.enLecture()) c.pause();
        else c.jouer();
      } else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !cible.closest("[role=slider]")) {
        e.preventDefault();
        const avant = e.key === "ArrowLeft";
        if (e.shiftKey) {
          const p = Math.max(0, actifRef.current.phrase);
          const vers = t.phrases[Math.min(t.phrases.length - 1, Math.max(0, p + (avant ? (c.temps() - t.phrases[p].debut > 1.2 ? 0 : -1) : 1)))];
          aller(vers.debut, c.enLecture());
        } else aller(c.temps() + (avant ? -5 : 5), c.enLecture());
      } else if (e.key === "Escape") {
        if (glose) setGlose(null);
        else if (menu) setMenu(null);
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [aller, glose, menu, t.phrases]);

  /* ---------- Survol, clic et toucher sur le texte ---------- */

  const cibleDe = (motEl: HTMLElement, via: Cible["via"]): Cible | null => {
    const ph = motEl.closest<HTMLElement>(".tr-ph");
    if (!ph) return null;
    return { phrase: Number(ph.dataset.id), mot: Number(motEl.dataset.i), el: motEl, via };
  };

  const surSurvol = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const motEl = (e.target as HTMLElement).closest<HTMLElement>(".tr-mot");
    if (!motEl) return;
    clearTimeout(minuteurs.current.fermer);
    const c = cibleDe(motEl, "survol");
    if (!c) return;
    if (glose?.via === "survol") setGlose(c);
    else {
      clearTimeout(minuteurs.current.ouvrir);
      minuteurs.current.ouvrir = window.setTimeout(() => setGlose(c), 420);
    }
  };
  const surSortie = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const vers = e.relatedTarget as HTMLElement | null;
    if (vers?.closest?.(".tr-mot, .tr-glose")) return;
    clearTimeout(minuteurs.current.ouvrir);
    minuteurs.current.fermer = window.setTimeout(() => setGlose((g) => (g?.via === "survol" ? null : g)), 240);
  };
  const surClic = (e: React.MouseEvent) => {
    const cible = e.target as HTMLElement;
    const marge = cible.closest<HTMLElement>(".tr-marge");
    if (marge) return aller(Number(marge.dataset.t));
    const motEl = cible.closest<HTMLElement>(".tr-mot");
    if (motEl && dernierPointeur.current === "touch") {
      const c = cibleDe(motEl, "toucher");
      if (c) setGlose(c);
      return;
    }
    const ph = cible.closest<HTMLElement>(".tr-ph");
    if (!ph) return;
    const phrase = t.phrases[Number(ph.dataset.id)];
    const instant = motEl ? (phrase.mots[Number(motEl.dataset.i)]?.d ?? phrase.debut) : phrase.debut;
    setGlose(null);
    aller(instant);
  };

  /* ---------- Rendu ---------- */

  const sortieTexte = (avecTraduction: boolean) => telecharger(`${nomFichier(t.titre)}${avecTraduction ? " (bilingue)" : ""}.txt`, versTexte({ ...t, traductions }, avecTraduction), "text/plain");
  const nbTraduites = Object.keys(traductions).length;
  const copier = async (avecTraduction: boolean) => {
    try {
      await navigator.clipboard.writeText(versTexte({ ...t, traductions }, avecTraduction));
      setCopie(avecTraduction ? "bilingue" : "texte");
    } catch {
      setCopie("erreur");
    }
    setTimeout(() => setCopie(null), 2200);
  };
  const phraseGlose = glose ? t.phrases[glose.phrase] : null;

  return createPortal(
    <div
      ref={racine}
      className="tr-liseuse"
      role="dialog"
      aria-modal="true"
      aria-label={`Liseuse : ${t.titre}`}
      tabIndex={-1}
      data-lecture-theme={reglages.theme}
      data-mode={mode}
      data-video={video || undefined}
      style={{ ["--tr-taille" as string]: TAILLES[reglages.taille] }}
      onMouseMove={(e) => e.clientY < 72 && barreCachee && setBarreCachee(false)}
    >
      <header className="tr-haut" data-cache={barreCachee || undefined}>
        <button type="button" className="tr-cmd tr-retour" onClick={onFermer} aria-label="Revenir à L'Alambic">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <p className="tr-haut-titre" dir="auto">
          {t.titre}
        </p>
        <span className="flex-1" />
        <button
          type="button"
          className="tr-outil"
          aria-pressed={reglages.enRegard}
          onClick={() => setReglages((r) => ({ ...r, enRegard: !r.enRegard }))}
          title="Afficher la traduction française sous chaque paragraphe"
        >
          <Languages className="size-4" aria-hidden="true" />
          <span className="tr-outil-nom">Traduction</span>
        </button>
        <div className="tr-menu-ancre">
          <button type="button" className="tr-outil" aria-expanded={menu === "affichage"} onClick={() => setMenu((m) => (m === "affichage" ? null : "affichage"))} title="Taille du texte et thème">
            <Type className="size-4" aria-hidden="true" />
            <span className="tr-outil-nom">Affichage</span>
          </button>
          {menu === "affichage" && (
            <div className="tr-menu" role="dialog" aria-label="Affichage">
              <p className="tr-menu-titre">Taille du texte</p>
              <div className="tr-tailles" role="radiogroup" aria-label="Taille du texte">
                {TAILLES.map((_, i) => (
                  <button key={i} type="button" role="radio" aria-checked={reglages.taille === i} aria-label={`Taille ${i + 1} sur 5`} onClick={() => setReglages((r) => ({ ...r, taille: i }))}>
                    <span style={{ fontSize: `${0.75 + i * 0.16}rem` }}>{rtl ? "ع" : "A"}</span>
                  </button>
                ))}
              </div>
              <p className="tr-menu-titre">Thème de lecture</p>
              <div className="tr-themes" role="radiogroup" aria-label="Thème de lecture">
                {(
                  [
                    ["papier", "Papier", SunMedium],
                    ["nuit", "Nuit", MoonStar],
                  ] as const
                ).map(([id, nom, Icone]) => (
                  <button key={id} type="button" role="radio" aria-checked={reglages.theme === id} data-apercu={id} onClick={() => setReglages((r) => ({ ...r, theme: id }))}>
                    <span className="tr-theme-apercu" aria-hidden="true">
                      <Icone className="size-4" />
                    </span>
                    {nom}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="tr-menu-ancre">
          <button type="button" className="tr-outil" aria-expanded={menu === "export"} onClick={() => setMenu((m) => (m === "export" ? null : "export"))} title="Exporter le texte ou les sous-titres">
            <Download className="size-4" aria-hidden="true" />
            <span className="tr-outil-nom">Exporter</span>
          </button>
          {menu === "export" && (
            <div className="tr-menu tr-menu-export" role="menu" aria-label="Exporter">
              <button type="button" role="menuitem" onClick={() => void copier(false)} data-copie={copie === "texte" || undefined}>
                <span className="tr-export-ext">{copie === "texte" ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}</span>
                <span>
                  {copie === "texte" ? "Copié !" : "Copier tout le texte"}
                  <small>{copie === "erreur" ? "Le navigateur a refusé la copie" : `${t.phrases.length} phrases, prêtes à coller`}</small>
                </span>
              </button>
              {nbTraduites > 0 && (
                <button type="button" role="menuitem" onClick={() => void copier(true)} data-copie={copie === "bilingue" || undefined}>
                  <span className="tr-export-ext">{copie === "bilingue" ? <Check className="size-4" aria-hidden="true" /> : <Languages className="size-4" aria-hidden="true" />}</span>
                  <span>
                    {copie === "bilingue" ? "Copié !" : "Copier avec la traduction"}
                    <small>L&apos;original et le français, paragraphe par paragraphe</small>
                  </span>
                </button>
              )}
              <hr className="tr-menu-separation" />
              <button type="button" role="menuitem" onClick={() => sortieTexte(false)}>
                <span className="tr-export-ext">TXT</span>
                <span>
                  Texte propre
                  <small>Les paragraphes, sans les minutages</small>
                </span>
              </button>
              <button type="button" role="menuitem" disabled={!nbTraduites} onClick={() => sortieTexte(true)}>
                <span className="tr-export-ext">TXT</span>
                <span>
                  Texte bilingue
                  <small>{nbTraduites ? `Avec la traduction (${Math.round((nbTraduites / t.phrases.length) * 100)} % traduit)` : "Active d'abord la traduction"}</small>
                </span>
              </button>
              <button type="button" role="menuitem" onClick={() => telecharger(`${nomFichier(t.titre)}.srt`, versSrt(t.phrases), "application/x-subrip")}>
                <span className="tr-export-ext">SRT</span>
                <span>
                  Sous-titres
                  <small>Pour VLC, Premiere, YouTube…</small>
                </span>
              </button>
              <button type="button" role="menuitem" onClick={() => telecharger(`${nomFichier(t.titre)}.vtt`, versVtt(t.phrases, t.langue), "text/vtt")}>
                <span className="tr-export-ext">VTT</span>
                <span>
                  Sous-titres web
                  <small>Pour une page web (WebVTT)</small>
                </span>
              </button>
            </div>
          )}
        </div>
      </header>
      {menu && <div className="tr-menu-fond" onClick={() => setMenu(null)} />}

      <div className="tr-filet" aria-hidden="true">
        <span ref={progres} />
      </div>

      <Lecteur
        media={media}
        mode={mode}
        onMode={setMode}
        titre={t.titre}
        horloge={horloge}
        controle={controle}
        onControle={onControle}
        phrases={t.phrases}
        duree={t.duree}
        rtl={rtl}
        onRebrancher={onRebrancher}
      />

      {mode === "scene" && paragraphes.length > 2 && (
        <Sommaire paragraphes={paragraphes} actif={paraActif} rtl={rtl} onAller={(s) => aller(s)} />
      )}

      <main
        ref={defilement}
        className="tr-defilement"
        onScroll={surDefilement}
        onWheel={lacherLeFil}
        onTouchMove={lacherLeFil}
      >
        <article className="tr-livre" lang={t.langue} dir={rtl ? "rtl" : "ltr"} data-rtl={rtl || undefined}>
          <header className="tr-livre-tete" dir="ltr" lang="fr">
            <p className="tr-livre-sur">
              {nomLangue(t.langue)} · {dureeLisible(t.duree)} · {t.source.type === "youtube" ? (t.source.auteur ? `YouTube, ${t.source.auteur}` : "YouTube") : "transcrit par Whisper"}
            </p>
            <h1 className="tr-livre-titre" dir="auto">
              {t.titre}
            </h1>
            <Ornement />
          </header>

          <div
            className="tr-texte"
            onPointerDown={(e) => {
              dernierPointeur.current = e.pointerType;
            }}
            onPointerOver={surSurvol}
            onPointerOut={surSortie}
            onClick={surClic}
          >
            {paragraphes.map((ps, n) => (
              <Paragraphe
                key={n}
                n={n}
                phrases={ps}
                position={paraActif < 0 ? "apres" : n < paraActif ? "avant" : n > paraActif ? "apres" : "courant"}
                actif={n === paraActif ? actif.phrase : -1}
                mot={n === paraActif ? actif.mot : -1}
                traduction={reglages.enRegard ? (ps.every((p) => traductions[p.id]) ? ps.map((p) => traductions[p.id]).join(" ") : null) : undefined}
              />
            ))}
          </div>

          <footer className="tr-livre-fin" dir="ltr" lang="fr">
            <Ornement />
            <p>
              Fin · {t.phrases.length} phrases · {dureeLisible(t.duree)}
            </p>
          </footer>
        </article>
      </main>

      {!suivre && directionReprise && lecture && (
        <button type="button" className="tr-reprendre" onClick={reprendre}>
          {directionReprise === "haut" ? <ArrowUp className="size-4" aria-hidden="true" /> : <ArrowDown className="size-4" aria-hidden="true" />}
          Reprendre le fil
        </button>
      )}

      {glose && phraseGlose && (
        glose.via === "survol" ? (
          <Popover
            cible={glose}
            phrase={phraseGlose}
            langue={t.langue}
            rtl={rtl}
            analyse={analyses[glose.phrase]}
            traduction={analyses[glose.phrase]?.traduction || traductions[glose.phrase]}
            erreur={erreur}
            onEntrer={() => clearTimeout(minuteurs.current.fermer)}
            onSortir={() => {
              minuteurs.current.fermer = window.setTimeout(() => setGlose(null), 200);
            }}
            onFermer={() => setGlose(null)}
            onEcouter={(s) => aller(s)}
            onMot={() => undefined}
          />
        ) : (
          <Tiroir
            cible={glose}
            phrase={phraseGlose}
            langue={t.langue}
            rtl={rtl}
            analyse={analyses[glose.phrase]}
            traduction={analyses[glose.phrase]?.traduction || traductions[glose.phrase]}
            erreur={erreur}
            onEntrer={() => undefined}
            onSortir={() => undefined}
            onFermer={() => setGlose(null)}
            onEcouter={(s) => {
              setGlose(null);
              aller(s);
            }}
            onMot={(i, el) => setGlose({ ...glose, mot: i, el })}
          />
        )
      )}

      {erreur && !glose && (
        <div className="tr-toast" role="status">
          <p>{erreur}</p>
          <button type="button" className="bouton-icone" aria-label="Fermer" onClick={effacerErreur}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}

/** Sommaire : le premier mot de chaque paragraphe, à son minutage. On s'y repère, on y saute. */
const Sommaire = memo(function Sommaire({ paragraphes, actif, rtl, onAller }: { paragraphes: Phrase[][]; actif: number; rtl: boolean; onAller: (s: number) => void }) {
  const liste = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = liste.current?.querySelector<HTMLElement>('[aria-current="true"]');
    const boite = liste.current;
    if (!el || !boite) return;
    const haut = el.offsetTop - boite.clientHeight * 0.3;
    if (el.offsetTop < boite.scrollTop + 24 || el.offsetTop + el.offsetHeight > boite.scrollTop + boite.clientHeight - 32) boite.scrollTo({ top: haut, behavior: "smooth" });
  }, [actif]);
  return (
    <nav ref={liste} className="tr-sommaire" aria-label="Sommaire">
      <p className="tr-sommaire-titre">Sommaire</p>
      {paragraphes.map((ps, n) => (
        <button key={n} type="button" aria-current={n === actif || undefined} onClick={() => onAller(ps[0].debut)}>
          <span className="tr-sommaire-temps">{dureeLisible(ps[0].debut)}</span>
          <span className="tr-sommaire-debut" dir={rtl ? "rtl" : "ltr"}>
            {ps[0].mots
              .slice(0, 9)
              .map((m) => m.t)
              .join(" ")}
          </span>
        </button>
      ))}
    </nav>
  );
});

function Ornement() {
  return (
    <svg className="tr-ornement" viewBox="0 0 120 12" aria-hidden="true">
      <path d="M0 6 H48 M72 6 H120" />
      <path d="M60 0 L62 4 L66 2 L64 6 L66 10 L62 8 L60 12 L58 8 L54 10 L56 6 L54 2 L58 4 Z" className="tr-ornement-etoile" />
    </svg>
  );
}

type PropsParagraphe = {
  n: number;
  phrases: Phrase[];
  position: "avant" | "courant" | "apres";
  actif: number;
  mot: number;
  traduction: string | null | undefined;
};

const Paragraphe = memo(function Paragraphe({ n, phrases, position, actif, mot, traduction }: PropsParagraphe) {
  return (
    <div className="tr-para" data-p={n} data-position={position}>
      <button type="button" className="tr-marge tabular-nums" data-t={phrases[0].debut} tabIndex={-1} aria-label={`Écouter à partir de ${dureeLisible(phrases[0].debut)}`}>
        {dureeLisible(phrases[0].debut)}
      </button>
      <p className="tr-para-texte">
        {phrases.map((p) => (
          <PhraseRendu key={p.id} p={p} etat={p.id === actif ? "actif" : position === "courant" ? (p.id < actif ? "passe" : "futur") : undefined} mot={p.id === actif ? mot : -1} />
        ))}
      </p>
      {traduction !== undefined && (
        <p className="tr-para-fr" lang="fr" dir="ltr" data-attente={traduction === null || undefined}>
          {traduction ?? (
            <>
              <span className="tr-attente" />
              <span className="tr-attente tr-attente-courte" />
            </>
          )}
        </p>
      )}
    </div>
  );
});

const PhraseRendu = memo(function PhraseRendu({ p, etat, mot }: { p: Phrase; etat?: "actif" | "passe" | "futur"; mot: number }) {
  return (
    <span className="tr-ph" data-id={p.id} data-etat={etat}>
      {p.mots.map((m, i) => (
        <Fragment key={i}>
          <span className="tr-mot" data-i={i} data-courant={i === mot || undefined} data-dit={(etat === "actif" && i < mot) || undefined}>
            {m.t}
          </span>{" "}
        </Fragment>
      ))}
    </span>
  );
});
