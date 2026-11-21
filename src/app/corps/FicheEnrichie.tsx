"use client";

import { Play } from "lucide-react";
import { PAR_ID, nomDe } from "@/lib/corps/catalogue";
import type { FicheChargee } from "@/lib/corps/fiches";
import type { FicheArtere, FicheMuscle, FicheOs, FicheTendon } from "@/lib/corps/fiches/types";
import { NOMS_ARTICULATIONS, NOMS_MOUVEMENTS } from "@/lib/corps/mouvement/articulations";
import type { Action } from "@/lib/corps/mouvement/gestes";

/*
 * La fiche enrichie d'une structure : ce qu'un étudiant doit en savoir, rangé comme sur une planche d'atlas.
 * Les structures citées se touchent (on y va) ; les actions d'un muscle se jouent sur le corps.
 */

type Aller = (id: string) => void;
type Jouer = (a: Action) => void;

const NOMS_SORTES: Record<FicheOs["sorte"], string> = { long: "Os long", court: "Os court", plat: "Os plat", irregulier: "Os irrégulier", sesamoide: "Os sésamoïde", cartilage: "Cartilage", dent: "Dent", groupe: "Groupe d'os" };

function Puces({ ids, aller }: { ids?: (string | null | undefined)[]; aller?: Aller }) {
  const connus = (ids ?? []).filter((id): id is string => Boolean(id && PAR_ID.has(id)));
  if (!connus.length) return null;
  return (
    <span className="ec-fiche-puces">
      {connus.map((id) => (
        <button key={id} type="button" className="ec-puce" data-couche={PAR_ID.get(id)!.couche} onClick={() => aller?.(id)} disabled={!aller}>
          {nomDe(id)}
        </button>
      ))}
    </span>
  );
}

