"use client";

import { Camera, FileUp, LoaderCircle, Scissors, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FORMATS, format, tailleLisible } from "@/lib/alambic/formats";
import { verdict, type Capacites } from "@/lib/alambic/graphe";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { CarteResultat } from "./CarteResultat";
import { BonASavoir, MessageErreur } from "./commun";
import { ChampProtection } from "./ChampProtection";
import { useReception, type Abonner } from "./reception";

type DocPdf = Awaited<ReturnType<typeof import("@/lib/alambic/navigateur/pdf").ouvrir>>;
type Mode = "un" | "chaque" | "images" | "groupes";

function enPlages(pages: number[]): string {
  const triees = [...pages].sort((a, b) => a - b);
  const morceaux: string[] = [];
  for (let i = 0; i < triees.length; i++) {
    let j = i;
    while (j + 1 < triees.length && triees[j + 1] === triees[j] + 1) j++;
    morceaux.push(j > i ? `${triees[i]}-${triees[j]}` : String(triees[i]));
    i = j;
  }
  return morceaux.join(", ");
}

function horloge(s: number): string {
  if (!Number.isFinite(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const ss = sec.toFixed(1).padStart(4, "0").replace(".", ",");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

function Vignette({ doc, numero, choisie, onBasculer }: { doc: DocPdf["doc"]; numero: number; choisie: boolean; onBasculer: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // Rendu seulement quand la vignette approche de l'écran : un PDF de 500 pages reste fluide.
    const el = ref.current;
    if (!el) return;
    let fait = false;
    let lien: string | null = null;
    const obs = new IntersectionObserver(
      async (entrees) => {
        if (fait || !entrees.some((e) => e.isIntersecting)) return;
        fait = true;
        obs.disconnect();
        const { vignettePage } = await import("@/lib/alambic/navigateur/pdf");
        try {
          lien = await vignettePage(doc, numero, 140);
          setUrl(lien);
        } catch {}
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (lien) URL.revokeObjectURL(lien);
    };
  }, [doc, numero]);
  return (
    <button ref={ref} type="button" className="alambic-page" aria-pressed={choisie} onClick={onBasculer} aria-label={`Page ${numero}${choisie ? ", gardée" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- image locale (blob:), rien à optimiser */}
      <span className="alambic-page-image">{url ? <img src={url} alt="" /> : <LoaderCircle className="size-5 animate-spin text-encre-douce" aria-hidden="true" />}</span>
      <span className="alambic-page-numero">{numero}</span>
    </button>
  );
}

export function Decoupe({ capacites, abonner }: { capacites: Capacites; abonner: Abonner }) {
  const [fichier, setFichier] = useState<File | null>(null);
  const [fmt, setFmt] = useState<string | null>(null);
  const [pdf, setPdf] = useState<DocPdf | null>(null);
  const [choisies, setChoisies] = useState<number[]>([]);
  const [plages, setPlages] = useState("");
  const [mode, setMode] = useState<Mode>("un");
  const [taillePaquet, setTaillePaquet] = useState(2);
  const [media, setMedia] = useState<{ url: string; duree: number } | null>(null);
  const [debut, setDebut] = useState(0);
  const [fin, setFin] = useState(0);
  const [cibleMedia, setCibleMedia] = useState<string | null>(null);
  const [proteger, setProteger] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [travail, setTravail] = useState<{ avancement: number | null; etape: string } | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  // Vrai seulement quand le résultat affiché a réellement été chiffré (une image capturée ne l'est pas).
  const [chiffre, setChiffre] = useState(false);
  const [erreur, setErreur] = useState<unknown>(null);
  const [fichierFautif, setFichierFautif] = useState<File | null>(null);
  const choix = useRef<HTMLInputElement>(null);
  const lecteur = useRef<HTMLVideoElement & HTMLAudioElement>(null);

  const total = pdf?.doc.numPages ?? 0;
  const estMedia = fmt ? ["audio", "video"].includes(format(fmt).famille) : false;

  const vider = () => {
    void pdf?.fermer();
    if (media) URL.revokeObjectURL(media.url);
    setPdf(null);
    setMedia(null);
    setFichier(null);
    setFmt(null);
    setResultat(null);
    setErreur(null);
  };

  // Deux fichiers déposés coup sur coup : seul le dernier compte.
  const dernierChargement = useRef(0);
  const charger = async (f: File) => {
    const n = ++dernierChargement.current;
    vider();
    const { reconnaitre } = await import("@/lib/alambic/navigateur/moteur");
    const id = await reconnaitre(f);
    if (n !== dernierChargement.current) return;
    if (!id || !(id === "pdf" || ["audio", "video"].includes(format(id).famille)) || id === "avi") {
      setErreur(id === "avi" ? "L'AVI ne se lit pas dans un navigateur : il ne peut pas être découpé ici." : "La découpe porte sur un PDF (pages) ou sur un son ou une vidéo (extrait).");
      return;
    }
    setFichier(f);
    setFmt(id);
    if (id === "pdf") {
      try {
        const { ouvrir } = await import("@/lib/alambic/navigateur/pdf");
        const o = await ouvrir(new Uint8Array(await f.arrayBuffer()));
        if (n !== dernierChargement.current) {
          void o.fermer();
          return;
        }
        setPdf(o);
        setChoisies([]);
        setPlages("");
      } catch (e) {
        setFichierFautif(f);
        setErreur(e);
      }
    } else {
      const url = URL.createObjectURL(f);
      setMedia({ url, duree: 0 });
      setCibleMedia(id);
    }
  };

  useReception(abonner, (fichiers) => void charger(fichiers[0]));

  /** Durée du son ou de la vidéo, même quand le fichier ne l'annonce pas d'emblée. */
  const lireDuree = (el: HTMLMediaElement) => {
    const retenir = (d: number) => {
      setMedia((m) => (m ? { ...m, duree: d } : m));
      setDebut(0);
      setFin(d);
    };
    if (Number.isFinite(el.duration)) {
      retenir(el.duration);
      return;
    }
    // Un WebM enregistré par un téléphone n'annonce sa durée qu'une fois lu jusqu'au bout : on y saute.
    const surChangement = () => {
      if (!Number.isFinite(el.duration)) return;
      el.removeEventListener("durationchange", surChangement);
      el.currentTime = 0;
      retenir(el.duration);
    };
    el.addEventListener("durationchange", surChangement);
    el.currentTime = Number.MAX_SAFE_INTEGER;
  };

  // En quittant l'outil, le PDF ouvert et le lien du média sont libérés.
  const aLiberer = useRef<{ pdf: typeof pdf; media: typeof media }>({ pdf: null, media: null });
  useEffect(() => {
    aLiberer.current = { pdf, media };
  }, [pdf, media]);
  useEffect(
    () => () => {
      void aLiberer.current.pdf?.fermer();
      if (aLiberer.current.media) URL.revokeObjectURL(aLiberer.current.media.url);
    },
    [],
  );

  const basculer = (n: number) => {
    setResultat(null);
    setChoisies((c) => {
      const s = c.includes(n) ? c.filter((x) => x !== n) : [...c, n].sort((a, b) => a - b);
      setPlages(enPlages(s));
      return s;
    });
  };

  const destinationsMedia = useMemo(() => (fmt && estMedia ? FORMATS.filter((f) => (f.id === fmt || verdict(fmt, f.id, capacites).possible) && ["audio", "video"].includes(f.famille) || (f.id === "gif" && format(fmt).famille === "video")).map((f) => f.id) : []), [fmt, estMedia, capacites]);

  const decouper = async () => {
    if (!fichier || !fmt) return;
    setErreur(null);
    setResultat(null);
    // Le bouton se désactive dès le clic, avant même que le module soit chargé : pas de double lancement.
    setTravail({ avancement: null, etape: "Préparation" });
    try {
      let r: Resultat;
      const base = fichier.name.replace(/\.[^.]+$/, "");
      if (fmt === "pdf" && mode === "groupes") {
        // Toutes les N pages : les pages choisies (ou toutes) sont réparties en PDF de N pages.
        const { extraireParties } = await import("@/lib/alambic/navigateur/pdf");
        const { ecrireArchive } = await import("@/lib/alambic/navigateur/archives");
        const octets = new Uint8Array(await fichier.arrayBuffer());
        const liste = choisies.length ? choisies : Array.from({ length: total }, (_, i) => i + 1);
        const n = Math.max(1, taillePaquet);
        const paquets: number[][] = [];
        for (let i = 0; i < liste.length; i += n) paquets.push(liste.slice(i, i + n));
        const sorties = await extraireParties(octets, paquets, (i) => setTravail({ avancement: i / paquets.length, etape: `Partie ${i + 1} sur ${paquets.length}` }));
        const fichiers = sorties.map((sortie, i) => ({ nom: `${base} - partie ${String(i + 1).padStart(String(paquets.length).length, "0")} (pages ${enPlages(paquets[i])}).pdf`, blob: new Blob([sortie.slice().buffer], { type: "application/pdf" }) }));
        if (fichiers.length === 1) r = { nom: fichiers[0].nom, blob: fichiers[0].blob, format: "pdf", avertissements: [] };
        else {
          setTravail({ avancement: 0.95, etape: "Rangement dans un ZIP" });
          r = { nom: `${base} - ${fichiers.length} parties.zip`, blob: await ecrireArchive(fichiers, "zip", () => {}), format: "zip", avertissements: [`${fichiers.length} PDF de ${n} page${n > 1 ? "s" : ""} (le dernier peut en avoir moins), réunis dans un ZIP.`] };
        }
      } else if (fmt === "pdf") {
        if (!choisies.length) throw new Error("Choisis au moins une page.");
        const { extraire, extraireParties, pageEnImage } = await import("@/lib/alambic/navigateur/pdf");
        const { ecrireArchive } = await import("@/lib/alambic/navigateur/archives");
        const octets = new Uint8Array(await fichier.arrayBuffer());
        if (mode === "un") {
          setTravail({ avancement: null, etape: `Extraction de ${choisies.length} page${choisies.length > 1 ? "s" : ""}` });
          const sortie = await extraire(octets, choisies);
          r = { nom: `${base} (pages ${enPlages(choisies)}).pdf`.replace(/[\\/:*?"<>|]/g, "-"), blob: new Blob([sortie.slice().buffer], { type: "application/pdf" }), format: "pdf", avertissements: [] };
        } else {
          const fichiers: { nom: string; blob: Blob }[] = [];
          if (mode === "chaque") {
            const sorties = await extraireParties(
              octets,
              choisies.map((p) => [p]),
              (i) => setTravail({ avancement: i / choisies.length, etape: `Page ${choisies[i]}` }),
            );
            sorties.forEach((sortie, i) => fichiers.push({ nom: `${base} - page ${choisies[i]}.pdf`, blob: new Blob([sortie.slice().buffer], { type: "application/pdf" }) }));
          } else {
            for (let i = 0; i < choisies.length; i++) {
              const p = choisies[i];
              setTravail({ avancement: i / choisies.length, etape: `Page ${p}` });
              fichiers.push({ nom: `${base} - page ${p}.png`, blob: await pageEnImage(pdf!.doc, p, "png") });
            }
          }
          if (fichiers.length === 1) r = { nom: fichiers[0].nom, blob: fichiers[0].blob, format: mode === "chaque" ? "pdf" : "png", avertissements: [] };
          else {
            setTravail({ avancement: 0.95, etape: "Rangement dans un ZIP" });
            r = { nom: `${base} - ${fichiers.length} pages.zip`, blob: await ecrireArchive(fichiers, "zip", () => {}), format: "zip", avertissements: [`${fichiers.length} fichiers, réunis dans un ZIP.`] };
          }
        }
      } else {
        if (fin - debut < 0.1) throw new Error("L'extrait est trop court : place la fin après le début.");
        const { convertir } = await import("@/lib/alambic/navigateur/moteur");
        const cible = cibleMedia ?? fmt;
        const meme = cible === fmt;
        // Même format : on passe par une conversion vers lui-même, avec l'extrait.
        if (meme) {
          const { convertirMedia } = await import("@/lib/alambic/navigateur/medias");
          setTravail({ avancement: 0, etape: "Découpe" });
          const sortie = await convertirMedia(fichier, cible, { qualite: null, extrait: { debut, fin } }, (a) => setTravail({ avancement: a, etape: "Découpe" }));
          r = { nom: `${base} (extrait).${format(cible).extensions[0]}`, blob: sortie.blob, format: cible, avertissements: sortie.avertissements };
        } else {
          r = await convertir({ nom: fichier.name, blob: fichier, format: fmt }, cible, { qualite: 0.8, separateur: ";", extrait: { debut, fin } }, capacites, (a, etape) => setTravail({ avancement: a, etape }));
          r = { ...r, nom: r.nom.replace(/(\.[^.]+)$/, " (extrait)$1") };
        }
      }
      if (proteger && motDePasse) {
        const { proteger: chiffrer } = await import("@/lib/alambic/navigateur/moteur");
        r = await chiffrer(r, motDePasse, (a, etape) => setTravail({ avancement: a, etape }));
      }
      setChiffre(Boolean(proteger && motDePasse));
      setResultat(r);
    } catch (e) {
      setFichierFautif(fichier);
      setErreur(e);
    } finally {
      setTravail(null);
    }
  };

  const sortiePdf = fmt === "pdf" ? mode !== "images" && (mode === "un" || (mode === "chaque" && choisies.length === 1)) : cibleMedia === "pdf";

  return (
    <section className="alambic-outil" aria-labelledby="titre-decoupe">
      <header className="alambic-outil-tete">
        <Scissors className="size-7 text-or" strokeWidth={1.4} aria-hidden="true" />
        <div>
          <h2 id="titre-decoupe" className="font-display text-2xl font-bold">
            Découper et extraire
          </h2>
          <p className="text-encre-douce">Garde les pages voulues d&apos;un PDF, ou un passage précis d&apos;un son ou d&apos;une vidéo.</p>
        </div>
      </header>

      <input
        ref={choix}
        type="file"
        accept=".pdf,audio/*,video/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void charger(f);
          e.target.value = "";
        }}
      />

      {fichier ? (
        <div className="alambic-fichier">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{fichier.name}</span>
            <span className="text-sm text-encre-douce">
              {tailleLisible(fichier.size)}
              {total ? `, ${total} page${total > 1 ? "s" : ""}` : ""}
              {media?.duree ? `, ${horloge(media.duree)}` : ""}
            </span>
          </span>
          <button type="button" className="bouton-icone" aria-label="Retirer le fichier" onClick={vider}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="alambic-depot"
          onClick={() => choix.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) void charger(f);
          }}
        >
          <FileUp className="size-8 text-or" strokeWidth={1.4} aria-hidden="true" />
          <span className="font-display text-xl font-bold">Dépose un PDF, un son ou une vidéo</span>
          <span className="text-encre-douce">ou clique pour le choisir.</span>
        </button>
      )}

      {pdf && (
        <>
          <div className="alambic-plages">
            <label className="alambic-option flex-1">
              <span>Pages</span>
              <input
                className="champ"
                value={plages}
                placeholder="par exemple 1-3, 7, 10-fin"
                onChange={async (e) => {
                  setPlages(e.target.value);
                  setResultat(null);
                  const { lirePlages } = await import("@/lib/alambic/navigateur/pdf");
                  setChoisies(lirePlages(e.target.value, total).sort((a, b) => a - b));
                }}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => { const t = Array.from({ length: total }, (_, i) => i + 1); setChoisies(t); setPlages(enPlages(t)); }}>
                Toutes
              </button>
              <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => { const t = Array.from({ length: total }, (_, i) => i + 1).filter((n) => !choisies.includes(n)); setChoisies(t); setPlages(enPlages(t)); }}>
                Inverser
              </button>
              <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => { setChoisies([]); setPlages(""); }}>
                Aucune
              </button>
            </div>
          </div>
          <p className="text-sm text-encre-douce">{choisies.length ? `${choisies.length} page${choisies.length > 1 ? "s" : ""} gardée${choisies.length > 1 ? "s" : ""} sur ${total}. Pour retirer des pages, choisis-les puis « Inverser ».` : "Clique sur les pages à garder, ou écris-les ci-dessus."}</p>
          <div className="alambic-pages">
            {Array.from({ length: total }, (_, i) => (
              <Vignette key={i} doc={pdf.doc} numero={i + 1} choisie={choisies.includes(i + 1)} onBasculer={() => basculer(i + 1)} />
            ))}
          </div>
          <div className="alambic-option" role="radiogroup" aria-label="Ce qu'on obtient">
            <span>Résultat</span>
            <div className="alambic-segments">
              <button type="button" role="radio" aria-checked={mode === "un"} onClick={() => setMode("un")}>
                Un seul PDF
              </button>
              <button type="button" role="radio" aria-checked={mode === "chaque"} onClick={() => setMode("chaque")}>
                Un PDF par page
              </button>
              <button type="button" role="radio" aria-checked={mode === "images"} onClick={() => setMode("images")}>
                Une image par page
              </button>
              <button type="button" role="radio" aria-checked={mode === "groupes"} onClick={() => setMode("groupes")}>
                Toutes les N pages
              </button>
            </div>
          </div>
          {mode === "groupes" && (
            <label className="alambic-option">
              <span>Pages par PDF</span>
              <input className="champ !w-28" type="number" min={1} max={Math.max(1, total)} value={taillePaquet} onChange={(e) => setTaillePaquet(Math.max(1, Math.min(Math.max(1, total), Number(e.target.value) || 1)))} />
              <span className="w-full text-sm text-encre-douce">
                {choisies.length ? `Les ${choisies.length} pages choisies` : `Les ${total} pages`} donnent {Math.ceil((choisies.length || total) / Math.max(1, taillePaquet))} PDF. Utile pour un document trop lourd à envoyer d&apos;un coup.
              </span>
            </label>
          )}
        </>
      )}

      {media && fmt && (
        <>
          {format(fmt).famille === "video" ? (
            <video ref={lecteur} src={media.url} controls className="alambic-lecteur" onLoadedMetadata={(e) => lireDuree(e.currentTarget)} />
          ) : (
            <audio ref={lecteur} src={media.url} controls className="w-full" onLoadedMetadata={(e) => lireDuree(e.currentTarget)} />
          )}
          {media.duree > 0 && (
            <div className="alambic-extrait">
              <div className="alambic-frise" style={{ ["--debut" as string]: `${(debut / media.duree) * 100}%`, ["--fin" as string]: `${(fin / media.duree) * 100}%` }}>
                <input type="range" min={0} max={media.duree} step={0.1} value={debut} aria-label="Début de l'extrait" aria-valuetext={horloge(debut)} onChange={(e) => { setDebut(Math.min(Number(e.target.value), fin - 0.1)); setResultat(null); }} />
                <input type="range" min={0} max={media.duree} step={0.1} value={fin} aria-label="Fin de l'extrait" aria-valuetext={horloge(fin)} onChange={(e) => { setFin(Math.max(Number(e.target.value), debut + 0.1)); setResultat(null); }} />
              </div>
              {format(fmt).famille === "video" && (
                <button
                  type="button"
                  className="bouton bouton-discret !min-h-10 justify-self-start"
                  onClick={async () => {
                    const v = lecteur.current as HTMLVideoElement | null;
                    if (!v || !v.videoWidth) return;
                    const c = document.createElement("canvas");
                    c.width = v.videoWidth;
                    c.height = v.videoHeight;
                    c.getContext("2d")!.drawImage(v, 0, 0);
                    const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/png"));
                    if (!blob) return;
                    const base = fichier?.name.replace(/\.[^.]+$/, "") ?? "video";
                    setChiffre(false);
                    setResultat({ nom: `${base} - image à ${horloge(v.currentTime).replace(/[:,]/g, "-")}.png`, blob, format: "png", avertissements: [`L'image de l'instant ${horloge(v.currentTime)}, en ${v.videoWidth} × ${v.videoHeight}.`] });
                  }}
                >
                  <Camera className="size-4" aria-hidden="true" />
                  Enregistrer l&apos;image de cet instant
                </button>
              )}
              <div className="alambic-bornes">
                <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => lecteur.current && setDebut(Math.min(lecteur.current.currentTime, fin - 0.1))}>
                  Début ici
                </button>
                <span className="tabular-nums">
                  {horloge(debut)} → {horloge(fin)} <span className="text-encre-douce">({horloge(fin - debut)})</span>
                </span>
                <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => lecteur.current && setFin(Math.max(lecteur.current.currentTime, debut + 0.1))}>
                  Fin ici
                </button>
              </div>
            </div>
          )}
          <label className="alambic-option">
            <span>Format de l&apos;extrait</span>
            <select className="champ" value={cibleMedia ?? fmt} onChange={(e) => { setCibleMedia(e.target.value); setResultat(null); }}>
              {destinationsMedia.map((id) => (
                <option key={id} value={id}>
                  {format(id).nom}
                  {id === fmt ? " (même format)" : ""}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {fichier && (pdf || media) && (
        <>
          <ChampProtection actif={proteger} onActif={setProteger} motDePasse={motDePasse} onMotDePasse={setMotDePasse} formatPdf={proteger ? sortiePdf : null} />
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
              <button type="button" className="bouton bouton-principal alambic-lancer" disabled={(pdf ? !choisies.length && mode !== "groupes" : !media?.duree) || (proteger && !motDePasse)} onClick={() => void decouper()}>
                <Scissors className="size-5" aria-hidden="true" />
                {pdf
                  ? mode === "groupes"
                    ? `Découper en ${Math.ceil((choisies.length || total) / Math.max(1, taillePaquet))} PDF`
                    : choisies.length
                      ? `Extraire ${choisies.length} page${choisies.length > 1 ? "s" : ""}`
                      : "Choisis des pages"
                  : "Extraire ce passage"}
              </button>
            )}
          </div>
        </>
      )}

      <MessageErreur erreur={erreur} fichier={fichierFautif} />
      {resultat && <CarteResultat resultat={resultat} tailleAvant={resultat.format === fmt ? fichier?.size : undefined} protege={chiffre} />}

      <BonASavoir
        points={[
          "Écris les pages à garder comme « 1-3, 7, 10-fin », ou touche-les ; « Inverser » permet de retirer des pages plutôt que de les garder.",
          "« Toutes les N pages » coupe un long PDF en morceaux de même taille, à envoyer un par un.",
          "Pour une vidéo : place le début et la fin avec les curseurs, ou « Début ici » / « Fin ici » pendant la lecture ; une image fixe s'enregistre à l'instant voulu.",
        ]}
      />
    </section>
  );
}
