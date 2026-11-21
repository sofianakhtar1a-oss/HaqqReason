"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ELEMENTS } from "@/lib/corps/catalogue";
import referencesJson from "@/lib/corps/fiches/references.json";
import couvertureJson from "@/lib/corps/modele/couverture.json";
import { AMPLITUDES_SOURCES } from "@/lib/corps/mouvement/articulations";

const REFERENCES = referencesJson as { fiches: number; references: { nom: string; url: string; fiches: number }[] };
const nombre = (n: number) => n.toLocaleString("fr-FR");
const COUVERTURE = couvertureJson as { couches: Record<string, { reference: number; presents: number; part: number }> };
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
          Nous avons écarté la peau, par pudeur les organes génitaux externes, et les modèles de Z-Anatomy que leur licence réserve à un usage non commercial. Le rein a été repris de BodyParts3D, placé au centre et à la taille de celui qu’il remplace ; le rectum, l’iléon et le semi-épineux de la tête ont été placés d’après leurs voisins. L’oreille interne manque encore : aucun modèle libre ne la décrit.
        </p>
        <p>
          Trois nerfs importants manquent aux deux atlas : le nerf phrénique, le nerf laryngé récurrent et le nerf glutéal inférieur. Nous les avons tracés nous-mêmes, comme l’atlas trace ses nerfs (un axe et un rayon), sur les structures que les manuels leur donnent pour voisines : le scalène antérieur, les vaisseaux subclaviers, le péricarde et le diaphragme pour le phrénique ; l’artère subclavière ou la crosse de l’aorte, puis le sillon entre la trachée et l’œsophage, pour le récurrent ; le muscle piriforme et l’artère glutéale inférieure pour le glutéal inférieur. Ce sont des tracés fidèles aux descriptions classiques, pas des relevés de dissection.
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
          Pour chaque couche, la part des structures que la <i lang="la">Terminologia Anatomica</i> nomme et que le modèle montre. Les manques sont surtout les petits rameaux des vaisseaux et des nerfs crâniens, les sous-parties de l’encéphale, l’oreille interne.
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
                <span className="ec-facette-chiffre" title={`${x.presents} ${quoi} sur ${x.reference}`}>
                  {Math.round(x.part * 100)} %
                </span>
              </li>
            );
          })}
        </ul>

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
