"use client";

import type { M4, V3 } from "@/lib/corps/vec";

/*
 * L'Écorché — le moteur de rendu (WebGL 2, sans bibliothèque).
 *
 *   • Une couche = un seul tampon (os, muscles, tendons, artères) : quatre dessins par image, même sur téléphone.
 *     Chaque sommet porte le numéro de sa structure ; l'état de chaque structure (teinte, visibilité,
 *     survol, pulsation, sélection) vit dans une petite texture, lue par le shader.
 *   • Les lumières suivent la caméra : la figure est toujours bien éclairée du côté qu'on regarde.
 *   • Les muscles ont des stries (le sens des fibres), les tendons un éclat nacré, les os un grain d'ivoire.
 *   • Le toucher : on redessine les numéros dans une image cachée et on lit le pixel sous le doigt.
 *   • Rien ne se dessine à vide : le composant demande une image seulement quand quelque chose change.
 */

export type Couche = "os" | "muscle" | "tendon" | "artere";
export const COUCHES: Couche[] = ["os", "muscle", "tendon", "artere"];

export type TamponCouche = { positions: Float32Array; normales: Float32Array; uv: Float32Array; ids: Float32Array; indices: Uint32Array };
export type Camera = { vue: M4; proj: M4; oeil: V3 };

type Materiau = { couleur: [number, number, number]; couleur2: [number, number, number]; spec: number; brillance: number; fibres: number; frequence: number; grain: number };

const MATERIAUX: Record<Couche, Materiau> = {
  os: { couleur: [0.93, 0.88, 0.78], couleur2: [0.78, 0.71, 0.58], spec: 0.22, brillance: 18, fibres: 0.0, frequence: 0, grain: 0.55 },
  muscle: { couleur: [0.58, 0.042, 0.048], couleur2: [0.3, 0.013, 0.02], spec: 0.38, brillance: 34, fibres: 0.55, frequence: 21, grain: 0.15 },
  tendon: { couleur: [0.93, 0.92, 0.88], couleur2: [0.74, 0.76, 0.78], spec: 0.75, brillance: 70, fibres: 0.35, frequence: 38, grain: 0.1 },
  artere: { couleur: [0.86, 0.1, 0.12], couleur2: [0.5, 0.02, 0.05], spec: 0.8, brillance: 90, fibres: 0.0, frequence: 0, grain: 0.05 },
};

const SOMMETS = `#version 300 es
layout(location=0) in vec3 a_pos;
layout(location=1) in vec3 a_nor;
layout(location=2) in float a_id;
layout(location=3) in vec2 a_uv;
uniform mat4 u_vue;
uniform mat4 u_proj;
uniform sampler2D u_etat;
uniform float u_temps;
out vec3 v_posV;
out vec3 v_norV;
out vec2 v_uv;
out vec4 v_teinte;
out vec4 v_vis;
flat out float v_id;
void main() {
  int id = int(a_id + 0.5);
  v_teinte = texelFetch(u_etat, ivec2(id, 0), 0);
  v_vis = texelFetch(u_etat, ivec2(id, 1), 0);
  vec3 p = a_pos + a_nor * (v_vis.g * 0.0012 + v_vis.b * 0.0018 * (0.5 + 0.5 * sin(u_temps * 5.0)));
  vec4 pv = u_vue * vec4(p, 1.0);
  v_posV = pv.xyz;
  v_norV = mat3(u_vue) * a_nor;
  v_uv = a_uv;
  v_id = a_id;
  gl_Position = u_proj * pv;
}`;