function Ligne({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div>
      <dt>{titre}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Racines({ racines }: { racines: string[] }) {
  return (
    <span className="ec-fiche-racines" aria-label={`Racines : ${racines.join(", ")}`}>
      {racines.map((r) => (
        <b key={r}>{r}</b>
      ))}
    </span>
  );
}

function Muscle({ f, aller, jouer }: { f: FicheMuscle; aller?: Aller; jouer?: Jouer }) {
  return (
    <>
      <Ligne titre="Origine">
        <ul className="ec-fiche-liste">
          {f.origine.map((a) => (
            <li key={a.texte}>{a.texte}</li>
          ))}
        </ul>
      </Ligne>
      <Ligne titre="Terminaison">
        <ul className="ec-fiche-liste">
          {f.terminaison.map((a) => (
            <li key={a.texte}>{a.texte}</li>
          ))}
        </ul>
      </Ligne>
      <Ligne titre="Action">
        {f.action}
        <span className="ec-fiche-actions">
          {f.actions.map((a) => (
            <button key={`${a.articulation}/${a.mouvement}`} type="button" className="ec-action" data-role={a.role} title={a.precision ?? (a.role === "principal" ? "Action principale" : "Action accessoire")} onClick={() => jouer?.(a)} disabled={!jouer}>
              {jouer && <Play size={11} aria-hidden="true" />}
              <span>{NOMS_ARTICULATIONS[a.articulation] ?? a.articulation}</span>
              {(NOMS_MOUVEMENTS[a.mouvement] ?? a.mouvement).toLowerCase()}
              <span className="ec-visuel-cache">{a.role === "principal" ? " (action principale)" : " (action accessoire)"}</span>
            </button>
          ))}
        </span>
      </Ligne>
      {(f.synergistes?.length ?? 0) > 0 && (
        <Ligne titre="Avec lui">
          <Puces ids={f.synergistes} aller={aller} />
        </Ligne>
      )}
      {(f.antagonistes?.length ?? 0) > 0 && (
        <Ligne titre="Contre lui">
          <Puces ids={f.antagonistes} aller={aller} />
        </Ligne>
      )}
      <Ligne titre="Innervation">
        {f.innervation.texte} <Racines racines={f.innervation.racines} />
        <Puces ids={[f.innervation.nerf]} aller={aller} />
      </Ligne>
      <Ligne titre="Vascularisation">
        {f.vascularisation.texte}
        <Puces ids={f.vascularisation.arteres} aller={aller} />
      </Ligne>
      {f.palpation && <Ligne titre="Le sentir">{f.palpation}</Ligne>}
      {f.test && <Ligne titre="Le tester">{f.test}</Ligne>}
      <Ligne titre="S'il manque">{f.atteinte}</Ligne>
    </>
  );
}

function Artere({ f, aller }: { f: FicheArtere; aller?: Aller }) {
  return (
    <>
      <Ligne titre="Naît de">
        {f.provenance.texte}
        <Puces ids={[f.provenance.artere]} aller={aller} />
      </Ligne>
      <Ligne titre="Trajet">{f.trajet}</Ligne>
      {(f.branches?.length ?? 0) > 0 && (
        <Ligne titre="Branches">
          <ol className="ec-fiche-liste est-ordonnee">
            {f.branches!.map((b) => (
              <li key={b.texte}>
                {b.artere && PAR_ID.has(b.artere) ? (
                  <button type="button" className="ec-lien" onClick={() => aller?.(b.artere!)} disabled={!aller}>
                    {b.texte}
                  </button>
                ) : (
                  b.texte
                )}
              </li>
            ))}
          </ol>
        </Ligne>
      )}
      <Ligne titre="Se termine">{f.terminaison}</Ligne>
      <Ligne titre="Irrigue">
        {f.territoire.texte}
        <Puces ids={f.territoire.structures} aller={aller} />
      </Ligne>
      {f.rapports && <Ligne titre="Rapports">{f.rapports}</Ligne>}
      {f.pouls && <Ligne titre="Son pouls">{f.pouls.ou}</Ligne>}
      {f.anastomoses && <Ligne titre="Anastomoses">{f.anastomoses}</Ligne>}
    </>
  );
}

function Os({ f, aller }: { f: FicheOs; aller?: Aller }) {
  return (
    <>
      <Ligne titre="Forme">{NOMS_SORTES[f.sorte]}</Ligne>
      {(f.articulations?.length ?? 0) > 0 && (
        <Ligne titre="S'articule avec">
          <ul className="ec-fiche-liste">
            {f.articulations!.map((a) => (
              <li key={`${a.os}/${a.nom}`}>
                {a.os && PAR_ID.has(a.os) ? (
                  <button type="button" className="ec-lien" onClick={() => aller?.(a.os!)} disabled={!aller}>
                    {nomDe(a.os)}
                  </button>
                ) : null}
                {a.os && PAR_ID.has(a.os) ? " : " : ""}
                {a.nom}
                {a.type ? <i> ({a.type})</i> : null}
              </li>
            ))}
          </ul>
        </Ligne>
      )}
      {(f.reliefs?.length ?? 0) > 0 && (
        <Ligne titre="Reliefs">
          <ul className="ec-fiche-liste">
            {f.reliefs!.map((r) => (
              <li key={r.nom}>
                <b>{r.nom}</b> : {r.role}
              </li>
            ))}
          </ul>
        </Ligne>
      )}
      {(f.foramens?.length ?? 0) > 0 && (
        <Ligne titre="Orifices">
          <ul className="ec-fiche-liste">
            {f.foramens!.map((o) => (
              <li key={o.nom}>
                <b>{o.nom}</b> : {o.contenu}
              </li>
            ))}
          </ul>
        </Ligne>
      )}
      {f.ossification && <Ligne titre="Ossification">{f.ossification}</Ligne>}
      {f.palpation && <Ligne titre="Le sentir">{f.palpation}</Ligne>}
    </>
  );
}

function Tendon({ f, aller }: { f: FicheTendon; aller?: Aller }) {
  return (
    <>
      {(f.muscles?.length ?? 0) > 0 && (
        <Ligne titre={f.muscles!.length > 1 ? "Muscles" : "Muscle"}>
          <Puces ids={f.muscles} aller={aller} />
        </Ligne>
      )}
      <Ligne titre="Attache">{f.attache}</Ligne>
      <Ligne titre="Rôle">{f.role}</Ligne>
      {f.rapports && <Ligne titre="Rapports">{f.rapports}</Ligne>}
      {f.reflexe && (
        <Ligne titre="Réflexe">
          {f.reflexe.nom} <Racines racines={f.reflexe.racines} />
        </Ligne>
      )}
      {f.palpation && <Ligne titre="Le sentir">{f.palpation}</Ligne>}
    </>
  );
}

export function FicheEnrichie({ charge, aller, jouer }: { charge: FicheChargee; aller?: Aller; jouer?: Jouer }) {
  const f = charge.fiche;
  return (
    <div className="ec-fiche">
      <p className="ec-fiche-resume">{f.resume}</p>
      <dl className="ec-cartel-lignes">
        {charge.couche === "muscle" && <Muscle f={f as FicheMuscle} aller={aller} jouer={jouer} />}
        {charge.couche === "artere" && <Artere f={f as FicheArtere} aller={aller} />}
        {charge.couche === "os" && <Os f={f as FicheOs} aller={aller} />}
        {charge.couche === "tendon" && <Tendon f={f as FicheTendon} aller={aller} />}
        {"clinique" in f && f.clinique && <Ligne titre="En clinique">{f.clinique}</Ligne>}
        {f.variantes && <Ligne titre="Variantes">{f.variantes}</Ligne>}
      </dl>
      {"memo" in f && f.memo && <p className="ec-memo">{f.memo}</p>}
      {charge.sources.length > 0 && (
        <details className="ec-fiche-sources">
          <summary>
            {charge.sources.length} source{charge.sources.length > 1 ? "s" : ""}
            {f.divergences ? " · un point où elles divergent" : ""}
          </summary>
          {f.divergences && <p>{f.divergences}</p>}
          <ul>
            {charge.sources.map((s) => (
              <li key={s.url + s.titre}>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noreferrer noopener">
                    {s.titre}
                  </a>
                ) : (
                  s.titre
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
