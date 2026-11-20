"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { ELEMENTS } from "@/lib/corps/catalogue";

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
            <b>BodyParts3D</b>, dont Z-Anatomy est issu : « BodyParts3D, Copyright © 2008 Life Science Integrated Database Center », The Database Center for Life Science, licence CC BY-SA 2.1 Japon. Modèle d’origine : Kousaku Okubo.{" "}
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
          Nous avons écarté la peau, par pudeur les organes génitaux externes, et les deux modèles que leur licence réserve à un usage non commercial (l’oreille interne et le rein) : ils seront refaits à partir de sources libres.
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

        <h3 className="ec-section-titre">Les fiches</h3>
        <p>Les fiches (origine, terminaison, action, innervation, territoire…) sont rédigées pour L’Écorché. Leur vérification, structure par structure, avec deux ouvrages de référence est en cours ; chaque fiche vérifiée citera ses sources.</p>
      </div>
    </dialog>
  );
}
