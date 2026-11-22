"use client";

/*
 * Convertir plusieurs fichiers d'un coup, vers un même format : chacun est converti à son tour,
 * ceux qui ne peuvent pas l'être sont laissés de côté avec leur raison, et tout se télécharge en un ZIP.
 */
import { Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { FORMATS, format, nomDuFormat, tailleLisible } from "@/lib/alambic/formats";
import { destinationParDefaut, verdict, type Capacites, type Verdict } from "@/lib/alambic/graphe";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { ChampProtection } from "./ChampProtection";
import { ListeResultats, MessageErreur, Progression, reconnaitreTous, useTravail, verifierAnnulation, ZoneDepot } from "./commun";
import { ICONES, SelecteurFormat } from "./SelecteurFormat";

const TOUS = FORMATS.map((f) => f.id);
type Element = { id: string; fichier: File; format: string | null };

export function ConversionLot({ fichiers: depart, capacites, cibleVoulue, onFermer }: { fichiers: { fichier: File; format: string | null }[]; capacites: Capacites; cibleVoulue?: string | null; onFermer: () => void }) {
  const [elements, setElements] = useState<Element[]>(() => depart.map((d) => ({ id: crypto.randomUUID(), ...d })));
  const [cible, setCible] = useState<string | null>(() => choisirCible(depart, capacites, cibleVoulue));
  const [qualite, setQualite] = useState(0.85);
  const [separateur, setSeparateur] = useState<";" | ",">(";");
  const [proteger, setProteger] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [echecs, setEchecs] = useState<{ nom: string; message: string }[]>([]);
  const { travail, erreur, lancer, annuler } = useTravail();

  /** Pour chaque format d'arrivée : combien de fichiers du lot s'y convertissent. */
  const verdicts = useMemo<Record<string, Verdict>>(() => {
    const n = elements.length;
    return Object.fromEntries(
      TOUS.map((c) => {
        const ok = elements.filter((e) => e.format && verdict(e.format, c, capacites).possible).length;
        const v: Verdict = !ok
          ? { possible: false, raison: elements.length === 1 && elements[0].format ? (verdict(elements[0].format, c, capacites) as { raison: string }).raison : "Aucun de ces fichiers ne se convertit dans ce format." }
          : { possible: true, moteur: "document", fidelite: ok === n ? "fidele" : "partielle", note: ok === n ? `Les ${n} fichiers se convertissent.` : `${ok} fichier${ok > 1 ? "s" : ""} sur ${n} ; les autres seront laissés de côté, avec leur raison.` };
        return [c, v];
      }),
    );
  }, [elements, capacites]);

  const v = cible ? verdicts[cible] : null;
  const familleCible = cible ? format(cible).famille : null;

  const ajouter = async (entrants: File[]) => {
    const reconnus = await reconnaitreTous(entrants);
    setResultats([]);
    setElements((l) => {
      const suite = [...l, ...reconnus.map((r) => ({ id: crypto.randomUUID(), ...r }))];
      if (!cible || !suite.some((e) => e.format && verdict(e.format, cible, capacites).possible)) setCible(choisirCible(suite, capacites, null));
      return suite;
    });
  };

  const convertirTout = () =>
    lancer(async (avancer, signal) => {
      if (!cible) return;
      setResultats([]);
      setEchecs([]);
      const { convertir, proteger: chiffrer } = await import("@/lib/alambic/navigateur/moteur");
      const faits: Resultat[] = [];
      const rates: { nom: string; message: string }[] = [];
      for (let i = 0; i < elements.length; i++) {
        verifierAnnulation(signal);
        const e = elements[i];
        const prefixe = `${i + 1}/${elements.length} · ${e.fichier.name}`;
        if (!e.format) {
          rates.push({ nom: e.fichier.name, message: "Format inconnu." });
          continue;
        }
        const vv = verdict(e.format, cible, capacites);
        if (!vv.possible) {
          rates.push({ nom: e.fichier.name, message: vv.raison });
          continue;
        }
        try {
          let r = await convertir({ nom: e.fichier.name, blob: e.fichier, format: e.format }, cible, { qualite, qualiteMedia: null, separateur, signal }, capacites, (a, etape) =>
            avancer((i + (a ?? 0.5)) / elements.length, `${prefixe} : ${etape}`),
          );
          if (proteger && motDePasse) r = await chiffrer(r, motDePasse, () => {});
          faits.push(r);
        } catch (err) {
          if ((err as Error)?.name === "AbortError") throw err;
          verifierAnnulation(signal);
          rates.push({ nom: e.fichier.name, message: (err as Error)?.message || "La conversion a échoué." });
        }
      }
      setResultats(faits);
      setEchecs(rates);
    });

  const possibles = cible ? elements.filter((e) => e.format && verdict(e.format, cible, capacites).possible).length : 0;

  return (
    <section className="alambic-outil" aria-label="Convertir plusieurs fichiers">
      <div className="alambic-lot-tete">
        <p className="font-display text-xl font-bold">
          {elements.length} fichier{elements.length > 1 ? "s" : ""} à convertir
        </p>
        <button type="button" className="bouton bouton-discret !min-h-10" onClick={onFermer} disabled={travail !== null}>
          Revenir à un seul fichier
        </button>
      </div>
      <ul className="alambic-pieces">
        {elements.map((e) => {
          const Icone = e.format ? ICONES[format(e.format).famille] : ICONES.archive;
          const vv = e.format && cible ? verdict(e.format, cible, capacites) : null;
          return (
            <li key={e.id} className="alambic-piece" data-ecarte={vv && !vv.possible ? true : undefined}>
              <Icone className="size-5 shrink-0 text-or" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{e.fichier.name}</span>
                <span className="text-sm text-encre-douce">
                  {e.format ? nomDuFormat(e.format) : "Format inconnu"}, {tailleLisible(e.fichier.size)}
                  {vv && !vv.possible ? " — laissé de côté" : ""}
                </span>
              </span>
              <button
                type="button"
                className="bouton-icone !size-9"
                aria-label={`Retirer ${e.fichier.name}`}
                disabled={travail !== null}
                onClick={() => {
                  setElements((l) => l.filter((x) => x.id !== e.id));
                  setResultats([]);
                }}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      <ZoneDepot compact multiple titre="Ajouter d'autres fichiers" onFichiers={(f) => void ajouter(f)} desactive={travail !== null} />

      <div className="alambic-lot-cible">
        <SelecteurFormat role="destination" valeur={cible} verdicts={verdicts} onChoisir={(id) => { setCible(id); setResultats([]); }} vide="Choisis un format" desactive={travail !== null || !elements.length} />
      </div>
      {v && (
        <p className="alambic-verdict" data-fidelite={v.possible ? v.fidelite : "impossible"}>
          <span className="alambic-verdict-etiquette">{!v.possible ? "Impossible" : v.fidelite === "fidele" ? "Tous les fichiers" : "Une partie des fichiers"}</span>
          {v.possible ? v.note : v.raison}
        </p>
      )}

      {v?.possible && (
        <div className="alambic-options">
          {(cible === "jpg" || cible === "webp") && (
            <label className="alambic-option">
              <span>Qualité</span>
              <input type="range" min={0.4} max={1} step={0.05} value={qualite} onChange={(e) => setQualite(Number(e.target.value))} aria-valuetext={`${Math.round(qualite * 100)} %`} />
              <span className="w-12 text-right tabular-nums">{Math.round(qualite * 100)} %</span>
            </label>
          )}
          {cible === "csv" && (
            <div className="alambic-option" role="radiogroup" aria-label="Séparateur">
              <span>Séparateur</span>
              <div className="alambic-segments">
                <button type="button" role="radio" aria-checked={separateur === ";"} onClick={() => setSeparateur(";")}>
                  Point-virgule (Excel français)
                </button>
                <button type="button" role="radio" aria-checked={separateur === ","} onClick={() => setSeparateur(",")}>
                  Virgule (international)
                </button>
              </div>
            </div>
          )}
          <ChampProtection actif={proteger} onActif={setProteger} motDePasse={motDePasse} onMotDePasse={setMotDePasse} formatPdf={proteger ? cible === "pdf" : null} />
        </div>
      )}

      <div className="alambic-actions">
        {travail ? (
          <Progression travail={travail} onAnnuler={annuler} />
        ) : (
          <button type="button" className="bouton bouton-principal alambic-lancer" disabled={!v?.possible || (proteger && !motDePasse)} onClick={() => void convertirTout()}>
            <Sparkles className="size-5" aria-hidden="true" />
            {cible ? `Convertir ${possibles > 1 ? `les ${possibles} fichiers` : "le fichier"} en ${format(cible).nom}` : "Convertir"}
          </button>
        )}
      </div>

      <MessageErreur erreur={erreur} />
      {echecs.length > 0 && (
        <div className="message alambic-erreur" role="status">
          <p>
            <strong>Laissé{echecs.length > 1 ? "s" : ""} de côté :</strong>
          </p>
          <ul className="grid gap-1 text-sm">
            {echecs.map((x, i) => (
              <li key={`${x.nom}-${i}`}>
                <strong>{x.nom}</strong> — {x.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      {resultats.length > 0 && <ListeResultats resultats={resultats} nomZip={`Fichiers convertis en ${cible ? format(cible).nom : ""}.zip`} />}
      {familleCible === "archive" && resultats.length > 0 && <p className="text-sm text-encre-douce">Chaque fichier a été rangé dans sa propre archive ; « Tout télécharger » les réunit.</p>}
    </section>
  );
}

/** Le format d'arrivée le plus utile pour tout le lot : celui que le plus de fichiers acceptent, en suivant les préférences. */
function choisirCible(elements: { format: string | null }[], capacites: Capacites, voulue: string | null | undefined): string | null {
  const formats = elements.map((e) => e.format).filter((f): f is string => Boolean(f));
  if (!formats.length) return null;
  const compte = (c: string) => formats.filter((f) => verdict(f, c, capacites).possible).length;
  if (voulue && compte(voulue) > 0) return voulue;
  const frequences = new Map<string, number>();
  for (const f of formats) frequences.set(f, (frequences.get(f) ?? 0) + 1);
  const principal = [...frequences.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const prefere = destinationParDefaut(principal, TOUS, capacites);
  const meilleurs = TOUS.map((c) => [c, compte(c)] as const).sort((a, b) => b[1] - a[1]);
  if (prefere && compte(prefere) === meilleurs[0][1]) return prefere;
  return meilleurs[0][1] > 0 ? meilleurs[0][0] : prefere;
}
