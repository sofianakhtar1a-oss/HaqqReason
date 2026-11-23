"use client";

/*
 * Les morceaux communs aux outils de L'Alambic : en-tête, zone de dépôt, avancement, erreurs
 * qui proposent une issue (PDF protégé), « Bon à savoir », liste de résultats.
 */
import { Download, FilePlus2, FileUp, Info, KeyRound, LoaderCircle, LockOpen, ScanText, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { MarquePremium } from "@/components/premium/MarquePremium";
import { estMotDePasseFaux, estPdfProtege, estPdfScanne, estZipProtege } from "@/lib/alambic/erreurs";
import { nomDuFormat, tailleLisible } from "@/lib/alambic/formats";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { telecharger } from "./telecharger";
import { useAlambic } from "./contexte";

export function EnTeteOutil({ Icone, titre, id, children }: { Icone: LucideIcon; titre: string; id: string; children: ReactNode }) {
  return (
    <header className="alambic-outil-tete">
      <Icone className="size-7 text-or" strokeWidth={1.4} aria-hidden="true" />
      <div>
        <h2 id={id} className="font-display text-2xl font-bold">
          {titre} <MarquePremium fonction={`alambic.${id.replace(/^titre-/, "")}`} />
        </h2>
        <p className="text-encre-douce">{children}</p>
      </div>
    </header>
  );
}

/** Zone où déposer (ou choisir) des fichiers. */
export function ZoneDepot({
  titre,
  aide,
  multiple = false,
  accept,
  compact = false,
  desactive = false,
  onFichiers,
}: {
  titre: string;
  aide?: string;
  multiple?: boolean;
  accept?: string;
  compact?: boolean;
  desactive?: boolean;
  onFichiers: (fichiers: File[]) => void;
}) {
  const choix = useRef<HTMLInputElement>(null);
  const [glisse, setGlisse] = useState(false);
  const Icone = compact ? FilePlus2 : FileUp;
  return (
    <>
      <input
        ref={choix}
        type="file"
        multiple={multiple}
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = [...(e.target.files ?? [])];
          if (f.length) onFichiers(multiple ? f : [f[0]]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className={`alambic-depot${compact ? " alambic-depot-compact" : ""}`}
        data-glisse={glisse || undefined}
        disabled={desactive}
        onClick={() => choix.current?.click()}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setGlisse(true);
        }}
        onDragLeave={() => setGlisse(false)}
        onDrop={(e) => {
          e.preventDefault();
          setGlisse(false);
          const f = [...e.dataTransfer.files];
          if (f.length) onFichiers(multiple ? f : [f[0]]);
        }}
      >
        <Icone className={compact ? "size-6 text-or" : "size-8 text-or"} strokeWidth={1.4} aria-hidden="true" />
        <span className={compact ? "font-semibold" : "font-display text-xl font-bold"}>{titre}</span>
        {aide && <span className={compact ? "text-sm text-encre-douce" : "text-encre-douce"}>{aide}</span>}
      </button>
    </>
  );
}

export type Travail = { avancement: number | null; etape: string };
export type Avancer = (avancement: number | null, etape: string) => void;

const borne = (a: number) => Math.max(0, Math.min(1, a));

/** L'état d'un travail en cours : avancement, annulation, erreur. */
export function useTravail() {
  const [travail, setTravail] = useState<Travail | null>(null);
  const [erreur, setErreur] = useState<unknown>(null);
  // Plusieurs travaux peuvent se chevaucher (un fichier déposé pendant un autre) : chacun garde
  // son contrôleur, la barre reste tant qu'il en reste un, et « Annuler » les arrête tous.
  const controleurs = useRef(new Set<AbortController>());

  useEffect(() => {
    const encours = controleurs.current;
    // Quitter l'outil arrête ce qui tourne encore : le résultat n'aurait plus nulle part où s'afficher.
    return () => encours.forEach((c) => c.abort());
  }, []);

  async function lancer<T>(fn: (avancer: Avancer, signal: AbortSignal) => Promise<T>): Promise<T | undefined> {
    const c = new AbortController();
    controleurs.current.add(c);
    setErreur(null);
    setTravail({ avancement: null, etape: "Préparation" });
    try {
      return await fn((a, etape) => {
        if (!c.signal.aborted) setTravail({ avancement: a === null ? null : borne(a), etape });
      }, c.signal);
    } catch (e) {
      if ((e as Error)?.name !== "AbortError" && !c.signal.aborted) setErreur(e);
      return undefined;
    } finally {
      controleurs.current.delete(c);
      if (!controleurs.current.size) setTravail(null);
    }
  }

  return { travail, erreur, setErreur, lancer, annuler: () => controleurs.current.forEach((c) => c.abort()) };
}

