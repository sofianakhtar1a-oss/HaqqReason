"use client";

import { Check, Copy, Eye, EyeOff, KeyRound, Shuffle } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { evaluer, genererMotDePasse, tirage } from "@/lib/alambic/force";

/** Interrupteur « protéger », mot de passe, jauge de force en temps réel, générateur. */
export function ChampProtection({
  actif,
  onActif,
  motDePasse,
  onMotDePasse,
  toujours = false,
  formatPdf,
}: {
  actif: boolean;
  onActif: (v: boolean) => void;
  motDePasse: string;
  onMotDePasse: (v: string) => void;
  /** Dans l'outil « Protéger », le mot de passe n'est pas optionnel. */
  toujours?: boolean;
  /** Le résultat sera un PDF (chiffré tel quel) ou non (rangé dans un ZIP chiffré). */
  formatPdf: boolean | null;
}) {
  const [visible, setVisible] = useState(false);
  const [copie, setCopie] = useState(false);
  // Ce qui est tapé ; l'outil ne reçoit le mot de passe qu'une fois confirmé (une faute de frappe
  // dans un mot de passe caché rendrait le fichier impossible à rouvrir).
  const [saisie, setSaisie] = useState(motDePasse);
  const [confirmation, setConfirmation] = useState("");
  const [genere, setGenere] = useState(false);
  const id = useId();
  const force = useMemo(() => evaluer(saisie), [saisie]);
  const ouvert = toujours || actif;
  const confirme = !saisie || visible || genere || confirmation === saisie;
  const transmettre = (s: string, c: string, v: boolean, g: boolean) => onMotDePasse(!s || v || g || c === s ? s : "");

  return (
    <div className="alambic-protection" data-ouvert={ouvert || undefined}>
      {!toujours && (
        <label className="alambic-interrupteur">
          <input type="checkbox" checked={actif} onChange={(e) => onActif(e.target.checked)} />
          <span className="alambic-interrupteur-piste" aria-hidden="true" />
          <span>
            <span className="font-semibold">Protéger par un mot de passe</span>
            <span className="block text-sm text-encre-douce">Chiffrement AES-256, fait sur ton appareil.</span>
          </span>
        </label>
      )}
      {ouvert && (
        <div className="alambic-mdp">
          <label htmlFor={id} className="sr-only">
            Mot de passe
          </label>
          <div className="alambic-mdp-champ">
            <KeyRound className="size-4 shrink-0 text-encre-douce" aria-hidden="true" />
            <input
              id={id}
              type={visible ? "text" : "password"}
              value={saisie}
              onChange={(e) => {
                setSaisie(e.target.value);
                setGenere(false);
                transmettre(e.target.value, confirmation, visible, false);
                setCopie(false);
              }}
              placeholder="Choisis un mot de passe"
              autoComplete="new-password"
              spellCheck={false}
              aria-describedby={`${id}-force`}
            />
            <button
              type="button"
              className="bouton-icone !size-9"
              onClick={() => {
                setVisible(!visible);
                transmettre(saisie, confirmation, !visible, genere);
              }}
              aria-label={visible ? "Cacher le mot de passe" : "Afficher le mot de passe"}
            >
              {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="bouton-icone !size-9"
              title="Générer un mot de passe très fort"
              aria-label="Générer un mot de passe très fort"
              onClick={() => {
                const neuf = genererMotDePasse(tirage);
                setSaisie(neuf);
                setGenere(true);
                setVisible(true);
                onMotDePasse(neuf);
                setCopie(false);
              }}
            >
              <Shuffle className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="bouton-icone !size-9"
              disabled={!saisie}
              aria-label="Copier le mot de passe"
              title="Copier"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(saisie);
                  setCopie(true);
                } catch {
                  setCopie(false);
                }
              }}
            >
              {copie ? <Check className="size-4 text-succes" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            </button>
          </div>

          {saisie && !visible && !genere && (
            <div className="alambic-mdp-champ" data-faux={confirmation && confirmation !== saisie ? true : undefined}>
              <KeyRound className="size-4 shrink-0 text-encre-douce" aria-hidden="true" />
              <label htmlFor={`${id}-confirmation`} className="sr-only">
                Confirme le mot de passe
              </label>
              <input
                id={`${id}-confirmation`}
                type="password"
                value={confirmation}
                onChange={(e) => {
                  setConfirmation(e.target.value);
                  transmettre(saisie, e.target.value, visible, genere);
                }}
                placeholder="Retape-le pour confirmer"
                autoComplete="new-password"
                spellCheck={false}
              />
              {confirme && <Check className="size-4 shrink-0 text-succes" aria-label="Les deux saisies sont identiques" />}
            </div>
          )}
          {saisie && !confirme && confirmation && <p className="text-sm text-danger">Les deux saisies ne sont pas identiques.</p>}
          <div id={`${id}-force`} className="alambic-force" data-niveau={saisie ? force.niveau : undefined} aria-live="polite">
            <div className="alambic-force-barres" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} data-allume={saisie && i <= force.niveau ? true : undefined} />
              ))}
            </div>
            {saisie ? (
              <p className="text-sm">
                <strong>{force.libelle}.</strong> <span className="text-encre-douce">Temps estimé pour le deviner : {force.duree}.</span>
              </p>
            ) : (
              <p className="text-sm text-encre-douce">Le bouton de mélange en crée un très fort. Garde-le précieusement : sans lui, le fichier ne s&apos;ouvre plus, et personne ne peut le retrouver.</p>
            )}
            {force.conseils.map((c) => (
              <p key={c} className="text-sm text-encre-douce">
                {c}
              </p>
            ))}
          </div>
          {formatPdf !== null && (
            <p className="text-sm text-encre-douce">
              {formatPdf
                ? "Le PDF est chiffré tel quel : n'importe quel lecteur PDF demandera le mot de passe."
                : "Ce format ne se chiffre pas lui-même : il sera rangé dans un ZIP chiffré, qui s'ouvre avec 7-Zip, WinRAR, Keka ou The Unarchiver (pas avec l'explorateur de Windows)."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Un mot de passe est-il acceptable pour lancer la protection ? (Pas d'interdiction : un avertissement suffit.) */
export function motDePassePret(actif: boolean, mdp: string): boolean {
  return !actif || mdp.length > 0;
}
