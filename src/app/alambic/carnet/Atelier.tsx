"use client";

import { ArrowLeft, PanelLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { discuter, ErreurCarnet, vecteurQuestion, vectoriser } from "@/lib/alambic/carnet/client";
import { extraireFichier, extraireYoutube, typeDe } from "@/lib/alambic/carnet/extraction";
import { selectionner } from "@/lib/alambic/carnet/recherche";
import { ecrireCarnet, ecrireFichier, ecrireMorceaux, lireCarnet, lireMorceaux, oublierSource } from "@/lib/alambic/carnet/stockage";
import { type Action, ACTIONS, type Carnet, type Message, type Morceau, referenceDe, type Source } from "@/lib/alambic/carnet/types";
import { idYoutube } from "@/lib/alambic/transcription/lien";
import { Conversation } from "./Conversation";
import { Sources } from "./Sources";
import { type Cible, Visionneuse } from "./Visionneuse";
import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";

/** Au-delà de ce volume, on cherche les passages utiles au lieu de tout envoyer. */
export const BUDGET = 120_000;

const nouvelId = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

function carnetVide(): Carnet {
  return { id: nouvelId(), titre: "Carnet sans titre", creeLe: Date.now(), majLe: Date.now(), sources: [], messages: [] };
}

export function Atelier({ id, onFermer }: { id: string | null; onFermer: () => void }) {
  const [carnet, setCarnet] = useState<Carnet | null>(id ? null : carnetVide);
  const [morceaux, setMorceaux] = useState<Map<string, Morceau[]>>(new Map());
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cible, setCible] = useState<Cible | null>(null);
  const [panneau, setPanneau] = useState(() => typeof window === "undefined" || window.innerWidth > 896);
  const carnetRef = useRef(carnet);
  const file = useRef<{ source: Source; fichier?: File; video?: string }[]>([]);
  const analyse = useRef(false);
  const controle = useRef<AbortController | null>(null);

  // Toute modification passe par ici : état, puis sauvegarde sur l'appareil.
  const maj = useCallback((f: (c: Carnet) => Carnet) => {
    setCarnet((c) => {
      if (!c) return c;
      const n = f(c);
      carnetRef.current = n;
      void ecrireCarnet(n).catch(() => undefined);
      return n;
    });
  }, []);
  const majSource = useCallback((sid: string, m: Partial<Source>) => maj((c) => ({ ...c, sources: c.sources.map((s) => (s.id === sid ? { ...s, ...m } : s)) })), [maj]);

  // Ouverture : le carnet et ses morceaux indexés.
  useEffect(() => {
    if (!id) return;
    void lireCarnet(id).then(async (c) => {
      if (!c) return onFermer();
      // Une analyse interrompue (page fermée) est signalée au lieu de rester « en cours ».
      const propre = { ...c, sources: c.sources.map((s) => (s.etat === "analyse" || s.etat === "attente" ? { ...s, etat: "erreur" as const, erreur: "Analyse interrompue : retire la source et ajoute-la à nouveau." } : s)) };
      carnetRef.current = propre;
      setCarnet(propre);
      const m = new Map<string, Morceau[]>();
      for (const s of propre.sources) if (s.etat === "pret") m.set(s.id, await lireMorceaux(s.id));
      setMorceaux(m);
    });
  }, [id, onFermer]);

  useEffect(() => {
    const avant = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = avant;
      controle.current?.abort();
    };
  }, []);

  /* ---------- Analyse des sources, une à une, en arrière-plan ---------- */
  const pomper = useCallback(async () => {
    if (analyse.current) return;
    analyse.current = true;
    try {
      while (file.current.length) {
        const { source, fichier, video } = file.current.shift()!;
        majSource(source.id, { etat: "analyse", progression: 0 });
        try {
          const avancer = (x: number) => majSource(source.id, { progression: Math.min(0.95, x * 0.9) });
          const r = video ? await extraireYoutube(source.id, video, avancer) : await extraireFichier(source.id, fichier!, source.type, avancer);
          if (!r.morceaux.length) throw new Error("Aucun texte n'a pu être extrait de cette source.");
          majSource(source.id, { progression: 0.95 });
          const avecSens = await vectoriser(r.morceaux);
          await ecrireMorceaux(source.id, avecSens);
          if (fichier) await ecrireFichier(source.id, fichier);
          setMorceaux((m) => new Map(m).set(source.id, avecSens));
          const titre = "titre" in r && typeof r.titre === "string" ? r.titre : undefined;
          majSource(source.id, {
            ...r.complement,
            ...(titre ? { nom: titre } : {}),
            etat: "pret",
            progression: 1,
            nbMorceaux: avecSens.length,
            jetons: avecSens.reduce((s, m) => s + m.jetons, 0),
          });
        } catch (e) {
          majSource(source.id, { etat: "erreur", erreur: e instanceof Error ? e.message : "Analyse impossible." });
        }
      }
    } finally {
      analyse.current = false;
    }
  }, [majSource]);

  const ajouterFichiers = (fichiers: File[]) => {
    const nouvelles: Source[] = [];
    const refuses: string[] = [];
    for (const f of fichiers) {
      const type = typeDe(f);
      if (!type) {
        refuses.push(f.name);
        continue;
      }
      const s: Source = { id: nouvelId(), nom: f.name, type, ajouteLe: Date.now(), active: true, etat: "attente", nbMorceaux: 0, jetons: 0 };
      nouvelles.push(s);
      file.current.push({ source: s, fichier: f });
    }
    setErreur(refuses.length ? `Format non pris en charge : ${refuses.join(", ")}. Formats acceptés : PDF, Word (.docx), texte, Markdown, CSV, sons et vidéos.` : null);
    if (!nouvelles.length) return;
    maj((c) => ({ ...c, titre: c.sources.length || c.titre !== "Carnet sans titre" ? c.titre : nouvelles[0].nom.replace(/\.[^.]+$/, ""), sources: [...c.sources, ...nouvelles] }));
    void pomper();
  };

  const ajouterLiens = (texte: string): string[] => {
    const ids = [...new Set(texte.split(/[\s,]+/).map(idYoutube).filter((x): x is string => Boolean(x)))];
    const deja = new Set(carnetRef.current?.sources.map((s) => s.youtube));
    const neufs = ids.filter((v) => !deja.has(v));
    const nouvelles = neufs.map((v): Source => ({ id: nouvelId(), nom: `Vidéo YouTube (${v})`, type: "youtube", youtube: v, ajouteLe: Date.now(), active: true, etat: "attente", nbMorceaux: 0, jetons: 0 }));
    nouvelles.forEach((s) => file.current.push({ source: s, video: s.youtube }));
    if (nouvelles.length) {
      maj((c) => ({ ...c, sources: [...c.sources, ...nouvelles] }));
      void pomper();
    }
    return ids;
  };

  const retirer = (s: Source) => {
    file.current = file.current.filter((x) => x.source.id !== s.id);
    maj((c) => ({ ...c, sources: c.sources.filter((x) => x.id !== s.id) }));
    setMorceaux((m) => {
      const n = new Map(m);
      n.delete(s.id);
      return n;
    });
    void oublierSource(s.id);
  };

  /* ---------- Questions et réponses ---------- */
  const envoyer = async (question: string, action?: Action) => {
    const c = carnetRef.current;
    if (!c || enCours) return;
    setErreur(null);
    const actives = c.sources.filter((s) => s.active && s.etat === "pret");
    const tous = actives.flatMap((s) => morceaux.get(s.id) ?? []);
    const texteRecherche = question || ACTIONS.find((a) => a.id === action)?.nom || "";
    const ctl = new AbortController();
    controle.current = ctl;
    const utilisateur: Message = { id: nouvelId(), role: "utilisateur", texte: question || ACTIONS.find((a) => a.id === action)!.nom, action, creeLe: Date.now() };
    const reponse: Message = { id: nouvelId(), role: "assistant", texte: "", creeLe: Date.now() };
    const historique = c.messages.filter((m) => !m.erreur).slice(-8).map(({ role, texte }) => ({ role, texte }));
    maj((x) => ({ ...x, messages: [...x.messages, utilisateur, reponse] }));
    setEnCours(true);

    let texte = "";
    let image = 0;
    const afficher = () => {
      image = 0;
      setCarnet((x) => (x ? { ...x, messages: x.messages.map((m) => (m.id === reponse.id ? { ...m, texte } : m)) } : x));
    };
    try {
      const total = tous.reduce((s, m) => s + m.jetons, 0);
      const vq = total > BUDGET && tous.some((m) => m.vecteur) ? await vecteurQuestion(texteRecherche, ctl.signal) : null;
      const choix = selectionner({ morceaux: tous, ordreSources: actives.map((s) => s.id), question: texteRecherche, action, budget: BUDGET, vecteurQuestion: vq });
      const parId = new Map(actives.map((s) => [s.id, s]));
      const extraits = choix.morceaux.map((m) => {
        const s = parId.get(m.source)!;
        return { ref: referenceDe(s, m), source: s.type === "youtube" ? `Vidéo YouTube - ${s.nom}` : s.nom, texte: m.texte };
      });
      await discuter(
        { question, action, mode: choix.mode, extraits, historique },
        (morceau) => {
          texte += morceau;
          image ||= requestAnimationFrame(afficher);
        },
        ctl.signal,
      );
      cancelAnimationFrame(image);
      maj((x) => ({ ...x, messages: x.messages.map((m) => (m.id === reponse.id ? { ...m, texte: texte || "*(Réponse vide.)*" } : m)) }));
    } catch (e) {
      cancelAnimationFrame(image);
      const arret = ctl.signal.aborted;
      const message = arret ? "" : e instanceof ErreurCarnet || e instanceof Error ? e.message : "La réponse a échoué.";
      maj((x) => ({
        ...x,
        messages: x.messages.map((m) => (m.id === reponse.id ? { ...m, texte: texte + (arret ? "\n\n*(Réponse arrêtée.)*" : ""), erreur: !arret && !texte } : m)),
      }));
      if (message) setErreur(message);
    } finally {
      setEnCours(false);
      controle.current = null;
    }
  };

  if (!carnet) return null;
  const actives = carnet.sources.filter((s) => s.active && s.etat === "pret");

  return createPortal(
    <div className="cb-atelier" role="dialog" aria-modal="true" aria-label={`Carnet : ${carnet.titre}`} data-panneau={panneau || undefined} data-visionneuse={cible ? "" : undefined}>
      <header className="cb-haut">
        <button type="button" className="tr-cmd" onClick={onFermer} aria-label="Revenir à L'Alambic">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <button type="button" className="tr-cmd cb-bascule" onClick={() => setPanneau((p) => !p)} aria-pressed={panneau} aria-label="Afficher les sources">
          <PanelLeft className="size-5" aria-hidden="true" />
        </button>
        <input
          className="cb-titre"
          value={carnet.titre}
          onChange={(e) => maj((c) => ({ ...c, titre: e.target.value.slice(0, 120) }))}
          aria-label="Titre du carnet"
          dir="auto"
        />
        <span className="flex-1" />
        <span className="cb-compteur">
          {actives.length} source{actives.length > 1 ? "s" : ""} cochée{actives.length > 1 ? "s" : ""}
        </span>
      </header>

      <Sources
        sources={carnet.sources}
        budget={BUDGET}
        onFichiers={ajouterFichiers}
        onLiens={ajouterLiens}
        onCocher={(s, active) => majSource(s.id, { active })}
        onTout={(active) => maj((c) => ({ ...c, sources: c.sources.map((s) => ({ ...s, active })) }))}
        onRetirer={retirer}
        onFermer={() => setPanneau(false)}
      />

      <Conversation
        messages={carnet.messages}
        sources={carnet.sources}
        enCours={enCours}
        pret={actives.length > 0}
        analyseEnCours={carnet.sources.some((s) => s.etat === "analyse" || s.etat === "attente")}
        erreur={erreur}
        onErreurLue={() => setErreur(null)}
        onEnvoyer={(q, a) => void envoyer(q, a)}
        onArreter={() => controle.current?.abort()}
        onCiter={setCible}
        onEffacer={() => maj((c) => ({ ...c, messages: [] }))}
      />

      {cible && <Visionneuse cible={cible} morceaux={morceaux.get(cible.source.id) ?? []} onFermer={() => setCible(null)} />}
    </div>,
    document.body,
  );
}
