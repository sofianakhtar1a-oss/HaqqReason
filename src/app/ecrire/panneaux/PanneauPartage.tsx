"use client";

import type { Editor } from "@tiptap/core";
import { Check, GraduationCap, History, LogOut, PenLine, Send, UserMinus, UserPlus, Users, X, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import type { DocumentAtelier } from "@/lib/atelier/modele";
import { ROLES_PARTAGE, couleurDe, libelleRole, regrouperHistorique, type LigneHistorique, type MetaPartage, type RolePartage } from "@/lib/atelier/partage-commun";
import { useRevision } from "../crochets";
import type { EtatLiaison } from "../partage/liaison";
import { etatSuggestions, listerSuggestions, reglerSuggestions, trancher, trancherTout, type Suggestion } from "../partage/suggestions";
import { ListeCommentaires } from "../partage/ListeCommentaires";

type Contacts = { amis: { id: string; nom: string; avatar: string }[] | null; classes: { id: string; nom: string; enseignant: string; nomEnseignant: string }[] };

type Props = {
  editor: Editor;
  doc: DocumentAtelier;
  titre: string;
  liaison: EtatLiaison | null;
  /** Lie (ou délie) ce document à son partage sur le serveur. */
  surModifier: (modif: Partial<DocumentAtelier>) => void;
  surMessage: (texte: string) => void;
};

const appeler = async (adresse: string, corps?: unknown, methode = corps === undefined ? "GET" : "POST") => {
  const r = await fetch(adresse, { method: methode, headers: corps === undefined ? undefined : { "content-type": "application/json" }, body: corps === undefined ? undefined : JSON.stringify(corps), cache: "no-store" }).catch(() => null);
  const d = (r ? await r.json().catch(() => ({})) : {}) as Record<string, unknown>;
  if (!r || !r.ok) throw new Error(String(d.erreur ?? "Pas de connexion : réessaie dans un instant."));
  return d;
};

const heure = (iso: string) => {
  const d = new Date(iso);
  const jours = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  const h = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return jours === 0 ? `aujourd'hui ${h}` : jours === 1 ? `hier ${h}` : `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} ${h}`;
};

/** Le carnet : les amis du Portulan à cocher, chacun avec son rôle. */
function Carnet({ contacts, exclus, surValider, libelle }: { contacts: Contacts | null; exclus: string[]; surValider: (choix: { compte: string; role: RolePartage }[]) => void; libelle: string }) {
  const [choix, setChoix] = useState<Record<string, RolePartage>>({});
  if (!contacts) return <p className="inspecteur-aide">Chargement de tes amis…</p>;
  if (contacts.amis === null) return <p className="inspecteur-aide">Ta liste d&apos;amis du Portulan ne répond pas : réessaie dans un instant.</p>;
  const amis = contacts.amis.filter((a) => !exclus.includes(a.id));
  if (contacts.amis.length === 0)
    return (
      <p className="inspecteur-aide">
        Le carnet, ce sont tes amis du Portulan. Ajoute-en d&apos;abord avec leur code d&apos;ami : <a href="/monde">ouvrir le Portulan</a>.
      </p>
    );
  if (amis.length === 0) return <p className="inspecteur-aide">Tous tes amis ont déjà ce document.</p>;
  const n = Object.keys(choix).length;
  return (
    <div className="calame-carnet">
      <ul>
        {amis.map((a) => {
          const role = choix[a.id];
          return (
            <li key={a.id}>
              <label className="inspecteur-bascule">
                <input
                  type="checkbox"
                  checked={Boolean(role)}
                  onChange={(e) =>
                    setChoix((c) => {
                      const suite = { ...c };
                      if (e.target.checked) suite[a.id] = "ecriture";
                      else delete suite[a.id];
                      return suite;
                    })
                  }
                />
                <span className="calame-personne-pastille" style={{ background: couleurDe(a.id) }} aria-hidden="true">
                  {a.nom.charAt(0)}
                </span>
                <span>{a.nom}</span>
              </label>
              {role && (
                <select className="champ w-auto" value={role} onChange={(e) => setChoix((c) => ({ ...c, [a.id]: e.target.value as RolePartage }))} aria-label={`Rôle de ${a.nom}`}>
                  {ROLES_PARTAGE.map((r) => (
                    <option key={r.cle} value={r.cle}>
                      {r.libelle}
                    </option>
                  ))}
                </select>
              )}
            </li>
          );
        })}
      </ul>
      <ul className="calame-roles-aide">
        {ROLES_PARTAGE.map((r) => (
          <li key={r.cle}>
            <strong>{r.libelle}</strong> : {r.aide}
          </li>
        ))}
      </ul>
      <button type="button" className="bouton bouton-principal bouton-petit" disabled={n === 0} onClick={() => surValider(Object.entries(choix).map(([compte, role]) => ({ compte, role })))}>
        <UserPlus className="size-4" aria-hidden="true" />
        {libelle} {n > 0 ? `(${n})` : ""}
      </button>
    </div>
  );
}

function LigneSuggestion({ editor, s, peutTrancher, moi }: { editor: Editor; s: Suggestion; peutTrancher: boolean; moi: string | null }) {
  const sienne = moi !== null && s.auteur === moi;
  return (
    <li className="calame-suggestion" data-genre={s.genre} style={{ "--sugg": s.couleur } as React.CSSProperties}>
      <button type="button" className="calame-suggestion-texte" onClick={() => editor.chain().focus().setTextSelection({ from: s.de, to: s.a }).scrollIntoView().run()}>
        <span className="calame-suggestion-qui">
          {s.nom} · {s.genre === "ajout" ? "ajoute" : "retire"}
        </span>
        {s.genre === "ajout" ? <ins>{s.texte}</ins> : <del>{s.texte}</del>}
      </button>
      <span className="calame-suggestion-gestes">
        {peutTrancher && (
          <button type="button" onClick={() => trancher(editor, s, true)} aria-label="Accepter" title="Accepter">
            <Check className="size-4" aria-hidden="true" />
          </button>
        )}
        {(peutTrancher || sienne) && (
          <button type="button" onClick={() => trancher(editor, s, false)} aria-label={sienne && !peutTrancher ? "Retirer ma proposition" : "Refuser"} title={sienne && !peutTrancher ? "Retirer" : "Refuser"}>
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </span>
    </li>
  );
}

/** L'onglet « Partage » : partager avec ses amis, écrire à plusieurs, suggestions, historique, remise à une classe. */
export function PanneauPartage({ editor, doc, titre, liaison, surModifier, surMessage }: Props) {
  useRevision(editor);
  const partage = doc.partage ?? null;
  const [contacts, setContacts] = useState<Contacts | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ajout, setAjout] = useState(false);
  const [confirmer, setConfirmer] = useState<"arreter" | "quitter" | null>(null);
  const [historique, setHistorique] = useState<LigneHistorique[] | null>(null);
  const [classe, setClasse] = useState("");

  useEffect(() => {
    let vivant = true;
    void appeler("/api/calame/partages?contacts=1")
      .then((d) => vivant && setContacts({ amis: (d.amis as Contacts["amis"]) ?? null, classes: (d.classes as Contacts["classes"]) ?? [] }))
      .catch(() => vivant && setContacts({ amis: null, classes: [] }));
    return () => {
      vivant = false;
    };
  }, []);

  const agir = async (faire: () => Promise<void>) => {
    setOccupe(true);
    setErreur(null);
    try {
      await faire();
    } catch (e) {
      setErreur((e as Error).message);
    }
    setOccupe(false);
  };

  /** Crée le partage (s'il n'existe pas encore) et renvoie son identifiant. */
  const creer = async (): Promise<string> => {
    if (partage) return partage.id;
    const d = await appeler("/api/calame/partages", { titre: titre || doc.titre, contenu: editor.getJSON(), reglages: doc.reglages });
    const meta = d.meta as MetaPartage;
    surModifier({ partage: { id: meta.id, role: "proprietaire", version: 0, attente: false } });
    return meta.id;
  };

  const partager = (choix: { compte: string; role: RolePartage }[]) =>
    agir(async () => {
      const id = await creer();
      const refus: string[] = [];
      for (const c of choix) await appeler(`/api/calame/partages/${id}`, { action: "membre", compte: c.compte, role: c.role }).catch((e: Error) => refus.push(e.message));
      setAjout(false);
      surMessage(refus.length ? `Partagé, sauf pour ${refus.length} personne${refus.length > 1 ? "s" : ""} : ${refus[0]}` : `Partagé : ${choix.length} personne${choix.length > 1 ? "s" : ""} prévenue${choix.length > 1 ? "s" : ""} sur leur téléphone.`);
    });

  const remettre = () =>
    agir(async () => {
      if (!classe) return;
      const id = await creer();
      await appeler(`/api/calame/partages/${id}`, { action: "remettre", classe });
      surMessage("Copie remise : ton enseignant est prévenu. Ses commentaires et ses suggestions arriveront ici.");
    });

  const meta = liaison?.meta ?? null;
  const role = liaison?.role ?? partage?.role ?? null;
  const moi = liaison?.moi ?? null;
  const proprietaire = role === "proprietaire";
  const enseignant = Boolean(meta?.remise && moi && meta.remise.enseignant === moi);
  const sugg = etatSuggestions(editor.state);
  const suggestions = listerSuggestions(editor.state);
  const peutTrancher = role === "proprietaire" || role === "ecriture";
  // Les curseurs encore frais (le serveur oublie ceux de plus de 45 secondes).
  const ici = new Set((liaison?.presences ?? []).map((p) => p.compte));

  // Remettre sa copie à l'enseignant d'une classe (avant tout partage, ou en plus de lui).
  const sectionRemise =
    contacts && contacts.classes.length > 0 && (!partage || (proprietaire && meta && !meta.remise)) ? (
      <section className="calame-section">
        <h3 className="calame-section-titre">
          <GraduationCap className="size-4" aria-hidden="true" /> Remettre à une classe
        </h3>
        <p className="inspecteur-aide">L&apos;enseignant reçoit ta copie, la commente et propose des corrections ; tu les retrouves ici quand il la rend.</p>
        <select className="champ" value={classe} onChange={(e) => setClasse(e.target.value)} aria-label="Classe">
          <option value="">Choisir une classe…</option>
          {contacts.classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom} — {c.nomEnseignant}
            </option>
          ))}
        </select>
        <button type="button" className="bouton bouton-principal bouton-petit" disabled={!classe || occupe} onClick={() => void remettre()}>
          <Send className="size-4" aria-hidden="true" />
          Remettre ma copie
        </button>
      </section>
    ) : null;

  // ------------------------------------------------------------ pas encore partagé
  if (!partage) {
    return (
      <>
        <section className="calame-section calame-partage">
          <h3 className="calame-section-titre">
            <Users className="size-4" aria-hidden="true" /> Partager ce document
          </h3>
          <p className="inspecteur-aide">Avec tes amis du Portulan : chacun le reçoit dans son Calame. Vous écrivez ensemble, en direct, chacun avec son curseur ; un relecteur commente et propose.</p>
          <Carnet contacts={contacts} exclus={[]} surValider={(c) => void partager(c)} libelle="Partager" />
          {erreur && (
            <p className="inspecteur-aide" data-alerte="" role="alert">
              {erreur}
            </p>
          )}
          {occupe && <p className="inspecteur-aide">Un instant…</p>}
        </section>
        {sectionRemise}
      </>
    );
  }

  // ------------------------------------------------------------ partagé
  const etat = liaison?.etat ?? "connexion";
  const libelleEtat = etat === "a-jour" ? "À jour" : etat === "envoi" ? "Envoi de tes changements…" : etat === "hors-ligne" ? "Hors ligne" : etat === "arrete" ? "Partage terminé" : "Connexion…";

  return (
    <>
      <section className="calame-section calame-partage">
        <h3 className="calame-section-titre">
          <Users className="size-4" aria-hidden="true" /> Écrire à plusieurs
        </h3>
        <p className="calame-partage-etat" data-etat={etat} role="status">
          <span className="calame-partage-point" aria-hidden="true" />
          {libelleEtat}
          {role && <span className="calame-partage-role">{libelleRole(role)}</span>}
        </p>
        {liaison?.message && <p className="inspecteur-aide">{liaison.message}</p>}
        {meta && (
          <ul className="calame-personnes">
            {[{ compte: meta.proprietaire, nom: meta.nomProprietaire, role: "proprietaire" as const }, ...meta.membres].map((p) => (
              <li key={p.compte}>
                <span className="calame-personne-pastille" style={{ background: couleurDe(p.compte) }} aria-hidden="true">
                  {p.nom.charAt(0)}
                </span>
                <span className="calame-personne-nom">
                  {p.nom}
                  {p.compte === moi && <span className="calame-personne-moi"> (toi)</span>}
                  {ici.has(p.compte) && p.compte !== moi && <span className="calame-personne-ici">ici</span>}
                </span>
                {proprietaire && p.role !== "proprietaire" ? (
                  <>
                    <select
                      className="champ w-auto"
                      value={p.role}
                      onChange={(e) => void agir(async () => void (await appeler(`/api/calame/partages/${partage.id}`, { action: "membre", compte: p.compte, role: e.target.value })))}
                      aria-label={`Rôle de ${p.nom}`}
                    >
                      {ROLES_PARTAGE.map((r) => (
                        <option key={r.cle} value={r.cle}>
                          {r.libelle}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="calame-icone" onClick={() => void agir(async () => void (await appeler(`/api/calame/partages/${partage.id}`, { action: "retirer", compte: p.compte })))} aria-label={`Retirer ${p.nom}`}>
                      <UserMinus className="size-4" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <span className="calame-personne-role">{libelleRole(p.role)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {proprietaire &&
          (ajout ? (
            <Carnet contacts={contacts} exclus={meta?.membres.map((m) => m.compte) ?? []} surValider={(c) => void partager(c)} libelle="Ajouter" />
          ) : (
            <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => setAjout(true)}>
              <UserPlus className="size-4" aria-hidden="true" />
              Ajouter des personnes
            </button>
          ))}
        {erreur && (
          <p className="inspecteur-aide" data-alerte="" role="alert">
            {erreur}
          </p>
        )}
      </section>

      <section className="calame-section">
        <h3 className="calame-section-titre">
          <MessageSquareText className="size-4" aria-hidden="true" /> Commentaires
        </h3>
        <ListeCommentaires editor={editor} />
      </section>

      {sectionRemise}

      {meta?.remise && (
        <section className="calame-section">
          <h3 className="calame-section-titre">
            <GraduationCap className="size-4" aria-hidden="true" /> Copie remise · {meta.remise.nomClasse}
          </h3>
          <p className="inspecteur-aide">
            {enseignant ? `Copie de ${meta.nomProprietaire}, remise ${heure(meta.remise.remiseLe)}.` : `Remise à ${meta.remise.nomEnseignant} ${heure(meta.remise.remiseLe)}.`}{" "}
            {meta.remise.etat === "rendue" && meta.remise.rendueLe ? `Rendue annotée ${heure(meta.remise.rendueLe)} : commentaires dans la marge, suggestions ci-dessous.` : ""}
          </p>
          {enseignant && meta.remise.etat === "remise" && (
            <button type="button" className="bouton bouton-principal bouton-petit" disabled={occupe} onClick={() => void agir(async () => {
              await appeler(`/api/calame/partages/${partage.id}`, { action: "rendre" });
              surMessage("Copie rendue : l'élève est prévenu.");
            })}>
              <Send className="size-4" aria-hidden="true" />
              Rendre la copie annotée
            </button>
          )}
        </section>
      )}

      {role && role !== "lecture" && (
        <section className="calame-section">
          <h3 className="calame-section-titre">
            <PenLine className="size-4" aria-hidden="true" /> Suggestions
          </h3>
          <label className="inspecteur-bascule">
            <input type="checkbox" checked={sugg.actif} disabled={sugg.force || !sugg.auteur} onChange={(e) => reglerSuggestions(editor, { ...sugg, actif: e.target.checked })} />
            <span>{sugg.force ? "Mode suggestion (toujours, pour un relecteur) : ce que tu tapes est proposé, l'auteur accepte ou refuse." : "Mode suggestion : ce que je tape et j'efface est proposé, à accepter ou refuser."}</span>
          </label>
          {suggestions.length === 0 ? (
            <p className="inspecteur-aide">Aucune proposition en attente.</p>
          ) : (
            <>
              <ul className="calame-suggestions">
                {suggestions.slice(0, 80).map((s) => (
                  <LigneSuggestion key={`${s.de}-${s.genre}-${s.auteur}`} editor={editor} s={s} peutTrancher={peutTrancher} moi={moi} />
                ))}
              </ul>
              {peutTrancher && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => trancherTout(editor, true)}>
                    <Check className="size-4" aria-hidden="true" /> Tout accepter
                  </button>
                  <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => trancherTout(editor, false)}>
                    <X className="size-4" aria-hidden="true" /> Tout refuser
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <section className="calame-section">
        <h3 className="calame-section-titre">
          <History className="size-4" aria-hidden="true" /> Qui a changé quoi
        </h3>
        {historique === null ? (
          <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => void agir(async () => setHistorique(((await appeler(`/api/calame/partages/${partage.id}/historique`)).lignes as LigneHistorique[]) ?? []))}>
            Voir l&apos;historique
          </button>
        ) : historique.length === 0 ? (
          <p className="inspecteur-aide">Aucun changement depuis le partage.</p>
        ) : (
          <ol className="calame-historique">
            {regrouperHistorique(historique).map((g) => (
              <li key={`${g.compte}-${g.debut}`}>
                <span className="calame-personne-pastille" style={{ background: couleurDe(g.compte) }} aria-hidden="true">
                  {g.nom.charAt(0)}
                </span>
                <span>
                  <strong>{g.nom}</strong> <span className="calame-historique-quand">{heure(g.debut)}{g.fin !== g.debut ? ` → ${new Date(g.fin).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
                  <span className="calame-historique-mesure">
                    {g.ajouts > 0 && <ins>+{g.ajouts.toLocaleString("fr-FR")} signe{g.ajouts > 1 ? "s" : ""}</ins>} {g.retraits > 0 && <del>−{g.retraits.toLocaleString("fr-FR")}</del>} {g.marques > 0 && <span>{g.marques} mise{g.marques > 1 ? "s" : ""} en forme ou commentaire{g.marques > 1 ? "s" : ""}</span>}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="calame-section calame-actions">
        {confirmer ? (
          <div className="calame-confirmer">
            <p>{confirmer === "arreter" ? "Arrêter le partage ? Chacun garde sa copie, mais vous n'écrirez plus ensemble." : "Quitter ce document ? Tu gardes ta copie, sans les changements à venir."}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="bouton bouton-danger bouton-petit"
                disabled={occupe}
                onClick={() =>
                  void agir(async () => {
                    if (confirmer === "arreter") await appeler(`/api/calame/partages/${partage.id}`, undefined, "DELETE");
                    else await appeler(`/api/calame/partages/${partage.id}`, { action: "quitter" });
                    surModifier({ partage: null });
                    setConfirmer(null);
                    surMessage(confirmer === "arreter" ? "Partage arrêté : le document est de nouveau à toi seul." : "Tu as quitté ce document : ta copie reste ici.");
                  })
                }
              >
                {confirmer === "arreter" ? "Arrêter le partage" : "Quitter"}
              </button>
              <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => setConfirmer(null)}>
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="bouton bouton-discret w-full" onClick={() => setConfirmer(proprietaire ? "arreter" : "quitter")}>
            <LogOut className="size-4" aria-hidden="true" />
            {proprietaire ? "Arrêter le partage" : "Quitter ce document"}
          </button>
        )}
      </section>
    </>
  );
}
