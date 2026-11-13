"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { evaluerMotDePasse } from "@/lib/password-policy";

type Props = {
  nom: string;
  libelle: string;
  valeur: string;
  onChange: (valeur: string) => void;
  autoComplete: "current-password" | "new-password";
  /** Affiche la jauge de robustesse sous le champ. */
  jauge?: boolean;
  aide?: string;
};

const COULEURS_JAUGE = ["var(--danger)", "var(--danger)", "var(--or)", "var(--succes)", "var(--succes)"];

export function ChampMotDePasse({ nom, libelle, valeur, onChange, autoComplete, jauge = false, aide }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const robustesse = evaluerMotDePasse(valeur);

  return (
    <div>
      <label htmlFor={id} className="etiquette">
        {libelle}
      </label>
      <div className="relative">
        <input
          id={id}
          name={nom}
          type={visible ? "text" : "password"}
          value={valeur}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          className="champ pr-14"
          aria-describedby={jauge || aide ? `${id}-aide` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-1 grid w-12 place-items-center text-encre-douce"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
        </button>
      </div>
      <div id={`${id}-aide`} className="mt-2">
        {jauge && valeur.length > 0 && (
          <>
            <div className="flex gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4].map((palier) => (
                <span
                  key={palier}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ background: robustesse.score >= palier ? COULEURS_JAUGE[robustesse.score] : "var(--trait)" }}
                />
              ))}
            </div>
            <p className="aide mt-1.5">
              Robustesse : {robustesse.libelle.toLowerCase()}.{" "}
              {robustesse.problemes.join(" ")}
            </p>
          </>
        )}
        {aide && !(jauge && valeur.length > 0) && <p className="aide">{aide}</p>}
      </div>
    </div>
  );
}
