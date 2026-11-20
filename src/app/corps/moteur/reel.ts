"use client";

import { OCTETS_PAR_SOMMET, type Paquet } from "@/lib/corps/modele/paquet";
import type { M4, V3 } from "@/lib/corps/vec";

/*
 * L'Écorché — le moteur de rendu des modèles réels (WebGL 2, sans bibliothèque).
 *
 *   • Un paquet = une couche et ses pièces, dans un seul tampon : les pièces paires sont dessinées deux fois
 *     (la seconde en miroir), les impaires une fois. Chaque sommet porte le rang de sa pièce ; l'état de chaque
 *     structure (teinte, visibilité, survol, sélection, couleur propre, déplacement) vit dans deux petites
 *     textures lues par le shader.
 *   • Les matières sont physiques : diffusion, reflets GGX, film humide, lumière qui traverse les bords minces,
 *     fibres en relief, grain de l'os, cartilage et tendon fondus dans l'os et le muscle par des poids de sommet.
 *   • La lumière est celle d'un studio : trois boîtes à lumière qui suivent le regard, l'ombre de la principale,
 *     l'occlusion précalculée, puis un mappage tonal neutre.
 *   • Le toucher : on redessine les numéros des structures dans une image cachée et on lit le pixel sous le doigt.
 */

export type Camera = { vue: M4; proj: M4; oeil: V3; yaw: number };

export type Matiere = {
  /** Couleurs en linéaire : la matière principale, puis la secondaire (tendon d'un muscle, cartilage d'un os). */
  base: V3;
  base2: V3;
  rug: number;
  rug2: number;
  /** La lumière qui traverse (0 : opaque), et sa teinte. */
  sss: number;
  sssTeinte: V3;
  /** Le film humide (0 : sec). */
  vernis: number;
  /** Le relief des fibres, le grain de la matière. */
  fibres: number;
  grain: number;
  /** L'étirement du reflet le long des fibres (tendons). */
  aniso: number;
};

const srvb = (hex: string): V3 => {
  const n = parseInt(hex.slice(1), 16);
  const l = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return [l((n >> 16) & 255), l((n >> 8) & 255), l(n & 255)];
};

/** Les matières par paquet, pour la pièce « fraîche » (humide, brillante). */
export const MATIERES: Record<string, Matiere> = {
  os: { base: srvb("#d8c9a6"), base2: srvb("#c2d2da"), rug: 0.64, rug2: 0.3, sss: 0.12, sssTeinte: srvb("#e8b48a"), vernis: 0.05, fibres: 0, grain: 0.5, aniso: 0 },
  muscle: { base: srvb("#8a2420"), base2: srvb("#e9e3d4"), rug: 0.46, rug2: 0.34, sss: 0.55, sssTeinte: srvb("#d2301c"), vernis: 0.55, fibres: 1, grain: 0.12, aniso: 0.35 },
  tendon: { base: srvb("#e6e0d0"), base2: srvb("#e6e0d0"), rug: 0.34, rug2: 0.34, sss: 0.25, sssTeinte: srvb("#f0d9b0"), vernis: 0.35, fibres: 0.7, grain: 0.08, aniso: 0.6 },
  fascia: { base: srvb("#ddd8cc"), base2: srvb("#ddd8cc"), rug: 0.4, rug2: 0.4, sss: 0.3, sssTeinte: srvb("#f0d9b0"), vernis: 0.3, fibres: 0.4, grain: 0.1, aniso: 0.3 },
  gaine: { base: srvb("#c9d7dc"), base2: srvb("#c9d7dc"), rug: 0.3, rug2: 0.3, sss: 0.4, sssTeinte: srvb("#cfe3ea"), vernis: 0.6, fibres: 0, grain: 0.05, aniso: 0 },
  ligament: { base: srvb("#d9d2bd"), base2: srvb("#c5d3da"), rug: 0.42, rug2: 0.3, sss: 0.22, sssTeinte: srvb("#f0d9b0"), vernis: 0.25, fibres: 0.5, grain: 0.1, aniso: 0.4 },
  bourse: { base: srvb("#bfd3da"), base2: srvb("#bfd3da"), rug: 0.28, rug2: 0.28, sss: 0.5, sssTeinte: srvb("#cfe3ea"), vernis: 0.7, fibres: 0, grain: 0.04, aniso: 0 },
  artere: { base: srvb("#b3211f"), base2: srvb("#b3211f"), rug: 0.3, rug2: 0.3, sss: 0.5, sssTeinte: srvb("#ff3a20"), vernis: 0.6, fibres: 0, grain: 0.05, aniso: 0 },
  veine: { base: srvb("#3d4d9c"), base2: srvb("#3d4d9c"), rug: 0.32, rug2: 0.32, sss: 0.45, sssTeinte: srvb("#5a6fe0"), vernis: 0.55, fibres: 0, grain: 0.05, aniso: 0 },
  nerf: { base: srvb("#e8d98f"), base2: srvb("#e8d98f"), rug: 0.44, rug2: 0.44, sss: 0.3, sssTeinte: srvb("#f5e2a0"), vernis: 0.3, fibres: 0.3, grain: 0.1, aniso: 0.2 },
  viscere: { base: srvb("#b56b5e"), base2: srvb("#c5d3da"), rug: 0.36, rug2: 0.3, sss: 0.5, sssTeinte: srvb("#e0503a"), vernis: 0.65, fibres: 0, grain: 0.15, aniso: 0 },
  enveloppe: { base: srvb("#d8c8bf"), base2: srvb("#d8c8bf"), rug: 0.3, rug2: 0.3, sss: 0.6, sssTeinte: srvb("#f0c0b0"), vernis: 0.7, fibres: 0, grain: 0.05, aniso: 0 },
  encephale: { base: srvb("#d6b3a2"), base2: srvb("#ece2d2"), rug: 0.38, rug2: 0.38, sss: 0.5, sssTeinte: srvb("#e8a090"), vernis: 0.6, fibres: 0, grain: 0.1, aniso: 0 },
  lymphe: { base: srvb("#9fb07c"), base2: srvb("#9fb07c"), rug: 0.4, rug2: 0.4, sss: 0.4, sssTeinte: srvb("#c0d090"), vernis: 0.4, fibres: 0, grain: 0.1, aniso: 0 },
  insertion: { base: srvb("#c23a2e"), base2: srvb("#2e5fc2"), rug: 0.55, rug2: 0.55, sss: 0, sssTeinte: [0, 0, 0], vernis: 0, fibres: 0, grain: 0, aniso: 0 },
};

