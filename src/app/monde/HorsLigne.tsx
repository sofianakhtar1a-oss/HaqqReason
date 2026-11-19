"use client";

import { CloudOff, Download, MonitorDown, Trash2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { urlDrapeau } from "@/lib/monde/atlas";
import { CABINETS, urlEmbleme } from "@/lib/monde/cabinets";
import { CARTE_LEGERE_URL, CARTE_ULTRA_URL, CARTE_URL, PAYS } from "@/lib/monde/donnees";
import { chargerRecits } from "@/lib/monde/recits-client";
import { chargerCatalogue, localeInterface } from "./traduction";

/*
 * Le Portulan sans réseau, et installé comme une application.
 * « Garder sur cet appareil » : la page, son code, les drapeaux et les cartes partent dans un
 * espace du service hors ligne qui n'est jamais vidé tout seul. La copie se met à jour d'elle-même
 * à chaque visite avec du réseau. « Installer » : l'invitation du navigateur, gardée dès l'ouverture.
 */

const CLE = "haqqreason-portulan-hors-ligne";
type Invitation = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let invitation: Invitation | null = null;
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());
const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
};

/** À appeler dès l'ouverture du Portulan : l'invitation à installer n'arrive qu'une fois. */
export function ecouterInstallation(): () => void {
  const garder = (e: Event) => {
    e.preventDefault();
    invitation = e as Invitation;
    prevenir();
  };
  const installe = () => {
    invitation = null;
    prevenir();
  };
  window.addEventListener("beforeinstallprompt", garder);
  window.addEventListener("appinstalled", installe);
  return () => {
    window.removeEventListener("beforeinstallprompt", garder);
    window.removeEventListener("appinstalled", installe);
  };
}

/** Ce que le Portulan charge : ses fichiers, et le code déjà venu (y compris les morceaux chargés à la demande). */
async function adressesAGarder(): Promise<string[]> {
  await Promise.allSettled([chargerRecits(), chargerCatalogue()]);
  const drapeaux = [...new Set(PAYS.map((p) => urlDrapeau(p)))];
  const emblemes = [...new Set(CABINETS.flatMap((c) => c.elements.flatMap((e) => (e.drapeau ? [urlEmbleme(e.drapeau)] : []))))];
  const code = performance
    .getEntriesByType("resource")
    .map((r) => new URL(r.name, location.href))
    .filter((u) => u.origin === location.origin && u.pathname.startsWith("/_next/static/"))
    .map((u) => u.pathname + u.search);
  const geographie = performance
    .getEntriesByType("resource")
    .map((r) => new URL(r.name, location.href).pathname)
    .filter((p) => /^\/monde\/geographie-[0-9a-f]+\.json$/.test(p));
  return [CARTE_URL, CARTE_LEGERE_URL, CARTE_ULTRA_URL, ...geographie, ...drapeaux, ...emblemes, ...code, "/icones/portulan-192.png", "/icones/portulan-512.png"];
}

type Avancement = { fait: number; total: number } | null;

/** Demande au service hors ligne de garder le Portulan ; rappelle à chaque étape. */
export async function garderHorsLigne(suivre?: (a: Avancement) => void): Promise<"ok" | "connexion" | "reseau" | "indisponible"> {
  const sw = await navigator.serviceWorker?.ready.catch(() => null);
  if (!sw?.active) return "indisponible";
  const urls = await adressesAGarder();
  return new Promise((ok) => {
    const canal = new MessageChannel();
    canal.port1.onmessage = (e: MessageEvent<{ fait?: number; total?: number; fin?: boolean; erreur?: string }>) => {
      const d = e.data;
      if (typeof d.fait === "number" && typeof d.total === "number") suivre?.({ fait: d.fait, total: d.total });
      if (d.fin) {
        canal.port1.close();
        if (d.erreur) return ok(d.erreur === "connexion" ? "connexion" : "reseau");
        try {
          localStorage.setItem(CLE, String(Date.now()));
        } catch {
          // Stockage refusé : la copie existe quand même.
        }
        prevenir();
        ok("ok");
      }
    };
    sw.active!.postMessage({ type: "portulan-garder", urls }, [canal.port2]);
  });
}

/** À l'ouverture, avec du réseau : si le joueur a gardé le Portulan, la copie se remet à jour en silence. */
export function rafraichirHorsLigne(): () => void {
  let fini = false;
  const t = window.setTimeout(() => {
    if (fini || !navigator.onLine) return;
    try {
      if (!localStorage.getItem(CLE)) return;
    } catch {
      return;
    }
    void garderHorsLigne();
  }, 8000);
  return () => {
    fini = true;
    window.clearTimeout(t);
  };
}

