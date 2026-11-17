"use client";

import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronDown, Eye, EyeOff, History, LoaderCircle, Plus, RotateCcw, Search, Send, Trash2, TriangleAlert, Undo2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { EtatModule } from "@/lib/modules/donnees";
import {
  type Champ,
  type Contenu,
  contenuVide,
  type DefListe,
  ICONES_DISPONIBLES,
  listeComplete,
  type ModuleId,
  MODULES,
  NATURES_MOTS,
  NIVEAUX_MOTS,
  type Supprime,
  type ThemeEdite,
  themesDOrigine,
  valeurElement,
} from "@/lib/modules/modules";
import type { Entree } from "@/lib/langues/types";
import { abandonnerModule, enregistrerModule, publierModule, restaurerModule } from "../actions";
import "./editeur.css";

/*
 * L'éditeur d'un module : tout se modifie ici, s'enregistre seul en brouillon,
 * puis se publie d'un clic. Une suppression va dans la corbeille du module (on la remet d'un clic),
 * et chaque publication garde la précédente dans l'historique.
 */

type Enregistrement = { etat: "pret" | "attente" | "envoi" | "erreur"; message?: string; le?: number };

const idUnique = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "x";
/** L'heure courante (hors du rendu : appelée seulement dans les gestionnaires). */
const maintenant = () => Date.now();
const heure = (t: number) => new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const dateLongue = (iso: string) => (iso === "origine" ? "Version d'origine" : new Date(iso).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }));

