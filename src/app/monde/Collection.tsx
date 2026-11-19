"use client";

import { ArrowLeft, Check, Lock, Snowflake, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { article, type Article, BOUTIQUE, MEDAILLES, niveauProfil, PAGES_PASSEPORT, tampons } from "@/lib/monde/collection";
import { compteMonde, useCompteMonde } from "@/lib/monde/compte-client";
import { PAYS } from "@/lib/monde/donnees";
import { acheter, depenser, ducats, gagnerDucats, regler, useMonde } from "@/lib/monde/progression";
import { Ducats } from "./communs";
import { Drapeau } from "./figures";

/*
 * Ma collection : le passeport et ses tampons, les médailles, la boutique (thèmes du globe,
 * cadres, couleur du bateau, gels de série, double XP).
 */

type Onglet = "passeport" | "medailles" | "boutique";

export function Collection({ onRetour }: { onRetour: () => void }) {
  const monde = useMonde();
  const compte = useCompteMonde();
  const [onglet, setOnglet] = useState<Onglet>("passeport");
  const xp = compte.enLigne && compte.connecte ? compte.xp : monde.profil.xp;
  const niveau = niveauProfil(xp);
  const cadre = article(monde.profil.cadre);
  return (
    <div className="pt-categorie pt-collection">
      <button type="button" className="pt-retour-lien" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Toutes les routes
      </button>
      <header className="pt-collection-tete">
        <span className="pt-medaillon-profil" style={{ "--cadre": cadre?.couleur ?? "transparent" } as React.CSSProperties} data-cadre={cadre?.couleur ? "" : undefined} aria-hidden="true">
          <span className="tabular-nums">{niveau.n}</span>
        </span>
        <div>
          <h2 className="pt-titre">Ma collection</h2>
          <p className="pt-chapo">
            Niveau {niveau.n} : {niveau.titre}.{" "}
            {niveau.a ? `Encore ${new Intl.NumberFormat("fr-FR").format(niveau.a - xp).replace(/ /g, " ")} XP pour le niveau suivant.` : "Le plus haut niveau."}
          </p>
          <span className="pt-maitrise-barre pt-niveau-barre" aria-hidden="true">
            <span style={{ transform: `scaleX(${niveau.part})` }} />
          </span>
        </div>
      </header>
      <div className="pt-segments" role="tablist" aria-label="Ma collection">
        {(
          [
            ["passeport", "Le passeport"],
            ["medailles", "Les médailles"],
            ["boutique", "La boutique"],
          ] as [Onglet, string][]
        ).map(([id, nom]) => (
          <button key={id} type="button" role="tab" aria-selected={onglet === id} onClick={() => setOnglet(id)}>
            {nom}
          </button>
        ))}
      </div>
      {onglet === "passeport" && <Passeport />}
      {onglet === "medailles" && <Medailles />}
      {onglet === "boutique" && <Boutique />}
    </div>
  );
}

/* ---------- Le passeport ---------- */

const formatDate = (jour: number) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(jour * 86_400_000));

