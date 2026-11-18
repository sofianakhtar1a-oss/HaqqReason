/*
 * L'affichage d'une réponse : Markdown → HTML nettoyé (DOMPurify), puis, dans le texte seulement
 * (jamais dans le code), les références « [Doc 2, p. 14] » deviennent des boutons qui ouvrent la page citée.
 * Aucune image distante n'est chargée, aucun script ne passe, les liens s'ouvrent dans un nouvel onglet.
 */
import DOMPurify from "dompurify";
import { Marked } from "marked";

const marked = new Marked({ gfm: true, breaks: false });

let crochets = false;
function preparer() {
  if (crochets) return;
  crochets = true;
  DOMPurify.addHook("afterSanitizeAttributes", (noeud) => {
    if (noeud instanceof HTMLAnchorElement) {
      const href = noeud.getAttribute("href") ?? "";
      if (!/^(https?:|mailto:|#)/i.test(href)) noeud.removeAttribute("href");
      noeud.setAttribute("target", "_blank");
      noeud.setAttribute("rel", "noopener noreferrer nofollow");
    }
  });
}

/** Une référence trouvée dans le texte : document, pages (facultatives). */
export type Reference = { doc: number; debut?: number; fin?: number };

const BLOC_REF = /\[(\s*Doc\.?\s*\d+[^\]\n]{0,120})\]/gi;
const A_UNE_REF = /\[\s*Doc\.?\s*\d+/i;
const UNE_REF = /Doc\.?\s*(\d+)(?:\s*[,:]\s*(?:pp?\.?|pages?)\s*(\d+)(?:\s*[-–]\s*(\d+))?)?/gi;

export function lireReferences(contenu: string): Reference[] {
  const refs: Reference[] = [];
  for (const m of contenu.matchAll(UNE_REF)) {
    const doc = Number(m[1]);
    const debut = m[2] ? Number(m[2]) : undefined;
    const fin = m[3] ? Number(m[3]) : undefined;
    if (doc > 0 && doc < 10_000) refs.push({ doc, debut, fin: fin && debut && fin >= debut ? fin : undefined });
  }
  return refs;
}

function boutonReference(ref: Reference, nom: string | undefined): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "aia-ref";
  b.dataset.doc = String(ref.doc);
  if (ref.debut) b.dataset.page = String(ref.debut);
  const pages = ref.debut ? ` · p. ${ref.debut}${ref.fin ? `–${ref.fin}` : ""}` : "";
  b.textContent = `Doc ${ref.doc}${pages}`;
  b.title = nom ? `${nom}${ref.debut ? ` — page ${ref.debut}${ref.fin ? ` à ${ref.fin}` : ""}` : ""} : voir le texte` : "Document de la conversation";
  return b;
}

/** Remplace les références par des boutons, dans les nœuds de texte hors code et hors liens. */
function citer(racine: HTMLElement, noms: Map<number, string>) {
  const marcheur = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest("code, pre, a, .aia-ref") ? NodeFilter.FILTER_REJECT : A_UNE_REF.test(n.nodeValue ?? "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
  });
  const noeuds: Text[] = [];
  for (let n = marcheur.nextNode(); n; n = marcheur.nextNode()) noeuds.push(n as Text);
  for (const noeud of noeuds) {
    const texte = noeud.nodeValue ?? "";
    const morceaux = document.createDocumentFragment();
    let dernier = 0;
    for (const m of texte.matchAll(BLOC_REF)) {
      const refs = lireReferences(m[1]);
      if (!refs.length) continue;
      morceaux.append(texte.slice(dernier, m.index));
      refs.forEach((r, i) => {
        if (i) morceaux.append(" ");
        morceaux.append(boutonReference(r, noms.get(r.doc)));
      });
      dernier = (m.index ?? 0) + m[0].length;
    }
    if (dernier === 0) continue;
    morceaux.append(texte.slice(dernier));
    noeud.replaceWith(morceaux);
  }
}

/** Dessine la réponse dans `cible`. `noms` : numéro → nom des documents, pour les infobulles. */
export function dessiner(cible: HTMLElement, contenu: string, noms: Map<number, string> = new Map()) {
  preparer();
  const html = marked.parse(contenu, { async: false });
  cible.innerHTML = DOMPurify.sanitize(html, {
    FORBID_TAGS: ["img", "style", "iframe", "form", "input", "button", "textarea", "select", "video", "audio", "source", "object", "embed", "svg", "math"],
    FORBID_ATTR: ["style", "class", "id"],
  });
  for (const t of cible.querySelectorAll("table")) {
    const cadre = document.createElement("div");
    cadre.className = "aia-tableau";
    t.replaceWith(cadre);
    cadre.append(t);
  }
  for (const pre of cible.querySelectorAll("pre")) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "aia-copier-code";
    b.textContent = "Copier";
    pre.append(b);
  }
  if (noms.size) citer(cible, noms);
}
