"use client";

import { Feather, FileUp, LoaderCircle, RotateCcw, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { FORMATS, format, tailleLisible } from "@/lib/alambic/formats";
import { destinationParDefaut, verdict, type Capacites, type Verdict } from "@/lib/alambic/graphe";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { useAccesComplet } from "@/lib/client/acces";
import { BoutonInverser } from "./BoutonInverser";
import { CarteResultat } from "./CarteResultat";
import { ChampProtection } from "./ChampProtection";
import { BonASavoir, MessageErreur, reconnaitreTous } from "./commun";
import { useAlambic } from "./contexte";
import { utiliser } from "@/lib/client/premium";
import { MarquePremium } from "@/components/premium/MarquePremium";
import { ConversionLot } from "./ConversionLot";
import { useReception, type Abonner } from "./reception";
import { ICONES, SelecteurFormat } from "./SelecteurFormat";

const TOUS = FORMATS.map((f) => f.id);
const QUALITES_MEDIA: { v: number | null; l: string }[] = [
  { v: null, l: "Automatique" },
  { v: 0.3, l: "Légère" },
  { v: 0.6, l: "Bonne" },
  { v: 0.95, l: "Maximale" },
];

type Etat = { phase: "repos" | "lecture" | "travail" | "fini" | "erreur"; avancement: number | null; etape: string; message?: string; cause?: unknown };

export function Convertisseur({ capacites, abonner }: { capacites: Capacites; abonner: Abonner }) {
  const [fichier, setFichier] = useState<File | null>(null);
  const [detecte, setDetecte] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [cible, setCible] = useState<string | null>(null);
  const [tours, setTours] = useState(0);
  const [qualite, setQualite] = useState(0.8);
  const [qualiteMedia, setQualiteMedia] = useState<number | null>(null);
  const [separateur, setSeparateur] = useState<";" | ",">(";");
  const [resolution, setResolution] = useState(144);
  const [coteMax, setCoteMax] = useState(0);
  const [proteger, setProteger] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [etat, setEtat] = useState<Etat>({ phase: "repos", avancement: null, etape: "" });
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [glisse, setGlisse] = useState(false);
  const [invite, setInvite] = useState<string | null>(null);
  const choix = useRef<HTMLInputElement>(null);
  const annulation = useRef<AbortController | null>(null);
  const accesComplet = useAccesComplet();
  const router = useRouter();
  const { intention } = useAlambic();
  // Plusieurs fichiers d'un coup : ils passent en conversion par lot.
  const [lot, setLot] = useState<{ fichier: File; format: string | null }[] | null>(null);

  const verdicts = useMemo<Record<string, Verdict>>(() => (source ? Object.fromEntries(TOUS.map((c) => [c, verdict(source, c, capacites)])) : {}), [source, capacites]);
  const v = source && cible ? verdicts[cible] : null;
  const enCours = etat.phase === "lecture" || etat.phase === "travail";

  // Deux fichiers déposés coup sur coup : seul le dernier compte.
  const dernierChargement = useRef(0);
  const charger = useCallback(
    async (f: File) => {
      const n = ++dernierChargement.current;
      setResultat(null);
      setInvite(null);
      setEtat({ phase: "lecture", avancement: null, etape: "Reconnaissance du format" });
      setFichier(f);
      const { reconnaitre } = await import("@/lib/alambic/navigateur/moteur");
      const id = await reconnaitre(f);
      if (n !== dernierChargement.current) return;
      setDetecte(id);
      setSource(id);
      const voulue = intention?.cible;
      setCible((actuelle) => (id && voulue && verdict(id, voulue, capacites).possible ? voulue : id && actuelle && verdict(id, actuelle, capacites).possible ? actuelle : id ? destinationParDefaut(id, TOUS, capacites) : null));
      setEtat({ phase: "repos", avancement: null, etape: "" });
    },
    [capacites, intention],
  );

  const recevoir = async (fichiers: File[]) => {
    // Pendant une conversion, un fichier collé ou déposé attendrait la fin : on ne mélange pas deux fichiers.
    if (etat.phase === "travail") return;
    if (fichiers.length > 1) setLot(await reconnaitreTous(fichiers));
    else if (fichiers[0]) void charger(fichiers[0]);
  };

  // Capture ou fichier collé sur la page (Ctrl+V), ou fichiers passés par un autre outil.
  useReception(abonner, (fichiers) => void recevoir(fichiers));

  const changerSource = (id: string) => {
    setSource(id);
    setResultat(null);
    if (!cible || !verdict(id, cible, capacites).possible) setCible(destinationParDefaut(id, TOUS, capacites));
  };

  const inverser = () => {
    setTours((t) => t + 1);
    setEtat({ phase: "repos", avancement: null, etape: "" });
    if (resultat && source) {
      // Le fichier converti devient le point de départ : l'aller-retour se fait d'un clic.
      const ancien = source;
      const nouveau = new File([resultat.blob], resultat.nom, { type: resultat.blob.type });
      setFichier(nouveau);
      setDetecte(resultat.format);
      setSource(resultat.format);
      setCible(verdict(resultat.format, ancien, capacites).possible ? ancien : destinationParDefaut(resultat.format, TOUS, capacites));
      setResultat(null);
      setInvite(null);
      return;
    }
    if (!source || !cible) return;
    const [s, c] = [cible, source];
    setSource(s);
    setCible(verdict(s, c, capacites).possible ? c : destinationParDefaut(s, TOUS, capacites));
    if (fichier && detecte !== s) {
      setFichier(null);
      setDetecte(null);
      setInvite(`Sens inversé : choisis maintenant un fichier ${format(s).nom} à convertir en ${format(c).nom}.`);
    }
  };

  const convertir = async () => {
    if (!fichier || !source || !cible) return;
    if (!(await utiliser("alambic.convertir"))) return;
    const controleur = new AbortController();
    annulation.current = controleur;
    setResultat(null);
    setEtat({ phase: "travail", avancement: null, etape: "Préparation" });
    const avancer = (a: number | null, etape: string) => setEtat({ phase: "travail", avancement: a === null ? null : Math.max(0, Math.min(1, a)), etape });
    try {
      const { convertir: lancer, proteger: chiffrer } = await import("@/lib/alambic/navigateur/moteur");
      let r = await lancer({ nom: fichier.name, blob: fichier, format: source }, cible, { qualite, qualiteMedia, separateur, signal: controleur.signal, resolution, coteMax: coteMax || undefined }, capacites, avancer);
      if (proteger && motDePasse) r = await chiffrer(r, motDePasse, avancer);
      setResultat(r);
      setEtat({ phase: "fini", avancement: 1, etape: "" });
    } catch (e) {
      if ((e as Error).name === "AbortError") setEtat({ phase: "repos", avancement: null, etape: "" });
      else setEtat({ phase: "erreur", avancement: null, etape: "", message: (e as Error).message || "La conversion a échoué.", cause: e });
    } finally {
      annulation.current = null;
    }
  };

  const ouvrirDansCalame = async () => {
    if (!fichier || !source) return;
    setEtat({ phase: "travail", avancement: null, etape: "Ouverture dans Le Calame" });
    try {
      const [{ lireDocument }, depot, modele, schema] = await Promise.all([import("@/lib/alambic/navigateur/documents"), import("@/lib/atelier/depot"), import("@/lib/atelier/modele"), import("@/lib/document-schema")]);
      const lu = await lireDocument(fichier.name, source, fichier, () => {});
      const doc = modele.documentVide(depot.nouvelIdentifiant(), lu.titre.slice(0, 200) || "Document importé");
      doc.contenu = lu.doc;
      const texte = schema.texteDuDocument(lu.doc);
      doc.mots = schema.compterMots(texte);
      doc.signes = texte.length;
      await depot.ecrireDocument(doc);
      try {
        window.localStorage.setItem((await import("@/lib/client/compte")).tiroir("calame-dernier-document"), doc.id);
      } catch {}
      router.push("/ecrire");
    } catch (e) {
      setEtat({ phase: "erreur", avancement: null, etape: "", message: (e as Error).message });
    }
  };

  const familleCible = cible ? format(cible).famille : null;
  const avecQualiteImage = cible === "jpg" || cible === "webp";
  const avecQualiteMedia = v?.possible && v.moteur === "media" && cible !== "wav" && cible !== "flac";
  const pretPdf = proteger ? (cible === "pdf" ? true : false) : null;
  const IconeFichier = source ? ICONES[format(source).famille] : FileUp;
  const documentSource = source ? ["docx", "odt", "rtf", "txt", "md", "html", "epub", "pdf"].includes(source) : false;

  if (lot) return <ConversionLot fichiers={lot} capacites={capacites} cibleVoulue={intention?.cible} onFermer={() => setLot(null)} />;

  return (
    <section
      className="alambic-convertir"
      aria-label="Convertir un fichier"
      data-glisse={glisse || undefined}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setGlisse(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setGlisse(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setGlisse(false);
        void recevoir([...e.dataTransfer.files]);
      }}
    >
      <input
        ref={choix}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void recevoir([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      {fichier ? (
        <div className="alambic-fichier">
          <IconeFichier className="size-5 shrink-0 text-or" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold" title={fichier.name}>
              {fichier.name}
            </span>
            <span className="text-sm text-encre-douce">{tailleLisible(fichier.size)}, lu sur place, sans envoi</span>
          </span>
          <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => choix.current?.click()} disabled={enCours}>
            Changer
          </button>
          <button
            type="button"
            className="bouton-icone"
            aria-label="Retirer le fichier"
            disabled={enCours}
            onClick={() => {
              setFichier(null);
              setDetecte(null);
              setResultat(null);
              setEtat({ phase: "repos", avancement: null, etape: "" });
            }}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button type="button" className="alambic-depot" onClick={() => choix.current?.click()}>
          <FileUp className="size-8 text-or" strokeWidth={1.4} aria-hidden="true" />
          <span className="font-display text-xl font-bold">{invite ?? "Dépose un fichier ici"}</span>
          <span className="text-encre-douce">ou clique pour le choisir ; plusieurs à la fois se convertissent ensemble. Une capture copiée se colle aussi (Ctrl+V). Tout est lu sur ton appareil : rien n&apos;est envoyé, quelle que soit la taille.</span>
        </button>
      )}

      <div className="alambic-alambic">
        <SelecteurFormat role="source" valeur={source} detecte={detecte} onChoisir={changerSource} vide="Le format s'affiche ici" desactive={enCours} />
        <BoutonInverser tours={tours} avancement={etat.avancement} enCours={etat.phase === "travail"} desactive={!(source && cible) && !resultat} onInverser={inverser} />
        <SelecteurFormat role="destination" valeur={cible} verdicts={verdicts} onChoisir={(id) => { setCible(id); setResultat(null); }} vide={source ? "Choisis un format" : "Choisis d'abord un fichier"} desactive={!source || enCours} />
      </div>

      {v && (
        <p className="alambic-verdict" data-fidelite={v.possible ? v.fidelite : "impossible"}>
          <span className="alambic-verdict-etiquette">{!v.possible ? "Impossible" : v.fidelite === "fidele" ? "Conversion fidèle" : "Conversion partielle"}</span>
          {v.possible ? v.note : v.raison}
        </p>
      )}

      {v?.possible && (
        <div className="alambic-options">
          {avecQualiteImage && (
            <label className="alambic-option">
              <span>Qualité</span>
              <input type="range" min={0.4} max={1} step={0.05} value={qualite} onChange={(e) => setQualite(Number(e.target.value))} aria-valuetext={`${Math.round(qualite * 100)} %`} />
              <span className="w-12 text-right tabular-nums">{Math.round(qualite * 100)} %</span>
            </label>
          )}
          {avecQualiteMedia && (
            <div className="alambic-option" role="radiogroup" aria-label="Qualité">
              <span>Qualité</span>
              <div className="alambic-segments">
                {QUALITES_MEDIA.map((q) => (
                  <button key={String(q.v)} type="button" role="radio" aria-checked={qualiteMedia === q.v} onClick={() => setQualiteMedia(q.v)}>
                    {q.l}
                  </button>
                ))}
              </div>
              <span className="w-full text-sm text-encre-douce">
                {qualiteMedia === null
                  ? "Ce que le format d'arrivée accepte est recopié tel quel, sans perte et très vite ; le reste est réencodé en bonne qualité."
                  : "Tout est réencodé avec ce réglage : plus léger, ou plus fidèle, selon ton choix."}
              </span>
            </div>
          )}
          {v.moteur === "pdf-images" && (
            <div className="alambic-option" role="radiogroup" aria-label="Netteté des images">
              <span>Netteté</span>
              <div className="alambic-segments">
                {[
                  [96, "Écran"],
                  [144, "Standard"],
                  [300, "Impression"],
                ].map(([ppp, nom]) => (
                  <button key={ppp} type="button" role="radio" aria-checked={resolution === ppp} onClick={() => setResolution(Number(ppp))}>
                    {nom}
                  </button>
                ))}
              </div>
              <span className="w-full text-sm text-encre-douce">{resolution} points par pouce : {resolution >= 300 ? "net pour imprimer, mais lourd." : resolution <= 96 ? "léger, pour un écran ou un message." : "net à l'écran, raisonnable en poids."}</span>
            </div>
          )}
          {v.moteur === "image" && (
            <div className="alambic-option" role="radiogroup" aria-label="Taille de l'image">
              <span>Taille</span>
              <div className="alambic-segments">
                {[
                  [0, "D'origine"],
                  [3840, "3 840 px"],
                  [1920, "1 920 px"],
                  [1280, "1 280 px"],
                  [640, "640 px"],
                ].map(([cote, nom]) => (
                  <button key={cote} type="button" role="radio" aria-checked={coteMax === cote} onClick={() => setCoteMax(Number(cote))}>
                    {nom}
                  </button>
                ))}
              </div>
              {coteMax > 0 && <span className="w-full text-sm text-encre-douce">Le plus grand côté ne dépassera pas {coteMax.toLocaleString("fr-FR")} pixels ; une image plus petite reste telle quelle.</span>}
            </div>
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
          <ChampProtection actif={proteger} onActif={setProteger} motDePasse={motDePasse} onMotDePasse={setMotDePasse} formatPdf={pretPdf} />
        </div>
      )}

      <div className="alambic-actions">
        {etat.phase === "travail" ? (
          <>
            <div className="alambic-progression" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={etat.avancement === null ? undefined : Math.round(etat.avancement * 100)} aria-label={etat.etape}>
              <span style={etat.avancement === null ? undefined : { width: `${etat.avancement * 100}%` }} data-indetermine={etat.avancement === null || undefined} />
            </div>
            <p className="alambic-etape">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              {etat.etape}
            </p>
            <button type="button" className="bouton bouton-discret" onClick={() => annulation.current?.abort()}>
              Annuler
            </button>
          </>
        ) : (
          <button type="button" className="bouton bouton-principal alambic-lancer" disabled={!fichier || !v?.possible || enCours || (proteger && !motDePasse)} onClick={() => void convertir()}>
            <Sparkles className="size-5" aria-hidden="true" />
            {cible && fichier ? `Convertir en ${format(cible).nom}` : "Convertir"}
            <MarquePremium fonction="alambic.convertir" />
          </button>
        )}
        {documentSource && fichier && accesComplet && etat.phase !== "travail" && (
          <button type="button" className="bouton bouton-discret" onClick={() => void ouvrirDansCalame()} title="Le texte s'ouvre comme un nouveau document du Calame, pour le relire, le corriger ou l'imprimer en PDF.">
            <Feather className="size-4" aria-hidden="true" />
            Ouvrir dans Le Calame
          </button>
        )}
      </div>

      {etat.phase === "erreur" && <MessageErreur erreur={etat.cause instanceof Error ? etat.cause : new Error(etat.message)} fichier={fichier} />}

      {resultat && (
        <CarteResultat resultat={resultat} tailleAvant={source && format(source).famille === format(resultat.format).famille ? fichier?.size : undefined} protege={proteger && Boolean(motDePasse)}>
          {familleCible && source && !(proteger && motDePasse) && resultat.format !== "zip" && verdict(resultat.format, source, capacites).possible && (
            <button type="button" className="alambic-retour" onClick={inverser}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Repartir de ce {format(resultat.format).nom} pour le reconvertir en {format(source).nom}
            </button>
          )}
        </CarteResultat>
      )}
      <BonASavoir
        points={[
          "Le format d'arrivée le plus utile est proposé d'office ; les formats grisés disent pourquoi en un toucher.",
          "Dépose plusieurs fichiers à la fois pour les convertir ensemble, puis tout télécharger en un ZIP.",
          "Le sceau entre les deux formats inverse le sens : après une conversion, il repart du fichier obtenu.",
          "Une photo de document peut devenir un Word ou un texte : son texte est lu sur ton appareil.",
        ]}
      />
    </section>
  );
}