export function EditeurModule({ id, etatInitial }: { id: ModuleId; etatInitial: EtatModule }) {
  const def = MODULES[id];
  const [contenu, setContenu] = useState<Contenu>(etatInitial.brouillon);
  const [etat, setEtat] = useState<EtatModule>(etatInitial);
  const [enreg, setEnreg] = useState<Enregistrement>({ etat: "pret" });
  const [message, setMessage] = useState<{ type: "succes" | "erreur"; texte: string } | null>(null);
  const [confirmer, setConfirmer] = useState<null | { titre: string; texte: string; action: () => void; bouton: string }>(null);
  const [enCours, demarrer] = useTransition();
  const minuteur = useRef<number | undefined>(undefined);
  const dernier = useRef(contenu);
  const versionLocale = useRef(0);

  const enregistrer = async () => {
    const version = versionLocale.current;
    setEnreg({ etat: "envoi" });
    const r = await enregistrerModule(id, dernier.current);
    if (!r.ok) return setEnreg({ etat: "erreur", message: r.erreur });
    setEtat(r.etat);
    if (version === versionLocale.current) setEnreg({ etat: "pret", le: maintenant() });
  };

  // Enregistrement automatique du brouillon, une seconde après la dernière frappe.
  const modifier = (maj: (c: Contenu) => Contenu) => {
    const n = maj(dernier.current);
    dernier.current = n;
    setContenu(n);
    versionLocale.current++;
    setEnreg({ etat: "attente" });
    window.clearTimeout(minuteur.current);
    minuteur.current = window.setTimeout(() => void enregistrer(), 1100);
  };

  // Ne pas perdre une modification en fermant l'onglet.
  useEffect(() => {
    const avant = (e: BeforeUnloadEvent) => {
      if (enreg.etat === "attente" || enreg.etat === "envoi") e.preventDefault();
    };
    window.addEventListener("beforeunload", avant);
    return () => window.removeEventListener("beforeunload", avant);
  }, [enreg.etat]);

  const appliquer = (r: Awaited<ReturnType<typeof publierModule>>, succes: string) => {
    if (!r.ok) return setMessage({ type: "erreur", texte: r.erreur });
    setEtat(r.etat);
    setContenu(r.etat.brouillon);
    dernier.current = r.etat.brouillon;
    setEnreg({ etat: "pret", le: maintenant() });
    setMessage({ type: "succes", texte: succes });
  };

  const publierMaintenant = () =>
    demarrer(async () => {
      window.clearTimeout(minuteur.current);
      appliquer(await publierModule(id, dernier.current), "Publié. Les visiteurs voient la nouvelle version (dans les 15 secondes).");
    });

  const aPublier = etat.enAttente || enreg.etat === "attente" || enreg.etat === "envoi";

  /* ---------- Textes ---------- */

  const changerTexte = (ch: Champ, v: string) =>
    modifier((c) => {
      const textes = { ...c.textes };
      if (v === ch.defaut || v === "") delete textes[ch.cle];
      else textes[ch.cle] = v;
      return { ...c, textes };
    });

  /* ---------- Listes ---------- */

  const changerListe = (l: DefListe, f: (els: ReturnType<typeof listeComplete>) => ReturnType<typeof listeComplete>) => modifier((c) => ({ ...c, listes: { ...c.listes, [l.id]: f(listeComplete(l, c)) } }));

  const supprimerElement = (l: DefListe, index: number) =>
    modifier((c) => {
      const els = listeComplete(l, c);
      const e = els[index];
      if (!e) return c;
      const s: Supprime = { id: idUnique(), type: "element", liste: l.id, libelle: valeurElement(l, e, l.nom) || e.id, le: maintenant(), donnees: e, position: index };
      return { ...c, listes: { ...c.listes, [l.id]: els.filter((_, i) => i !== index) }, corbeille: [...c.corbeille, s] };
    });

  /* ---------- Vocabulaire ---------- */

  const themes = contenu.themes ?? themesDOrigine();
  const changerThemes = (f: (t: ThemeEdite[]) => ThemeEdite[]) => modifier((c) => ({ ...c, themes: f(c.themes ?? themesDOrigine()) }));

  const supprimerTheme = (index: number) =>
    modifier((c) => {
      const liste = c.themes ?? themesDOrigine();
      const t = liste[index];
      if (!t) return c;
      return { ...c, themes: liste.filter((_, i) => i !== index), corbeille: [...c.corbeille, { id: idUnique(), type: "theme", libelle: t.nom, le: maintenant(), donnees: t, position: index }] };
    });

  const supprimerMot = (themeId: string, motId: string) =>
    modifier((c) => {
      const liste = c.themes ?? themesDOrigine();
      const t = liste.find((x) => x.id === themeId);
      const position = t?.entrees.findIndex((e) => e.id === motId) ?? -1;
      if (!t || position < 0) return c;
      const mot = t.entrees[position];
      return {
        ...c,
        themes: liste.map((x) => (x.id === themeId ? { ...x, entrees: x.entrees.filter((e) => e.id !== motId) } : x)),
        corbeille: [...c.corbeille, { id: idUnique(), type: "mot", theme: themeId, libelle: `${mot.en} (${t.nom})`, le: maintenant(), donnees: mot, position }],
      };
    });

  /* ---------- Corbeille ---------- */

  const remettre = (s: Supprime) =>
    modifier((c) => {
      const corbeille = c.corbeille.filter((x) => x.id !== s.id);
      if (s.type === "element") {
        const l = def.listes.find((x) => x.id === s.liste);
        if (!l) return { ...c, corbeille };
        const els = listeComplete(l, { ...c, corbeille }).filter((e) => e.id !== s.donnees.id);
        els.splice(Math.min(s.position, els.length), 0, s.donnees);
        return { ...c, corbeille, listes: { ...c.listes, [l.id]: els } };
      }
      const liste = [...(c.themes ?? themesDOrigine())];
      if (s.type === "theme") {
        let th = s.donnees;
        if (liste.some((x) => x.id === th.id)) th = { ...th, id: `${th.id}-${slug(idUnique()).slice(0, 4)}` };
        liste.splice(Math.min(s.position, liste.length), 0, th);
        return { ...c, corbeille, themes: liste };
      }
      let t = liste.findIndex((x) => x.id === s.theme);
      if (t < 0) {
        // Le thème du mot a lui-même été supprimé : le mot revient dans un thème recréé.
        liste.push({ id: s.theme, nom: s.libelle.replace(/^.*\((.*)\)$/, "$1") || "Mots remis", description: "", icone: "BookOpen", visible: true, entrees: [] });
        t = liste.length - 1;
      }
      const entrees = liste[t].entrees.filter((e) => e.id !== s.donnees.id);
      entrees.splice(Math.min(s.position, entrees.length), 0, s.donnees);
      liste[t] = { ...liste[t], entrees };
      return { ...c, corbeille, themes: liste };
    });

  /* ---------- Rendu ---------- */

  const sommaire = [
    ...def.sections.map((s, i) => ({ ancre: `section-${i}`, titre: s.titre })),
    ...def.listes.map((l) => ({ ancre: `liste-${l.id}`, titre: l.titre })),
    ...(def.vocabulaire ? [{ ancre: "vocabulaire", titre: "Thèmes et mots" }] : []),
    { ancre: "corbeille", titre: `Corbeille${contenu.corbeille.length ? ` (${contenu.corbeille.length})` : ""}` },
    { ancre: "historique", titre: "Historique" },
  ];

  return (
    <div className="em" data-accent={def.accent}>
      <div className="em-barre">
        <div className="em-barre-dedans">
          <Link href="/createur" className="em-retour" aria-label="Tous les modules">
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="em-nom">{def.nom}</p>
            <p className="em-statut" data-etat={enreg.etat} role="status">
              {enreg.etat === "attente" && "Modifications en cours…"}
              {enreg.etat === "envoi" && (
                <>
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> Enregistrement du brouillon…
                </>
              )}
              {enreg.etat === "erreur" && (
                <>
                  <TriangleAlert className="size-3.5" aria-hidden="true" /> {enreg.message} <button type="button" onClick={() => void enregistrer()}>Réessayer</button>
                </>
              )}
              {enreg.etat === "pret" &&
                (etat.enAttente
                  ? `Brouillon enregistré${enreg.le ? ` à ${heure(enreg.le)}` : ""} · pas encore publié`
                  : etat.publieLe
                    ? `À jour · publié le ${dateLongue(etat.publieLe)}`
                    : "Textes d'origine · rien n'a encore été publié")}
            </p>
          </div>
          <a className="bouton bouton-discret em-bouton" href={`${def.adresse}?apercu=1`} target="_blank" rel="noopener">
            <Eye className="size-4" aria-hidden="true" />
            <span className="max-sm:sr-only">Aperçu</span>
          </a>
          <button type="button" className="bouton bouton-principal em-bouton" disabled={!aPublier || enCours || enreg.etat === "erreur"} onClick={publierMaintenant}>
            {enCours ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            Publier
          </button>
        </div>
      </div>

      <div className="em-grille">
        <nav className="em-sommaire" aria-label="Parties du module">
          {sommaire.map((s) => (
            <a key={s.ancre} href={`#${s.ancre}`}>
              {s.titre}
            </a>
          ))}
          <hr />
          <button
            type="button"
            disabled={!etat.enAttente || enCours}
            onClick={() =>
              setConfirmer({
                titre: "Annuler les modifications non publiées ?",
                texte: "Le brouillon revient à la version que voient les visiteurs. Tu peux aussi le retrouver dans l'historique s'il avait été publié.",
                bouton: "Annuler les modifications",
                action: () => demarrer(async () => appliquer(await abandonnerModule(id), "Modifications annulées : le brouillon est revenu à la version publiée.")),
              })
            }
          >
            <Undo2 className="size-4" aria-hidden="true" />
            Annuler les modifications
          </button>
          <button
            type="button"
            onClick={() =>
              setConfirmer({
                titre: "Revenir au contenu d'origine ?",
                texte: "Tous les textes, listes et le vocabulaire reprennent leur valeur d'origine dans le brouillon. Rien n'est publié tant que tu ne cliques pas sur « Publier », et la version actuelle reste dans l'historique.",
                bouton: "Revenir à l'origine",
                action: () => modifier((c) => ({ ...contenuVide(), corbeille: c.corbeille })),
              })
            }
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Revenir à l&apos;origine
          </button>
        </nav>

        <main className="em-contenu">
          <header className="em-entete">
            <h1 className="text-3xl font-extrabold md:text-4xl">{def.nom}</h1>
            <p className="mt-2 max-w-[62ch] text-encre-douce">{def.description}</p>
            <p className="mt-2 max-w-[62ch] text-sm text-encre-douce">
              Tout s&apos;enregistre seul en brouillon. Les visiteurs ne voient rien avant que tu cliques sur « Publier ». « Aperçu » ouvre la page telle qu&apos;elle sera publiée.
            </p>
          </header>

          {message && (
            <p className={`message ${message.type === "succes" ? "message-succes" : "message-erreur"} em-message`} role="status">
              {message.type === "succes" ? <Check className="size-4" aria-hidden="true" /> : <TriangleAlert className="size-4" aria-hidden="true" />}
              {message.texte}
              <button type="button" className="bouton-icone ml-auto" aria-label="Fermer" onClick={() => setMessage(null)}>
                <X className="size-4" aria-hidden="true" />
              </button>
            </p>
          )}

          {def.sections.map((s, i) => (
            <section key={s.titre} id={`section-${i}`} className="em-carte verre">
              <h2 className="em-titre">{s.titre}</h2>
              <div className="em-champs">
                {s.champs.map((ch) => (
                  <ChampTexte key={ch.cle} champ={ch} valeur={contenu.textes[ch.cle] ?? ch.defaut} modifie={contenu.textes[ch.cle] !== undefined} onChange={(v) => changerTexte(ch, v)} />
                ))}
              </div>
            </section>
          ))}

          {def.listes.map((l) => (
            <EditeurListe key={l.id} def={l} elements={listeComplete(l, contenu)} onChange={(f) => changerListe(l, f)} onSupprimer={(i) => supprimerElement(l, i)} />
          ))}

          {def.vocabulaire && (
            <EditeurVocabulaire
              themes={themes}
              modifie={contenu.themes !== undefined}
              onChange={changerThemes}
              onSupprimerTheme={supprimerTheme}
              onSupprimerMot={supprimerMot}
              onOrigine={() =>
                setConfirmer({
                  titre: "Reprendre le vocabulaire d'origine ?",
                  texte: "Les 12 thèmes et 600 mots d'origine remplacent le vocabulaire du brouillon. La version actuelle reste dans l'historique une fois publiée, et « Annuler les modifications » la ramène tant que rien n'est publié.",
                  bouton: "Reprendre l'origine",
                  action: () => modifier((c) => ({ ...c, themes: undefined })),
                })
              }
            />
          )}

          <section id="corbeille" className="em-carte verre">
            <h2 className="em-titre">Corbeille</h2>
            <p className="em-aide">Ce que tu supprimes dans ce module arrive ici. « Remettre » le replace à sa place d&apos;avant.</p>
            {contenu.corbeille.length === 0 ? (
              <p className="em-vide">La corbeille est vide.</p>
            ) : (
              <>
                <ul className="em-corbeille">
                  {[...contenu.corbeille].reverse().map((s) => (
                    <li key={s.id}>
                      <span className="em-type">{s.type === "theme" ? "Thème" : s.type === "mot" ? "Mot" : "Élément"}</span>
                      <span className="min-w-0 flex-1 truncate">{s.libelle}</span>
                      <span className="hidden text-sm text-encre-douce sm:inline">{new Date(s.le).toLocaleDateString("fr-FR")}</span>
                      <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => remettre(s)}>
                        <Undo2 className="size-4" aria-hidden="true" />
                        Remettre
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="em-lien-danger"
                  onClick={() =>
                    setConfirmer({
                      titre: "Vider la corbeille ?",
                      texte: "Les éléments de la corbeille ne pourront plus être remis d'un clic (ils restent dans les anciennes versions de l'historique).",
                      bouton: "Vider la corbeille",
                      action: () => modifier((c) => ({ ...c, corbeille: [] })),
                    })
                  }
                >
                  Vider la corbeille
                </button>
              </>
            )}
          </section>

          <section id="historique" className="em-carte verre">
            <h2 className="em-titre">
              <History className="mr-2 inline size-5" aria-hidden="true" />
              Historique des publications
            </h2>
            <p className="em-aide">Chaque publication garde la précédente (les 15 dernières). « Restaurer » la remet dans le brouillon : relis, puis publie.</p>
            {etat.historique.length === 0 ? (
              <p className="em-vide">Aucune publication précédente pour l&apos;instant.</p>
            ) : (
              <ul className="em-corbeille">
                {etat.historique.map((v, i) => (
                  <li key={`${v.le}-${i}`}>
                    <span className="min-w-0 flex-1">{dateLongue(v.le)}</span>
                    <button
                      type="button"
                      className="bouton bouton-discret bouton-petit"
                      disabled={enCours}
                      onClick={() =>
                        setConfirmer({
                          titre: "Restaurer cette version ?",
                          texte: "Elle remplace le brouillon actuel (pas encore la version publiée). Il suffira ensuite de cliquer sur « Publier ».",
                          bouton: "Restaurer dans le brouillon",
                          action: () => demarrer(async () => appliquer(await restaurerModule(id, i), "Version restaurée dans le brouillon. Relis-la, puis publie.")),
                        })
                      }
                    >
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Restaurer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>

      {confirmer && (
        <div className="em-fond" role="alertdialog" aria-modal="true" aria-label={confirmer.titre} onClick={() => setConfirmer(null)}>
          <div className="em-dialogue" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-xl font-bold">{confirmer.titre}</p>
            <p className="mt-2 text-encre-douce">{confirmer.texte}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" className="bouton bouton-discret" onClick={() => setConfirmer(null)} autoFocus>
                Garder
              </button>
              <button
                type="button"
                className="bouton bouton-principal"
                onClick={() => {
                  confirmer.action();
                  setConfirmer(null);
                }}
              >
                {confirmer.bouton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Un texte ---------- */

function ChampTexte({ champ, valeur, modifie, onChange }: { champ: Champ; valeur: string; modifie: boolean; onChange: (v: string) => void }) {
  return (
    <label className="em-champ" data-modifie={modifie || undefined}>
      <span className="em-libelle">
        {champ.libelle}
        {modifie && <span className="em-badge">modifié</span>}
        {modifie && (
          <button
            type="button"
            className="em-origine"
            onClick={(e) => {
              e.preventDefault();
              onChange(champ.defaut);
            }}
            title={`Texte d'origine : ${champ.defaut}`}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Remettre l&apos;original
          </button>
        )}
      </span>
      {champ.long ? (
        <textarea value={valeur} rows={Math.min(8, Math.max(2, Math.ceil(valeur.length / 90)))} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={valeur} inputMode={champ.nombre ? "numeric" : undefined} type={champ.nombre ? "number" : "text"} min={champ.nombre?.min} max={champ.nombre?.max} onChange={(e) => onChange(e.target.value)} />
      )}
      {champ.aide && <span className="em-aide">{champ.aide}</span>}
    </label>
  );
}

/* ---------- Une liste (outils, onglets, cartes) ---------- */

type Els = ReturnType<typeof listeComplete>;

function EditeurListe({ def, elements, onChange, onSupprimer }: { def: DefListe; elements: Els; onChange: (f: (els: Els) => Els) => void; onSupprimer: (i: number) => void }) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const deplacer = (i: number, d: number) =>
    onChange((els) => {
      const n = [...els];
      const j = i + d;
      if (j < 0 || j >= n.length) return els;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  return (
    <section id={`liste-${def.id}`} className="em-carte verre">
      <h2 className="em-titre">{def.titre}</h2>
      <p className="em-aide">{def.aide}</p>
      <ol className="em-liste">
        {elements.map((e, i) => {
          const nom = valeurElement(def, e, def.nom) || e.id;
          const vu = ouvert === e.id;
          return (
            <li key={e.id} className="em-element" data-masque={!e.visible || undefined}>
              <div className="em-element-tete">
                <button type="button" className="em-element-nom" aria-expanded={vu} onClick={() => setOuvert(vu ? null : e.id)}>
                  <ChevronDown className="size-4 em-chevron" aria-hidden="true" />
                  <span className="truncate">{nom}</span>
                  {!e.visible && <span className="em-badge em-badge-gris">masqué</span>}
                  {Object.keys(e.valeurs).length > 0 && <span className="em-badge">modifié</span>}
                </button>
                <button type="button" className="bouton-icone" aria-label="Monter" disabled={i === 0} onClick={() => deplacer(i, -1)}>
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button type="button" className="bouton-icone" aria-label="Descendre" disabled={i === elements.length - 1} onClick={() => deplacer(i, 1)}>
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="bouton-icone"
                  aria-label={e.visible ? "Masquer" : "Afficher"}
                  title={e.visible ? "Masquer aux visiteurs" : "Afficher aux visiteurs"}
                  onClick={() => onChange((els) => els.map((x) => (x.id === e.id ? { ...x, visible: !x.visible } : x)))}
                >
                  {e.visible ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
                </button>
                <button type="button" className="bouton-icone" aria-label={`Supprimer « ${nom} »`} title="Supprimer (va dans la corbeille)" onClick={() => onSupprimer(i)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
              {vu && (
                <div className="em-champs em-element-corps">
                  {def.champs.map((ch) => {
                    const origine = def.elements.find((d) => d.id === e.id)?.valeurs[ch.cle] ?? "";
                    const champ: Champ = { cle: ch.cle, libelle: ch.libelle, defaut: origine, long: ch.long };
                    return (
                      <ChampTexte
                        key={ch.cle}
                        champ={champ}
                        valeur={e.valeurs[ch.cle] ?? origine}
                        modifie={e.valeurs[ch.cle] !== undefined}
                        onChange={(v) =>
                          onChange((els) =>
                            els.map((x) => {
                              if (x.id !== e.id) return x;
                              const valeurs = { ...x.valeurs };
                              if (v === origine || v === "") delete valeurs[ch.cle];
                              else valeurs[ch.cle] = v;
                              return { ...x, valeurs };
                            }),
                          )
                        }
                      />
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ---------- Le vocabulaire du Truchement ---------- */

type PropsVoc = {
  themes: ThemeEdite[];
  modifie: boolean;
  onChange: (f: (t: ThemeEdite[]) => ThemeEdite[]) => void;
  onSupprimerTheme: (i: number) => void;
  onSupprimerMot: (themeId: string, motId: string) => void;
  onOrigine: () => void;
};

function EditeurVocabulaire({ themes, modifie, onChange, onSupprimerTheme, onSupprimerMot, onOrigine }: PropsVoc) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const total = themes.reduce((s, t) => s + t.entrees.length, 0);
  const q = recherche.trim().toLowerCase();
  const trouves = useMemo(() => (q.length < 2 ? [] : themes.flatMap((t) => t.entrees.filter((e) => e.en.toLowerCase().includes(q) || e.fr.toLowerCase().includes(q)).map((e) => ({ t, e })))), [q, themes]);

  const majTheme = (id: string, f: (t: ThemeEdite) => ThemeEdite) => onChange((ts) => ts.map((t) => (t.id === id ? f(t) : t)));
  const majMot = (themeId: string, motId: string, champ: keyof Entree, v: string) => majTheme(themeId, (t) => ({ ...t, entrees: t.entrees.map((e) => (e.id === motId ? { ...e, [champ]: v } : e)) }));
  const deplacer = (i: number, d: number) =>
    onChange((ts) => {
      const n = [...ts];
      const j = i + d;
      if (j < 0 || j >= n.length) return ts;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  const ajouterTheme = () => {
    const id = `${slug("nouveau-theme")}-${slug(idUnique()).slice(0, 5)}`;
    onChange((ts) => [...ts, { id, nom: "Nouveau thème", description: "", icone: "BookOpen", visible: true, entrees: [] }]);
    setOuvert(id);
  };
  const ajouterMot = (t: ThemeEdite) =>
    majTheme(t.id, (x) => ({ ...x, entrees: [{ id: `${x.id}:mot-${slug(idUnique()).slice(0, 6)}`, en: "", fr: "", nature: "nom", niveau: "A1", api: "", exEn: "", exFr: "" }, ...x.entrees] }));

  return (
    <section id="vocabulaire" className="em-carte verre">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="em-titre">Thèmes et mots</h2>
          <p className="em-aide">
            {themes.length} thèmes, {total} mots{modifie ? " (modifié)" : " (vocabulaire d'origine)"}. Un mot sans anglais ou sans français n&apos;est pas publié. Changer l&apos;anglais d&apos;un mot garde la progression des visiteurs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {modifie && (
            <button type="button" className="bouton bouton-discret bouton-petit" onClick={onOrigine}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Vocabulaire d&apos;origine
            </button>
          )}
          <button type="button" className="bouton bouton-principal bouton-petit" onClick={ajouterTheme}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter un thème
          </button>
        </div>
      </div>

      <label className="em-recherche">
        <Search className="size-4" aria-hidden="true" />
        <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Chercher un mot dans tous les thèmes" />
      </label>
      {q.length >= 2 && (
        <ul className="em-trouves">
          {trouves.length === 0 && <li className="em-vide">Aucun mot ne correspond.</li>}
          {trouves.slice(0, 40).map(({ t, e }) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => {
                  setOuvert(t.id);
                  setRecherche("");
                  setTimeout(() => document.getElementById(`mot-${e.id}`)?.scrollIntoView({ block: "center" }), 60);
                }}
              >
                <strong lang="en">{e.en}</strong> · {e.fr} <span className="text-encre-douce">({t.nom})</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ol className="em-liste">
        {themes.map((t, i) => {
          const vu = ouvert === t.id;
          return (
            <li key={t.id} className="em-element" data-masque={!t.visible || undefined}>
              <div className="em-element-tete">
                <button type="button" className="em-element-nom" aria-expanded={vu} onClick={() => setOuvert(vu ? null : t.id)}>
                  <ChevronDown className="size-4 em-chevron" aria-hidden="true" />
                  <span className="truncate">{t.nom}</span>
                  <span className="em-compte">{t.entrees.length} mots</span>
                  {!t.visible && <span className="em-badge em-badge-gris">masqué</span>}
                </button>
                <button type="button" className="bouton-icone" aria-label="Monter" disabled={i === 0} onClick={() => deplacer(i, -1)}>
                  <ArrowUp className="size-4" aria-hidden="true" />
                </button>
                <button type="button" className="bouton-icone" aria-label="Descendre" disabled={i === themes.length - 1} onClick={() => deplacer(i, 1)}>
                  <ArrowDown className="size-4" aria-hidden="true" />
                </button>
                <button type="button" className="bouton-icone" aria-label={t.visible ? "Masquer" : "Afficher"} onClick={() => majTheme(t.id, (x) => ({ ...x, visible: !x.visible }))}>
                  {t.visible ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
                </button>
                <button type="button" className="bouton-icone" aria-label={`Supprimer le thème « ${t.nom} »`} title="Supprimer (va dans la corbeille)" onClick={() => onSupprimerTheme(i)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
              {vu && (
                <div className="em-element-corps">
                  <div className="em-champs em-champs-theme">
                    <label className="em-champ">
                      <span className="em-libelle">Nom du thème</span>
                      <input value={t.nom} onChange={(e) => majTheme(t.id, (x) => ({ ...x, nom: e.target.value }))} />
                    </label>
                    <label className="em-champ">
                      <span className="em-libelle">Icône</span>
                      <select value={t.icone} onChange={(e) => majTheme(t.id, (x) => ({ ...x, icone: e.target.value }))}>
                        {ICONES_DISPONIBLES.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="em-champ em-large">
                      <span className="em-libelle">Description</span>
                      <input value={t.description} onChange={(e) => majTheme(t.id, (x) => ({ ...x, description: e.target.value }))} />
                    </label>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <p className="font-semibold">Les mots</p>
                    <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => ajouterMot(t)}>
                      <Plus className="size-4" aria-hidden="true" />
                      Ajouter un mot
                    </button>
                  </div>
                  <ul className="em-mots">
                    {t.entrees.map((e) => (
                      <li key={e.id} id={`mot-${e.id}`} className="em-mot" data-incomplet={!e.en.trim() || !e.fr.trim() || undefined}>
                        <input className="em-mot-en" lang="en" value={e.en} placeholder="anglais" aria-label="Anglais" onChange={(x) => majMot(t.id, e.id, "en", x.target.value)} />
                        <input value={e.fr} placeholder="français" aria-label="Français" onChange={(x) => majMot(t.id, e.id, "fr", x.target.value)} />
                        <select value={e.nature} aria-label="Nature" onChange={(x) => majMot(t.id, e.id, "nature", x.target.value)}>
                          {NATURES_MOTS.map((n) => (
                            <option key={n}>{n}</option>
                          ))}
                        </select>
                        <select value={e.niveau} aria-label="Niveau" onChange={(x) => majMot(t.id, e.id, "niveau", x.target.value)}>
                          {NIVEAUX_MOTS.map((n) => (
                            <option key={n}>{n}</option>
                          ))}
                        </select>
                        <input value={e.api} placeholder="/prononciation/" aria-label="Prononciation" onChange={(x) => majMot(t.id, e.id, "api", x.target.value)} />
                        <button type="button" className="bouton-icone" aria-label={`Supprimer « ${e.en || "ce mot"} »`} onClick={() => onSupprimerMot(t.id, e.id)}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                        <input className="em-mot-ex" lang="en" value={e.exEn} placeholder="Phrase d'exemple en anglais" aria-label="Exemple en anglais" onChange={(x) => majMot(t.id, e.id, "exEn", x.target.value)} />
                        <input className="em-mot-ex" value={e.exFr} placeholder="Sa traduction" aria-label="Traduction de l'exemple" onChange={(x) => majMot(t.id, e.id, "exFr", x.target.value)} />
                      </li>
                    ))}
                    {t.entrees.length === 0 && <li className="em-vide">Aucun mot : clique sur « Ajouter un mot ».</li>}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
