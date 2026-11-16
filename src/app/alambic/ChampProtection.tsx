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
  const id = useId();
  const force = useMemo(() => evaluer(motDePasse), [motDePasse]);
  const ouvert = toujours || actif;

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
              value={motDePasse}
              onChange={(e) => {
                onMotDePasse(e.target.value);
                setCopie(false);
              }}
              placeholder="Choisis un mot de passe"
              autoComplete="new-password"
              spellCheck={false}
              aria-describedby={`${id}-force`}
            />
            <button type="button" className="bouton-icone !size-9" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Cacher le mot de passe" : "Afficher le mot de passe"}>
              {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="bouton-icone !size-9"
              title="Générer un mot de passe très fort"
              aria-label="Générer un mot de passe très fort"
              onClick={() => {
                onMotDePasse(genererMotDePasse(tirage));
                setVisible(true);
                setCopie(false);
              }}
            >
              <Shuffle className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="bouton-icone !size-9"
              disabled={!motDePasse}
              aria-label="Copier le mot de passe"
              title="Copier"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(motDePasse);
                  setCopie(true);
                } catch {
                  setCopie(false);
                }
              }}
            >
              {copie ? <Check className="size-4 text-succes" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            </button>
          </div>

          <div id={`${id}-force`} className="alambic-force" data-niveau={motDePasse ? force.niveau : undefined} aria-live="polite">
            <div className="alambic-force-barres" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} data-allume={motDePasse && i <= force.niveau ? true : undefined} />
              ))}
            </div>
            {motDePasse ? (
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
