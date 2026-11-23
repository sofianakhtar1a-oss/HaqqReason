"use client";

/*
 * « Rassembler » : on dépose tous ses documents d'un coup (des dizaines, ou un dossier entier),
 * leur texte est lu un à un (reconnu pour les images et les scans, transcrit pour les sons et
 * les vidéos), puis « Copier tout le texte » copie le texte de TOUS les documents, à la suite.
 */
import { ArrowDown, ArrowUp, Check, ClipboardCopy, Copy, Download, Feather, FileArchive, FileImage, FileMusic, FileSpreadsheet, FileStack, FileText, Files, FolderOpen, LoaderCircle, Pause, Play, Presentation, RotateCcw, Trash2, X, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { MarquePremium } from "@/components/premium/MarquePremium";
import type { LangueOcr } from "@/lib/alambic/navigateur/ocr";
import type { Noeud } from "@/lib/alambic/pm";
import type { GenreLecture } from "@/lib/alambic/rassemblement";
import { tailleLisible } from "@/lib/alambic/formats";
import { useAccesComplet } from "@/lib/client/acces";
import { BonASavoir, EnTeteOutil } from "../commun";
import { type Abonner, useReception } from "../reception";
import { telecharger } from "../telecharger";
import { ajouter, arreter, type Bilan, choisirLangues, choisirTitres, deplacer, lancer, type Piece, PIECES_MAX, reessayer, retirer, texteComplet, trierParNom, useRassemblement, vider } from "./etat-rassembler";

const ICONES: Record<GenreLecture | "inconnu", LucideIcon> = {
  pdf: FileText,
  document: FileText,
  texte: FileText,
  tableur: FileSpreadsheet,
  presentation: Presentation,
  image: FileImage,
  svg: FileImage,
  media: FileMusic,
  archive: FileArchive,
  inconnu: FileText,
};

const LANGUES: { id: LangueOcr; nom: string }[] = [
  { id: "fra", nom: "Français" },
  { id: "eng", nom: "Anglais" },
  { id: "ara", nom: "Arabe" },
];

const nombre = (n: number) => n.toLocaleString("fr-FR");
const pluriel = (n: number, un: string, plusieurs: string) => `${nombre(n)} ${n > 1 ? plusieurs : un}`;

/** Copie un texte, même là où le presse-papiers moderne est refusé. */
async function copier(texte: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    const t = document.createElement("textarea");
    t.value = texte;
    t.setAttribute("readonly", "");
    t.style.position = "fixed";
    t.style.opacity = "0";
    document.body.append(t);
    t.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    t.remove();
    return ok;
  }
}

/* ---------- Les fichiers d'un dossier glissé (Chrome, Edge, Firefox, Safari) ---------- */

type Entree = { isFile: boolean; isDirectory: boolean; name: string; fullPath: string; file?: (ok: (f: File) => void, ko: (e: unknown) => void) => void; createReader?: () => { readEntries: (ok: (l: Entree[]) => void, ko: (e: unknown) => void) => void } };

