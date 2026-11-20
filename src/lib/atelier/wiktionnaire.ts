/**
 * Le Calame — lire le Wiktionnaire (fr.wiktionary.org, CC BY-SA) : les synonymes d'un mot français,
 * et ses traductions anglaises. On ne lit que la section « français » de la page. Module pur.
 */

/** La section française d'une page (du titre « {{langue|fr}} » au titre de langue suivant). */
export function sectionFrancaise(wikitexte: string): string {
  const debut = wikitexte.search(/^==\s*\{\{langue\|fr\}\}\s*==/m);
  if (debut < 0) return "";
  const suite = wikitexte.slice(debut + 5);
  const fin = suite.search(/^==\s*\{\{langue\|/m);
  return fin < 0 ? wikitexte.slice(debut) : wikitexte.slice(debut, debut + 5 + fin);
}

/** Les lignes d'une sous-section (« {{S|synonymes}} »…), jusqu'au titre suivant. */
function sousSections(section: string, nom: RegExp): string[] {
  const lignes = section.split("\n");
  const sortie: string[] = [];
  let dedans = false;
  for (const l of lignes) {
    if (/^=+/.test(l)) {
      dedans = nom.test(l);
      continue;
    }
    if (dedans) sortie.push(l);
  }
  return sortie;
}

/** Les synonymes (et quasi-synonymes) de la section française, sans doublon, dans l'ordre de la page. */
export function synonymesDe(wikitexte: string, max = 30): string[] {
  const section = sectionFrancaise(wikitexte);
  const vus = new Set<string>();
  for (const ligne of sousSections(section, /\{\{S\|(quasi-)?synonymes/)) {
    if (!/^\*/.test(ligne)) continue;
    for (const m of ligne.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)) {
      const mot = m[1].trim();
      if (mot && !mot.includes(":") && mot.length < 60) vus.add(mot);
    }
  }
  return [...vus].slice(0, max);
}

/** Les traductions anglaises de la section française (modèles {{trad+|en|…}}, {{trad-|en|…}}, {{trad|en|…}}). */
export function traductionsAnglaises(wikitexte: string, max = 20): string[] {
  const section = sectionFrancaise(wikitexte);
  const vues = new Set<string>();
  for (const m of section.matchAll(/\{\{trad[+-]?\|en\|([^}|]+)/g)) {
    const mot = m[1].trim();
    if (mot) vues.add(mot);
  }
  return [...vues].slice(0, max);
}

/**
 * La forme de base d'une forme fléchie, d'après sa page : « maisons » → « maison » (« Pluriel de »),
 * « mangeons » → « manger » ({{fr-verbe-flexion|manger…}}), « belles » → « beau ». Vide sinon.
 */
export function lemmeDe(wikitexte: string): string {
  const section = sectionFrancaise(wikitexte);
  const verbe = /\{\{fr-verbe-flexion\|(?:[^|}=]*=[^|}]*\|)*([^|}=]+)[|}]/.exec(section);
  if (verbe) return verbe[1].trim();
  const definition = /^#\s*''(?:[^'\n]|'(?!'))*?(?:\bde|\bd[’'])\s*''\s*\[\[([^\]|#]+)/m.exec(section);
  return definition ? definition[1].trim() : "";
}
