"use client";

import { ArrowLeft, Check, Copy, GraduationCap, School, Share2, UserMinus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Classe, MesClasses } from "@/lib/monde/social";
import { useConfirmer } from "./Confirmer";

/*
 * Les classes : l'enseignant crée sa classe et donne un code ; ses élèves la rejoignent ; il suit
 * leurs progrès (l'XP de la semaine, la justesse, la dernière activité). Un élève voit le classement
 * de sa classe, ses camarades par leur prénom.
 */

const fr = (n: number) => new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ");

async function envoyer(corps: Record<string, unknown>): Promise<(Classe & { erreur?: undefined }) | { ok: true; erreur?: undefined } | { erreur: string }> {
  try {
    const r = await fetch("/api/monde/classe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    const x = (await r.json()) as Classe | { ok: true } | { erreur: string };
    return r.ok ? (x as Classe | { ok: true }) : { erreur: "erreur" in x ? x.erreur : "indisponible" };
  } catch {
    return { erreur: "reseau" };
  }
}

const MESSAGES: Record<string, string> = {
  introuvable: "Aucune classe avec ce code. Vérifie les six caractères.",
  complet: "Cette classe est complète (deux cents élèves).",
  trop: "Tu animes déjà dix classes : c'est le maximum.",
  illisible: "Le nom de la classe doit compter de 2 à 60 caractères.",
  deconnecte: "Connecte-toi avec ton compte Google pour créer ou rejoindre une classe.",
  indisponible: "Les classes ouvrent très bientôt.",
  reseau: "Pas de réseau : vérifie ta connexion.",
};

/** « aujourd'hui », « hier », « il y a 5 jours ». */
function depuis(ms: number | null, maintenant: number): string {
  if (!ms) return "jamais";
  const jours = Math.floor((maintenant - ms) / 86_400_000);
  return jours <= 0 ? "aujourd'hui" : jours === 1 ? "hier" : `il y a ${jours} jours`;
}

type Tri = "semaine" | "xp" | "justesse" | "nom";

export function PageClasses({ onRetour }: { onRetour: () => void }) {
  const [mes, setMes] = useState<MesClasses | null>(null);
  const [ouverte, setOuverte] = useState<Classe | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [code, setCode] = useState("");
  const [tri, setTri] = useState<Tri>("semaine");
  const [copie, setCopie] = useState(false);
  const [maintenant, setMaintenant] = useState(0);
  const [confirmation, confirmer] = useConfirmer();

  const charger = useCallback(async () => {
    try {
      const r = await fetch("/api/monde/classe", { cache: "no-store" });
      const x = (await r.json()) as MesClasses | { erreur: string };
      if (!r.ok || "erreur" in x) return setErreur("erreur" in x ? x.erreur : "indisponible");
      setMes(x);
      setErreur(null);
      setMaintenant(Date.now());
    } catch {
      setErreur("reseau");
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void charger(), 0);
    return () => clearTimeout(t);
  }, [charger]);

  const ouvrir = useCallback(async (id: string) => {
    setMessage(null);
    try {
      const r = await fetch(`/api/monde/classe?id=${id}`, { cache: "no-store" });
      const x = (await r.json()) as Classe | { erreur: string };
      if (!r.ok || "erreur" in x) return setMessage(MESSAGES["erreur" in x ? x.erreur : "indisponible"] ?? MESSAGES.indisponible);
      setOuverte(x);
      setMaintenant(Date.now());
    } catch {
      setMessage(MESSAGES.reseau);
    }
  }, []);

  const lien = ouverte?.code ? `${typeof window !== "undefined" ? window.location.origin : ""}/monde#duels/classe=${ouverte.code}` : "";
  const partager = async () => {
    if (!ouverte?.code) return;
    try {
      if (navigator.share) await navigator.share({ title: `La classe ${ouverte.nom}`, text: `Rejoins la classe « ${ouverte.nom} » au Portulan : le code est ${ouverte.code}.`, url: lien });
      else {
        await navigator.clipboard.writeText(lien);
        setCopie(true);
      }
    } catch {
      // Partage annulé.
    }
  };

  if (ouverte) {
    const membres = [...ouverte.membres].sort((a, b) =>
      tri === "nom" ? a.nom.localeCompare(b.nom, "fr") : tri === "xp" ? b.xp - a.xp : tri === "justesse" ? b.bonnes / Math.max(1, b.reponses) - a.bonnes / Math.max(1, a.reponses) : b.semaine - a.semaine,
    );
    return (
      <div className="pt-classes">
        <button type="button" className="pt-retour-lien" onClick={() => setOuverte(null)}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Mes classes
        </button>
        <header className="pt-section-tete">
          <div>
            <h2 className="pt-titre">{ouverte.nom}</h2>
            <p className="pt-chapo">{ouverte.proprietaire ? `${ouverte.membres.length} élève${ouverte.membres.length > 1 ? "s" : ""}. Donne le code pour qu'ils te rejoignent.` : `La classe de ${ouverte.enseignant}.`}</p>
          </div>
        </header>
        {message && (
          <p className="pt-message" role="status">
            {message}
          </p>
        )}
        {ouverte.proprietaire && (
          <section className="pt-duel-bloc pt-classe-code" aria-label="Le code de la classe">
            <p className="pt-duel-code">{ouverte.code}</p>
            <div className="pt-outil-actions">
              <button type="button" className="bouton bouton-principal" onClick={partager}>
                {copie ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
                {copie ? "Lien copié" : "Partager le lien"}
              </button>
              <button
                type="button"
                className="bouton bouton-discret"
                onClick={() => {
                  void navigator.clipboard?.writeText(ouverte.code);
                  setCopie(true);
                }}
              >
                <Copy className="size-4" aria-hidden="true" />
                Copier le code
              </button>
            </div>
          </section>
        )}
        <div className="pt-amis-entete">
          <h3 className="pt-sous-titre">{ouverte.proprietaire ? "Les élèves" : "Le classement de la classe"}</h3>
          <div className="pt-segments" role="group" aria-label="Classer par">
            {(
              [
                ["semaine", "Cette semaine"],
                ["xp", "Depuis le début"],
                ["justesse", "Justesse"],
                ["nom", "Nom"],
              ] as const
            ).map(([id, n]) => (
              <button key={id} type="button" aria-pressed={tri === id} onClick={() => setTri(id)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        {membres.length === 0 ? (
          <p className="pt-astuce">Personne encore : partage le code avec tes élèves.</p>
        ) : (
          <ol className="pt-amis-classement pt-classe-membres">
            {membres.map((m, i) => (
              <li key={m.id} data-moi={m.moi || undefined}>
                <span className="pt-amis-rang">{tri === "nom" ? "" : i + 1}</span>
                <span className="pt-joueur-avatar" aria-hidden="true">
                  {m.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatar} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    m.nom.slice(0, 1)
                  )}
                </span>
                <span className="pt-amis-nom">
                  {m.nom}
                  <small>
                    {fr(m.semaine)} XP cette semaine, {fr(m.xp)} en tout
                    {m.reponses ? `, ${Math.round((100 * m.bonnes) / m.reponses)} % de bonnes réponses` : ""}
                    {ouverte.proprietaire ? `, actif ${depuis(m.actif, maintenant)}` : ""}
                  </small>
                </span>
                {ouverte.proprietaire && (
                  <button
                    type="button"
                    className="pt-icone"
                    aria-label={`Retirer de la classe : ${m.nom}`}
                    onClick={async () => {
                      if (!(await confirmer({ titre: `Retirer ${m.nom} de la classe ?`, texte: "Ses progrès restent les siens : seule la classe le perd de vue.", oui: "Retirer", danger: true }))) return;
                      const r = await envoyer({ action: "quitter", id: ouverte.id, membre: m.id });
                      if (r.erreur) setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
                      await ouvrir(ouverte.id);
                    }}
                  >
                    <UserMinus className="size-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
        <div className="pt-outil-actions pt-classe-fin">
          <button
            type="button"
            className="bouton bouton-discret"
            onClick={async () => {
              const prof = ouverte.proprietaire;
              if (!(await confirmer(prof ? { titre: `Fermer la classe « ${ouverte.nom} » ?`, texte: "Les élèves la perdront de vue ; leurs progrès restent les leurs.", oui: "Fermer la classe", danger: true } : { titre: `Quitter la classe « ${ouverte.nom} » ?`, oui: "Quitter", danger: true }))) return;
              const r = await envoyer({ action: "quitter", id: ouverte.id });
              if (r.erreur) return setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
              setOuverte(null);
              await charger();
            }}
          >
            {ouverte.proprietaire ? "Fermer la classe" : "Quitter la classe"}
          </button>
        </div>
        {confirmation}
      </div>
    );
  }

  return (
    <div className="pt-classes">
      <button type="button" className="pt-retour-lien" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Les duels
      </button>
      <header className="pt-section-tete">
        <div>
          <h2 className="pt-titre">Les classes</h2>
          <p className="pt-chapo">Un enseignant ouvre une classe, ses élèves la rejoignent avec un code, et chacun voit les progrès de la semaine.</p>
        </div>
      </header>
      {erreur ? (
        <p className="pt-message" role="alert">
          {MESSAGES[erreur] ?? MESSAGES.indisponible}
        </p>
      ) : (
        <>
          {message && (
            <p className="pt-message" role="status">
              {message}
            </p>
          )}
          <div className="pt-amis-haut">
            <section className="pt-duel-bloc" aria-labelledby="pt-classe-creer">
              <GraduationCap className="pt-duel-icone" aria-hidden="true" />
              <h3 id="pt-classe-creer">J&apos;enseigne</h3>
              <p>Ouvre une classe : tu suivras l&apos;XP de chaque élève, sa justesse et sa dernière activité.</p>
              <form
                className="pt-code"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setMessage(null);
                  const r = await envoyer({ action: "creer", nom });
                  if (r.erreur) return setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
                  setNom("");
                  if ("membres" in r) setOuverte(r);
                  await charger();
                }}
              >
                <input data-texte value={nom} onChange={(e) => setNom(e.target.value.slice(0, 60))} placeholder="Le nom de la classe" aria-label="Le nom de la classe" autoComplete="off" />
                <button type="submit" className="bouton bouton-discret" disabled={nom.trim().length < 2}>
                  Créer
                </button>
              </form>
            </section>
            <section className="pt-duel-bloc" aria-labelledby="pt-classe-rejoindre">
              <School className="pt-duel-icone" aria-hidden="true" />
              <h3 id="pt-classe-rejoindre">J&apos;apprends</h3>
              <p>Entre le code que t&apos;a donné ton enseignant.</p>
              <form
                className="pt-code"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setMessage(null);
                  const r = await envoyer({ action: "rejoindre", code });
                  if (r.erreur) return setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
                  setCode("");
                  if ("membres" in r) setOuverte(r);
                  await charger();
                }}
              >
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6))} placeholder="CODE" aria-label="Le code de la classe" autoComplete="off" spellCheck={false} />
                <button type="submit" className="bouton bouton-discret" disabled={code.length !== 6}>
                  Rejoindre
                </button>
              </form>
            </section>
          </div>
          {mes && (mes.miennes.length > 0 || mes.suivies.length > 0) && (
            <section className="pt-amis-section" aria-labelledby="pt-mes-classes">
              <h3 id="pt-mes-classes" className="pt-sous-titre">
                Mes classes
              </h3>
              <ul className="pt-classes-liste">
                {mes.miennes.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => void ouvrir(c.id)}>
                      <GraduationCap className="size-5" aria-hidden="true" />
                      <span>
                        <strong>{c.nom}</strong>
                        <small>
                          Je l&apos;anime, {c.membres} élève{c.membres > 1 ? "s" : ""}, code {c.code}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
                {mes.suivies.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => void ouvrir(c.id)}>
                      <School className="size-5" aria-hidden="true" />
                      <span>
                        <strong>{c.nom}</strong>
                        <small>La classe de {c.enseignant}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      {confirmation}
    </div>
  );
}
