"use client";

import { Shrink, X } from "lucide-react";
import { useMemo, useState } from "react";
import { NIVEAUX, POIDS_VISES, type Niveau } from "@/lib/alambic/allegement";
import { estPdfProtege } from "@/lib/alambic/erreurs";
import { familleDuFormat, nomDuFormat, tailleLisible } from "@/lib/alambic/formats";
import type { Capacites } from "@/lib/alambic/graphe";
import { bureautique } from "@/lib/alambic/outils";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import { CarteResultat } from "../CarteResultat";
import { useAlambic } from "../contexte";
import { BonASavoir, EnTeteOutil, ListeResultats, MessageErreur, Progression, reconnaitreTous, useTravail, verifierAnnulation, ZoneDepot } from "../commun";
import { utiliser } from "@/lib/client/premium";
import { MarquePremium } from "@/components/premium/MarquePremium";
import { useReception, type Abonner } from "../reception";
import { ICONES } from "../SelecteurFormat";

type Genre = "image" | "pdf" | "video" | "son" | "bureau";
type Element = { id: string; fichier: File; format: string; genre: Genre };
type Echec = { nom: string; message: string; fichier: File; protege: boolean };

const GENRES: Record<string, Genre> = { jpg: "image", png: "image", webp: "image", bmp: "image", tiff: "image", heic: "image", avif: "image", pdf: "pdf", mp4: "video", webm: "video", mov: "video", mkv: "video", mp3: "son", wav: "son", ogg: "son", flac: "son", aac: "son", m4a: "son" };
const genreDe = (format: string | null, nom: string): Genre | null => (format ? (GENRES[format] ?? (bureautique(format, nom) ? "bureau" : null)) : null);

/** Ce que fait chaque niveau, pour les familles de fichiers présentes. */
const EFFETS: Record<Genre, Record<Niveau, string>> = {
  image: { leger: "photos jusqu'à 2 560 px, qualité 85 %", equilibre: "photos jusqu'à 1 920 px, qualité 75 %", fort: "photos jusqu'à 1 280 px, qualité 60 %" },
  pdf: { leger: "PDF compacté, rien n'est touché", equilibre: "images du PDF ramenées à 150 ppp", fort: "images du PDF ramenées à 100 ppp" },
  video: { leger: "vidéo en 1080p au plus", equilibre: "vidéo en 720p", fort: "vidéo en 480p" },
  son: { leger: "son à 160 kbit/s", equilibre: "son à 128 kbit/s", fort: "son à 64 kbit/s, en mono" },
  bureau: { leger: "images du document jusqu'à 2 560 px", equilibre: "images du document jusqu'à 1 920 px", fort: "images du document jusqu'à 1 280 px" },
};

const libellePoids = (o: number) => (o === 0 ? "Aucun" : o >= 1024 * 1024 ? `${o / (1024 * 1024)} Mo` : `${Math.round(o / 1024)} Ko`);