/** L'ordre du dessin : ce qui couvre d'abord (le test de profondeur épargne ce qui est dessous). */
export const ORDRE = ["fascia", "enveloppe", "muscle", "tendon", "gaine", "bourse", "lymphe", "viscere", "encephale", "veine", "artere", "nerf", "ligament", "insertion", "os"] as const;

const LARGEUR_ETAT = 1024;
/** Les rangées de la texture d'état, par structure : teinte ; visibilité, survol, pulsation, sélection ; couleur propre ; divers. */
const RANGS_ETAT = 4;

const SOMMETS = `#version 300 es
precision highp float;
precision highp int;
layout(location=0) in vec3 a_pos;
layout(location=1) in float a_piece;
layout(location=2) in vec2 a_nor;
layout(location=3) in vec4 a_m;
layout(location=4) in vec4 a_f;
layout(location=5) in vec4 a_b;
uniform mat4 u_vue;
uniform mat4 u_proj;
uniform mat4 u_lumiere;
uniform vec3 u_origine;
uniform float u_pas;
uniform float u_miroir;
uniform int u_base;
uniform ivec3 u_zones;   // première zone de ce dessin, nombre de zones par code, 1 si le groupe a des zones
uniform int u_hauteur;
uniform highp sampler2D u_etat;
uniform highp sampler2D u_decal;
uniform float u_temps;
out vec3 v_pos;
out vec3 v_nor;
out vec4 v_m;
out vec4 v_f;
out vec4 v_ombre;
out vec3 v_local;
flat out float v_id;
flat out float v_idz;

vec3 oct(vec2 e) {
  vec3 n = vec3(e, 1.0 - abs(e.x) - abs(e.y));
  float t = clamp(-n.z, 0.0, 1.0);
  n.x += n.x >= 0.0 ? -t : t;
  n.y += n.y >= 0.0 ? -t : t;
  return normalize(n);
}

void main() {
  int id = u_base + int(a_piece + 0.5);
  ivec2 c = ivec2(id % ${LARGEUR_ETAT}, id / ${LARGEUR_ETAT});
  vec4 vis = texelFetch(u_etat, c + ivec2(0, u_hauteur), 0);
  vec4 decal = texelFetch(u_decal, c, 0);
  // La zone du sommet (le tendon d'un muscle…) : une structure à part, rangée après les pièces.
  int code = int(a_b.w + 0.5);
  v_idz = u_zones.z > 0 && code > 0 ? float(u_zones.x + (code - 1) * u_zones.y + int(a_piece + 0.5)) : -1.0;
  vec3 n = oct(a_nor);
  vec3 p = u_origine + a_pos * u_pas;
  v_local = p;
  // Survol et cible : la structure gonfle à peine.
  p += n * (vis.g * 0.0006 + vis.b * 0.0009 * (0.5 + 0.5 * sin(u_temps * 5.0)));
  p.x *= u_miroir;
  n.x *= u_miroir;
  p += decal.xyz;
  v_pos = p;
  v_nor = n;
  v_m = a_m;
  v_f = a_f;
  v_id = float(id);
  v_ombre = u_lumiere * vec4(p, 1.0);
  gl_Position = u_proj * u_vue * vec4(p, 1.0);
}`;

const FRAGMENTS = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DShadow;
in vec3 v_pos;
in vec3 v_nor;
in vec4 v_m;
in vec4 v_f;
in vec4 v_ombre;
in vec3 v_local;
flat in float v_id;
flat in float v_idz;
uniform highp sampler2D u_etat;
uniform int u_hauteur;
uniform float u_opacite2;
uniform float u_parTissu;
uniform vec3 u_oeil;
uniform mat3 u_rig;
uniform vec3 u_base1;
uniform vec3 u_base2;
uniform vec4 u_surface;   // rugosité, rugosité 2, vernis, anisotropie
uniform vec4 u_chair;     // lumière traversante, fibres, grain, —
uniform vec3 u_sss;
uniform float u_opacite;
uniform float u_temps;
uniform int u_passe;
uniform vec3 u_laiton;
uniform sampler2DShadow u_carteOmbre;
uniform float u_ombres;
uniform float u_exposition;
uniform float u_humide;
out vec4 sortie;

// La structure du fragment : la pièce, ou sa zone (pour un muscle, là où le tissu est tendineux).
float structure() {
  return v_idz >= 0.0 && (u_parTissu < 0.5 || v_m.x > 0.5) ? v_idz : v_id;
}
ivec2 caseDe(float id) {
  int i = int(id + 0.5);
  return ivec2(i % ${LARGEUR_ETAT}, i / ${LARGEUR_ETAT});
}
// L'opacité : celle de la couche (une zone qui a sa propre structure suit la sienne) × celle de la structure.
float opacite(ivec2 c, out vec4 vis) {
  vis = texelFetch(u_etat, c + ivec2(0, u_hauteur), 0);
  float propreCouche = texelFetch(u_etat, c + ivec2(0, 3 * u_hauteur), 0).r;
  if (propreCouche < 0.5) return u_opacite * vis.r;
  // Un tendon dont le muscle est effacé : son bord se fond, au lieu de finir par une frange de chair.
  float bord = mix(smoothstep(0.5, 0.72, v_m.x), 1.0, clamp(u_opacite / max(u_opacite2, 1e-3), 0.0, 1.0));
  return u_opacite2 * vis.r * bord;
}

#ifdef CHOIX
void main() {
  float sid = structure();
  vec4 v_vis;
  if (opacite(caseDe(sid), v_vis) < 0.5) discard;
  float n = sid + 1.0;
  sortie = vec4(mod(n, 256.0) / 255.0, mod(floor(n / 256.0), 256.0) / 255.0, floor(n / 65536.0) / 255.0, 1.0);
}
#else
#ifdef PROFONDEUR
void main() {
  vec4 v_vis;
  if (opacite(caseDe(structure()), v_vis) < 0.6) discard;
  sortie = vec4(1.0);
}
#else

