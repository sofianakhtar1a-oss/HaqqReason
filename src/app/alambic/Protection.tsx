"use client";

import { FileUp, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useRef, useState } from "react";
import { tailleLisible } from "@/lib/alambic/formats";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { CarteResultat } from "./CarteResultat";
import { ChampProtection } from "./ChampProtection";
import { BonASavoir, MessageErreur } from "./commun";
import { useReception, type Abonner } from "./reception";

export function Protection({ abonner }: { abonner: Abonner }) {
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [motDePasse, setMotDePasse] = useState("");
  const [travail, setTravail] = useState<{ avancement: number | null; etape: string } | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [erreur, setErreur] = useState<unknown>(null);
  const [autorisations, setAutorisations] = useState({ imprimer: true, copier: true, modifier: true });
  const [sansOuverture, setSansOuverture] = useState(false);
  const choix = useRef<HTMLInputElement>(null);

  useReception(abonner, (entrants) => {
    setFichiers((f) => [...f, ...entrants]);
    setResultat(null);
  });

  const seulPdf = fichiers.length === 1 && /\.pdf$/i.test(fichiers[0].name);
  const restreint = !autorisations.imprimer || !autorisations.copier || !autorisations.modifier;
  // Un PDF peut s'ouvrir sans mot de passe et garder ses restrictions (impression, copie, modification).
  const sansMotDePasse = seulPdf && sansOuverture && restreint;

  const proteger = async () => {
    setErreur(null);
    setResultat(null);
    // Le bouton se désactive dès le clic, avant même que le module soit chargé : pas de double lancement.
    setTravail({ avancement: null, etape: "Préparation" });
    try {
      const { protegerEnZip, protegerPdf } = await import("@/lib/alambic/navigateur/securite");
      if (seulPdf) {
        setTravail({ avancement: null, etape: "Chiffrement AES-256 du PDF" });
        const blob = await protegerPdf(fichiers[0], sansMotDePasse ? "" : motDePasse, autorisations);
        const interdits = [!autorisations.imprimer && "l'impression", !autorisations.copier && "la copie du texte", !autorisations.modifier && "les modifications"].filter(Boolean);
        const avertissements = interdits.length
          ? [`Interdits : ${interdits.join(", ")}. Les lecteurs PDF courants respectent ces restrictions ; seul le mot de passe d'ouverture protège vraiment le contenu.`]
          : [];
        setResultat({ nom: fichiers[0].name.replace(/\.pdf$/i, sansMotDePasse ? " (restreint).pdf" : " (protégé).pdf"), blob, format: "pdf", avertissements });
      } else {
        setTravail({ avancement: 0, etape: "Chiffrement AES-256" });
        const blob = await protegerEnZip(fichiers.map((f) => ({ nom: f.name, blob: f })), motDePasse, (a) => setTravail({ avancement: a, etape: "Chiffrement AES-256" }));
        const nom = fichiers.length === 1 ? `${fichiers[0].name} (protégé).zip` : `Fichiers protégés (${fichiers.length}).zip`;
        setResultat({ nom, blob, format: "zip", avertissements: ["Le ZIP chiffré en AES-256 s'ouvre avec 7-Zip, WinRAR, Keka ou The Unarchiver ; l'explorateur de Windows, lui, ne sait pas ouvrir ce type de ZIP."] });
      }
    } catch (e) {
      setErreur(e);
    } finally {
      setTravail(null);
    }
  };

  return (
    <section className="alambic-outil" aria-labelledby="titre-protection">
      <header className="alambic-outil-tete">
        <ShieldCheck className="size-7 text-or" strokeWidth={1.4} aria-hidden="true" />
        <div>
          <h2 id="titre-protection" className="font-display text-2xl font-bold">
            Protéger par un mot de passe
          </h2>
          <p className="text-encre-douce">Un PDF est chiffré tel quel ; tout autre fichier, ou plusieurs ensemble, sont rangés dans un ZIP chiffré. AES-256 dans les deux cas, sur ton appareil.</p>
        </div>
      </header>

      <input
        ref={choix}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          // Copie immédiate : la liste du champ est vidée juste après.
          const choisis = [...(e.target.files ?? [])];
          setFichiers((f) => [...f, ...choisis]);
          setResultat(null);
          e.target.value = "";
        }}
      />

      {fichiers.length > 0 && (
        <ul className="alambic-pieces">
          {fichiers.map((f, i) => (
            <li key={`${f.name}-${i}`} className="alambic-piece">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{f.name}</span>
                <span className="text-sm text-encre-douce">{tailleLisible(f.size)}</span>
              </span>
              <button type="button" className="bouton-icone !size-9" aria-label={`Retirer ${f.name}`} onClick={() => { setFichiers((x) => x.filter((_, k) => k !== i)); setResultat(null); }}>
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className={`alambic-depot${fichiers.length ? " alambic-depot-compact" : ""}`}
        onClick={() => choix.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          // Les fichiers déposés ne sont lisibles que pendant l'événement : on les copie tout de suite.
          const deposes = [...e.dataTransfer.files];
          setFichiers((f) => [...f, ...deposes]);
          setResultat(null);
        }}
      >
        <FileUp className={fichiers.length ? "size-6 text-or" : "size-8 text-or"} strokeWidth={1.4} aria-hidden="true" />
        <span className={fichiers.length ? "font-semibold" : "font-display text-xl font-bold"}>{fichiers.length ? "Ajouter d'autres fichiers" : "Dépose les fichiers à protéger"}</span>
        {!fichiers.length && <span className="text-encre-douce">N&apos;importe quel type, un ou plusieurs.</span>}
      </button>

      {fichiers.length > 0 && (
        <>
          {!sansMotDePasse && <ChampProtection actif onActif={() => {}} toujours motDePasse={motDePasse} onMotDePasse={setMotDePasse} formatPdf={seulPdf} />}
          {seulPdf && (
            <fieldset className="alambic-autorisations">
              <legend>Ce que la personne pourra faire</legend>
              {(
                [
                  ["imprimer", "Imprimer"],
                  ["copier", "Copier le texte"],
                  ["modifier", "Modifier, annoter, réorganiser"],
                ] as const
              ).map(([cle, nom]) => (
                <label key={cle} className="flex items-center gap-2">
                  <input type="checkbox" checked={autorisations[cle]} onChange={(e) => setAutorisations({ ...autorisations, [cle]: e.target.checked })} />
                  {nom}
                </label>
              ))}
              {restreint && (
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={sansOuverture} onChange={(e) => setSansOuverture(e.target.checked)} />
                  <span>Pas de mot de passe pour l&apos;ouvrir : seulement ces restrictions (par exemple, un document à lire mais à ne pas imprimer).</span>
                </label>
              )}
            </fieldset>
          )}
          <div className="alambic-actions">
            {travail ? (
              <>
                <div className="alambic-progression" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={travail.avancement === null ? undefined : Math.round(travail.avancement * 100)} aria-label={travail.etape}>
                  <span style={travail.avancement === null ? undefined : { width: `${travail.avancement * 100}%` }} data-indetermine={travail.avancement === null || undefined} />
                </div>
                <p className="alambic-etape">
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  {travail.etape}
                </p>
              </>
            ) : (
              <button type="button" className="bouton bouton-principal alambic-lancer" disabled={!motDePasse && !sansMotDePasse} onClick={() => void proteger()}>
                <ShieldCheck className="size-5" aria-hidden="true" />
                {seulPdf ? "Protéger le PDF" : fichiers.length > 1 ? `Protéger les ${fichiers.length} fichiers` : "Protéger le fichier"}
              </button>
            )}
          </div>
        </>
      )}
      <MessageErreur erreur={erreur} fichier={seulPdf ? fichiers[0] : null} />
      {resultat && <CarteResultat resultat={resultat} protege={!resultat.nom.includes("(restreint)")} />}

      <BonASavoir
        points={[
          "Le mot de passe ne quitte pas ton appareil et n'est gardé nulle part : note-le avant de fermer la page. Perdu, le fichier ne s'ouvre plus, pour personne.",
          "Un PDF est chiffré tel quel ; tout autre fichier (ou plusieurs) est rangé dans un ZIP chiffré, à ouvrir avec 7-Zip, WinRAR, Keka ou The Unarchiver.",
          "Pour transmettre le mot de passe, utilise un autre moyen que le fichier : un SMS si le fichier part par e-mail, par exemple.",
          "Les restrictions d'un PDF (impression, copie) sont respectées par les lecteurs courants, mais ne remplacent pas un mot de passe d'ouverture.",
        ]}
      />
    </section>
  );
}
