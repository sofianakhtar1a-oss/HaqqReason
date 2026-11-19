"use client";

import Link from "next/link";
import { ChevronDown, Home, Volume2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPopulation, formatSuperficie, LIBELLES_STATUT, motCapitale, NOM_CONTINENT, pays as paysDe, PAR_CODE } from "@/lib/monde/atlas";
import { fuseauxDe, momentDuJour } from "@/lib/monde/calques";
import { CATEGORIES, IDS_CATEGORIES } from "@/lib/monde/categories";
import { decalageMinutes, distanceKm, dureeVol, ecartHoraire, formatDecalage, formatDensite, formatKm, formatVille, heureLocale, type LatLng, pointCardinal, pointDe, qibla } from "@/lib/monde/geo";
import { ORGANISATIONS } from "@/lib/monde/organisations";
import { boite, regler, useMonde } from "@/lib/monde/progression";
import { useRecits } from "@/lib/monde/recits-client";
import type { Pays } from "@/lib/monde/types";
import { dire, type LangueVoix, voixPour } from "@/lib/monde/voix";
import { Drapeau } from "./figures";

/*
 * La fiche d'un pays : l'essentiel d'abord (capitale, chiffres, voisins), puis ce qu'elle raconte
 * (symboles, histoire, géographie, langues, codes, direction de La Mecque), et ce que ta mémoire
 * en a retenu. Les récits arrivent un instant après le reste : ils sont chargés à la demande.
 */

/** Écouter un nom dans sa langue. */
function BoutonVoix({ texte, langue, libelle }: { texte: string; langue: LangueVoix; libelle: string }) {
  const [parle, setParle] = useState(false);
  const [possible] = useState(() => voixPour(langue));
  if (!possible) return null;
  return (
    <button
      type="button"
      className="pt-voix"
      data-parle={parle || undefined}
      aria-label={libelle}
      title={libelle}
      onClick={() => {
        setParle(true);
        void dire(texte, langue).finally(() => setParle(false));
      }}
    >
      <Volume2 className="size-4" aria-hidden="true" />
    </button>
  );
}

/** « 2 h de plus », « 30 min de moins ». */
function duree(ecart: number): string {
  const h = Math.trunc(Math.abs(ecart) / 60);
  const m = Math.abs(ecart) % 60;
  return `${h ? `${h} h` : ""}${m ? `${h ? " " : ""}${m} min` : ""}`;
}

const MOMENTS = { jour: "il y fait jour", crepuscule: "c'est l'aube ou le crépuscule", nuit: "il y fait nuit" } as const;

/** L'heure qu'il est là-bas, qui avance d'elle-même (et s'il y fait jour ou nuit). */
function HeureLocale({ fuseau, lieu, chezMoi }: { fuseau: string; lieu: LatLng; chezMoi?: { nom: string; fuseau: string } }) {
  const [maintenant, setMaintenant] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setMaintenant(new Date()), 20_000);
    return () => clearInterval(t);
  }, []);
  const ecart = ecartHoraire(fuseau, "Europe/Paris", maintenant);
  const ecartMoi = chezMoi && chezMoi.fuseau !== "Europe/Paris" ? ecartHoraire(fuseau, chezMoi.fuseau, maintenant) : null;
  return (
    <>
      <time dateTime={maintenant.toISOString()}>{heureLocale(fuseau, maintenant)}</time>
      <small>
        {formatDecalage(decalageMinutes(fuseau, maintenant))}
        {" · "}
        {ecart === 0 ? "la même heure qu'à Paris" : `${duree(ecart)} de ${ecart > 0 ? "plus" : "moins"} qu'à Paris`}
      </small>
      {ecartMoi !== null && <small>{ecartMoi === 0 ? `la même heure que chez toi (${chezMoi!.nom})` : `${duree(ecartMoi)} de ${ecartMoi > 0 ? "plus" : "moins"} que chez toi (${chezMoi!.nom})`}</small>}
      <small>En ce moment, {MOMENTS[momentDuJour(lieu, maintenant)]}.</small>
    </>
  );
}

