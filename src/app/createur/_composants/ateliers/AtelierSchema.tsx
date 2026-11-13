"use client";

import { Download, LayoutGrid, Link2, Maximize, Minus, Plus, Trash2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cadreDe, SvgSchema } from "@/components/schemas/SvgSchema";
import { exporterPng, exporterSvg } from "@/lib/client/export-schema";
import { compiler } from "@/lib/schemas/expression";
import { disposer } from "@/lib/schemas/disposition";
import {
  DISPOSITIONS,
  FORMES,
  GENRES_SCHEMA,
  LIMITES_SCHEMA,
  lien as nouveauLien,
  NATURES_LIEN,
  nettoyerSchema,
  noeud as nouveauNoeud,
  ROLES,
  schemaParDefaut,
  STYLES_GRAPHE,
  TEINTES,
  ZONES_VENN,
  type DonneesSchema,
  type LienSchema,
  type NoeudSchema,
  type StyleGraphe,
  type Teinte,
} from "@/lib/schemas/modele";
import { ChoixArticle } from "./ChoixArticle";
import { Modale } from "./Modale";

type Selection = { type: "noeud" | "lien"; id: string } | null;

function Teintes({ valeur, onChange, libelle = "Couleur" }: { valeur: Teinte; onChange: (t: Teinte) => void; libelle?: string }) {
  return (
    <fieldset>
      <legend className="etiquette text-sm">{libelle}</legend>
      <div className="flex flex-wrap gap-1.5">
        {TEINTES.map((t) => (
          <button key={t.cle} type="button" className="pastille-teinte" style={{ background: t.hex }} aria-label={t.libelle} aria-pressed={valeur === t.cle} onClick={() => onChange(t.cle)} />
        ))}
      </div>
    </fieldset>
  );
}