const float PI = 3.14159265;

float h31(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}
float bruit3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), u.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), u.x), u.y),
             mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), u.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), u.x), u.y), u.z);
}
float h21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
// Bruit à deux dimensions avec ses dérivées (x : la valeur ; yz : le gradient).
vec3 bruit2d(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 du = 6.0 * f * (1.0 - f);
  float a = h21(i), b = h21(i + vec2(1, 0)), c = h21(i + vec2(0, 1)), d = h21(i + vec2(1, 1));
  float v = a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y;
  vec2 g = du * (vec2(b - a, c - a) + (a - b - c + d) * u.yx);
  return vec3(v, g);
}

// Bruit périodique en x (période k), avec sa dérivée en x : x → la valeur, y → d/dx.
vec2 bruitP(vec2 p, float k) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float du = 6.0 * f.x * (1.0 - f.x);
  float x0 = mod(i.x, k), x1 = mod(i.x + 1.0, k);
  float a = h21(vec2(x0, i.y)), b = h21(vec2(x1, i.y)), c = h21(vec2(x0, i.y + 1.0)), d = h21(vec2(x1, i.y + 1.0));
  float v = mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  float dx = du * mix(b - a, d - c, u.y);
  return vec2(v, dx);
}

float dGGX(float NoH, float a) {
  float a2 = a * a;
  float d = NoH * NoH * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d + 1e-6);
}

// Une boîte à lumière vue dans le reflet : une tache gaussienne, élargie par la rugosité de la surface.
float boite(vec3 R, vec3 dir, vec3 ax, vec3 ay, vec2 taille, float flou) {
  float devant = smoothstep(-0.25, 0.3, dot(R, dir));
  vec2 d = vec2(dot(R, ax), dot(R, ay));
  vec2 s2 = taille * taille + flou * flou;
  return exp(-0.5 * (d.x * d.x / s2.x + d.y * d.y / s2.y)) * (taille.x * taille.y) / sqrt(s2.x * s2.y) * devant;
}

