"use client";

import { FileUp, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useRef, useState } from "react";
import { tailleLisible } from "@/lib/alambic/formats";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { CarteResultat } from "./CarteResultat";
import { ChampProtection } from "./ChampProtection";
import { useReception, type Abonner } from "./reception";

export function Protection({ abonner }: { abonner: Abonner }) {
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [motDePasse, setMotDePasse] = useState("");
  const [travail, setTravail] = useState<{ avancement: number | null; etape: string } | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [erreur, setErreur] = useState("");
  const choix = useRef<HTMLInputElement>(null);

  useReception(abonner, (entrants) => {
    setFichiers((f) => [...f, ...entrants]);
    setResultat(null);
  });

  const seulPdf = fichiers.length === 1 && /\.pdf$/i.test(fichiers[0].name);

  const proteger = async () => {
    setErreur("");
    setResultat(null);
    try {
      const { protegerEnZip, protegerPdf } = await import("@/lib/alambic/navigateur/securite");
      if (seulPdf) {
        setTravail({ avancement: null, etape: "Chiffrement AES-256 du PDF" });
        const blob = await protegerPdf(fichiers[0], motDePasse);
        setResultat({ nom: fichiers[0].name.replace(/\.pdf$/i, " (protégé).pdf"), blob, format: "pdf", avertissements: [] });
      } else {
        setTravail({ avancement: 0, etape: "Chiffrement AES-256" });
        const blob = await protegerEnZip(fichiers.map((f) => ({ nom: f.name, blob: f })), motDePasse, (a) => setTravail({ avancement: a, etape: "Chiffrement AES-256" }));
        const nom = fichiers.length === 1 ? `${fichiers[0].name} (protégé).zip` : `Fichiers protégés (${fichiers.length}).zip`;
        setResultat({ nom, blob, format: "zip", avertissements: ["Le ZIP chiffré en AES-256 s'ouvre avec 7-Zip, WinRAR, Keka ou The Unarchiver ; l'explorateur de Windows, lui, ne sait pas ouvrir ce type de ZIP."] });
      }
    } catch (e) {
      setErreur((e as Error).message);
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
          setFichiers((f) => [...f, ...(e.target.files ?? [])]);
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
          setFichiers((f) => [...f, ...e.dataTransfer.files]);
          setResultat(null);
        }}
      >
        <FileUp className={fichiers.length ? "size-6 text-or" : "size-8 text-or"} strokeWidth={1.4} aria-hidden="true" />
        <span className={fichiers.length ? "font-semibold" : "font-display text-xl font-bold"}>{fichiers.length ? "Ajouter d'autres fichiers" : "Dépose les fichiers à protéger"}</span>
        {!fichiers.length && <span className="text-encre-douce">N&apos;importe quel type, un ou plusieurs.</span>}
      </button>

      {fichiers.length > 0 && (
        <>
          <ChampProtection actif onActif={() => {}} toujours motDePasse={motDePasse} onMotDePasse={setMotDePasse} formatPdf={seulPdf} />
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
              <button type="button" className="bouton bouton-principal alambic-lancer" disabled={!motDePasse} onClick={() => void proteger()}>
                <ShieldCheck className="size-5" aria-hidden="true" />
                {seulPdf ? "Protéger le PDF" : fichiers.length > 1 ? `Protéger les ${fichiers.length} fichiers` : "Protéger le fichier"}
              </button>
            )}
          </div>
        </>
      )}
      {erreur && (
        <p className="message message-erreur" role="alert">
          {erreur}
        </p>
      )}
      {resultat && <CarteResultat resultat={resultat} protege />}
    </section>
  );
}
