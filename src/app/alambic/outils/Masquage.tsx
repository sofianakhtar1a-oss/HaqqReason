"use client";

/*
 * Masquer : noircir (ou blanchir) ce qui ne regarde pas le destinataire d'un document — un numéro,
 * une adresse, un nom, une photo. Les caches se dessinent sur la page, ou se posent tout seuls sur
 * chaque occurrence d'un texte cherché (e-mails, téléphones, IBAN…). Ce qui est caché disparaît
 * vraiment du fichier : les pages concernées sont redessinées en images.
 */
import { Check, EyeOff, ScanText, Search, ShieldAlert, SquareDashed, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { chercher, COUVERT, couverture, decouverts, MOTIFS, motifDeRecherche, type IdMotif, type PageTexte } from "@/lib/alambic/caviardage";
import { tailleLisible } from "@/lib/alambic/formats";
import type { Cadre, Couleur } from "@/lib/alambic/navigateur/masquer";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { borner, type BoiteVisible } from "@/lib/alambic/signature";
import { CarteResultat } from "../CarteResultat";
import { BonASavoir, EnTeteOutil, MessageErreur, Progression, reconnaitreTous, useTravail, verifierAnnulation, ZoneDepot } from "../commun";
import { useReception, type Abonner } from "../reception";
import { VignettePdf, type DocPdf } from "./VignettePdf";

type TaillePage = { l: number; h: number };
type Source =
  | { genre: "pdf"; octets: Uint8Array; pdf: { doc: DocPdf; fermer: () => Promise<void> }; pages: TaillePage[] }
  | { genre: "image"; format: string; url: string; pages: TaillePage[] };
type Recherche = { cle: string; libelle: string; motif: RegExp | IdMotif; ids: string[] };

const IMAGES = new Set(["png", "jpg", "webp", "heic", "avif"]);
let compteur = 0;
const nouvelId = () => `c${Date.now().toString(36)}${(compteur++).toString(36)}`;
const borne = (v: number) => Math.min(1, Math.max(0, v));

/** Un cache posé d'un toucher : une bande de la taille d'une ligne de texte, centrée sur le doigt, à ajuster ensuite. */
function cacheParDefaut(p: { x: number; y: number }, t: TaillePage): BoiteVisible {
  const w = 0.28;
  const h = Math.min(0.2, (0.05 * t.l) / t.h);
  return borner({ x: p.x - w / 2, y: p.y - h / 2, w, h });
}

function CadreVue({ c, numero, choisi, couleur, onChoisir, onChanger, onRetirer }: { c: Cadre; numero: number; choisi: boolean; couleur: Couleur; onChoisir: () => void; onChanger: (b: BoiteVisible) => void; onRetirer: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const glisse = useRef<{ x: number; y: number; l: number; h: number; boite: BoiteVisible; mode: "deplacer" | "taille" } | null>(null);

  const debut = (ev: React.PointerEvent, mode: "deplacer" | "taille") => {
    ev.stopPropagation();
    onChoisir();
    const page = ref.current?.parentElement?.getBoundingClientRect();
    if (!page) return;
    glisse.current = { x: ev.clientX, y: ev.clientY, l: page.width, h: page.height, boite: c.boite, mode };
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
  };
  const bouger = (ev: React.PointerEvent) => {
    const g = glisse.current;
    if (!g) return;
    const dx = (ev.clientX - g.x) / g.l;
    const dy = (ev.clientY - g.y) / g.h;
    if (g.mode === "deplacer") onChanger(borner({ ...g.boite, x: g.boite.x + dx, y: g.boite.y + dy }));
    else onChanger(borner({ ...g.boite, w: Math.min(1 - g.boite.x, g.boite.w + dx), h: Math.min(1 - g.boite.y, g.boite.h + dy) }));
  };
  const fin = () => {
    glisse.current = null;
  };

  return (
    <div
      ref={ref}
      className="alambic-cache"
      data-choisi={choisi || undefined}
      data-couleur={couleur}
      style={{ left: `${c.boite.x * 100}%`, top: `${c.boite.y * 100}%`, width: `${c.boite.w * 100}%`, height: `${c.boite.h * 100}%` }}
      role="button"
      tabIndex={0}
      aria-pressed={choisi}
      aria-label={`Cache ${numero}${c.texte ? ` : « ${c.texte} »` : ""}`}
      onFocus={onChoisir}
      onPointerDown={(ev) => debut(ev, "deplacer")}
      onPointerMove={bouger}
      onPointerUp={fin}
      onPointerCancel={fin}
      onClick={(ev) => ev.stopPropagation()}
    >
      {choisi && (
        <>
          <span className="alambic-signe-barre" onPointerDown={(ev) => ev.stopPropagation()}>
            <button type="button" aria-label="Retirer ce cache" title="Retirer ce cache" onClick={onRetirer}>
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </span>
          <span className="alambic-signe-taille" role="presentation" onPointerDown={(ev) => debut(ev, "taille")} onPointerMove={bouger} onPointerUp={fin} onPointerCancel={fin} />
        </>
      )}
    </div>
  );
}

export function Masquage({ abonner }: { abonner: Abonner }) {
  const [fichier, setFichier] = useState<File | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [verrouille, setVerrouille] = useState<File | null>(null);
  const [cadres, setCadres] = useState<Cadre[]>([]);
  const [choisi, setChoisi] = useState<string | null>(null);
  const [ajout, setAjout] = useState(true);
  const [couleur, setCouleur] = useState<Couleur>("noir");
  const [texte, setTexte] = useState<PageTexte[] | null>(null);
  const [aLire, setALire] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const [recherches, setRecherches] = useState<Recherche[]>([]);
  const [message, setMessage] = useState("");
  // Un succès de recherche se lit déjà dans la liste des caches posés : il n'est alors annoncé qu'aux lecteurs d'écran.
  const [messageDiscret, setMessageDiscret] = useState(false);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [restes, setRestes] = useState<{ page: number; texte: string }[] | null>(null);
  const { travail, erreur, setErreur, lancer, annuler } = useTravail();
  const dessin = useRef<{ page: number; x: number; y: number; id: string; rect: DOMRect } | null>(null);
  const clicIgnore = useRef(false);

  // Le document ouvert et l'image affichée sont libérés quand on en change, et en quittant l'outil.
  useEffect(
    () => () => {
      if (source?.genre === "pdf") void source.pdf.fermer();
      if (source?.genre === "image") URL.revokeObjectURL(source.url);
    },
    [source],
  );

  const toutRemettre = () => {
    setCadres([]);
    setChoisi(null);
    setTexte(null);
    setALire([]);
    setRecherches([]);
    setMessage("");
    setResultat(null);
    setRestes(null);
  };

  const charger = (entrants: File[], mdp?: string) => {
    // Un nouveau fichier arrête ce qui tournait sur l'ancien (lecture, enregistrement).
    annuler();
    return lancer(async (avancer) => {
      const f = entrants[0];
      if (!f) return;
      toutRemettre();
      setVerrouille(null);
      avancer(null, "Ouverture du document");
      const [{ format }] = await reconnaitreTous([f]);
      if (format && IMAGES.has(format)) {
        const { decoder } = await import("@/lib/alambic/navigateur/images");
        // L'image est décodée une fois pour vérifier que le navigateur sait la lire (HEIC hors de Safari…).
        const p = await decoder(f, format);
        setFichier(f);
        setSource({ genre: "image", format, url: URL.createObjectURL(f), pages: [{ l: p.largeur, h: p.hauteur }] });
        return;
      }
      if (format !== "pdf") throw new Error("Masquer porte sur un PDF ou une image (photo, scan, capture d'écran).");
      const { ouvrir, dechiffrer } = await import("@/lib/alambic/navigateur/pdf");
      let o: Uint8Array = new Uint8Array(await f.arrayBuffer());
      try {
        if (mdp !== undefined) o = await dechiffrer(o, mdp);
        const ouvert = await ouvrir(o);
        const pages: TaillePage[] = [];
        try {
          for (let n = 1; n <= ouvert.doc.numPages; n++) {
            const vue = (await ouvert.doc.getPage(n)).getViewport({ scale: 1 });
            pages.push({ l: vue.width, h: vue.height });
          }
        } catch (e) {
          void ouvert.fermer();
          throw e;
        }
        setFichier(f);
        setSource({ genre: "pdf", octets: o, pdf: ouvert, pages });
      } catch (e) {
        if ((e as Error).name === "PdfProtege" || (e as Error).name === "MotDePasseFaux") setVerrouille(f);
        throw e;
      }
    });
  };

  useReception(abonner, (f) => void charger(f));

  const vider = () => {
    setSource(null);
    setFichier(null);
    setVerrouille(null);
    setErreur(null);
    toutRemettre();
  };

  const changerBoite = useCallback((id: string, boite: BoiteVisible) => {
    setCadres((l) => l.map((c) => (c.id === id ? { ...c, boite } : c)));
    setResultat(null);
    setRestes(null);
  }, []);

  const retirer = useCallback((id: string) => {
    setCadres((l) => l.filter((c) => c.id !== id));
    setRecherches((r) => r.map((x) => ({ ...x, ids: x.ids.filter((i) => i !== id) })).filter((x) => x.ids.length));
    setChoisi(null);
    setResultat(null);
    setRestes(null);
  }, []);

  // Clavier, quand un cache a le focus : flèches pour le déplacer, Maj + flèches pour sa taille,
  // Suppr pour le retirer. Ailleurs, les flèches font défiler la page comme d'habitude.
  useEffect(() => {
    if (!choisi) return;
    const touche = (ev: KeyboardEvent) => {
      const cible = ev.target as HTMLElement;
      if (!cible.closest?.(".alambic-cache")) return;
      const c = cadres.find((x) => x.id === choisi);
      if (!c) return;
      const pas = 0.004;
      const d = { ArrowLeft: [-pas, 0], ArrowRight: [pas, 0], ArrowUp: [0, -pas], ArrowDown: [0, pas] }[ev.key];
      if (d) {
        ev.preventDefault();
        changerBoite(c.id, ev.shiftKey ? borner({ ...c.boite, w: c.boite.w + d[0] * 2, h: c.boite.h + d[1] * 2 }) : borner({ ...c.boite, x: c.boite.x + d[0], y: c.boite.y + d[1] }));
      } else if (ev.key === "Delete" || ev.key === "Backspace") {
        ev.preventDefault();
        retirer(c.id);
      } else if (ev.key === "Escape") setChoisi(null);
    };
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, [choisi, cadres, changerBoite, retirer]);

  /* ---------------------------------------------------------------- dessiner un cache */

  const point = (ev: React.PointerEvent | React.MouseEvent, rect: DOMRect) => ({ x: borne((ev.clientX - rect.left) / rect.width), y: borne((ev.clientY - rect.top) / rect.height) });

  const poser = (page: number, boite: BoiteVisible) => {
    const id = nouvelId();
    setCadres((l) => [...l, { id, page, boite }]);
    setChoisi(id);
    setResultat(null);
    setRestes(null);
    return id;
  };

  const surPointeur = (ev: React.PointerEvent<HTMLDivElement>, page: number) => {
    // Au doigt, la page défile : le cache se pose d'un toucher (onClick). À la souris ou au stylet, on le trace.
    if (!ajout || ev.pointerType === "touch" || ev.button !== 0) return;
    if ((ev.target as HTMLElement).closest(".alambic-cache")) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    const p = point(ev, rect);
    const id = poser(page, { x: p.x, y: p.y, w: 0, h: 0 });
    dessin.current = { page, x: p.x, y: p.y, id, rect };
    ev.currentTarget.setPointerCapture(ev.pointerId);
  };
  const surMouvement = (ev: React.PointerEvent<HTMLDivElement>) => {
    const d = dessin.current;
    if (!d) return;
    const p = point(ev, d.rect);
    changerBoite(d.id, { x: Math.min(d.x, p.x), y: Math.min(d.y, p.y), w: Math.abs(p.x - d.x), h: Math.abs(p.y - d.y) });
  };
  const surLacher = (ev: React.PointerEvent<HTMLDivElement>, t: TaillePage) => {
    const d = dessin.current;
    if (!d) return;
    dessin.current = null;
    clicIgnore.current = true;
    const p = point(ev, d.rect);
    const w = Math.abs(p.x - d.x);
    const h = Math.abs(p.y - d.y);
    // Un simple clic, sans tracer : un cache de taille ordinaire, centré sur le clic.
    if (w < 0.01 && h < 0.008) {
      changerBoite(d.id, cacheParDefaut(p, t));
      return;
    }
    // Un trait presque plat (on a glissé le long d'une ligne) prend au moins la hauteur d'une ligne de texte.
    const hMin = Math.min(0.12, (0.03 * t.l) / t.h);
    const wMin = 0.02;
    changerBoite(
      d.id,
      borner({
        x: w < wMin ? (d.x + p.x) / 2 - wMin / 2 : Math.min(d.x, p.x),
        y: h < hMin ? (d.y + p.y) / 2 - hMin / 2 : Math.min(d.y, p.y),
        w: Math.max(w, wMin),
        h: Math.max(h, hMin),
      }),
    );
  };
  /** Un appui interrompu (alerte, geste du système) ne laisse pas de cache vide derrière lui. */
  const surAnnulation = () => {
    const d = dessin.current;
    if (!d) return;
    dessin.current = null;
    setCadres((l) => l.filter((c) => c.id !== d.id || (c.boite.w > 0.002 && c.boite.h > 0.002)));
  };
  const surClic = (ev: React.MouseEvent<HTMLDivElement>, page: number, t: TaillePage) => {
    if (clicIgnore.current) {
      clicIgnore.current = false;
      return;
    }
    if (!ajout) {
      setChoisi(null);
      return;
    }
    poser(page, cacheParDefaut(point(ev, ev.currentTarget.getBoundingClientRect()), t));
  };

  /* ---------------------------------------------------------------- chercher et masquer */

  /** Le texte placé du document : la couche texte d'un PDF ; pour une image ou un scan, il faut d'abord le lire. */
  const preparerTexte = async (): Promise<{ pages: PageTexte[]; vides: number[] } | null> => {
    if (texte) return { pages: texte, vides: aLire };
    if (!source) return null;
    if (source.genre === "image") {
      setALire([0]);
      return null;
    }
    const [{ lireTextePdf }, { charger: chargerPdf }, { pagesAvecGrandeImage }] = await Promise.all([import("@/lib/alambic/navigateur/masquer"), import("@/lib/alambic/navigateur/pdf"), import("@/lib/alambic/extraction")]);
    const pages = await lireTextePdf(source.pdf.doc);
    // À lire : les pages sans texte, et celles où une grande image (un scan) côtoie peu de texte.
    let grandes = new Set<number>();
    try {
      grandes = pagesAvecGrandeImage(await chargerPdf(source.octets));
    } catch {
      // structure illisible : on s'en tient au texte
    }
    const vides = pages.flatMap((p, i) => {
      const lettres = p.morceaux.reduce((s, m) => s + m.t.trim().length, 0);
      return lettres < 10 || (lettres < 400 && grandes.has(i)) ? [i] : [];
    });
    setTexte(pages);
    setALire(vides);
    return { pages, vides };
  };

  const lireImages = () =>
    lancer(async (avancer, signal) => {
      if (!source || !aLire.length) return;
      const { lireTexteImages, dessinerPage } = await import("@/lib/alambic/navigateur/masquer");
      const toile = async (k: number) => {
        if (source.genre === "pdf") return dessinerPage(source.pdf.doc, aLire[k] + 1);
        const { decoder } = await import("@/lib/alambic/navigateur/images");
        const p = await decoder(fichier!, source.format);
        const c = document.createElement("canvas");
        c.width = p.largeur;
        c.height = p.hauteur;
        c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(p.donnees), p.largeur, p.hauteur), 0, 0);
        return c;
      };
      const lues = await lireTexteImages(aLire.length, toile, ["fra", "eng"], avancer, signal);
      verifierAnnulation(signal);
      const base: PageTexte[] = texte ?? source.pages.map((t) => ({ largeur: t.l, hauteur: t.h, morceaux: [] }));
      const completes = base.map((p, i) => {
        const k = aLire.indexOf(i);
        return k >= 0 ? lues[k] : p;
      });
      setTexte(completes);
      setALire([]);
      const mots = lues.reduce((s, p) => s + p.morceaux.length, 0);
      setMessage(mots ? `${mots} mot${mots > 1 ? "s" : ""} lu${mots > 1 ? "s" : ""} : tu peux maintenant chercher dedans.` : "Aucun texte n'a été reconnu : dessine les caches à la main.");
      setMessageDiscret(false);
    });

  const masquerPartout = (motif: RegExp | IdMotif, libelle: string, cle: string) =>
    lancer(async (avancer) => {
      avancer(null, "Recherche dans le document");
      const prepare = await preparerTexte();
      if (!prepare || prepare.vides.length === prepare.pages.length) {
        setMessage(`${libelle} : ce document est une image, lis d'abord son texte (bouton ci-dessous), puis cherche.`);
        setMessageDiscret(false);
        return;
      }
      const { pages } = prepare;
      const trouvailles = chercher(pages, motif);
      const nouveaux: Cadre[] = [];
      for (const t of trouvailles)
        for (const boite of t.boites) {
          // Déjà sous un cache (posé à la main ou par une autre recherche) : rien à ajouter.
          const presents = [...cadres, ...nouveaux].filter((c) => c.page === t.page).map((c) => c.boite);
          if (couverture(boite, presents) >= COUVERT) continue;
          nouveaux.push({ id: nouvelId(), page: t.page, boite, texte: t.texte });
        }
      const pagesTouchees = new Set(trouvailles.map((t) => t.page)).size;
      if (!trouvailles.length) {
        setMessage(`${libelle} : rien trouvé.`);
        setMessageDiscret(false);
        return;
      }
      setCadres((l) => [...l, ...nouveaux]);
      if (nouveaux.length) setRecherches((r) => [...r.filter((x) => x.cle !== cle), { cle, libelle, motif, ids: [...(r.find((x) => x.cle === cle)?.ids ?? []), ...nouveaux.map((c) => c.id)] }]);
      setResultat(null);
      setRestes(null);
      setMessage(
        nouveaux.length
          ? `${libelle} : ${nouveaux.length} cache${nouveaux.length > 1 ? "s" : ""} posé${nouveaux.length > 1 ? "s" : ""}${pagesTouchees > 1 ? ` sur ${pagesTouchees} pages` : ""}.`
          : `${libelle} : déjà tout caché.`,
      );
      setMessageDiscret(nouveaux.length > 0);
    });

  const chercherTexte = () => {
    const motif = motifDeRecherche(q);
    if (!motif) {
      setMessage("Écris au moins deux lettres ou chiffres.");
      setMessageDiscret(false);
      return;
    }
    void masquerPartout(motif, `« ${q.trim()} »`, `q:${q.trim().toLowerCase()}`);
    setQ("");
  };

  const oublierRecherche = (cle: string) => {
    const r = recherches.find((x) => x.cle === cle);
    if (!r) return;
    const ids = new Set(r.ids);
    setCadres((l) => l.filter((c) => !ids.has(c.id)));
    setRecherches((l) => l.filter((x) => x.cle !== cle));
    setChoisi(null);
    setResultat(null);
    setRestes(null);
  };

  /* ---------------------------------------------------------------- enregistrer */

  const enregistrer = () =>
    lancer(async (avancer, signal) => {
      if (!source || !fichier || !cadres.length) return;
      const m = await import("@/lib/alambic/navigateur/masquer");
      const utiles = cadres.filter((c) => c.boite.w > 0.002 && c.boite.h > 0.002);
      if (!utiles.length) throw new Error("Les caches sont trop petits pour cacher quoi que ce soit : agrandis-les avant d'enregistrer.");
      const motifs = recherches.map((x) => x.motif);
      // Chaque texte cherché doit rester sous un cache (un cache retiré ou déplacé le laisserait lisible).
      const sansCache = texte && motifs.length ? decouverts(texte, motifs, utiles) : [];
      if (source.genre === "image") {
        avancer(null, "Les caches sont peints dans l'image");
        setResultat(await m.masquerImage(fichier, source.format, utiles, couleur, fichier.name));
        setRestes(motifs.length ? sansCache : null);
        return;
      }
      const r = await m.masquerPdf(source.octets, utiles, couleur, fichier.name, avancer, signal);
      verifierAnnulation(signal);
      // Puis on relit le fichier produit : ce qu'on a cherché ne doit plus y être.
      avancer(0.97, "Vérification du fichier masqué");
      const relus = motifs.length ? await m.verifierPdf(new Uint8Array(await r.blob.arrayBuffer()), motifs) : [];
      const vus = new Set<string>();
      const restes = [...sansCache, ...relus].filter((x) => {
        const cle = `${x.page}|${x.texte}`;
        if (vus.has(cle)) return false;
        vus.add(cle);
        return true;
      });
      setRestes(motifs.length ? restes : null);
      setResultat(r);
    });

  const enCours = travail !== null;
  const pages = source?.pages ?? [];

  return (
    <section className="alambic-outil" aria-labelledby="titre-masquer">
      <EnTeteOutil Icone={EyeOff} titre="Masquer des informations" id="titre-masquer">
        Avant d&apos;envoyer un document, cache ce qui ne regarde pas le destinataire : un numéro de sécurité sociale, un IBAN, une adresse, une photo. Ce qui est masqué disparaît vraiment du fichier.
      </EnTeteOutil>

      {!fichier ? (
        <ZoneDepot titre="Dépose le document à masquer" aide="un PDF, une photo, un scan ou une capture d'écran" accept=".pdf,image/*" onFichiers={(f) => void charger(f)} desactive={enCours} />
      ) : (
        <div className="alambic-fichier">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{fichier.name}</span>
            <span className="text-sm text-encre-douce">
              {source?.genre === "image" ? "1 image" : `${pages.length} page${pages.length > 1 ? "s" : ""}`}, {tailleLisible(fichier.size)}
              {cadres.length ? `, ${cadres.length} cache${cadres.length > 1 ? "s" : ""}` : ""}
            </span>
          </span>
          <button type="button" className="bouton-icone" aria-label="Retirer le fichier" onClick={vider} disabled={enCours}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}
      {verrouille && <MessageErreur erreur={erreur} onMotDePasse={(mdp) => charger([verrouille], mdp)} />}

      {source && (
        <>
          <div className="alambic-carte-etat alambic-masque-recherche">
            <form
              className="alambic-masque-cherche"
              onSubmit={(e) => {
                e.preventDefault();
                chercherTexte();
              }}
            >
              <label className="sr-only" htmlFor="masquer-texte">
                Texte à masquer partout
              </label>
              <input id="masquer-texte" className="champ" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Un nom, un numéro, une adresse…" autoComplete="off" spellCheck={false} disabled={enCours} />
              <button type="submit" className="bouton bouton-discret !min-h-11" disabled={enCours || !q.trim()}>
                <Search className="size-4" aria-hidden="true" />
                Masquer partout
              </button>
            </form>
            <div className="alambic-pastilles" role="group" aria-label="Masquer automatiquement">
              {MOTIFS.map((m) => (
                <button key={m.id} type="button" aria-pressed={recherches.some((r) => r.cle === `m:${m.id}`)} onClick={() => void masquerPartout(m.id, m.nom, `m:${m.id}`)} title={`Par exemple : ${m.exemple}`} disabled={enCours}>
                  {m.nom}
                </button>
              ))}
            </div>
            {message && (
              <p className={messageDiscret ? "sr-only" : "text-sm"} aria-live="polite">
                {message}
              </p>
            )}
            {aLire.length > 0 && (
              <div className="alambic-masque-lire">
                <p className="text-sm text-encre-douce">
                  {source.genre === "image"
                    ? "C'est une image : pour y chercher un mot, il faut d'abord la lire (sur ton appareil)."
                    : aLire.length === pages.length
                      ? "Ce PDF est un scan : pour y chercher un mot, il faut d'abord lire ses pages (sur ton appareil, quelques secondes par page)."
                      : `${aLire.length} page${aLire.length > 1 ? "s sont surtout des images" : " est surtout une image"} : lis-${aLire.length > 1 ? "les" : "la"} pour y chercher aussi.`}
                </p>
                <button type="button" className="bouton bouton-discret !min-h-10" onClick={() => void lireImages()} disabled={enCours}>
                  <ScanText className="size-4" aria-hidden="true" />
                  Lire le texte
                </button>
              </div>
            )}
            {recherches.length > 0 && (
              <ul className="alambic-masque-recherches">
                {recherches.map((r) => (
                  <li key={r.cle}>
                    <Check className="size-4 shrink-0 text-or" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">
                      {r.libelle} : {r.ids.length} cache{r.ids.length > 1 ? "s" : ""}
                    </span>
                    <button type="button" className="bouton-icone !size-8" aria-label={`Retirer les caches de ${r.libelle}`} title="Retirer ces caches" onClick={() => oublierRecherche(r.cle)}>
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="alambic-signe-outils" role="toolbar" aria-label="Caches">
            <button type="button" className="alambic-signe-outil" aria-pressed={ajout} onClick={() => setAjout((a) => !a)}>
              <SquareDashed className="size-4" aria-hidden="true" />
              Ajouter des caches
            </button>
            <div className="alambic-segments" role="radiogroup" aria-label="Couleur des caches">
              <button type="button" role="radio" aria-checked={couleur === "noir"} onClick={() => setCouleur("noir")}>
                Noirs
              </button>
              <button type="button" role="radio" aria-checked={couleur === "blanc"} onClick={() => setCouleur("blanc")}>
                Blancs
              </button>
            </div>
            {cadres.length > 0 && (
              <button
                type="button"
                className="alambic-signe-outil"
                onClick={() => {
                  setCadres([]);
                  setRecherches([]);
                  setChoisi(null);
                  setResultat(null);
                  setRestes(null);
                }}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Tout retirer
              </button>
            )}
          </div>
          <p className="alambic-signe-consigne" aria-live="polite">
            {ajout ? "Trace un cadre sur ce qu'il faut cacher (au doigt : touche l'endroit, puis ajuste le cache par sa poignée)." : "Touche un cache pour le déplacer, l'agrandir ou le retirer."}
          </p>

          <div className="alambic-signe-pages alambic-masque-pages" data-mode={ajout ? "ajout" : undefined}>
            {pages.map((t, i) => (
              <div
                key={i}
                className="alambic-signe-page"
                style={{ aspectRatio: `${t.l} / ${t.h}` }}
                onPointerDown={(ev) => surPointeur(ev, i)}
                onPointerMove={surMouvement}
                onPointerUp={(ev) => surLacher(ev, t)}
                onPointerCancel={surAnnulation}
                onClick={(ev) => surClic(ev, i, t)}
                role="group"
                aria-label={source.genre === "image" ? "Image" : `Page ${i + 1}`}
              >
                {source.genre === "pdf" ? (
                  <VignettePdf doc={source.pdf.doc} numero={i + 1} largeur={1100} className="alambic-signe-fond" />
                ) : (
                  <span className="alambic-signe-fond">
                    {/* eslint-disable-next-line @next/next/no-img-element -- image locale (blob:) */}
                    <img src={source.url} alt="" draggable={false} />
                  </span>
                )}
                {cadres
                  .filter((c) => c.page === i)
                  .map((c) => (
                    <CadreVue key={c.id} c={c} numero={cadres.indexOf(c) + 1} choisi={choisi === c.id} couleur={couleur} onChoisir={() => setChoisi(c.id)} onChanger={(b) => changerBoite(c.id, b)} onRetirer={() => retirer(c.id)} />
                  ))}
                {source.genre === "pdf" && (
                  <span className="alambic-signe-numero" aria-hidden="true">
                    {i + 1}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="alambic-actions">
            {travail ? (
              <Progression travail={travail} />
            ) : (
              <button type="button" className="bouton bouton-principal alambic-lancer" onClick={() => void enregistrer()} disabled={!cadres.length}>
                <EyeOff className="size-5" aria-hidden="true" />
                {cadres.length ? `Enregistrer avec ${cadres.length} cache${cadres.length > 1 ? "s" : ""}` : "Aucun cache pour l'instant"}
              </button>
            )}
          </div>
        </>
      )}

      {travail && !source && <Progression travail={travail} />}
      {!verrouille && <MessageErreur erreur={erreur} />}
      {restes && restes.length > 0 && (
        <div className="message message-erreur" role="alert">
          <ShieldAlert className="mr-1 inline size-4" aria-hidden="true" />
          Pas entièrement caché : {restes.slice(0, 6).map((r) => `« ${r.texte} »${source?.genre === "pdf" ? ` (page ${r.page + 1})` : ""}`).join(", ")}
          {restes.length > 6 ? `, et ${restes.length - 6} autre${restes.length - 6 > 1 ? "s" : ""}` : ""}. Un cache a été retiré ou déplacé : vérifie avant d&apos;envoyer.
        </div>
      )}
      {restes && restes.length === 0 && (
        <p className="message alambic-masque-verifie" role="status">
          <Check className="mr-1 inline size-4" aria-hidden="true" />
          {source?.genre === "pdf" ? "Vérifié : chaque texte cherché est sous un cache, et le fichier produit ne le contient plus." : "Vérifié : chaque texte cherché est sous un cache."}
        </p>
      )}
      {resultat && <CarteResultat resultat={resultat} protege={false} />}

      <BonASavoir
        points={[
          "Un cache posé ici efface vraiment : la page concernée devient une image, le texte qui était dessous n'existe plus. Un rectangle noir ajouté dans un autre logiciel, lui, se retire d'un clic.",
          "« Masquer partout » trouve un mot sur toutes les pages, avec ou sans majuscules, accents ou espaces ; relis quand même chaque page avant d'envoyer.",
          "Sur une pièce d'identité, cache aussi les deux lignes de chiffres et de chevrons du bas : elles répètent le nom, la date de naissance et le numéro.",
          "Les pages sans cache restent intactes : leur texte se sélectionne et leurs liens marchent.",
          "Le cache choisi devient transparent pour qu'on le place bien ; dans le fichier, tous les caches sont pleins.",
          "Au clavier : Tab jusqu'à un cache, puis flèches pour le déplacer, Maj + flèches pour l'agrandir ou le réduire, Suppr pour le retirer.",
        ]}
      />
    </section>
  );
}
