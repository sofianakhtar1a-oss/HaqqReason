"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ELEMENTS } from "@/lib/corps/catalogue";
import referencesJson from "@/lib/corps/fiches/references.json";
import couvertureJson from "@/lib/corps/modele/couverture.json";
import { AMPLITUDES_SOURCES } from "@/lib/corps/mouvement/articulations";

const REFERENCES = referencesJson as { fiches: number; references: { nom: string; url: string; fiches: number }[] };
const nombre = (n: number) => n.toLocaleString("fr-FR");
const COUVERTURE = couvertureJson as unknown as {
  raisons: Record<string, string>;
  couches: Record<string, { reference: number; presents: number; part: number; reperes?: number; hors_champ?: Record<string, string[]> }>;
};
const NOMS_RAISONS: Record<string, string> = { pudeur: "Par pudeur", feminin: "Propres au corps de la femme", microscopique: "Microscopiques ou cachées dans un organe", classement: "Termes de classement", inconstant: "Variantes inconstantes" };
// Les termes hors du champ, toutes couches réunies, par raison.
const HORS_CHAMP = Object.entries(
  Object.values(COUVERTURE.couches).reduce<Record<string, string[]>>((acc, c) => {
    for (const [r, l] of Object.entries(c.hors_champ ?? {})) acc[r] = [...(acc[r] ?? []), ...l];
    return acc;
  }, {}),
);
const CONSTRUITS = ELEMENTS.filter((e) => e.construit).length;
const NOMS_COUVERTURE: [string, string, string][] = [
  ["os", "Les os", "os nommés"],
  ["muscle", "Les muscles", "muscles nommés"],
  ["ligament", "Les ligaments", "ligaments, ménisques et disques"],
  ["artere", "Les artères", "artères nommées"],
  ["veine", "Les veines", "veines et sinus nommés"],
  ["nerf", "Les nerfs", "nerfs, plexus et ganglions"],
  ["lymphe", "Les nœuds lymphatiques", "groupes de nœuds"],
  ["encephale", "L'encéphale", "gyrus, sillons, noyaux et voies"],
  ["viscere", "Les viscères", "organes d'une liste de référence"],
];

/*
 * D'où vient le corps de L'Écorché, et ce qu'on a le droit d'en faire.
 * Les modèles sont dérivés d'atlas libres sous licence « partage dans les mêmes conditions » : la licence demande
 * de citer les auteurs comme ils le souhaitent, et de partager ce qu'on en tire sous la même licence.
 */
