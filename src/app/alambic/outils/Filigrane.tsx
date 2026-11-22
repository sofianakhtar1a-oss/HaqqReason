"use client";

import { ChevronLeft, ChevronRight, Stamp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MOTS_FILIGRANE, texteIdentite, type Disposition, type FormatNumero, type PositionNumero, type ReglagesFiligrane, type ReglagesNumeros } from "@/lib/alambic/filigrane";
import { tailleLisible } from "@/lib/alambic/formats";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { CarteResultat } from "../CarteResultat";
import { useAlambic } from "../contexte";
import { BonASavoir, EnTeteOutil, ListeResultats, MessageErreur, Progression, reconnaitreTous, useTravail, verifierAnnulation, ZoneDepot } from "../commun";
import { useReception, type Abonner } from "../reception";
import type { DocPdf } from "./VignettePdf";

const IMAGES = new Set(["jpg", "png", "webp", "bmp", "tiff", "gif", "heic", "avif"]);
const COULEURS = [
  { v: "#6b7280", n: "Gris" },
  { v: "#c0392b", n: "Rouge" },
  { v: "#1f4e9e", n: "Bleu" },
  { v: "#111827", n: "Noir" },
];
const DISPOSITIONS: { v: Disposition; n: string }[] = [
  { v: "mosaique", n: "Mosaïque" },
  { v: "centre", n: "Au centre" },
  { v: "bas", n: "En bas" },
];
const FORMATS_NUMERO: { v: FormatNumero; n: string }[] = [
  { v: "n", n: "1" },
  { v: "n/t", n: "1 / 12" },
  { v: "page-n", n: "Page 1" },
  { v: "page-n-sur-t", n: "Page 1 sur 12" },
  { v: "tiret", n: "– 1 –" },
];
const POSITIONS: { v: PositionNumero; n: string }[] = [
  { v: "bas-centre", n: "En bas, au centre" },
  { v: "bas-droite", n: "En bas, à droite" },
  { v: "haut-centre", n: "En haut, au centre" },
  { v: "haut-droite", n: "En haut, à droite" },
];

type Fichier = { fichier: File; format: string };
type Apercu = { largeur: number; hauteur: number; fond: HTMLCanvasElement | ImageBitmap; echelle: number };

