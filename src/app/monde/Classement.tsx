"use client";

import { ArrowLeft, Crown, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatNombre } from "@/lib/monde/atlas";
import type { Classement as Donnees, PeriodeClassement } from "@/lib/monde/serveur";
import { useTextes } from "@/lib/modules/textes-client";

/*
 * Le classement du Portulan : l'XP du jour, de la semaine, de toujours, et les trophées des duels.
 * Seuls les comptes qui ont rejoint les classements y figurent (prénom, initiale, photo Google).
 */

const PERIODES: { id: PeriodeClassement; nom: string }[] = [
  { id: "jour", nom: "Aujourd'hui" },
  { id: "semaine", nom: "Cette semaine" },
  { id: "toujours", nom: "Depuis toujours" },
  { id: "trophees", nom: "Trophées" },
];

export function Classement({ onRetour }: { onRetour: () => void }) {
  const t = useTextes("monde");
  const [periode, setPeriode] = useState<PeriodeClassement>("semaine");
  const [donnees, setDonnees] = useState<Donnees | null>(null);
  const [etat, setEtat] = useState<"charge" | "pret" | "deconnecte" | "indisponible">("charge");
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(
    (p: PeriodeClassement) =>
      fetch(`/api/monde/classement?periode=${p}`, { cache: "no-store" })
        .then(async (r) => {
          if (r.status === 401) return setEtat("deconnecte");
          if (!r.ok) return setEtat("indisponible");
          setDonnees((await r.json()) as Donnees);
          setEtat("pret");
        })
        .catch(() => setEtat("indisponible")),
    [],
  );
  useEffect(() => {
    void charger(periode);
  }, [periode, charger]);

  const rejoindre = async (visible: boolean) => {
    setEnvoi(true);
    try {
      const r = await fetch("/api/monde/classement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visible }) });
      if (r.ok) await charger(periode);
    } finally {
      setEnvoi(false);
    }
  };

  const unite = periode === "trophees" ? "trophées" : "XP";
  const top = donnees?.top ?? [];
  const moi = donnees?.moi;
  return (
    <div className="pt-classement">
      <button type="button" className="pt-retour-lien" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Les duels
      </button>
      <header className="pt-section-tete">
        <div>
          <h2 className="pt-titre">{t("classement.titre")}</h2>
          <p className="pt-chapo">L&apos;XP se gagne à chaque bonne réponse (une fois par jour et par pays pour une même méthode) ; les trophées, en duel contre une autre personne.</p>
        </div>
      </header>
      <div className="pt-segments pt-periodes" role="tablist" aria-label="Période">
        {PERIODES.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={periode === p.id} onClick={() => setPeriode(p.id)}>
            {p.id === "trophees" && <Trophy className="size-4" aria-hidden="true" />}
            {p.nom}
          </button>
        ))}
      </div>

      {etat === "deconnecte" && <p className="pt-message">Connecte-toi avec ton compte Google pour voir le classement et y entrer.</p>}
      {etat === "indisponible" && <p className="pt-message">Le classement ouvre très bientôt. Tes bonnes réponses comptent déjà sur ton appareil.</p>}

      {etat === "pret" && donnees && (
        <>
          {moi && !moi.classement && (
            <div className="pt-rejoindre">
              <p>Tu n&apos;apparais pas dans les classements. En les rejoignant, les autres verront ton prénom, l&apos;initiale de ton nom et ta photo Google (le même choix vaut pour le vocabulaire du Truchement).</p>
              <button type="button" className="bouton bouton-principal" disabled={envoi} onClick={() => rejoindre(true)}>
                Rejoindre les classements
              </button>
            </div>
          )}
          {top.length === 0 ? (
            <p className="pt-message">Personne encore {periode === "jour" ? "aujourd'hui" : periode === "semaine" ? "cette semaine" : ""} : la première place est libre.</p>
          ) : (
            <>
              <ol className="pt-podium" aria-label="Les trois premiers">
                {top.slice(0, 3).map((l) => (
                  <li key={l.cle} data-rang={l.rang} data-moi={l.moi || undefined}>
                    <Avatar nom={l.nom} avatar={l.avatar} />
                    {l.rang === 1 && <Crown className="pt-couronne" aria-hidden="true" />}
                    <span className="pt-podium-nom">{l.nom}</span>
                    <span className="pt-podium-points tabular-nums">
                      {formatNombre(l.points)} {unite}
                    </span>
                    <span className="pt-podium-marche" aria-hidden="true">
                      {l.rang}
                    </span>
                  </li>
                ))}
              </ol>
              {top.length > 3 && (
                <ol className="pt-liste-classement" start={4}>
                  {top.slice(3).map((l) => (
                    <li key={l.cle} data-moi={l.moi || undefined}>
                      <span className="pt-rang tabular-nums">{l.rang}</span>
                      <Avatar nom={l.nom} avatar={l.avatar} />
                      <span className="pt-classement-nom">{l.nom}</span>
                      <span className="tabular-nums">
                        {formatNombre(l.points)} {unite}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
          {moi && (
            <p className="pt-ma-place">
              <span>{moi.rang ? `Ta place : ${moi.rang === 1 ? "1re" : `${moi.rang}e`} sur ${donnees.participants}.` : moi.classement ? "Pas encore classé sur cette période." : "Tu n'apparais pas dans les classements."}</span>
              <span>
                {formatNombre(moi.xp)} XP en tout, {moi.trophees} trophée{moi.trophees > 1 ? "s" : ""}, {moi.victoires} victoire{moi.victoires > 1 ? "s" : ""} en {moi.duels} duel{moi.duels > 1 ? "s" : ""}.
              </span>
              {moi.classement && (
                <button type="button" className="pt-lien" disabled={envoi} onClick={() => rejoindre(false)}>
                  Quitter les classements
                </button>
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Avatar({ nom, avatar }: { nom: string; avatar: string }) {
  return (
    <span className="pt-avatar" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : nom.slice(0, 1)}
    </span>
  );
}
