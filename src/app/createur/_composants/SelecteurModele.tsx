/** Choix du point de départ d'un nouvel article. */
export function SelecteurModele({ integres, perso }: { integres: { cle: string; nom: string }[]; perso: { id: string; nom: string }[] }) {
  return (
    <div>
      <label htmlFor="choix-modele" className="etiquette text-sm">
        Point de départ
      </label>
      <select id="choix-modele" name="modele" className="champ !min-h-11 !py-2" defaultValue="vide">
        <option value="vide">Article vide</option>
        <optgroup label="Modèles fournis">
          {integres.map((m) => (
            <option key={m.cle} value={`integre:${m.cle}`}>
              {m.nom}
            </option>
          ))}
        </optgroup>
        {perso.length > 0 && (
          <optgroup label="Mes modèles">
            {perso.map((m) => (
              <option key={m.id} value={`perso:${m.id}`}>
                {m.nom}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
