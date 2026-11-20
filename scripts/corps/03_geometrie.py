# L'Écorché — étape 3 : la géométrie de chaque pièce, en trois niveaux de détail.
#   • Les maillages : soudure, lissage par subdivision quand la pièce est trop anguleuse, puis allègement jusqu'à la
#     finesse voulue (une longueur d'arête par couche et par niveau), normales lisses, poids de matière par sommet
#     (tendon dans un muscle, cartilage articulaire et sutures sur un os, racine d'une dent).
#   • Les vaisseaux et les nerfs : retracés à partir de leurs courbes de Bézier (axe et rayon), en tubes propres dont
#     le nombre de côtés et de tronçons dépend du rayon, de la courbure et du niveau de détail.
# Usage (avec le Python qui a bpy) : python 03_geometrie.py [couche ...]   → ~/donnees-corps/geo/lod{0,1,2}/*.npz
import json, os, sys, math, time
import numpy as np
import bpy, bmesh
from scipy.spatial import cKDTree
from commun import DONNEES, objets_bruts, sommets, triangles, matieres, vers_repere

GEO = os.path.join(DONNEES, "geo")
classement = json.load(open(os.path.join(DONNEES, "classement.json"), encoding="utf-8"))
bruts = {o["nom"]: o for o in objets_bruts()}
filtre = set(sys.argv[1:])

# La longueur d'arête visée (en millimètres) : par couche ou par sorte, pour les niveaux 0 (ordinateur), 1 (téléphone), 2 (premier affichage).
ARETES = {
    "os": (1.5, 2.6, 5.5),
    "dent": (0.6, 1.0, 2.2),
    "cartilage": (1.4, 2.4, 5.0),
    "muscle": (2.0, 3.4, 7.0),
    "tendon": (1.6, 2.8, 6.0),
    "fascia": (3.2, 5.0, 10.0),
    "ligament": (1.2, 2.0, 4.5),
    "bourse": (2.0, 3.2, 6.0),
    "viscere": (2.4, 4.0, 9.0),
    "coeur": (1.5, 2.5, 5.5),
    "sens": (0.45, 0.8, 2.0),
    "encephale": (1.4, 2.4, 5.5),
    "enveloppe": (3.0, 5.0, 10.0),
    "lymphe": (1.5, 2.5, 5.0),
    "insertion": (1.6, 2.6, 5.0),
}
PLANCHER = (160, 64, 24)  # jamais moins de triangles que cela pour une pièce


def finesse(couche, sorte):
    return ARETES.get(sorte) or ARETES.get(couche) or ARETES["viscere"]


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def aire(P, T):
    a = P[T[:, 1]] - P[T[:, 0]]
    b = P[T[:, 2]] - P[T[:, 0]]
    return 0.5 * np.linalg.norm(np.cross(a, b), axis=1)


def vers_blender(P, T, M):
    m = bpy.data.meshes.new("m")
    m.vertices.add(len(P))
    m.vertices.foreach_set("co", P.astype(np.float32).ravel())
    m.loops.add(len(T) * 3)
    m.loops.foreach_set("vertex_index", T.astype(np.int32).ravel())
    m.polygons.add(len(T))
    m.polygons.foreach_set("loop_start", np.arange(0, len(T) * 3, 3, dtype=np.int32))
    m.polygons.foreach_set("loop_total", np.full(len(T), 3, dtype=np.int32))
    for k in range(int(M.max()) + 1 if len(M) else 1):
        m.materials.append(None)
    m.polygons.foreach_set("material_index", M.astype(np.int32))
    m.update(calc_edges=True)
    m.validate(verbose=False)
    return m


def depuis_blender(m):
    n = len(m.vertices)
    P = np.empty(n * 3, dtype=np.float32)
    m.vertices.foreach_get("co", P)
    m.calc_loop_triangles()
    nt = len(m.loop_triangles)
    T = np.empty(nt * 3, dtype=np.int32)
    m.loop_triangles.foreach_get("vertices", T)
    M = np.empty(nt, dtype=np.int32)
    m.loop_triangles.foreach_get("material_index", M)
    return P.reshape(-1, 3), T.reshape(-1, 3), M


