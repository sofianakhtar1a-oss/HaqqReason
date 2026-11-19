"use client";

import {
  Accessibility,
  ArrowLeft,
  BookMarked,
  ChartColumn,
  Download,
  Eye,
  Focus,
  Hourglass,
  Keyboard,
  Languages,
  Music2,
  NotebookPen,
  RotateCcw,
  Settings2,
  Swords,
  Timer,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CONTINENTS, formatNombre } from "@/lib/monde/atlas";
import { CATEGORIES, IDS_CATEGORIES, type CategorieId } from "@/lib/monde/categories";
import { PAYS } from "@/lib/monde/donnees";
import { exporterProgression, importerProgression, LANGUES, regler, remettreAZero, useMonde, type EntreeJournal, type Profil, type TailleTexte } from "@/lib/monde/progression";
import { ICONES_CATEGORIES } from "./Accueil";
import { useConfirmer } from "./Confirmer";
import { jouer } from "./sons";
import { localeDe } from "./traduction";

/* =====================================================================
   Les réglages : les sons, la lecture, le temps, la langue, les données
   ===================================================================== */

function Interrupteur({ cle, titre, aide, desactive }: { cle: keyof Pick<Profil, "son" | "ambiance" | "vibrations" | "voix" | "daltonien" | "contraste" | "plusDeTemps" | "concentration" | "chrono">; titre: string; aide?: string; desactive?: boolean }) {
  const monde = useMonde();
  const actif = Boolean(monde.profil[cle]);
  return (
    <label className="pt-reglage" data-desactive={desactive || undefined}>
      <span className="pt-reglage-texte">
        <span className="pt-reglage-titre">{titre}</span>
        {aide && <span className="pt-reglage-aide">{aide}</span>}
      </span>
      <span className="pt-interrupteur">
        <input
          type="checkbox"
          checked={actif}
          disabled={desactive}
          onChange={(e) => {
            regler({ [cle]: e.target.checked });
            if (cle === "son" && e.target.checked) setTimeout(() => jouer("juste"), 30);
          }}
        />
        <span className="pt-interrupteur-piste" aria-hidden="true" />
      </span>
    </label>
  );
}

const TAILLES: readonly [TailleTexte, string][] = [
  [100, "Normale"],
  [115, "Grande"],
  [130, "Très grande"],
];

