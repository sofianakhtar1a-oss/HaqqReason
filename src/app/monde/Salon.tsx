"use client";

import { Check, Crown, Share2, Swords, Users, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { eclat } from "@/lib/langues/feux";
import { pays } from "@/lib/monde/atlas";
import { CATEGORIES, type ModeJeu, TYPES } from "@/lib/monde/categories";
import { DUREE_SALON, PAS_ELIMINATION, PAUSE_REPONSE, pointsReponse } from "@/lib/monde/duels";
import { noterJournal, noterReponse } from "@/lib/monde/progression";
import { categorieDe, consigne, juger, questionsDuel } from "@/lib/monde/quiz";
import type { EtatSalon } from "@/lib/monde/social";
import { Chrono } from "./communs";
import { useConfirmer } from "./Confirmer";
import { type GlobeRef } from "./Globe";
import { imageResultat, partagerImage } from "./partage";
import { ContenuOption, Invite } from "./Partie";
import { jouer, ressentir } from "./sons";
import { enLangue } from "./traduction";
import { adresseInvitation } from "@/lib/monde/pages-publiques";

/*
 * Un salon : de trois à huit joueurs sur les mêmes questions. L'hôte lance la partie quand tout le
 * monde est là. En classique, les points décident ; à élimination, le dernier sort toutes les trois
 * questions. Le serveur juge chaque réponse ; on relit l'état du salon chaque seconde.
 */

const NOMS_MODES: Record<ModeJeu, string> = { melange: "tout mélangé", drapeaux: "drapeaux", capitales: "capitales", cartes: "cartes", continents: "continents", monnaies: "monnaies" };

async function appel(corps: Record<string, unknown>): Promise<EtatSalon | { erreur: string } | { ok: true }> {
  try {
    const r = await fetch("/api/monde/salon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    const x = (await r.json()) as EtatSalon | { erreur: string } | { ok: true };
    return r.ok ? x : { erreur: "erreur" in x ? x.erreur : "indisponible" };
  } catch {
    return { erreur: "reseau" };
  }
}

export function Salon({ initial, onFermer }: { initial: EtatSalon; onFermer: () => void }) {
  const [salon, setSalon] = useState<EtatSalon>(initial);
  const [questions] = useState(() => questionsDuel(initial.graine, initial.mode, initial.nombre));
  const [debut, setDebut] = useState<number | null>(() => (initial.etat === "en_cours" && initial.debut ? initial.debut - (initial.maintenant - Date.now()) : null));
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [index, setIndex] = useState(initial.reponses.length);
  const [etape, setEtape] = useState<"question" | "reponse" | null>(null);
  const [choix, setChoix] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  const debutQuestion = useRef(0);
  const dernierTic = useRef(0);
  const globe = useRef<GlobeRef>(null);
  const [confirmation, confirmer] = useConfirmer();

  const moi = salon.joueurs.find((j) => j.moi);
  const fini = salon.etat === "fini" || salon.etat === "expire";
  const elimine = moi?.elimine !== null && moi?.elimine !== undefined && index >= moi.elimine;
  const q = questions[index];

  // Relire le salon chaque seconde (deux en attendant les joueurs), jusqu'à la fin.
  const lire = useCallback(async () => {
    try {
      const r = await fetch(`/api/monde/salon?id=${salon.id}`, { cache: "no-store" });
      if (!r.ok) return;
      const s = (await r.json()) as EtatSalon;
      setSalon(s);
      if (s.etat === "en_cours" && s.debut) setDebut((avant) => avant ?? s.debut! - (s.maintenant - Date.now()));
    } catch {
      // On relira à la prochaine seconde.
    }
  }, [salon.id]);
  useEffect(() => {
    if (fini) return;
    const t = setInterval(lire, salon.etat === "attente" ? 2000 : 1000);
    return () => clearInterval(t);
  }, [lire, fini, salon.etat]);

  // L'horloge : le compte à rebours, puis la première question.
  useEffect(() => {
    if (!debut || etape) return;
    const t = setInterval(() => {
      const n = Date.now();
      setMaintenant(n);
      if (n < debut) {
        const s = Math.ceil((debut - n) / 1000);
        if (s <= 3 && s !== dernierTic.current) {
          dernierTic.current = s;
          jouer("tic");
        }
      }
      if (n >= debut) {
        debutQuestion.current = n;
        setEtape("question");
        jouer("partez");
      }
    }, 200);
    return () => clearInterval(t);
  }, [debut, etape]);

  // La fin du salon : la musique du rang, et le journal de bord.
  const rangFinal = salon.etat === "fini" ? (moi?.rang ?? null) : null;
  const justesSalon = moi?.justes ?? 0;
  const salue = useRef(false);
  useEffect(() => {
    if (rangFinal === null || salue.current) return;
    salue.current = true;
    ressentir(rangFinal === 1 ? "victoire" : rangFinal <= 3 ? "niveau" : "defaite");
    noterJournal({ s: "salon", n: `Salon de ${salon.joueurs.length} : ${rangFinal}${rangFinal === 1 ? "er" : "e"}`, b: justesSalon, q: salon.nombre, x: 0, d: 0, r: rangFinal === 1 ? "v" : "d", i: salon.id });
  }, [rangFinal, justesSalon, salon.joueurs.length, salon.nombre, salon.id]);


  const repondre = useCallback(
    async (reponse: string, ou?: { x: number; y: number }) => {
      if (etape !== "question" || !q || elimine) return;
      const ms = Date.now() - debutQuestion.current;
      const juste = juger(q.type, q.cible, reponse) !== "faux";
      setChoix(reponse);
      setEtape("reponse");
      ressentir(juste ? "juste" : "faux");
      noterReponse(q.cible, categorieDe(q.type), juste);
      if (juste && ou && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) eclat(ou.x, ou.y, "ambre", 1);
      const r = await appel({ action: "repondre", id: salon.id, index, reponse, ms });
      if ("id" in r) setSalon(r);
    },
    [etape, q, elimine, salon.id, index],
  );
  // Le clavier : 1 à 4 pour choisir.
  const clavier = useRef<(e: KeyboardEvent) => void>(() => undefined);
  useEffect(() => {
    clavier.current = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || etape !== "question" || !q) return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) {
        const b = document.querySelectorAll<HTMLButtonElement>(".pt-salon .pt-choix .pt-option")[n - 1]?.getBoundingClientRect();
        void repondre(q.options[n - 1].id, b ? { x: b.left + b.width / 2, y: b.top + b.height / 2 } : undefined);
      }
    };
  });
  useEffect(() => {
    const f = (e: KeyboardEvent) => clavier.current(e);
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);

  // La pause d'après la réponse, puis la question suivante.
  useEffect(() => {
    if (etape !== "reponse") return;
    const t = setTimeout(() => {
      setChoix(null);
      setIndex((i) => i + 1);
      debutQuestion.current = Date.now();
      setEtape("question");
    }, PAUSE_REPONSE);
    return () => clearTimeout(t);
  }, [etape]);
  // Le temps de la question.
  useEffect(() => {
    if (etape !== "question" || !q || elimine) return;
    const t = setTimeout(() => void repondre("__temps__"), DUREE_SALON);
    return () => clearTimeout(t);
  }, [etape, index, q, elimine, repondre]);

  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = avant;
    };
  }, []);

  const quitter = async () => {
    if (!fini && salon.etat === "en_cours" && !elimine && index < questions.length) {
      if (!(await confirmer({ titre: "Quitter le salon ?", texte: "Partir en cours de route, c'est être éliminé tout de suite.", oui: "Quitter", danger: true }))) return;
    }
    if (!fini) await appel({ action: "quitter", id: salon.id });
    onFermer();
  };

  const lien = `${window.location.origin}${adresseInvitation("salon", salon.code)}`;
  const partager = async () => {
    try {
      if (navigator.share) await navigator.share({ title: enLangue("Un salon au Portulan"), text: enLangue(`Rejoins mon salon au Portulan ! Code : ${salon.code}`), url: lien });
      else {
        await navigator.clipboard.writeText(lien);
        setCopie(true);
      }
    } catch {
      // Partage annulé.
    }
  };

  const lancer = async () => {
    setMessage(null);
    const r = await appel({ action: "lancer", id: salon.id });
    if ("erreur" in r) setMessage(r.erreur === "pas_assez" ? "Il faut trois joueurs au moins pour lancer le salon." : "Le salon n'a pas pu partir : réessaie.");
    else if ("id" in r) {
      setSalon(r);
      if (r.debut) setDebut(r.debut - (r.maintenant - Date.now()));
    }
  };

  const partagerResultat = async () => {
    const rang = moi?.rang ?? null;
    const image = await imageResultat({
      verdict: rang === 1 ? "Victoire !" : rang ? `${rang}e sur ${salon.joueurs.length}` : "Salon",
      sousTitre: `Salon ${salon.formule === "elimination" ? "à élimination" : "classique"}, ${NOMS_MODES[salon.mode]}, ${salon.nombre} questions`,
      joueurs: salon.joueurs.slice(0, 6).map((j) => ({ nom: j.nom, points: j.points, moi: j.moi })),
    });
    if (image) await partagerImage(image, "portulan-salon.png", "Mon salon au Portulan");
  };

  const classes = [...salon.joueurs].sort((a, b) => (fini ? (a.rang ?? 99) - (b.rang ?? 99) : b.points - a.points));
  const prochaineElimination = salon.formule === "elimination" ? Math.ceil((index + 1) / PAS_ELIMINATION) * PAS_ELIMINATION : null;

  const contenu = (
    <div className="pt pt-partie pt-duel pt-salon" data-accent="safran" role="dialog" aria-modal="true" aria-label="Salon">
      <div className="pt-partie-fond" aria-hidden="true" />
      <header className="pt-duel-tete">
        <button type="button" className="pt-icone" onClick={quitter} aria-label="Quitter le salon">
          <X className="size-5" aria-hidden="true" />
        </button>
        <p className="pt-salon-titre">
          <Users className="size-5" aria-hidden="true" />
          Salon {salon.formule === "elimination" ? "à élimination" : "classique"}, {NOMS_MODES[salon.mode]}
        </p>
      </header>

      <div className="pt-salon-corps">
        <ol className="pt-salon-joueurs" aria-label="Les joueurs">
          {classes.map((j, i) => (
            <li key={j.cle} data-moi={j.moi || undefined} data-elimine={j.elimine !== null || undefined}>
              <span className="pt-amis-rang">{fini ? (j.rang ?? "") : i + 1}</span>
              <span className="pt-joueur-avatar" aria-hidden="true">
                {j.nom.slice(0, 1)}
              </span>
              <span className="pt-amis-nom">
                <span>
                  {j.nom}
                  {j.hote && <Crown className="pt-salon-hote size-3.5" aria-label="hôte" />}
                </span>
                <small>{j.elimine !== null ? (j.elimine === 0 ? "parti" : `éliminé à la question ${j.elimine}`) : salon.etat === "attente" ? "prêt" : `${j.nombre}/${salon.nombre} réponses, ${j.justes} justes`}</small>
              </span>
              <span className="pt-amis-valeur tabular-nums">{j.points} pts</span>
            </li>
          ))}
        </ol>

        <div className="pt-salon-scene">
          {message && (
            <p className="pt-message" role="alert">
              {message}
            </p>
          )}
          {salon.etat === "attente" && (
            <div className="pt-intro">
              <p className="pt-intro-grade">
                {salon.joueurs.length} joueur{salon.joueurs.length > 1 ? "s" : ""} sur {salon.taille} au plus
              </p>
              <h2 className="pt-intro-titre">Le code du salon</h2>
              <p className="pt-duel-code" aria-label={`Code : ${salon.code.split("").join(" ")}`}>
                {salon.code}
              </p>
              <p className="pt-intro-regles">
                Chacun ouvre Le Portulan, onglet Duels, et entre ce code.{" "}
                {salon.formule === "elimination" ? `Toutes les ${PAS_ELIMINATION} questions, le dernier sort.` : "Les points décident."} {salon.nombre} questions de quinze secondes.
              </p>
              <div className="pt-fin-actions">
                <button type="button" className="bouton bouton-discret" onClick={partager}>
                  {copie ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
                  {copie ? "Lien copié" : "Partager le lien"}
                </button>
                {salon.createur ? (
                  <button type="button" className="bouton bouton-principal" onClick={lancer} disabled={salon.joueurs.length < 3}>
                    <Swords className="size-4" aria-hidden="true" />
                    {salon.joueurs.length < 3 ? "Il faut trois joueurs" : "Lancer la partie"}
                  </button>
                ) : (
                  <p className="pt-astuce">L&apos;hôte lance la partie quand tout le monde est là.</p>
                )}
              </div>
            </div>
          )}

          {salon.etat === "en_cours" && !etape && debut !== null && (
            <div className="pt-intro">
              <p className="pt-decompte" key={Math.ceil((debut - maintenant) / 1000)} aria-live="polite">
                {Math.max(1, Math.ceil((debut - maintenant) / 1000))}
              </p>
            </div>
          )}

          {!fini && (etape === "question" || etape === "reponse") && q && !elimine && (
            <div className="pt-question" key={index}>
              <p className="pt-consigne">
                <span className="pt-consigne-cat">
                  {CATEGORIES[categorieDe(q.type)].nom}, {index + 1}/{salon.nombre}
                  {prochaineElimination && prochaineElimination < salon.nombre ? `, élimination après la ${prochaineElimination}e` : ""}
                </span>
                {consigne(q)}
                {etape === "question" && <Chrono key={index} duree={DUREE_SALON} cle={`s${index}`} />}
              </p>
              <div className="pt-invite" data-sorte={TYPES[q.type].invite}>
                <Invite q={q} globe={globe} phase={etape} toucheGlobe={null} onToucher={() => undefined} />
              </div>
              <div className="pt-choix" data-sorte={TYPES[q.type].reponse} data-nb={q.options.length}>
                {q.options.map((o, i) => {
                  const etat = etape === "reponse" ? (o.id === choix ? (juger(q.type, q.cible, o.id) === "faux" ? "faux" : "juste") : juger(q.type, q.cible, o.id) !== "faux" ? "attendu" : undefined) : undefined;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      className="pt-option"
                      data-etat={etat}
                      disabled={etape !== "question"}
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

          {!fini && salon.etat === "en_cours" && (elimine || index >= questions.length) && (
            <div className="pt-intro">
              <h2 className="pt-intro-titre">{elimine ? "Éliminé" : "Tes réponses sont données"}</h2>
              <p className="pt-intro-regles">{elimine ? "Tu peux suivre la fin du salon : le classement se met à jour à chaque réponse." : "On attend les autres joueurs…"}</p>
              <span className="pt-attente-points" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
          )}

          {fini && (
            <div className="pt-fin pt-duel-resultat" data-reussi={moi?.rang === 1 || undefined}>
              <h2 className="pt-fin-titre">{salon.etat === "expire" ? "Le salon a expiré" : moi?.rang === 1 ? "Victoire !" : moi?.rang ? `${moi.rang}e sur ${salon.joueurs.length}` : "Fin du salon"}</h2>
              {salon.etat === "fini" && <p className="pt-fin-sous">{moi?.rang && moi.rang <= 3 ? `+${[15, 8, 4][moi.rang - 1]} trophées.` : "Les trois premiers gagnent des trophées : 15, 8 et 4."}</p>}
              {salon.etat === "fini" && (
                <ol className="pt-duel-recap" aria-label="Tes réponses">
                  {questions.map((x, i) => {
                    const r = salon.reponses[i];
                    return (
                      <li key={i} data-juste={r?.j || undefined}>
                        <span>{pays(x.cible).nom}</span>
                        <span className="tabular-nums">{r ? (r.j ? `+${r.p || pointsReponse(true, DUREE_SALON, DUREE_SALON)}` : "0") : "—"}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
              <div className="pt-fin-actions">
                {salon.etat === "fini" && (
                  <button type="button" className="bouton bouton-principal" onClick={partagerResultat}>
                    <Share2 className="size-4" aria-hidden="true" />
                    Partager le résultat
                  </button>
                )}
                <button type="button" className="bouton bouton-discret" onClick={onFermer}>
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {confirmation}
    </div>
  );
  return createPortal(contenu, document.body);
}