// Mappage tonal « PBR Neutral » (Khronos) : garde les teintes, comprime les hautes lumières.
vec3 neutre(vec3 c) {
  float x = min(c.r, min(c.g, c.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  c -= offset;
  float pic = max(c.r, max(c.g, c.b));
  if (pic < 0.76) return c;
  float d = 0.24;
  float nouveau = 1.0 - d * d / (pic + d - 0.76);
  c *= nouveau / pic;
  float g = 1.0 - 1.0 / (0.15 * (pic - nouveau) + 1.0);
  return mix(c, vec3(nouveau), g);
}

float ombre() {
  if (u_ombres < 0.5) return 1.0;
  vec3 p = v_ombre.xyz / v_ombre.w * 0.5 + 0.5;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0) return 1.0;
  float pas = 1.0 / float(textureSize(u_carteOmbre, 0).x);
  float s = 0.0;
  float z = p.z - 0.0016;
  s += texture(u_carteOmbre, vec3(p.xy + vec2(-0.9, -0.4) * pas, z));
  s += texture(u_carteOmbre, vec3(p.xy + vec2(0.4, -0.9) * pas, z));
  s += texture(u_carteOmbre, vec3(p.xy + vec2(0.9, 0.4) * pas, z));
  s += texture(u_carteOmbre, vec3(p.xy + vec2(-0.4, 0.9) * pas, z));
  s += texture(u_carteOmbre, vec3(p.xy, z));
  return s * 0.2;
}

void main() {
  ivec2 cs0 = caseDe(structure());
  vec4 v_vis;
  float alpha = opacite(cs0, v_vis);
  if (alpha < 0.02) discard;
  if (u_passe == 0 && alpha < 0.985) discard;
  if (u_passe == 1 && alpha >= 0.985) discard;

  vec3 N = normalize(v_nor);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(u_oeil - v_pos);
  float w1 = smoothstep(0.08, 0.92, v_m.x);
  float w2 = v_m.y;
  float ao = v_m.z;

  // Le sens des fibres (attribut), ou à défaut une direction quelconque dans le plan de la surface.
  vec2 te = v_f.zw * 2.0 - 1.0;
  vec3 T = vec3(te, 1.0 - abs(te.x) - abs(te.y));
  float tt = clamp(-T.z, 0.0, 1.0);
  T.x += T.x >= 0.0 ? -tt : tt;
  T.y += T.y >= 0.0 ? -tt : tt;
  T = normalize(T - N * dot(T, N) + N * 1e-4);

  // Les fibres : des faisceaux en relief qui suivent le muscle. La phase (cosinus, sinus) donne la position
  // en travers des fibres, sur une période de 16 mm ; v_m.w, la position le long de la fibre.
  float fibres = u_chair.y;
  float strie = 0.5;
  vec2 cs = v_f.xy * 2.0 - 1.0;
  float lcs = dot(cs, cs);
  if (fibres > 0.01 && lcs > 0.04) {
    float u = atan(cs.y, cs.x) / 6.2831853 + 0.5;
    float le = v_m.w;
    const float K = 10.0;
    float serre = mix(1.0, 2.0, w1);
    vec2 n1 = bruitP(vec2(u * K * serre, le * 5.0), K * serre);
    vec2 n2 = bruitP(vec2(u * K * 3.0 * serre + 1.7, le * 11.0 + 4.0), K * 3.0 * serre);
    strie = n1.x * 0.6 + n2.x * 0.4;
    float pente = (n1.y * K * 0.6 + n2.y * K * 3.0 * 0.4) * serre;
    vec3 dpx = dFdx(v_pos), dpy = dFdy(v_pos);
    vec2 dcx = dFdx(cs), dcy = dFdy(cs);
    float px = (cs.x * dcx.y - cs.y * dcx.x) / lcs, py = (cs.x * dcy.y - cs.y * dcy.x) / lcs;
    float det = dot(dpx, cross(dpy, N));
    if (abs(det) > 1e-14) {
      vec3 gphi = (cross(dpy, N) * px + cross(N, dpx) * py) / det;
      // De loin, les faisceaux deviennent plus fins qu'un pixel : on les fond pour ne pas scintiller.
      float finesse = 1.0 - smoothstep(0.35, 1.1, length(vec2(px, py)) * K * 3.0 * serre / 6.2831853);
      strie = mix(0.5, strie, finesse);
      N = normalize(N - gphi * (pente / 6.2831853) * 0.00022 * fibres * finesse * mix(1.0, 0.6, w1));
    }
  }

  // La matière.
  vec4 v_teinte = texelFetch(u_etat, cs0, 0);
  vec4 v_propre = texelFetch(u_etat, caseDe(v_id) + ivec2(0, 2 * u_hauteur), 0);
  vec3 propre = v_propre.rgb;
  vec3 base = mix(u_base1, propre, v_propre.a);
  float grainV = bruit3(v_local * 620.0) * 0.6 + bruit3(v_local * 190.0) * 0.4;
  float pores = smoothstep(0.62, 0.9, bruit3(v_local * 1500.0)) * smoothstep(0.35, 0.7, bruit3(v_local * 90.0 + 7.0));
  base *= 1.0 - u_chair.z * (0.3 * (grainV - 0.35) + 0.45 * pores * (1.0 - w1));
  base *= mix(1.0, 0.66 + 0.68 * strie, min(1.0, fibres) * 0.6);
  vec3 base2 = u_base2 * (0.84 + 0.32 * strie * min(1.0, fibres + 0.3));
  // Les sutures du crâne, la dentine : un trait plus sombre.
  base = mix(base, base * vec3(0.5, 0.42, 0.34), smoothstep(0.35, 0.9, w2) * 0.75);
  vec3 albedo = mix(base, base2, w1);
  float rug = mix(u_surface.x, u_surface.y, w1);
  rug = clamp(rug + (grainV - 0.5) * u_chair.z * 0.25, 0.08, 1.0);
  float sss = u_chair.x * mix(1.0, 0.45, w1);
  float vernis = u_surface.z * u_humide;

  // La teinte d'apprentissage : une lumière posée sur la matière, qui garde son relief.
  float lum = dot(albedo, vec3(0.3, 0.55, 0.15));
  // (Sur un tissu clair — tendon, os — la teinte garde sa couleur au lieu de pâlir.)
  albedo = mix(albedo, v_teinte.rgb * (0.5 + 0.55 * lum + 0.2 * strie), v_teinte.a * 0.8);

  float NoV = max(dot(N, V), 1e-3);
  vec3 R = reflect(-V, N);
  // Le reflet s'étire le long des fibres (tendons, ligaments).
  float aniso = u_surface.w * max(w1, step(0.5, u_surface.w));
  vec3 Rr = R * u_rig;             // dans le repère du studio : x à droite, y en haut, z vers l'objectif
  vec3 Nr = N * u_rig;
  vec3 Tr = T * u_rig;

  // Le studio : une grande boîte en haut à gauche, une bande à droite, deux contre-jours, un plafonnier.
  vec3 dCle = normalize(vec3(-0.52, 0.6, 0.6));
  vec3 dApp = normalize(vec3(0.82, 0.12, 0.55));
  vec3 dCj1 = normalize(vec3(0.55, 0.38, -0.74));
  vec3 dCj2 = normalize(vec3(-0.72, 0.22, -0.66));
  vec3 cCle = vec3(1.0, 0.965, 0.92);
  vec3 cApp = vec3(0.72, 0.82, 0.95);
  vec3 cCj = vec3(1.0, 0.9, 0.76);
  float om = ombre();

  // La lumière diffuse, avec un passage doux de la lumière à l'ombre que la chair teinte de rouge.
  float l1 = dot(Nr, dCle), l2 = dot(Nr, dApp), l3 = dot(Nr, dCj1), l4 = dot(Nr, dCj2);
  vec3 enrobe = u_sss * sss;
  vec3 dif = vec3(0.0);
  dif += cCle * 2.3 * om * (max(l1, 0.0) * (1.0 - 0.5 * sss) + enrobe * smoothstep(-0.55, 0.35, l1) * 0.42);
  dif += cApp * 0.38 * (max(l2, 0.0) + enrobe * smoothstep(-0.6, 0.4, l2) * 0.3);
  dif += cCj * 0.6 * (max(l3, 0.0) + max(l4, 0.0));
  // La lumière traversante des contre-jours : les bords minces rougeoient.
  float bord = pow(1.0 - NoV, 2.2);
  dif += u_sss * sss * bord * (smoothstep(-0.2, 0.9, dot(Rr, dCj1)) + smoothstep(-0.2, 0.9, dot(Rr, dCj2))) * 0.5;
  // L'ambiance : le plafond clair, le sol sombre et chaud.
  vec3 ciel = mix(vec3(0.085, 0.07, 0.06), vec3(0.3, 0.33, 0.36), Nr.y * 0.5 + 0.5);
  ciel += vec3(0.1, 0.11, 0.12) * max(Nr.z, 0.0);
  dif += ciel * 0.72 * ao * mix(0.55, 1.0, ao);
  // L'occlusion creuse aussi un peu la lumière directe dans les replis (ombres de contact).
  dif *= mix(0.62, 1.0, smoothstep(0.0, 0.55, ao));

  // Les reflets : les boîtes à lumière vues dans la surface, floues selon la rugosité.
  float a = rug * rug;
  vec3 X = vec3(1, 0, 0), Y = vec3(0, 1, 0);
  // L'anisotropie : la tache s'allonge en travers des fibres.
  vec3 Rs = Rr;
  if (aniso > 0.01) {
    vec3 Br = normalize(cross(Nr, Tr));
    float k = dot(Rr - Nr * dot(Rr, Nr), Br);
    Rs = normalize(Rr - Br * k * aniso * 0.8);
  }
  float flou = a * 1.15 + 0.02;
  vec3 axCle = normalize(cross(Y, dCle)), ayCle = cross(dCle, axCle);
  vec3 axApp = normalize(cross(Y, dApp)), ayApp = cross(dApp, axApp);
  vec3 axC1 = normalize(cross(Y, dCj1)), ayC1 = cross(dCj1, axC1);
  vec3 axC2 = normalize(cross(Y, dCj2)), ayC2 = cross(dCj2, axC2);
  vec3 spec = vec3(0.0);
  spec += cCle * 9.0 * om * boite(Rs, dCle, axCle, ayCle, vec2(0.34, 0.42), flou);
  spec += cApp * 4.0 * boite(Rs, dApp, axApp, ayApp, vec2(0.12, 0.5), flou);
  spec += cCj * 7.0 * (boite(Rs, dCj1, axC1, ayC1, vec2(0.16, 0.5), flou) + boite(Rs, dCj2, axC2, ayC2, vec2(0.16, 0.5), flou));
  vec3 milieu = mix(vec3(0.03, 0.025, 0.022), vec3(0.14, 0.16, 0.18), smoothstep(-0.4, 0.7, Rr.y));
  spec += milieu * (1.0 - 0.5 * a);
  // Fresnel (approximation de Karis pour un environnement).
  float f0 = 0.04;
  vec4 c0 = vec4(-1.0, -0.0275, -0.572, 0.022), c1 = vec4(1.0, 0.0425, 1.04, -0.04);
  vec4 r = rug * c0 + c1;
  float a004 = min(r.x * r.x, exp2(-9.28 * NoV)) * r.x + r.y;
  vec2 ab = vec2(-1.04, 1.04) * a004 + r.zw;
  float fres = f0 * ab.x + ab.y;
  float occSpec = clamp(pow(NoV + ao, 1.5) - 1.0 + ao, 0.0, 1.0);

  vec3 couleur = albedo * dif * (1.0 - fres) + spec * fres * occSpec;

  // Le film humide : un second reflet, net.
  if (vernis > 0.01) {
    vec3 Ng = normalize(v_nor) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 Rv = reflect(-V, normalize(mix(Ng, N, 0.5))) * u_rig;
    float fv = 0.04 + 0.96 * pow(1.0 - max(dot(Ng, V), 0.0), 5.0);
    float fl = 0.05;
    vec3 sv = cCle * 9.0 * om * boite(Rv, dCle, axCle, ayCle, vec2(0.34, 0.42), fl) + cApp * 4.0 * boite(Rv, dApp, axApp, ayApp, vec2(0.12, 0.5), fl)
            + cCj * 7.0 * (boite(Rv, dCj1, axC1, ayC1, vec2(0.16, 0.5), fl) + boite(Rv, dCj2, axC2, ayC2, vec2(0.16, 0.5), fl));
    sv *= 0.55 + 0.45 * smoothstep(0.3, 0.75, bruit3(v_local * 85.0));
    couleur = couleur * (1.0 - fv * vernis * 0.6) + sv * fv * vernis * occSpec;
  }

  // Survol, cible qui pulse, sélection : un liseré de laiton.
  float pulse = v_vis.b * (0.55 + 0.45 * sin(u_temps * 5.0));
  float lisere = pow(1.0 - NoV, 2.6);
  couleur += v_teinte.rgb * v_teinte.a * (0.05 + 0.5 * pulse) * (0.4 + lum);
  couleur += u_laiton * lisere * (v_vis.g * 1.6 + v_vis.a * 2.4);
  couleur += u_laiton * v_vis.g * 0.035;

  couleur = neutre(couleur * u_exposition);
  couleur = pow(max(couleur, 0.0), vec3(1.0 / 2.2));
  couleur += (h21(gl_FragCoord.xy + fract(u_temps)) - 0.5) / 255.0;
  sortie = vec4(couleur * alpha, alpha);
}
#endif
#endif
`;

const SOCLE_SOMMETS = `#version 300 es
layout(location=0) in vec2 a_coin;
uniform mat4 u_vue;
uniform mat4 u_proj;
uniform float u_rayon;
out vec2 v_coin;
void main() {
  v_coin = a_coin;
  gl_Position = u_proj * u_vue * vec4(a_coin.x * u_rayon, -0.002, a_coin.y * u_rayon, 1.0);
}`;

const SOCLE_FRAGMENTS = `#version 300 es
precision highp float;
in vec2 v_coin;
uniform vec3 u_laiton;
out vec4 sortie;
void main() {
  float r = length(v_coin);
  if (r > 1.0) discard;
  float ombre = smoothstep(0.62, 0.0, r) * 0.6;
  float anneau = smoothstep(0.012, 0.0, abs(r - 0.82)) * 0.55 + smoothstep(0.006, 0.0, abs(r - 0.9)) * 0.3;
  float tic = step(0.92, fract(atan(v_coin.y, v_coin.x) / 6.28318 * 72.0)) * smoothstep(0.02, 0.0, abs(r - 0.86));
  vec3 c = u_laiton * (anneau + tic * 0.6);
  float a = max(ombre, anneau + tic * 0.6);
  sortie = vec4(c * a, a);
}`;

function compiler(gl: WebGL2RenderingContext, sommets: string, fragments: string, definitions = ""): WebGLProgram {
  const prog = gl.createProgram();
  const avec = (source: string) => source.replace("#version 300 es", `#version 300 es\n${definitions}`);
  for (const [type, source] of [
    [gl.VERTEX_SHADER, avec(sommets)],
    [gl.FRAGMENT_SHADER, avec(fragments)],
  ] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    gl.attachShader(prog, s);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "programme");
  return prog;
}