const lireGarde = () => {
  try {
    return Number(localStorage.getItem(CLE)) || 0;
  } catch {
    return 0;
  }
};

const AFFICHAGE = "(display-mode: standalone)";
const estInstalle = () => window.matchMedia(AFFICHAGE).matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const abonnerAffichage = (f: () => void) => {
  const m = window.matchMedia(AFFICHAGE);
  m.addEventListener("change", f);
  return () => m.removeEventListener("change", f);
};
const abonnerRien = () => () => undefined;

export function CarteHorsLigne() {
  const garde = useSyncExternalStore(abonner, lireGarde, () => 0);
  const peutInstaller = useSyncExternalStore(abonner, () => invitation !== null, () => false);
  const installe = useSyncExternalStore(abonnerAffichage, estInstalle, () => false);
  const ios = useSyncExternalStore(abonnerRien, () => /iPad|iPhone|iPod/.test(navigator.userAgent), () => false);
  const [avancement, setAvancement] = useState<Avancement>(null);
  const [message, setMessage] = useState("");
  const [enCours, setEnCours] = useState(false);

  const garder = async () => {
    setEnCours(true);
    setMessage("");
    setAvancement({ fait: 0, total: 1 });
    const r = await garderHorsLigne(setAvancement);
    setEnCours(false);
    setAvancement(null);
    setMessage(
      r === "ok"
        ? "Le Portulan est gardé sur cet appareil : il se joue désormais sans réseau."
        : r === "connexion"
          ? "Connecte-toi d'abord : la page du Portulan demande ton compte."
          : r === "reseau"
            ? "Le réseau a coupé en route. Réessaie avec une connexion stable."
            : "Ce navigateur ne sait pas garder de pages hors ligne.",
    );
  };

  const oublier = async () => {
    const sw = await navigator.serviceWorker?.ready.catch(() => null);
    sw?.active?.postMessage({ type: "portulan-oublier" });
    try {
      localStorage.removeItem(CLE);
    } catch {
      // Rien à oublier.
    }
    prevenir();
    setMessage("La copie hors ligne est effacée de cet appareil.");
  };

  const installer = async () => {
    const i = invitation;
    if (!i) return;
    await i.prompt();
    const choix = await i.userChoice.catch(() => null);
    if (choix?.outcome === "accepted") {
      invitation = null;
      prevenir();
    }
  };

  const pourcent = avancement ? Math.round((100 * avancement.fait) / Math.max(1, avancement.total)) : 0;
  return (
    <section className="pt-reglages-carte" aria-labelledby="pt-r-hors-ligne">
      <h3 id="pt-r-hors-ligne" className="pt-reglages-titre">
        <CloudOff className="size-5" aria-hidden="true" />
        Hors ligne
      </h3>
      <p className="pt-reglage-aide">
        Garde Le Portulan sur cet appareil (environ 5 Mo) : drapeaux, cartes et fiches restent là, même en avion. Ta progression se range sur ton compte dès que le réseau revient.
      </p>
      {garde > 0 && !enCours && (
        <p className="pt-hors-ligne-etat">
          Gardé sur cet appareil depuis le {new Intl.DateTimeFormat(localeInterface(), { day: "numeric", month: "long" }).format(new Date(garde))} ; la copie se met à jour à chaque visite.
        </p>
      )}
      {avancement && (
        <div className="pt-hors-ligne-barre" role="progressbar" aria-label="Le Portulan se range sur l'appareil" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pourcent}>
          <span style={{ width: `${pourcent}%` }} />
        </div>
      )}
      <div className="pt-reglages-actions">
        <button type="button" className="bouton bouton-principal" onClick={() => void garder()} disabled={enCours}>
          <Download className="size-4" aria-hidden="true" />
          {enCours ? `Rangement… ${pourcent} %` : garde ? "Mettre à jour la copie" : "Garder sur cet appareil"}
        </button>
        {garde > 0 && !enCours && (
          <button type="button" className="bouton bouton-discret" onClick={() => void oublier()}>
            <Trash2 className="size-4" aria-hidden="true" />
            Effacer la copie
          </button>
        )}
        {peutInstaller && !installe && (
          <button type="button" className="bouton bouton-discret" onClick={() => void installer()}>
            <MonitorDown className="size-4" aria-hidden="true" />
            Installer Le Portulan
          </button>
        )}
      </div>
      {installe ? (
        <p className="pt-reglage-aide">Le Portulan est installé : il s&apos;ouvre depuis l&apos;écran d&apos;accueil, comme une application.</p>
      ) : ios ? (
        <p className="pt-reglage-aide">Sur iPhone et iPad : bouton Partager, puis « Sur l&apos;écran d&apos;accueil », pour l&apos;installer.</p>
      ) : null}
      {message && (
        <p className="pt-hors-ligne-message" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