export function Allegement({ abonner, capacites }: { abonner: Abonner; capacites: Capacites }) {
  const { intention, envoyer } = useAlambic();
  const [elements, setElements] = useState<Element[]>([]);
  const [niveau, setNiveau] = useState<Niveau>("equilibre");
  const [formatImage, setFormatImage] = useState<"garder" | "jpg" | "webp">("garder");
  const [poidsVise, setPoidsVise] = useState(0);
  const [pagesEnImages, setPagesEnImages] = useState(false);
  const [resultats, setResultats] = useState<{ r: Resultat; avant: number }[]>([]);
  const [echecs, setEchecs] = useState<Echec[]>([]);
  const [refuses, setRefuses] = useState<string[]>([]);
  const { travail, erreur, lancer, annuler } = useTravail();

  // « Que veux-tu faire ? » : une photo pour un formulaire vise souvent moins de 1 Mo.
  const [intentionVue, setIntentionVue] = useState<typeof intention>(null);
  if (intention !== intentionVue) {
    setIntentionVue(intention);
    if (intention?.reglage === "image") setPoidsVise(1024 * 1024);
  }

  const ajouter = async (fichiers: File[]) => {
    const reconnus = await reconnaitreTous(fichiers);
    const nouveaux: Element[] = [];
    const rejets: string[] = [];
    for (const { fichier, format } of reconnus) {
      const genre = genreDe(format, fichier.name);
      if (!genre || !format) rejets.push(fichier.name);
      else nouveaux.push({ id: crypto.randomUUID(), fichier, format, genre });
    }
    setRefuses(rejets);
    setResultats([]);
    setEchecs([]);
    setElements((e) => [...e, ...nouveaux]);
  };

  useReception(abonner, (fichiers) => void ajouter(fichiers));

  const genres = useMemo(() => new Set(elements.map((e) => e.genre)), [elements]);
  const avecImages = genres.has("image");

  const lancerTout = async () => {
    if (!(await utiliser("alambic.alleger"))) return;
    await lancer(async (avancer, signal) => {
      setResultats([]);
      setEchecs([]);
      const { alleger } = await import("@/lib/alambic/navigateur/alleger");
      const faits: { r: Resultat; avant: number }[] = [];
      const rates: Echec[] = [];
      for (let i = 0; i < elements.length; i++) {
        verifierAnnulation(signal);
        const e = elements[i];
        const prefixe = elements.length > 1 ? `${i + 1}/${elements.length} · ` : "";
        try {
          const r = await alleger(e.fichier, e.format, { niveau, formatImage, poidsVise, pagesEnImages, signal }, capacites, (a, etape) =>
            avancer((i + (a ?? 0)) / elements.length, `${prefixe}${e.fichier.name} : ${etape}`),
          );
          faits.push({ r, avant: e.fichier.size });
        } catch (err) {
          if ((err as Error)?.name === "AbortError") throw err;
          verifierAnnulation(signal);
          rates.push({ nom: e.fichier.name, message: (err as Error)?.message || "L'allègement a échoué.", fichier: e.fichier, protege: estPdfProtege(err) });
        }
      }
      setResultats(faits);
      setEchecs(rates);
    });
  };

  const totalAvant = resultats.reduce((s, x) => s + x.avant, 0);
  const totalApres = resultats.reduce((s, x) => s + x.r.blob.size, 0);
  const gainTotal = totalAvant ? Math.round((1 - totalApres / totalAvant) * 100) : 0;
  const enCours = travail !== null;

  return (
    <section className="alambic-outil" aria-labelledby="titre-alleger">
      <EnTeteOutil Icone={Shrink} titre="Alléger des fichiers" id="titre-alleger">
        Un PDF trop lourd pour un e-mail, une photo refusée par un formulaire, une vidéo qui ne passe pas : choisis le niveau, le fichier ressort plus léger.
      </EnTeteOutil>

      {elements.length > 0 && (
        <ul className="alambic-pieces">
          {elements.map((e) => {
            const Icone = ICONES[familleDuFormat(bureautique(e.format, e.fichier.name) ?? e.format)];
            return (
              <li key={e.id} className="alambic-piece">
                <Icone className="size-5 shrink-0 text-or" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{e.fichier.name}</span>
                  <span className="text-sm text-encre-douce">
                    {nomDuFormat(bureautique(e.format, e.fichier.name) ?? e.format)}, {tailleLisible(e.fichier.size)}
                  </span>
                </span>
                <button
                  type="button"
                  className="bouton-icone !size-9"
                  aria-label={`Retirer ${e.fichier.name}`}
                  disabled={enCours}
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
      )}
      <ZoneDepot
        compact={elements.length > 0}
        multiple
        titre={elements.length ? "Ajouter d'autres fichiers" : "Dépose les fichiers à alléger"}
        aide={elements.length ? undefined : "PDF, photos, vidéos, sons, Word, Excel, PowerPoint ; un ou plusieurs."}
        onFichiers={(f) => void ajouter(f)}
        desactive={enCours}
      />
      {refuses.length > 0 && <p className="message">Ne s&apos;allège pas ici : {refuses.join(", ")}.</p>}

      {elements.length > 0 && (
        <>
          <div className="alambic-option" role="radiogroup" aria-label="Niveau">
            <span>Niveau</span>
            <div className="alambic-segments">
              {NIVEAUX.map((n) => (
                <button key={n.id} type="button" role="radio" aria-checked={niveau === n.id} onClick={() => setNiveau(n.id)} title={n.aide}>
                  {n.nom}
                </button>
              ))}
            </div>
            <span className="w-full text-sm text-encre-douce">
              {NIVEAUX.find((n) => n.id === niveau)?.aide} : {[...genres].map((g) => EFFETS[g][niveau]).join(" ; ")}.
            </span>
          </div>

          {avecImages && (
            <>
              <div className="alambic-option" role="radiogroup" aria-label="Format des photos">
                <span>Photos</span>
                <div className="alambic-segments">
                  {(
                    [
                      ["garder", "Même format"],
                      ["jpg", "JPEG"],
                      ["webp", "WebP"],
                    ] as const
                  ).map(([v, l]) => (
                    <button key={v} type="button" role="radio" aria-checked={formatImage === v} onClick={() => setFormatImage(v)}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="alambic-option" role="radiogroup" aria-label="Poids visé par photo">
                <span>Poids visé</span>
                <div className="alambic-segments">
                  {POIDS_VISES.map((p) => (
                    <button key={p} type="button" role="radio" aria-checked={poidsVise === p} onClick={() => setPoidsVise(p)}>
                      {libellePoids(p)}
                    </button>
                  ))}
                </div>
                <span className="w-full text-sm text-encre-douce">
                  {poidsVise ? `Chaque photo est ajustée pour peser moins de ${libellePoids(poidsVise)}, avec la meilleure qualité possible.` : "Un formulaire en ligne limite la taille ? Choisis le poids qu'il accepte."}
                </span>
              </div>
            </>
          )}

          {genres.has("pdf") && niveau === "fort" && (
            <label className="alambic-interrupteur">
              <input type="checkbox" checked={pagesEnImages} onChange={(e) => setPagesEnImages(e.target.checked)} />
              <span className="alambic-interrupteur-piste" aria-hidden="true" />
              <span>
                <span className="font-semibold">Transformer chaque page en image</span>
                <span className="block text-sm text-encre-douce">Le plus léger pour un PDF plein de dessins, mais le texte ne se sélectionne plus.</span>
              </span>
            </label>
          )}

          <div className="alambic-actions">
            {travail ? (
              <Progression travail={travail} onAnnuler={annuler} />
            ) : (
              <button type="button" className="bouton bouton-principal alambic-lancer" onClick={() => void lancerTout()}>
                <Shrink className="size-5" aria-hidden="true" />
                {elements.length > 1 ? `Alléger les ${elements.length} fichiers` : "Alléger"}
                <MarquePremium fonction="alambic.alleger" />
              </button>
            )}
          </div>
        </>
      )}

      <MessageErreur erreur={erreur} />
      {echecs.length > 0 && (
        <div className="message message-erreur alambic-erreur" role="alert">
          {echecs.map((e, i) => (
            <p key={`${e.nom}-${i}`}>
              <strong>{e.nom} :</strong> {e.message}{" "}
              {e.protege && (
                <button type="button" className="underline underline-offset-2" onClick={() => envoyer("deverrouiller", [e.fichier])}>
                  Le déverrouiller
                </button>
              )}
            </p>
          ))}
        </div>
      )}

      {resultats.length > 1 && (
        <p className="alambic-bilan">
          {tailleLisible(totalAvant)} → <strong>{tailleLisible(totalApres)}</strong>
          {gainTotal > 0 ? ` (${gainTotal} % de moins)` : ""}
        </p>
      )}
      {resultats.length === 1 && <CarteResultat resultat={resultats[0].r} tailleAvant={resultats[0].avant} protege={false} />}
      {resultats.length > 1 && (
        <ListeResultats
          resultats={resultats.map((x) => x.r)}
          tailles={resultats.map((x) => x.avant)}
          nomZip="Fichiers allégés.zip"
        />
      )}

      <BonASavoir
        points={[
          "Un PDF garde son texte sélectionnable : seules ses images sont recompressées. Le niveau Fort peut, en plus, transformer les pages en images.",
          "Une photo perd ses informations cachées (lieu GPS, appareil) au passage : c'est aussi plus sûr pour l'envoyer.",
          "Si un fichier n'y gagne rien, il est rendu tel quel : tu ne télécharges jamais une version plus lourde.",
          "Pour une vidéo très longue, garde la page ouverte : le réencodage se fait par la puce de ton appareil.",
        ]}
      />
    </section>
  );
}
