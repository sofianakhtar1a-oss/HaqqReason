/*
 * L'Écorché — lancer de rayons pour la chaîne de préparation (occlusion ambiante précalculée, exposition, épaisseur).
 * Un arbre de boîtes englobantes sur les triangles qui font obstacle, puis, pour chaque point demandé, des rayons
 * tirés dans l'hémisphère de sa normale.
 *
 *   gcc -O3 -march=native -fopenmp -o rayons rayons.c -lm
 *   rayons <obstacles.bin> <points.bin> <sortie.bin> <rayons par point> <portée en m> <mode>
 *     obstacles.bin : int32 n, puis n × 9 float32 (trois sommets par triangle)
 *     points.bin    : int32 n, puis n × 6 float32 (position, normale)
 *     sortie.bin    : n float32
 *     mode 0 : occlusion ambiante (1 : dégagé, 0 : enfoui), un obstacle proche pèse plus qu'un lointain
 *     mode 1 : exposition (la part des rayons qui s'échappent sans rien toucher)
 *     mode 2 : épaisseur (la distance, vers l'intérieur, jusqu'à la paroi d'en face ; portée si rien)
 */
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#ifdef _OPENMP
#include <omp.h>
#endif

typedef struct { float x, y, z; } V;
typedef struct { V mn, mx; int gauche, droite, debut, nb; } Noeud;

static V *A, *E1, *E2; /* un sommet et deux arêtes par triangle */
static V *Cn;          /* centres */
static int *ordre;
static Noeud *noeuds;
static int nbNoeuds = 0;