function Passeport() {
  const monde = useMonde();
  const t = useMemo(() => tampons(monde), [monde]);
  return (
    <section aria-label="Le passeport">
      <p className="pt-sous-chapo">
        Un tampon par pays connu (maîtrisé dans au moins deux routes) : {t.size} sur 197. Le tampon porte la date du dernier passage.
      </p>
      {PAGES_PASSEPORT.map((page) => {
        const pays = PAYS.filter((p) => p.quiz && p.statut !== "territoire" && p.continent === page.id).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
        const faits = pays.filter((p) => t.has(p.code)).length;
        return (
          <div key={page.id} className="pt-passeport-page">
            <h3 className="pt-passeport-titre">
              {page.nom}
              <span className="tabular-nums">
                {faits}/{pays.length}
              </span>
            </h3>
            <ul className="pt-tampons">
              {pays.map((p, i) => {
                const jour = t.get(p.code);
                return (
                  <li key={p.code} data-tamponne={jour !== undefined || undefined} style={{ "--rot": `${((i * 37) % 17) - 8}deg` } as React.CSSProperties} title={p.nom}>
                    {jour !== undefined ? (
                      <span className="pt-tampon">
                        <Drapeau code={p.code} nomme={false} />
                        <span className="pt-tampon-nom">{p.nom}</span>
                        <span className="pt-tampon-date">{formatDate(jour)}</span>
                      </span>
                    ) : (
                      <span className="pt-tampon-vide">{p.nom}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

/* ---------- Les médailles ---------- */

function Medailles() {
  const monde = useMonde();
  const obtenues = MEDAILLES.filter((m) => m.obtenue(monde)).length;
  return (
    <section aria-label="Les médailles">
      <p className="pt-sous-chapo">
        {obtenues} médaille{obtenues > 1 ? "s" : ""} sur {MEDAILLES.length}.
      </p>
      <ul className="pt-medailles">
        {MEDAILLES.map((m) => {
          const ok = m.obtenue(monde);
          return (
            <li key={m.id} data-obtenue={ok || undefined} data-metal={m.metal}>
              <span className="pt-medaille" aria-hidden="true">
                <svg viewBox="-30 -30 60 60">
                  <path d="M-10 -28L-4 -12M10 -28L4 -12" className="pt-medaille-ruban" />
                  <circle r="20" cy="6" className="pt-medaille-disque" />
                  <circle r="15" cy="6" className="pt-medaille-filet" />
                  <path d="M0 -4L3 3L10 3L4 8L6 15L0 11L-6 15L-4 8L-10 3L-3 3Z" className="pt-medaille-etoile" />
                </svg>
                {!ok && <Lock className="pt-medaille-verrou" aria-hidden="true" />}
              </span>
              <span className="pt-medaille-nom">{m.nom}</span>
              <span className="pt-medaille-texte">{m.texte}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------- La boutique ---------- */

function Boutique() {
  const monde = useMonde();
  const solde = ducats(monde);
  const [message, setMessage] = useState<string | null>(null);
  const [double, setDouble] = useState<"attente" | "envoi" | number | "deja" | "hors-ligne">("attente");
  const p = monde.profil;
  const choisi = (a: Article) => (a.sorte === "globe" ? p.globe : a.sorte === "cadre" ? p.cadre : a.sorte === "bateau" ? p.bateau : "") === a.id;
  const possede = (a: Article) => a.prix === 0 || p.achats.includes(a.id);

  const prendre = (a: Article) => {
    setMessage(null);
    if (a.sorte === "gel") {
      if (p.gels >= 2) return setMessage("Tu as déjà deux gels de série en réserve.");
      if (!acheter(a.id, a.prix, "gel")) return setMessage("Il te manque des ducats.");
      return setMessage("Un gel de série en réserve.");
    }
    if (possede(a)) return regler({ [a.sorte]: a.id });
    if (!acheter(a.id, a.prix, a.sorte)) setMessage("Il te manque des ducats.");
  };

  const doubler = async () => {
    const c = compteMonde();
    if (!c.connecte || c.enLigne === false) return setDouble("hors-ligne");
    if (!depenser(100)) return setMessage("Il te manque des ducats.");
    setDouble("envoi");
    try {
      const r = await fetch("/api/monde/double", { method: "POST" });
      const x = (await r.json()) as { jusqua?: number | null };
      if (r.ok && x.jusqua) setDouble(x.jusqua);
      else {
        gagnerDucats(100);
        setDouble(r.status === 409 ? "deja" : "hors-ligne");
      }
    } catch {
      gagnerDucats(100);
      setDouble("hors-ligne");
    }
  };

  const sections: { titre: string; sorte: Article["sorte"] }[] = [
    { titre: "Les thèmes du globe", sorte: "globe" },
    { titre: "Les cadres du profil", sorte: "cadre" },
    { titre: "La couleur du bateau", sorte: "bateau" },
    { titre: "Les gels de série", sorte: "gel" },
  ];
  return (
    <section aria-label="La boutique">
      <p className="pt-boutique-solde">
        <Ducats n={solde} /> à dépenser. {p.gels > 0 ? `${p.gels} gel${p.gels > 1 ? "s" : ""} de série en réserve.` : ""}
      </p>
      {message && (
        <p className="pt-message" role="status">
          {message}
        </p>
      )}
      <div className="pt-boutique-double">
        <Zap className="size-5" aria-hidden="true" />
        <div>
          <strong>Double XP pendant dix minutes</strong>
          <span>Une fois par jour, pour 100 ducats : chaque bonne réponse compte double au classement.</span>
          {typeof double === "number" && <span className="pt-boutique-ok">Actif jusqu&apos;à {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(double))}.</span>}
          {double === "deja" && <span className="pt-boutique-ok">Déjà utilisé aujourd&apos;hui : à demain ! (Tes ducats te sont rendus.)</span>}
          {double === "hors-ligne" && <span className="pt-boutique-ok">Il faut être connecté (et le classement ouvert) pour doubler l&apos;XP.</span>}
        </div>
        <button type="button" className="bouton bouton-principal" disabled={double === "envoi" || typeof double === "number"} onClick={() => void doubler()}>
          100
        </button>
      </div>
      {sections.map((sec) => (
        <div key={sec.sorte} className="pt-boutique-rayon">
          <h3 className="pt-sous-titre">{sec.titre}</h3>
          <ul className="pt-articles">
            {BOUTIQUE.filter((a) => a.sorte === sec.sorte).map((a) => {
              const est = choisi(a);
              const a_ = possede(a);
              return (
                <li key={a.id} data-choisi={est || undefined}>
                  <span className="pt-article-apercu" data-sorte={a.sorte} data-id={a.id} style={{ "--teinte": a.couleur ?? "transparent" } as React.CSSProperties} aria-hidden="true">
                    {a.sorte === "gel" && <Snowflake className="size-6" />}
                  </span>
                  <span className="pt-article-corps">
                    <strong>{a.nom}</strong>
                    <span>{a.texte}</span>
                  </span>
                  <button type="button" className={`bouton ${est || (!a_ && solde < a.prix) || (a.sorte === "gel" && solde < a.prix) ? "bouton-discret" : "bouton-principal"}`} disabled={est || (a.sorte !== "gel" && !a_ && solde < a.prix)} onClick={() => prendre(a)}>
                    {est ? (
                      <>
                        <Check className="size-4" aria-hidden="true" />
                        Choisi
                      </>
                    ) : a_ && a.sorte !== "gel" ? (
                      "Choisir"
                    ) : (
                      <>
                        <Ducats n={a.prix} />
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p className="pt-astuce">Les thèmes du globe s&apos;appliquent à tous les globes du Portulan ; la couleur du bateau, à ta route sur chaque catégorie.</p>
    </section>
  );
}
