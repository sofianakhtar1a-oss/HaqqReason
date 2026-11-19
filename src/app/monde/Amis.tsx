"use client";

import { ArrowLeft, Bell, BellOff, Check, Copy, Share2, Swords, UserMinus, UserPlus, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Amis } from "@/lib/monde/social";
import { useConfirmer } from "./Confirmer";

/*
 * Les amis : un code d'ami à donner, les demandes reçues, la liste des amis avec nos duels (gagnés,
 * perdus, nuls), leur classement (la semaine, les trophées, la cote), et les notifications du téléphone.
 */

const fr = (n: number) => new Intl.NumberFormat("fr-FR").format(n).replace(/[  ]/g, " ");

type Tri = "semaine" | "trophees" | "elo";
const TRIS: { id: Tri; nom: string; unite: string }[] = [
  { id: "semaine", nom: "Cette semaine", unite: "XP" },
  { id: "trophees", nom: "Trophées", unite: "trophées" },
  { id: "elo", nom: "Cote", unite: "" },
];

async function envoyer(corps: Record<string, unknown>): Promise<Record<string, unknown> & { erreur?: string }> {
  try {
    const r = await fetch("/api/monde/amis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    const x = (await r.json()) as Record<string, unknown> & { erreur?: string };
    return r.ok ? x : { erreur: x.erreur ?? "indisponible" };
  } catch {
    return { erreur: "reseau" };
  }
}

/** Un point final, sans doubler celui d'un nom abrégé (« Sofian E. »). */
const finDePhrase = (texte: string) => (texte.endsWith(".") ? texte : `${texte}.`);

const MESSAGES: Record<string, string> = {
  introuvable: "Aucun explorateur avec ce code. Vérifie les huit caractères.",
  soi: "C'est ton propre code.",
  trop: "Tu as déjà deux cents amis : c'est le maximum.",
  deconnecte: "Connecte-toi avec ton compte Google pour avoir des amis au Portulan.",
  indisponible: "Les amis ouvrent très bientôt.",
  reseau: "Pas de réseau : vérifie ta connexion.",
};

export function PageAmis({ onRetour, onDefier }: { onRetour: () => void; onDefier: () => void }) {
  const [amis, setAmis] = useState<Amis | null>(null);
  const [moi, setMoi] = useState<{ semaine: number; trophees: number; elo: number | null } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [tri, setTri] = useState<Tri>("semaine");
  const [copie, setCopie] = useState(false);
  const [confirmation, confirmer] = useConfirmer();

  const charger = useCallback(async () => {
    try {
      const [r, c, d] = await Promise.all([fetch("/api/monde/amis", { cache: "no-store" }), fetch("/api/monde/classement?periode=semaine", { cache: "no-store" }), fetch("/api/monde/duel?mes=1", { cache: "no-store" })]);
      if (!r.ok) {
        const x = (await r.json().catch(() => ({}))) as { erreur?: string };
        setErreur(x.erreur ?? "indisponible");
        return;
      }
      setAmis((await r.json()) as Amis);
      setErreur(null);
      const cl = c.ok ? ((await c.json()) as { moi: { points: number; trophees: number } | null }) : null;
      const du = d.ok ? ((await d.json()) as { cote: number | null }) : null;
      setMoi({ semaine: cl?.moi?.points ?? 0, trophees: cl?.moi?.trophees ?? 0, elo: du?.cote ?? null });
    } catch {
      setErreur("reseau");
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => void charger(), 0);
    return () => clearTimeout(t);
  }, [charger]);

  const action = async (corps: Record<string, unknown>, succes?: string) => {
    setMessage(null);
    const r = await envoyer(corps);
    if (r.erreur) setMessage(MESSAGES[r.erreur] ?? MESSAGES.indisponible);
    else if (succes) setMessage(succes);
    await charger();
    return r;
  };

  const lien = amis?.code ? `${typeof window !== "undefined" ? window.location.origin : ""}/monde#duels/ami=${amis.code}` : "";
  const partager = async () => {
    if (!amis?.code) return;
    try {
      if (navigator.share) await navigator.share({ title: "Le Portulan", text: `Ajoute-moi en ami au Portulan : mon code est ${amis.code}.`, url: lien });
      else {
        await navigator.clipboard.writeText(lien);
        setCopie(true);
      }
    } catch {
      // Partage annulé.
    }
  };

  const classement = amis
    ? [
        ...amis.amis.map((a) => ({ cle: a.id, nom: a.nom, avatar: a.avatar, semaine: a.semaine, trophees: a.trophees, elo: a.elo, moi: false })),
        ...(moi ? [{ cle: "moi", nom: "Toi", avatar: "", semaine: moi.semaine, trophees: moi.trophees, elo: moi.elo ?? 1200, moi: true }] : []),
      ].sort((a, b) => b[tri] - a[tri] || a.nom.localeCompare(b.nom, "fr"))
    : [];

  return (
    <div className="pt-amis">
      <button type="button" className="pt-retour-lien" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Les duels
      </button>
      <header className="pt-section-tete">
        <div>
          <h2 className="pt-titre">Mes amis</h2>
          <p className="pt-chapo">Un code à donner, des duels entre vous, et votre classement de la semaine.</p>
        </div>
      </header>

      {erreur ? (
        <p className="pt-message" role="alert">
          {MESSAGES[erreur] ?? MESSAGES.indisponible}
        </p>
      ) : !amis ? (
        <p className="pt-astuce">Un instant…</p>
      ) : (
        <>
          {message && (
            <p className="pt-message" role="status">
              {message}
            </p>
          )}
          <div className="pt-amis-haut">
            <section className="pt-duel-bloc" aria-labelledby="pt-mon-code">
              <Users className="pt-duel-icone" aria-hidden="true" />
              <h3 id="pt-mon-code">Mon code d&apos;ami</h3>
              {amis.code ? (
                <>
                  <p className="pt-duel-code pt-ami-code" aria-label={`Code : ${amis.code.split("").join(" ")}`}>
                    {amis.code}
                  </p>
                  <div className="pt-outil-actions">
                    <button type="button" className="bouton bouton-principal" onClick={partager}>
                      {copie ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
                      {copie ? "Lien copié" : "Partager"}
                    </button>
                    <button
                      type="button"
                      className="bouton bouton-discret"
                      onClick={() => {
                        void navigator.clipboard?.writeText(amis.code!);
                        setCopie(true);
                      }}
                    >
                      <Copy className="size-4" aria-hidden="true" />
                      Copier
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>Huit caractères à donner à tes amis : ils t&apos;ajoutent avec.</p>
                  <button type="button" className="bouton bouton-principal" onClick={() => void action({ action: "code" })}>
                    Créer mon code
                  </button>
                </>
              )}
            </section>
            <section className="pt-duel-bloc" aria-labelledby="pt-ajouter-ami">
              <UserPlus className="pt-duel-icone" aria-hidden="true" />
              <h3 id="pt-ajouter-ami">Ajouter un ami</h3>
              <p>Entre son code : il reçoit ta demande, et vous voilà amis dès qu&apos;il l&apos;accepte.</p>
              <form
                className="pt-code"
                onSubmit={(e) => {
                  e.preventDefault();
                  void action({ action: "ajouter", code }, "Demande envoyée.").then((r) => {
                    if (!r.erreur) setCode("");
                    if (r.etat === "ami") setMessage("Vous êtes amis.");
                  });
                }}
              >
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 8))} placeholder="CODE" aria-label="Le code de ton ami" autoComplete="off" spellCheck={false} />
                <button type="submit" className="bouton bouton-discret" disabled={code.length !== 8}>
                  Ajouter
                </button>
              </form>
            </section>
          </div>

          {amis.recues.length > 0 && (
            <section className="pt-amis-section" aria-labelledby="pt-demandes">
              <h3 id="pt-demandes" className="pt-sous-titre">
                Ils veulent être tes amis
              </h3>
              <ul className="pt-amis-liste">
                {amis.recues.map((p) => (
                  <li key={p.id}>
                    <span className="pt-joueur-avatar" aria-hidden="true">
                      {p.nom.slice(0, 1)}
                    </span>
                    <span className="pt-amis-nom">{p.nom}</span>
                    <button type="button" className="bouton bouton-principal" onClick={() => void action({ action: "repondre", id: p.id, accepte: true }, `${p.nom} est ton ami.`)}>
                      <Check className="size-4" aria-hidden="true" />
                      Accepter
                    </button>
                    <button type="button" className="pt-icone" onClick={() => void action({ action: "repondre", id: p.id, accepte: false })} aria-label={`Refuser : ${p.nom}`}>
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="pt-amis-section" aria-labelledby="pt-liste-amis">
            <div className="pt-amis-entete">
              <h3 id="pt-liste-amis" className="pt-sous-titre">
                {amis.amis.length ? `Mes amis (${amis.amis.length})` : "Mes amis"}
              </h3>
              {amis.amis.length > 0 && (
                <div className="pt-segments" role="group" aria-label="Classer par">
                  {TRIS.map((t) => (
                    <button key={t.id} type="button" aria-pressed={tri === t.id} onClick={() => setTri(t.id)}>
                      {t.nom}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {amis.amis.length === 0 ? (
              <p className="pt-astuce">Pas encore d&apos;amis : donne ton code, ou entre celui d&apos;un ami.</p>
            ) : (
              <ol className="pt-amis-classement">
                {classement.map((l, i) => {
                  const a = amis.amis.find((x) => x.id === l.cle);
                  const valeur = tri === "semaine" ? `${fr(l.semaine)} XP` : tri === "trophees" ? `${fr(l.trophees)} trophées` : `cote ${fr(l.elo)}`;
                  return (
                    <li key={l.cle} data-moi={l.moi || undefined}>
                      <span className="pt-amis-rang">{i + 1}</span>
                      <span className="pt-joueur-avatar" aria-hidden="true">
                        {l.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.avatar} alt="" referrerPolicy="no-referrer" />
                        ) : (
                          l.nom.slice(0, 1)
                        )}
                      </span>
                      <span className="pt-amis-nom">
                        {l.nom}
                        {a && (
                          <small>
                            Entre vous : {a.victoires} victoire{a.victoires > 1 ? "s" : ""}, {a.defaites} défaite{a.defaites > 1 ? "s" : ""}
                            {a.nuls ? `, ${a.nuls} nul${a.nuls > 1 ? "s" : ""}` : ""}
                          </small>
                        )}
                      </span>
                      <span className="pt-amis-valeur">{valeur}</span>
                      {a && (
                        <span className="pt-amis-actions">
                          <button type="button" className="bouton bouton-discret" onClick={onDefier} title="Un duel à distance : tu joues, puis tu lui envoies le lien">
                            <Swords className="size-4" aria-hidden="true" />
                            Défier
                          </button>
                          <button
                            type="button"
                            className="pt-icone"
                            aria-label={`Retirer : ${a.nom}`}
                            onClick={async () => {
                              if (await confirmer({ titre: `Retirer ${a.nom} de tes amis ?`, texte: "Vos duels passés restent dans vos classements.", oui: "Retirer", danger: true })) void action({ action: "retirer", id: a.id });
                            }}
                          >
                            <UserMinus className="size-4" aria-hidden="true" />
                          </button>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
            {amis.envoyees.length > 0 && <p className="pt-astuce">En attente de réponse : {finDePhrase(amis.envoyees.map((p) => p.nom).join(", "))}</p>}
          </section>

          <Notifications />
        </>
      )}
      {confirmation}
    </div>
  );
}

/* ---------- Les notifications du téléphone ---------- */

function cleBinaire(base64: string): Uint8Array<ArrayBuffer> {
  const propre = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const brut = atob(propre);
  const sortie = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i++) sortie[i] = brut.charCodeAt(i);
  return sortie;
}

/** Le service du site (il peut ne pas exister : en développement, ou si le navigateur le refuse). */
function service(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return Promise.resolve(null);
  return Promise.race([navigator.serviceWorker.ready, new Promise<null>((ok) => setTimeout(() => ok(null), 3000))]);
}

type EtatNotif = "inconnu" | "impossible" | "bientot" | "refuse" | "actif" | "inactif";

export function Notifications() {
  const [etat, setEtat] = useState<EtatNotif>("inconnu");
  const [cle, setCle] = useState<string | null>(null);
  useEffect(() => {
    let vivant = true;
    void (async () => {
      if (!("Notification" in window) || !("PushManager" in window) || !("serviceWorker" in navigator)) return vivant && setEtat("impossible");
      const r = await fetch("/api/monde/notifications", { cache: "no-store" }).catch(() => null);
      const c = r?.ok ? ((await r.json()) as { cle: string | null }).cle : null;
      if (!vivant) return;
      if (!c) return setEtat("bientot");
      setCle(c);
      if (Notification.permission === "denied") return setEtat("refuse");
      const reg = await service();
      const abonnement = await reg?.pushManager.getSubscription().catch(() => null);
      if (vivant) setEtat(abonnement ? "actif" : reg ? "inactif" : "impossible");
    })();
    return () => {
      vivant = false;
    };
  }, []);

  const activer = async () => {
    if (!cle) return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return setEtat(permission === "denied" ? "refuse" : "inactif");
    const reg = await service();
    if (!reg) return setEtat("impossible");
    try {
      const abonnement = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: cleBinaire(cle) });
      const json = abonnement.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } };
      const r = await fetch("/api/monde/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "abonner", endpoint: json.endpoint, cles: json.keys }) });
      setEtat(r.ok ? "actif" : "inactif");
    } catch {
      setEtat("inactif");
    }
  };
  const desactiver = async () => {
    const reg = await service();
    const abonnement = await reg?.pushManager.getSubscription().catch(() => null);
    if (abonnement) {
      await fetch("/api/monde/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "desabonner", endpoint: abonnement.endpoint }) }).catch(() => null);
      await abonnement.unsubscribe().catch(() => false);
    }
    setEtat("inactif");
  };

  if (etat === "inconnu") return null;
  return (
    <section className="pt-notifs" aria-labelledby="pt-notifs-titre">
      {etat === "actif" ? <Bell className="pt-duel-icone" aria-hidden="true" /> : <BellOff className="pt-duel-icone" aria-hidden="true" />}
      <div>
        <h3 id="pt-notifs-titre">Les notifications</h3>
        <p>
          {etat === "actif"
            ? "Ce téléphone te prévient quand un ami relève ton duel, quand c'est ton tour, et des demandes d'ami."
            : etat === "bientot"
              ? "Les notifications du téléphone arrivent bientôt : un duel relevé, ton tour de jouer, une demande d'ami."
              : etat === "refuse"
                ? "Tu as refusé les notifications pour ce site : tu peux les rouvrir dans les réglages de ton navigateur."
                : etat === "impossible"
                  ? "Ce navigateur ne reçoit pas de notifications. Sur iPhone, ajoute d'abord le site à l'écran d'accueil."
                  : "Sois prévenu quand un ami relève ton duel, quand c'est ton tour de jouer, et des demandes d'ami."}
        </p>
      </div>
      {etat === "inactif" && (
        <button type="button" className="bouton bouton-principal" onClick={activer}>
          <Bell className="size-4" aria-hidden="true" />
          Activer
        </button>
      )}
      {etat === "actif" && (
        <button type="button" className="bouton bouton-discret" onClick={desactiver}>
          Désactiver
        </button>
      )}
    </section>
  );
}