export function Sources({ fermer }: { fermer: () => void }) {
  const boite = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = boite.current;
    if (d && !d.open) d.showModal();
    const fermeture = () => fermer();
    d?.addEventListener("close", fermeture);
    return () => d?.removeEventListener("close", fermeture);
  }, [fermer]);

  return (
    <dialog ref={boite} className="ec-dialogue ec-sources" aria-labelledby="ec-titre-sources">
      <header>
        <h2 id="ec-titre-sources">Sources et licences</h2>
        <button type="button" className="ec-icone" onClick={() => boite.current?.close()} aria-label="Fermer">
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <div className="ec-dialogue-corps">
        <p className="ec-note">Le corps de L’Écorché n’est pas dessiné à la main : il vient d’atlas d’anatomie libres, allégés et préparés pour le navigateur. Les {ELEMENTS.length} structures gardent le nom que leur donne la nomenclature internationale.</p>

        <h3 className="ec-section-titre">Les modèles en trois dimensions</h3>
        <ul className="ec-sources-liste">
          <li>
            <b>Z-Anatomy — The libre 3D atlas of anatomy</b>, licence CC BY-SA 4.0. Conception, modèles et anatomie : Gauthier Kervyn ; avec Marcin Zieliński, Lluís Vinent et leurs contributeurs.{" "}
            <a href="https://www.z-anatomy.com" target="_blank" rel="noreferrer">
              z-anatomy.com
            </a>
          </li>
          <li>
            <b>BodyParts3D</b>, dont Z-Anatomy est issu : « BodyParts3D, Copyright © 2008 Life Science Integrated Database Center », The Database Center for Life Science, licence CC BY-SA 2.1 Japon. Modèle d’origine : Kousaku Okubo. Le rein, le rectum, l’iléon et le muscle semi-épineux de la tête, que Z-Anatomy n’offre pas sous une licence libre ou n’a pas, en viennent directement (copie des fichiers publiée par Kevin M. Moerman sur GitHub).{" "}
            <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noreferrer">
              dbarchive.biosciencedbc.jp
            </a>
          </li>
          <li>
            Z-Anatomy a aussi adapté, pour l’encéphale, « Brainder » et « White matter » (Université de Washington) et, pour les nerfs crâniens, « Cranial Nerves and Foramina » (University of Dundee, CAHID, licence CC BY 4.0).
          </li>
        </ul>

        <h3 className="ec-section-titre">Ce que nous avons changé</h3>
        <p>
          Chaque modèle a été allégé en plusieurs niveaux de détail et lissé ; les artères, les veines et les nerfs ont été retracés en tubes ; l’ombre de contact et le sens des fibres ont été calculés ; les tendons, qui font corps avec leur muscle dans l’atlas, sont devenus des structures à part ; les noms ont été relus en français.
        </p>
        <p>
          Nous avons écarté la peau, par pudeur les organes génitaux externes, et les modèles de Z-Anatomy que leur licence réserve à un usage non commercial. Le rein a été repris de BodyParts3D, placé au centre et à la taille de celui qu’il remplace ; le rectum, l’iléon et le semi-épineux de la tête ont été placés d’après leurs voisins.
        </p>
        <p>
          Ce que les deux atlas n’ont pas, nous l’avons construit nous-mêmes{CONSTRUITS > 3 ? ` (${nombre(CONSTRUITS)} structures)` : ""} : les branches des vaisseaux et des nerfs, les ganglions et les plexus, les petits ligaments et muscles, les noyaux et faisceaux de l’encéphale, l’oreille interne. Chacune est décrite d’après les manuels (Gray’s Anatomy, TeachMeAnatomy, Kenhub) : où elle naît, par où elle passe, où elle finit, chaque point étant posé sur une structure du modèle (l’axe d’une artère, le bord d’un muscle, un relief d’os) ; une branche est tracée comme l’atlas trace ses vaisseaux (un axe et un rayon), un ganglion ou un noyau est un petit volume à sa place. Ce sont des tracés fidèles aux descriptions classiques, pas des relevés de dissection : leur fiche le signale (« tracé d’après les manuels »). L’oreille interne de Z-Anatomy n’étant pas libre, nous n’en avons gardé que la place et la taille.
        </p>

        <h3 className="ec-section-titre">Ce que vous pouvez en faire</h3>
        <p>
          Les modèles préparés pour L’Écorché (les fichiers servis sous <code>/corps/</code>) sont à leur tour sous licence{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr" target="_blank" rel="noreferrer">
            Creative Commons Attribution – Partage dans les mêmes conditions 4.0
          </a>
          . Vous pouvez les copier et les adapter, à condition de citer les sources ci-dessus et de partager le résultat sous la même licence.
        </p>

        <h3 className="ec-section-titre">Les noms</h3>
        <p>
          La nomenclature suit la <i lang="la">Terminologia Anatomica</i>, 2<sup>e</sup> édition (Federative International Programme for Anatomical Terminology, 2019), dont chaque fiche donne le numéro. Les anciens noms français (omoplate, rotule, péroné…) restent acceptés dans les réponses.
        </p>

        <h3 className="ec-section-titre">Ce que le modèle couvre</h3>
        <p>
          Pour chaque couche, la part des structures que la <i lang="la">Terminologia Anatomica</i> nomme et que le modèle montre : par un modèle, par un ensemble (un groupe nommé, comme les lobes du cerveau ou les nœuds axillaires, montre ses membres) ou par un repère (un point nommé sur sa structure, qu’on trouve en le cherchant).
        </p>
        <ul className="ec-facettes">
          {NOMS_COUVERTURE.filter(([c]) => COUVERTURE.couches[c]).map(([c, nom, quoi]) => {
            const x = COUVERTURE.couches[c];
            return (
              <li key={c}>
                <span className="ec-facette-nom">{nom}</span>
                <span className="ec-jauge fine" aria-hidden="true">
                  <span style={{ transform: `scaleX(${x.part})` }} />
                </span>
                <span className="ec-facette-chiffre" title={`${x.presents} ${quoi} sur ${x.reference}${x.reperes ? `, dont ${x.reperes} par un repère` : ""}`}>
                  {Math.floor(x.part * 100)} %
                </span>
              </li>
            );
          })}
        </ul>
        {HORS_CHAMP.length > 0 && (
          <details className="ec-hors-champ">
            <summary>Hors du champ ({HORS_CHAMP.reduce((n, [, l]) => n + l.length, 0)} termes)</summary>
            <p>Le corps de L’Écorché est celui d’un homme adulte, à l’échelle d’un atlas. Ces termes de la nomenclature n’y ont pas de place, pour ces raisons :</p>
            {HORS_CHAMP.map(([r, l]) => (
              <div key={r}>
                <h4>
                  {NOMS_RAISONS[r] ?? r} <span>{l.length}</span>
                </h4>
                <p className="ec-note">{COUVERTURE.raisons[r]}</p>
                <p className="ec-hors-champ-liste">{l.join(" · ")}</p>
              </div>
            ))}
          </details>
        )}

        <h3 className="ec-section-titre">Les fiches</h3>
        <p>
          Les {nombre(REFERENCES.fiches)} fiches (attaches, action, innervation et racines, trajet et branches, territoire, rôle, examen, clinique) sont rédigées pour L’Écorché. Chacune est recoupée sur au moins deux références, qu’elle cite ; quand les auteurs divergent, la fiche le dit. Les tendons sans nom propre reprennent la fiche de leur muscle.
        </p>
        <ul className="ec-sources-liste">
          {REFERENCES.references.map((r) => (
            <li key={r.nom}>
              {r.url ? (
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.nom}
                </a>
              ) : (
                r.nom
              )}{" "}
              : {nombre(r.fiches)} fiche{r.fiches > 1 ? "s" : ""}
            </li>
          ))}
        </ul>

        <h3 className="ec-section-titre">Les mouvements</h3>
        <p>Les centres et les axes des articulations sont mesurés sur les os du modèle ; les amplitudes suivent ces références :</p>
        <ul className="ec-sources-liste">
          {AMPLITUDES_SOURCES.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