export function PageReglages({ onRetour, aller }: { onRetour: () => void; aller: (hash: string) => void }) {
  const monde = useMonde();
  const p = monde.profil;
  const [message, setMessage] = useState<string | null>(null);
  const [categorie, setCategorie] = useState<CategorieId>("drapeaux");
  const [confirmation, confirmer] = useConfirmer();
  const fichier = useRef<HTMLInputElement>(null);
  const [vibreur] = useState(() => typeof navigator !== "undefined" && typeof navigator.vibrate === "function");

  const exporter = () => {
    const blob = new Blob([exporterProgression()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portulan-progression-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMessage("Ta progression est enregistrée dans un fichier : garde-le, ou rapporte-le sur un autre appareil.");
  };
  const importer = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 8_000_000) return setMessage("Ce fichier est trop lourd pour être une progression du Portulan.");
    const ok = importerProgression(await f.text());
    setMessage(ok ? "La progression du fichier est rapportée : le meilleur des deux est gardé." : "Ce fichier n'est pas une progression du Portulan.");
    if (fichier.current) fichier.current.value = "";
  };
  const remettre = async () => {
    const nom = CATEGORIES[categorie].nom;
    const oui = await confirmer({ titre: `Remettre « ${nom} » à zéro ?`, texte: "Les niveaux réussis et la mémoire des pays de cette catégorie s'effacent, sur cet appareil et sur ton compte. L'XP, les ducats et les autres catégories restent.", oui: "Remettre à zéro", danger: true });
    if (!oui) return;
    remettreAZero(categorie);
    setMessage(`« ${nom} » repart de zéro : la route t'attend au premier niveau.`);
  };

  return (
    <div className="pt-categorie pt-reglages-page">
      <button type="button" className="pt-retour-lien" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Toutes les routes
      </button>
      <header className="pt-categorie-tete">
        <Settings2 className="pt-categorie-icone" strokeWidth={1.3} aria-hidden="true" />
        <div>
          <h2 className="pt-titre">Mes réglages</h2>
          <p className="pt-chapo">Le son, la lecture, le temps, la langue : Le Portulan à ta main. Les réglages suivent ton compte d&apos;un appareil à l&apos;autre.</p>
        </div>
      </header>
      {message && (
        <p className="pt-message" role="status">
          {message}
        </p>
      )}

      <div className="pt-reglages-grille">
        <section className="pt-reglages-carte" aria-labelledby="pt-r-sons">
          <h3 id="pt-r-sons" className="pt-reglages-titre">
            <Music2 className="size-5" aria-hidden="true" />
            Sons et sensations
          </h3>
          <Interrupteur cle="son" titre="Les sons du jeu" aide="Une clochette pour une bonne réponse, un accord pour un niveau réussi, le sceau qui frappe le parchemin." />
          <Interrupteur cle="ambiance" titre="La mer et le vent" aide="Une houle douce en fond, tant que Le Portulan est ouvert." />
          <Interrupteur cle="vibrations" titre="Les vibrations" aide={vibreur ? "Un léger frisson du téléphone à chaque réponse." : "Ce navigateur ne sait pas faire vibrer l'appareil."} desactive={!vibreur} />
          <Interrupteur cle="voix" titre="Lire les questions à voix haute" aide="La consigne, puis les choix, dits par la voix de l'appareil." />
        </section>

        <section className="pt-reglages-carte" aria-labelledby="pt-r-lecture">
          <h3 id="pt-r-lecture" className="pt-reglages-titre">
            <Eye className="size-5" aria-hidden="true" />
            Lecture et couleurs
          </h3>
          <div className="pt-reglage">
            <span className="pt-reglage-texte">
              <span className="pt-reglage-titre">La taille du texte</span>
            </span>
            <span className="pt-segments" role="group" aria-label="La taille du texte">
              {TAILLES.map(([t, n]) => (
                <button key={t} type="button" aria-pressed={p.taille === t} onClick={() => regler({ taille: t })}>
                  {n}
                </button>
              ))}
            </span>
          </div>
          <Interrupteur cle="contraste" titre="Plus de contraste" aide="Les textes secondaires à pleine encre, les traits plus marqués." />
          <label className="pt-reglage">
            <span className="pt-reglage-texte">
              <span className="pt-reglage-titre">Une police pour la dyslexie</span>
              <span className="pt-reglage-aide pt-reglage-exemple">OpenDyslexic : des lettres lestées vers le bas, plus faciles à distinguer.</span>
            </span>
            <span className="pt-interrupteur">
              <input type="checkbox" checked={p.police === "dyslexie"} onChange={(e) => regler({ police: e.target.checked ? "dyslexie" : "normale" })} />
              <span className="pt-interrupteur-piste" aria-hidden="true" />
            </span>
          </label>
          <Interrupteur cle="daltonien" titre="Des couleurs pour les daltoniens" aide="Le bleu dit juste, l'orange dit faux, sur les boutons comme sur le globe." />
        </section>

        <section className="pt-reglages-carte" aria-labelledby="pt-r-temps">
          <h3 id="pt-r-temps" className="pt-reglages-titre">
            <Hourglass className="size-5" aria-hidden="true" />
            Le temps et l&apos;attention
          </h3>
          <Interrupteur cle="plusDeTemps" titre="Plus de temps (deux fois plus)" aide="À chaque question chronométrée et aux jeux contre la montre. En duel, le temps reste le même pour tous ; les records en ligne ne comptent pas les parties au temps doublé." />
          <Interrupteur cle="concentration" titre="Le mode concentration" aide="Pendant une partie, rien que la question : ni décor, ni compteur de série, ni éclats." />
          <Interrupteur cle="chrono" titre="Le chrono à chaque question" aide="Sans chrono, on prend le temps qu'il faut (l'étoile de vitesse reste à gagner)." />
        </section>

        <section className="pt-reglages-carte" aria-labelledby="pt-r-langue">
          <h3 id="pt-r-langue" className="pt-reglages-titre">
            <Languages className="size-5" aria-hidden="true" />
            La langue
          </h3>
          <p className="pt-reglage-aide">La langue de l&apos;interface du Portulan, et des noms des pays.</p>
          <span className="pt-segments pt-langues" role="group" aria-label="La langue de l'interface">
            {LANGUES.map((l) => (
              <button key={l.id} type="button" lang={l.id} aria-pressed={p.langue === l.id} onClick={() => regler({ langue: l.id })}>
                {l.nom}
              </button>
            ))}
          </span>
          <button type="button" className="pt-lien pt-reglages-lien" onClick={() => window.dispatchEvent(new CustomEvent("portulan:aide-clavier"))}>
            <Keyboard className="size-4" aria-hidden="true" />
            Les raccourcis du clavier (touche ?)
          </button>
        </section>

        <section className="pt-reglages-carte pt-reglages-donnees" aria-labelledby="pt-r-donnees">
          <h3 id="pt-r-donnees" className="pt-reglages-titre">
            <BookMarked className="size-5" aria-hidden="true" />
            Mes données
          </h3>
          <div className="pt-reglages-actions">
            <button type="button" className="bouton bouton-discret" onClick={() => aller("accueil/journal")}>
              <NotebookPen className="size-4" aria-hidden="true" />
              Mon journal de bord
            </button>
            <button type="button" className="bouton bouton-discret" onClick={() => aller("accueil/statistiques")}>
              <ChartColumn className="size-4" aria-hidden="true" />
              Mes statistiques
            </button>
          </div>
          <div className="pt-reglages-actions">
            <button type="button" className="bouton bouton-discret" onClick={exporter}>
              <Download className="size-4" aria-hidden="true" />
              Exporter ma progression
            </button>
            <button type="button" className="bouton bouton-discret" onClick={() => fichier.current?.click()}>
              <Upload className="size-4" aria-hidden="true" />
              Importer un fichier
            </button>
            <input ref={fichier} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => void importer(e.target.files?.[0])} />
          </div>
          <div className="pt-reglage pt-remise">
            <span className="pt-reglage-texte">
              <span className="pt-reglage-titre">Remettre une catégorie à zéro</span>
              <span className="pt-reglage-aide">Pour reprendre une route depuis le début ; le reste ne bouge pas.</span>
            </span>
            <span className="pt-remise-choix">
              <select value={categorie} onChange={(e) => setCategorie(e.target.value as CategorieId)} aria-label="La catégorie à remettre à zéro">
                {IDS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORIES[c].nom}
                  </option>
                ))}
              </select>
              <button type="button" className="bouton bouton-discret" onClick={() => void remettre()}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Remettre à zéro
              </button>
            </span>
          </div>
        </section>
      </div>
      {confirmation}
    </div>
  );
}

