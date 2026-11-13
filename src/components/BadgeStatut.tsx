export function BadgeStatut({ statut, corbeille = false }: { statut: "brouillon" | "publie"; corbeille?: boolean }) {
  if (corbeille) return <span className="badge badge-corbeille">Corbeille</span>;
  return statut === "publie" ? <span className="badge badge-publie">Publié</span> : <span className="badge badge-brouillon">Brouillon</span>;
}