const FRAGMENTS = `#version 300 es
precision highp float;
in vec3 v_posV;
in vec3 v_norV;
in vec2 v_uv;
in vec4 v_teinte;
in vec4 v_vis;
flat in float v_id;
uniform vec3 u_couleur;
uniform vec3 u_couleur2;
uniform float u_spec;
uniform float u_brillance;
uniform float u_fibres;
uniform float u_frequence;
uniform float u_grain;
uniform float u_opacite;
uniform float u_temps;
uniform int u_passe;
uniform vec3 u_laiton;
out vec4 sortie;

float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float bruit(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), u.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), u.x), u.y);
}

void main() {
  float alpha = u_opacite * v_vis.r;
  if (alpha < 0.02) discard;
  if (u_passe == 0 && alpha < 0.985) discard;
  if (u_passe == 1 && alpha >= 0.985) discard;
  if (u_passe == 2) {
    // Les fantômes (à peine visibles) ne se touchent pas.
    if (v_vis.r < 0.5) discard;
    float n = v_id + 1.0;
    sortie = vec4(mod(n, 256.0) / 255.0, mod(floor(n / 256.0), 256.0) / 255.0, floor(n / 65536.0) / 255.0, 1.0);
    return;
  }
  vec3 N = normalize(v_norV);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(-v_posV);

  // La matière : stries des fibres, grain de l'os, nacre du tendon.
  float x = v_uv.y * u_frequence;
  float strie = 0.5 + 0.5 * sin(x * 6.28318 + bruit(v_uv * vec2(4.0, 30.0)) * 2.4);
  strie = smoothstep(0.15, 0.95, strie);
  // De loin, les stries deviennent plus fines qu'un pixel : on les fond (pas de moiré).
  strie = mix(strie, 0.62, smoothstep(0.22, 0.6, fwidth(x)));
  strie = mix(1.0, strie, u_fibres);
  float grain = mix(1.0, 0.82 + 0.18 * bruit(v_uv * vec2(40.0, 90.0)), u_grain);
  vec3 base = mix(u_couleur2, u_couleur, strie) * grain;
  // La teinte garde le relief de la matière (stries, grain) : une lumière posée dessus, pas une peinture.
  base = mix(base, v_teinte.rgb * (0.62 + 0.38 * strie) * grain, v_teinte.a * 0.74);

  // Trois lumières qui suivent le regard, un ciel et un sol.
  vec3 cle = normalize(vec3(-0.45, 0.62, 0.65));
  vec3 appoint = normalize(vec3(0.7, 0.15, 0.4));
  vec3 contre = normalize(vec3(0.15, 0.35, -0.95));
  float d1 = max(dot(N, cle), 0.0);
  float d2 = max(dot(N, appoint), 0.0);
  float d3 = max(dot(N, contre), 0.0);
  vec3 ciel = mix(vec3(0.16, 0.13, 0.12), vec3(0.42, 0.45, 0.47), N.y * 0.5 + 0.5);
  vec3 lum = ciel * 0.85 + vec3(1.0, 0.95, 0.88) * d1 * 0.95 + vec3(0.55, 0.68, 0.78) * d2 * 0.32;
  vec3 c = base * lum;
  vec3 Hk = normalize(cle + V);
  float spec = pow(max(dot(N, Hk), 0.0), u_brillance) * u_spec;
  c += vec3(1.0, 0.97, 0.92) * spec * (0.6 + 0.4 * strie);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  c += u_laiton * d3 * 0.35 + vec3(0.55, 0.62, 0.66) * fres * 0.18;

  // Survol, cible qui pulse, sélection : un liseré de lumière.
  float pulse = v_vis.b * (0.55 + 0.45 * sin(u_temps * 5.0));
  c += v_teinte.rgb * v_teinte.a * (0.06 + 0.32 * pulse);
  c += u_laiton * fres * (v_vis.g * 1.1 + v_vis.a * 1.6);
  c += u_laiton * v_vis.g * 0.06;

  // Les teintes se travaillent en linéaire ; l'écran attend du sRVB.
  c = c / (1.0 + c * 0.18);
  c = pow(c, vec3(1.0 / 1.9));
  sortie = vec4(c * alpha, alpha);
}`;

const SOCLE_SOMMETS = `#version 300 es
layout(location=0) in vec2 a_coin;
uniform mat4 u_vue;
uniform mat4 u_proj;
uniform float u_rayon;
out vec2 v_coin;
void main() {
  v_coin = a_coin;
  gl_Position = u_proj * u_vue * vec4(a_coin.x * u_rayon, -0.001, a_coin.y * u_rayon, 1.0);
}`;

const SOCLE_FRAGMENTS = `#version 300 es
precision highp float;
in vec2 v_coin;
uniform vec3 u_laiton;
uniform float u_temps;
out vec4 sortie;
void main() {
  float r = length(v_coin);
  if (r > 1.0) discard;
  float ombre = smoothstep(0.62, 0.0, r) * 0.55;
  float anneau = smoothstep(0.012, 0.0, abs(r - 0.82)) * 0.55 + smoothstep(0.006, 0.0, abs(r - 0.9)) * 0.3;
  float tic = step(0.92, fract(atan(v_coin.y, v_coin.x) / 6.28318 * 72.0)) * smoothstep(0.02, 0.0, abs(r - 0.86));
  vec3 c = u_laiton * (anneau + tic * 0.6);
  float a = max(ombre, anneau + tic * 0.6);
  sortie = vec4(c * a + vec3(0.0) * ombre, a);
}`;