async function parcourir(entree: Entree, sortie: { fichier: File; chemin?: string }[], profondeur = 0): Promise<void> {
  if (sortie.length >= PIECES_MAX * 2 || profondeur > 12) return;
  if (entree.isFile && entree.file) {
    const fichier = await new Promise<File>((ok, ko) => entree.file!(ok, ko));
    sortie.push({ fichier, chemin: entree.fullPath.replace(/^\//, "") });
    return;
  }
  if (entree.isDirectory && entree.createReader) {
    const lecteur = entree.createReader();
    // readEntries rend les fichiers par paquets : on relit jusqu'à recevoir une liste vide.
    for (;;) {
      const lot = await new Promise<Entree[]>((ok, ko) => lecteur.readEntries(ok, ko));
      if (!lot.length) break;
      for (const e of lot) await parcourir(e, sortie, profondeur + 1);
    }
  }
}

async function fichiersDeposes(donnees: DataTransfer): Promise<{ fichier: File; chemin?: string }[]> {
  const entrees = [...donnees.items].map((i) => (i.kind === "file" ? ((i as DataTransferItem & { webkitGetAsEntry?: () => Entree | null }).webkitGetAsEntry?.() ?? null) : null));
  if (!entrees.some((e) => e?.isDirectory)) return [...donnees.files].map((fichier) => ({ fichier }));
  const sortie: { fichier: File; chemin?: string }[] = [];
  for (const e of entrees) if (e) await parcourir(e, sortie);
  return sortie;
}

/* ---------- Le document pour Le Calame ---------- */

function documentRassemble(pieces: Piece[], titres: boolean): Noeud {
  const content: Noeud[] = [];
  for (const p of pieces) {
    if (titres) content.push({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: p.nom.slice(0, 300) }] });
    for (const bloc of (p.texte ?? "").split(/\n{2,}/)) {
      // Un tableau (cellules séparées par des tabulations) garde une ligne par rangée.
      const lignes = bloc.includes("\t") ? bloc.split("\n") : [bloc.replace(/\s*\n\s*/g, " ")];
      for (const l of lignes) {
        const t = l.replace(/\t/g, "    ").trim();
        if (t) content.push({ type: "paragraph", content: [{ type: "text", text: t }] });
      }
    }
  }
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

/* ---------- L'outil ---------- */

export function Rassembler({ abonner }: { abonner: Abonner }) {
  const r = useRassemblement();
  const router = useRouter();
  const accesComplet = useAccesComplet();
  const choixFichiers = useRef<HTMLInputElement>(null);
  const choixDossier = useRef<HTMLInputElement>(null);
  const [glisse, setGlisse] = useState(false);
  const [message, setMessage] = useState("");
  const [copie, setCopie] = useState<number | null>(null);
  const id = useId();

  const recevoir = async (entrants: { fichier: File; chemin?: string }[]) => {
    if (!entrants.length) return;
    setMessage(`Ajout de ${pluriel(entrants.length, "fichier", "fichiers")}…`);
    const b: Bilan = await ajouter(entrants);
    const morceaux = [
      b.ajoutes ? `${pluriel(b.ajoutes, "document ajouté", "documents ajoutés")}` : "Aucun document ajouté",
      b.doublons ? `${pluriel(b.doublons, "déjà présent laissé", "déjà présents laissés")} de côté` : "",
      b.ignores ? `${pluriel(b.ignores, "fichier vide ou caché ignoré", "fichiers vides ou cachés ignorés")}` : "",
      b.trop ? `${pluriel(b.trop, "fichier n'a", "fichiers n'ont")} pas pu entrer (${PIECES_MAX} au plus)` : "",
    ].filter(Boolean);
    setMessage(`${morceaux.join(", ")}.`);
  };

  // Collés (Ctrl+V) ou passés par un autre outil.
  useReception(abonner, (f) => void recevoir(f.map((fichier) => ({ fichier }))));

  // Le choix d'un dossier entier (attribut non standard, compris par tous les navigateurs actuels).
  useEffect(() => {
    choixDossier.current?.setAttribute("webkitdirectory", "");
    choixDossier.current?.setAttribute("directory", "");
  }, []);

  const tout = texteComplet(r);
  const enLecture = r.pieces.filter((p) => p.etat === "lecture" || p.etat === "attente").length;
  const finis = r.pieces.filter((p) => p.etat !== "attente" && p.etat !== "lecture").length;
  const prets = r.pieces.filter((p) => p.etat === "pret");

  const copierTout = async () => {
    if (!tout.documents) return;
    const ok = await copier(tout.texte);
    setCopie((n) => (ok ? (n ?? 0) + 1 : null));
    setMessage(
      ok
        ? `Copié : le texte de ${pluriel(tout.documents, "document", "documents")}, ${pluriel(tout.mots, "mot", "mots")}.${tout.restants ? ` ${pluriel(tout.restants, "document est encore", "documents sont encore")} en lecture : copie de nouveau quand ce sera fini.` : ""}`
        : "Le navigateur a refusé la copie. Utilise « Télécharger en texte » à la place.",
    );
  };

  const ouvrirDansCalame = async () => {
    const [depot, modele, schema] = await Promise.all([import("@/lib/atelier/depot"), import("@/lib/atelier/modele"), import("@/lib/document-schema")]);
    const titre = prets.length === 1 ? prets[0].nom.replace(/\.[^.]+$/, "") : `Rassemblement de ${prets.length} documents`;
    const doc = modele.documentVide(depot.nouvelIdentifiant(), titre.slice(0, 200));
    doc.contenu = documentRassemble(prets, r.titres) as never;
    const brut = schema.texteDuDocument(doc.contenu);
    doc.mots = schema.compterMots(brut);
    doc.signes = brut.length;
    await depot.ecrireDocument(doc);
    try {
      window.localStorage.setItem((await import("@/lib/client/compte")).tiroir("calame-dernier-document"), doc.id);
    } catch {}
    router.push("/ecrire");
  };

  useEffect(() => {
    if (copie === null) return;
    const t = setTimeout(() => setCopie(null), 2500);
    return () => clearTimeout(t);
  }, [copie]);

  return (
    <section className="alambic-outil" aria-labelledby="titre-rassembler">
      <EnTeteOutil Icone={FileStack} titre="Rassembler" id="titre-rassembler">
        Dépose tous tes documents d&apos;un coup, même un dossier entier : leur texte est lu un à un (reconnu dans les images et les scans, transcrit pour les sons et les vidéos), puis copié en un seul geste.
      </EnTeteOutil>

      <input
        ref={choixFichiers}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void recevoir([...(e.target.files ?? [])].map((fichier) => ({ fichier })));
          e.target.value = "";
        }}
      />
      <input
        ref={choixDossier}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void recevoir([...(e.target.files ?? [])].map((fichier) => ({ fichier, chemin: (fichier as File & { webkitRelativePath?: string }).webkitRelativePath || undefined })));
          e.target.value = "";
        }}
      />
      <div
        className={`alambic-depot rs-depot${r.pieces.length ? " alambic-depot-compact" : ""}`}
        data-glisse={glisse || undefined}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setGlisse(true);
        }}
        onDragLeave={() => setGlisse(false)}
        onDrop={(e) => {
          e.preventDefault();
          setGlisse(false);
          void fichiersDeposes(e.dataTransfer).then(recevoir);
        }}
      >
        <FileStack className={r.pieces.length ? "size-6 text-or" : "size-8 text-or"} strokeWidth={1.4} aria-hidden="true" />
        <span className={r.pieces.length ? "font-semibold" : "font-display text-xl font-bold"}>{r.pieces.length ? "Ajouter d'autres documents" : "Dépose tous tes documents ici"}</span>
        <span className="text-sm text-encre-douce">PDF, Word, textes, tableurs, présentations, photos et scans, sons et vidéos, archives ZIP : autant que tu veux, d&apos;un coup.</span>
        <span className="rs-depot-boutons">
          <button type="button" className="bouton bouton-discret" onClick={() => choixFichiers.current?.click()}>
            <Files className="size-5" aria-hidden="true" />
            Choisir des fichiers
          </button>
          <button type="button" className="bouton bouton-discret" onClick={() => choixDossier.current?.click()}>
            <FolderOpen className="size-5" aria-hidden="true" />
            Choisir un dossier
          </button>
        </span>
      </div>
      <p className="min-h-6 text-sm text-encre-douce" role="status" aria-live="polite">
        {message}
      </p>

      {r.refuse && (
        <div className="message alambic-erreur" role="alert">
          <p>La lecture attend : « Rassembler » fait partie de l&apos;accès Premium, ou tes essais gratuits de la période sont utilisés.</p>
          <button type="button" className="bouton bouton-discret mt-2" onClick={() => void lancer()}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      )}

      {r.pieces.length > 0 && (
        <>
          <div className="rs-barre" aria-label="Le texte rassemblé">
            <p className="rs-barre-bilan">
              <strong>{pluriel(tout.documents, "document prêt", "documents prêts")}</strong> sur {nombre(r.pieces.filter((p) => p.etat !== "deballee").length)}
              <span className="text-encre-douce">, {pluriel(tout.mots, "mot", "mots")}</span>
            </p>
            <button type="button" className="bouton bouton-principal rs-copier" onClick={() => void copierTout()} disabled={!tout.documents} aria-describedby={`${id}-titres`}>
              {copie ? <Check className="size-5" aria-hidden="true" /> : <ClipboardCopy className="size-5" aria-hidden="true" />}
              {copie ? "Copié" : "Copier tout le texte"}
              <MarquePremium fonction="alambic.rassembler" />
            </button>
            <div className="rs-barre-suite">
              <label className="rs-case" id={`${id}-titres`}>
                <input type="checkbox" checked={r.titres} onChange={(e) => choisirTitres(e.target.checked)} />
                Avec le nom de chaque document
              </label>
              <button type="button" className="bouton bouton-discret" disabled={!tout.documents} onClick={() => telecharger(new Blob([tout.texte], { type: "text/plain;charset=utf-8" }), prets.length === 1 ? `${prets[0].nom.replace(/\.[^.]+$/, "")}.txt` : `Rassemblement de ${prets.length} documents.txt`)}>
                <Download className="size-5" aria-hidden="true" />
                Télécharger en texte
              </button>
              {accesComplet && (
                <button type="button" className="bouton bouton-discret" disabled={!tout.documents} onClick={() => void ouvrirDansCalame()}>
                  <Feather className="size-5" aria-hidden="true" />
                  Ouvrir dans Le Calame
                </button>
              )}
            </div>
          </div>

          {r.marche ? (
            <div className="rs-avance">
              <LoaderCircle className="size-5 animate-spin text-or" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  Lecture en cours : {nombre(finis)} sur {nombre(r.pieces.length)}
                </p>
                <progress className="rs-progres" max={r.pieces.length} value={finis} aria-label="Documents lus" />
              </div>
              <button type="button" className="bouton bouton-discret" onClick={arreter}>
                <Pause className="size-4" aria-hidden="true" />
                Arrêter
              </button>
            </div>
          ) : (
            enLecture > 0 &&
            !r.refuse && (
              <div className="rs-avance">
                <p className="min-w-0 flex-1 font-semibold">{pluriel(enLecture, "document attend", "documents attendent")} d&apos;être lu{enLecture > 1 ? "s" : ""}.</p>
                <button type="button" className="bouton bouton-discret" onClick={() => void lancer()}>
                  <Play className="size-4" aria-hidden="true" />
                  Reprendre la lecture
                </button>
              </div>
            )
          )}

          <ol className="rs-liste" aria-label="Les documents, dans l'ordre où leur texte sera copié">
            {r.pieces.map((p, i) => (
              <LignePiece key={p.id} p={p} rang={i} total={r.pieces.length} />
            ))}
          </ol>

          <div className="rs-pied">
            <fieldset className="rs-langues">
              <legend className="text-sm font-semibold">Langues des images et des scans</legend>
              {LANGUES.map((l) => (
                <label key={l.id} className="rs-case">
                  <input type="checkbox" checked={r.langues.includes(l.id)} onChange={(e) => choisirLangues(e.target.checked ? [...r.langues, l.id] : r.langues.filter((x) => x !== l.id))} />
                  {l.nom}
                </label>
              ))}
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="bouton bouton-discret" onClick={trierParNom} disabled={r.pieces.length < 2}>
                Ranger par nom
              </button>
              <button type="button" className="bouton bouton-discret" onClick={vider}>
                <Trash2 className="size-4" aria-hidden="true" />
                Tout retirer
              </button>
            </div>
          </div>
        </>
      )}

      <BonASavoir
        points={[
          "Tout est lu sur ton appareil, sauf les sons et les vidéos : ils partent à la transcription, comme dans « Transcrire », où leur texte est aussi rangé.",
          "Les PDF scannés et les photos de documents passent par la reconnaissance du texte : choisis leurs langues ci-dessus, puis relis les noms propres et les chiffres.",
          "L'ordre de la liste est celui du texte copié : range-la par nom, ou déplace un document avec ses flèches.",
          "Une archive ZIP se déballe d'elle-même : ses documents rejoignent la liste.",
        ]}
      />
    </section>
  );
}

