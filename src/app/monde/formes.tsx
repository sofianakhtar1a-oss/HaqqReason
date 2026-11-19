"use client";

import { ArrowDown, ArrowUp, Check, GripVertical } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPopulation, formatSuperficie, motCapitale, NOM_CONTINENT, pays, PAR_CODE, urlDrapeau } from "@/lib/monde/atlas";
import { TYPES } from "@/lib/monde/categories";
import { COULEURS, type Couleur, NOMS_COULEURS, nomDeCss, PALETTE } from "@/lib/monde/couleurs";
import { PAYS } from "@/lib/monde/donnees";
import { decalageMinutes, distanceKm, formatDecalage, formatKm, grandCercle } from "@/lib/monde/geo";
import { auNom, duNom, leNom, pluriel } from "@/lib/monde/francais";
import { hasard, melanger } from "@/lib/monde/hasard";
import { heureQuandMidi, type Question } from "@/lib/monde/quiz";
import type { Jugement } from "@/lib/monde/texte";
import { Drapeau } from "./figures";
import { Globe, type GlobeRef, type Marque, type Trait } from "./Globe";

/*
 * Le Portulan : les nouvelles façons de poser une question et d'y répondre (catégories ajoutées,
 * drapeaux en noir et blanc, qui se dévoilent, à colorier ; capitales à poser sur le globe ;
 * pays à ranger…). Partie.tsx leur délègue ce qui sort des quatre choix habituels.
 */

/* ---------- Les drapeaux dessinés dans la page (pour en cacher ou en colorier les formes) ---------- */

const svgs = new Map<string, Promise<string>>();
function chargerSvg(url: string): Promise<string> {
  let p = svgs.get(url);
  if (!p) {
    p = fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))));
    p.catch(() => svgs.delete(url));
    svgs.set(url, p);
  }
  return p;
}

const FORMES = "path, rect, circle, ellipse, polygon, polyline";
/** Les formes visibles d'un drapeau, dans l'ordre du dessin (le même que celui du script de construction). */
function formesVisibles(svg: SVGSVGElement): SVGElement[] {
  return [...svg.querySelectorAll<SVGElement>(FORMES)].filter((el) => getComputedStyle(el).fill !== "none");
}