type Programme = { prog: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };
type Zones = { base: number; nb: number; droite: number };
type Groupe = { paquet: string; paire: boolean; lod: number; vao: WebGLVertexArrayObject; tampons: WebGLBuffer[]; nb: number; base: number; pieces: number; origine: V3; pas: number; zones?: Zones; pleins: number; partiels: number; propres: number };

/** La couche des zones qui ont leur propre structure (les tendons portés par les muscles). */
const COUCHE_DES_ZONES = "tendon";

const UNIFORMES = ["u_vue", "u_proj", "u_lumiere", "u_origine", "u_pas", "u_miroir", "u_base", "u_hauteur", "u_etat", "u_decal", "u_temps", "u_oeil", "u_rig", "u_base1", "u_base2", "u_surface", "u_chair", "u_sss", "u_opacite", "u_passe", "u_laiton", "u_carteOmbre", "u_ombres", "u_exposition", "u_humide", "u_zones", "u_opacite2", "u_parTissu"];

export type Reglages = {
  /** L'ombre portée de la lumière principale. */
  ombres: boolean;
  tailleOmbre: number;
  /** 1 : pièce fraîche (humide) ; 0,25 : pièce plastinée (satinée). */
  humide: number;
  exposition: number;
};

export class RenduReel {
  private gl: WebGL2RenderingContext;
  private principal: Programme;
  private profondeur: Programme;
  private choixProg: Programme;
  private socle: WebGLProgram;
  private socleVao: WebGLVertexArrayObject;
  private groupes = new Map<string, Groupe>();
  private etat: WebGLTexture;
  private decal: WebGLTexture;
  private donneesEtat = new Uint8Array(0);
  private donneesDecal = new Float32Array(0);
  private hauteur = 1;
  private nbStructures = 0;
  private etatSale = true;
  private decalSale = true;
  private choixFbo: WebGLFramebuffer | null = null;
  private choixTex: WebGLTexture | null = null;
  private choixProf: WebGLRenderbuffer | null = null;
  private tailleChoix = [0, 0];
  private ombreFbo: WebGLFramebuffer | null = null;
  private ombreTex: WebGLTexture | null = null;
  private ombreTaille = 0;
  readonly opacites: Record<string, number> = {};
  readonly matieres: Record<string, Matiere> = MATIERES;
  readonly reglages: Reglages = { ombres: true, tailleOmbre: 2048, humide: 1, exposition: 1 };
  laiton: V3 = [0.72, 0.5, 0.2];
  rayonSocle = 0.62;
  /** Le nombre de triangles envoyés à la dernière image (pour mesurer). */
  trianglesImage = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("webgl2");
    this.gl = gl;
    const prog = (definitions: string): Programme => {
      const p = compiler(gl, SOMMETS, FRAGMENTS, definitions);
      const u: Programme["u"] = {};
      for (const nom of UNIFORMES) u[nom] = gl.getUniformLocation(p, nom);
      return { prog: p, u };
    };
    this.principal = prog("");
    this.profondeur = prog("#define PROFONDEUR");
    this.choixProg = prog("#define CHOIX");
    this.socle = compiler(gl, SOCLE_SOMMETS, SOCLE_FRAGMENTS);
    this.etat = gl.createTexture()!;
    this.decal = gl.createTexture()!;
    this.socleVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.socleVao);
    const coins = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, coins);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.structures(1);
  }

  /** Réserve l'état de `nb` structures (une fois la liste connue). */
  structures(nb: number) {
    this.nbStructures = nb;
    this.hauteur = Math.max(1, Math.ceil(nb / LARGEUR_ETAT));
    this.donneesEtat = new Uint8Array(LARGEUR_ETAT * this.hauteur * RANGS_ETAT * 4);
    this.donneesDecal = new Float32Array(LARGEUR_ETAT * this.hauteur * 4);
    const l = LARGEUR_ETAT * this.hauteur * 4;
    for (let i = 0; i < nb; i++) this.donneesEtat[l + i * 4] = 255;
    this.etatSale = this.decalSale = true;
  }

  /** Monte un paquet sur la carte graphique (ou remplace son niveau de détail). `base` : le numéro de sa première structure. */
  installer(p: Paquet, base: number, zones?: Zones) {
    const gl = this.gl;
    const cle = `${p.paquet}/${p.paire ? "p" : "i"}`;
    const ancien = this.groupes.get(cle);
    if (ancien) {
      gl.deleteVertexArray(ancien.vao);
      for (const t of ancien.tampons) gl.deleteBuffer(t);
    }
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const vb = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, p.tampon, gl.STATIC_DRAW);
    const o = OCTETS_PAR_SOMMET;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.UNSIGNED_SHORT, false, o, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.UNSIGNED_SHORT, false, o, 6);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.SHORT, true, o, 8);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, o, 12);
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 4, gl.UNSIGNED_BYTE, true, o, 16);
    gl.enableVertexAttribArray(5);
    gl.vertexAttribPointer(5, 4, gl.UNSIGNED_BYTE, false, o, 20);
    const ib = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, p.indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    this.groupes.set(cle, { paquet: p.paquet, paire: p.paire, lod: p.lod, vao, tampons: [vb, ib], nb: p.indices.length, base, pieces: p.pieces.length, origine: p.origine, pas: p.pas, zones, pleins: 1, partiels: 0, propres: 0 });
    if (this.opacites[p.paquet] === undefined) this.opacites[p.paquet] = 1;
    this.etatSale = true;
  }

  niveau(paquet: string, paire: boolean): number | null {
    return this.groupes.get(`${paquet}/${paire ? "p" : "i"}`)?.lod ?? null;
  }

  /** L'état d'une structure : teinte [r, g, b, force] (0-255), visibilité (0-1), survol, pulsation, sélection, couleur propre. */
  definir(id: number, e: { teinte?: [number, number, number, number]; visible?: number; survol?: boolean; pulse?: boolean; choisi?: boolean; propre?: [number, number, number, number]; coucheDesZones?: boolean }) {
    if (id < 0 || id >= this.nbStructures) return;
    const d = this.donneesEtat;
    const l = LARGEUR_ETAT * this.hauteur * 4;
    if (e.teinte) d.set(e.teinte, id * 4);
    if (e.visible !== undefined) d[l + id * 4] = Math.round(Math.max(0, Math.min(1, e.visible)) * 255);
    if (e.survol !== undefined) d[l + id * 4 + 1] = e.survol ? 255 : 0;
    if (e.pulse !== undefined) d[l + id * 4 + 2] = e.pulse ? 255 : 0;
    if (e.choisi !== undefined) d[l + id * 4 + 3] = e.choisi ? 255 : 0;
    if (e.propre) d.set(e.propre, 2 * l + id * 4);
    if (e.coucheDesZones !== undefined) d[3 * l + id * 4] = e.coucheDesZones ? 255 : 0;
    this.etatSale = true;
  }

  /** Déplace une structure (dissection, vue éclatée), en mètres. */
  decaler(id: number, v: V3) {
    if (id < 0 || id >= this.nbStructures) return;
    this.donneesDecal.set(v, id * 4);
    this.decalSale = true;
  }

  visibilite(id: number): number {
    return id < 0 || id >= this.nbStructures ? 0 : this.donneesEtat[LARGEUR_ETAT * this.hauteur * 4 + id * 4] / 255;
  }

  /** Pour chaque groupe : combien de ses structures sont pleines, à demi visibles, ou des zones de l'autre couche. */
  private compter() {
    const d = this.donneesEtat;
    const l = LARGEUR_ETAT * this.hauteur * 4;
    for (const g of this.groupes.values()) {
      g.pleins = g.partiels = g.propres = 0;
      const plages: [number, number][] = [[g.base, g.pieces * (g.paire ? 2 : 1)]];
      if (g.zones) plages.push([g.zones.base, g.zones.nb * 3]);
      for (const [debut, nombre] of plages)
        for (let id = debut; id < debut + nombre; id++) {
          const v = d[l + id * 4];
          if (v >= 252) g.pleins++;
          else if (v > 5) g.partiels++;
          if (v > 5 && d[3 * l + id * 4] > 127) g.propres++;
        }
    }
  }

  private televerser() {
    const gl = this.gl;
    if (this.etatSale) {
      this.compter();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.etat);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, LARGEUR_ETAT, this.hauteur * RANGS_ETAT, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.donneesEtat);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      this.etatSale = false;
    }
    if (this.decalSale) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.decal);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, LARGEUR_ETAT, this.hauteur, 0, gl.RGBA, gl.FLOAT, this.donneesDecal);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.activeTexture(gl.TEXTURE0);
      this.decalSale = false;
    }
  }

  redimensionner(largeur: number, hauteur: number) {
    if (this.canvas.width !== largeur || this.canvas.height !== hauteur) {
      this.canvas.width = largeur;
      this.canvas.height = hauteur;
    }
  }

  /** Le repère du studio : les lumières tournent avec le regard (x à droite, y en haut, z vers l'objectif). */
  private rig(yaw: number): Float32Array {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    return new Float32Array([c, 0, -s, 0, 1, 0, s, 0, c]);
  }

  /** La matrice de la lumière principale (orthographique, cadrée sur le corps). */
  private matriceLumiere(yaw: number): Float32Array {
    const d = [-0.52, 0.6, 0.6];
    const n = Math.hypot(d[0], d[1], d[2]);
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    // direction vers la lumière, dans le monde
    const L: V3 = [(c * d[0] + s * d[2]) / n, d[1] / n, (-s * d[0] + c * d[2]) / n];
    const centre: V3 = [0, 0.88, 0];
    const z: V3 = L;
    let x: V3 = [z[2], 0, -z[0]];
    const lx = Math.hypot(x[0], x[1], x[2]) || 1;
    x = [x[0] / lx, x[1] / lx, x[2] / lx];
    const y: V3 = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    const r = 1.12; // demi-côté de la boîte éclairée
    const loin = 2.4;
    const oeil: V3 = [centre[0] + L[0] * loin * 0.5, centre[1] + L[1] * loin * 0.5, centre[2] + L[2] * loin * 0.5];
    const m = new Float32Array(16);
    // projection orthographique × vue (colonnes d'abord)
    const vx = [x[0] / r, y[0] / r, (-2 * z[0]) / loin];
    const vy = [x[1] / r, y[1] / r, (-2 * z[1]) / loin];
    const vz = [x[2] / r, y[2] / r, (-2 * z[2]) / loin];
    const dot = (a: V3) => a[0] * oeil[0] + a[1] * oeil[1] + a[2] * oeil[2];
    m[0] = vx[0]; m[1] = vx[1]; m[2] = vx[2];
    m[4] = vy[0]; m[5] = vy[1]; m[6] = vy[2];
    m[8] = vz[0]; m[9] = vz[1]; m[10] = vz[2];
    m[12] = -dot(x) / r;
    m[13] = -dot(y) / r;
    m[14] = (2 * dot(z)) / loin - 1;
    m[15] = 1;
    return m;
  }

  private passe(pr: Programme, camera: Camera, temps: number, passe: number, lumiere: Float32Array, pourOmbre = false, pourChoix = false) {
    const gl = this.gl;
    const u = pr.u;
    gl.useProgram(pr.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.etat);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.decal);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, pourOmbre ? null : this.ombreTex);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(u.u_etat, 0);
    gl.uniform1i(u.u_decal, 1);
    gl.uniform1i(u.u_carteOmbre, 2);
    if (pourOmbre) {
      gl.uniformMatrix4fv(u.u_vue, false, lumiere);
      gl.uniformMatrix4fv(u.u_proj, false, IDENTITE);
    } else {
      gl.uniformMatrix4fv(u.u_vue, false, camera.vue);
      gl.uniformMatrix4fv(u.u_proj, false, camera.proj);
    }
    gl.uniformMatrix4fv(u.u_lumiere, false, lumiere);
    gl.uniform1i(u.u_hauteur, this.hauteur);
    gl.uniform1f(u.u_temps, temps);
    gl.uniform1i(u.u_passe, passe);
    gl.uniform3fv(u.u_laiton, this.laiton);
    gl.uniform3fv(u.u_oeil, camera.oeil);
    gl.uniformMatrix3fv(u.u_rig, false, this.rig(camera.yaw));
    gl.uniform1f(u.u_ombres, this.reglages.ombres && this.ombreTex ? 1 : 0);
    gl.uniform1f(u.u_exposition, this.reglages.exposition);
    gl.uniform1f(u.u_humide, this.reglages.humide);
    const op2 = this.opacites[COUCHE_DES_ZONES] ?? 0;
    for (const nom of ORDRE) {
      const op = this.opacites[nom] ?? 0;
      const m = this.matieres[nom] ?? this.matieres.viscere;
      const sec = 1 - (1 - this.reglages.humide) * 0.5;
      gl.uniform3fv(u.u_base1, m.base);
      gl.uniform3fv(u.u_base2, m.base2);
      gl.uniform4f(u.u_surface, Math.min(1, m.rug / sec), Math.min(1, m.rug2 / sec), m.vernis, m.aniso);
      gl.uniform4f(u.u_chair, m.sss, m.fibres, m.grain, 0);
      gl.uniform3fv(u.u_sss, m.sssTeinte);
      gl.uniform1f(u.u_opacite, op);
      gl.uniform1f(u.u_opacite2, op2);
      gl.uniform1f(u.u_parTissu, nom === "muscle" ? 1 : 0);
      // Les surfaces d'insertion sont posées sur l'os : on les avance d'un rien pour qu'elles ne s'y mêlent pas.
      const posee = nom === "insertion" && !pourOmbre;
      if (posee) {
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(-2, -6);
      }
      for (const paire of [true, false]) {
        const g = this.groupes.get(`${nom}/${paire ? "p" : "i"}`);
        if (!g) continue;
        // Ne dessiner un groupe que s'il a quelque chose à montrer dans cette passe.
        const zonesAutres = g.propres > 0;
        const haut = zonesAutres ? Math.max(op, op2) : op;
        const bas = zonesAutres ? Math.min(op, op2) : op;
        if (haut < 0.02 || g.pleins + g.partiels === 0) continue;
        if (passe === 0) {
          if (haut < (pourOmbre ? 0.6 : pourChoix ? 0.5 : 0.985)) continue;
          if (!pourOmbre && !pourChoix && g.pleins === 0) continue;
        } else if (bas >= 0.985 && g.partiels === 0) continue;
        gl.uniform3fv(u.u_origine, g.origine);
        gl.uniform1f(u.u_pas, g.pas);
        gl.bindVertexArray(g.vao);
        gl.uniform1f(u.u_miroir, 1);
        gl.uniform1i(u.u_base, g.base);
        gl.uniform3i(u.u_zones, g.zones ? g.zones.base : 0, g.zones ? g.zones.nb : 0, g.zones ? 1 : 0);
        gl.frontFace(gl.CCW);
        gl.drawElements(gl.TRIANGLES, g.nb, gl.UNSIGNED_INT, 0);
        this.trianglesImage += g.nb / 3;
        if (g.paire) {
          gl.uniform1f(u.u_miroir, -1);
          gl.uniform1i(u.u_base, g.base + g.pieces);
          gl.uniform3i(u.u_zones, g.zones ? g.zones.base + g.zones.droite : 0, g.zones ? g.zones.nb : 0, g.zones ? 1 : 0);
          gl.frontFace(gl.CW);
          gl.drawElements(gl.TRIANGLES, g.nb, gl.UNSIGNED_INT, 0);
          gl.frontFace(gl.CCW);
          this.trianglesImage += g.nb / 3;
        }
      }
      if (posee) gl.disable(gl.POLYGON_OFFSET_FILL);
    }
    gl.bindVertexArray(null);
  }

  private preparerOmbre() {
    const gl = this.gl;
    const t = this.reglages.tailleOmbre;
    if (this.ombreTex && this.ombreTaille === t) return;
    if (this.ombreTex) gl.deleteTexture(this.ombreTex);
    if (this.ombreFbo) gl.deleteFramebuffer(this.ombreFbo);
    this.ombreTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.ombreTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, t, t, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    this.ombreFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.ombreFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.ombreTex, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.activeTexture(gl.TEXTURE0);
    this.ombreTaille = t;
  }

  dessiner(camera: Camera, temps: number) {
    const gl = this.gl;
    this.trianglesImage = 0;
    this.televerser();
    const lumiere = this.matriceLumiere(camera.yaw);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    // L'ombre de la lumière principale.
    if (this.reglages.ombres) {
      this.preparerOmbre();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.ombreFbo);
      gl.viewport(0, 0, this.ombreTaille, this.ombreTaille);
      gl.clearDepth(1);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(2, 4);
      gl.disable(gl.CULL_FACE);
      this.passe(this.profondeur, camera, temps, 0, lumiere, true);
      gl.enable(gl.CULL_FACE);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Le socle : une ombre et deux anneaux de laiton sous les pieds.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.useProgram(this.socle);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.socle, "u_vue"), false, camera.vue);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.socle, "u_proj"), false, camera.proj);
    gl.uniform1f(gl.getUniformLocation(this.socle, "u_rayon"), this.rayonSocle);
    gl.uniform3fv(gl.getUniformLocation(this.socle, "u_laiton"), [0.86, 0.68, 0.38]);
    gl.bindVertexArray(this.socleVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
    // Ce qui est plein, puis ce qui est translucide (sans écrire la profondeur).
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    this.passe(this.principal, camera, temps, 0, lumiere);
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    this.passe(this.principal, camera, temps, 1, lumiere);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }

  /** La structure sous le point (pixels de l'image), ou -1. */
  choisir(camera: Camera, x: number, y: number): number {
    const gl = this.gl;
    const [l, h] = [this.canvas.width, this.canvas.height];
    if (!this.choixFbo || this.tailleChoix[0] !== l || this.tailleChoix[1] !== h) {
      if (this.choixFbo) gl.deleteFramebuffer(this.choixFbo);
      if (this.choixTex) gl.deleteTexture(this.choixTex);
      if (this.choixProf) gl.deleteRenderbuffer(this.choixProf);
      this.choixFbo = gl.createFramebuffer();
      this.choixTex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, this.choixTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, l, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      this.choixProf = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.choixProf);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, l, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.choixFbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.choixTex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.choixProf);
      gl.activeTexture(gl.TEXTURE0);
      this.tailleChoix = [l, h];
    }
    this.televerser();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.choixFbo);
    gl.viewport(0, 0, l, h);
    // On ne dessine que le pixel visé : la passe ne coûte presque rien, même sur une petite carte graphique.
    const px = Math.max(0, Math.min(l - 1, Math.round(x)));
    const py = Math.max(0, Math.min(h - 1, Math.round(h - y - 1)));
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(px, py, 1, 1);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
    // Seules les couches pleines se touchent (les fantômes laissent passer le doigt).
    const sauve = { ...this.opacites };
    for (const c of Object.keys(this.opacites)) this.opacites[c] = this.opacites[c] < 0.5 ? 0 : 1;
    this.passe(this.choixProg, camera, 0, 0, IDENTITE, false, true);
    Object.assign(this.opacites, sauve);
    const pixel = new Uint8Array(4);
    gl.readPixels(px, py, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    gl.disable(gl.SCISSOR_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return pixel[0] + pixel[1] * 256 + pixel[2] * 65536 - 1;
  }

  /** Libère les tampons (la toile et son contexte partent avec l'élément). */
  detruire() {
    const gl = this.gl;
    for (const g of this.groupes.values()) {
      gl.deleteVertexArray(g.vao);
      for (const t of g.tampons) gl.deleteBuffer(t);
    }
    this.groupes.clear();
  }
}

const IDENTITE = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
