"use client";

import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Le Calame — la voix : écouter son texte (synthèse vocale du navigateur) et dicter
 * (reconnaissance vocale du navigateur). Rien ne passe par le serveur du site.
 */

/* ---------- Le passage lu, surligné pendant la lecture ---------- */

const CLE_LECTURE = new PluginKey<{ from: number; to: number } | null>("lectureCalame");

export const SurlignageLecture = Extension.create({
  name: "lectureCalame",
  addProseMirrorPlugins() {
    return [
      new Plugin<{ from: number; to: number } | null>({
        key: CLE_LECTURE,
        state: {
          init: () => null,
          apply: (tr, valeur) => {
            const meta = tr.getMeta(CLE_LECTURE) as { from: number; to: number } | null | undefined;
            if (meta !== undefined) return meta;
            if (!valeur || !tr.docChanged) return valeur;
            return { from: tr.mapping.map(valeur.from), to: tr.mapping.map(valeur.to) };
          },
        },
        props: {
          decorations(etat) {
            const v = CLE_LECTURE.getState(etat);
            if (!v || v.to <= v.from) return DecorationSet.empty;
            return DecorationSet.create(etat.doc, [Decoration.inline(v.from, v.to, { class: "calame-lu" })]);
          },
        },
      }),
    ];
  },
});

function surligner(editor: Editor, plage: { from: number; to: number } | null) {
  if (editor.isDestroyed) return;
  editor.view.dispatch(editor.state.tr.setMeta(CLE_LECTURE, plage).setMeta("addToHistory", false));
}

const ARABE = /[؀-ۿﭐ-﷿ﹰ-﻿]/;

type Segment = { texte: string; from: number; to: number; langue: "fr-FR" | "ar-SA" };

/** Le texte à lire, phrase par phrase, avec sa place dans le document. */
function segments(editor: Editor, from: number, to: number): Segment[] {
  const sortie: Segment[] = [];
  editor.state.doc.nodesBetween(from, to, (noeud, pos) => {
    if (!noeud.isTextblock) return true;
    const debutBloc = Math.max(from, pos + 1);
    const finBloc = Math.min(to, pos + noeud.nodeSize - 1);
    if (finBloc <= debutBloc) return false;
    const texte = editor.state.doc.textBetween(debutBloc, finBloc, " ", " ");
    // Découpe en phrases (et à chaque changement d'écriture, pour changer de voix).
    const re = /[^.!?…؟\n]+[.!?…؟]*\s*/g;
    for (const m of texte.matchAll(re)) {
      const brut = m[0];
      if (!brut.trim()) continue;
      const i = m.index ?? 0;
      sortie.push({ texte: brut.trim(), from: debutBloc + i, to: debutBloc + i + brut.trimEnd().length, langue: ARABE.test(brut) && !/[a-zà-ÿ]{3,}/i.test(brut) ? "ar-SA" : "fr-FR" });
    }
    return false;
  });
  return sortie;
}

export function voixDisponibles(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function voixPour(langue: string): SpeechSynthesisVoice | undefined {
  const toutes = window.speechSynthesis.getVoices();
  const debut = langue.slice(0, 2);
  return toutes.find((v) => v.lang === langue && v.localService) ?? toutes.find((v) => v.lang === langue) ?? toutes.find((v) => v.lang.startsWith(debut));
}

export type Lecteur = { arreter: () => void; pause: () => void; reprendre: () => void };

/** Lit le document (la sélection s'il y en a une, sinon depuis le curseur). */
export function lire(editor: Editor, vitesse: number, surFin: () => void): Lecteur | null {
  if (!voixDisponibles()) return null;
  const { from, to, empty } = editor.state.selection;
  const debut = empty ? from : from;
  const fin = empty ? editor.state.doc.content.size : to;
  const liste = segments(editor, debut, fin);
  if (liste.length === 0) return null;
  const synth = window.speechSynthesis;
  synth.cancel();
  let arrete = false;
  let i = 0;
  const suivant = () => {
    if (arrete || i >= liste.length) {
      surligner(editor, null);
      if (!arrete) surFin();
      return;
    }
    const s = liste[i++];
    const enonce = new SpeechSynthesisUtterance(s.texte);
    enonce.lang = s.langue;
    const v = voixPour(s.langue);
    if (v) enonce.voice = v;
    enonce.rate = vitesse;
    enonce.onstart = () => surligner(editor, { from: s.from, to: s.to });
    enonce.onend = suivant;
    enonce.onerror = suivant;
    synth.speak(enonce);
  };
  suivant();
  return {
    arreter: () => {
      arrete = true;
      synth.cancel();
      surligner(editor, null);
    },
    pause: () => synth.pause(),
    reprendre: () => synth.resume(),
  };
}

/* ---------- Dictée ---------- */

type Reconnaissance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

export function dicteeDisponible(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

export type Dictee = { arreter: () => void };

/**
 * Démarre la dictée : chaque phrase reconnue est écrite au curseur. surProvisoire montre
 * ce qui est en train d'être entendu (avant d'être définitif).
 */
export function dicter(editor: Editor, langue: string, surProvisoire: (texte: string) => void, surFin: (erreur?: string) => void): Dictee | null {
  const w = window as unknown as { SpeechRecognition?: new () => Reconnaissance; webkitSpeechRecognition?: new () => Reconnaissance };
  const Classe = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Classe) return null;
  const r = new Classe();
  r.lang = langue;
  r.continuous = true;
  r.interimResults = true;
  let arretVoulu = false;
  r.onresult = (e) => {
    let provisoire = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const resultat = e.results[i];
      const texte = resultat[0].transcript;
      if (resultat.isFinal) {
        const propre = texte.trim();
        if (propre) {
          const { from } = editor.state.selection;
          const avant = from > 1 ? editor.state.doc.textBetween(Math.max(0, from - 1), from, " ", " ") : "";
          const espace = avant && !/\s$/.test(avant) ? " " : "";
          const majuscule = !avant.trim() || /[.!?…]\s*$/.test(avant) ? propre.charAt(0).toUpperCase() + propre.slice(1) : propre;
          editor.chain().focus().insertContent(espace + majuscule).run();
        }
      } else provisoire += texte;
    }
    surProvisoire(provisoire);
  };
  r.onerror = (e) => {
    if (e.error === "no-speech" || e.error === "aborted") return;
    arretVoulu = true;
    surFin(e.error === "not-allowed" ? "Le micro est refusé : autorise-le dans les réglages du navigateur." : "La dictée s'est interrompue.");
  };
  r.onend = () => {
    // Le navigateur coupe après un silence : on relance tant qu'on n'a pas demandé l'arrêt.
    if (!arretVoulu) {
      try {
        r.start();
        return;
      } catch {
        surFin();
        return;
      }
    }
    surProvisoire("");
    surFin();
  };
  try {
    r.start();
  } catch {
    return null;
  }
  return {
    arreter: () => {
      arretVoulu = true;
      r.stop();
    },
  };
}
