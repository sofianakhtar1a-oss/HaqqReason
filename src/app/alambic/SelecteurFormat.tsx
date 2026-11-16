"use client";

import { Archive, AudioLines, ChevronDown, Clapperboard, FileText, Image as IconeImage, Lock, Search, Sheet, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FAMILLES, FORMATS, format, type Famille } from "@/lib/alambic/formats";
import type { Verdict } from "@/lib/alambic/graphe";

export const ICONES: Record<Famille, typeof FileText> = {
  document: FileText,
  donnees: Sheet,
  image: IconeImage,
  audio: AudioLines,
  video: Clapperboard,
  archive: Archive,
};

const sansAccents = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Props = {
  role: "source" | "destination";
  valeur: string | null;
  detecte?: string | null;
  /** Pour la destination : ce que chaque format donnerait. */
  verdicts?: Record<string, Verdict>;
  onChoisir: (id: string) => void;
  desactive?: boolean;
  vide: string;
};

export function SelecteurFormat({ role, valeur, detecte, verdicts, onChoisir, desactive, vide }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const f = valeur ? format(valeur) : null;
  const Icone = f ? ICONES[f.famille] : role === "source" ? FileText : ChevronDown;
  return (
    <>
      <button
        type="button"
        className="alambic-bloc"
        data-role={role}
        data-famille={f?.famille}
        data-vide={!f || undefined}
        onClick={() => setOuvert(true)}
        disabled={desactive}
        aria-haspopup="dialog"
        aria-label={`${role === "source" ? "Format de départ" : "Format d'arrivée"} : ${f ? f.nom : "à choisir"}. Changer`}
      >
        <span className="alambic-bloc-role">{role === "source" ? "De" : "Vers"}</span>
        {f ? (
          <span key={f.id} className="alambic-bloc-contenu">
            <Icone className="alambic-bloc-icone" strokeWidth={1.4} aria-hidden="true" />
            <span className="alambic-bloc-nom">{f.nom}</span>
            <span className="alambic-bloc-ext">
              .{f.id === "gz" ? "tar.gz" : f.extensions[0]}
              {role === "source" && detecte === f.id && <span className="alambic-pastille">reconnu</span>}
            </span>
            <span className="alambic-bloc-aide">{f.aide}</span>
          </span>
        ) : (
          <span className="alambic-bloc-vide">{vide}</span>
        )}
        <ChevronDown className="alambic-bloc-chevron" aria-hidden="true" />
      </button>
      {ouvert && <Choix role={role} valeur={valeur} verdicts={verdicts} detecte={detecte} onChoisir={(id) => { onChoisir(id); setOuvert(false); }} onFermer={() => setOuvert(false)} />}
    </>
  );
}

function Choix({ role, valeur, verdicts, detecte, onChoisir, onFermer }: { role: Props["role"]; valeur: string | null; verdicts?: Record<string, Verdict>; detecte?: string | null; onChoisir: (id: string) => void; onFermer: () => void }) {
  const [q, setQ] = useState("");
  const [raison, setRaison] = useState<{ id: string; texte: string } | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const titre = useId();

  useEffect(() => {
    champ.current?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, [onFermer]);

  const groupes = useMemo(() => {
    const mots = sansAccents(q).split(/\s+/).filter(Boolean);
    return FAMILLES.map((fam) => ({
      fam,
      formats: FORMATS.filter((x) => x.famille === fam.id).filter((x) => mots.every((m) => sansAccents(`${x.nom} ${x.extensions.join(" ")} ${x.aide} ${fam.nom}`).includes(m))),
    })).filter((g) => g.formats.length);
  }, [q]);

  const possibles = verdicts ? Object.values(verdicts).filter((v) => v.possible).length : FORMATS.length;

  return (
    <div className="alambic-choix-fond" role="presentation" onMouseDown={onFermer}>
      <div className="alambic-choix verre" role="dialog" aria-modal="true" aria-labelledby={titre} onMouseDown={(e) => e.stopPropagation()}>
        <header className="alambic-choix-tete">
          <div>
            <h2 id={titre} className="font-display text-xl font-bold">
              {role === "source" ? "Format du fichier de départ" : "Convertir en…"}
            </h2>
            <p className="text-sm text-encre-douce">
              {role === "source"
                ? "Reconnu automatiquement ; change-le seulement si le fichier a été mal nommé."
                : `${possibles} format${possibles > 1 ? "s" : ""} possible${possibles > 1 ? "s" : ""}. Les autres disent pourquoi.`}
            </p>
          </div>
          <button type="button" className="bouton-icone" onClick={onFermer} aria-label="Fermer">
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <label className="alambic-choix-recherche">
          <Search className="size-4 shrink-0 text-encre-douce" aria-hidden="true" />
          <input ref={champ} value={q} onChange={(e) => setQ(e.target.value)} placeholder="pdf, image, excel, son…" aria-label="Chercher un format" />
        </label>
        <div className="alambic-choix-corps">
          {groupes.map(({ fam, formats }) => {
            const Icone = ICONES[fam.id];
            return (
              <section key={fam.id} className="alambic-famille" data-famille={fam.id}>
                <h3>
                  <Icone className="size-4" aria-hidden="true" />
                  {fam.nom}
                </h3>
                <div className="alambic-formats">
                  {formats.map((x) => {
                    const v = verdicts?.[x.id];
                    const impossible = v && !v.possible;
                    return (
                      <button
                        key={x.id}
                        type="button"
                        className="alambic-format"
                        aria-pressed={valeur === x.id}
                        aria-disabled={impossible || undefined}
                        data-impossible={impossible || undefined}
                        data-partiel={v?.possible && v.fidelite === "partielle" ? true : undefined}
                        title={impossible ? v.raison : x.aide}
                        onClick={() => {
                          if (impossible) setRaison({ id: x.id, texte: v.raison });
                          else onChoisir(x.id);
                        }}
                      >
                        <span className="alambic-format-nom">{x.nom}</span>
                        <span className="alambic-format-ext">{x.id === "gz" ? ".tar.gz" : `.${x.extensions[0]}`}</span>
                        {impossible && <Lock className="alambic-format-cadenas" aria-hidden="true" />}
                        {role === "source" && detecte === x.id && <span className="alambic-pastille">reconnu</span>}
                      </button>
                    );
                  })}
                </div>
                {raison && formats.some((x) => x.id === raison.id) && (
                  <p className="alambic-raison" role="status">
                    <strong>{format(raison.id).nom} :</strong> {raison.texte}
                  </p>
                )}
              </section>
            );
          })}
          {!groupes.length && <p className="p-4 text-encre-douce">Aucun format ne correspond.</p>}
        </div>
      </div>
    </div>
  );
}