/** Un drapeau en SVG dans la page ; « preparer » le retouche une fois posé. */
function DrapeauVectoriel({ code, preparer, className, libelle }: { code: string; preparer?: (svg: SVGSVGElement) => void; className?: string; libelle: string }) {
  const boite = useRef<HTMLDivElement>(null);
  const [pret, setPret] = useState(false);
  const url = urlDrapeau(pays(code));
  const preparerRef = useRef(preparer);
  useEffect(() => {
    preparerRef.current = preparer;
  });
  useEffect(() => {
    let vivant = true;
    chargerSvg(url)
      .then((texte) => {
        const el = boite.current;
        if (!vivant || !el) return;
        el.innerHTML = texte;
        const svg = el.querySelector("svg");
        if (!svg) return;
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.setAttribute("aria-hidden", "true");
        preparerRef.current?.(svg);
        setPret(true);
      })
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, [url]);
  return <div ref={boite} className={`pt-drapeau-svg ${className ?? ""}`} data-pret={pret || undefined} role="img" aria-label={libelle} />;
}

/** Le drapeau dont une couleur a disparu : ses formes sont hachurées. */
function DrapeauTrou({ code, couleur }: { code: string; couleur: string }) {
  return (
    <DrapeauVectoriel
      code={code}
      className="pt-drapeau-grand"
      libelle="Un drapeau dont une couleur a disparu"
      preparer={(svg) => {
        const ns = "http://www.w3.org/2000/svg";
        const id = `pt-trou-${code}`;
        const defs = document.createElementNS(ns, "defs");
        defs.innerHTML = `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="16" height="16" fill="#ece6d6"/><rect width="5" height="16" fill="#c9bea3"/></pattern>`;
        svg.prepend(defs);
        for (const el of formesVisibles(svg)) {
          if (nomDeCss(getComputedStyle(el).fill) === couleur) {
            el.setAttribute("fill", `url(#${id})`);
            el.style.fill = `url(#${id})`;
          }
        }
      }}
    />
  );
}

/** Un drapeau qui se dévoile, case après case. */
function DrapeauDevoile({ code }: { code: string }) {
  // Un ordre de dévoilement propre à chaque drapeau, toujours le même.
  const ordre = useMemo(() => {
    let h = 0;
    for (const c of code) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const cases = Array.from({ length: 12 }, (_, i) => i);
    for (let i = cases.length - 1; i > 0; i--) {
      h = (Math.imul(h ^ (h >>> 15), 2246822507) + i) >>> 0;
      const j = h % (i + 1);
      [cases[i], cases[j]] = [cases[j], cases[i]];
    }
    return cases;
  }, [code]);
  return (
    <div className="pt-devoile">
      <Drapeau code={code} nomme={false} grand />
      <div className="pt-devoile-cases" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} style={{ "--rang": ordre.indexOf(i) } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Colorier un drapeau ---------- */

export function Coloriage({ q, phase, onRepondre }: { q: Question; phase: string; onRepondre: (reponse: string) => void }) {
  const p = pays(q.cible);
  const attendu = useMemo(() => p.coloriage ?? [], [p]);
  // La palette : les couleurs du drapeau, et deux autres pour ne rien trahir.
  const palette = useMemo(() => {
    const siennes = [...new Set(attendu)];
    let h = 0;
    for (const c of q.cible) h = (h * 33 + c.charCodeAt(0)) >>> 0;
    const autres = COULEURS.filter((c) => !siennes.includes(c));
    const deux = [autres[h % autres.length], autres[(h >>> 4) % autres.length]].filter((c, i, t) => t.indexOf(c) === i);
    return COULEURS.filter((c) => siennes.includes(c) || deux.includes(c));
  }, [attendu, q.cible]);
  const [pinceau, setPinceau] = useState<Couleur>(palette[0] as Couleur);
  const [choix, setChoix] = useState<(Couleur | null)[]>(() => attendu.map(() => null));
  const formes = useRef<SVGElement[]>([]);
  const pinceauRef = useRef(pinceau);
  useEffect(() => {
    pinceauRef.current = pinceau;
  }, [pinceau]);
  const fini = phase !== "question";

  // Chaque forme prend la couleur choisie (ou reste blanche, cernée d'un trait).
  useEffect(() => {
    formes.current.forEach((el, i) => {
      const c = fini ? (attendu[i] as Couleur) : choix[i];
      el.style.fill = c ? PALETTE[c] : "#fbf8f0";
      el.style.stroke = c && !fini ? "rgba(0,0,0,0.3)" : "rgba(45,35,15,0.75)";
      el.style.strokeWidth = "1.8";
      el.style.vectorEffect = "non-scaling-stroke";
      if (c) el.removeAttribute("data-vide");
      else el.setAttribute("data-vide", "");
    });
  }, [choix, fini, attendu]);

  const complet = choix.every(Boolean);
  return (
    <div className="pt-coloriage">
      <DrapeauVectoriel
        code={q.cible}
        className="pt-drapeau-grand pt-coloriage-toile"
        libelle="Le drapeau à colorier : touche une forme pour la peindre"
        preparer={(svg) => {
          const liste = formesVisibles(svg);
          formes.current = liste;
          liste.forEach((el, i) => {
            el.style.cursor = "pointer";
            el.setAttribute("tabindex", "0");
            el.setAttribute("role", "button");
            el.setAttribute("aria-label", `Forme ${i + 1}`);
            const peindre = () => setChoix((c) => c.map((x, k) => (k === i ? pinceauRef.current : x)));
            el.addEventListener("click", peindre);
            el.addEventListener("keydown", (e) => {
              if ((e as KeyboardEvent).key === "Enter" || (e as KeyboardEvent).key === " ") {
                e.preventDefault();
                peindre();
              }
            });
            el.style.fill = "#fbf8f0";
          });
        }}
      />
      {!fini && (
        <>
          <div className="pt-palette" role="radiogroup" aria-label="Les couleurs">
            {palette.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={pinceau === c} className="pt-pastille" data-couleur={c} style={{ "--pastille": PALETTE[c as Couleur] } as React.CSSProperties} onClick={() => setPinceau(c as Couleur)}>
                <span aria-hidden="true" />
                {NOMS_COULEURS[c as Couleur]}
              </button>
            ))}
          </div>
          <button type="button" className="bouton bouton-principal" disabled={!complet} onClick={() => onRepondre(choix.join(","))}>
            <Check className="size-4" aria-hidden="true" />
            {complet ? "Valider" : `Encore ${choix.filter((c) => !c).length} forme${choix.filter((c) => !c).length > 1 ? "s" : ""} à peindre`}
          </button>
        </>
      )}
    </div>
  );
}

/* ---------- Ranger quatre pays ---------- */

/* ---------- Le puzzle du drapeau : six pièces à remettre en place ---------- */

const resolu = (ordre: number[], decoupe: string) => ordre.every((k, place) => decoupe[k] === decoupe[place]);

export function Puzzle({ q, phase, onRepondre }: { q: Question; phase: string; onRepondre: (reponse: string) => void }) {
  const p = pays(q.cible);
  const decoupe = p.decoupe ?? "abcdef";
  const [ordre, setOrdre] = useState<number[]>(() => {
    // Un mélange qui n'est pas déjà la solution (deux pièces identiques s'échangent sans rien changer).
    let graine = 7;
    for (const c of q.cible) graine = (graine * 31 + c.charCodeAt(0)) >>> 0;
    const h = hasard(graine);
    for (let essai = 0; essai < 50; essai++) {
      const t = melanger([0, 1, 2, 3, 4, 5], h);
      if (!resolu(t, decoupe)) return t;
    }
    return [5, 4, 3, 2, 1, 0];
  });
  const [choisi, setChoisi] = useState<number | null>(null);
  const fini = phase !== "question";
  const montre = fini ? [0, 1, 2, 3, 4, 5] : ordre;

  const toucher = (place: number) => {
    if (fini) return;
    if (choisi === null) return setChoisi(place);
    if (choisi === place) return setChoisi(null);
    const suite = [...ordre];
    [suite[choisi], suite[place]] = [suite[place], suite[choisi]];
    setOrdre(suite);
    setChoisi(null);
    if (resolu(suite, decoupe)) setTimeout(() => onRepondre(suite.join(",")), 260);
  };

  return (
    <div className="pt-puzzle-zone">
      <div className="pt-puzzle" data-fini={fini || undefined} role="group" aria-label="Le drapeau en six pièces : touche deux pièces pour les échanger">
        {montre.map((k, place) => (
          <button
            key={place}
            type="button"
            className="pt-puzzle-piece"
            data-choisie={(!fini && choisi === place) || undefined}
            disabled={fini}
            onClick={() => toucher(place)}
            aria-pressed={choisi === place}
            aria-label={`Place ${place + 1} : pièce ${k + 1}${choisi === place ? ", choisie" : ""}`}
            style={{ backgroundImage: `url(${urlDrapeau(p)})`, backgroundPosition: `${(k % 3) * 50}% ${Math.floor(k / 3) * 100}%` }}
          />
        ))}
      </div>
      {!fini && (
        <button type="button" className="bouton bouton-discret" onClick={() => onRepondre(ordre.join(","))}>
          <Check className="size-4" aria-hidden="true" />
          Valider tel quel
        </button>
      )}
    </div>
  );
}

export function Classement({ q, phase, onRepondre }: { q: Question; phase: string; onRepondre: (reponse: string) => void }) {
  const [ordre, setOrdre] = useState<string[]>(() => q.codes ?? []);
  const population = q.type === "classer-population";
  const fini = phase !== "question";
  const attendu = q.attendu.split(",");
  const liste = useRef<HTMLOListElement>(null);
  const glisse = useRef<{ code: string; y: number; hauteur: number } | null>(null);
  const [tenu, setTenu] = useState<string | null>(null);

  const deplacer = (i: number, sens: -1 | 1) =>
    setOrdre((o) => {
      const j = i + sens;
      if (j < 0 || j >= o.length) return o;
      const t = [...o];
      [t[i], t[j]] = [t[j], t[i]];
      return t;
    });

  return (
    <div className="pt-classer">
      <p className="pt-classer-bornes" aria-hidden="true">
        <span>{population ? "Le plus peuplé" : "Le plus grand"}</span>
      </p>
      <ol ref={liste} className="pt-classer-liste" aria-label={population ? "Du plus peuplé au moins peuplé" : "Du plus grand au plus petit"}>
        {ordre.map((code, i) => {
          const p = pays(code);
          const etat = fini ? (attendu[i] === code ? "juste" : "faux") : undefined;
          return (
            <li
              key={code}
              className="pt-classer-ligne"
              data-tenu={tenu === code || undefined}
              data-etat={etat}
              onPointerDown={(e) => {
                if (fini || (e.target as HTMLElement).closest("button")) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                glisse.current = { code, y: e.clientY, hauteur: e.currentTarget.getBoundingClientRect().height + 8 };
                setTenu(code);
              }}
              onPointerMove={(e) => {
                const g = glisse.current;
                if (!g) return;
                const d = e.clientY - g.y;
                if (Math.abs(d) > g.hauteur * 0.55) {
                  const k = ordre.indexOf(g.code);
                  deplacer(k, d > 0 ? 1 : -1);
                  g.y += d > 0 ? g.hauteur : -g.hauteur;
                }
              }}
              onPointerUp={() => {
                glisse.current = null;
                setTenu(null);
              }}
              onPointerCancel={() => {
                glisse.current = null;
                setTenu(null);
              }}
            >
              <span className="pt-classer-rang tabular-nums">{i + 1}</span>
              <Drapeau code={code} />
              <span className="pt-classer-nom">
                {p.nom}
                {fini && <small>{population ? formatPopulation(p.population) : formatSuperficie(p.superficie)}</small>}
              </span>
              {!fini && (
                <span className="pt-classer-fleches">
                  <button type="button" className="pt-icone" onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label={`Monter ${p.nom}`}>
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </button>
                  <button type="button" className="pt-icone" onClick={() => deplacer(i, 1)} disabled={i === ordre.length - 1} aria-label={`Descendre ${p.nom}`}>
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </button>
                  <GripVertical className="pt-classer-poignee size-5" aria-hidden="true" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="pt-classer-bornes" aria-hidden="true">
        <span>{population ? "Le moins peuplé" : "Le plus petit"}</span>
      </p>
      {!fini && (
        <button type="button" className="bouton bouton-principal" onClick={() => onRepondre(ordre.join(","))}>
          <Check className="size-4" aria-hidden="true" />
          Valider cet ordre
        </button>
      )}
    </div>
  );
}

/* ---------- Poser une capitale sur le globe ---------- */

function PlacerCapitale({ q, globe, phase, choix, onRepondre }: { q: Question; globe: React.RefObject<GlobeRef | null>; phase: string; choix: string | null; onRepondre: (reponse: string) => void }) {
  const p = pays(q.cible);
  const pose = choix && /^-?[\d.]+,-?[\d.]+$/.test(choix) ? (choix.split(",").map(Number) as [number, number]) : null;
  const vrai = p.capLatLng!;
  const marques: Marque[] = [];
  const traits: Trait[] = [];
  if (phase === "reponse") {
    if (pose) {
      marques.push({ latlng: pose, teinte: "choix", taille: 5 });
      traits.push({ points: grandCercle(pose, vrai, 48), teinte: "or", tirets: true });
    }
    marques.push({ latlng: vrai, teinte: "juste", taille: 6.5, libelle: p.capitale ?? undefined });
  }
  // Après la réponse, le globe se tourne vers la vraie capitale.
  useEffect(() => {
    if (phase === "reponse") globe.current?.voler({ lon: vrai[1], lat: vrai[0], zoom: pose ? Math.max(1.4, Math.min(5, 2600 / Math.max(300, distanceKm(pose, vrai)))) : 3 });
  }, [phase, globe, vrai, pose]);
  return (
    <div className="pt-invite-globe" data-large="">
      <p className="pt-nom-grand" lang="fr">
        {p.nom}
      </p>
      <Globe
        ref={globe}
        interactif
        marques={marques}
        traits={traits}
        onPoint={(ll) => {
          if (phase === "question" && ll) onRepondre(`${ll[0].toFixed(2)},${ll[1].toFixed(2)}`);
        }}
        libelle={`Globe : touche l'endroit où se trouve ${p.capitale}`}
        vueInitiale={{ lon: 15, lat: 25, zoom: 1 }}
      />
    </div>
  );
}

/* ---------- Ce qu'on montre ---------- */

const ETIQUETTES: Partial<Record<Question["type"], string>> = {
  "gentile-pays": "Les habitants",
  "langue-pays": "Langue officielle",
  "ville-pays": "Ville",
  "sommet-pays": "Point culminant",
  "fleuve-pays": "Plus long fleuve",
  "tld-pays": "Domaine Internet",
  "indicatif-pays": "Indicatif",
};

const nomMonnaie = (code: string) => PAYS.find((p) => p.monnaies.some((m) => m.code === code))?.monnaies.find((m) => m.code === code);
const decalageMinutesDe = (p: { fuseau?: string }) => (p.fuseau ? decalageMinutes(p.fuseau) : 0);

const INVITES_AUTRES = new Set(["drapeau-gris", "drapeau-devoile", "drapeau-trou", "coloriage", "puzzle", "proposition", "texte", "heure", "heure-locale", "aucune"]);
/** Les invites dont formes.tsx se charge (les autres restent à Partie.tsx). */
export const gereInvite = (q: Question): boolean => TYPES[q.type].reponse === "placer" || INVITES_AUTRES.has(TYPES[q.type].invite) || q.type === "monnaie-intrus";

/** Les invites des nouvelles méthodes. Le globe n'est rendu ici que pour « poser la capitale ». */
export function InviteAutre({ q, globe, phase, choix, onRepondre }: { q: Question; globe: React.RefObject<GlobeRef | null>; phase: string; choix: string | null; onRepondre: (reponse: string) => void }): React.ReactNode {
  const def = TYPES[q.type];
  const p = pays(q.cible);
  if (def.reponse === "placer") return <PlacerCapitale q={q} globe={globe} phase={phase} choix={choix} onRepondre={onRepondre} />;
  switch (def.invite) {
    case "drapeau-gris":
      return <Drapeau code={q.cible} nomme={false} grand className="pt-drapeau-gris" />;
    case "drapeau-devoile":
      return <DrapeauDevoile code={q.cible} />;
    case "drapeau-trou":
      return <DrapeauTrou code={q.cible} couleur={q.couleur ?? ""} />;
    case "coloriage":
    case "puzzle":
      return (
        <div className="pt-invite-texte">
          <span className="pt-invite-etiquette">{p.statut === "territoire" ? "Territoire" : "Pays"}</span>
          <span className="pt-nom-grand">{p.nom}</span>
        </div>
      );
    case "proposition": {
      const m = q.montre ? PAR_CODE.get(q.montre) : undefined;
      if (!m) return null;
      return q.type === "drapeau-vrai-faux" ? (
        <div className="pt-proposition">
          <Drapeau code={m.code} nomme={false} grand />
          <p>
            C&apos;est le drapeau <strong>{duNom(p)}</strong>.
          </p>
        </div>
      ) : (
        <div className="pt-proposition">
          <p>
            La capitale <strong>{duNom(p)}</strong> est <strong className="pt-nom-grand">{m.capitale}</strong>.
          </p>
        </div>
      );
    }
    case "silhouette-tournee":
      return null;
    case "texte": {
      const valeur = q.texte ?? "";
      const detail = q.type === "sommet-pays" && p.sommet ? `${new Intl.NumberFormat("fr-FR").format(p.sommet[1]).replace(/ /g, " ")} m` : q.type === "fleuve-pays" && p.fleuve ? formatKm(p.fleuve[1]) : null;
      return (
        <div className="pt-invite-texte">
          <span className="pt-invite-etiquette">{ETIQUETTES[q.type] ?? ""}</span>
          <span className="pt-nom-grand" lang={q.type === "tld-pays" || q.type === "indicatif-pays" ? "zxx" : "fr"}>
            {q.type === "gentile-pays" ? pluriel(valeur) : valeur}
          </span>
          {detail && <span className="pt-invite-symbole">{detail}</span>}
        </div>
      );
    }
    case "heure":
      return (
        <div className="pt-horloges">
          <div className="pt-horloge">
            <span className="pt-invite-etiquette">À Paris</span>
            <span className="pt-nom-grand tabular-nums">12&nbsp;h</span>
          </div>
          <div className="pt-horloge" data-question="">
            <span className="pt-invite-etiquette">
              {p.capitale ? `À ${p.capitale}` : "Là-bas"} ({p.nom})
            </span>
            <span className="pt-nom-grand">?</span>
          </div>
        </div>
      );
    case "heure-locale":
      return (
        <div className="pt-horloges">
          <div className="pt-horloge">
            <span className="pt-invite-etiquette">À Paris</span>
            <span className="pt-nom-grand tabular-nums">12&nbsp;h</span>
          </div>
          <div className="pt-horloge" data-question="">
            <span className="pt-invite-etiquette">Là où tu es</span>
            <span className="pt-nom-grand tabular-nums">{heureQuandMidi(q.ecart ?? 0)}</span>
          </div>
        </div>
      );
    case "monnaie": {
      if (q.type !== "monnaie-intrus" || !q.texte) return null;
      const m = nomMonnaie(q.texte);
      return (
        <div className="pt-invite-texte">
          <span className="pt-invite-etiquette">Monnaie</span>
          <span className="pt-nom-grand">{m ? m.nom : q.texte}</span>
          {m?.symbole && <span className="pt-invite-symbole">{m.symbole}</span>}
        </div>
      );
    }
    case "aucune":
      return <div className="pt-invite-vide" aria-hidden="true" />;
    default:
      return null;
  }
}

/** Le contenu d'un choix, pour les nouvelles sortes de réponse (null : Partie.tsx s'en charge). */
export function ContenuOptionAutre({ q, o }: { q: Question; o: Question["options"][number] }): React.ReactNode | null {
  const r = TYPES[q.type].reponse;
  if (r === "couleur")
    return (
      <span className="pt-option-couleur">
        <span className="pt-pastille-rond" style={{ "--pastille": PALETTE[o.id as Couleur] } as React.CSSProperties} aria-hidden="true" />
        <span>{NOMS_COULEURS[o.id as Couleur] ?? o.texte}</span>
      </span>
    );
  if (r === "vraifaux") return <span className="pt-option-texte pt-option-vf">{o.texte}</span>;
  if (q.type === "pays-gentile") return <span className="pt-option-texte">{pluriel(o.texte ?? o.id)}</span>;
  return null;
}

/** Ce qu'il fallait trouver, en mots (null : la réponse habituelle). */
export function bonneReponseAutre(q: Question, choix: string | null): string | null {
  const p = pays(q.cible);
  const nom = (c: string | undefined) => (c ? (PAR_CODE.get(c)?.nom ?? c) : "");
  const altitude = (m: number) => `${new Intl.NumberFormat("fr-FR").format(m).replace(/\u202f/g, "\u00a0")}\u00a0m`;
  switch (q.type) {
    case "pays-gentile":
    case "gentile-pays":
      return p.gentile ? `les ${pluriel(p.gentile[0])} (et les ${pluriel(p.gentile[1])}), ${auNom(p)}` : null;
    case "pays-langue":
      return `${p.langues.join(", ")}, ${auNom(p)}`;
    case "langue-pays":
      return `${p.nom}, où l'on parle ${p.langues.join(", ")}`;
    case "ville-pays":
      return `${p.nom} : ${q.texte} est ${auNom(p)}`;
    case "pays-ville":
      return `${q.attendu}, ${auNom(p)}`;
    case "sommet-pays":
    case "pays-sommet":
      return p.sommet ? `${p.sommet[0]}, ${altitude(p.sommet[1])}, ${auNom(p)}` : null;
    case "fleuve-pays":
    case "pays-fleuve":
      return p.fleuve ? `${p.fleuve[0]}, ${formatKm(p.fleuve[1])}, ${auNom(p)}` : null;
    case "pays-conduite":
      return `à ${p.conduite}, ${auNom(p)}`;
    case "tld-pays":
      return `${p.nom} (${p.tld})`;
    case "pays-indicatif":
    case "indicatif-pays":
      return `${p.indicatif}, ${auNom(p)}`;
    case "pays-iso":
      return `${p.iso3}, pour ${leNom(p)}`;
    case "fuseau-heure":
      return `${heureQuandMidi(q.ecart ?? 0)} ${p.capitale ? `à ${p.capitale}` : auNom(p)} (${formatDecalage(decalageMinutesDe(p))})`;
    case "heure-pays":
      return `${p.nom} : il y est ${heureQuandMidi(q.ecart ?? 0)} quand il est midi à Paris`;
    case "voisin-de":
      return `${nom(q.attendu)}. Les voisins ${duNom(p)} : ${p.voisins.map((v) => nom(v)).join(", ")}`;
    case "pas-voisin":
      return `${nom(q.attendu)}, qui ne touche pas ${leNom(p)}`;
    case "nb-voisins":
      return `${p.voisins.length} : ${p.voisins.map((v) => nom(v)).join(", ")}`;
    case "plus-peuple":
      return `${p.nom}, ${formatPopulation(p.population)}`;
    case "plus-grand":
      return `${p.nom}, ${formatSuperficie(p.superficie)}`;
    case "classer-population":
    case "classer-superficie":
      return q.attendu
        .split(",")
        .map((c) => nom(c))
        .join(", puis ");
    case "drapeau-vrai-faux": {
      const m = PAR_CODE.get(q.montre ?? "");
      return m ? (m.drapeau === p.drapeau ? `vrai, c'est bien le drapeau ${duNom(p)}` : `faux, c'est le drapeau ${duNom(m)}`) : null;
    }
    case "capitale-vrai-faux": {
      const m = PAR_CODE.get(q.montre ?? "");
      return m ? (m.capitale === p.capitale ? `vrai, ${p.capitale} est bien la capitale ${duNom(p)}` : `faux, ${m.capitale} est la capitale ${duNom(m)} ; celle ${duNom(p)}, c'est ${p.capitale}`) : null;
    }
    case "drapeau-couleur":
      return `${(NOMS_COULEURS[q.couleur as Couleur] ?? q.couleur ?? "").toLowerCase()}, sur le drapeau ${duNom(p)}`;
    case "drapeau-colorie":
      return `le drapeau ${duNom(p)}, ci-dessus`;
    case "capitale-placer": {
      const pose = choix && /^-?[\d.]+,-?[\d.]+$/.test(choix) ? (choix.split(",").map(Number) as [number, number]) : null;
      return pose && p.capLatLng ? `${p.capitale}. Tu étais à ${formatKm(distanceKm(pose, p.capLatLng))}` : `${p.capitale}`;
    }
    case "continent-intrus":
      return `${p.nom}, en ${NOM_CONTINENT[p.continent]}`;
    case "monnaie-intrus":
      return `${p.nom}, dont la monnaie est : ${p.monnaies[0]?.nom}`;
    case "drapeau-carte":
    case "capitale-carte":
      return `${p.nom}${p.capitale ? ` (${motCapitale(p).toLowerCase()} : ${p.capitale})` : ""}`;
    default:
      return null;
  }
}

/** Un « presque » : ce qu'on dit, selon la méthode. */
export function presqueAutre(q: Question, choix: string | null): string | null {
  if (q.type === "capitale-placer") return bonneReponseAutre(q, choix);
  if (q.type === "drapeau-colorie") return "Presque : une seule forme n'a pas la bonne couleur.";
  return null;
}

export type { Jugement };