function compiler(gl: WebGL2RenderingContext, sommets: string, fragments: string): WebGLProgram {
  const prog = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, sommets],
    [gl.FRAGMENT_SHADER, fragments],
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

type CoucheGL = { vao: WebGLVertexArrayObject; nb: number; tampons: WebGLBuffer[] };

export class Rendu {
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private socle: WebGLProgram;
  private socleVao: WebGLVertexArrayObject;
  private couches = new Map<Couche, CoucheGL>();
  private etat: WebGLTexture;
  private donneesEtat = new Uint8Array(0);
  private nbStructures = 0;
  private etatSale = true;
  private choixFbo: WebGLFramebuffer | null = null;
  private choixTex: WebGLTexture | null = null;
  private choixProf: WebGLRenderbuffer | null = null;
  private tailleChoix = [0, 0];
  private uniformes: Record<string, WebGLUniformLocation | null> = {};
  readonly opacites: Record<Couche, number> = { os: 1, muscle: 1, tendon: 1, artere: 1 };
  laiton: [number, number, number] = [0.86, 0.68, 0.38];
  rayonSocle = 0.62;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: "high-performance" });
    if (!gl) throw new Error("webgl2");
    this.gl = gl;
    this.prog = compiler(gl, SOMMETS, FRAGMENTS);
    this.socle = compiler(gl, SOCLE_SOMMETS, SOCLE_FRAGMENTS);
    for (const nom of ["u_vue", "u_proj", "u_etat", "u_temps", "u_couleur", "u_couleur2", "u_spec", "u_brillance", "u_fibres", "u_frequence", "u_grain", "u_opacite", "u_passe", "u_laiton"]) this.uniformes[nom] = gl.getUniformLocation(this.prog, nom);
    this.etat = gl.createTexture()!;
    this.socleVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.socleVao);
    const coins = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, coins);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  /** Les tampons des quatre couches, et le nombre de structures (pour la texture d'état). */
  charger(couches: Partial<Record<Couche, TamponCouche>>, nbStructures: number) {
    const gl = this.gl;
    for (const c of this.couches.values()) {
      gl.deleteVertexArray(c.vao);
      for (const t of c.tampons) gl.deleteBuffer(t);
    }
    this.couches.clear();
    for (const [nom, t] of Object.entries(couches) as [Couche, TamponCouche][]) {
      const vao = gl.createVertexArray()!;
      gl.bindVertexArray(vao);
      const tampons: WebGLBuffer[] = [];
      const attr = (loc: number, donnees: Float32Array, taille: number) => {
        const b = gl.createBuffer()!;
        tampons.push(b);
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, donnees, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, taille, gl.FLOAT, false, 0, 0);
      };
      attr(0, t.positions, 3);
      attr(1, t.normales, 3);
      attr(2, t.ids, 1);
      attr(3, t.uv, 2);
      const ib = gl.createBuffer()!;
      tampons.push(ib);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, t.indices, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      this.couches.set(nom, { vao, nb: t.indices.length, tampons });
    }
    this.nbStructures = nbStructures;
    this.donneesEtat = new Uint8Array(Math.max(1, nbStructures) * 2 * 4);
    for (let i = 0; i < nbStructures; i++) this.donneesEtat[(nbStructures + i) * 4] = 255;
    this.etatSale = true;
  }

  /** L'état d'une structure : teinte [r, g, b, force] (0-255), visibilité (0-1), survol, pulsation, sélection. */
  definir(id: number, e: { teinte?: [number, number, number, number]; visible?: number; survol?: boolean; pulse?: boolean; choisi?: boolean }) {
    if (id < 0 || id >= this.nbStructures) return;
    const d = this.donneesEtat;
    if (e.teinte) d.set(e.teinte, id * 4);
    const l = (this.nbStructures + id) * 4;
    if (e.visible !== undefined) d[l] = Math.round(Math.max(0, Math.min(1, e.visible)) * 255);
    if (e.survol !== undefined) d[l + 1] = e.survol ? 255 : 0;
    if (e.pulse !== undefined) d[l + 2] = e.pulse ? 255 : 0;
    if (e.choisi !== undefined) d[l + 3] = e.choisi ? 255 : 0;
    this.etatSale = true;
  }

  visibilite(id: number): number {
    return id < 0 || id >= this.nbStructures ? 0 : this.donneesEtat[(this.nbStructures + id) * 4] / 255;
  }

  private televerserEtat() {
    if (!this.etatSale) return;
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.etat);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, Math.max(1, this.nbStructures), 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.donneesEtat);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    this.etatSale = false;
  }

  redimensionner(largeur: number, hauteur: number) {
    if (this.canvas.width !== largeur || this.canvas.height !== hauteur) {
      this.canvas.width = largeur;
      this.canvas.height = hauteur;
    }
  }

  private passe(camera: Camera, temps: number, passe: 0 | 1 | 2) {
    const gl = this.gl;
    const u = this.uniformes;
    gl.useProgram(this.prog);
    // La texture d'état, toujours sur l'unité 0 (celle de l'image du toucher ne doit jamais s'y glisser).
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.etat);
    gl.uniformMatrix4fv(u.u_vue, false, camera.vue);
    gl.uniformMatrix4fv(u.u_proj, false, camera.proj);
    gl.uniform1i(u.u_etat, 0);
    gl.uniform1f(u.u_temps, temps);
    gl.uniform1i(u.u_passe, passe);
    gl.uniform3fv(u.u_laiton, this.laiton);
    // Les os d'abord (au fond), puis ce qui les couvre.
    for (const nom of COUCHES) {
      const c = this.couches.get(nom);
      const op = this.opacites[nom];
      if (!c || op < 0.02) continue;
      if (passe === 0 && op < 0.985) continue;
      const m = MATERIAUX[nom];
      gl.uniform3fv(u.u_couleur, m.couleur);
      gl.uniform3fv(u.u_couleur2, m.couleur2);
      gl.uniform1f(u.u_spec, m.spec);
      gl.uniform1f(u.u_brillance, m.brillance);
      gl.uniform1f(u.u_fibres, m.fibres);
      gl.uniform1f(u.u_frequence, m.frequence);
      gl.uniform1f(u.u_grain, m.grain);
      gl.uniform1f(u.u_opacite, op);
      gl.bindVertexArray(c.vao);
      gl.drawElements(gl.TRIANGLES, c.nb, gl.UNSIGNED_INT, 0);
    }
    gl.bindVertexArray(null);
  }

  dessiner(camera: Camera, temps: number) {
    const gl = this.gl;
    this.televerserEtat();
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    // Le socle : une ombre et deux anneaux de laiton sous les pieds.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.useProgram(this.socle);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.socle, "u_vue"), false, camera.vue);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.socle, "u_proj"), false, camera.proj);
    gl.uniform1f(gl.getUniformLocation(this.socle, "u_rayon"), this.rayonSocle);
    gl.uniform3fv(gl.getUniformLocation(this.socle, "u_laiton"), this.laiton);
    gl.bindVertexArray(this.socleVao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
    // Ce qui est plein, puis ce qui est translucide (sans écrire la profondeur).
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    this.passe(camera, temps, 0);
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    this.passe(camera, temps, 1);
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
      gl.activeTexture(gl.TEXTURE1);
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
    this.televerserEtat();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.choixFbo);
    gl.viewport(0, 0, l, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
    // Les structures à peine visibles (fantômes) ne se touchent pas : seules les pleines comptent.
    const sauve = { ...this.opacites };
    for (const c of COUCHES) if (this.opacites[c] < 0.5) this.opacites[c] = 0;
    this.passe(camera, 0, 2);
    Object.assign(this.opacites, sauve);
    const pixel = new Uint8Array(4);
    gl.readPixels(Math.round(x), Math.round(h - y - 1), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const n = pixel[0] + pixel[1] * 256 + pixel[2] * 65536;
    return n - 1;
  }

  /** Libère les tampons (la toile et son contexte partent avec l'élément). */
  detruire() {
    const gl = this.gl;
    for (const c of this.couches.values()) {
      gl.deleteVertexArray(c.vao);
      for (const t of c.tampons) gl.deleteBuffer(t);
    }
    this.couches.clear();
  }
}
