"use client";

import { ExternalLink, KeyRound, LoaderCircle, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { coutEstime, EFFORTS, formaterCout, formaterJetons, MODELES, type Effort, type IdModele } from "@/lib/assistant/modeles";
import { api, ErreurApi, type Bilan, type FicheCle } from "./api";

const CONSOLE = "https://platform.claude.com";

/** Ce que coûte, à peu près, une question avec ce modèle : de quoi choisir en connaissance de cause. */
function exemples(id: IdModele) {
  const simple = coutEstime(id, { entree: 1_500, sortie: 700, ecritureCache: 0, lectureCache: 0 });
  const premiere = coutEstime(id, { entree: 400, sortie: 900, ecritureCache: 50_000, lectureCache: 0 });
  const suivante = coutEstime(id, { entree: 400, sortie: 900, ecritureCache: 1_500, lectureCache: 50_000 });
  return { simple, premiere, suivante };
}

export function ChoixModele({ valeur, onChange, nom }: { valeur: IdModele; onChange: (m: IdModele) => void; nom: string }) {
  return (
    <div className="aia-modeles" role="radiogroup" aria-label="Modèle">
      {MODELES.map((m) => (
        <label key={m.id} className="aia-modele" data-choisi={valeur === m.id ? "" : undefined}>
          <input type="radio" name={nom} value={m.id} checked={valeur === m.id} onChange={() => onChange(m.id)} />
          <span className="aia-modele-nom">{m.nom}</span>
          <span className="aia-modele-role">{m.role}</span>
          <span className="aia-modele-prix">
            {m.tarif.entree.toLocaleString("fr-FR")} $ / {m.tarif.sortie.toLocaleString("fr-FR")} $ le million de jetons
          </span>
        </label>
      ))}
    </div>
  );
}

/** Coller sa clé : vérifiée auprès d'Anthropic, puis enregistrée chiffrée, liée au compte. */
export function RelierCle({
  titre,
  texte,
  modeleInitial,
  effortInitial = "medium",
  onRelie,
  compact = false,
}: {
  titre: string;
  texte: string;
  modeleInitial: IdModele;
  effortInitial?: Effort;
  onRelie: (f: FicheCle) => void;
  compact?: boolean;
}) {
  const [cle, setCle] = useState("");
  const [modele, setModele] = useState<IdModele>(modeleInitial);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const champ = useId();
  const ex = exemples(modele);

  const relier = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const r = await api.relierCle(cle.trim(), modele, effortInitial);
      setCle("");
      onRelie(r.cle);
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : "La vérification a échoué. Réessaie.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <form className={compact ? "aia-relier aia-relier-compact" : "aia-relier"} onSubmit={relier}>
      {!compact && <KeyRound className="aia-relier-icone" strokeWidth={1.4} aria-hidden="true" />}
      <h2 className="aia-relier-titre">{titre}</h2>
      <p className="aia-relier-texte">{texte}</p>
      {!compact && (
        <ol className="aia-etapes">
          <li>
            Ouvre la{" "}
            <a href={CONSOLE} target="_blank" rel="noopener noreferrer">
              console Anthropic <ExternalLink className="inline size-3.5" aria-hidden="true" />
            </a>{" "}
            et connecte-toi (ou crée ton compte).
          </li>
          <li>Ajoute du crédit (page « Billing »), ou utilise les crédits API inclus dans ton offre si elle en comporte.</li>
          <li>Crée une clé (page « API keys ») et colle-la ci-dessous.</li>
        </ol>
      )}
      <label className="etiquette" htmlFor={champ}>
        Ta clé API
      </label>
      <input
        id={champ}
        className="champ aia-champ-cle"
        type="password"
        autoComplete="off"
        spellCheck={false}
        placeholder="sk-ant-api03-…"
        value={cle}
        onChange={(e) => setCle(e.target.value)}
        required
      />
      <p className="etiquette mt-4">Le modèle par défaut</p>
      <ChoixModele valeur={modele} onChange={setModele} nom={`${champ}-modele`} />
      <p className="aia-exemples">
        Pour te donner une idée avec {MODELES.find((m) => m.id === modele)?.nom} : une question simple coûte environ {formaterCout(ex.simple)} ; avec un PDF de 50 pages, environ{" "}
        {formaterCout(ex.premiere)} la première question, puis {formaterCout(ex.suivante)} les suivantes tant que tu enchaînes (le texte est relu depuis le cache).
      </p>
      {erreur && (
        <p className="message message-erreur" role="alert">
          {erreur}
        </p>
      )}
      <button type="submit" className="bouton bouton-principal aia-relier-bouton" disabled={envoi || !cle.trim()}>
        {envoi ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
        {envoi ? "Vérification auprès d'Anthropic…" : "Vérifier et relier ma clé"}
      </button>
      {!compact && (
        <div className="aia-questions">
          <details>
            <summary>Et mon abonnement Claude Pro ou Max ?</summary>
            <p>
              Anthropic n&apos;autorise pas les autres applications à se servir de la connexion d&apos;un abonnement Claude. L&apos;assistant passe donc par une clé de la console, payée à
              l&apos;usage, avec ses propres limites. Si ton offre comprend des crédits API mensuels, ils s&apos;appliquent à cette clé.
            </p>
          </details>
          <details>
            <summary>Ma clé est-elle en sécurité ?</summary>
            <p>
              Elle est chiffrée (AES-256) dès son arrivée, liée à ton compte Google (elle ne se déchiffre pour aucun autre compte) et n&apos;est jamais réaffichée. Le serveur ne s&apos;en sert que
              pour envoyer TES questions à Anthropic. Tu peux la retirer ici à tout moment, et la révoquer dans ta console.
            </p>
          </details>
          <details>
            <summary>Comment limiter ma dépense ?</summary>
            <p>
              Dans la console, fixe une limite de dépense mensuelle (page « Limits ») : c&apos;est la protection qui fait foi. Ici, tu peux aussi fixer un plafond mensuel : l&apos;assistant
              s&apos;arrête quand son estimation l&apos;atteint.
            </p>
          </details>
        </div>
      )}
    </form>
  );
}

/** Le panneau des réglages : clé, modèle, effort, plafond, consommation du mois. */
export function Reglages({
  fiche,
  bilan,
  titreCle,
  texteCle,
  onFiche,
  onOublie,
  onFermer,
}: {
  fiche: FicheCle | null;
  bilan: Bilan | null;
  titreCle: string;
  texteCle: string;
  onFiche: (f: FicheCle) => void;
  onOublie: () => void;
  onFermer: () => void;
}) {
  const [remplacer, setRemplacer] = useState(false);
  const [plafond, setPlafond] = useState(fiche?.plafond === null || fiche?.plafond === undefined ? "" : String(fiche.plafond));
  const [message, setMessage] = useState<{ type: "succes" | "erreur"; texte: string } | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const fermer = useRef<HTMLButtonElement>(null);
  const nom = useId();

  useEffect(() => {
    fermer.current?.focus();
    const touche = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [onFermer]);

  const regler = async (choix: { modele?: IdModele; effort?: Effort; plafond?: number | null }, ok: string) => {
    setMessage(null);
    try {
      const r = await api.reglerCle(choix);
      onFiche({ ...fiche, ...r.cle });
      setMessage({ type: "succes", texte: ok });
    } catch (err) {
      setMessage({ type: "erreur", texte: err instanceof ErreurApi ? err.message : "Enregistrement impossible." });
    }
  };

  const oublier = async () => {
    try {
      await api.oublierCle();
      onOublie();
    } catch (err) {
      setMessage({ type: "erreur", texte: err instanceof ErreurApi ? err.message : "Suppression impossible." });
    }
  };

  return (
    <aside className="aia-feuille" role="dialog" aria-modal="false" aria-labelledby={`${nom}-titre`}>
      <div className="aia-feuille-tete">
        <h2 id={`${nom}-titre`}>Réglages de l&apos;assistant</h2>
        <button ref={fermer} type="button" className="bouton-icone" onClick={onFermer} aria-label="Fermer les réglages">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="aia-feuille-corps">
        {bilan && (
          <section className="aia-bilan" aria-label="Ta consommation ce mois-ci">
            <p className="aia-bilan-montant">{formaterCout(bilan.moisCout)}</p>
            <p className="aia-bilan-legende">
              estimés ce mois-ci, pour {bilan.moisAppels.toLocaleString("fr-FR")} réponse{bilan.moisAppels > 1 ? "s" : ""} et {formaterJetons(bilan.moisJetons)} jetons. La facture qui fait foi
              est dans ta{" "}
              <a href={`${CONSOLE}/usage`} target="_blank" rel="noopener noreferrer">
                console Anthropic
              </a>
              .
            </p>
          </section>
        )}

        {fiche && !remplacer ? (
          <section className="aia-section">
            <h3>Ta clé</h3>
            <p className="aia-cle-apercu">
              <KeyRound className="size-4" aria-hidden="true" />
              <code>{fiche.apercu}</code>
              <span data-etat={fiche.statut === "valide" && fiche.lisible !== false ? "ok" : "ko"}>{fiche.lisible === false ? "à recoller" : fiche.statut === "valide" ? "reliée" : "refusée"}</span>
            </p>
            <div className="aia-actions">
              <button type="button" className="bouton bouton-discret" onClick={() => setRemplacer(true)}>
                Remplacer la clé
              </button>
              {confirmer ? (
                <>
                  <button type="button" className="bouton bouton-danger" onClick={oublier}>
                    Oui, retirer la clé
                  </button>
                  <button type="button" className="bouton bouton-discret" onClick={() => setConfirmer(false)}>
                    Annuler
                  </button>
                </>
              ) : (
                <button type="button" className="bouton bouton-discret" onClick={() => setConfirmer(true)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Retirer
                </button>
              )}
            </div>
          </section>
        ) : (
          <section className="aia-section">
            <RelierCle
              compact
              titre={fiche ? "Remplacer la clé" : titreCle}
              texte={fiche ? "La nouvelle clé est vérifiée, puis remplace l'ancienne." : texteCle}
              modeleInitial={fiche?.modele ?? "claude-sonnet-5-5"}
              effortInitial={fiche?.effort}
              onRelie={(f) => {
                onFiche(f);
                setRemplacer(false);
                setMessage({ type: "succes", texte: "Clé vérifiée et reliée à ton compte." });
              }}
            />
            {fiche && (
              <button type="button" className="bouton bouton-discret mt-2" onClick={() => setRemplacer(false)}>
                Garder l&apos;ancienne clé
              </button>
            )}
          </section>
        )}

        {fiche && (
          <>
            <section className="aia-section">
              <h3>Modèle par défaut</h3>
              <ChoixModele valeur={fiche.modele} nom={`${nom}-modele`} onChange={(m) => regler({ modele: m }, "Modèle enregistré.")} />
            </section>
            <section className="aia-section">
              <h3>Réflexion</h3>
              <div className="aia-efforts" role="radiogroup" aria-label="Réflexion">
                {EFFORTS.map((ef) => (
                  <label key={ef.id} className="aia-effort" data-choisi={fiche.effort === ef.id ? "" : undefined}>
                    <input type="radio" name={`${nom}-effort`} checked={fiche.effort === ef.id} onChange={() => regler({ effort: ef.id }, "Réglage enregistré.")} />
                    <span className="aia-effort-nom">{ef.nom}</span>
                    <span className="aia-effort-aide">{ef.aide}</span>
                  </label>
                ))}
              </div>
            </section>
            <section className="aia-section">
              <h3>Plafond mensuel</h3>
              <p className="aide">L&apos;assistant refuse d&apos;envoyer une question quand son estimation du mois atteint ce montant. Laisse vide pour ne pas en fixer.</p>
              <form
                className="aia-plafond"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = plafond.trim();
                  regler({ plafond: v === "" ? null : Number(v.replace(",", ".")) }, v === "" ? "Plafond retiré." : "Plafond enregistré.");
                }}
              >
                <input className="champ" inputMode="decimal" placeholder="Par exemple 5" value={plafond} onChange={(e) => setPlafond(e.target.value)} aria-label="Plafond mensuel en dollars" />
                <span aria-hidden="true">$</span>
                <button type="submit" className="bouton bouton-discret">
                  Enregistrer
                </button>
              </form>
            </section>
          </>
        )}

        {message && (
          <p className={`message ${message.type === "succes" ? "message-succes" : "message-erreur"}`} role="status">
            {message.texte}
          </p>
        )}
      </div>
    </aside>
  );
}