static inline V sub(V a, V b) { V r = {a.x - b.x, a.y - b.y, a.z - b.z}; return r; }
static inline V add(V a, V b) { V r = {a.x + b.x, a.y + b.y, a.z + b.z}; return r; }
static inline V mul(V a, float k) { V r = {a.x * k, a.y * k, a.z * k}; return r; }
static inline float dot(V a, V b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
static inline V cross(V a, V b) { V r = {a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x}; return r; }
static inline float fmin3(float a, float b, float c) { return fminf(a, fminf(b, c)); }
static inline float fmax3(float a, float b, float c) { return fmaxf(a, fmaxf(b, c)); }

static int axeTri;
static int comparer(const void *pa, const void *pb) {
  int a = *(const int *)pa, b = *(const int *)pb;
  float ca = axeTri == 0 ? Cn[a].x : axeTri == 1 ? Cn[a].y : Cn[a].z;
  float cb = axeTri == 0 ? Cn[b].x : axeTri == 1 ? Cn[b].y : Cn[b].z;
  return ca < cb ? -1 : ca > cb ? 1 : 0;
}

static int construire(int debut, int nb) {
  int id = nbNoeuds++;
  Noeud *n = &noeuds[id];
  V mn = {1e30f, 1e30f, 1e30f}, mx = {-1e30f, -1e30f, -1e30f}, cmn = mn, cmx = mx;
  for (int i = debut; i < debut + nb; i++) {
    int t = ordre[i];
    V a = A[t], b = add(A[t], E1[t]), c = add(A[t], E2[t]);
    mn.x = fminf(mn.x, fmin3(a.x, b.x, c.x)); mn.y = fminf(mn.y, fmin3(a.y, b.y, c.y)); mn.z = fminf(mn.z, fmin3(a.z, b.z, c.z));
    mx.x = fmaxf(mx.x, fmax3(a.x, b.x, c.x)); mx.y = fmaxf(mx.y, fmax3(a.y, b.y, c.y)); mx.z = fmaxf(mx.z, fmax3(a.z, b.z, c.z));
    cmn.x = fminf(cmn.x, Cn[t].x); cmn.y = fminf(cmn.y, Cn[t].y); cmn.z = fminf(cmn.z, Cn[t].z);
    cmx.x = fmaxf(cmx.x, Cn[t].x); cmx.y = fmaxf(cmx.y, Cn[t].y); cmx.z = fmaxf(cmx.z, Cn[t].z);
  }
  n->mn = mn; n->mx = mx; n->debut = debut; n->nb = nb; n->gauche = n->droite = -1;
  if (nb <= 4) return id;
  V e = sub(cmx, cmn);
  int axe = e.x > e.y ? (e.x > e.z ? 0 : 2) : (e.y > e.z ? 1 : 2);
  float etendue = axe == 0 ? e.x : axe == 1 ? e.y : e.z;
  if (etendue < 1e-9f) return id;
  /* Coupe à la médiane : un tri partiel par seaux suffirait, mais le tri complet reste rapide ici. */
  axeTri = axe;
  qsort(ordre + debut, nb, sizeof(int), comparer);
  int milieu = nb / 2;
  int g = construire(debut, milieu);
  int d = construire(debut + milieu, nb - milieu);
  noeuds[id].gauche = g; noeuds[id].droite = d; noeuds[id].nb = 0;
  return id;
}

/* La distance au premier obstacle sur [tmin, tmax], ou -1. `nimporte` : s'arrêter au premier trouvé. */
static float tirer(V o, V d, float tmin, float tmax, int nimporte) {
  V inv = {1.0f / (fabsf(d.x) > 1e-12f ? d.x : 1e-12f), 1.0f / (fabsf(d.y) > 1e-12f ? d.y : 1e-12f), 1.0f / (fabsf(d.z) > 1e-12f ? d.z : 1e-12f)};
  int pile[64], sp = 0;
  pile[sp++] = 0;
  float proche = tmax;
  int touche = 0;
  while (sp) {
    const Noeud *n = &noeuds[pile[--sp]];
    float t1 = (n->mn.x - o.x) * inv.x, t2 = (n->mx.x - o.x) * inv.x;
    float ta = fminf(t1, t2), tb = fmaxf(t1, t2);
    t1 = (n->mn.y - o.y) * inv.y; t2 = (n->mx.y - o.y) * inv.y;
    ta = fmaxf(ta, fminf(t1, t2)); tb = fminf(tb, fmaxf(t1, t2));
    t1 = (n->mn.z - o.z) * inv.z; t2 = (n->mx.z - o.z) * inv.z;
    ta = fmaxf(ta, fminf(t1, t2)); tb = fminf(tb, fmaxf(t1, t2));
    if (tb < fmaxf(ta, tmin) || ta > proche) continue;
    if (n->gauche < 0) {
      for (int i = n->debut; i < n->debut + n->nb; i++) {
        int t = ordre[i];
        V p = cross(d, E2[t]);
        float det = dot(E1[t], p);
        if (fabsf(det) < 1e-14f) continue;
        float idet = 1.0f / det;
        V s = sub(o, A[t]);
        float u = dot(s, p) * idet;
        if (u < 0 || u > 1) continue;
        V q = cross(s, E1[t]);
        float v = dot(d, q) * idet;
        if (v < 0 || u + v > 1) continue;
        float dist = dot(E2[t], q) * idet;
        if (dist > tmin && dist < proche) {
          proche = dist; touche = 1;
          if (nimporte) return dist;
        }
      }
    } else if (sp < 62) {
      pile[sp++] = n->gauche;
      pile[sp++] = n->droite;
    }
  }
  return touche ? proche : -1.0f;
}

static inline uint32_t hacher(uint32_t x) { x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16; return x; }
static inline float alea(uint32_t *s) { *s = hacher(*s + 0x9e3779b9U); return (*s >> 8) * (1.0f / 16777216.0f); }

int main(int argc, char **argv) {
  if (argc < 7) { fprintf(stderr, "usage : rayons obstacles points sortie rayons portee mode\n"); return 2; }
  int nr = atoi(argv[4]);
  float portee = (float)atof(argv[5]);
  int mode = atoi(argv[6]);
  FILE *f = fopen(argv[1], "rb");
  if (!f) { perror(argv[1]); return 1; }
  int nt;
  if (fread(&nt, 4, 1, f) != 1) return 1;
  float *tri = malloc((size_t)nt * 9 * 4);
  if (fread(tri, 4, (size_t)nt * 9, f) != (size_t)nt * 9) return 1;
  fclose(f);
  A = malloc(sizeof(V) * nt); E1 = malloc(sizeof(V) * nt); E2 = malloc(sizeof(V) * nt); Cn = malloc(sizeof(V) * nt);
  ordre = malloc(sizeof(int) * nt);
  noeuds = malloc(sizeof(Noeud) * (size_t)(2 * nt + 2));
  for (int i = 0; i < nt; i++) {
    V a = {tri[i * 9], tri[i * 9 + 1], tri[i * 9 + 2]}, b = {tri[i * 9 + 3], tri[i * 9 + 4], tri[i * 9 + 5]}, c = {tri[i * 9 + 6], tri[i * 9 + 7], tri[i * 9 + 8]};
    A[i] = a; E1[i] = sub(b, a); E2[i] = sub(c, a);
    Cn[i] = mul(add(add(a, b), c), 1.0f / 3.0f);
    ordre[i] = i;
  }
  free(tri);
  if (nt > 0) construire(0, nt);
  f = fopen(argv[2], "rb");
  if (!f) { perror(argv[2]); return 1; }
  int np;
  if (fread(&np, 4, 1, f) != 1) return 1;
  float *pts = malloc((size_t)np * 6 * 4);
  if (fread(pts, 4, (size_t)np * 6, f) != (size_t)np * 6) return 1;
  fclose(f);
  float *res = malloc((size_t)np * 4);
  #pragma omp parallel for schedule(dynamic, 2048)
  for (int i = 0; i < np; i++) {
    V p = {pts[i * 6], pts[i * 6 + 1], pts[i * 6 + 2]}, n = {pts[i * 6 + 3], pts[i * 6 + 4], pts[i * 6 + 5]};
    float ln = sqrtf(dot(n, n));
    if (ln < 1e-9f || nt == 0) { res[i] = mode == 2 ? portee : 1.0f; continue; }
    n = mul(n, 1.0f / ln);
    if (mode == 2) {
      /* L'épaisseur : quelques rayons vers l'intérieur, on garde la médiane grossière (le minimum des proches). */
      V o = sub(p, mul(n, 2e-4f));
      V t = fabsf(n.x) < 0.9f ? (V){1, 0, 0} : (V){0, 1, 0};
      V u = cross(n, t); u = mul(u, 1.0f / sqrtf(dot(u, u))); V w = cross(n, u);
      float somme = 0; int nbv = 0;
      uint32_t s = hacher((uint32_t)i * 2654435761U + 17);
      for (int k = 0; k < nr; k++) {
        float r1 = alea(&s) * 0.35f, r2 = alea(&s) * 6.2831853f;
        float sr = sqrtf(r1);
        V d = add(add(mul(u, sr * cosf(r2)), mul(w, sr * sinf(r2))), mul(n, -sqrtf(1 - r1)));
        float h = tirer(o, d, 1e-5f, portee, 0);
        somme += h < 0 ? portee : h; nbv++;
      }
      res[i] = somme / nbv;
      continue;
    }
    V t = fabsf(n.x) < 0.9f ? (V){1, 0, 0} : (V){0, 1, 0};
    V u = cross(n, t); u = mul(u, 1.0f / sqrtf(dot(u, u))); V w = cross(n, u);
    V o = add(p, mul(n, 2.5e-4f));
    uint32_t s = hacher((uint32_t)i * 2654435761U + 1);
    float libre = 0;
    for (int k = 0; k < nr; k++) {
      /* Hémisphère pondéré par le cosinus, stratifié sur l'angle. */
      float r1 = (k + alea(&s)) / nr, r2 = alea(&s) * 6.2831853f;
      float sr = sqrtf(r1);
      V d = add(add(mul(u, sr * cosf(r2)), mul(w, sr * sinf(r2))), mul(n, sqrtf(fmaxf(0.0f, 1 - r1))));
      float h = tirer(o, d, 2e-4f, portee, mode == 1);
      if (h < 0) libre += 1.0f;
      else if (mode == 0) { float q = h / portee; libre += q * q; }
    }
    res[i] = libre / nr;
  }
  f = fopen(argv[3], "wb");
  fwrite(res, 4, np, f);
  fclose(f);
  return 0;
}
