/**
 * Expressions mathématiques d'une variable x, pour les courbes (sans eval, aucune exécution de code).
 * Exemples : x^2 - 3x + 1   sin(x)/x   2*sqrt(abs(x))   e^(-x^2)   ln(x)   pi*x
 */
type Noeud = { t: "n"; v: number } | { t: "x" } | { t: "op"; o: string; a: Noeud; b: Noeud } | { t: "neg"; a: Noeud } | { t: "fn"; f: string; a: Noeud };

const FONCTIONS: Record<string, (v: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  racine: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
};

export function compiler(source: string): { f: ((x: number) => number) | null; erreur: string } {
  const s = source.replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/,/g, ".");
  if (!s) return { f: null, erreur: "Expression vide." };
  if (s.length > 200) return { f: null, erreur: "Expression trop longue." };
  let i = 0;
  const voir = () => s[i];
  const erreur = (m: string) => {
    throw new Error(m);
  };

  // Multiplication implicite : 2x, 3(x+1), x(x-1), 2sin(x), (x+1)(x-1)
  const commenceFacteur = () => {
    const c = voir();
    return c !== undefined && (/[0-9.(x]/.test(c) || /[a-z]/.test(c));
  };

  const expression = (): Noeud => {
    let g = terme();
    while (voir() === "+" || voir() === "-") {
      const o = s[i++];
      g = { t: "op", o, a: g, b: terme() };
    }
    return g;
  };
  const terme = (): Noeud => {
    let g = facteurSigne();
    for (;;) {
      if (voir() === "*" || voir() === "/") {
        const o = s[i++];
        g = { t: "op", o, a: g, b: facteurSigne() };
      } else if (commenceFacteur()) {
        g = { t: "op", o: "*", a: g, b: puissance() };
      } else return g;
    }
  };
  const facteurSigne = (): Noeud => {
    if (voir() === "-") {
      i++;
      return { t: "neg", a: facteurSigne() };
    }
    if (voir() === "+") {
      i++;
      return facteurSigne();
    }
    return puissance();
  };
  const puissance = (): Noeud => {
    const base = primaire();
    if (voir() === "^") {
      i++;
      return { t: "op", o: "^", a: base, b: facteurSigne() };
    }
    return base;
  };
  const primaire = (): Noeud => {
    const c = voir();
    if (c === undefined) erreur("L'expression se termine trop tôt.");
    if (c === "(") {
      i++;
      const e = expression();
      if (voir() !== ")") erreur("Parenthèse fermante manquante.");
      i++;
      return e;
    }
    const nombre = /^(\d+(\.\d*)?|\.\d+)/.exec(s.slice(i));
    if (nombre) {
      i += nombre[0].length;
      return { t: "n", v: Number(nombre[0]) };
    }
    const mot = /^[a-z]+/.exec(s.slice(i));
    if (mot) {
      const m = mot[0];
      const fn = Object.keys(FONCTIONS)
        .sort((a, b) => b.length - a.length)
        .find((f) => m.startsWith(f) && s[i + f.length] === "(");
      if (fn) {
        i += fn.length + 1;
        const a = expression();
        if (voir() !== ")") erreur(`Parenthèse fermante manquante après ${fn}(.`);
        i++;
        return { t: "fn", f: fn, a };
      }
      if (m.startsWith("pi")) {
        i += 2;
        return { t: "n", v: Math.PI };
      }
      if (m.startsWith("x")) {
        i += 1;
        return { t: "x" };
      }
      if (m.startsWith("e")) {
        i += 1;
        return { t: "n", v: Math.E };
      }
      erreur(`« ${m} » n'est pas reconnu.`);
    }
    return erreur(`« ${c} » est mal placé.`);
  };

  try {
    const arbre = expression();
    if (i < s.length) erreur(`« ${s[i]} » est mal placé.`);
    const calc = (n: Noeud, x: number): number => {
      switch (n.t) {
        case "n":
          return n.v;
        case "x":
          return x;
        case "neg":
          return -calc(n.a, x);
        case "fn":
          return FONCTIONS[n.f](calc(n.a, x));
        case "op": {
          const a = calc(n.a, x);
          const b = calc(n.b, x);
          return n.o === "+" ? a + b : n.o === "-" ? a - b : n.o === "*" ? a * b : n.o === "/" ? a / b : Math.pow(a, b);
        }
      }
    };
    return { f: (x: number) => calc(arbre, x), erreur: "" };
  } catch (e) {
    return { f: null, erreur: e instanceof Error ? e.message : "Expression illisible." };
  }
}
