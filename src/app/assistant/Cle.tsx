"use client";

import { ExternalLink, KeyRound, LoaderCircle, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  coutEstime,
  EFFORTS,
  FOURNISSEURS,
  formaterCout,
  formaterJetons,
  infoFournisseur,
  modeleConseille,
  modelesDe,
  type Effort,
  type Fournisseur,
  type IdModele,
} from "@/lib/assistant/modeles";
import { api, ErreurApi, type Bilan, type FicheCle, type Reglages as ReglagesCompte } from "./api";

/** Ce que coûte, à peu près, une question avec le modèle conseillé de cette IA. */
function exemples(f: Fournisseur) {
  const id = modeleConseille(f).id;
  const simple = coutEstime(id, { entree: 1_500, sortie: 700, ecritureCache: 0, lectureCache: 0 });
  const premiere = f === "anthropic" ? coutEstime(id, { entree: 400, sortie: 900, ecritureCache: 50_000, lectureCache: 0 }) : coutEstime(id, { entree: 50_400, sortie: 900, ecritureCache: 0, lectureCache: 0 });
  const suivante = coutEstime(id, { entree: 1_900, sortie: 900, ecritureCache: 0, lectureCache: 50_000 });
  return { simple, premiere, suivante, nom: modeleConseille(f).nom };
}

/** Les trois IA, en cartes : l'utilisateur choisit simplement celle qu'il veut. */
export function ChoixIA({ valeur, onChange, cles, nom }: { valeur: Fournisseur; onChange: (f: Fournisseur) => void; cles?: FicheCle[]; nom: string }) {
  return (
    <div className="aia-ias" role="radiogroup" aria-label="Intelligence artificielle">
      {FOURNISSEURS.map((f) => {
        const fiche = cles?.find((c) => c.fournisseur === f.id);
        return (
          <label key={f.id} className="aia-ia" data-ia={f.id} data-choisi={valeur === f.id ? "" : undefined}>
            <input type="radio" name={nom} value={f.id} checked={valeur === f.id} onChange={() => onChange(f.id)} />
            <span className="aia-ia-nom">{f.nom}</span>
            <span className="aia-ia-entreprise">{f.entreprise}</span>
            {cles && <span className="aia-ia-etat">{fiche ? (fiche.statut === "valide" && fiche.lisible !== false ? "Clé reliée" : "Clé à remplacer") : "Pas de clé"}</span>}
          </label>
        );
      })}
    </div>
  );
}

