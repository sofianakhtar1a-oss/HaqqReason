import type { EtatFormulaire } from "@/lib/form-state";

export function MessageFormulaire({ etat }: { etat: EtatFormulaire }) {
  if (etat.statut === "erreur") {
    return (
      <p role="alert" className="message message-erreur">
        {etat.message}
      </p>
    );
  }
  if (etat.statut === "succes" && etat.message) {
    return (
      <p role="status" className="message message-succes">
        {etat.message}
      </p>
    );
  }
  return null;
}