const LIBELLES: Record<Piece["etat"], string> = {
  attente: "En attente",
  lecture: "Lecture…",
  pret: "Prêt",
  vide: "Aucun texte trouvé",
  erreur: "Pas pu être lu",
  reserve: "Réservé à Premium",
  deballee: "Archive ouverte",
};

function LignePiece({ p, rang, total }: { p: Piece; rang: number; total: number }) {
  const [ouvert, setOuvert] = useState(false);
  const [copie, setCopie] = useState(false);
  const Icone = ICONES[p.genre ?? "inconnu"];
  const detail =
    p.etat === "pret"
      ? `${pluriel(p.mots ?? 0, "mot", "mots")}${p.via === "transcription" ? ", transcrit" : p.via === "reconnaissance" ? ", reconnu" : ""}`
      : p.etat === "lecture"
        ? `${p.etape ?? "Lecture"}${typeof p.avancement === "number" ? ` (${Math.round(p.avancement * 100)} %)` : "…"}`
        : p.etat === "attente"
          ? tailleLisible(p.fichier.size)
          : p.etat === "vide"
            ? "Rien à lire dedans (une image sans texte, une page blanche…)."
            : (p.erreur ?? p.note ?? "");

  return (
    <li className="rs-piece" data-etat={p.etat}>
      <div className="rs-piece-ligne">
        <span className="rs-rang" aria-hidden="true">
          {rang + 1}
        </span>
        <Icone className="size-5 shrink-0 text-or" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold" title={p.nom}>
            {p.nom}
          </span>
          <span className="rs-piece-detail">
            <span className="rs-etat">{LIBELLES[p.etat]}</span> {detail}
          </span>
        </span>
        <span className="rs-piece-actions">
          {p.etat === "pret" && (
            <>
              <button type="button" className="bouton-icone !size-9" aria-expanded={ouvert} aria-label={`${ouvert ? "Cacher" : "Voir"} le texte de ${p.nom}`} title={ouvert ? "Cacher le texte" : "Voir le texte"} onClick={() => setOuvert((o) => !o)}>
                <FileText className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="bouton-icone !size-9"
                aria-label={`Copier le texte de ${p.nom}`}
                title="Copier ce document seulement"
                onClick={() =>
                  void copier(p.texte ?? "").then((ok) => {
                    setCopie(ok);
                    setTimeout(() => setCopie(false), 2000);
                  })
                }
              >
                {copie ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              </button>
            </>
          )}
          {(p.etat === "erreur" || p.etat === "reserve" || p.etat === "vide") && (
            <button type="button" className="bouton-icone !size-9" aria-label={`Relire ${p.nom}`} title="Relire" onClick={() => reessayer(p.id)}>
              <RotateCcw className="size-4" aria-hidden="true" />
            </button>
          )}
          <button type="button" className="bouton-icone !size-9" aria-label={`Monter ${p.nom}`} title="Monter" disabled={rang === 0} onClick={() => deplacer(p.id, -1)}>
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
          <button type="button" className="bouton-icone !size-9" aria-label={`Descendre ${p.nom}`} title="Descendre" disabled={rang === total - 1} onClick={() => deplacer(p.id, 1)}>
            <ArrowDown className="size-4" aria-hidden="true" />
          </button>
          <button type="button" className="bouton-icone !size-9" aria-label={`Retirer ${p.nom}`} title="Retirer" onClick={() => retirer(p.id)}>
            <X className="size-4" aria-hidden="true" />
          </button>
        </span>
      </div>
      {p.etat === "lecture" && <progress className="rs-progres" max={1} value={typeof p.avancement === "number" ? p.avancement : undefined} aria-label={`Lecture de ${p.nom}`} />}
      {ouvert && p.texte && <textarea className="rs-texte" readOnly value={p.texte} rows={8} aria-label={`Texte de ${p.nom}`} />}
      {p.etat === "pret" && p.note && <p className="rs-note">{p.note}</p>}
    </li>
  );
}
