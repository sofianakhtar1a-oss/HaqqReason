"use client";

import { Bell, BellOff, BellRing, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { modifierPreferences } from "@/lib/atelier/preferences";
import type { RappelEcriture } from "@/lib/atelier/rappels";
import { activerNotifications, etatNotifications, type EtatNotifications } from "@/lib/client/notifications-push";
import { installer, useInstallation } from "@/lib/client/installation";
import { usePreferences } from "../crochets";

const JOURS = [
  { n: 1, court: "L", long: "lundi" },
  { n: 2, court: "M", long: "mardi" },
  { n: 3, court: "M", long: "mercredi" },
  { n: 4, court: "J", long: "jeudi" },
  { n: 5, court: "V", long: "vendredi" },
  { n: 6, court: "S", long: "samedi" },
  { n: 0, court: "D", long: "dimanche" },
];

const fuseauIci = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};

const ETATS: Record<EtatNotifications, string> = {
  actif: "Cet appareil reçoit les notifications du site.",
  inactif: "Cet appareil ne reçoit pas encore les notifications.",
  refuse: "Les notifications sont refusées pour ce site : rouvre-les dans les réglages du navigateur.",
  impossible: "Ce navigateur ne reçoit pas de notifications. Sur iPhone, ajoute d'abord le site à l'écran d'accueil.",
  bientot: "Les notifications du site ne sont pas encore ouvertes.",
};

/** Les rappels d'écriture : chaque jour à l'heure choisie, et la veille d'une échéance. */
export function PanneauRappels() {
  const prefs = usePreferences();
  const r = prefs.rappel;
  const [notif, setNotif] = useState<EtatNotifications | null>(null);
  const [essai, setEssai] = useState<string | null>(null);
  const installation = useInstallation();

  useEffect(() => {
    let vivant = true;
    void etatNotifications().then((e) => vivant && setNotif(e));
    return () => {
      vivant = false;
    };
  }, []);

  // Le fuseau de l'appareil accompagne chaque réglage : l'heure choisie est celle de l'auteur.
  const regler = (modif: Partial<RappelEcriture>) => {
    modifierPreferences((p) => ({ rappel: { ...p.rappel, ...modif, fuseau: fuseauIci() || p.rappel.fuseau } }));
    // Activer un rappel suffit : l'appareil s'abonne dans le même geste (l'autorisation est demandée une fois).
    if ((modif.actif || modif.veille) && notif === "inactif") void activerNotifications().then(setNotif);
  };

  const activer = async () => setNotif(await activerNotifications());

  const essayer = async () => {
    setEssai("Envoi…");
    const reponse = await fetch("/api/calame/rappels/essai", { method: "POST" }).catch(() => null);
    setEssai(reponse?.ok ? "Envoyé : la notification arrive dans un instant." : "L'essai n'a pas pu partir : vérifie ta connexion.");
  };

  return (
    <section className="calame-section calame-rappels" aria-labelledby="calame-rappels-titre">
      <h3 className="calame-section-titre" id="calame-rappels-titre">
        <BellRing className="size-4" aria-hidden="true" /> Rappels sur le téléphone
      </h3>
      <label className="inspecteur-bascule">
        <input type="checkbox" checked={r.actif} onChange={(e) => regler({ actif: e.target.checked })} />
        <span>Me rappeler d&apos;écrire</span>
      </label>
      {r.actif && (
        <>
          <label className="inspecteur-reglage calame-rappel-heure">
            <span className="inspecteur-libelle">Heure du rappel</span>
            <input type="time" className="champ" value={r.heure} step={900} onChange={(e) => e.target.value && regler({ heure: e.target.value })} />
          </label>
          <div className="calame-rappel-jours" role="group" aria-label="Jours du rappel">
            {JOURS.map((j) => {
              const choisi = r.jours.includes(j.n);
              return (
                <button key={j.n} type="button" aria-pressed={choisi} aria-label={j.long} title={j.long} onClick={() => regler({ jours: choisi ? r.jours.filter((x) => x !== j.n) : [...r.jours, j.n] })}>
                  {j.court}
                </button>
              );
            })}
          </div>
          {r.jours.length === 0 && <p className="inspecteur-aide">Choisis au moins un jour.</p>}
        </>
      )}
      <label className="inspecteur-bascule">
        <input type="checkbox" checked={r.veille} onChange={(e) => regler({ veille: e.target.checked })} />
        <span>Prévenir la veille de l&apos;échéance d&apos;un document (onglet « Document »)</span>
      </label>
      {notif && (
        <div className="calame-rappel-appareil" data-etat={notif}>
          {notif === "actif" ? <Bell className="size-4" aria-hidden="true" /> : <BellOff className="size-4" aria-hidden="true" />}
          <p>{ETATS[notif]}</p>
          {notif === "inactif" && (
            <button type="button" className="bouton bouton-principal bouton-petit" onClick={() => void activer()}>
              Recevoir les rappels ici
            </button>
          )}
          {notif === "actif" && (
            <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => void essayer()}>
              Essayer
            </button>
          )}
        </div>
      )}
      {essai && (
        <p className="inspecteur-aide" role="status">
          {essai}
        </p>
      )}
      {installation === "proposable" && (
        <div className="calame-rappel-appareil">
          <Smartphone className="size-4" aria-hidden="true" />
          <p>Installe HaqqReason sur cet appareil : les rappels arrivent plus sûrement, et le Calame apparaît dans « Partager » des autres applications.</p>
          <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => void installer()}>
            Installer
          </button>
        </div>
      )}
      {installation === "iphone" && (
        <p className="inspecteur-aide">
          Sur iPhone, les rappels demandent HaqqReason sur l&apos;écran d&apos;accueil : dans Safari, bouton Partager, puis « Sur l&apos;écran d&apos;accueil ». Pour envoyer un texte ou une photo au Calame : copie-le, puis bouton « Coller » de la liste des documents.
        </p>
      )}
      <p className="inspecteur-aide">Les rappels partent du site, même quand le Calame est fermé, à quelques minutes près. Ils arrivent sur chaque appareil où tu les as acceptés.</p>
    </section>
  );
}