def nettoyer(m):
    bm = bmesh.new()
    bm.from_mesh(m)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2e-5)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-6)
    libres = [v for v in bm.verts if not v.link_faces]
    if libres:
        bmesh.ops.delete(bm, geom=libres, context="VERTS")
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces) if False else None
    bm.to_mesh(m)
    bm.free()
    m.update()


def evaluer(m, subdiv, ratio):
    """Applique subdivision puis décimation, et rend (P, T, M)."""
    o = bpy.data.objects.new("o", m)
    scene.collection.objects.link(o)
    if subdiv:
        s = o.modifiers.new("s", "SUBSURF")
        s.levels = subdiv
        s.render_levels = subdiv
        s.subdivision_type = "CATMULL_CLARK"
    if ratio < 0.98:
        t = o.modifiers.new("t", "TRIANGULATE")
        d = o.modifiers.new("d", "DECIMATE")
        d.decimate_type = "COLLAPSE"
        d.ratio = max(0.002, ratio)
        d.use_collapse_triangulate = True
    deps = bpy.context.evaluated_depsgraph_get()
    e = o.evaluated_get(deps)
    em = e.to_mesh()
    res = depuis_blender(em)
    res = (res[0].copy(), res[1].copy(), res[2].copy())
    e.to_mesh_clear()
    bpy.data.objects.remove(o)
    return res


def normales(P, T):
    a = P[T[:, 1]] - P[T[:, 0]]
    b = P[T[:, 2]] - P[T[:, 0]]
    fn = np.cross(a, b)  # pondérée par l'aire
    N = np.zeros_like(P)
    for k in range(3):
        np.add.at(N, T[:, k], fn)
    l = np.linalg.norm(N, axis=1, keepdims=True)
    return N / np.maximum(l, 1e-12)


def poids(P, T, M, groupes):
    """Pour chaque groupe de matières : la part d'aire des faces de ce groupe autour de chaque sommet (0..1), adoucie."""
    A = aire(P, T)
    tot = np.zeros(len(P))
    for k in range(3):
        np.add.at(tot, T[:, k], A)
    W = np.zeros((len(P), len(groupes)), dtype=np.float32)
    for g, slots in enumerate(groupes):
        if not slots:
            continue
        dans = np.isin(M, list(slots))
        if not dans.any():
            continue
        s = np.zeros(len(P))
        for k in range(3):
            np.add.at(s, T[dans, k], A[dans])
        W[:, g] = s / np.maximum(tot, 1e-12)
    return W


def adoucir(W, T, n, tours=2):
    if W.size == 0 or not W.any():
        return W
    ar = np.concatenate([T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]])
    for _ in range(tours):
        s = np.zeros_like(W)
        c = np.zeros(n)
        np.add.at(s, ar[:, 0], W[ar[:, 1]])
        np.add.at(c, ar[:, 0], 1)
        np.add.at(s, ar[:, 1], W[ar[:, 0]])
        np.add.at(c, ar[:, 1], 1)
        W = 0.5 * W + 0.5 * s / np.maximum(c, 1)[:, None]
    return W


def zones(P, T, M, n_slots):
    A = aire(P, T)
    Z = np.zeros((len(P), max(1, n_slots)))
    for k in range(3):
        np.add.at(Z, (T[:, k], np.minimum(M, max(0, n_slots - 1))), A)
    return Z.argmax(1).astype(np.uint8)


def groupes_de(mats, couche, sorte):
    """Quelles matières de Z-Anatomy deviennent le poids 1 et le poids 2 d'un sommet."""
    g1, g2 = set(), set()
    for k, m in enumerate(mats):
        if not m:
            continue
        if couche == "muscle" and m == "Tendon":
            g1.add(k)
        elif couche == "os" and sorte == "dent":
            if m == "Teeth-roots":
                g1.add(k)
            elif m == "Dentine":
                g2.add(k)
        elif couche == "os":
            if m == "Cartilage" and sorte != "cartilage":
                g1.add(k)
            elif m.startswith("Suture"):
                g2.add(k)
        elif couche in ("ligament", "viscere") and m == "Cartilage":
            g1.add(k)
        elif couche in ("ligament", "viscere", "tendon") and m == "Ligament" and len([x for x in mats if x]) > 1:
            g2.add(k)
    return [g1, g2]