export function Filigrane({ abonner }: { abonner: Abonner }) {
  const { intention } = useAlambic();
  const [fichiers, setFichiers] = useState<Fichier[]>([]);
  const [refuses, setRefuses] = useState<string[]>([]);
  const [avecFiligrane, setAvecFiligrane] = useState(true);
  const [prereglage, setPrereglage] = useState<"identite" | "libre">("libre");
  const [destinataire, setDestinataire] = useState("");
  const [motif, setMotif] = useState("");
  const [texteLibre, setTexteLibre] = useState("CONFIDENTIEL");
  const [disposition, setDisposition] = useState<Disposition>("mosaique");
  const [couleur, setCouleur] = useState(COULEURS[0].v);
  const [opacite, setOpacite] = useState(0.3);
  const [taille, setTaille] = useState(1);
  const [avecNumeros, setAvecNumeros] = useState(false);
  const [numeros, setNumeros] = useState<ReglagesNumeros>({ format: "n/t", position: "bas-centre", debut: 1, sansPremiere: false });
  const [inseparable, setInseparable] = useState(false);
  const [pdf, setPdf] = useState<{ doc: DocPdf; fermer: () => Promise<void> } | null>(null);
  const [pageApercu, setPageApercu] = useState(1);
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const toile = useRef<HTMLCanvasElement>(null);
  const { travail, erreur, setErreur, lancer, annuler } = useTravail();

  // « Que veux-tu faire ? » : pièce d'identité (mosaïque, inséparable) ou numéros seuls.
  const [intentionVue, setIntentionVue] = useState<typeof intention>(null);
  if (intention !== intentionVue) {
    setIntentionVue(intention);
    if (intention?.reglage === "identite") {
      setPrereglage("identite");
      setAvecFiligrane(true);
      setDisposition("mosaique");
      setInseparable(true);
    } else if (intention?.reglage === "numeros") {
      setAvecFiligrane(false);
      setAvecNumeros(true);
    }
  }

  const texte = prereglage === "identite" ? texteIdentite(destinataire, motif, new Date()) : texteLibre;
  const reglages: ReglagesFiligrane | null = avecFiligrane && texte.trim() ? { texte, disposition, couleur, opacite, taille } : null;
  const estPdf = fichiers.length === 1 && fichiers[0].format === "pdf";
  const options = { filigrane: reglages, numeros: estPdf && avecNumeros ? numeros : null };
  // Une clé stable : l'aperçu ne se redessine que si un réglage change vraiment.
  const cleOptions = JSON.stringify(options);

  const charger = async (entrants: File[]) => {
    setResultats([]);
    setErreur(null);
    const reconnus = await reconnaitreTous(entrants);
    const pdfs = reconnus.filter((x) => x.format === "pdf");
    const images = reconnus.filter((x) => x.format && IMAGES.has(x.format));
    setRefuses(reconnus.filter((x) => !x.format || (x.format !== "pdf" && !IMAGES.has(x.format))).map((x) => x.fichier.name));
    setPdf(null);
    setApercu(null);
    setPageApercu(1);
    if (pdfs.length) {
      // Un PDF à la fois ; des images, autant qu'on veut.
      const choisi = { fichier: pdfs[0].fichier, format: "pdf" };
      setFichiers([choisi]);
      try {
        const { ouvrir } = await import("@/lib/alambic/navigateur/pdf");
        setPdf(await ouvrir(new Uint8Array(await choisi.fichier.arrayBuffer())));
      } catch (e) {
        setErreur(e);
      }
    } else setFichiers(images.map((x) => ({ fichier: x.fichier, format: x.format! })));
  };

  useReception(abonner, (f) => void charger(f));

  useEffect(() => () => void pdf?.fermer(), [pdf]);

  // Le fond de l'aperçu (la page ou l'image), dessiné une fois ; le filigrane se redessine par-dessus à chaque réglage.
  useEffect(() => {
    let vivant = true;
    (async () => {
      const premier = fichiers[0];
      if (!premier) return;
      const largeurMax = 640;
      if (premier.format === "pdf") {
        if (!pdf) return;
        const n = Math.min(pageApercu, pdf.doc.numPages);
        const page = await pdf.doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const echelle = Math.min(2, largeurMax / base.width) * (window.devicePixelRatio > 1 ? 1.5 : 1);
        const vue = page.getViewport({ scale: echelle });
        const c = document.createElement("canvas");
        c.width = Math.ceil(vue.width);
        c.height = Math.ceil(vue.height);
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
        await page.render({ canvasContext: ctx, viewport: vue, canvas: c }).promise;
        page.cleanup();
        if (vivant) setApercu({ largeur: base.width, hauteur: base.height, fond: c, echelle });
      } else {
        const { decoder } = await import("@/lib/alambic/navigateur/images");
        const p = await decoder(premier.fichier, premier.format);
        const echelle = Math.min(1, (largeurMax * 1.5) / p.largeur);
        const c = document.createElement("canvas");
        c.width = Math.round(p.largeur * echelle);
        c.height = Math.round(p.hauteur * echelle);
        const plein = document.createElement("canvas");
        plein.width = p.largeur;
        plein.height = p.hauteur;
        plein.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(p.donnees), p.largeur, p.hauteur), 0, 0);
        c.getContext("2d")!.drawImage(plein, 0, 0, c.width, c.height);
        if (vivant) setApercu({ largeur: p.largeur, hauteur: p.hauteur, fond: c, echelle });
      }
    })().catch((e) => vivant && setErreur(e));
    return () => {
      vivant = false;
    };
  }, [fichiers, pdf, pageApercu, setErreur]);

  useEffect(() => {
    const c = toile.current;
    if (!c || !apercu) return;
    c.width = Math.round(apercu.largeur * apercu.echelle);
    c.height = Math.round(apercu.hauteur * apercu.echelle);
    const ctx = c.getContext("2d")!;
    ctx.drawImage(apercu.fond, 0, 0, c.width, c.height);
    const o = JSON.parse(cleOptions) as { filigrane: ReglagesFiligrane | null; numeros: ReglagesNumeros | null };
    void import("@/lib/alambic/navigateur/filigraner").then(({ dessiner }) => dessiner(ctx, apercu.largeur, apercu.hauteur, pageApercu - 1, pdf?.doc.numPages ?? 1, o, apercu.echelle));
  }, [apercu, cleOptions, pageApercu, pdf]);

  const appliquer = () =>
    lancer(async (avancer, signal) => {
      setResultats([]);
      const { marquerPdf, marquerImage } = await import("@/lib/alambic/navigateur/filigraner");
      // Sans filigrane (numéros seuls), rien ne justifie d'aplatir les pages en images.
      const o = { ...options, inseparable: estPdf && inseparable && Boolean(options.filigrane), signal };
      if (estPdf) {
        setResultats([await marquerPdf(fichiers[0].fichier, fichiers[0].fichier.name, o, avancer)]);
        return;
      }
      const faits: Resultat[] = [];
      for (let i = 0; i < fichiers.length; i++) {
        verifierAnnulation(signal);
        avancer(i / fichiers.length, `Image ${i + 1} sur ${fichiers.length}`);
        faits.push(await marquerImage(fichiers[i].fichier, fichiers[i].format, fichiers[i].fichier.name, o));
      }
      setResultats(faits);
    });

  const vider = () => {
    setPdf(null);
    setFichiers([]);
    setApercu(null);
    setResultats([]);
    setErreur(null);
  };

  const pret = Boolean(options.filigrane || options.numeros);
  const total = pdf?.doc.numPages ?? 0;

  return (
    <section className="alambic-outil" aria-labelledby="titre-filigraner">
      <EnTeteOutil Icone={Stamp} titre="Filigraner et numéroter" id="titre-filigraner">
        Avant d&apos;envoyer une pièce d&apos;identité ou un justificatif, marque-le du nom de son destinataire : une copie volée ne peut plus servir ailleurs. Numérote aussi les pages d&apos;un PDF.
      </EnTeteOutil>

      {fichiers.length ? (
        <div className="alambic-fichier">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{fichiers.map((f) => f.fichier.name).join(", ")}</span>
            <span className="text-sm text-encre-douce">
              {estPdf ? `PDF, ${total || "…"} page${total > 1 ? "s" : ""}, ${tailleLisible(fichiers[0].fichier.size)}` : `${fichiers.length} image${fichiers.length > 1 ? "s" : ""}`}
            </span>
          </span>
          <button type="button" className="bouton-icone" aria-label="Retirer" onClick={vider} disabled={travail !== null}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <ZoneDepot titre="Dépose un PDF ou des images" aide="Carte d'identité, passeport, avis d'imposition, justificatif de domicile… Rien n'est envoyé." multiple accept=".pdf,image/*" onFichiers={(f) => void charger(f)} />
      )}
      {refuses.length > 0 && <p className="message">Ni PDF, ni image : {refuses.join(", ")}.</p>}

      {fichiers.length > 0 && (
        <div className="alambic-marquage">
          <div className="alambic-marquage-reglages">
            <label className="alambic-interrupteur">
              <input type="checkbox" checked={avecFiligrane} onChange={(e) => setAvecFiligrane(e.target.checked)} />
              <span className="alambic-interrupteur-piste" aria-hidden="true" />
              <span className="font-semibold">Ajouter un filigrane</span>
            </label>
            {avecFiligrane && (
              <div className="alambic-marquage-bloc">
                <div className="alambic-segments" role="radiogroup" aria-label="Texte du filigrane">
                  <button type="button" role="radio" aria-checked={prereglage === "identite"} onClick={() => { setPrereglage("identite"); setInseparable(true); }}>
                    Pièce d&apos;identité
                  </button>
                  <button type="button" role="radio" aria-checked={prereglage === "libre"} onClick={() => setPrereglage("libre")}>
                    Texte libre
                  </button>
                </div>
                {prereglage === "identite" ? (
                  <>
                    <label className="alambic-champ">
                      <span>Destinataire</span>
                      <input className="champ" value={destinataire} onChange={(e) => setDestinataire(e.target.value)} placeholder="l'agence immobilière Dupont" maxLength={80} />
                    </label>
                    <label className="alambic-champ">
                      <span>Motif</span>
                      <input className="champ" value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="dossier de location" maxLength={80} />
                    </label>
                    <p className="text-sm text-encre-douce">« {texte} »</p>
                  </>
                ) : (
                  <>
                    <label className="alambic-champ">
                      <span>Texte</span>
                      <input className="champ" value={texteLibre} onChange={(e) => setTexteLibre(e.target.value)} maxLength={120} />
                    </label>
                    <div className="alambic-pastilles">
                      {MOTS_FILIGRANE.map((m) => (
                        <button key={m} type="button" aria-pressed={texteLibre === m} onClick={() => setTexteLibre(m)}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <div className="alambic-option" role="radiogroup" aria-label="Disposition">
                  <span>Disposition</span>
                  <div className="alambic-segments">
                    {DISPOSITIONS.map((d) => (
                      <button key={d.v} type="button" role="radio" aria-checked={disposition === d.v} onClick={() => setDisposition(d.v)}>
                        {d.n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="alambic-option" role="radiogroup" aria-label="Couleur">
                  <span>Couleur</span>
                  <div className="alambic-couleurs">
                    {COULEURS.map((c) => (
                      <button key={c.v} type="button" role="radio" aria-checked={couleur === c.v} aria-label={c.n} title={c.n} style={{ ["--teinte" as string]: c.v }} onClick={() => setCouleur(c.v)} />
                    ))}
                  </div>
                </div>
                <label className="alambic-option">
                  <span>Opacité</span>
                  <input type="range" min={0.1} max={0.7} step={0.05} value={opacite} onChange={(e) => setOpacite(Number(e.target.value))} aria-valuetext={`${Math.round(opacite * 100)} %`} />
                  <span className="w-12 text-right tabular-nums">{Math.round(opacite * 100)} %</span>
                </label>
                <label className="alambic-option">
                  <span>Taille</span>
                  <input type="range" min={0.6} max={1.6} step={0.1} value={taille} onChange={(e) => setTaille(Number(e.target.value))} aria-valuetext={`${Math.round(taille * 100)} %`} />
                  <span className="w-12 text-right tabular-nums">{Math.round(taille * 100)} %</span>
                </label>
              </div>
            )}

            {estPdf && (
              <>
                <label className="alambic-interrupteur">
                  <input type="checkbox" checked={avecNumeros} onChange={(e) => setAvecNumeros(e.target.checked)} />
                  <span className="alambic-interrupteur-piste" aria-hidden="true" />
                  <span className="font-semibold">Numéroter les pages</span>
                </label>
                {avecNumeros && (
                  <div className="alambic-marquage-bloc">
                    <label className="alambic-option">
                      <span>Format</span>
                      <select className="champ" value={numeros.format} onChange={(e) => setNumeros({ ...numeros, format: e.target.value as FormatNumero })}>
                        {FORMATS_NUMERO.map((f) => (
                          <option key={f.v} value={f.v}>
                            {f.n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="alambic-option">
                      <span>Place</span>
                      <select className="champ" value={numeros.position} onChange={(e) => setNumeros({ ...numeros, position: e.target.value as PositionNumero })}>
                        {POSITIONS.map((p) => (
                          <option key={p.v} value={p.v}>
                            {p.n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="alambic-option">
                      <span>Premier numéro</span>
                      <input className="champ !w-28" type="number" min={0} max={9999} value={numeros.debut} onChange={(e) => setNumeros({ ...numeros, debut: Math.max(0, Math.min(9999, Number(e.target.value) || 0)) })} />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={numeros.sansPremiere} onChange={(e) => setNumeros({ ...numeros, sansPremiere: e.target.checked })} />
                      Pas de numéro sur la première page (couverture)
                    </label>
                  </div>
                )}
                {avecFiligrane && (
                  <label className="alambic-interrupteur">
                    <input type="checkbox" checked={inseparable} onChange={(e) => setInseparable(e.target.checked)} />
                    <span className="alambic-interrupteur-piste" aria-hidden="true" />
                    <span>
                      <span className="font-semibold">Filigrane inséparable</span>
                      <span className="block text-sm text-encre-douce">Chaque page devient une image : le filigrane ne peut plus être effacé (le texte ne se sélectionne plus). Conseillé pour une pièce d&apos;identité.</span>
                    </span>
                  </label>
                )}
              </>
            )}
          </div>

          <figure className="alambic-marquage-apercu">
            {apercu ? <canvas ref={toile} className="alambic-marquage-toile" aria-label="Aperçu du filigrane" role="img" /> : <div className="alambic-marquage-toile alambic-marquage-attente">Préparation de l&apos;aperçu…</div>}
            {estPdf && total > 1 && (
              <figcaption className="alambic-apercu-pages">
                <button type="button" className="bouton-icone" onClick={() => setPageApercu((p) => Math.max(1, p - 1))} disabled={pageApercu <= 1} aria-label="Page précédente">
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <span className="tabular-nums">
                  Page {pageApercu} sur {total}
                </span>
                <button type="button" className="bouton-icone" onClick={() => setPageApercu((p) => Math.min(total, p + 1))} disabled={pageApercu >= total} aria-label="Page suivante">
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              </figcaption>
            )}
          </figure>
        </div>
      )}

      {fichiers.length > 0 && (
        <div className="alambic-actions">
          {travail ? (
            <Progression travail={travail} onAnnuler={annuler} />
          ) : (
            <button type="button" className="bouton bouton-principal alambic-lancer" onClick={() => void appliquer()} disabled={!pret || (prereglage === "identite" && avecFiligrane && !destinataire.trim())}>
              <Stamp className="size-5" aria-hidden="true" />
              {prereglage === "identite" && avecFiligrane && !destinataire.trim() ? "Indique le destinataire" : fichiers.length > 1 ? `Marquer les ${fichiers.length} images` : "Appliquer"}
            </button>
          )}
        </div>
      )}

      <MessageErreur erreur={erreur} fichier={fichiers[0]?.fichier} />
      {resultats.length === 1 && <CarteResultat resultat={resultats[0]} protege={false} />}
      {resultats.length > 1 && <ListeResultats resultats={resultats} nomZip="Images filigranées.zip" />}

      <BonASavoir
        points={[
          "Le service public recommande de filigraner toute pièce d'identité envoyée à un tiers, avec son nom, le motif et la date.",
          "Une mosaïque couvre toute la pièce : impossible de recadrer pour l'enlever.",
          "Pour une image, le filigrane fait toujours partie de l'image ; pour un PDF, choisis « inséparable » pour qu'il ne puisse pas être retiré.",
          "Rien n'est envoyé : le marquage se fait sur ton appareil.",
        ]}
      />
    </section>
  );
}