const FOCUSABLES = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]';

/**
 * Fenêtre modale au clavier : le focus y entre à l'ouverture (sur `premier`, sinon sur le premier
 * élément atteignable), Tab tourne à l'intérieur sans passer derrière, et il revient à la fermeture là
 * où il était.
 */
export function usePiegeFocus(boite: React.RefObject<HTMLElement | null>, premier?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const avant = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const atteignables = () => [...(boite.current?.querySelectorAll<HTMLElement>(FOCUSABLES) ?? [])].filter((x) => x.tabIndex >= 0 && x.getClientRects().length > 0);
    (premier?.current ?? atteignables()[0])?.focus();
    const tab = (e: KeyboardEvent) => {
      const el = boite.current;
      if (e.key !== "Tab" || !el) return;
      const liste = atteignables();
      if (!liste.length) return;
      const debut = liste[0];
      const fin = liste[liste.length - 1];
      const dedans = el.contains(document.activeElement);
      if (e.shiftKey && (!dedans || document.activeElement === debut)) {
        e.preventDefault();
        fin.focus();
      } else if (!e.shiftKey && (!dedans || document.activeElement === fin)) {
        e.preventDefault();
        debut.focus();
      }
    };
    document.addEventListener("keydown", tab);
    return () => {
      document.removeEventListener("keydown", tab);
      if (avant?.isConnected) avant.focus({ preventScroll: true });
    };
  }, [boite, premier]);
}

/** Lève une interruption propre si l'utilisateur a annulé. */
export function verifierAnnulation(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Annulé", "AbortError");
}

export function Progression({ travail, onAnnuler }: { travail: Travail; onAnnuler?: () => void }) {
  return (
    <>
      <div className="alambic-progression" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={travail.avancement === null ? undefined : Math.round(travail.avancement * 100)} aria-label={travail.etape}>
        <span style={travail.avancement === null ? undefined : { width: `${travail.avancement * 100}%` }} data-indetermine={travail.avancement === null || undefined} />
      </div>
      <p className="alambic-etape">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        {travail.etape}
      </p>
      {onAnnuler && (
        <button type="button" className="bouton bouton-discret" onClick={onAnnuler}>
          Annuler
        </button>
      )}
    </>
  );
}

/**
 * Une erreur, dite simplement, avec une issue quand il y en a une :
 * un PDF ou un ZIP protégé se déverrouille ici même (mot de passe) ou dans l'outil « Déverrouiller ».
 */
export function MessageErreur({ erreur, fichier, onMotDePasse }: { erreur: unknown; fichier?: File | null; onMotDePasse?: (mdp: string) => void | Promise<void> }) {
  const { envoyer, outils } = useAlambic();
  const protege = estPdfProtege(erreur) || estZipProtege(erreur) || estMotDePasseFaux(erreur);
  const message = erreur instanceof Error ? erreur.message : typeof erreur === "string" ? erreur : "Une erreur inattendue s'est produite.";
  if (!erreur) return null;
  return (
    <div className="message message-erreur alambic-erreur" role="alert">
      <p>{message}</p>
      {protege && onMotDePasse && <ChampDeverrouillage onValider={onMotDePasse} />}
      {protege && !onMotDePasse && fichier && outils.some((o) => o.id === "deverrouiller") && (
        <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => envoyer("deverrouiller", [fichier])}>
          <LockOpen className="size-4" aria-hidden="true" />
          Déverrouiller ce fichier
        </button>
      )}
      {estPdfScanne(erreur) && fichier && outils.some((o) => o.id === "reconnaitre") && (
        <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => envoyer("reconnaitre", [fichier])}>
          <ScanText className="size-4" aria-hidden="true" />
          Lire ce scan avec « Reconnaître »
        </button>
      )}
    </div>
  );
}