# ---------------------------------------------------------------- les vaisseaux et les nerfs


def bezier(p0, c0, c1, p1, t):
    u = 1 - t
    return (u ** 3)[:, None] * p0 + (3 * u * u * t)[:, None] * c0 + (3 * u * t * t)[:, None] * c1 + (t ** 3)[:, None] * p1


def axe_spline(s, lod):
    """Les points de l'axe d'une spline de Bézier (position, rayon), plus ou moins serrés selon la courbure."""
    pts = np.array(s["points"], dtype=np.float64)
    if len(pts) < 2:
        return None, None
    pas_angle = (10.0, 20.0, 38.0)[lod] * math.pi / 180
    n = len(pts)
    segs = list(range(n - 1)) + ([n - 1] if s["ferme"] else [])
    P, R = [pts[0, :3]], [pts[0, 3]]
    for i in segs:
        j = (i + 1) % n
        p0, c0, c1, p1 = pts[i, :3], pts[i, 7:10], pts[j, 4:7], pts[j, :3]
        a, b, c = c0 - p0, c1 - c0, p1 - c1

        def angle(u, v):
            lu, lv = np.linalg.norm(u), np.linalg.norm(v)
            if lu < 1e-9 or lv < 1e-9:
                return 0.0
            return math.acos(max(-1.0, min(1.0, float(u @ v) / (lu * lv))))

        tourne = angle(a, b) + angle(b, c) if (np.linalg.norm(a) > 1e-9 or np.linalg.norm(c) > 1e-9) else 0.0
        k = int(min(24, max(1, math.ceil(tourne / pas_angle))))
        t = np.linspace(0, 1, k + 1)[1:]
        P.extend(bezier(p0, c0, c1, p1, t))
        R.extend(pts[i, 3] + (pts[j, 3] - pts[i, 3]) * t)
    P = np.array(P)
    R = np.array(R)
    # Retirer les points confondus.
    garde = np.ones(len(P), dtype=bool)
    garde[1:] = np.linalg.norm(P[1:] - P[:-1], axis=1) > 1e-6
    return P[garde], R[garde]


def cotes(r_mm, lod):
    table = ((0.6, 6, 5, 4), (1.5, 8, 6, 4), (3.0, 10, 8, 5), (6.0, 14, 10, 6), (1e9, 18, 12, 8))
    for seuil, a, b, c in table:
        if r_mm < seuil:
            return (a, b, c)[lod]


