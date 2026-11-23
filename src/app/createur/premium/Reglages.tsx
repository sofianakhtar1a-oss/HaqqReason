"use client";

import { Check, Gift, Loader2, PlugZap, Power, RotateCcw, Save, Smartphone, Server, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import {
  type Acces,
  type ConfigPremium,
  type DefFonction,
  type DefModulePremium,
  economieAnnuelle,
  ESSAI_MAX,
  LIMITE_MAX,
  type ModeModule,
  type ModulePremium,
  type Offert,
  type Periode,
  prixLisible,
  type Regle,
  type Vendeur,
} from "@/lib/premium/catalogue";
import { ajouterOffert, basculerOffre, enregistrerReglagesPremium, reglagesConseilles, type Reponse, retirerOffert, verifierStripe } from "./actions";

/* ---------- Petits outils ---------- */

function Message({ r }: { r: Reponse | null }) {
  return (
    <p className={`min-h-6 text-sm font-semibold ${r && !r.ok ? "text-danger" : "text-emeraude"}`} role={r && !r.ok ? "alert" : "status"} aria-live="polite">
      {r ? (r.ok ? r.message : r.erreur) : ""}
    </p>
  );
}

const versEuros = (centimes: number) => (centimes / 100).toFixed(2).replace(".", ",");
/** « 4,99 » ou « 4.99 » ou « 4 » → 499 centimes ; NaN si illisible. */
const versCentimes = (texte: string) => {
  const n = Number(texte.replace(/\s/g, "").replace("€", "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

/* ---------- L'interrupteur de l'offre ---------- */

export function InterrupteurOffre({ active, pret }: { active: boolean; pret: boolean }) {
  const [enCours, demarrer] = useTransition();
  const [r, setR] = useState<Reponse | null>(null);
  const changer = () => demarrer(async () => setR(await basculerOffre(!active)));
  return (
    <div className="grid gap-2">
      <button type="button" className={`bouton ${active ? "bouton-discret" : "bouton-principal bouton-premium"}`} onClick={changer} disabled={enCours || (!active && !pret)} aria-describedby="aide-interrupteur">
        {enCours ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Power className="size-5" aria-hidden="true" />}
        {active ? "Éteindre l'offre payante" : "Mettre l'offre payante en service"}
      </button>
      <p id="aide-interrupteur" className="text-sm text-encre-douce">
        {active ? "Éteinte, tout le site redevient gratuit pour tous ; les abonnés restent abonnés tant qu'ils ne résilient pas." : pret ? "Les visiteurs verront les cadenas et pourront s'abonner." : "Possible dès que chaque ligne ci-dessus est cochée."}
      </p>
      <Message r={r} />
    </div>
  );
}

export function BoutonVerifierStripe({ possible }: { possible: boolean }) {
  const [enCours, demarrer] = useTransition();
  const [r, setR] = useState<Reponse | null>(null);
  return (
    <div className="grid gap-2">
      <button type="button" className="bouton bouton-discret" onClick={() => demarrer(async () => setR(await verifierStripe()))} disabled={enCours || !possible}>
        {enCours ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <PlugZap className="size-5" aria-hidden="true" />}
        Vérifier la connexion à Stripe
      </button>
      <Message r={r} />
    </div>
  );
}

/* ---------- Les réglages : prix, essai, accès, vendeur ---------- */

const MODES: { v: ModeModule; nom: string }[] = [
  { v: "libre", nom: "Tout gratuit" },
  { v: "parties", nom: "Partie par partie" },
  { v: "premium", nom: "Tout Premium" },
];
const ACCES: { v: Acces; nom: string }[] = [
  { v: "libre", nom: "Gratuit" },
  { v: "limite", nom: "Gratuit, limité" },
  { v: "premium", nom: "Premium" },
];
const PERIODES: { v: Periode; nom: string }[] = [
  { v: "jour", nom: "par jour" },
  { v: "semaine", nom: "par semaine" },
  { v: "mois", nom: "par mois" },
  { v: "total", nom: "en tout" },
];
const ESSAIS = [0, 3, 7, 14, 30].filter((n) => n <= ESSAI_MAX);

type Props = {
  config: Pick<ConfigPremium, "prixMois" | "prixAnnee" | "essaiJours" | "modules" | "regles" | "vendeur" | "accroche">;
  modules: DefModulePremium[];
  fonctions: DefFonction[];
};

function LigneFonction({ f, regle, changer }: { f: DefFonction; regle: Regle; changer: (r: Regle) => void }) {
  const id = `regle-${f.id.replace(".", "-")}`;
  return (
    <li className="reglage-premium-ligne">
      <div className="min-w-0">
        <p className="font-semibold">{f.nom}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-encre-douce">
          {f.verrou === "serveur" ? <Server className="size-3.5" aria-hidden="true" /> : <Smartphone className="size-3.5" aria-hidden="true" />}
          {f.verrou === "serveur" ? "Verrou sur le serveur : impossible à contourner" : "L'outil travaille sur l'appareil ; le compteur est tenu par le serveur"}
        </p>
        {f.distinct && <p className="text-xs text-encre-douce">Rouvrir ce qui a déjà été ouvert dans la période ne compte pas.</p>}
      </div>
      <div className="reglage-premium-controles">
        <label className="sr-only" htmlFor={`${id}-acces`}>
          Accès à « {f.nom} »
        </label>
        <select id={`${id}-acces`} className="champ" value={regle.acces} onChange={(e) => changer({ ...regle, acces: e.target.value as Acces, limite: e.target.value === "limite" ? regle.limite || 3 : 0 })}>
          {ACCES.map((a) => (
            <option key={a.v} value={a.v}>
              {a.nom}
            </option>
          ))}
        </select>
        {regle.acces === "limite" && (
          <span className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`${id}-limite`}>
              Nombre d&apos;utilisations gratuites
            </label>
            <input
              id={`${id}-limite`}
              type="number"
              inputMode="numeric"
              min={1}
              max={LIMITE_MAX}
              className="champ w-20"
              value={regle.limite || ""}
              onChange={(e) => changer({ ...regle, limite: Math.min(LIMITE_MAX, Math.max(0, Math.round(Number(e.target.value) || 0))) })}
            />
            <span className="text-sm text-encre-douce">{regle.limite > 1 ? f.unite.plusieurs : f.unite.un}</span>
            <label className="sr-only" htmlFor={`${id}-periode`}>
              Période
            </label>
            <select id={`${id}-periode`} className="champ" value={regle.periode} onChange={(e) => changer({ ...regle, periode: e.target.value as Periode })}>
              {PERIODES.map((p) => (
                <option key={p.v} value={p.v}>
                  {p.nom}
                </option>
              ))}
            </select>
          </span>
        )}
      </div>
    </li>
  );
}

const CHAMPS_VENDEUR: { cle: keyof Vendeur; nom: string; aide: string; requis?: boolean; long?: boolean }[] = [
  { cle: "nom", nom: "Nom ou raison sociale", aide: "Ton nom si tu vends en micro-entreprise.", requis: true },
  { cle: "forme", nom: "Forme", aide: "Par exemple : entrepreneur individuel (micro-entreprise)." },
  { cle: "siret", nom: "Numéro SIRET", aide: "Quatorze chiffres, sur ton avis de situation INSEE.", requis: true },
  { cle: "adresse", nom: "Adresse", aide: "Adresse postale de l'entreprise (ou de domiciliation).", requis: true, long: true },
  { cle: "email", nom: "E-mail de contact", aide: "Les abonnés t'écrivent ici.", requis: true },
  { cle: "tva", nom: "Mention de TVA", aide: "Franchise en base : « TVA non applicable, art. 293 B du CGI ». Sinon ton numéro de TVA." },
  { cle: "mediateur", nom: "Médiateur de la consommation", aide: "Obligatoire pour vendre à des particuliers : son nom et son site (par exemple CM2C, AME Conso…).", long: true },
];

export function ReglagesPremium({ config, modules, fonctions }: Props) {
  const [prixMois, setPrixMois] = useState(versEuros(config.prixMois));
  const [prixAnnee, setPrixAnnee] = useState(versEuros(config.prixAnnee));
  const [essaiJours, setEssaiJours] = useState(config.essaiJours);
  const [accroche, setAccroche] = useState(config.accroche);
  const [modes, setModes] = useState<Record<ModulePremium, ModeModule>>(config.modules);
  const [regles, setRegles] = useState<Record<string, Regle>>(config.regles);
  const [vendeur, setVendeur] = useState<Vendeur>(config.vendeur);
  const [enCours, demarrer] = useTransition();
  const [r, setR] = useState<Reponse | null>(null);

  const mois = versCentimes(prixMois);
  const annee = versCentimes(prixAnnee);
  const eco = Number.isFinite(mois) && Number.isFinite(annee) ? economieAnnuelle({ prixMois: mois, prixAnnee: annee }) : null;

  const enregistrer = () => {
    if (!Number.isFinite(mois) || mois < 99 || !Number.isFinite(annee) || annee < 99) {
      setR({ ok: false, erreur: "Les prix doivent être d'au moins 0,99 €." });
      return;
    }
    demarrer(async () => setR(await enregistrerReglagesPremium({ prixMois: mois, prixAnnee: annee, essaiJours, accroche, modules: modes, regles, vendeur })));
  };

  return (
    <div className="grid gap-6">
      <section className="verre panneau" aria-labelledby="titre-prix">
        <h2 id="titre-prix" className="font-display text-2xl font-bold">
          Les prix
        </h2>
        <p className="mt-1 text-sm text-encre-douce">Toutes taxes comprises. Changer un prix ne touche pas les abonnés en cours : ils gardent le leur.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="etiquette">Au mois (€)</span>
            <input className="champ" inputMode="decimal" value={prixMois} onChange={(e) => setPrixMois(e.target.value)} aria-describedby="aide-prix" />
          </label>
          <label className="grid gap-1.5">
            <span className="etiquette">À l&apos;année (€)</span>
            <input className="champ" inputMode="decimal" value={prixAnnee} onChange={(e) => setPrixAnnee(e.target.value)} aria-describedby="aide-prix" />
          </label>
          <label className="grid gap-1.5">
            <span className="etiquette">Essai gratuit</span>
            <select className="champ" value={essaiJours} onChange={(e) => setEssaiJours(Number(e.target.value))}>
              {ESSAIS.map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "Aucun" : `${n} jours`}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p id="aide-prix" className="mt-2 text-sm text-encre-douce">
          {eco && Number.isFinite(mois)
            ? `L'année revient à ${prixLisible(Math.round(annee / 12))} par mois : ${eco.moisOfferts >= 1 ? `${eco.moisOfferts} mois offert${eco.moisOfferts > 1 ? "s" : ""}` : `${eco.pourcent} % d'économie`} par rapport au mois.`
            : "Écris les prix en euros, par exemple 4,99."}
        </p>
        <label className="mt-4 grid gap-1.5">
          <span className="etiquette">Phrase d&apos;accroche de la page Premium</span>
          <input className="champ" maxLength={240} value={accroche} placeholder="Tout HaqqReason, sans limite : chaque histoire, chaque dictée, chaque outil, et les diplômes du Truchement." onChange={(e) => setAccroche(e.target.value)} />
        </label>
      </section>

      <section className="verre panneau" aria-labelledby="titre-acces">
        <h2 id="titre-acces" className="font-display text-2xl font-bold">
          Ce qui est gratuit, limité ou Premium
        </h2>
        <p className="mt-1 text-sm text-encre-douce">
          Pour chaque module : tout gratuit, tout Premium, ou partie par partie. Une partie « gratuite, limitée » s&apos;ouvre un certain nombre de fois par période, puis la fenêtre Premium s&apos;affiche.
        </p>
        <div className="mt-5 grid gap-5">
          {modules.map((m) => (
            <fieldset key={m.id} className="reglage-premium-module">
              <legend className="font-display text-lg font-bold">{m.nom}</legend>
              <div className="reglage-premium-modes" role="radiogroup" aria-label={`Accès à ${m.nom}`}>
                {MODES.map((x) => (
                  <label key={x.v} className="reglage-premium-mode">
                    <input type="radio" name={`mode-${m.id}`} value={x.v} checked={modes[m.id] === x.v} onChange={() => setModes({ ...modes, [m.id]: x.v })} />
                    <span>{x.nom}</span>
                  </label>
                ))}
              </div>
              {modes[m.id] === "parties" && (
                <ul className="mt-3 grid gap-2">
                  {fonctions
                    .filter((f) => f.module === m.id)
                    .map((f) => (
                      <LigneFonction key={f.id} f={f} regle={regles[f.id] ?? f.defaut} changer={(nr) => setRegles({ ...regles, [f.id]: nr })} />
                    ))}
                </ul>
              )}
            </fieldset>
          ))}
        </div>
      </section>

      <section className="verre panneau" aria-labelledby="titre-vendeur">
        <h2 id="titre-vendeur" className="font-display text-2xl font-bold">
          Le vendeur
        </h2>
        <p className="mt-1 text-sm text-encre-douce">Ces informations remplissent les conditions générales de vente. Les champs marqués d&apos;un astérisque sont obligatoires pour ouvrir l&apos;offre.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {CHAMPS_VENDEUR.map((c) => (
            <label key={c.cle} className={`grid gap-1.5 ${c.long ? "sm:col-span-2" : ""}`}>
              <span className="etiquette">
                {c.nom}
                {c.requis ? " *" : ""}
              </span>
              <input className="champ" value={vendeur[c.cle]} onChange={(e) => setVendeur({ ...vendeur, [c.cle]: e.target.value })} type={c.cle === "email" ? "email" : "text"} autoComplete="off" />
              <span className="text-xs text-encre-douce">{c.aide}</span>
            </label>
          ))}
        </div>
      </section>

      <div className="reglage-premium-barre">
        <button type="button" className="bouton bouton-principal" onClick={enregistrer} disabled={enCours}>
          {enCours ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Save className="size-5" aria-hidden="true" />}
          Enregistrer
        </button>
        <Message r={r} />
      </div>
    </div>
  );
}

export function BoutonConseilles() {
  const [enCours, demarrer] = useTransition();
  const [r, setR] = useState<Reponse | null>(null);
  return (
    <div className="grid gap-2">
      <button type="button" className="bouton bouton-discret" onClick={() => demarrer(async () => setR(await reglagesConseilles()))} disabled={enCours}>
        {enCours ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <RotateCcw className="size-5" aria-hidden="true" />}
        Remettre les accès conseillés
      </button>
      <Message r={r} />
    </div>
  );
}

/* ---------- Les comptes offerts ---------- */

export function ComptesOfferts({ offerts }: { offerts: Offert[] }) {
  const [email, setEmail] = useState("");
  const [jusqu, setJusqu] = useState("");
  const [note, setNote] = useState("");
  const [enCours, demarrer] = useTransition();
  const [r, setR] = useState<Reponse | null>(null);
  const ajouter = () =>
    demarrer(async () => {
      const rep = await ajouterOffert(email, jusqu, note);
      setR(rep);
      if (rep.ok) {
        setEmail("");
        setJusqu("");
        setNote("");
      }
    });
  return (
    <section className="verre panneau" aria-labelledby="titre-offerts">
      <h2 id="titre-offerts" className="font-display text-2xl font-bold">
        Comptes offerts
      </h2>
      <p className="mt-1 text-sm text-encre-douce">Un accès Premium gratuit (un proche, un professeur, un partenaire), reconnu à l&apos;adresse Google de la personne, avec ou sans date de fin.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end">
        <label className="grid gap-1.5">
          <span className="etiquette">Adresse Google</span>
          <input className="champ" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </label>
        <label className="grid gap-1.5">
          <span className="etiquette">Jusqu&apos;au (facultatif)</span>
          <input className="champ" type="date" value={jusqu} onChange={(e) => setJusqu(e.target.value)} />
        </label>
        <label className="grid gap-1.5">
          <span className="etiquette">Note (facultative)</span>
          <input className="champ" value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="button" className="bouton bouton-discret" onClick={ajouter} disabled={enCours || !email.trim()}>
          {enCours ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Gift className="size-5" aria-hidden="true" />}
          Offrir
        </button>
      </div>
      <Message r={r} />
      {offerts.length > 0 ? (
        <ul className="mt-3 grid gap-2">
          {offerts.map((o) => (
            <li key={o.email} className="reglage-premium-ligne">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold">
                  <Check className="size-4 text-or" aria-hidden="true" />
                  <span className="truncate">{o.email}</span>
                </p>
                <p className="text-sm text-encre-douce">
                  {o.jusqu ? `Jusqu'au ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${o.jusqu}T12:00:00Z`))}` : "Sans date de fin"}
                  {o.note ? `, ${o.note}` : ""}
                </p>
              </div>
              <button type="button" className="bouton-icone" aria-label={`Retirer l'accès offert à ${o.email}`} title="Retirer" disabled={enCours} onClick={() => demarrer(async () => setR(await retirerOffert(o.email)))}>
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-encre-douce">Aucun compte offert pour l&apos;instant.</p>
      )}
    </section>
  );
}
