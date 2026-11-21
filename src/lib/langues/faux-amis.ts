import type { Exercice } from "@/lib/regles/types";
import donnees from "./faux-amis.json";
import type { Niveau } from "./types";

/*
 * Les faux amis : les mots anglais qui ressemblent à un mot français sans en avoir le sens
 * (« actually » n'est pas « actuellement »). Une liste d'étude, et un quiz tiré de la liste.
 */

export type FauxAmi = { en: string; piege: string; sens: string; traduirePiege: string; exEn: string; exFr: string; note: string; niveau: Niveau };
export const FAUX_AMIS = donnees as FauxAmi[];

type Alea = () => number;
const au = <T,>(l: T[], alea: Alea) => l[Math.floor(alea() * l.length)];
function melanger<T>(l: T[], alea: Alea): T[] {
  const c = [...l];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}
const premier = (s: string) => s.split(/[,;]/)[0].trim();

/** La forme du mot dans la phrase d'exemple (« attended » pour « to attend »), ou null. */
export function formeDans(f: FauxAmi): string | null {
  const nu = f.en.replace(/^to /, "").toLowerCase();
  if (nu.includes(" ")) return null;
  const mots = f.exEn.split(/\s+/).map((m) => m.replace(/^[^\p{L}]+|[^\p{L}']+$/gu, ""));
  const trouve = mots.find((m) => m.toLowerCase() === nu) ?? mots.find((m) => m.toLowerCase().startsWith(nu.slice(0, Math.max(4, nu.length - 2))) && m.length <= nu.length + 3);
  return trouve ?? null;
}

/** Une question sur un faux ami : son vrai sens, la traduction du piège, ou le mot à retrouver dans sa phrase. */
export function questionDe(f: FauxAmi, autres: FauxAmi[], genre: 0 | 1 | 2, alea: Alea = Math.random): Exercice {
  const autre = au(autres.filter((x) => x.en !== f.en), alea);
  if (genre === 2) {
    const forme = formeDans(f);
    if (forme) {
      const trou = f.exEn.replace(new RegExp(`\\b${forme.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`), "___");
      return {
        d: 2,
        q: `Complète avec le mot anglais qui veut dire « ${premier(f.sens)} » : « ${trou} »`,
        r: [forme],
        i: `Ce mot ressemble au français « ${f.piege} »… mais n'en a pas le sens.`,
        e: `« ${forme} » : ${f.exFr} ${f.note}`,
      };
    }
  }
  if (genre === 1)
    return {
      d: 2,
      q: `Comment dit-on « ${f.piege} » en anglais ?`,
      o: [premier(f.traduirePiege), f.en.replace(/^to /, ""), premier(autre.traduirePiege)],
      io: { [f.en.replace(/^to /, "")]: `C'est le faux ami : « ${f.en} » veut dire « ${premier(f.sens)} ».` },
      i: "Méfie-toi du mot anglais qui ressemble le plus au mot français.",
      e: `« ${f.piege} » se dit « ${f.traduirePiege} ». ${f.note}`,
    } as Exercice;
  return {
    d: 1,
    q: `Que veut dire « ${f.en} » ?`,
    o: [premier(f.sens), f.piege, premier(autre.sens)],
    io: { [f.piege]: `C'est le piège : « ${f.piege} » se dit « ${premier(f.traduirePiege)} » en anglais.` },
    i: `« ${f.en} » ressemble à « ${f.piege} »… c'est souvent le signe d'un faux ami.`,
    e: `« ${f.en} » veut dire « ${f.sens} ». ${f.note}`,
  } as Exercice;
}

/** Un quiz de faux amis, de types variés, sans doublon d'options. */
export function composerQuiz(liste: FauxAmi[], nombre = 12, alea: Alea = Math.random): { ref: string; exercice: Exercice }[] {
  return melanger(liste, alea)
    .slice(0, nombre)
    .map((f, k) => {
      let x = questionDe(f, FAUX_AMIS, (k % 3) as 0 | 1 | 2, alea);
      // Deux options identiques (un sens proche, une même traduction) : on prend une autre forme de question.
      if ("o" in x && new Set(x.o.map((o) => o.toLowerCase())).size < x.o.length) x = questionDe(f, FAUX_AMIS, ((k + 1) % 2) as 0 | 1, alea);
      if ("o" in x && new Set(x.o.map((o) => o.toLowerCase())).size < x.o.length) x = { ...x, o: x.o.slice(0, 2) } as Exercice;
      return { ref: `faux-amis/${f.en}`, exercice: x };
    });
}