/** Une rubrique qui se replie. */
function Rubrique({ titre, apercu, ouvert = false, children }: { titre: string; apercu?: string; ouvert?: boolean; children: React.ReactNode }) {
  return (
    <details className="pt-fiche-rubrique" open={ouvert || undefined}>
      <summary>
        <span className="pt-fiche-rubrique-titre">{titre}</span>
        {apercu && <span className="pt-fiche-rubrique-apercu">{apercu}</span>}
        <ChevronDown className="pt-fiche-rubrique-chevron size-4" aria-hidden="true" />
      </summary>
      <div className="pt-fiche-rubrique-corps">{children}</div>
    </details>
  );
}

function Ligne({ terme, children }: { terme: string; children: React.ReactNode }) {
  return (
    <div>
      <dt>{terme}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** La rose des vents, l'aiguille pointée vers la Kaaba. */
function Qibla({ p }: { p: Pays }) {
  const q = qibla(p);
  const degres = Math.round(q.cap);
  return (
    <div className="pt-qibla">
      <svg viewBox="-50 -50 100 100" className="pt-qibla-rose" role="img" aria-label={`La qibla : ${degres} degrés, vers le ${pointCardinal(q.cap)}`}>
        <circle r="46" className="pt-qibla-cercle" />
        {Array.from({ length: 16 }, (_, i) => (
          <line key={i} y1={-46} y2={i % 4 === 0 ? -38 : -42} transform={`rotate(${i * 22.5})`} className="pt-qibla-graduation" />
        ))}
        {(["N", "E", "S", "O"] as const).map((l, i) => (
          <text key={l} transform={`rotate(${i * 90}) translate(0 -29) rotate(${-i * 90})`} className="pt-qibla-lettre" textAnchor="middle" dominantBaseline="central">
            {l}
          </text>
        ))}
        <g className="pt-qibla-aiguille" style={{ "--cap": `${q.cap}deg` } as React.CSSProperties}>
          <path d="M0 -40 L6 0 L0 6 L-6 0 Z" className="pt-qibla-pointe" />
          <path d="M0 6 L5 0 L0 30 L-5 0 Z" className="pt-qibla-queue" />
        </g>
        <circle r="3.2" className="pt-qibla-axe" />
      </svg>
      <p>
        Depuis {q.depuis}, la qibla est à <strong>{degres}°</strong>, vers le {pointCardinal(q.cap)}.
        <small>La Kaaba est à {formatKm(q.km)} à vol d&apos;oiseau, en suivant la courbe de la Terre.</small>
      </p>
    </div>
  );
}

export function FichePays({ code, onChoisir, onFermer, compacte = false }: { code: string; onChoisir?: (code: string) => void; onFermer?: () => void; compacte?: boolean }) {
  const p = paysDe(code);
  const monde = useMonde();
  const recits = useRecits();
  const r = recits?.[code];
  const souverain = p.souverain ? PAR_CODE.get(p.souverain) : undefined;
  const densite = formatDensite(p.population, p.superficie);
  const lienPays = (c: string, nom: string) =>
    onChoisir ? (
      <button type="button" className="pt-lien" onClick={() => onChoisir(c)}>
        {nom}
      </button>
    ) : (
      nom
    );

  const moi = monde.profil.monPays ? PAR_CODE.get(monde.profil.monPays) : undefined;
  const depuisMoi = moi && moi.code !== p.code ? { km: distanceKm(pointDe(moi).latlng, pointDe(p).latlng), depuis: pointDe(moi).capitale && moi.capitale ? moi.capitale : moi.nom } : null;
  const plusieurs = fuseauxDe(p.code);
  const symboles = Boolean(r?.devise || r?.hymne || r?.fete || r?.drapeau);
  const histoire = Boolean(r?.independance || r?.anciens?.length || r?.etymologie);
  const villes = r?.villes ?? (p.villes ?? []).map((v) => [v] as [string]);

  return (
    <article className="pt-fiche" data-compacte={compacte || undefined} aria-label={`Fiche : ${p.nom}`}>
      <header className="pt-fiche-tete">
        <Drapeau code={p.code} grand />
        <div>
          <h3 className="pt-fiche-nom">
            {p.nom}
            <BoutonVoix texte={p.nom} langue="fr" libelle={`Écouter : ${p.nom}`} />
          </h3>
          {p.complet && p.complet !== p.nom && <p className="pt-fiche-complet">{p.complet}</p>}
          <p className="pt-fiche-statut">{p.nature ?? LIBELLES_STATUT[p.statut]}</p>
        </div>
        {onFermer && (
          <button type="button" className="pt-icone pt-fiche-fermer" onClick={onFermer} aria-label="Fermer la fiche">
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </header>

      {r?.anecdote && (
        <aside className="pt-fiche-savais" aria-label="Le savais-tu ?">
          <p className="pt-fiche-savais-titre">Le savais-tu ?</p>
          <p>{r.anecdote}</p>
        </aside>
      )}

      <dl className="pt-fiche-faits">
        <div>
          <dt>{motCapitale(p)}</dt>
          <dd>
            {p.capitale ?? "—"}
            {p.noteCapitale && <small>{p.noteCapitale}</small>}
          </dd>
        </div>
        {p.fuseau && (
          <div>
            <dt>L&apos;heure là-bas</dt>
            <dd>
              <HeureLocale fuseau={p.fuseau} lieu={pointDe(p).latlng} chezMoi={moi?.fuseau && moi.code !== p.code ? { nom: moi.nom, fuseau: moi.fuseau } : undefined} />
              {plusieurs && (
                <small>
                  L&apos;heure de {p.capitale ?? "la capitale"} : le pays vit à {plusieurs.length} heures différentes, de {formatDecalage(plusieurs[0])} à {formatDecalage(plusieurs[plusieurs.length - 1])} en hiver.
                </small>
              )}
            </dd>
          </div>
        )}
        <div>
          <dt>Continent</dt>
          <dd>
            {NOM_CONTINENT[p.continent]}
            {p.continents?.length ? ` (et ${p.continents.map((c) => NOM_CONTINENT[c]).join(", ")})` : ""}
            <small>{p.sousRegion}</small>
          </dd>
        </div>
        <div>
          <dt>Population</dt>
          <dd>
            {formatPopulation(p.population)}
            {(p.anneePopulation || p.notePopulation) && <small>{[p.anneePopulation ? `en ${p.anneePopulation}` : "", p.notePopulation ?? ""].filter(Boolean).join(" · ")}</small>}
          </dd>
        </div>
        <div>
          <dt>Superficie</dt>
          <dd>
            {formatSuperficie(p.superficie)}
            {densite && <small>{densite}</small>}
          </dd>
        </div>
        <div>
          <dt>Monnaie{p.monnaies.length > 1 ? "s" : ""}</dt>
          <dd>
            {p.monnaies.length
              ? p.monnaies.map((m, i) => (
                  <span key={m.code}>
                    {i > 0 && " · "}
                    {m.nom}
                    {m.symbole && (
                      <>
                        {" "}(<bdi>{m.symbole}</bdi>)
                      </>
                    )}
                  </span>
                ))
              : "—"}
          </dd>
        </div>
        {p.langues.length > 0 && (
          <div>
            <dt>Langue{p.langues.length > 1 ? "s" : ""}</dt>
            <dd>{p.langues.join(", ")}</dd>
          </div>
        )}
        {p.gentile && (
          <div>
            <dt>Les habitants</dt>
            <dd>
              {p.gentile[0] === p.gentile[1] ? p.gentile[0] : `${p.gentile[0]}, ${p.gentile[1]}`}
              <small>le gentilé{p.gentile[0] !== p.gentile[1] ? ", au masculin et au féminin" : ""}</small>
            </dd>
          </div>
        )}
        {depuisMoi && (
          <div>
            <dt>Depuis chez toi</dt>
            <dd>
              {formatKm(depuisMoi.km)}
              <small>
                à vol d&apos;oiseau depuis {depuisMoi.depuis}, environ {dureeVol(depuisMoi.km)} de vol direct
              </small>
            </dd>
          </div>
        )}
        {souverain && (
          <div>
            <dt>Dépend de</dt>
            <dd>
              {lienPays(souverain.code, souverain.nom)}
              {p.drapeauDe && <small>Il hisse le drapeau de {paysDe(p.drapeauDe).nom}.</small>}
            </dd>
          </div>
        )}
      </dl>

      {(p.voisins.length > 0 || p.enclave) && (
        <div className="pt-fiche-voisins">
          <p>{p.voisins.length ? `Voisins (${p.voisins.length})` : "Voisins"}</p>
          <ul className="pt-puces">
            {p.enclave && <li data-note="">Sans accès à la mer</li>}
            {p.voisins.map((v) => (
              <li key={v}>{lienPays(v, paysDe(v).nom)}</li>
            ))}
          </ul>
        </div>
      )}

      {p.orgs && p.orgs.length > 0 && (
        <div className="pt-fiche-voisins">
          <p>Membre de</p>
          <ul className="pt-puces pt-fiche-orgs">
            {p.orgs.map((o) => (
              <li key={o} title={`${ORGANISATIONS[o].nom} : ${ORGANISATIONS[o].texte}`}>
                {ORGANISATIONS[o].court}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!recits && <p className="pt-fiche-attente">La suite de la fiche arrive…</p>}

      {symboles && r && (
        <Rubrique titre="Ses symboles" apercu={[r.devise && "devise", r.hymne && "hymne", r.fete && "fête nationale", r.drapeau && "drapeau"].filter(Boolean).join(", ")} ouvert={!compacte}>
          <dl className="pt-fiche-lignes">
            {r.devise && <Ligne terme="Devise">{r.devise}</Ligne>}
            {r.hymne && (
              <Ligne terme="Hymne">
                {r.hymne}
                {r.auteurs && <small>{r.auteurs}</small>}
              </Ligne>
            )}
            {r.fete && <Ligne terme="Fête nationale">{r.fete}</Ligne>}
            {r.drapeau && <Ligne terme="Le drapeau">{r.drapeau}</Ligne>}
          </dl>
        </Rubrique>
      )}

      {histoire && r && (
        <Rubrique titre="Son histoire" apercu={[r.independance && "indépendance", r.anciens?.length && "anciens noms", r.etymologie && "origine du nom"].filter(Boolean).join(", ")} ouvert={!compacte}>
          <dl className="pt-fiche-lignes">
            {r.etymologie && <Ligne terme="L'origine du nom">{r.etymologie}</Ligne>}
            {r.independance && <Ligne terme={p.statut === "territoire" ? "Son statut" : "Indépendance"}>{r.independance}</Ligne>}
            {r.anciens && r.anciens.length > 0 && (
              <Ligne terme={r.anciens.length > 1 ? "Anciens noms" : "Ancien nom"}>
                <ul className="pt-fiche-liste">
                  {r.anciens.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </Ligne>
            )}
          </dl>
        </Rubrique>
      )}

      {(p.sommet || p.fleuve || r?.mers?.length || villes.length > 0) && (
        <Rubrique titre="Sa géographie" apercu={[p.sommet && "point culminant", p.fleuve && "fleuve", r?.mers?.length && "mers", villes.length && "grandes villes"].filter(Boolean).join(", ")}>
          <dl className="pt-fiche-lignes">
            {p.sommet && (
              <Ligne terme="Point culminant">
                {p.sommet[0]}, {new Intl.NumberFormat("fr-FR").format(p.sommet[1]).replace(/ /g, " ")}&nbsp;m
              </Ligne>
            )}
            {p.fleuve && (
              <Ligne terme="Le plus long fleuve">
                {p.fleuve[0]}, {formatKm(p.fleuve[1])}
                {r?.fleuveNote && <small>{r.fleuveNote}</small>}
              </Ligne>
            )}
            {r?.mers && r.mers.length > 0 && <Ligne terme={r.mers.length > 1 ? "Mers et océans" : "Mer"}>{r.mers.join(", ")}</Ligne>}
            {villes.length > 0 && (
              <Ligne terme="Grandes villes">
                <ul className="pt-fiche-villes">
                  {villes.map((v) => (
                    <li key={v[0]}>
                      <span>{v[0]}</span>
                      {v[1] ? <small>≈ {formatVille(v[1])}</small> : null}
                    </li>
                  ))}
                </ul>
              </Ligne>
            )}
          </dl>
        </Rubrique>
      )}

      <Rubrique titre="Dans d'autres langues" apercu="anglais, arabe">
        <dl className="pt-fiche-lignes">
          <Ligne terme="En anglais">
            <span className="pt-fiche-langue" lang="en">
              {p.nomEn}
              <BoutonVoix texte={p.nomEn} langue="en" libelle={`Écouter en anglais : ${p.nomEn}`} />
            </span>
          </Ligne>
          {p.nomAr && (
            <Ligne terme="En arabe">
              <span className="pt-fiche-langue" lang="ar" dir="rtl">
                {p.nomAr}
                <BoutonVoix texte={p.nomAr} langue="ar" libelle={`Écouter en arabe : ${p.nom}`} />
              </span>
            </Ligne>
          )}
        </dl>
        <Link href="/langues#vocabulaire/geographie" className="pt-lien pt-fiche-pont">
          Les pays et le monde en anglais, dans Le Truchement
        </Link>
      </Rubrique>

      {(p.indicatif || p.tld || p.conduite) && (
        <Rubrique titre="Codes et repères" apercu="indicatif, Internet, ISO, conduite">
          <dl className="pt-fiche-lignes pt-fiche-codes">
            {p.indicatif && <Ligne terme="Indicatif téléphonique">{p.indicatif}</Ligne>}
            {p.tld && <Ligne terme="Domaine Internet">{p.tld}</Ligne>}
            <Ligne terme="Code ISO">
              {p.iso3} · {p.code.toUpperCase()}
            </Ligne>
            {p.conduite && <Ligne terme="On roule">{p.conduite === "gauche" ? "à gauche" : "à droite"}</Ligne>}
          </dl>
        </Rubrique>
      )}

      {p.code !== "aq" && (
        <Rubrique titre="Vers La Mecque" apercu="la direction de la qibla">
          <Qibla p={p} />
        </Rubrique>
      )}

      <p className="pt-fiche-mon-pays">
        {moi?.code === p.code ? (
          <>
            <Home className="size-4" aria-hidden="true" />
            C&apos;est ton pays : les distances et les heures partent d&apos;ici.
          </>
        ) : (
          <button type="button" className="pt-lien" onClick={() => regler({ monPays: p.code })}>
            <Home className="size-4" aria-hidden="true" />
            C&apos;est mon pays
          </button>
        )}
      </p>

      {p.quiz && (
        <div className="pt-fiche-memoire" aria-label="Ce que ta mémoire en a retenu">
          {IDS_CATEGORIES.filter((c) => CATEGORIES[c].eligible(p)).map((c) => {
            const b = boite(monde, p.code, c);
            return (
              <span key={c} className="pt-fiche-boite" title={`${CATEGORIES[c].nom} : ${b >= 3 ? "maîtrisé" : b ? "en cours" : "pas encore vu"}`}>
                <span>{CATEGORIES[c].nom}</span>
                <span className="pt-points" data-boite={b} aria-label={`boîte ${b} sur 5`}>
                  {[1, 2, 3, 4, 5].map((k) => (
                    <i key={k} data-plein={k <= b || undefined} />
                  ))}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </article>
  );
}