/** Atelier graphique : cartes mentales, conceptuelles, arbres, flux, Venn, graphiques, courbes, matrices. */
export function AtelierSchema({ initial, onValider, onFermer }: { initial: DonneesSchema | null; onValider: (d: DonneesSchema) => void; onFermer: () => void }) {
  const uid = useId().replace(/:/g, "");
  const [d, setD] = useState<DonneesSchema>(() => nettoyerSchema(initial ?? schemaParDefaut("graphe")));
  const [historique, setHistorique] = useState<DonneesSchema[]>([]);
  const [selection, setSelection] = useState<Selection>(null);
  const [relier, setRelier] = useState<string | null>(null);
  const [vue, setVue] = useState({ x: 0, y: 0, k: 1 });
  const cadreRef = useRef<HTMLDivElement>(null);
  const texteRef = useRef<HTMLTextAreaElement>(null);
  const glisse = useRef<{ id?: string; px: number; py: number; nx: number; ny: number; fond?: boolean } | null>(null);

  const plan = useMemo(() => (d.genre === "graphe" ? disposer(d, new Set()) : undefined), [d]);
  // Le cadre suit le contenu, avec une marge pour pouvoir ajouter des éléments.
  const cadre = useMemo(() => {
    const c = cadreDe(d, plan);
    return d.genre === "graphe" ? { x: c.x - 120, y: c.y - 80, l: c.l + 240, h: c.h + 160 } : c;
  }, [d, plan]);

  /** Modification avec mémorisation pour « Annuler ». */
  const modifier = useCallback((f: (x: DonneesSchema) => DonneesSchema, memoriser = true) => {
    setD((x) => {
      if (memoriser) setHistorique((h) => [...h.slice(-49), x]);
      return f(x);
    });
  }, []);
  const annuler = () => {
    const precedent = historique[historique.length - 1];
    if (!precedent) return;
    setHistorique((h) => h.slice(0, -1));
    setD(precedent);
  };

  const noeudChoisi = selection?.type === "noeud" ? d.noeuds.find((n) => n.id === selection.id) : undefined;
  const lienChoisi = selection?.type === "lien" ? d.liens.find((l) => l.id === selection.id) : undefined;
  const majNoeud = (id: string, c: Partial<NoeudSchema>, memoriser = false) => modifier((x) => ({ ...x, noeuds: x.noeuds.map((n) => (n.id === id ? { ...n, ...c } : n)) }), memoriser);
  const majLien = (id: string, c: Partial<LienSchema>) => modifier((x) => ({ ...x, liens: x.liens.map((l) => (l.id === id ? { ...l, ...c } : l)) }), false);

  const sansFleche = d.style === "carte-mentale" || d.style === "classification";
  const ajouterEnfant = (parentId: string | null) => {
    if (d.noeuds.length >= LIMITES_SCHEMA.noeuds) return;
    const parent = d.noeuds.find((n) => n.id === parentId);
    const b = parent && plan?.boites.get(parent.id);
    const palette: Teinte[] = ["bleu", "emeraude", "amethyste", "orange", "rose", "turquoise"];
    const estRacine = parent && !d.liens.some((l) => l.vers === parent.id);
    const teinte = parent ? (estRacine ? palette[d.liens.filter((l) => l.de === parent.id).length % palette.length] : parent.teinte) : "or";
    const n = nouveauNoeud(parent ? "Nouvelle idée" : "Nouvel élément", b ? b.x + 240 : (cadre.x + cadre.l / 2), b ? b.y + 40 * (d.liens.filter((l) => l.de === parentId).length - 1) : cadre.y + cadre.h / 2, {
      teinte,
      forme: parent?.forme === "losange" || parent?.forme === "ellipse" ? "rectangle" : (parent?.forme ?? "arrondi"),
    });
    modifier((x) => ({ ...x, noeuds: [...x.noeuds, n], liens: parent ? [...x.liens, nouveauLien(parent.id, n.id, { fleche: !sansFleche })] : x.liens }));
    setSelection({ type: "noeud", id: n.id });
    requestAnimationFrame(() => texteRef.current?.select());
  };
  const ajouterFrere = (id: string) => {
    const parent = d.liens.find((l) => l.vers === id)?.de ?? null;
    ajouterEnfant(parent);
  };
  const supprimer = () => {
    if (!selection) return;
    if (selection.type === "noeud") modifier((x) => ({ ...x, noeuds: x.noeuds.filter((n) => n.id !== selection.id), liens: x.liens.filter((l) => l.de !== selection.id && l.vers !== selection.id) }));
    else modifier((x) => ({ ...x, liens: x.liens.filter((l) => l.id !== selection.id) }));
    setSelection(null);
  };
  const placerLibrement = () => {
    if (!plan) return;
    modifier((x) => ({ ...x, disposition: "libre", noeuds: x.noeuds.map((n) => ({ ...n, x: Math.round(plan.boites.get(n.id)?.x ?? n.x), y: Math.round(plan.boites.get(n.id)?.y ?? n.y) })) }));
  };

  // Raccourcis clavier sur le plan de travail.
  const surTouche = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("input, textarea, select")) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      annuler();
      return;
    }
    if (!noeudChoisi && !lienChoisi) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      supprimer();
    } else if (noeudChoisi && e.key === "Tab") {
      e.preventDefault();
      ajouterEnfant(noeudChoisi.id);
    } else if (noeudChoisi && e.key === "Enter") {
      e.preventDefault();
      ajouterFrere(noeudChoisi.id);
    } else if (noeudChoisi && e.key === "F2") {
      e.preventDefault();
      texteRef.current?.focus();
    }
  };

  useEffect(() => {
    const el = cadreRef.current;
    if (!el || d.genre !== "graphe") return;
    const roue = (e: WheelEvent) => {
      e.preventDefault();
      setVue((v) => ({ ...v, k: Math.min(4, Math.max(0.25, v.k * (e.deltaY < 0 ? 1.1 : 1 / 1.1))) }));
    };
    el.addEventListener("wheel", roue, { passive: false });
    return () => el.removeEventListener("wheel", roue);
  }, [d.genre]);

  const echelle = () => {
    const rect = cadreRef.current?.getBoundingClientRect();
    if (!rect) return 1;
    return Math.max(cadre.l / rect.width, cadre.h / rect.height) / vue.k;
  };

  const svgCourant = () => cadreRef.current?.querySelector("svg") as SVGSVGElement | null;
  const transformation = `translate(${vue.x} ${vue.y}) translate(${cadre.x + cadre.l / 2} ${cadre.y + cadre.h / 2}) scale(${vue.k}) translate(${-(cadre.x + cadre.l / 2)} ${-(cadre.y + cadre.h / 2)})`;

  const changerType = (genre: DonneesSchema["genre"], style?: StyleGraphe) => {
    const memeGraphe = genre === "graphe" && d.genre === "graphe";
    if (memeGraphe && style) {
      // Changer de style garde les éléments ; seule la disposition conseillée change.
      modifier((x) => ({ ...x, style, disposition: STYLES_GRAPHE.find((s) => s.cle === style)?.disposition ?? x.disposition }));
      return;
    }
    const neuf = schemaParDefaut(genre, style);
    modifier(() => ({ ...neuf, titre: d.titre }));
    setSelection(null);
  };

  return (
    <Modale
      titre="Atelier graphique"
      onFermer={onFermer}
      actions={
        <>
          <button type="button" className="bouton-icone" aria-label="Annuler la dernière modification" disabled={historique.length === 0} onClick={annuler}>
            <Undo2 className="size-4" aria-hidden="true" />
          </button>
          <button type="button" className="bouton-icone" aria-label="Exporter en PNG" onClick={() => { const s = svgCourant(); if (s) void exporterPng(s, d.titre); }}>
            <Download className="size-4" aria-hidden="true" />
          </button>
          <button type="button" className="bouton bouton-principal !min-h-10" onClick={() => onValider(nettoyerSchema(d))}>
            Insérer dans l&apos;article
          </button>
        </>
      }
    >
      <div className="atelier-schema">
        <div className="atelier-barre">
          <label className="sr-only" htmlFor="schema-type">
            Type de schéma
          </label>
          <select
            id="schema-type"
            className="champ !min-h-10 !w-auto !py-2"
            value={d.genre === "graphe" ? `graphe:${d.style}` : d.genre}
            onChange={(e) => {
              const [g, s] = e.target.value.split(":");
              changerType(g as DonneesSchema["genre"], s as StyleGraphe | undefined);
            }}
          >
            <optgroup label="Cartes et diagrammes">
              {STYLES_GRAPHE.map((s) => (
                <option key={s.cle} value={`graphe:${s.cle}`}>
                  {s.libelle}
                </option>
              ))}
            </optgroup>
            <optgroup label="Autres">
              {GENRES_SCHEMA.filter((g) => g.cle !== "graphe").map((g) => (
                <option key={g.cle} value={g.cle}>
                  {g.libelle}
                </option>
              ))}
            </optgroup>
          </select>
          <input className="champ !min-h-10 !py-2 min-w-[12rem] flex-1" aria-label="Titre du schéma" value={d.titre} maxLength={200} onChange={(e) => modifier((x) => ({ ...x, titre: e.target.value }), false)} placeholder="Titre du schéma (facultatif)" />
          {d.genre === "graphe" && (
            <>
              <select className="champ !min-h-10 !w-auto !py-2" aria-label="Disposition" value={d.disposition} onChange={(e) => modifier((x) => ({ ...x, disposition: e.target.value as DonneesSchema["disposition"] }))}>
                {DISPOSITIONS.map((x) => (
                  <option key={x.cle} value={x.cle}>
                    {x.libelle}
                  </option>
                ))}
              </select>
              <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => ajouterEnfant(noeudChoisi?.id ?? null)}>
                <Plus className="size-4" aria-hidden="true" />
                {noeudChoisi ? "Ajouter un enfant" : "Ajouter un élément"}
              </button>
              <button type="button" className="bouton bouton-discret !min-h-10" disabled={!noeudChoisi} aria-pressed={relier !== null} onClick={() => setRelier(relier ? null : (noeudChoisi?.id ?? null))}>
                <Link2 className="size-4" aria-hidden="true" />
                {relier ? "Clique la cible…" : "Relier à…"}
              </button>
              {d.disposition !== "libre" && (
                <button type="button" className="bouton bouton-discret !min-h-10" onClick={placerLibrement} title="Garde la disposition actuelle et permet de déplacer chaque élément à la souris">
                  <LayoutGrid className="size-4" aria-hidden="true" />
                  Placer à la main
                </button>
              )}
            </>
          )}
        </div>

        <div className="atelier-espace">
          <div
            ref={cadreRef}
            className="atelier-plan"
            tabIndex={0}
            role="application"
            aria-label="Plan de travail du schéma. Tab : ajouter un enfant, Entrée : ajouter un frère, Suppr : supprimer, F2 : modifier le texte."
            onKeyDown={surTouche}
            onPointerDown={(e) => {
              if (d.genre !== "graphe") return;
              (e.currentTarget as HTMLElement).focus();
              if ((e.target as Element).closest(".schema-noeud, .schema-liens g")) return;
              setSelection(null);
              setRelier(null);
              glisse.current = { px: e.clientX, py: e.clientY, nx: vue.x, ny: vue.y, fond: true };
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const g = glisse.current;
              if (!g) return;
              const k = echelle();
              if (g.fond) setVue((v) => ({ ...v, x: g.nx + (e.clientX - g.px) * k * vue.k, y: g.ny + (e.clientY - g.py) * k * vue.k }));
              else if (g.id && d.disposition === "libre") majNoeud(g.id, { x: Math.round(g.nx + (e.clientX - g.px) * k), y: Math.round(g.ny + (e.clientY - g.py) * k) });
            }}
            onPointerUp={() => {
              glisse.current = null;
            }}
          >
            {d.genre === "graphe" && d.noeuds.length === 0 && <p className="atelier-vide">Clique sur « Ajouter un élément » pour commencer.</p>}
            <SvgSchema
              donnees={d}
              uid={uid}
              plan={plan}
              cadre={cadre}
              replies={new Set()}
              selection={selection?.id ?? null}
              transformation={d.genre === "graphe" ? transformation : undefined}
              surNoeud={(id, e) => {
                e.stopPropagation();
                if (relier && relier !== id) {
                  if (!d.liens.some((l) => l.de === relier && l.vers === id)) modifier((x) => ({ ...x, liens: [...x.liens, nouveauLien(relier, id, { fleche: !sansFleche })] }));
                  setRelier(null);
                  return;
                }
                setSelection({ type: "noeud", id });
                const n = d.noeuds.find((x) => x.id === id);
                if (n && d.disposition === "libre") {
                  setHistorique((h) => [...h.slice(-49), d]);
                  glisse.current = { id, px: e.clientX, py: e.clientY, nx: n.x, ny: n.y };
                  cadreRef.current?.setPointerCapture(e.pointerId);
                }
              }}
              surLienSchema={(id, e) => {
                e.stopPropagation();
                setSelection({ type: "lien", id });
              }}
              surDoubleClic={() => texteRef.current?.focus()}
            />
            {d.genre === "graphe" && (
              <div className="atelier-zoom">
                <button type="button" className="bouton-icone" aria-label="Zoomer" onClick={() => setVue((v) => ({ ...v, k: Math.min(4, v.k * 1.2) }))}>
                  <Plus className="size-4" aria-hidden="true" />
                </button>
                <button type="button" className="bouton-icone" aria-label="Dézoomer" onClick={() => setVue((v) => ({ ...v, k: Math.max(0.25, v.k / 1.2) }))}>
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <button type="button" className="bouton-icone" aria-label="Tout afficher" onClick={() => setVue({ x: 0, y: 0, k: 1 })}>
                  <Maximize className="size-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          <aside className="atelier-panneau" aria-label="Réglages">
            {d.genre === "graphe" && !noeudChoisi && !lienChoisi && (
              <div className="space-y-3 text-sm text-encre-douce">
                <p>Clique sur un élément pour le modifier.</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li><kbd>Tab</kbd> : ajouter un enfant</li>
                  <li><kbd>Entrée</kbd> : ajouter un élément au même niveau</li>
                  <li><kbd>Suppr</kbd> : supprimer</li>
                  <li><kbd>F2</kbd> : modifier le texte</li>
                  <li><kbd>Ctrl</kbd> + <kbd>Z</kbd> : annuler</li>
                  <li>Molette : zoom ; glisser le fond : se déplacer</li>
                </ul>
                <p>
                  {d.noeuds.length} élément{d.noeuds.length > 1 ? "s" : ""} sur {LIMITES_SCHEMA.noeuds}.
                </p>
              </div>
            )}
            {noeudChoisi && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="schema-texte" className="etiquette text-sm">
                    Texte
                  </label>
                  <textarea ref={texteRef} id="schema-texte" className="champ min-h-24" value={noeudChoisi.texte} maxLength={LIMITES_SCHEMA.texte} onChange={(e) => majNoeud(noeudChoisi.id, { texte: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-sm">
                    <span className="etiquette text-sm">Forme</span>
                    <select className="champ !min-h-10 !py-2" value={noeudChoisi.forme} onChange={(e) => majNoeud(noeudChoisi.id, { forme: e.target.value as NoeudSchema["forme"] }, true)}>
                      {FORMES.map((f) => (
                        <option key={f.cle} value={f.cle}>
                          {f.libelle}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="etiquette text-sm">Rôle</span>
                    <select
                      className="champ !min-h-10 !py-2"
                      value={noeudChoisi.role}
                      onChange={(e) => {
                        const role = ROLES.find((r) => r.cle === e.target.value);
                        majNoeud(noeudChoisi.id, { role: (role?.cle ?? "") as NoeudSchema["role"], ...(role?.cle ? { teinte: role.teinte as Teinte } : {}) }, true);
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r.cle} value={r.cle}>
                          {r.libelle}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <Teintes valeur={noeudChoisi.teinte} onChange={(t) => majNoeud(noeudChoisi.id, { teinte: t }, true)} />
                <ChoixArticle valeur={noeudChoisi.article} onChange={(id) => majNoeud(noeudChoisi.id, { article: id }, true)} libelle="Ouvre l'article" />
                <div>
                  <label htmlFor="schema-lien" className="etiquette text-sm">
                    Ou un lien web
                  </label>
                  <input id="schema-lien" className="champ !min-h-10 !py-2" value={noeudChoisi.lien} onChange={(e) => majNoeud(noeudChoisi.id, { lien: e.target.value })} placeholder="https://…" />
                </div>
                <div>
                  <label htmlFor="schema-commentaire" className="etiquette text-sm">
                    Commentaire (affiché au survol)
                  </label>
                  <textarea id="schema-commentaire" className="champ min-h-16" value={noeudChoisi.commentaire} maxLength={1000} onChange={(e) => majNoeud(noeudChoisi.id, { commentaire: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4" checked={noeudChoisi.replie} onChange={(e) => majNoeud(noeudChoisi.id, { replie: e.target.checked }, true)} />
                  Branche repliée au départ pour le lecteur
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="bouton bouton-discret !min-h-10 text-sm" onClick={() => ajouterEnfant(noeudChoisi.id)}>
                    <Plus className="size-4" aria-hidden="true" /> Enfant
                  </button>
                  <button type="button" className="bouton bouton-danger !min-h-10 text-sm" onClick={supprimer}>
                    <Trash2 className="size-4" aria-hidden="true" /> Supprimer
                  </button>
                </div>
              </div>
            )}
            {lienChoisi && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="lien-texte" className="etiquette text-sm">
                    Texte du lien
                  </label>
                  <input id="lien-texte" className="champ !min-h-10 !py-2" value={lienChoisi.texte} maxLength={200} onChange={(e) => majLien(lienChoisi.id, { texte: e.target.value })} placeholder="implique, réfute, est une sorte de…" />
                </div>
                <label className="block text-sm">
                  <span className="etiquette text-sm">Nature</span>
                  <select className="champ !min-h-10 !py-2" value={lienChoisi.nature} onChange={(e) => majLien(lienChoisi.id, { nature: e.target.value as LienSchema["nature"] })}>
                    {NATURES_LIEN.map((n) => (
                      <option key={n.cle} value={n.cle}>
                        {n.libelle}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="etiquette text-sm">Trait</span>
                  <select className="champ !min-h-10 !py-2" value={lienChoisi.trait} onChange={(e) => majLien(lienChoisi.id, { trait: e.target.value as LienSchema["trait"] })}>
                    <option value="plein">Plein</option>
                    <option value="tirets">Tirets</option>
                    <option value="pointille">Pointillé</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4" checked={lienChoisi.fleche} onChange={(e) => majLien(lienChoisi.id, { fleche: e.target.checked })} />
                  Flèche
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="bouton bouton-discret !min-h-10 text-sm" onClick={() => majLien(lienChoisi.id, { de: lienChoisi.vers, vers: lienChoisi.de })}>
                    Inverser le sens
                  </button>
                  <button type="button" className="bouton bouton-danger !min-h-10 text-sm" onClick={supprimer}>
                    <Trash2 className="size-4" aria-hidden="true" /> Supprimer
                  </button>
                </div>
              </div>
            )}
            {d.genre === "venn" && <FormulaireVenn d={d} modifier={modifier} />}
            {d.genre === "statistique" && <FormulaireStatistique d={d} modifier={modifier} />}
            {d.genre === "fonction" && <FormulaireFonction d={d} modifier={modifier} />}
            {d.genre === "matrice" && <FormulaireMatrice d={d} modifier={modifier} />}
            <button type="button" className="bouton bouton-discret mt-6 w-full !min-h-10 text-sm" onClick={() => { const s = svgCourant(); if (s) exporterSvg(s, d.titre); }}>
              Exporter en SVG
            </button>
          </aside>
        </div>
      </div>
    </Modale>
  );
}

type PropsForm = { d: DonneesSchema; modifier: (f: (x: DonneesSchema) => DonneesSchema, memoriser?: boolean) => void };

function FormulaireVenn({ d, modifier }: PropsForm) {
  const trois = d.ensembles.length >= 3;
  const zones = trois ? ZONES_VENN : (["A", "B", "AB"] as const);
  const libelleZone = (z: string) => (z.length === 1 ? `Seulement ${d.ensembles["ABC".indexOf(z)]?.nom || z}` : z.length === 3 ? "Commun aux trois" : `${d.ensembles["ABC".indexOf(z[0])]?.nom || z[0]} et ${d.ensembles["ABC".indexOf(z[1])]?.nom || z[1]}`);
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4"
          checked={trois}
          onChange={(e) => modifier((x) => ({ ...x, ensembles: e.target.checked ? [...x.ensembles.slice(0, 2), { nom: "Ensemble C", teinte: "emeraude" }] : x.ensembles.slice(0, 2) }))}
        />
        Trois ensembles
      </label>
      {d.ensembles.map((e, i) => (
        <div key={i} className="space-y-2">
          <input className="champ !min-h-10 !py-2" aria-label={`Nom de l'ensemble ${i + 1}`} value={e.nom} onChange={(ev) => modifier((x) => ({ ...x, ensembles: x.ensembles.map((y, k) => (k === i ? { ...y, nom: ev.target.value } : y)) }), false)} />
          <Teintes valeur={e.teinte} onChange={(t) => modifier((x) => ({ ...x, ensembles: x.ensembles.map((y, k) => (k === i ? { ...y, teinte: t } : y)) }))} libelle={`Couleur de l'ensemble ${i + 1}`} />
        </div>
      ))}
      {zones.map((z) => (
        <div key={z}>
          <label className="etiquette text-sm" htmlFor={`zone-${z}`}>
            {libelleZone(z)}
          </label>
          <textarea id={`zone-${z}`} className="champ min-h-14" value={d.zones[z] ?? ""} maxLength={300} onChange={(ev) => modifier((x) => ({ ...x, zones: { ...x.zones, [z]: ev.target.value } }), false)} />
        </div>
      ))}
    </div>
  );
}

function FormulaireStatistique({ d, modifier }: PropsForm) {
  const n = Math.max(d.etiquettes.length, 1);
  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="etiquette text-sm">Type de graphique</span>
        <select className="champ !min-h-10 !py-2" value={d.typeStat} onChange={(e) => modifier((x) => ({ ...x, typeStat: e.target.value as DonneesSchema["typeStat"] }))}>
          <option value="barres">Histogramme (barres)</option>
          <option value="courbe">Courbe</option>
          <option value="secteurs">Diagramme circulaire</option>
          <option value="nuage">Nuage de points</option>
        </select>
      </label>
      {d.typeStat !== "secteurs" && (
        <div className="grid grid-cols-2 gap-2">
          <input className="champ !min-h-10 !py-2" aria-label="Titre de l'axe horizontal" placeholder="Axe horizontal" value={d.titreX} onChange={(e) => modifier((x) => ({ ...x, titreX: e.target.value }), false)} />
          <input className="champ !min-h-10 !py-2" aria-label="Titre de l'axe vertical" placeholder="Axe vertical" value={d.titreY} onChange={(e) => modifier((x) => ({ ...x, titreY: e.target.value }), false)} />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="table-donnees">
          <thead>
            <tr>
              <th scope="col">{d.typeStat === "nuage" ? "X" : "Étiquette"}</th>
              {d.series.map((s, k) => (
                <th key={k} scope="col">
                  <input className="champ !min-h-8 !py-1 text-sm" aria-label={`Nom de la série ${k + 1}`} value={s.nom} onChange={(e) => modifier((x) => ({ ...x, series: x.series.map((y, j) => (j === k ? { ...y, nom: e.target.value } : y)) }), false)} />
                  <select className="champ !min-h-8 !py-1 text-sm" aria-label={`Couleur de la série ${k + 1}`} value={s.teinte} onChange={(e) => modifier((x) => ({ ...x, series: x.series.map((y, j) => (j === k ? { ...y, teinte: e.target.value as Teinte } : y)) }))}>
                    {TEINTES.map((t) => (
                      <option key={t.cle} value={t.cle}>
                        {t.libelle}
                      </option>
                    ))}
                  </select>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, i) => (
              <tr key={i}>
                <td>
                  <input className="champ !min-h-8 !py-1 text-sm" aria-label={`Étiquette ${i + 1}`} value={d.etiquettes[i] ?? ""} onChange={(e) => modifier((x) => ({ ...x, etiquettes: Array.from({ length: n }, (_, j) => (j === i ? e.target.value : (x.etiquettes[j] ?? ""))) }), false)} />
                </td>
                {d.series.map((s, k) => (
                  <td key={k}>
                    <input
                      className="champ !min-h-8 !py-1 text-sm"
                      inputMode="decimal"
                      aria-label={`Valeur ${i + 1} de ${s.nom}`}
                      defaultValue={s.valeurs[i] ?? ""}
                      onBlur={(e) => {
                        const v = Number(e.target.value.replace(",", "."));
                        modifier((x) => ({ ...x, series: x.series.map((y, j) => (j === k ? { ...y, valeurs: Array.from({ length: n }, (_, m) => (m === i ? (Number.isFinite(v) ? v : 0) : (y.valeurs[m] ?? 0))) } : y)) }));
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="bouton bouton-discret !min-h-9 text-sm" disabled={n >= LIMITES_SCHEMA.points} onClick={() => modifier((x) => ({ ...x, etiquettes: [...Array.from({ length: n }, (_, j) => x.etiquettes[j] ?? ""), ""], series: x.series.map((s) => ({ ...s, valeurs: [...Array.from({ length: n }, (_, j) => s.valeurs[j] ?? 0), 0] })) }))}>
          <Plus className="size-4" aria-hidden="true" /> Ligne
        </button>
        <button type="button" className="bouton bouton-discret !min-h-9 text-sm" disabled={d.series.length >= LIMITES_SCHEMA.series || d.typeStat === "secteurs"} onClick={() => modifier((x) => ({ ...x, series: [...x.series, { nom: `Série ${x.series.length + 1}`, teinte: TEINTES[x.series.length % TEINTES.length].cle, valeurs: Array.from({ length: n }, () => 0) }] }))}>
          <Plus className="size-4" aria-hidden="true" /> Série
        </button>
        <button type="button" className="bouton bouton-discret !min-h-9 text-sm" disabled={n <= 1} onClick={() => modifier((x) => ({ ...x, etiquettes: x.etiquettes.slice(0, n - 1), series: x.series.map((s) => ({ ...s, valeurs: s.valeurs.slice(0, n - 1) })) }))}>
          <Minus className="size-4" aria-hidden="true" /> Ligne
        </button>
        <button type="button" className="bouton bouton-discret !min-h-9 text-sm" disabled={d.series.length <= 1} onClick={() => modifier((x) => ({ ...x, series: x.series.slice(0, -1) }))}>
          <Minus className="size-4" aria-hidden="true" /> Série
        </button>
      </div>
    </div>
  );
}

function FormulaireFonction({ d, modifier }: PropsForm) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-encre-douce">
        Écris y en fonction de x : <code>x^2 - 3x + 1</code>, <code>sin(x)/x</code>, <code>sqrt(x)</code>, <code>e^(-x^2)</code>, <code>ln(x)</code>, <code>abs(x)</code>, <code>pi</code>.
      </p>
      {d.fonctions.map((f, i) => {
        const { erreur } = compiler(f.expression);
        return (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono italic">y =</span>
              <input className="champ !min-h-10 flex-1 !py-2 font-mono" aria-label={`Fonction ${i + 1}`} value={f.expression} onChange={(e) => modifier((x) => ({ ...x, fonctions: x.fonctions.map((y, k) => (k === i ? { ...y, expression: e.target.value } : y)) }), false)} />
              <button type="button" className="bouton-icone !size-9" aria-label="Retirer cette fonction" disabled={d.fonctions.length <= 1} onClick={() => modifier((x) => ({ ...x, fonctions: x.fonctions.filter((_, k) => k !== i) }))}>
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
            {erreur && f.expression && <p className="text-sm text-danger">{erreur}</p>}
            <Teintes valeur={f.teinte} onChange={(t) => modifier((x) => ({ ...x, fonctions: x.fonctions.map((y, k) => (k === i ? { ...y, teinte: t } : y)) }))} libelle={`Couleur de la fonction ${i + 1}`} />
          </div>
        );
      })}
      <button type="button" className="bouton bouton-discret !min-h-9 text-sm" disabled={d.fonctions.length >= LIMITES_SCHEMA.fonctions} onClick={() => modifier((x) => ({ ...x, fonctions: [...x.fonctions, { expression: "", teinte: TEINTES[x.fonctions.length % TEINTES.length].cle }] }))}>
        <Plus className="size-4" aria-hidden="true" /> Fonction
      </button>
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="etiquette text-sm">Fenêtre</legend>
        {(["xmin", "xmax", "ymin", "ymax"] as const).map((k) => (
          <label key={k} className="text-sm">
            {k}
            <input
              className="champ !min-h-9 !py-1"
              inputMode="decimal"
              defaultValue={d.fenetre[k]}
              onBlur={(e) => {
                const v = Number(e.target.value.replace(",", "."));
                if (Number.isFinite(v)) modifier((x) => ({ ...x, fenetre: { ...x.fenetre, [k]: v } }));
              }}
            />
          </label>
        ))}
      </fieldset>
    </div>
  );
}

function FormulaireMatrice({ d, modifier }: PropsForm) {
  const majCellule = (i: number, j: number, c: Partial<DonneesSchema["cellules"][number][number]>) =>
    modifier((x) => ({ ...x, cellules: x.criteres.map((_, a) => x.positions.map((__, b) => (a === i && b === j ? { ...(x.cellules[a]?.[b] ?? { valeur: "", note: "" }), ...c } : (x.cellules[a]?.[b] ?? { valeur: "", note: "" })))) }), false);
  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="etiquette text-sm">Positions comparées (colonnes)</legend>
        {d.positions.map((p, j) => (
          <div key={j} className="flex gap-2">
            <input className="champ !min-h-9 flex-1 !py-1" aria-label={`Position ${j + 1}`} value={p} onChange={(e) => modifier((x) => ({ ...x, positions: x.positions.map((y, k) => (k === j ? e.target.value : y)) }), false)} />
            <button type="button" className="bouton-icone !size-9" aria-label="Retirer cette position" disabled={d.positions.length <= 1} onClick={() => modifier((x) => ({ ...x, positions: x.positions.filter((_, k) => k !== j), cellules: x.cellules.map((l) => l.filter((_, k) => k !== j)) }))}>
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        <button type="button" className="bouton bouton-discret !min-h-9 text-sm" disabled={d.positions.length >= LIMITES_SCHEMA.positions} onClick={() => modifier((x) => ({ ...x, positions: [...x.positions, `Position ${x.positions.length + 1}`], cellules: x.cellules.map((l) => [...l, { valeur: "", note: "" }]) }))}>
          <Plus className="size-4" aria-hidden="true" /> Position
        </button>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="etiquette text-sm">Critères (lignes) et évaluations</legend>
        {d.criteres.map((c, i) => (
          <div key={i} className="space-y-1.5 rounded-xl border border-trait p-2">
            <div className="flex gap-2">
              <input className="champ !min-h-9 flex-1 !py-1" aria-label={`Critère ${i + 1}`} value={c} onChange={(e) => modifier((x) => ({ ...x, criteres: x.criteres.map((y, k) => (k === i ? e.target.value : y)) }), false)} />
              <button type="button" className="bouton-icone !size-9" aria-label="Retirer ce critère" disabled={d.criteres.length <= 1} onClick={() => modifier((x) => ({ ...x, criteres: x.criteres.filter((_, k) => k !== i), cellules: x.cellules.filter((_, k) => k !== i) }))}>
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
            {d.positions.map((p, j) => (
              <div key={j} className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2 text-sm">
                <input className="champ !min-h-8 !py-1" aria-label={`Note : ${c} pour ${p}`} placeholder={`${p} : note`} value={d.cellules[i]?.[j]?.note ?? ""} onChange={(e) => majCellule(i, j, { note: e.target.value })} />
                <select className="champ !min-h-8 !py-1" aria-label={`Évaluation : ${c} pour ${p}`} value={d.cellules[i]?.[j]?.valeur ?? ""} onChange={(e) => majCellule(i, j, { valeur: e.target.value as "oui" })}>
                  <option value="">—</option>
                  <option value="oui">✓ Oui</option>
                  <option value="non">✗ Non</option>
                  <option value="partiel">◐ En partie</option>
                  <option value="inconnu">? Incertain</option>
                </select>
              </div>
            ))}
          </div>
        ))}
        <button type="button" className="bouton bouton-discret !min-h-9 text-sm" disabled={d.criteres.length >= LIMITES_SCHEMA.criteres} onClick={() => modifier((x) => ({ ...x, criteres: [...x.criteres, `Critère ${x.criteres.length + 1}`], cellules: [...x.cellules, x.positions.map(() => ({ valeur: "" as const, note: "" }))] }))}>
          <Plus className="size-4" aria-hidden="true" /> Critère
        </button>
      </fieldset>
    </div>
  );
}