/** Saisie du mot de passe d'un fichier protégé, pour l'ouvrir sur place. */
export function ChampDeverrouillage({ onValider, libelle = "Déverrouiller" }: { onValider: (mdp: string) => void | Promise<void>; libelle?: string }) {
  const [mdp, setMdp] = useState("");
  const [enCours, setEnCours] = useState(false);
  const id = useId();
  return (
    <form
      className="alambic-deverrouiller"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!mdp || enCours) return;
        setEnCours(true);
        try {
          await onValider(mdp);
        } finally {
          setEnCours(false);
        }
      }}
    >
      <label htmlFor={id} className="sr-only">
        Mot de passe du fichier
      </label>
      <span className="alambic-mdp-champ">
        <KeyRound className="size-4 shrink-0 text-encre-douce" aria-hidden="true" />
        <input id={id} type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder="Mot de passe du fichier" autoComplete="off" spellCheck={false} />
      </span>
      <button type="submit" className="bouton bouton-principal !min-h-10" disabled={!mdp || enCours}>
        {enCours ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <LockOpen className="size-4" aria-hidden="true" />}
        {libelle}
      </button>
    </form>
  );
}

/** « Bon à savoir » : quelques conseils, repliés par défaut. */
export function BonASavoir({ points }: { points: ReactNode[] }) {
  return (
    <details className="alambic-astuces">
      <summary>
        <Info className="size-4" aria-hidden="true" />
        Bon à savoir
      </summary>
      <ul>
        {points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </details>
  );
}

/** Plusieurs résultats d'un coup : chacun se télécharge, ou tous ensemble dans un ZIP. */
export function ListeResultats({ resultats, nomZip, tailles, ranger = true }: { resultats: Resultat[]; nomZip: string; tailles?: (number | undefined)[]; ranger?: boolean }) {
  const { noter } = useAlambic();
  const [zip, setZip] = useState(false);
  useEffect(() => {
    if (ranger) resultats.forEach(noter);
  }, [resultats, noter, ranger]);
  if (!resultats.length) return null;
  const total = resultats.reduce((s, r) => s + r.blob.size, 0);
  return (
    <div className="alambic-resultat alambic-resultats" role="status">
      <ul className="alambic-resultats-liste">
        {resultats.map((r, i) => {
          const avant = tailles?.[i];
          const gain = avant ? Math.round((1 - r.blob.size / avant) * 100) : null;
          return (
            <li key={`${r.nom}-${i}`}>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold" title={r.nom}>
                  {r.nom}
                </span>
                <span className="text-sm text-encre-douce">
                  {nomDuFormat(r.format)}, {tailleLisible(r.blob.size)}
                  {gain !== null && Math.abs(gain) >= 1 && (gain > 0 ? `, ${gain} % plus léger` : `, ${-gain} % plus lourd`)}
                </span>
                {r.avertissements.length > 0 && <span className="block text-sm text-encre-douce">{r.avertissements.join(" ")}</span>}
              </span>
              <button type="button" className="bouton-icone" onClick={() => telecharger(r.blob, r.nom)} aria-label={`Télécharger ${r.nom}`} title="Télécharger">
                <Download className="size-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      {resultats.length > 1 && (
        <div className="alambic-actions">
          <button
            type="button"
            className="bouton bouton-principal"
            disabled={zip}
            onClick={async () => {
              setZip(true);
              try {
                const { ecrireArchive } = await import("@/lib/alambic/navigateur/archives");
                const noms = new Set<string>();
                const fichiers = resultats.map((r) => {
                  let nom = r.nom;
                  for (let k = 2; noms.has(nom); k++) nom = r.nom.replace(/(\.[^.]+)?$/, ` (${k})$1`);
                  noms.add(nom);
                  return { nom, blob: r.blob };
                });
                telecharger(await ecrireArchive(fichiers, "zip", () => {}), nomZip);
              } finally {
                setZip(false);
              }
            }}
          >
            {zip ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
            Tout télécharger (ZIP, {tailleLisible(total)})
          </button>
        </div>
      )}
    </div>
  );
}

/** Reconnaît le format de plusieurs fichiers. */
export async function reconnaitreTous(fichiers: File[]): Promise<{ fichier: File; format: string | null }[]> {
  const { reconnaitre } = await import("@/lib/alambic/navigateur/moteur");
  const sortie = [];
  for (const fichier of fichiers) sortie.push({ fichier, format: await reconnaitre(fichier) });
  return sortie;
}

/** Nom de fichier sans extension (« rapport.final.pdf » → « rapport.final »). */
export const sansExtension = (nom: string) => nom.replace(/\.tar\.gz$/i, "").replace(/\.[^.]+$/, "");

/** Un Resultat à partir d'octets. */
export function resultatDe(nom: string, octets: Uint8Array | Blob, formatId: string, type: string, avertissements: string[] = []): Resultat {
  const blob = octets instanceof Blob ? octets : new Blob([octets.slice().buffer], { type });
  return { nom, blob, format: formatId, avertissements };
}