def tube(P, R, ferme, lod):
    """Un tube autour d'un axe : repères sans torsion, bouts arrondis. Rend (sommets, normales, triangles, abscisse)."""
    n = len(P)
    if n < 2:
        return None
    k = cotes(float(np.median(R)) * 1000, lod)
    tan = np.zeros_like(P)
    tan[1:-1] = P[2:] - P[:-2]
    tan[0] = P[1] - P[0]
    tan[-1] = P[-1] - P[-2]
    if ferme:
        tan[0] = tan[-1] = P[1] - P[-2]
    tan /= np.maximum(np.linalg.norm(tan, axis=1, keepdims=True), 1e-12)
    # Repère de départ, puis transport par double réflexion.
    ref = np.array([0.0, 0.0, 1.0]) if abs(tan[0][2]) < 0.9 else np.array([1.0, 0.0, 0.0])
    u = np.cross(tan[0], ref)
    u /= np.linalg.norm(u)
    U = [u]
    for i in range(n - 1):
        v1 = P[i + 1] - P[i]
        c1 = v1 @ v1
        if c1 < 1e-18:
            U.append(U[-1])
            continue
        rl = U[-1] - (2 / c1) * (v1 @ U[-1]) * v1
        tl = tan[i] - (2 / c1) * (v1 @ tan[i]) * v1
        v2 = tan[i + 1] - tl
        c2 = v2 @ v2
        nu = rl - (2 / c2) * (v2 @ rl) * v2 if c2 > 1e-18 else rl
        nu -= (nu @ tan[i + 1]) * tan[i + 1]
        nu /= max(np.linalg.norm(nu), 1e-12)
        U.append(nu)
    U = np.array(U)
    V = np.cross(tan, U)
    ang = np.linspace(0, 2 * math.pi, k, endpoint=False)
    cos, sin = np.cos(ang), np.sin(ang)
    dirs = cos[None, :, None] * U[:, None, :] + sin[None, :, None] * V[:, None, :]  # n × k × 3
    S = P[:, None, :] + dirs * R[:, None, None]
    Nrm = dirs.copy()
    absc = np.concatenate([[0], np.cumsum(np.linalg.norm(P[1:] - P[:-1], axis=1))])
    A = np.repeat(absc[:, None], k, axis=1)
    som = [S.reshape(-1, 3)]
    nor = [Nrm.reshape(-1, 3)]
    ab = [A.reshape(-1)]
    tri = []
    for i in range(n - 1):
        for j in range(k):
            a = i * k + j
            b = i * k + (j + 1) % k
            c = (i + 1) * k + j
            d = (i + 1) * k + (j + 1) % k
            tri.append((a, c, b))
            tri.append((b, c, d))
    base = n * k
    if not ferme:
        # Les bouts : un petit dôme (une pointe posée à un demi-rayon).
        for bout, sens, anneau in ((0, -1.0, 0), (n - 1, 1.0, (n - 1) * k)):
            pointe = P[bout] + tan[bout] * sens * R[bout] * (0.55 if lod < 2 else 0.3)
            som.append(pointe[None, :])
            nor.append((tan[bout] * sens)[None, :])
            ab.append(np.array([absc[bout]]))
            for j in range(k):
                a = anneau + j
                b = anneau + (j + 1) % k
                tri.append((base, a, b) if sens < 0 else (base, b, a))
            base += 1
    return np.concatenate(som), np.concatenate(nor), np.array(tri, dtype=np.int32), np.concatenate(ab)


def piece_courbe(o, lod):
    c = o["courbe"]
    if c["mode"] != "ROUND" or c["bevel"] <= 0:
        return None
    Ps, Ns, Ts, As, Cs = [], [], [], [], []
    base = 0
    axes = []
    for s in c["splines"]:
        if s["sorte"] != "BEZIER":
            continue
        P, R = axe_spline(s, lod)
        if P is None or len(P) < 2:
            continue
        R = np.maximum(R * c["bevel"], 1.2e-4)
        res = tube(P, R, s["ferme"], lod)
        if res is None:
            continue
        som, nor, tri, absc = res
        Ps.append(som); Ns.append(nor); Ts.append(tri + base); As.append(absc)
        Cs.append(np.full(len(som), len(axes), dtype=np.int32))
        axes.append(np.concatenate([P, R[:, None]], axis=1))
        base += len(som)
    if not Ps:
        return None
    return np.concatenate(Ps), np.concatenate(Ns), np.concatenate(Ts), np.concatenate(As), np.concatenate(Cs), axes


# ---------------------------------------------------------------- la boucle