/** Coller sa clé pour une IA : vérifiée auprès de l'IA, puis enregistrée chiffrée, liée au compte. */
export function RelierCle({
  titre,
  texte,
  fournisseurInitial = "anthropic",
  fournisseurFixe = false,
  onRelie,
  compact = false,
}: {
  titre: string;
  texte: string;
  fournisseurInitial?: Fournisseur;
  fournisseurFixe?: boolean;
  onRelie: (f: FicheCle) => void;
  compact?: boolean;
}) {
  const [fournisseur, setFournisseur] = useState<Fournisseur>(fournisseurInitial);
  const [cle, setCle] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const champ = useId();
  const info = infoFournisseur(fournisseur);
  const ex = exemples(fournisseur);

  const relier = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    try {
      const r = await api.relierCle(fournisseur, cle.trim());
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
      {!fournisseurFixe && (
        <>
          <p className="etiquette">L&apos;intelligence artificielle</p>
          <ChoixIA
            valeur={fournisseur}
            nom={`${champ}-ia`}
            onChange={(f) => {
              setFournisseur(f);
              setErreur("");
            }}
          />
        </>
      )}
      <ol className="aia-etapes">
        {info.etapes.map((etape, i) => (
          <li key={etape}>
            {etape}
            {i === 0 && (
              <>
                {" "}
                <a href={info.console} target="_blank" rel="noopener noreferrer">
                  Ouvrir {new URL(info.console).host} <ExternalLink className="inline size-3.5" aria-hidden="true" />
                </a>
              </>
            )}
            {i === info.etapes.length - 1 && fournisseur !== "anthropic" && (
              <>
                {" "}
                <a href={info.pageCle} target="_blank" rel="noopener noreferrer">
                  Page des clés <ExternalLink className="inline size-3.5" aria-hidden="true" />
                </a>
              </>
            )}
          </li>
        ))}
      </ol>
      <label className="etiquette" htmlFor={champ}>
        Ta clé API {info.nom}
      </label>
      <input
        id={champ}
        className="champ aia-champ-cle"
        type="password"
        autoComplete="off"
        spellCheck={false}
        placeholder={info.exemple}
        value={cle}
        onChange={(e) => setCle(e.target.value)}
        required
      />
      <p className="aia-exemples">
        Pour te donner une idée avec {ex.nom} : une question simple coûte environ {formaterCout(ex.simple)} ; avec un PDF de 50 pages, environ {formaterCout(ex.premiere)} la première question, puis{" "}
        {formaterCout(ex.suivante)} les suivantes tant que tu enchaînes (le texte est relu depuis le cache). C&apos;est facturé par {info.entreprise}, sur ton compte.
      </p>
      {erreur && (
        <p className="message message-erreur" role="alert">
          {erreur}
        </p>
      )}
      <button type="submit" className="bouton bouton-principal aia-relier-bouton" disabled={envoi || !cle.trim()}>
        {envoi ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-4" aria-hidden="true" />}
        {envoi ? `Vérification auprès de ${info.entreprise}…` : `Vérifier et relier ma clé ${info.nom}`}
      </button>
      {!compact && (
        <div className="aia-questions">
          <details>
            <summary>Et mon abonnement (Claude Pro, ChatGPT Plus, Gemini Advanced) ?</summary>
            <p>
              Ces trois entreprises n&apos;autorisent pas les autres sites à se servir de la connexion d&apos;un abonnement. L&apos;assistant passe donc par une clé API, payée à l&apos;usage
              (souvent quelques centimes par question), avec ses propres limites. Gemini propose en plus un usage gratuit limité.
            </p>
          </details>
          <details>
            <summary>Ma clé est-elle en sécurité ?</summary>
            <p>
              Elle est chiffrée (AES-256) dès son arrivée, liée à ton compte Google et à cette IA (elle ne se déchiffre pour aucun autre compte), et n&apos;est jamais réaffichée. Le serveur ne s&apos;en
              sert que pour envoyer TES questions à l&apos;IA. Tu peux la retirer ici à tout moment, et la supprimer sur le site de l&apos;IA.
            </p>
          </details>
          <details>
            <summary>Comment limiter ma dépense ?</summary>
            <p>
              Sur le site de l&apos;IA, fixe une limite de dépense mensuelle : c&apos;est la protection qui fait foi. Ici, tu peux aussi fixer un plafond mensuel : l&apos;assistant s&apos;arrête quand son
              estimation l&apos;atteint.
            </p>
          </details>
        </div>
      )}
    </form>
  );
}

/** Le choix du modèle par défaut, rangé par IA. */
export function ChoixModele({ valeur, onChange, nom, cles }: { valeur: IdModele; onChange: (m: IdModele) => void; nom: string; cles: FicheCle[] }) {
  return (
    <div className="aia-modeles-groupes">
      {FOURNISSEURS.map((f) => (
        <fieldset key={f.id} className="aia-modeles">
          <legend className="aia-modeles-legende">
            {f.nom} <span>{cles.some((c) => c.fournisseur === f.id) ? "" : "· clé à relier"}</span>
          </legend>
          {modelesDe(f.id).map((m) => (
            <label key={m.id} className="aia-modele" data-choisi={valeur === m.id ? "" : undefined}>
              <input type="radio" name={nom} value={m.id} checked={valeur === m.id} onChange={() => onChange(m.id)} />
              <span className="aia-modele-nom">{m.nom}</span>
              <span className="aia-modele-role">{m.role}</span>
              <span className="aia-modele-prix">
                {m.tarif.entree.toLocaleString("fr-FR")} $ / {m.tarif.sortie.toLocaleString("fr-FR")} $ le million de jetons
              </span>
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

/** Le panneau des réglages : les clés des trois IA, modèle, effort, plafond, consommation du mois. */
export function Reglages({
  cles,
  reglages,
  bilan,
  ouvrirSur,
  onCle,
  onOublie,
  onReglages,
  onFermer,
}: {
  cles: FicheCle[];
  reglages: ReglagesCompte;
  bilan: Bilan | null;
  /** Ouvrir directement le formulaire de clé de cette IA. */
  ouvrirSur?: Fournisseur | null;
  onCle: (f: FicheCle) => void;
  onOublie: (f: Fournisseur) => void;
  onReglages: (r: ReglagesCompte) => void;
  onFermer: () => void;
}) {
  const [relier, setRelier] = useState<Fournisseur | null>(ouvrirSur ?? null);
  const [plafond, setPlafond] = useState(reglages.plafond === null ? "" : String(reglages.plafond));
  const [message, setMessage] = useState<{ type: "succes" | "erreur"; texte: string } | null>(null);
  const [confirmer, setConfirmer] = useState<Fournisseur | null>(null);
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
      const r = await api.regler(choix);
      onReglages(r.reglages);
      setMessage({ type: "succes", texte: ok });
    } catch (err) {
      setMessage({ type: "erreur", texte: err instanceof ErreurApi ? err.message : "Enregistrement impossible." });
    }
  };

  const oublier = async (f: Fournisseur) => {
    setConfirmer(null);
    try {
      await api.oublierCle(f);
      onOublie(f);
      setMessage({ type: "succes", texte: `Clé ${infoFournisseur(f).nom} retirée.` });
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
              estimés ce mois-ci, toutes IA confondues, pour {bilan.moisAppels.toLocaleString("fr-FR")} réponse{bilan.moisAppels > 1 ? "s" : ""} et {formaterJetons(bilan.moisJetons)} jetons. La
              facture qui fait foi est sur le site de chaque IA.
            </p>
          </section>
        )}

        <section className="aia-section">
          <h3>Tes clés</h3>
          <ul className="aia-cles">
            {FOURNISSEURS.map((f) => {
              const fiche = cles.find((c) => c.fournisseur === f.id);
              const ok = fiche && fiche.statut === "valide" && fiche.lisible !== false;
              return (
                <li key={f.id} className="aia-cle" data-ia={f.id}>
                  <div className="aia-cle-ligne">
                    <span className="aia-cle-nom">{f.nom}</span>
                    {fiche ? <code>{fiche.apercu}</code> : <span className="aia-cle-absente">pas de clé</span>}
                    {fiche && <span data-etat={ok ? "ok" : "ko"}>{fiche.lisible === false ? "à recoller" : ok ? "reliée" : "refusée"}</span>}
                  </div>
                  {relier === f.id ? (
                    <>
                      <RelierCle
                        compact
                        fournisseurFixe
                        fournisseurInitial={f.id}
                        titre={fiche ? `Remplacer la clé ${f.nom}` : `Relier une clé ${f.nom}`}
                        texte={fiche ? "La nouvelle clé est vérifiée, puis remplace l'ancienne." : `Tes questions à ${f.nom} seront facturées sur ton compte ${f.entreprise}.`}
                        onRelie={(nouvelle) => {
                          onCle(nouvelle);
                          setRelier(null);
                          setMessage({ type: "succes", texte: `Clé ${f.nom} vérifiée et reliée à ton compte.` });
                        }}
                      />
                      <button type="button" className="bouton bouton-discret mt-2" onClick={() => setRelier(null)}>
                        Annuler
                      </button>
                    </>
                  ) : (
                    <div className="aia-actions">
                      <button type="button" className="bouton bouton-discret" onClick={() => setRelier(f.id)}>
                        {fiche ? "Remplacer" : "Relier une clé"}
                      </button>
                      {fiche &&
                        (confirmer === f.id ? (
                          <>
                            <button type="button" className="bouton bouton-danger" onClick={() => void oublier(f.id)}>
                              Oui, retirer
                            </button>
                            <button type="button" className="bouton bouton-discret" onClick={() => setConfirmer(null)}>
                              Annuler
                            </button>
                          </>
                        ) : (
                          <button type="button" className="bouton bouton-discret" onClick={() => setConfirmer(f.id)}>
                            <Trash2 className="size-4" aria-hidden="true" />
                            Retirer
                          </button>
                        ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="aia-section">
          <h3>Modèle par défaut</h3>
          <ChoixModele valeur={reglages.modele} cles={cles} nom={`${nom}-modele`} onChange={(m) => void regler({ modele: m }, "Modèle enregistré.")} />
        </section>
        <section className="aia-section">
          <h3>Réflexion</h3>
          <div className="aia-efforts" role="radiogroup" aria-label="Réflexion">
            {EFFORTS.map((ef) => (
              <label key={ef.id} className="aia-effort" data-choisi={reglages.effort === ef.id ? "" : undefined}>
                <input type="radio" name={`${nom}-effort`} checked={reglages.effort === ef.id} onChange={() => void regler({ effort: ef.id }, "Réglage enregistré.")} />
                <span className="aia-effort-nom">{ef.nom}</span>
                <span className="aia-effort-aide">{ef.aide}</span>
              </label>
            ))}
          </div>
        </section>
        <section className="aia-section">
          <h3>Plafond mensuel</h3>
          <p className="aide">L&apos;assistant refuse d&apos;envoyer une question quand son estimation du mois (toutes IA confondues) atteint ce montant. Laisse vide pour ne pas en fixer.</p>
          <form
            className="aia-plafond"
            onSubmit={(e) => {
              e.preventDefault();
              const v = plafond.trim();
              void regler({ plafond: v === "" ? null : Number(v.replace(",", ".")) }, v === "" ? "Plafond retiré." : "Plafond enregistré.");
            }}
          >
            <input className="champ" inputMode="decimal" placeholder="Par exemple 5" value={plafond} onChange={(e) => setPlafond(e.target.value)} aria-label="Plafond mensuel en dollars" />
            <span aria-hidden="true">$</span>
            <button type="submit" className="bouton bouton-discret">
              Enregistrer
            </button>
          </form>
        </section>

        {message && (
          <p className={`message ${message.type === "succes" ? "message-succes" : "message-erreur"}`} role="status">
            {message.texte}
          </p>
        )}
      </div>
    </aside>
  );
}