/* =====================================================================
   Le journal de bord
   ===================================================================== */

const NOMS_SORTES: Record<string, string> = {
  niveau: "Niveau",
  eclair: "L'éclair",
  survie: "Sans faute",
  revision: "Révisions",
  examen: "Examen",
  tour: "Tour du monde",
  theme: "Route thématique",
  defi: "Défi",
  epreuve: "Épreuve",
  marathon: "Marathon",
  chrono: "Contre la montre",
  erreurs: "Mes erreurs",
  filtre: "Partie choisie",
  cabinet: "Cabinet",
  nomme: "Nomme-les tous",
  duel: "Duel",
  salon: "Salon",
  carte: "Jeu de carte",
};

const DUREE_JOUR = 86_400_000;
/** Le jour local d'un instant (pour grouper par jour, à minuit chez soi). */
const jourLocal = (t: number) => Math.floor((t - new Date(t).getTimezoneOffset() * 60_000) / DUREE_JOUR);

function duree(s: number): string {
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}

export function JournalDeBord({ onRetour, aller }: { onRetour: () => void; aller: (hash: string) => void }) {
  const monde = useMonde();
  const [maintenant] = useState(() => Date.now());
  const aujourdhui = jourLocal(maintenant);
  const groupes = useMemo(() => {
    const m = new Map<number, EntreeJournal[]>();
    for (const x of [...monde.journal].reverse()) {
      const j = jourLocal(x.t);
      m.set(j, [...(m.get(j) ?? []), x]);
    }
    return [...m.entries()];
  }, [monde.journal]);
  const semaine = monde.journal.filter((x) => x.t > maintenant - 7 * DUREE_JOUR);
  const heure = new Intl.DateTimeFormat(localeDe(monde.profil.langue), { hour: "2-digit", minute: "2-digit" });
  const date = new Intl.DateTimeFormat(localeDe(monde.profil.langue), { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="pt-categorie pt-journal">
      <button type="button" className="pt-retour-lien" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Mes réglages
      </button>
      <header className="pt-categorie-tete">
        <NotebookPen className="pt-categorie-icone" strokeWidth={1.3} aria-hidden="true" />
        <div>
          <h2 className="pt-titre">Mon journal de bord</h2>
          <p className="pt-chapo">Chaque partie terminée, à sa date : ce que tu as joué, ce que tu as su, le temps passé.</p>
        </div>
      </header>
      <dl className="pt-bilan pt-journal-bilan">
        <div>
          <dt>Parties cette semaine</dt>
          <dd className="tabular-nums">{semaine.length}</dd>
        </div>
        <div>
          <dt>Temps cette semaine</dt>
          <dd className="tabular-nums">{duree(semaine.reduce((s, x) => s + x.d, 0))}</dd>
        </div>
        <div>
          <dt>Parties au journal</dt>
          <dd className="tabular-nums">{monde.journal.length}</dd>
        </div>
      </dl>
      {groupes.length === 0 ? (
        <p className="pt-astuce">Le journal est encore vierge : la première partie terminée s&apos;y inscrira.</p>
      ) : (
        groupes.map(([j, liste]) => (
          <section key={j} className="pt-journal-jour" aria-label={j === aujourdhui ? "Aujourd'hui" : date.format(liste[0].t)}>
            <h3 className="pt-journal-date">{j === aujourdhui ? "Aujourd'hui" : j === aujourdhui - 1 ? "Hier" : date.format(liste[0].t)}</h3>
            <ol className="pt-journal-liste">
              {liste.map((x) => (
                <li key={`${x.t}${x.s}`} data-resultat={x.r ?? (x.e === 0 ? "rate" : undefined)}>
                  <span className="pt-journal-heure tabular-nums">{heure.format(x.t)}</span>
                  <span className="pt-journal-texte">
                    <strong>{x.n}</strong>
                    <small>
                      {x.n.toLowerCase().includes((NOMS_SORTES[x.s] ?? x.s).toLowerCase()) ? (x.s === "niveau" ? "Niveau" : "Partie") : (NOMS_SORTES[x.s] ?? x.s)}
                      {x.r ? `, ${x.r === "v" ? "victoire" : x.r === "d" ? "défaite" : "égalité"}` : ""}
                      {x.e !== undefined && x.s === "niveau" ? (x.e > 0 ? `, ${x.e} étoile${x.e > 1 ? "s" : ""}` : ", naufrage") : ""}
                      {x.d ? `, ${duree(x.d)}` : ""}
                    </small>
                  </span>
                  <span className="pt-journal-score tabular-nums">
                    {x.b}
                    {x.q ? <small>/{x.q}</small> : <small> bonnes</small>}
                  </span>
                  <span className="pt-journal-xp tabular-nums">{x.x ? `+${x.x} XP` : ""}</span>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
      <p className="pt-astuce">
        <button type="button" className="pt-lien" onClick={() => aller("accueil/statistiques")}>
          Voir mes statistiques
        </button>
      </p>
    </div>
  );
}

/* =====================================================================
   Les statistiques
   ===================================================================== */

export function Statistiques({ onRetour, aller }: { onRetour: () => void; aller: (hash: string) => void }) {
  const monde = useMonde();
  const [maintenant] = useState(() => Date.now());
  const s = useMemo(() => {
    let bonnes = 0;
    let fautes = 0;
    const parCategorie = new Map<CategorieId, { b: number; f: number; sus: number; total: number }>();
    const parContinent = new Map<string, { b: number; f: number }>();
    const parPays: { code: string; b: number; f: number }[] = [];
    for (const c of IDS_CATEGORIES) parCategorie.set(c, { b: 0, f: 0, sus: 0, total: PAYS.filter(CATEGORIES[c].eligible).length });
    for (const p of PAYS) {
      const m = monde.pays[p.code];
      if (!m) continue;
      let pb = 0;
      let pf = 0;
      for (const [f, x] of Object.entries(m)) {
        if (!x || f === "fiches") continue;
        pb += x[0];
        pf += x[1];
        const c = parCategorie.get(f as CategorieId);
        if (c) {
          c.b += x[0];
          c.f += x[1];
          if (x[2] >= 3 && CATEGORIES[f as CategorieId].eligible(p)) c.sus++;
        }
      }
      bonnes += pb;
      fautes += pf;
      const k = parContinent.get(p.continent) ?? { b: 0, f: 0 };
      parContinent.set(p.continent, { b: k.b + pb, f: k.f + pf });
      if (pb + pf > 0) parPays.push({ code: p.code, b: pb, f: pf });
    }
    const rates = parPays
      .filter((x) => x.f >= 2)
      .sort((a, b) => b.f / (b.b + b.f) - a.f / (a.b + a.f) || b.f - a.f)
      .slice(0, 8);
    const surs = parPays
      .filter((x) => x.b >= 4)
      .sort((a, b) => a.f / (a.b + a.f) - b.f / (b.b + b.f) || b.b - a.b)
      .slice(0, 8);
    // L'activité des douze dernières semaines (des parties par jour).
    const jour = jourLocal(maintenant);
    const activite = new Map<number, number>();
    for (const x of monde.journal) {
      const j = jourLocal(x.t);
      if (jour - j < 84) activite.set(j, (activite.get(j) ?? 0) + 1);
    }
    const temps = monde.journal.reduce((t, x) => t + x.d, 0);
    const duels = monde.journal.filter((x) => x.r);
    return { bonnes, fautes, parCategorie, parContinent, rates, surs, activite, jour, temps, duels };
  }, [monde, maintenant]);
  const total = s.bonnes + s.fautes;
  const pct = (b: number, f: number) => (b + f ? Math.round((100 * b) / (b + f)) : 0);
  const plusActif = Math.max(1, ...s.activite.values());
  // La grille d'activité : 12 colonnes (semaines), du lundi au dimanche.
  const lundi = s.jour - ((s.jour + 3) % 7);
  const debut = lundi - 11 * 7;
  const nom = (code: string) => PAYS.find((p) => p.code === code)?.nom ?? code;
  const jourCourt = new Intl.DateTimeFormat(localeDe(monde.profil.langue), { day: "numeric", month: "short" });
  return (
    <div className="pt-categorie pt-stats">
      <button type="button" className="pt-retour-lien" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Mes réglages
      </button>
      <header className="pt-categorie-tete">
        <ChartColumn className="pt-categorie-icone" strokeWidth={1.3} aria-hidden="true" />
        <div>
          <h2 className="pt-titre">Mes statistiques</h2>
          <p className="pt-chapo">Ce que ta mémoire a retenu, catégorie par catégorie et continent par continent.</p>
        </div>
      </header>
      <dl className="pt-bilan">
        <div>
          <dt>Réponses données</dt>
          <dd className="tabular-nums">{formatNombre(total)}</dd>
        </div>
        <div>
          <dt>Justesse</dt>
          <dd className="tabular-nums">
            {pct(s.bonnes, s.fautes)}
            <span className="pt-bilan-sur"> %</span>
          </dd>
        </div>
        <div>
          <dt>Série de jours</dt>
          <dd className="tabular-nums">{monde.profil.jours}</dd>
        </div>
        <div>
          <dt>Temps de jeu</dt>
          <dd className="tabular-nums">{duree(s.temps)}</dd>
        </div>
        {s.duels.length > 0 && (
          <div>
            <dt>Duels gagnés</dt>
            <dd className="tabular-nums">
              {s.duels.filter((x) => x.r === "v").length}
              <span className="pt-bilan-sur">/{s.duels.length}</span>
            </dd>
          </div>
        )}
      </dl>

      <section aria-labelledby="pt-stats-activite">
        <h3 id="pt-stats-activite" className="pt-sous-titre">
          Les douze dernières semaines
        </h3>
        <div className="pt-activite" role="img" aria-label={`${[...s.activite.values()].reduce((a, b) => a + b, 0)} parties en douze semaines`}>
          {Array.from({ length: 12 * 7 }, (_, i) => {
            const semaine = Math.floor(i / 7);
            const j = debut + semaine * 7 + (i % 7);
            const n = s.activite.get(j) ?? 0;
            return <span key={i} style={{ gridColumn: semaine + 1, gridRow: (i % 7) + 1, "--part": n / plusActif } as React.CSSProperties} data-futur={j > s.jour || undefined} data-vide={n === 0 || undefined} title={`${jourCourt.format(j * DUREE_JOUR + DUREE_JOUR / 2)} : ${n} partie${n > 1 ? "s" : ""}`} />;
          })}
        </div>
      </section>

      <section aria-labelledby="pt-stats-categories">
        <h3 id="pt-stats-categories" className="pt-sous-titre">
          Par catégorie
        </h3>
        <ul className="pt-stats-barres">
          {IDS_CATEGORIES.map((c) => {
            const x = s.parCategorie.get(c)!;
            const Icone = ICONES_CATEGORIES[c];
            return (
              <li key={c}>
                <span className="pt-stats-nom">
                  <Icone className="size-4" aria-hidden="true" />
                  {CATEGORIES[c].nom}
                </span>
                <span className="pt-stats-barre" role="img" aria-label={`${x.sus} pays maîtrisés sur ${x.total}`}>
                  <span style={{ transform: `scaleX(${x.total ? x.sus / x.total : 0})` }} />
                </span>
                <span className="pt-stats-valeur tabular-nums">
                  {x.sus}/{x.total}
                </span>
                <span className="pt-stats-juste tabular-nums">{x.b + x.f ? `${pct(x.b, x.f)} % juste` : "—"}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="pt-stats-continents">
        <h3 id="pt-stats-continents" className="pt-sous-titre">
          Par continent
        </h3>
        <ul className="pt-stats-barres">
          {CONTINENTS.map((c) => {
            const x = s.parContinent.get(c.id) ?? { b: 0, f: 0 };
            const part = x.b + x.f ? x.b / (x.b + x.f) : 0;
            return (
              <li key={c.id}>
                <span className="pt-stats-nom">{c.nom}</span>
                <span className="pt-stats-barre" data-justesse="" role="img" aria-label={`${pct(x.b, x.f)} % de bonnes réponses`}>
                  <span style={{ transform: `scaleX(${part})` }} />
                </span>
                <span className="pt-stats-valeur tabular-nums">{x.b + x.f ? `${pct(x.b, x.f)} %` : "—"}</span>
                <span className="pt-stats-juste tabular-nums">
                  {formatNombre(x.b + x.f)} réponse{x.b + x.f > 1 ? "s" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="pt-stats-duo">
        <section aria-labelledby="pt-stats-rates">
          <h3 id="pt-stats-rates" className="pt-sous-titre">
            Les plus souvent ratés
          </h3>
          {s.rates.length ? (
            <ol className="pt-stats-pays">
              {s.rates.map((x) => (
                <li key={x.code}>
                  <button type="button" className="pt-lien" onClick={() => aller(`carte/${x.code}`)}>
                    {nom(x.code)}
                  </button>
                  <span className="tabular-nums">
                    {x.f} faute{x.f > 1 ? "s" : ""} sur {x.b + x.f}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="pt-astuce">Pas encore assez de réponses pour le dire.</p>
          )}
        </section>
        <section aria-labelledby="pt-stats-surs">
          <h3 id="pt-stats-surs" className="pt-sous-titre">
            Les plus sûrs
          </h3>
          {s.surs.length ? (
            <ol className="pt-stats-pays">
              {s.surs.map((x) => (
                <li key={x.code}>
                  <button type="button" className="pt-lien" onClick={() => aller(`carte/${x.code}`)}>
                    {nom(x.code)}
                  </button>
                  <span className="tabular-nums">{pct(x.b, x.f)} % juste</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="pt-astuce">Encore quelques parties, et ils paraîtront ici.</p>
          )}
        </section>
      </div>

      {(monde.profil.eclair > 0 || monde.profil.survie > 0 || Object.keys(monde.records).length > 0) && (
        <section aria-labelledby="pt-stats-records">
          <h3 id="pt-stats-records" className="pt-sous-titre">
            <Trophy className="mr-2 inline size-5 align-[-4px]" aria-hidden="true" />
            Mes records
          </h3>
          <ul className="pt-puces">
            {monde.profil.eclair > 0 && <li>L&apos;éclair : {monde.profil.eclair}</li>}
            {monde.profil.survie > 0 && <li>Sans faute : {monde.profil.survie}</li>}
            {monde.records.marathon ? <li>Marathon : {monde.records.marathon}</li> : null}
            {monde.records.examen ? <li>Examen : {monde.records.examen}/20</li> : null}
            {monde.records.campagne ? <li>Campagne : {monde.records.campagne} explorateurs vaincus</li> : null}
          </ul>
        </section>
      )}
    </div>
  );
}

/* =====================================================================
   L'aide du clavier (touche « ? »)
   ===================================================================== */

const RACCOURCIS: readonly { titre: string; Icone: typeof Keyboard; lignes: [string[], string][] }[] = [
  {
    titre: "Partout",
    Icone: Accessibility,
    lignes: [
      [["?"], "Ouvrir ou fermer cette aide"],
      [["Échap"], "Fermer une fenêtre, quitter une partie"],
      [["Tab", "Maj + Tab"], "Passer d'un bouton à l'autre"],
    ],
  },
  {
    titre: "Pendant une partie",
    Icone: Timer,
    lignes: [
      [["1", "…", "6"], "Choisir une réponse"],
      [["Entrée", "Espace"], "Continuer après la réponse"],
      [["Entrée"], "Valider une réponse écrite"],
    ],
  },
  {
    titre: "Sur le globe (atteint avec Tab)",
    Icone: Focus,
    lignes: [
      [["←", "→", "↑", "↓"], "Faire tourner ; avec Maj, plus vite"],
      [["+", "−"], "Zoomer, reculer"],
      [["0"], "Revenir à la vue d'ensemble"],
      [["Entrée", "Espace"], "Toucher le pays au centre de la mire"],
    ],
  },
  {
    titre: "Fiches et duels",
    Icone: Swords,
    lignes: [
      [["Espace"], "Retourner une fiche"],
      [["→", "←"], "Je savais, à revoir"],
      [["1", "…", "4"], "Choisir en duel et en salon"],
    ],
  },
];

export function AideClavier({ onFermer }: { onFermer: () => void }) {
  const bouton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null;
    bouton.current?.focus();
    return () => avant?.focus?.();
  }, []);
  return createPortal(
    <div className="pt pt-confirmer-voile" onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div className="pt-confirmer pt-aide-clavier" role="dialog" aria-modal="true" aria-labelledby="pt-aide-titre">
        <header className="pt-aide-tete">
          <h2 id="pt-aide-titre">
            <Keyboard className="size-5" aria-hidden="true" />
            Les raccourcis du clavier
          </h2>
          <button ref={bouton} type="button" className="pt-icone" onClick={onFermer} aria-label="Fermer l'aide">
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="pt-aide-grille">
          {RACCOURCIS.map(({ titre, Icone, lignes }) => (
            <section key={titre}>
              <h3>
                <Icone className="size-4" aria-hidden="true" />
                {titre}
              </h3>
              <dl>
                {lignes.map(([touches, sens]) => (
                  <div key={sens}>
                    <dt>
                      {touches.map((t, i) => (t === "…" ? <span key={i}>à</span> : <kbd key={i}>{t}</kbd>))}
                    </dt>
                    <dd>{sens}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** La touche « ? » ouvre l'aide du clavier (pas pendant qu'on écrit). */
export function useAideClavier(): [boolean, () => void] {
  const [ouverte, setOuverte] = useState(false);
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (cible && (cible.tagName === "INPUT" || cible.tagName === "TEXTAREA" || cible.tagName === "SELECT" || cible.isContentEditable)) return;
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOuverte((o) => !o);
      } else if (e.key === "Escape") setOuverte(false);
    };
    const ouvrir = () => setOuverte(true);
    window.addEventListener("keydown", touche);
    window.addEventListener("portulan:aide-clavier", ouvrir);
    return () => {
      window.removeEventListener("keydown", touche);
      window.removeEventListener("portulan:aide-clavier", ouvrir);
    };
  }, []);
  return [ouverte, () => setOuverte(false)];
}

/* =====================================================================
   Les boutons rapides : le son, la concentration
   ===================================================================== */

export function BoutonSon() {
  const monde = useMonde();
  const actif = monde.profil.son;
  return (
    <button
      type="button"
      className="pt-icone pt-bouton-son"
      aria-pressed={actif}
      data-coupe={!actif || undefined}
      onClick={() => {
        regler({ son: !actif });
        if (!actif) setTimeout(() => jouer("juste"), 30);
      }}
      aria-label={actif ? "Couper les sons du jeu" : "Remettre les sons du jeu"}
      title={actif ? "Les sons : activés" : "Les sons : coupés"}
    >
      <Music2 className="size-5" aria-hidden="true" />
    </button>
  );
}

export function BoutonConcentration() {
  const monde = useMonde();
  const actif = monde.profil.concentration;
  return (
    <button type="button" className="pt-icone" aria-pressed={actif} onClick={() => regler({ concentration: !actif })} aria-label={actif ? "Quitter le mode concentration" : "Le mode concentration : rien que la question"} title={actif ? "Mode concentration : activé" : "Mode concentration"}>
      <Focus className="size-5" aria-hidden="true" />
    </button>
  );
}
