/**
 * Le Calame — le document en HTML (page autonome et livre numérique EPUB).
 *
 * Du XHTML bien formé (les liseuses l'exigent) : titres avec ancres, notes renvoyées en fin
 * de texte avec retour à l'appel, arabe de droite à gauche, versets et hadiths avec leur
 * référence, tableaux, images et légendes. Module pur : le navigateur fournit les images.
 */

import { texteDe, titresDuNeutre, type Noeud } from "./neutre";

export type OptionsHtml = {
  /** L'adresse d'une image dans la sortie (fichier de l'EPUB, ou donnée en ligne pour une page autonome). */
  sourceImage?: (fichier: string) => string | null;
  /** Les notes portent les attributs du livre numérique (epub:type). */
  epub?: boolean;
};

const LETTRES_ARABES = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const PASSAGES_ARABES = /([؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿](?:[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿\s٠-٩]*[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿٠-٩])?)/g;
const DEGRES: Record<string, string> = { sahih: "authentique (ṣaḥīḥ)", "sahih-li-ghayrihi": "authentique par ses appuis", hasan: "bon (ḥasan)", "hasan-li-ghayrihi": "bon par ses appuis", daif: "faible (ḍaʿīf)", mawdu: "forgé (mawḍūʿ)" };

export function echapper(t: string): string {
  return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function commenceEnArabe(n: Noeud): boolean {
  const premiere = /[A-Za-z\u00C0-\u00FF؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.exec(texteDe(n))?.[0] ?? "";
  return LETTRES_ARABES.test(premiere);
}

const adresseSure = (href: string) => (/^(https?:|mailto:|#)/i.test(href) ? href : "");

/** Le corps du document en XHTML, et ce qu'il faut pour la table des matières et les notes. */
export function enHtml(doc: Noeud, options: OptionsHtml = {}): { corps: string; titres: { id: string; niveau: number; texte: string }[]; notes: string[] } {
  const notes: string[] = [];
  const titres = titresDuNeutre(doc).map((t) => ({ id: `t${t.ordinal}`, niveau: t.niveau, texte: t.texte }));
  let rangTitre = 0;
  const epub = options.epub ? ' epub:type="noteref"' : "";

  const enLigne = (noeuds: Noeud[] | undefined): string =>
    (noeuds ?? [])
      .map((n) => {
        if (n.type === "hardBreak") return "<br/>";
        if (n.type === "note") {
          notes.push(String(n.attrs?.texte ?? "").trim());
          const k = notes.length;
          return `<sup><a href="#note-${k}" id="appel-${k}" role="doc-noteref"${epub}>${k}</a></sup>`;
        }
        if (n.type !== "text") return enLigne(n.content);
        let t = echapper(n.text ?? "");
        // Chaque passage arabe porte sa langue (police, césure et sens de lecture justes).
        if (LETTRES_ARABES.test(t)) t = t.replace(PASSAGES_ARABES, '<span lang="ar" dir="rtl">$1</span>');
        for (const m of n.marks ?? []) {
          const a = m.attrs ?? {};
          if (m.type === "bold") t = `<strong>${t}</strong>`;
          else if (m.type === "italic") t = `<em>${t}</em>`;
          else if (m.type === "strike") t = `<s>${t}</s>`;
          else if (m.type === "souligne") t = `<u>${t}</u>`;
          else if (m.type === "superscript") t = `<sup>${t}</sup>`;
          else if (m.type === "subscript") t = `<sub>${t}</sub>`;
          else if (m.type === "code") t = `<code>${t}</code>`;
          else if (m.type === "surligne") t = `<mark>${t}</mark>`;
          else if (m.type === "couleur" && /^#[0-9a-f]{3,8}$/i.test(String(a.couleur ?? ""))) t = `<span style="color:${String(a.couleur)}">${t}</span>`;
          else if (m.type === "link" && adresseSure(String(a.href ?? ""))) t = `<a href="${echapper(String(a.href))}">${t}</a>`;
          else if (m.type === "lienInterne" && a.ancre) t = `<a href="#ancre-${echapper(String(a.ancre))}">${t}</a>`;
        }
        return t;
      })
      .join("");

  const attrsParagraphe = (n: Noeud, classe = "") => {
    const a = n.attrs ?? {};
    const morceaux: string[] = [];
    if (classe) morceaux.push(`class="${classe}"`);
    if (a.ancre) morceaux.push(`id="ancre-${echapper(String(a.ancre))}"`);
    if (commenceEnArabe(n)) morceaux.push('lang="ar" dir="rtl"');
    // Le document peut venir d'ailleurs (page publiée) : seul un alignement connu passe.
    if (a.textAlign === "center" || a.textAlign === "right" || a.textAlign === "justify") morceaux.push(`style="text-align:${a.textAlign}"`);
    return morceaux.length ? ` ${morceaux.join(" ")}` : "";
  };

  const blocs = (noeuds: Noeud[] | undefined): string => (noeuds ?? []).map(bloc).join("\n");

  const bloc = (n: Noeud): string => {
    const a = n.attrs ?? {};
    switch (n.type) {
      case "heading": {
        const t = titres[rangTitre++];
        const niveau = Math.min(4, Math.max(2, Number(a.level) || 2));
        return `<h${niveau} id="${t?.id ?? `t${rangTitre}`}"${a.ancre ? ` data-ancre="${echapper(String(a.ancre))}"` : ""}>${a.ancre ? `<a id="ancre-${echapper(String(a.ancre))}"></a>` : ""}${enLigne(n.content)}</h${niveau}>`;
      }
      case "paragraph": {
        const classe = a.styleNomme === "legende" ? "legende" : a.styleNomme === "bibliographie" ? "bibliographie" : a.styleNomme === "titre-garde" ? "titre-garde" : "";
        return `<p${attrsParagraphe(n, classe)}>${enLigne(n.content) || "<br/>"}</p>`;
      }
      case "bulletList":
        return `<ul>${(n.content ?? []).map((li) => `<li>${blocs(li.content)}</li>`).join("")}</ul>`;
      case "orderedList":
        return `<ol${Number(a.start) > 1 ? ` start="${Number(a.start)}"` : ""}>${(n.content ?? []).map((li) => `<li>${blocs(li.content)}</li>`).join("")}</ol>`;
      case "taskList":
        return `<ul class="taches">${(n.content ?? []).map((li) => `<li>${li.attrs?.checked ? "☑" : "☐"} ${blocs(li.content)}</li>`).join("")}</ul>`;
      case "blockquote":
        return `<blockquote>${blocs(n.content)}</blockquote>`;
      case "encadre":
      case "objection":
      case "reponse": {
        const etiquette = n.type === "objection" ? "Objection" : n.type === "reponse" ? "Réponse" : String(a.type ?? "").replace(/-/g, " ");
        return `<aside class="encadre">${etiquette ? `<p class="etiquette">${echapper(etiquette)}</p>` : ""}${blocs(n.content)}</aside>`;
      }
      case "verset":
      case "hadith": {
        const lignes = (n.content ?? [])
          .map((p) => {
            const arabe = p.type === "versetArabe" || p.type === "hadithArabe" || commenceEnArabe(p);
            const t = enLigne(p.content);
            return t ? (arabe ? `<p class="arabe" lang="ar" dir="rtl">${t}</p>` : `<p class="traduction">${t}</p>`) : "";
          })
          .join("");
        const legende = n.type === "verset" ? `Coran, ${String(a.reference || "référence à préciser")}` : [String(a.recueil || "Recueil à préciser"), a.numero ? `n° ${String(a.numero)}` : "", DEGRES[String(a.degre ?? "")] ?? ""].filter(Boolean).join(", ");
        return `<figure class="${n.type}">${lignes}<figcaption>${echapper(legende)}</figcaption></figure>`;
      }
      case "horizontalRule":
        return "<hr/>";
      case "codeBlock":
        return `<pre><code>${enLigne(n.content)}</code></pre>`;
      case "table": {
        const lignes = n.content ?? [];
        const entete = lignes.length > 0 && (lignes[0].content ?? []).every((c) => c.type === "tableHeader");
        const rangee = (r: Noeud, balise: "th" | "td") =>
          `<tr>${(r.content ?? [])
            .map((c) => {
              const span = Number(c.attrs?.colspan) > 1 ? ` colspan="${Number(c.attrs?.colspan)}"` : "";
              const fond = typeof c.attrs?.fond === "string" && /^#[0-9a-f]{6}$/i.test(String(c.attrs.fond)) ? ` style="background:${String(c.attrs.fond)}"` : "";
              return `<${balise}${span}${fond}>${blocs(c.content)}</${balise}>`;
            })
            .join("")}</tr>`;
        return `<table>${entete ? `<thead>${rangee(lignes[0], "th")}</thead>` : ""}<tbody>${(entete ? lignes.slice(1) : lignes).map((r) => rangee(r, "td")).join("")}</tbody></table>`;
      }
      case "image": {
        const src = options.sourceImage?.(String(a.fichier ?? ""));
        if (!src) return a.legende ? `<p class="legende">[Image : ${echapper(String(a.legende))}]</p>` : "";
        return `<figure class="image"><img src="${echapper(src)}" alt="${echapper(String(a.alt ?? a.legende ?? ""))}"/>${a.legende ? `<figcaption>${echapper(String(a.legende))}</figcaption>` : ""}</figure>`;
      }
      case "documentPdf":
        return `<p class="joint">Document joint : ${echapper(String(a.nom ?? "document"))}</p>`;
      case "sautPage":
        return `<div class="saut-page"></div>`;
      case "frise":
        return `<ol class="frise">${(n.content ?? []).map((ev) => `<li>${blocs(ev.content)}</li>`).join("")}</ol>`;
      case "sommaire":
        return `<nav class="sommaire" role="doc-toc"><h2>${echapper(String(a.titre || "Table des matières"))}</h2><ol>${titres
          .map((t) => `<li class="niveau-${t.niveau}"><a href="#${t.id}">${echapper(t.texte)}</a></li>`)
          .join("")}</ol></nav>`;
      default:
        if (!n.content) return "";
        if (n.content.some((c) => c.type === "text" || c.type === "hardBreak" || c.type === "note")) return `<p${attrsParagraphe(n)}>${enLigne(n.content)}</p>`;
        return blocs(n.content);
    }
  };

  const corps = blocs(doc.content);
  const notesHtml = notes.length
    ? `\n<section class="notes" role="doc-endnotes"${options.epub ? ' epub:type="endnotes"' : ""}><h2>Notes</h2><ol>${notes
        .map((t, i) => `<li id="note-${i + 1}"${options.epub ? ' epub:type="endnote"' : ""}>${echapper(t || "…")} <a href="#appel-${i + 1}" role="doc-backlink">↩</a></li>`)
        .join("")}</ol></section>`
    : "";
  return { corps: corps + notesHtml, titres, notes };
}

/** La même feuille, limitée à un conteneur (pour une page du site : rien ne déborde sur le reste). */
export function feuilleLimitee(css: string, portee: string): string {
  return css
    .split("\n")
    .map((ligne) => {
      if (ligne.startsWith("@media")) return ligne.replace(/\bbody\b/g, portee);
      const i = ligne.indexOf("{");
      if (i < 0) return ligne;
      const selecteurs = ligne
        .slice(0, i)
        .split(",")
        .map((sel) => (sel.trim() === "body" ? portee : `${portee} ${sel.trim()}`))
        .join(",");
      return selecteurs + ligne.slice(i);
    })
    .join("\n");
}

/** La feuille de style des sorties HTML et EPUB : sobre, lisible, l'arabe en grand. */
export function feuilleDeStyle(s: { corps: { taille: number; interligne: number; couleur: string }; titre1: { taille: number; couleur: string }; titre2: { taille: number; couleur: string }; titre3: { taille: number; couleur: string } }): string {
  return `body{font-family:Georgia,"Times New Roman",serif;font-size:${s.corps.taille}pt;line-height:${s.corps.interligne};color:${s.corps.couleur};margin:0 auto;max-width:42em;padding:2em 1.2em}
h1{font-size:${s.titre1.taille + 4}pt;color:${s.titre1.couleur};line-height:1.2}
h2{font-size:${s.titre1.taille}pt;color:${s.titre1.couleur};line-height:1.25;margin-top:1.6em}
h3{font-size:${s.titre2.taille}pt;color:${s.titre2.couleur};margin-top:1.4em}
h4{font-size:${s.titre3.taille}pt;color:${s.titre3.couleur};margin-top:1.2em}
p{margin:0 0 .7em}
blockquote,aside.encadre{margin:1em 0;padding:.2em 0 .2em 1.1em;border-left:3px solid #c9a227;font-style:italic}
aside.encadre{font-style:normal;background:#faf7ee;padding:.8em 1em;border-radius:.4em}
.etiquette{font-weight:bold;text-transform:capitalize}
figure{margin:1.2em 0}
figure.verset,figure.hadith{padding:.8em 1em;border-radius:.5em;background:#fbf8f0}
.arabe,[lang="ar"]{font-family:"Amiri","Scheherazade New","Traditional Arabic",serif;font-size:1.3em;line-height:1.9}
p.arabe{text-align:right;margin-bottom:.4em}
.traduction{font-style:italic}
figcaption{font-size:.85em;color:#5a6075;text-align:right}
figure.image{text-align:center}
figure.image img{max-width:100%;height:auto}
figure.image figcaption,.legende{text-align:center;font-style:italic}
table{border-collapse:collapse;width:100%;margin:1em 0;font-size:.95em}
th,td{border:1px solid #bfc4d8;padding:.35em .6em;vertical-align:top}
th{background:#eef0f6}
td p,th p{margin:0}
.bibliographie{padding-left:2em;text-indent:-2em}
.titre-garde{font-size:2em;font-weight:bold;text-align:center;margin-top:3em}
.saut-page{break-after:page;page-break-after:always}
nav.sommaire ol{list-style:none;padding:0}
nav.sommaire .niveau-3{padding-left:1.4em}
nav.sommaire .niveau-4{padding-left:2.8em}
ol.frise li{margin-bottom:.5em}
section.notes{margin-top:2.5em;border-top:1px solid #ccc;font-size:.9em}
sup a{text-decoration:none}
@media print{body{max-width:none;padding:0}}`;
}