def traiter_maillage(o, couche, sorte, mats):
    P, T, M = sommets(o), triangles(o).astype(np.int32), matieres(o).astype(np.int32)
    m = vers_blender(P, T, M)
    nettoyer(m)
    P0, T0, M0 = depuis_blender(m)
    P0, T0, M0 = P0.copy(), T0.copy(), M0.copy()
    if len(T0) == 0:
        bpy.data.meshes.remove(m)
        return None
    A = float(aire(P0, T0).sum())
    fin = finesse(couche, sorte)
    groupes = groupes_de(mats, couche, sorte)
    sorties = []
    ref = None
    for lod in range(3):
        e = fin[lod] / 1000.0
        cible = max(PLANCHER[lod], A / (0.433 * e * e))
        n0 = len(T0)
        subdiv = 0
        if lod == 0 and n0 < 0.75 * cible:
            subdiv = 2 if n0 < 0.12 * cible else 1
        n1 = n0 * (4 ** subdiv) * (2 if subdiv else 1)  # Catmull-Clark sur des triangles : 3 quadrilatères par triangle, soit 6 triangles au premier niveau
        if subdiv:
            n1 = n0 * 6 * (4 ** (subdiv - 1))
        ratio = min(1.0, cible / max(1, n1))
        Pl, Tl, Ml = evaluer(m, subdiv, ratio)
        if len(Tl) == 0:
            Pl, Tl, Ml = P0, T0, M0
        N = normales(Pl, Tl)
        W = adoucir(poids(Pl, Tl, Ml, groupes), Tl, len(Pl), tours=2 if lod == 0 else 1)
        Z = zones(Pl, Tl, Ml, len(mats))
        if lod == 0:
            ref = (cKDTree(Pl), N)
        else:
            # Les normales du niveau fin : l'ombrage reste lisse même quand la géométrie s'allège.
            d, idx = ref[0].query(Pl)
            Nf = ref[1][idx]
            proche = (d < e * 0.8) & ((Nf * N).sum(1) > 0.5)
            N = np.where(proche[:, None], Nf, N)
        sorties.append({"P": vers_repere(Pl).astype(np.float32), "N": vers_repere(N).astype(np.float32), "T": Tl.astype(np.uint32), "W": np.round(W * 255).astype(np.uint8), "Z": Z})
    bpy.data.meshes.remove(m)
    return sorties


def traiter_courbe(o):
    sorties = []
    for lod in range(3):
        r = piece_courbe(o, lod)
        if r is None:
            return None
        P, N, T, A, C, axes = r
        sorties.append({"P": vers_repere(P).astype(np.float32), "N": vers_repere(N).astype(np.float32), "T": T.astype(np.uint32), "W": np.zeros((len(P), 2), dtype=np.uint8), "Z": np.zeros(len(P), dtype=np.uint8), "A": A.astype(np.float32), "C": C.astype(np.uint16)})
        if lod == 0:
            sorties[0]["axes"] = [np.concatenate([vers_repere(a[:, :3]), a[:, 3:4]], axis=1).astype(np.float32) for a in axes]
    return sorties


for lod in range(3):
    os.makedirs(os.path.join(GEO, f"lod{lod}"), exist_ok=True)

travaux = [(p["objet"], p["couche"], p["sorte"], p["mats"]) for p in classement["pieces"]]
travaux += [(i["objet"], "insertion", "insertion", i.get("mats") or []) for i in classement["insertions"] if i["cote"] == "g"]
compte = [0, 0, 0]
debut = time.time()
faits = 0
for k, (nom, couche, sorte, mats) in enumerate(travaux):
    if filtre and couche not in filtre:
        continue
    o = bruts[nom]
    res = None
    if o["type"] == "CURVE" and o.get("courbe", {}).get("mode") == "ROUND" and o["courbe"]["bevel"] > 0:
        res = traiter_courbe(o)
    if res is None:
        res = traiter_maillage(o, couche, sorte, mats)
    if res is None:
        print("vide :", nom)
        continue
    cle = f"{k:05d}"
    for lod in range(3):
        d = res[lod]
        axes = d.pop("axes", None)
        extra = {}
        if axes is not None:
            extra["axes"] = np.concatenate(axes) if axes else np.zeros((0, 4), dtype=np.float32)
            extra["axes_n"] = np.array([len(a) for a in axes], dtype=np.int32)
        np.savez(os.path.join(GEO, f"lod{lod}", cle + ".npz"), **d, **extra)
        compte[lod] += len(d["T"])
    faits += 1
    if faits % 150 == 0:
        print(f"{faits} pièces, {time.time() - debut:.0f} s, triangles {compte}", flush=True)

json.dump([{"cle": f"{k:05d}", "objet": t[0], "couche": t[1], "sorte": t[2]} for k, t in enumerate(travaux)], open(os.path.join(GEO, "index.json"), "w"), ensure_ascii=False)
print("fini :", faits, "pièces, triangles par niveau (un seul côté pour les paires) :", compte, f"en {time.time() - debut:.0f} s")
