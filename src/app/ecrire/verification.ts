"use client";

import type { Editor } from "@tiptap/core";
import { lireBibliotheque } from "@/lib/atelier/bibliotheque";

/*
 * Le Calame — la vérification avant export : ce qui manquerait au lecteur une fois le
 * document parti (notes vides, images sans description, liens qui ne mènent nulle part,
 * titres vides, sources incomplètes). Chaque remarque sait où aller dans le texte.
 */

export type Remarque = { genre: "note" | "image" | "lien" | "titre" | "source"; message: string; pos: number };

const adresseValide = (href: string) => {
  if (/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(href)) return true;
  try {
    const u = new URL(href);
    return (u.protocol === "https:" || u.protocol === "http:") && /\.[a-z]{2,}$/i.test(u.hostname.replace(/\.$/, ""));
  } catch {
    return false;
  }
};

export function verifierDocument(editor: Editor): Remarque[] {
  const doc = editor.state.doc;
  const remarques: Remarque[] = [];
  const ancres = new Set<string>();
  doc.descendants((n) => {
    if (typeof n.attrs?.ancre === "string" && n.attrs.ancre) ancres.add(n.attrs.ancre);
    return true;
  });
  const biblio = new Set(lireBibliotheque().map((o) => o.id));
  const liensVus = new Set<string>();
  let titres = 0;
  let images = 0;
  doc.descendants((n, pos) => {
    const a = n.attrs ?? {};
    switch (n.type.name) {
      case "note":
        if (!String(a.texte ?? "").trim()) remarques.push({ genre: "note", message: "Note de bas de page vide", pos });
        else if (a.ouvrage && !biblio.has(String(a.ouvrage))) remarques.push({ genre: "source", message: "Note tirée d'un ouvrage retiré de la bibliothèque", pos });
        return false;
      case "heading":
        titres++;
        if (!n.textContent.trim()) remarques.push({ genre: "titre", message: `Titre vide (le ${titres}${titres === 1 ? "er" : "e"} du document)`, pos });
        break;
      case "image":
        images++;
        if (!String(a.alt ?? "").trim()) remarques.push({ genre: "image", message: `Image ${images} sans description pour les lecteurs d'écran${a.legende ? ` (« ${String(a.legende).slice(0, 40)} »)` : ""}`, pos });
        return false;
      case "source": {
        const manque = [!String(a.auteur ?? "").trim() && "l'auteur", !String(a.ouvrage ?? "").trim() && "l'ouvrage"].filter(Boolean);
        if (manque.length) remarques.push({ genre: "source", message: `Source incomplète : il manque ${manque.join(" et ")}`, pos });
        return false;
      }
      case "verset":
        if (!String(a.reference ?? "").trim()) remarques.push({ genre: "source", message: "Verset sans référence", pos });
        break;
      case "hadith":
        if (!String(a.recueil ?? "").trim() || !String(a.numero ?? "").trim()) remarques.push({ genre: "source", message: "Hadith sans recueil ou sans numéro", pos });
        break;
      case "renvoi":
        if (a.cible && !ancres.has(String(a.cible))) remarques.push({ genre: "lien", message: "Renvoi vers une partie qui n'existe plus", pos });
        return false;
      case "lienCarte":
        if (!adresseValide(String(a.url ?? ""))) remarques.push({ genre: "lien", message: "Carte de lien sans adresse valide", pos });
        return false;
      default:
        break;
    }
    if (n.isText) {
      for (const m of n.marks) {
        const cle = `${m.type.name}:${pos}`;
        if (liensVus.has(cle)) continue;
        if (m.type.name === "link" && !adresseValide(String(m.attrs.href ?? ""))) {
          liensVus.add(cle);
          remarques.push({ genre: "lien", message: `Lien mal formé : « ${String(m.attrs.href ?? "").slice(0, 50)} »`, pos });
        }
        if (m.type.name === "lienInterne" && m.attrs.ancre && !ancres.has(String(m.attrs.ancre))) {
          liensVus.add(cle);
          remarques.push({ genre: "lien", message: `Lien interne vers une partie disparue (« ${(n.text ?? "").slice(0, 40)} »)`, pos });
        }
      }
    }
    return true;
  });
  return remarques;
}

/** Va à l'endroit d'une remarque et le montre. */
export function allerARemarque(editor: Editor, r: Remarque): void {
  const pos = Math.min(r.pos, editor.state.doc.content.size);
  editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
}
