/*
 * L'Écorché — lire un paquet de modèles (public/corps/*.bin, fabriqués par scripts/corps/05_paquets.py).
 * Un paquet : un en-tête JSON (les pièces et leurs plages), puis des flux quantifiés et codés en différences,
 * le tout en gzip. On en tire un tampon de sommets entrelacé (24 octets par sommet) et les indices.
 * Module pur : fonctionne dans la page comme dans un Worker.
 */

export type PieceGeo = {
  /** L'identifiant stable de la pièce (le nom de l'objet d'origine, en minuscules). */
  cle: string;
  /** Premier sommet, nombre de sommets. */
  s: [number, number];
  /** Premier triangle, nombre de triangles. */
  t: [number, number];
  /** Centre et rayon de la sphère englobante, puis la boîte (min x, y, z, max x, y, z), en mètres. */
  c: [number, number, number];
  r: number;
  b: [number, number, number, number, number, number];
};

export type Paquet = {
  paquet: string;
  paire: boolean;
  lod: number;
  sommets: number;
  triangles: number;
  origine: [number, number, number];
  pas: number;
  pieces: PieceGeo[];
  /** 24 octets par sommet : x, y, z, pièce (u16) · normale octaédrique (2 × i16) · 12 octets d'attributs (u8). */
  tampon: ArrayBuffer;
  indices: Uint32Array;
};

export const OCTETS_PAR_SOMMET = 24;

/** Les attributs d'un octet, dans l'ordre du tampon (à partir de l'octet 12). */
const OCTETS = ["w1", "w2", "ao", "fs", "fa", "fb", "tx", "ty", "ba", "bb", "bw", "ex"] as const;

async function degonfler(donnees: ArrayBuffer): Promise<ArrayBuffer> {
  const flux = new Blob([donnees]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(flux).arrayBuffer();
}

export async function lirePaquet(compresse: ArrayBuffer): Promise<Paquet> {
  const brut = await degonfler(compresse);
  const vue = new DataView(brut);
  if (vue.getUint32(0, true) !== 0x314f4345) throw new Error("paquet inconnu"); // « ECO1 »
  const lj = vue.getUint32(4, true);
  const entete = JSON.parse(new TextDecoder().decode(new Uint8Array(brut, 8, lj))) as {
    paquet: string;
    paire: boolean;
    lod: number;
    sommets: number;
    triangles: number;
    origine: [number, number, number];
    pas: number;
    pieces: PieceGeo[];
    flux: Record<string, [number, number]>;
  };
  const base = 8 + lj;
  const n = entete.sommets;
  const tampon = new ArrayBuffer(n * OCTETS_PAR_SOMMET);
  const u16 = new Uint16Array(tampon);
  const i16 = new Int16Array(tampon);
  const u8 = new Uint8Array(tampon);
  const flux16 = (nom: string) => {
    const [o, l] = entete.flux[nom];
    // Le décalage n'est pas forcément pair : on copie.
    return new Uint16Array(brut.slice(base + o, base + o + l));
  };
  const flux8 = (nom: string) => {
    const [o, l] = entete.flux[nom];
    return new Uint8Array(brut, base + o, l);
  };

  // Les positions et les normales : des différences en zigzag, remises à zéro au début de chaque pièce.
  const pas = OCTETS_PAR_SOMMET / 2;
  for (const [k, nom] of [
    [0, "px"],
    [1, "py"],
    [2, "pz"],
  ] as const) {
    const f = flux16(nom);
    for (const p of entete.pieces) {
      let v = 0;
      for (let i = p.s[0], fin = p.s[0] + p.s[1]; i < fin; i++) {
        const z = f[i];
        v += (z >>> 1) ^ -(z & 1);
        u16[i * pas + k] = v;
      }
    }
  }
  for (const [k, nom] of [
    [4, "nx"],
    [5, "ny"],
  ] as const) {
    const f = flux16(nom);
    for (const p of entete.pieces) {
      let v = 0;
      for (let i = p.s[0], fin = p.s[0] + p.s[1]; i < fin; i++) {
        const z = f[i];
        v += (z >>> 1) ^ -(z & 1);
        i16[i * pas + k] = v;
      }
    }
  }
  entete.pieces.forEach((p, rang) => {
    for (let i = p.s[0], fin = p.s[0] + p.s[1]; i < fin; i++) u16[i * pas + 3] = rang;
  });
  OCTETS.forEach((nom, k) => {
    if (!entete.flux[nom]) return;
    const f = flux8(nom);
    for (let i = 0; i < n; i++) u8[i * OCTETS_PAR_SOMMET + 12 + k] = f[i];
  });

  // Les triangles : trois entiers à longueur variable par triangle (a − a précédent, b − a, c − a).
  const indices = new Uint32Array(entete.triangles * 3);
  const t = flux8("tri");
  let o = 0;
  const lire = () => {
    let v = 0;
    let dec = 0;
    for (;;) {
      const b = t[o++];
      v |= (b & 0x7f) << dec;
      if (b < 0x80) return v >>> 0;
      dec += 7;
    }
  };
  for (const p of entete.pieces) {
    let a = 0;
    const s0 = p.s[0];
    for (let i = p.t[0], fin = p.t[0] + p.t[1]; i < fin; i++) {
      a += lire();
      const b = a + lire();
      const c = a + lire();
      indices[i * 3] = s0 + a;
      indices[i * 3 + 1] = s0 + b;
      indices[i * 3 + 2] = s0 + c;
    }
  }
  return { paquet: entete.paquet, paire: entete.paire, lod: entete.lod, sommets: n, triangles: entete.triangles, origine: entete.origine, pas: entete.pas, pieces: entete.pieces, tampon, indices };
}
