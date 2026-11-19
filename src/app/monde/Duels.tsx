"use client";

import { BookOpen, Bot, Check, Clock, Coins, Compass, Copy, DraftingCompass, Earth, Flag, Footprints, Globe2, GraduationCap, Library, Link2, LogIn, Map as IconeCarte, Mountain, Navigation, Sailboat, Scroll, Search, Share2, Ship, Sprout, Swords, Tent, Trophy, Users, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { eclat, pluieDeLettres } from "@/lib/langues/feux";
import { pays } from "@/lib/monde/atlas";
import { CAMPAGNE, CLE_CAMPAGNE, adversaire as choisirExplorateur, EXPLORATEURS, type Explorateur, jouerVirtuel, suivantCampagne } from "@/lib/monde/bots";
import { CATEGORIES, CATEGORIES_CLASSIQUES, type ModeJeu, TYPES } from "@/lib/monde/categories";
import { lireScore, useCompteMonde } from "@/lib/monde/compte-client";
import { DUREES_DUEL, type FormuleSalon, NOMBRES_DUEL, NOMBRES_SALON, PAUSE_REPONSE, pointsReponse, type Reaction, REACTIONS, TAILLE_SALON } from "@/lib/monde/duels";
import { deriver, hasard, nouvelleGraine } from "@/lib/monde/hasard";
import { DUREE_QUESTION_DUEL } from "@/lib/monde/points";
import { battreRecordDe, noterJournal, noterReponse, useMonde } from "@/lib/monde/progression";
import { categorieDe, consigne, juger, QUESTIONS_PAR_DUEL, questionsDuel } from "@/lib/monde/quiz";
import type { EtatDuel } from "@/lib/monde/serveur";
import type { EtatSalon } from "@/lib/monde/social";
import { useTextes } from "@/lib/modules/textes-client";
import { PageAmis } from "./Amis";
import { PageClasses } from "./Classes";
import { Classement } from "./Classement";
import { Chrono } from "./communs";
import { useConfirmer } from "./Confirmer";
import { type GlobeRef } from "./Globe";
import { imageResultat, partagerImage } from "./partage";
import { ContenuOption, Invite } from "./Partie";
import { Salon } from "./Salon";
import { jouer, ressentir } from "./sons";
import { enLangue, localeDe } from "./traduction";
import { adresseInvitation } from "@/lib/monde/pages-publiques";

/*
 * Les duels : dix questions, les mêmes pour les deux joueurs, chacun à son rythme.
 * Une bonne réponse vaut 100 points, plus jusqu'à 50 pour la rapidité.
 *   • Contre un explorateur virtuel : toujours disponible, simulé sur l'appareil, et présenté comme tel ;
 *     la campagne les fait affronter dans l'ordre, du plus abordable au plus redoutable.
 *   • Contre un ami (un code à partager), en direct ou à distance (24 heures pour jouer), avec le
 *     nombre de questions et le temps de chacune au choix ; ou au hasard, contre un joueur de sa cote.
 *   • Un salon de trois à huit joueurs, classique ou à élimination.
 *   • Les amis (#duels/amis) et les classes (#duels/classes) ont leur page.
 */

const MODES: { id: ModeJeu; nom: string }[] = [
  { id: "melange", nom: "Tout mélangé" },
  ...CATEGORIES_CLASSIQUES.map((c) => ({ id: c as ModeJeu, nom: CATEGORIES[c].nom })),
];

export type Rencontre =
  | { sorte: "virtuel"; mode: ModeJeu; graine: number; explorateur: Explorateur }
  | { sorte: "en-ligne"; duel: EtatDuel };

async function appel(corps: Record<string, unknown>): Promise<EtatDuel | { erreur: string }> {
  try {
    const r = await fetch("/api/monde/duel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    const x = (await r.json()) as EtatDuel | { erreur: string };
    return r.ok ? x : { erreur: "erreur" in x ? x.erreur : "indisponible" };
  } catch {
    return { erreur: "reseau" };
  }
}

const NOMS_MODES: Record<ModeJeu, string> = { melange: "tout mélangé", drapeaux: "drapeaux", capitales: "capitales", cartes: "cartes", continents: "continents", monnaies: "monnaies" };

async function appelSalon(corps: Record<string, unknown>): Promise<EtatSalon | { erreur: string }> {
  try {
    const r = await fetch("/api/monde/salon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    const x = (await r.json()) as EtatSalon | { erreur: string };
    return r.ok ? x : { erreur: "erreur" in x ? x.erreur : "indisponible" };
  } catch {
    return { erreur: "reseau" };
  }
}

/** Où en est un duel à distance, pour moi. */
function tourDe(d: EtatDuel): "moi" | "lui" | "fini" | "expire" {
  if (d.etat === "fini" || d.etat === "abandon") return "fini";
  if (d.etat === "expire") return "expire";
  return d.moi.reponses.length < d.nombre ? "moi" : "lui";
}

const MESSAGES: Record<string, string> = {
  complet: "Ce salon est complet.",
  pas_assez: "Il faut trois joueurs au moins.",
  introuvable: "Aucun duel avec ce code. Vérifie les six caractères.",
  ferme: "Ce duel a déjà commencé ou a expiré. Demande un nouveau code.",
  trop_vite: "Un instant : réessaie dans deux secondes.",
  indisponible: "Les duels en ligne ne sont pas disponibles pour le moment.",
  deconnecte: "Connecte-toi avec ton compte Google pour jouer en ligne.",
  reseau: "Pas de réseau : vérifie ta connexion.",
  illisible: "Ce code n'est pas valide.",
};

export function Duels({ sous, onSous }: { sous: string | null; onSous: (id: string | null) => void }) {
  const t = useTextes("monde");
  const compte = useCompteMonde();
  const monde = useMonde();
  const [mode, setMode] = useState<ModeJeu>("melange");
  const [rencontre, setRencontre] = useState<Rencontre | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [cherche, setCherche] = useState(false);
  const [nombre, setNombre] = useState<number>(QUESTIONS_PAR_DUEL);
  const [duree, setDuree] = useState<number>(DUREE_QUESTION_DUEL);
  const [formule, setFormule] = useState<FormuleSalon>("classique");
  const [nombreSalon, setNombreSalon] = useState<number>(9);
  const [taille, setTaille] = useState<number>(8);
  const [codeSalon, setCodeSalon] = useState("");
  const [salon, setSalon] = useState<EtatSalon | null>(null);
  const [distants, setDistants] = useState<EtatDuel[] | null>(null);
  const [cote, setCote] = useState<number | null>(null);
  const enLigne = compte.connecte !== false && compte.enLigne !== false;
  const faits = Object.values(monde.niveaux).filter((n) => n.f).length;
  const vaincus = Math.min(CAMPAGNE.length, monde.records[CLE_CAMPAGNE] ?? 0);

  // Mes duels à distance et ma cote (rien si la base ne les connaît pas encore).
  const lireDistants = useCallback(async () => {
    try {
      const r = await fetch("/api/monde/duel?mes=1", { cache: "no-store" });
      if (!r.ok) return;
      const x = (await r.json()) as { duels: EtatDuel[]; cote: number | null };
      setDistants(x.duels);
      setCote(x.cote);
    } catch {
      // Hors connexion : la liste reviendra.
    }
  }, []);
  useEffect(() => {
    if (!enLigne || sous || rencontre || salon) return;
    const t0 = setTimeout(() => void lireDistants(), 0);
    return () => clearTimeout(t0);
  }, [enLigne, sous, rencontre, salon, lireDistants]);

  // Un lien de duel (#duels/duel=CODE), de salon (#duels/salon=CODE), de classe ou d'ami : on rejoint directement.
  useEffect(() => {
    const duel = /^duel=([A-Za-z2-9]{6})$/.exec(sous ?? "");
    const salonCode = /^salon=([A-Za-z2-9]{6})$/.exec(sous ?? "");
    const classe = /^classe=([A-Za-z2-9]{6})$/.exec(sous ?? "");
    const ami = /^ami=([A-Za-z2-9]{8})$/.exec(sous ?? "");
    if (!duel && !salonCode && !classe && !ami) return;
    void (async () => {
      if (duel) {
        const r = await appel({ action: "rejoindre", code: duel[1] });
        if ("erreur" in r) setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
        else setRencontre({ sorte: "en-ligne", duel: r });
        history.replaceState(null, "", "#duels");
      } else if (salonCode) {
        const r = await appelSalon({ action: "rejoindre", code: salonCode[1] });
        if ("erreur" in r) setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
        else setSalon(r);
        history.replaceState(null, "", "#duels");
      } else if (classe) {
        await fetch("/api/monde/classe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "rejoindre", code: classe[1] }) }).catch(() => null);
        onSous("classes");
      } else if (ami) {
        await fetch("/api/monde/amis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "ajouter", code: ami[1] }) }).catch(() => null);
        onSous("amis");
      }
    })();
  }, [sous, onSous]);

  /** Un duel à distance : je joue maintenant, puis j'envoie le lien ; l'autre a 24 heures. */
  const aDistance = async () => {
    setMessage(null);
    const r = await appel({ action: "ouvrir", mode, asynchrone: true, nombre, duree });
    if ("erreur" in r) setMessage(r.erreur === "indisponible" ? "Les duels à distance ouvrent très bientôt." : (MESSAGES[r.erreur] ?? MESSAGES.indisponible));
    else setRencontre({ sorte: "en-ligne", duel: r });
  };

  if (sous === "classement") return <Classement onRetour={() => onSous(null)} />;
  if (sous === "amis")
    return (
      <PageAmis
        onRetour={() => onSous(null)}
        onDefier={() => {
          onSous(null);
          void aDistance();
        }}
      />
    );
  if (sous === "classes") return <PageClasses onRetour={() => onSous(null)} />;

  const virtuel = (e: Explorateur) => setRencontre({ sorte: "virtuel", mode, graine: nouvelleGraine(), explorateur: e });
  const creer = async () => {
    setMessage(null);
    // Un duel réglé (le nombre de questions, leur temps) ; sans la base de la migration 018, le duel classique.
    let r = await appel({ action: "ouvrir", mode, asynchrone: false, nombre, duree });
    if ("erreur" in r && r.erreur === "indisponible") r = await appel({ action: "creer", mode });
    if ("erreur" in r) setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
    else setRencontre({ sorte: "en-ligne", duel: r });
  };
  const creerSalon = async () => {
    setMessage(null);
    const r = await appelSalon({ action: "creer", mode, formule, nombre: nombreSalon, taille });
    if ("erreur" in r) setMessage(r.erreur === "indisponible" ? "Les salons ouvrent très bientôt." : (MESSAGES[r.erreur] ?? MESSAGES.indisponible));
    else setSalon(r);
  };
  const rejoindreSalon = async () => {
    setMessage(null);
    const r = await appelSalon({ action: "rejoindre", code: codeSalon.trim().toUpperCase() });
    if ("erreur" in r) setMessage(r.erreur === "introuvable" ? "Aucun salon avec ce code." : r.erreur === "ferme" ? "Ce salon a déjà commencé." : (MESSAGES[r.erreur] ?? MESSAGES.indisponible));
    else setSalon(r);
  };
  const rejoindre = async () => {
    setMessage(null);
    const r = await appel({ action: "rejoindre", code: code.trim().toUpperCase() });
    if ("erreur" in r) setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
    else setRencontre({ sorte: "en-ligne", duel: r });
  };
  const auHasard = async () => {
    setMessage(null);
    setCherche(true);
    const r = await appel({ action: "hasard", mode });
    setCherche(false);
    if ("erreur" in r) setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
    else setRencontre({ sorte: "en-ligne", duel: r });
  };

  return (
    <div className="pt-duels">
      <header className="pt-section-tete">
        <div>
          <h2 className="pt-titre">{t("duels.titre")}</h2>
          <p className="pt-chapo">{t("duels.chapo")}</p>
        </div>
        <div className="pt-duels-liens">
          <button type="button" className="bouton bouton-discret" onClick={() => onSous("classement")}>
            <Trophy className="size-4" aria-hidden="true" />
            {t("classement.titre")}
          </button>
          <button type="button" className="bouton bouton-discret" onClick={() => onSous("amis")}>
            <Users className="size-4" aria-hidden="true" />
            Mes amis
          </button>
          <button type="button" className="bouton bouton-discret" onClick={() => onSous("classes")}>
            <GraduationCap className="size-4" aria-hidden="true" />
            Les classes
          </button>
        </div>
      </header>
      {cote !== null && (
        <p className="pt-cote">
          Ta cote : <strong>{cote}</strong>
          <small>Elle monte quand tu bats un joueur, d&apos;autant plus qu&apos;il est fort ; « au hasard », on te trouve un adversaire de ta cote.</small>
        </p>
      )}

      <fieldset className="pt-methodes">
        <legend>Les questions</legend>
        {MODES.map((m) => (
          <button key={m.id} type="button" className="pt-puce" aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>
            {m.nom}
          </button>
        ))}
      </fieldset>

      <fieldset className="pt-methodes pt-duel-reglages">
        <legend>Le duel entre amis</legend>
        <span className="pt-reglage-nom">Questions</span>
        {NOMBRES_DUEL.map((n) => (
          <button key={n} type="button" className="pt-puce" aria-pressed={nombre === n} onClick={() => setNombre(n)}>
            {n}
          </button>
        ))}
        <span className="pt-reglage-nom">Temps par question</span>
        {DUREES_DUEL.map((d) => (
          <button key={d} type="button" className="pt-puce" aria-pressed={duree === d} onClick={() => setDuree(d)}>
            {d / 1000} s
          </button>
        ))}
      </fieldset>

      {message && (
        <p className="pt-message" role="alert">
          {message}
        </p>
      )}

      <div className="pt-duel-choix">
        <section className="pt-duel-bloc" aria-labelledby="pt-duel-ami">
          <Users className="pt-duel-icone" aria-hidden="true" />
          <h3 id="pt-duel-ami">Défier un ami</h3>
          <p>Un code à six caractères : ton ami l&apos;entre, le duel commence. Ou à distance : tu joues maintenant, il a 24 heures pour jouer à son tour.</p>
          <div className="pt-outil-actions">
            <button type="button" className="bouton bouton-principal" onClick={creer} disabled={!enLigne}>
              <Link2 className="size-4" aria-hidden="true" />
              Créer un duel
            </button>
            <button type="button" className="bouton bouton-discret" onClick={aDistance} disabled={!enLigne}>
              <Clock className="size-4" aria-hidden="true" />
              À distance
            </button>
          </div>
          <form
            className="pt-code"
            onSubmit={(e) => {
              e.preventDefault();
              void rejoindre();
            }}
          >
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))} placeholder="CODE" aria-label="Le code du duel" disabled={!enLigne} autoComplete="off" spellCheck={false} />
            <button type="submit" className="bouton bouton-discret" disabled={!enLigne || code.length !== 6}>
              Rejoindre
            </button>
          </form>
        </section>
        <section className="pt-duel-bloc" aria-labelledby="pt-duel-hasard">
          <Globe2 className="pt-duel-icone" aria-hidden="true" />
          <h3 id="pt-duel-hasard">Adversaire au hasard</h3>
          <p>Un autre joueur connecté, sur les mêmes questions. Personne en vue ? Un explorateur virtuel prend le relais.</p>
          <button type="button" className="bouton bouton-principal" onClick={auHasard} disabled={!enLigne || cherche}>
            <Search className="size-4" aria-hidden="true" />
            {cherche ? "Recherche…" : "Trouver un adversaire"}
          </button>
        </section>
        <section className="pt-duel-bloc" aria-labelledby="pt-duel-salon">
          <Users className="pt-duel-icone" aria-hidden="true" />
          <h3 id="pt-duel-salon">Un salon de 3 à 8</h3>
          <p>Les mêmes questions pour tous. En classique, les points décident ; à élimination, le dernier sort toutes les trois questions.</p>
          <div className="pt-salon-reglages" role="group" aria-label="Le salon">
            <span className="pt-segments">
              <button type="button" aria-pressed={formule === "classique"} onClick={() => setFormule("classique")}>
                Classique
              </button>
              <button type="button" aria-pressed={formule === "elimination"} onClick={() => setFormule("elimination")}>
                Élimination
              </button>
            </span>
            <label>
              <span>Questions</span>
              <select value={nombreSalon} onChange={(e) => setNombreSalon(Number(e.target.value))}>
                {NOMBRES_SALON.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Joueurs au plus</span>
              <select value={taille} onChange={(e) => setTaille(Number(e.target.value))}>
                {Array.from({ length: TAILLE_SALON.max - TAILLE_SALON.min + 1 }, (_, i) => TAILLE_SALON.min + i).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" className="bouton bouton-principal" onClick={creerSalon} disabled={!enLigne}>
            <Users className="size-4" aria-hidden="true" />
            Ouvrir un salon
          </button>
          <form
            className="pt-code"
            onSubmit={(e) => {
              e.preventDefault();
              void rejoindreSalon();
            }}
          >
            <input value={codeSalon} onChange={(e) => setCodeSalon(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))} placeholder="CODE" aria-label="Le code du salon" disabled={!enLigne} autoComplete="off" spellCheck={false} />
            <button type="submit" className="bouton bouton-discret" disabled={!enLigne || codeSalon.length !== 6}>
              Rejoindre
            </button>
          </form>
        </section>
      </div>

      {distants && distants.length > 0 && (
        <section className="pt-distants" aria-labelledby="pt-distants-titre">
          <h3 id="pt-distants-titre" className="pt-sous-titre">
            <Clock className="mr-2 inline size-5 align-[-4px]" aria-hidden="true" />
            Mes duels à distance
          </h3>
          <ul className="pt-distants-liste">
            {distants.map((d) => {
              const tour = tourDe(d);
              return (
                <li key={d.id} data-tour={tour}>
                  <span className="pt-distants-texte">
                    <strong>{d.adversaire ? `Contre ${d.adversaire.nom}` : `En attente d'un adversaire (code ${d.code})`}</strong>
                    <small>
                      {NOMS_MODES[d.mode]}, {d.nombre} questions, {d.duree / 1000} s.{" "}
                      {tour === "moi"
                        ? d.moi.reponses.length
                          ? `À toi : ${d.moi.reponses.length} sur ${d.nombre} déjà jouées.`
                          : "À toi de jouer."
                        : tour === "lui"
                          ? d.adversaire
                            ? `Son tour : ${d.adversaire.nombre} sur ${d.nombre}.`
                            : "Envoie le lien à ton ami."
                          : tour === "fini"
                            ? `${d.resultat === "victoire" ? "Victoire" : d.resultat === "nul" ? "Égalité" : "Défaite"}, ${d.moi.points} contre ${d.adversaire?.points ?? 0}.`
                            : "Expiré : personne n'est venu."}
                    </small>
                  </span>
                  {tour !== "expire" && (
                    <button type="button" className={tour === "moi" ? "bouton bouton-principal" : "bouton bouton-discret"} onClick={() => setRencontre({ sorte: "en-ligne", duel: d })}>
                      {tour === "moi" ? "Jouer" : tour === "fini" ? "Voir" : d.adversaire ? "Suivre" : "Partager"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {!enLigne && (
        <p className="pt-astuce">
          {compte.connecte === false ? (
            <>
              <LogIn className="mr-1 inline size-4 align-[-3px]" aria-hidden="true" />
              Les duels en ligne demandent un compte Google connecté.
            </>
          ) : (
            "Les duels en ligne et le classement ouvrent très bientôt. Les explorateurs virtuels, eux, sont déjà là."
          )}
        </p>
      )}

      <section aria-labelledby="pt-explorateurs">
        <h3 id="pt-explorateurs" className="pt-sous-titre">
          <Bot className="mr-2 inline size-5 align-[-4px]" aria-hidden="true" />
          Les explorateurs virtuels
        </h3>
        <p className="pt-chapo">Des adversaires simulés sur ton appareil, qui portent le nom de grands géographes et voyageurs d&apos;autrefois.</p>
        <div className="pt-campagne" aria-label="La campagne des explorateurs">
          <div className="pt-campagne-texte">
            <p className="pt-campagne-titre">
              <IconeCarte className="size-5" aria-hidden="true" />
              La campagne
            </p>
            <p>
              {vaincus >= CAMPAGNE.length
                ? `Les ${CAMPAGNE.length} explorateurs sont vaincus : la campagne est gagnée.`
                : `Bats-les dans l'ordre, du plus abordable au plus redoutable : ${vaincus} sur ${CAMPAGNE.length}. Prochain : ${suivantCampagne(vaincus)!.nom}.`}
            </p>
            <span className="pt-campagne-piste" aria-hidden="true">
              {CAMPAGNE.map((e, i) => (
                <i key={e.id} data-vaincu={i < vaincus || undefined} data-prochain={i === vaincus || undefined} />
              ))}
            </span>
          </div>
          {vaincus < CAMPAGNE.length && (
            <button type="button" className="bouton bouton-principal" onClick={() => virtuel(suivantCampagne(vaincus)!)}>
              <Flag className="size-4" aria-hidden="true" />
              Affronter {suivantCampagne(vaincus)!.nom}
            </button>
          )}
        </div>
        <ul className="pt-explorateurs">
          {EXPLORATEURS.map((e) => (
            <li key={e.id} data-vaincu={CAMPAGNE.findIndex((x) => x.id === e.id) < vaincus || undefined}>
              <button type="button" className="pt-explorateur" onClick={() => virtuel(e)}>
                <span className="pt-explorateur-medaillon" aria-hidden="true">
                  <EmblemeExplorateur id={e.id} />
                  <span className="pt-explorateur-initiales">
                    {e.nom
                      .replace(/^Al-/, "")
                      .split(/\s+/)
                      .map((m) => m[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </span>
                <span className="pt-explorateur-texte">
                  <span className="pt-explorateur-nom">{e.nom}</span>
                  <span className="pt-explorateur-epoque">{e.epoque}</span>
                  <span className="pt-explorateur-bio">{e.bio}</span>
                </span>
                <span className="pt-force" aria-label={`Force ${e.force} sur 5`}>
                  {[1, 2, 3, 4, 5].map((k) => (
                    <i key={k} data-plein={k <= e.force || undefined} />
                  ))}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="bouton bouton-discret" onClick={() => virtuel(choisirExplorateur(faits, hasard(nouvelleGraine())))}>
          <Swords className="size-4" aria-hidden="true" />
          Un adversaire à ma mesure
        </button>
      </section>

      {salon && (
        <Salon
          key={salon.id}
          initial={salon}
          onFermer={() => {
            setSalon(null);
            void lireScore();
          }}
        />
      )}

      {rencontre && (
        <Duel
          key={rencontre.sorte === "virtuel" ? rencontre.graine : rencontre.duel.id}
          rencontre={rencontre}
          onFermer={() => {
            setRencontre(null);
            void lireScore();
          }}
          onRevanche={() => {
            if (rencontre.sorte === "virtuel") setRencontre({ ...rencontre, graine: nouvelleGraine() });
            else {
              const distance = rencontre.duel.asynchrone;
              setRencontre(null);
              void (distance ? aDistance() : creer());
            }
          }}
          onRemplacer={(e) => setRencontre({ sorte: "virtuel", mode: rencontre.sorte === "en-ligne" ? rencontre.duel.mode : rencontre.mode, graine: nouvelleGraine(), explorateur: e ?? choisirExplorateur(faits, hasard(nouvelleGraine())) })}
        />
      )}
    </div>
  );
}

/* =====================================================================
   Le duel lui-même
   ===================================================================== */

type Moi = { index: number; points: number; reponses: { i: number; j: boolean; p: number }[] };

function Duel({ rencontre, onFermer, onRevanche, onRemplacer }: { rencontre: Rencontre; onFermer: () => void; onRevanche: () => void; onRemplacer: (e?: Explorateur) => void }) {
  const virtuel = rencontre.sorte === "virtuel";
  const monde = useMonde();
  const [duel, setDuel] = useState<EtatDuel | null>(virtuel ? null : rencontre.duel);
  const mode = virtuel ? rencontre.mode : rencontre.duel.mode;
  const graine = virtuel ? rencontre.graine : rencontre.duel.graine;
  // Le nombre de questions et leur temps (un duel réglé), ou les dix de quinze secondes.
  const nombre = virtuel ? QUESTIONS_PAR_DUEL : rencontre.duel.nombre;
  const duree = virtuel ? DUREE_QUESTION_DUEL : rencontre.duel.duree;
  /** À distance : chacun joue quand il veut, dans les 24 heures. */
  const distance = !virtuel && rencontre.duel.asynchrone;
  // Les questions, et ce que fera l'explorateur virtuel à chacune (tiré d'avance, de la même graine).
  const [{ questions, coups }] = useState(() => {
    const qs = questionsDuel(graine, mode, nombre);
    return { questions: qs, coups: rencontre.sorte === "virtuel" ? qs.map((q, i) => jouerVirtuel(rencontre.explorateur, q, hasard(deriver(graine, 500 + i)))) : null };
  });
  // L'heure de départ, sur l'horloge de cet appareil (le serveur donne la sienne : on corrige l'écart).
  // À distance, on part dès qu'on ouvre le duel (s'il reste des questions à jouer).
  const [debut, setDebut] = useState<number | null>(() => {
    if (rencontre.sorte === "virtuel") return Date.now() + 3200;
    const d = rencontre.duel;
    if (d.asynchrone) return d.moi.reponses.length < d.nombre && (d.etat === "attente" || d.etat === "en_cours") ? Date.now() + 3200 : null;
    return d.etat === "en_cours" && d.debut ? d.debut - (d.maintenant - Date.now()) : null;
  });
  const [maintenant, setMaintenant] = useState(() => Date.now());
  // Un duel à distance repris en cours de route : on repart de la première question sans réponse.
  const [moi, setMoi] = useState<Moi>(() => {
    const deja = rencontre.sorte === "en-ligne" ? rencontre.duel.moi.reponses : [];
    return { index: deja.length, points: deja.reduce((s, x) => s + x.p, 0), reponses: deja.map((x) => ({ i: x.i, j: x.j, p: x.p })) };
  });
  const [choix, setChoix] = useState<string | null>(null);
  const [etape, setEtape] = useState<"question" | "reponse" | "fini" | null>(() => (rencontre.sorte === "en-ligne" && rencontre.duel.asynchrone && rencontre.duel.moi.reponses.length >= rencontre.duel.nombre ? "fini" : null));
  const [copie, setCopie] = useState(false);
  const [envoyee, setEnvoyee] = useState<Reaction | null>(null);
  const [vaincusAvant] = useState(() => monde.records[CLE_CAMPAGNE] ?? 0);
  const debutQuestion = useRef(0);
  const demarre = useRef(false);
  const derniereReaction = useRef(0);
  const dernierTic = useRef(0);
  const globe = useRef<GlobeRef>(null);
  const [confirmation, confirmer] = useConfirmer();
  const phase = etape ?? (debut ? "compte" : "attente");

  /* ---------- En ligne : relire l'état chaque seconde ---------- */
  const lire = useCallback(async () => {
    if (virtuel || !duel) return;
    try {
      const r = await fetch(`/api/monde/duel?id=${duel.id}`, { cache: "no-store" });
      if (!r.ok) return;
      const d = (await r.json()) as EtatDuel;
      setDuel(d);
      if (!d.asynchrone && d.etat === "en_cours" && d.debut) setDebut((avant) => avant ?? d.debut! - (d.maintenant - Date.now()));
    } catch {
      // Le réseau reviendra : on relira à la prochaine seconde.
    }
  }, [virtuel, duel]);
  useEffect(() => {
    if (virtuel || !duel || duel.etat === "fini" || duel.etat === "abandon" || duel.etat === "expire") return;
    // À distance, l'autre joue quand il veut : on relit moins souvent.
    const t = setInterval(lire, duel.asynchrone ? 3000 : duel.etat === "attente" ? 1500 : 1000);
    return () => clearInterval(t);
  }, [virtuel, duel, lire]);

  // L'horloge de l'écran : le compte à rebours, puis la progression de l'explorateur virtuel.
  useEffect(() => {
    if (etape === "fini" && !virtuel) return;
    const t = setInterval(() => {
      const n = Date.now();
      setMaintenant(n);
      // Le compte à rebours se fait entendre : trois, deux, un, partez.
      if (debut && n < debut) {
        const s = Math.ceil((debut - n) / 1000);
        if (s <= 3 && s !== dernierTic.current) {
          dernierTic.current = s;
          jouer("tic");
        }
      }
      if (debut && n >= debut && !demarre.current) {
        demarre.current = true;
        debutQuestion.current = n;
        setEtape("question");
        jouer("partez");
      }
    }, 200);
    return () => clearInterval(t);
  }, [etape, debut, virtuel]);

  /* ---------- Répondre ---------- */
  const q = questions[moi.index];
  const repondre = useCallback(
    async (reponse: string, ou?: { x: number; y: number }) => {
      if (etape !== "question" || !q) return;
      const ms = Date.now() - debutQuestion.current;
      const j = juger(q.type, q.cible, reponse);
      const juste = j !== "faux";
      const p = pointsReponse(juste, ms, duree);
      setChoix(reponse);
      setEtape("reponse");
      ressentir(juste ? "juste" : "faux");
      noterReponse(q.cible, categorieDe(q.type), juste);
      if (juste && ou && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) eclat(ou.x, ou.y, "ambre", 1);
      setMoi((m) => ({ index: m.index, points: m.points + p, reponses: [...m.reponses, { i: m.index, j: juste, p }] }));
      if (!virtuel && duel) {
        const r = await appel({ action: "repondre", id: duel.id, index: moi.index, reponse, ms });
        if (!("erreur" in r)) setDuel(r);
      }
    },
    [etape, q, virtuel, duel, moi.index, duree],
  );
  useEffect(() => {
    if (etape !== "reponse") return;
    const t = setTimeout(() => {
      setChoix(null);
      if (moi.index + 1 >= questions.length) {
        setMoi((m) => ({ ...m, index: questions.length }));
        setEtape("fini");
      } else {
        setMoi((m) => ({ ...m, index: m.index + 1 }));
        debutQuestion.current = Date.now();
        setEtape("question");
      }
    }, PAUSE_REPONSE);
    return () => clearTimeout(t);
  }, [etape, moi.index, questions.length]);
  // Le temps de la question.
  useEffect(() => {
    if (etape !== "question") return;
    const t = setTimeout(() => void repondre("__temps__"), duree);
    return () => clearTimeout(t);
  }, [etape, moi.index, repondre, duree]);

  /* ---------- L'adversaire ---------- */
  let adv: { nom: string; avatar: string; points: number; nombre: number; virtuel: boolean; elo?: number | null; reaction?: { r: Reaction; t: number } | null } | null = null;
  if (rencontre.sorte === "virtuel" && coups && debut) {
    // L'explorateur avance à son rythme : chaque réponse, plus la pause d'après.
    let t = debut;
    let repondues = 0;
    let points = 0;
    for (const c of coups) {
      t += c.ms;
      if (t > maintenant) break;
      repondues++;
      points += c.points;
      t += PAUSE_REPONSE;
    }
    adv = { nom: rencontre.explorateur.nom, avatar: "", points, nombre: repondues, virtuel: true };
  } else if (duel?.adversaire) adv = { ...duel.adversaire, virtuel: false };

  const advFini = adv ? adv.nombre >= nombre : false;
  const termine = virtuel ? etape === "fini" && advFini : duel ? duel.etat === "fini" || duel.etat === "abandon" : false;
  const expire = duel?.etat === "expire";
  const resultat: "victoire" | "defaite" | "nul" | null = virtuel ? (termine && adv ? (moi.points > adv.points ? "victoire" : moi.points < adv.points ? "defaite" : "nul") : null) : (duel?.resultat ?? null);

  // La campagne : battre l'explorateur qu'on attendait fait avancer d'un cran.
  const enCampagne = rencontre.sorte === "virtuel" && CAMPAGNE.findIndex((x) => x.id === rencontre.explorateur.id) === vaincusAvant;
  const avance = enCampagne && termine && resultat === "victoire";

  // La fin : la musique du résultat, le journal de bord, une pluie de lettres pour une victoire.
  const celebre = useRef(false);
  const nomAdversaire = adv?.nom ?? "";
  const justes = moi.reponses.filter((x) => x.j).length;
  const idDuelJournal = virtuel ? undefined : duel?.id;
  useEffect(() => {
    if (!termine || !resultat || celebre.current) return;
    celebre.current = true;
    ressentir(resultat === "victoire" ? "victoire" : resultat === "defaite" ? "defaite" : "niveau");
    noterJournal({ s: "duel", n: `Duel contre ${nomAdversaire || "un adversaire"}`, b: justes, q: nombre, x: 0, d: debut ? Math.min(3600, (Date.now() - debut) / 1000) : 0, r: resultat === "victoire" ? "v" : resultat === "defaite" ? "d" : "n", i: idDuelJournal });
    if (resultat === "victoire") {
      if (avance) battreRecordDe(CLE_CAMPAGNE, vaincusAvant + 1);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setTimeout(() => pluieDeLettres(document.querySelector(".pt-duel-resultat"), "aurore", "VICTOIRE"), 250);
    }
  }, [termine, resultat, avance, vaincusAvant, nomAdversaire, justes, nombre, debut, idDuelJournal]);

  // L'adversaire répond : une étincelle sur sa piste, un tintement discret.
  const advNombre = adv?.nombre ?? 0;
  const advVu = useRef(0);
  useEffect(() => {
    if (advNombre > advVu.current && advNombre > 0) jouer("adverse");
    advVu.current = advNombre;
  }, [advNombre]);


  // Quitter un duel en ligne en cours : c'est un abandon (on prévient). À distance, on reprendra plus tard.
  const quitter = async () => {
    if (!virtuel && duel && !duel.asynchrone && (duel.etat === "attente" || (duel.etat === "en_cours" && !termine))) {
      if (duel.etat === "en_cours" && !(await confirmer({ titre: "Quitter le duel ?", texte: "Quitter maintenant, c'est perdre le duel.", oui: "Quitter quand même", non: "Continuer", danger: true }))) return;
      await appel({ action: "quitter", id: duel.id });
    }
    onFermer();
  };

  // Le clavier : 1 à 4 pour choisir, Échap pour quitter.
  const clavier = useRef<(e: KeyboardEvent) => void>(() => undefined);
  useEffect(() => {
    clavier.current = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") {
        if (!document.querySelector(".pt-confirmer")) void quitter();
        return;
      }
      if (phase !== "question" || !q) return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) {
        const b = document.querySelectorAll<HTMLButtonElement>(".pt-duel .pt-choix .pt-option")[n - 1]?.getBoundingClientRect();
        void repondre(q.options[n - 1].id, b ? { x: b.left + b.width / 2, y: b.top + b.height / 2 } : undefined);
      }
    };
  });
  useEffect(() => {
    const f = (e: KeyboardEvent) => clavier.current(e);
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);

  /** Une réaction rapide (une toutes les trois secondes au plus). */
  const idDuel = duel?.id;
  const reagir = useCallback(
    async (r: Reaction) => {
      const t = Date.now();
      if (!idDuel || t - derniereReaction.current < 3000) return;
      derniereReaction.current = t;
      setEnvoyee(r);
      setTimeout(() => setEnvoyee(null), 2500);
      await fetch("/api/monde/duel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reagir", id: idDuel, reaction: r }) }).catch(() => null);
    },
    [idDuel],
  );
  // La dernière réaction de l'adversaire, montrée six secondes.
  const bulle = !virtuel && duel?.adversaire?.reaction && duel.maintenant - duel.adversaire.reaction.t < 6000 ? REACTIONS.find((x) => x.id === duel.adversaire!.reaction!.r)?.texte : null;

  const partagerResultat = async () => {
    const image = await imageResultat({
      verdict: resultat === "victoire" ? "Victoire !" : resultat === "nul" ? "Égalité" : "Défaite",
      sousTitre: `Duel${distance ? " à distance" : ""}, ${NOMS_MODES[mode]}, ${nombre} questions`,
      joueurs: [
        { nom: "Moi", points: moi.points, moi: true },
        { nom: adv?.nom ?? "Adversaire", points: adv?.points ?? 0 },
      ],
    });
    if (image) await partagerImage(image, "portulan-duel.png", `Mon duel au Portulan : ${moi.points} points contre ${adv?.points ?? 0}.`);
  };

  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = avant;
    };
  }, []);

  const lien = duel ? `${window.location.origin}${adresseInvitation("duel", duel.code)}` : "";
  const partager = async () => {
    try {
      if (navigator.share) await navigator.share({ title: enLangue("Un duel au Portulan"), text: enLangue(`Je te défie au Portulan ! Code : ${duel?.code}`), url: lien });
      else {
        await navigator.clipboard.writeText(lien);
        setCopie(true);
      }
    } catch {
      // Partage annulé.
    }
  };

  const contenu = (
    <div className="pt pt-partie pt-duel" data-accent="safran" role="dialog" aria-modal="true" aria-label="Duel">
      <div className="pt-partie-fond" aria-hidden="true" />
      <header className="pt-duel-tete">
        <button type="button" className="pt-icone" onClick={quitter} aria-label="Quitter le duel">
          <X className="size-5" aria-hidden="true" />
        </button>
        <Joueur nom="Toi" points={moi.points} nombre={moi.reponses.length} total={nombre} cote="gauche" elo={duel?.moi.elo ?? null} />
        <span className="pt-duel-contre" aria-hidden="true">
          <Swords className="size-5" />
        </span>
        <Joueur nom={adv?.nom ?? "…"} avatar={adv?.avatar} points={adv?.points ?? 0} nombre={adv?.nombre ?? 0} total={nombre} cote="droite" virtuel={adv?.virtuel} elo={adv?.elo ?? null} bulle={bulle} embleme={rencontre.sorte === "virtuel" ? rencontre.explorateur.id : undefined} />
      </header>

      {phase === "attente" && duel && !expire && (
        <div className="pt-intro">
          {duel.public ? (
            <>
              <p className="pt-intro-grade">Adversaire au hasard</p>
              <h2 className="pt-intro-titre">On cherche un adversaire…</h2>
              <Attente onTrop={() => onRemplacer()} />
            </>
          ) : (
            <>
              <p className="pt-intro-grade">
                Duel entre amis : {MODES.find((m) => m.id === duel.mode)?.nom.toLowerCase()}, {duel.nombre} questions de {duel.duree / 1000} secondes
              </p>
              <h2 className="pt-intro-titre">Ton code</h2>
              <p className="pt-duel-code" aria-label={`Code : ${duel.code.split("").join(" ")}`}>
                {duel.code}
              </p>
              <p className="pt-intro-regles">Ton ami ouvre Le Portulan, onglet Duels, et entre ce code. Le duel commence dès qu&apos;il arrive.</p>
              <div className="pt-fin-actions">
                <button type="button" className="bouton bouton-principal" onClick={partager}>
                  {copie ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
                  {copie ? "Lien copié" : "Partager le lien"}
                </button>
                <button
                  type="button"
                  className="bouton bouton-discret"
                  onClick={() => {
                    void navigator.clipboard?.writeText(duel.code);
                    setCopie(true);
                  }}
                >
                  <Copy className="size-4" aria-hidden="true" />
                  Copier le code
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {expire && (
        <div className="pt-intro">
          <h2 className="pt-intro-titre">Personne n&apos;est venu</h2>
          <p className="pt-intro-regles">Le duel a expiré. Tu peux affronter un explorateur virtuel en attendant.</p>
          <button type="button" className="bouton bouton-principal" onClick={() => onRemplacer()}>
            <Bot className="size-4" aria-hidden="true" />
            Affronter un explorateur virtuel
          </button>
        </div>
      )}

      {phase === "compte" && debut !== null && (
        <div className="pt-intro">
          {rencontre.sorte === "virtuel" && (
            <>
              <p className="pt-intro-grade">Explorateur virtuel du {rencontre.explorateur.epoque}</p>
              <h2 className="pt-intro-titre">{rencontre.explorateur.nom}</h2>
              <p className="pt-intro-regles">{rencontre.explorateur.bio}</p>
            </>
          )}
          <p className="pt-decompte" key={Math.ceil((debut - maintenant) / 1000)} aria-live="polite">
            {Math.max(1, Math.ceil((debut - maintenant) / 1000))}
          </p>
        </div>
      )}

      {(phase === "question" || phase === "reponse") && q && (
        <div className="pt-question" key={moi.index}>
          <p className="pt-consigne">
            <span className="pt-consigne-cat">
              {CATEGORIES[categorieDe(q.type)].nom}, {moi.index + 1}/{nombre}
            </span>
            {consigne(q)}
            {phase === "question" && <Chrono key={moi.index} duree={duree} cle={`d${moi.index}`} />}
          </p>
          <div className="pt-invite" data-sorte={TYPES[q.type].invite}>
            <Invite q={q} globe={globe} phase={phase} toucheGlobe={null} onToucher={() => undefined} />
          </div>
          <div className="pt-choix" data-sorte={TYPES[q.type].reponse} data-nb={q.options.length}>
            {q.options.map((o, i) => {
              const etat = phase === "reponse" ? (o.id === choix ? (juger(q.type, q.cible, o.id) === "faux" ? "faux" : "juste") : juger(q.type, q.cible, o.id) !== "faux" ? "attendu" : undefined) : undefined;
              return (
                <button
                  key={o.id}
                  type="button"
                  className="pt-option"
                  data-etat={etat}
                  disabled={phase !== "question"}
                  style={{ "--i": i } as React.CSSProperties}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    void repondre(o.id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
                  }}
                >
                  <span className="pt-option-touche" aria-hidden="true">
                    {i + 1}
                  </span>
                  <ContenuOption q={q} o={o} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === "fini" && !termine && !expire && !distance && (
        <div className="pt-intro">
          <h2 className="pt-intro-titre">{nombre === 10 ? "Dix réponses données" : `${nombre} réponses données`}</h2>
          <p className="pt-intro-regles">{adv ? `${adv.nom} termine ses questions…` : "On attend la fin du duel…"}</p>
          <span className="pt-attente-points" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      )}

      {phase === "fini" && !termine && !expire && distance && duel && (
        <div className="pt-intro">
          <p className="pt-intro-grade">Duel à distance</p>
          <h2 className="pt-intro-titre">{moi.points} points</h2>
          {duel.adversaire ? (
            <p className="pt-intro-regles">
              Ton score est enregistré. {duel.adversaire.nom} a jusqu&apos;à{" "}
              {new Intl.DateTimeFormat(localeDe(monde.profil.langue), { weekday: "long", hour: "2-digit", minute: "2-digit" }).format((duel.rejoint ?? duel.debut ?? duel.maintenant) + 86_400_000)} pour jouer : tu verras le résultat ici, dans tes duels à distance.
            </p>
          ) : (
            <>
              <p className="pt-intro-regles">Ton score est enregistré. Envoie le lien à ton ami : il a 24 heures pour relever le défi.</p>
              <p className="pt-duel-code" aria-label={`Code : ${duel.code.split("").join(" ")}`}>
                {duel.code}
              </p>
            </>
          )}
          <div className="pt-fin-actions">
            {!duel.adversaire && (
              <button type="button" className="bouton bouton-principal" onClick={partager}>
                {copie ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
                {copie ? "Lien copié" : "Envoyer le lien"}
              </button>
            )}
            <button type="button" className="bouton bouton-discret" onClick={onFermer}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {termine && (
        <div className="pt-fin pt-duel-resultat" data-reussi={resultat === "victoire" || undefined}>
          <h2 className="pt-fin-titre">{resultat === "victoire" ? "Victoire !" : resultat === "nul" ? "Égalité" : "Défaite"}</h2>
          <p className="pt-fin-sous">
            {moi.points} points contre {adv?.points ?? 0}.
            {!virtuel && duel && duel.moi.trophees > 0 ? ` +${duel.moi.trophees} trophées.` : ""}
            {virtuel ? " Un duel d'entraînement : les trophées se gagnent contre d'autres joueurs." : ""}
          </p>
          {avance && (
            <p className="pt-fin-sous pt-campagne-avance">
              Campagne : {rencontre.sorte === "virtuel" ? rencontre.explorateur.nom : ""} vaincu, {vaincusAvant + 1} sur {CAMPAGNE.length}.
              {suivantCampagne(vaincusAvant + 1) ? ` Prochain : ${suivantCampagne(vaincusAvant + 1)!.nom}.` : " La campagne est gagnée !"}
            </p>
          )}
          <ol className="pt-duel-recap" aria-label="Tes réponses">
            {questions.map((x, i) => {
              const r = moi.reponses[i];
              return (
                <li key={i} data-juste={r?.j || undefined}>
                  <span>{pays(x.cible).nom}</span>
                  <span className="tabular-nums">{r ? (r.j ? `+${r.p}` : "0") : "—"}</span>
                </li>
              );
            })}
          </ol>
          <div className="pt-fin-actions">
            <button type="button" className="bouton bouton-principal" onClick={onRevanche}>
              <Swords className="size-4" aria-hidden="true" />
              Revanche
            </button>
            <button type="button" className="bouton bouton-discret" onClick={partagerResultat}>
              <Share2 className="size-4" aria-hidden="true" />
              Partager
            </button>
            <button type="button" className="bouton bouton-discret" onClick={onFermer}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {!virtuel && duel?.adversaire && !expire && (
        <div className="pt-reactions" role="group" aria-label="Réagir">
          {REACTIONS.map((r) => (
            <button key={r.id} type="button" className="pt-puce" aria-pressed={envoyee === r.id} onClick={() => void reagir(r.id)}>
              {r.texte}
            </button>
          ))}
          <span className="sr-only" aria-live="polite">
            {envoyee ? `Envoyé : ${REACTIONS.find((x) => x.id === envoyee)?.texte}` : ""}
            {bulle ? ` ${adv?.nom} : ${bulle}` : ""}
          </span>
        </div>
      )}
      {confirmation}
    </div>
  );
  return createPortal(contenu, document.body);
}

/*
 * Les emblèmes des explorateurs : un objet de leur vie, frappé comme sur une médaille (jamais un
 * visage inventé). Le livre de l'historien, la jonque de l'amiral, les pas du grand voyageur…
 */
const EMBLEMES: Record<string, typeof Bot> = {
  polo: Scroll,
  masudi: BookOpen,
  zhenghe: Ship,
  pirireis: IconeCarte,
  ibnmajid: Compass,
  ibnbattuta: Footprints,
  biruni: Mountain,
  idrisi: Earth,
  ptolemee: DraftingCompass,
  ibnfadlan: Tent,
  ibnhawqal: Coins,
  bakri: Library,
  magellan: Sailboat,
  mercator: Navigation,
  humboldt: Sprout,
};

function EmblemeExplorateur({ id }: { id: string }) {
  const Embleme = EMBLEMES[id] ?? Compass;
  return <Embleme className="pt-explorateur-embleme" strokeWidth={1.5} />;
}

function Joueur({
  nom,
  avatar,
  points,
  nombre,
  total = QUESTIONS_PAR_DUEL,
  cote,
  virtuel,
  elo,
  bulle,
  embleme,
}: {
  nom: string;
  avatar?: string;
  points: number;
  nombre: number;
  total?: number;
  cote: "gauche" | "droite";
  virtuel?: boolean;
  elo?: number | null;
  bulle?: string | null;
  /** L'explorateur virtuel : son emblème à la place d'un visage. */
  embleme?: string;
}) {
  const Embleme = embleme ? EMBLEMES[embleme] : undefined;
  return (
    <div className="pt-joueur" data-cote={cote}>
      {bulle && (
        <span className="pt-joueur-bulle" aria-hidden="true">
          {bulle}
        </span>
      )}
      <span className="pt-joueur-avatar" aria-hidden="true" data-embleme={Embleme ? "" : undefined}>
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" referrerPolicy="no-referrer" />
        ) : Embleme ? (
          <Embleme className="size-5" strokeWidth={1.6} />
        ) : virtuel ? (
          <Bot className="size-5" />
        ) : (
          nom.slice(0, 1)
        )}
        {/* L'adversaire vient de répondre : une étincelle sur son médaillon. */}
        {cote === "droite" && nombre > 0 && <span key={nombre} className="pt-joueur-etincelle" />}
      </span>
      <span className="pt-joueur-texte">
        <span className="pt-joueur-nom">
          {nom}
          {virtuel && <span className="pt-virtuel">virtuel</span>}
        </span>
        <span className="pt-joueur-points tabular-nums">
          {points} pts
          {elo ? <span className="pt-joueur-cote"> cote {elo}</span> : null}
        </span>
        <span className="pt-joueur-piste" aria-label={`${nombre} réponses sur ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <i key={i} data-fait={i < nombre || undefined} />
          ))}
        </span>
      </span>
    </div>
  );
}

/** L'attente d'un adversaire au hasard : au bout de 30 secondes, on propose un explorateur virtuel. */
function Attente({ onTrop }: { onTrop: () => void }) {
  const [depuis] = useState(() => Date.now());
  const [t, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT(Math.floor((Date.now() - depuis) / 1000)), 500);
    return () => clearInterval(i);
  }, [depuis]);
  return (
    <>
      <span className="pt-attente-points" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <p className="pt-intro-regles" aria-live="polite">
        {t < 30 ? `${t} s… Garde cet écran ouvert.` : "Personne pour l'instant."}
      </p>
      {t >= 12 && (
        <button type="button" className="bouton bouton-discret" onClick={onTrop}>
          <Bot className="size-4" aria-hidden="true" />
          Jouer contre un explorateur virtuel
        </button>
      )}
    </>
  );
}
