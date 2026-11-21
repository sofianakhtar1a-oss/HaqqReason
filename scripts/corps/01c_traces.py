# L'Écorché — étape 1 ter : des nerfs que Z-Anatomy n'a pas, tracés d'après les repères du modèle.
#
# Z-Anatomy n'a ni le nerf phrénique (le seul nerf moteur du diaphragme), ni le nerf laryngé récurrent (les muscles du
# larynx), ni le nerf glutéal inférieur (le grand fessier). On les trace ici comme Z-Anatomy trace ses nerfs : une
# courbe de Bézier (un axe et un rayon), posée sur les structures que les manuels leur donnent pour voisines :
#   • le phrénique : la face antérieure du scalène antérieur (de son bord latéral, en haut, à son bord médial, en bas),
#     entre l'artère et la veine subclavières, puis le long de la veine brachiocéphalique et de la veine cave supérieure
#     (à droite) ou sur le flanc de l'arc aortique (à gauche), sur le péricarde de l'atrium droit ou du ventricule
#     gauche, jusqu'au diaphragme, où il se divise ;
#   • le laryngé récurrent : né du vague, il passe sous l'artère subclavière (à droite) ou sous l'arc aortique, contre
#     le ligament artériel (à gauche), puis remonte dans le sillon entre la trachée et l'œsophage jusqu'au cricoïde ;
#   • le glutéal inférieur : né des racines L5, S1 et S2 du plexus sacral, il sort sous le muscle piriforme avec
#     l'artère glutéale inférieure, qu'il accompagne jusqu'à la face profonde du grand fessier.
# Ce sont des tracés : le trajet suit les descriptions classiques (Gray's Anatomy, TeachMeAnatomy), pas une dissection.
#
# Sortie : brut/index-traces.json et brut/geometrie-traces.bin, au format de 01_exporter.py (repère de Blender :
# x vers la gauche du sujet, y vers l'arrière, z vers le haut). Lancer : python3 -I 01c_traces.py
import json, math, os, sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from commun import BRUT, objets_bruts, sommets

SOURCE = "L'Écorché (tracé d'après les repères de Z-Anatomy)"
BISEAU = 0.0005  # comme les nerfs de Z-Anatomy : le rayon d'un point est un multiple d'un demi-millimètre

bruts = {o["nom"]: o for o in objets_bruts() if o.get("source") is None}


# ---------------------------------------------------------------- outils


def bezier(p0, c0, c1, p1, t):
    t = t[:, None]
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * c0 + 3 * (1 - t) * t**2 * c1 + t**3 * p1


def axes(nom, k=8):
    """Les splines d'une courbe de Z-Anatomy : pour chacune, les points de l'axe et leur rayon (en mètres)."""
    o = bruts[nom]
    sortie = []
    for s in o["courbe"]["splines"]:
        pts = np.array(s["points"], dtype=np.float64)
        P, R = [pts[0, :3]], [pts[0, 3]]
        for i in range(len(pts) - 1):
            t = np.linspace(0, 1, k + 1)[1:]
            P.extend(bezier(pts[i, :3], pts[i, 7:10], pts[i + 1, 4:7], pts[i + 1, :3], t))
            R.extend(pts[i, 3] + (pts[i + 1, 3] - pts[i, 3]) * t)
        sortie.append((np.array(P), np.array(R) * o["courbe"]["bevel"]))
    return sortie


def longueur(P):
    return float(np.linalg.norm(np.diff(P, axis=0), axis=1).sum())


def principal(nom):
    """La plus longue spline d'une courbe : l'axe du vaisseau ou du nerf lui-même (les autres sont ses branches)."""
    return max(axes(nom), key=lambda a: longueur(a[0]))


def nuage(*noms):
    return np.concatenate([sommets(bruts[n]).astype(np.float64) for n in noms])


def tranche(P, z, e=0.0025):
    return P[np.abs(P[:, 2] - z) < e]


def proche(P, q):
    """L'indice du point de P le plus proche de q."""
    return int(np.argmin(((P - q) ** 2).sum(1)))


def dessus(P, x, y, r=0.006):
    """La hauteur de la face supérieure d'une nappe (le diaphragme) au-dessus du point (x, y)."""
    d = (P[:, 0] - x) ** 2 + (P[:, 1] - y) ** 2
    Q = P[d < r * r]
    if len(Q) == 0:
        Q = P[np.argsort(d)[:20]]
    return float(Q[:, 2].max())


def catmull(C, n=10):
    """Une courbe lisse qui passe par les points C (Catmull-Rom centripète), échantillonnée finement."""
    C = np.asarray(C, dtype=np.float64)
    if len(C) < 3:
        return np.linspace(C[0], C[-1], n * 2)
    E = np.concatenate([[2 * C[0] - C[1]], C, [2 * C[-1] - C[-2]]])
    sortie = [C[0]]
    for i in range(1, len(E) - 2):
        p0, p1, p2, p3 = E[i - 1], E[i], E[i + 1], E[i + 2]
        t0 = 0.0
        t1 = t0 + max(np.linalg.norm(p1 - p0), 1e-6) ** 0.5
        t2 = t1 + max(np.linalg.norm(p2 - p1), 1e-6) ** 0.5
        t3 = t2 + max(np.linalg.norm(p3 - p2), 1e-6) ** 0.5
        for t in np.linspace(t1, t2, n + 1)[1:]:
            a1 = (t1 - t) / (t1 - t0) * p0 + (t - t0) / (t1 - t0) * p1
            a2 = (t2 - t) / (t2 - t1) * p1 + (t - t1) / (t2 - t1) * p2
            a3 = (t3 - t) / (t3 - t2) * p2 + (t - t2) / (t3 - t2) * p3
            b1 = (t2 - t) / (t2 - t0) * a1 + (t - t0) / (t2 - t0) * a2
            b2 = (t3 - t) / (t3 - t1) * a2 + (t - t1) / (t3 - t1) * a3
            sortie.append((t2 - t) / (t2 - t1) * b1 + (t - t1) / (t2 - t1) * b2)
    return np.array(sortie)


def reechantillonner(D, pas):
    s = np.concatenate([[0.0], np.cumsum(np.linalg.norm(np.diff(D, axis=0), axis=1))])
    n = max(2, int(math.ceil(s[-1] / pas)) + 1)
    u = np.linspace(0, s[-1], n)
    return np.stack([np.interp(u, s, D[:, k]) for k in range(3)], axis=1), u / max(s[-1], 1e-9)


def spline(C, rayons, pas=0.005, lisse=3):
    """Une spline de Bézier (au format de Z-Anatomy) qui passe près des points C ; `rayons` : un rayon (en
    demi-millimètres) par point de C, interpolé le long du trajet."""
    C = np.asarray(C, dtype=np.float64)
    D = catmull(C)
    # Un léger lissage efface les cassures entre les repères, sans bouger les bouts.
    for _ in range(lisse):
        D[1:-1] = D[1:-1] * 0.5 + (D[:-2] + D[2:]) * 0.25
    Q, u = reechantillonner(D, pas)
    sC = np.concatenate([[0.0], np.cumsum(np.linalg.norm(np.diff(C, axis=0), axis=1))])
    R = np.interp(u, sC / max(sC[-1], 1e-9), rayons)
    pts = []
    for i in range(len(Q)):
        a = Q[max(0, i - 1)]
        b = Q[min(len(Q) - 1, i + 1)]
        h = (b - a) / (6.0 if 0 < i < len(Q) - 1 else 3.0)
        pts.append([*Q[i].round(6), round(float(R[i]), 3), *(Q[i] - h).round(6), *(Q[i] + h).round(6)])
    return {"sorte": "BEZIER", "ferme": False, "ordre": 0, "res": 12, "points": pts}


def maillage(splines, cotes=6):
    """Un tube grossier autour de chaque spline : la chaîne veut des triangles (la géométrie finale est retracée)."""
    P, T = [], []
    for s in splines:
        pts = np.array(s["points"], dtype=np.float64)
        A, R = pts[:, :3], np.maximum(pts[:, 3] * BISEAU, 1.2e-4)
        tan = np.gradient(A, axis=0)
        tan /= np.linalg.norm(tan, axis=1, keepdims=True) + 1e-12
        base = len(P)
        for i in range(len(A)):
            t = tan[i]
            u = np.cross(t, [0.0, 0.0, 1.0] if abs(t[2]) < 0.9 else [1.0, 0.0, 0.0])
            u /= np.linalg.norm(u)
            v = np.cross(t, u)
            for j in range(cotes):
                a = 2 * math.pi * j / cotes
                P.append(A[i] + R[i] * (math.cos(a) * u + math.sin(a) * v))
        for i in range(len(A) - 1):
            for j in range(cotes):
                a = base + i * cotes + j
                b = base + i * cotes + (j + 1) % cotes
                T.append((a, b, a + cotes))
                T.append((b, b + cotes, a + cotes))
    return np.array(P, dtype=np.float32), np.array(T, dtype=np.uint32)


# ---------------------------------------------------------------- le nerf phrénique


def phrenique(c):
    s = 1.0 if c == "l" else -1.0
    S = nuage(f"Scalenus anterior muscle.{c}")
    pts, ray = [], []
    # Sur la face antérieure du scalène antérieur : du bord latéral (C4) au bord médial, en descendant.
    z_haut, z_bas = S[:, 2].max() - 0.007, S[:, 2].min() + 0.013
    for z in np.linspace(z_haut, z_bas, 6):
        t = (z_haut - z) / (z_haut - z_bas)
        Q = tranche(S, z)
        xs = s * Q[:, 0]
        x = s * ((1 - t) * np.quantile(xs, 0.8) + t * np.quantile(xs, 0.25))
        pres = Q[np.abs(Q[:, 0] - x) < 0.003]
        pts.append([x, pres[:, 1].min() - 0.0016, z])
        ray.append(2.0)
    # Entre l'artère subclavière (en arrière) et la veine subclavière (en avant).
    A, RA = principal("Left subclavian artery" if c == "l" else "Right subclavian artery")
    V, RV = principal("Left subclavian vein" if c == "l" else "Right subclavian vein")
    x = pts[-1][0] - s * 0.004
    ia, iv = int(np.argmin(np.abs(A[:, 0] - x))), int(np.argmin(np.abs(V[:, 0] - x)))
    y = ((A[ia, 1] - RA[ia]) + (V[iv, 1] + RV[iv])) / 2
    z = (A[ia, 2] + V[iv, 2]) / 2 - 0.002
    pts.append([x, y, z])
    ray.append(2.0)
    if c == "r":
        # À droite : le flanc de la veine brachiocéphalique, puis de la veine cave supérieure…
        for nom in ("Right brachiocephalic vein", "Superior vena cava"):
            B, RB = principal(nom)
            for i in np.linspace(0, len(B) - 1, 4).astype(int)[1:]:
                if B[i, 2] < pts[-1][2] - 0.004:
                    pts.append([B[i, 0] - RB[i] - 0.0016, B[i, 1] + 0.002, B[i, 2]])
                    ray.append(1.9)
        # … le péricarde sur l'atrium droit…
        H = nuage("Right atrium")
        for z in np.linspace(pts[-1][2] - 0.008, H[:, 2].min() + 0.012, 5):
            Q = tranche(H, z)
            if len(Q):
                q = Q[np.argmin(Q[:, 0])]
                pts.append([q[0] - 0.0035, q[1], z])
                ray.append(1.8)
        # … et le diaphragme, à droite de la veine cave inférieure.
        I, RI = principal("Inferior vena cava (thoracic part)")
        i = int(np.argmin(np.abs(I[:, 2] - 1.24)))
        fin = (I[i, 0] - RI[i] - 0.006, I[i, 1] + 0.002)
    else:
        # À gauche : devant la première partie de l'artère subclavière…
        for i in range(len(A)):
            if A[i, 2] < pts[-1][2] - 0.008 and A[i, 2] > A[:, 2].min() + 0.004:
                pts.append([A[i, 0] + 0.002, A[i, 1] - RA[i] - 0.0016, A[i, 2]])
                ray.append(1.9)
                break
        # … sur le flanc gauche de l'arc aortique, en avant du vague…
        B, RB = principal("Aortic arch")
        n = np.array([0.93, -0.37, 0.0])
        for i in range(len(B)):
            if -0.02 < B[i, 1] < -0.004 and B[i, 2] < pts[-1][2] - 0.004:
                p = B[i] + n * (RB[i] + 0.0018)
                pts.append(list(p))
                ray.append(1.9)
        # … puis le péricarde sur le ventricule gauche, jusqu'à la pointe du cœur.
        H = nuage("Left ventricle", "Left atrium")
        for z in np.linspace(min(pts[-1][2], H[:, 2].max()) - 0.01, H[:, 2].min() + 0.02, 6):
            Q = tranche(H, z)
            if len(Q):
                q = Q[np.argmax(Q[:, 0])]
                pts.append([q[0] + 0.0035, q[1], z])
                ray.append(1.8)
        L = nuage("Left ventricle")
        pointe = L[L[:, 2] < np.quantile(L[:, 2], 0.03)].mean(0)
        fin = (pointe[0] + 0.012, pointe[1])
    D = nuage("Diaphragm")
    zf = dessus(D, *fin) + 0.0013
    pts.append([fin[0], fin[1], zf + 0.004])
    ray.append(1.7)
    pts.append([fin[0], fin[1], zf])
    ray.append(1.6)
    splines = [spline(pts, ray)]
    # Les branches terminales : elles s'étalent sur le diaphragme (en avant, en dehors, en arrière).
    for direction in ((0.0, -1.0), (s * 1.0, 0.15), (0.2 * s, 1.0)):
        b = [pts[-1]]
        for k in range(1, 5):
            x, y = fin[0] + direction[0] * 0.009 * k, fin[1] + direction[1] * 0.009 * k
            b.append([x, y, dessus(D, x, y) + 0.0012])
        splines.append(spline(b, [1.4, 1.1, 0.9, 0.7, 0.5], pas=0.004, lisse=1))
    return splines


# ---------------------------------------------------------------- le nerf laryngé récurrent


def sillon(c, z_bas, z_haut, pas=0.008):
    """Le sillon entre la trachée et l'œsophage, d'un côté, de z_bas à z_haut."""
    s = 1.0 if c == "l" else -1.0
    T, O = nuage("Trachea"), nuage("Oesophagus")
    pts = []
    for z in np.arange(z_bas, z_haut, pas):
        Q, R = tranche(T, z), tranche(O, z)
        if len(Q) < 10 or len(R) < 10:
            continue
        x = s * (np.max(s * Q[:, 0]) - 0.0008)
        y = (Q[:, 1].max() + R[:, 1].min()) / 2
        pts.append([x, y, z])
    return pts


def laryngé_recurrent(c):
    s = 1.0 if c == "l" else -1.0
    vague = principal(f"Vagus nerve (X).{c}")[0]
    pts = []
    if c == "r":
        # Il naît du vague à hauteur de l'artère subclavière droite, passe sous elle et remonte en arrière.
        A, RA = principal("Right subclavian artery")
        cand = [i for i in range(len(vague)) if 1.39 < vague[i, 2] < 1.44]
        iv = min(cand, key=lambda i: np.min(np.linalg.norm(A - vague[i], axis=1)))
        ia = proche(A, vague[iv])
        a, r = A[ia], RA[ia] + 0.0022
        pts += [list(vague[iv] + [0, 0, 0.004]), list(vague[iv]), list(a + [0, -0.35 * r, -r]), list(a + [0, 0.5 * r, -0.9 * r]), list(a + [0.004 * -s, r + 0.002, -0.2 * r])]
        z0 = a[2] + 0.004
    else:
        # Il naît du vague sous l'arc aortique, passe sous l'arc contre le ligament artériel et remonte en arrière.
        B, RB = principal("Aortic arch")
        cand = [i for i in range(len(vague)) if 1.355 < vague[i, 2] < 1.372]
        iv = max(cand, key=lambda i: vague[i, 2])
        ib = proche(B, vague[iv] + [0.0, 0.004, 0.012])
        b, r = B[ib], RB[ib]
        pts += [list(vague[iv] + [0, 0, 0.004]), list(vague[iv]), [vague[iv, 0] + 0.003, b[1] + 0.004, b[2] - r - 0.0035], [vague[iv, 0] - 0.002, b[1] + 0.011, b[2] - r - 0.002]]
        z0 = b[2] - r + 0.002
    pts += sillon(c, z0, 1.456)
    # Il entre dans le larynx en arrière de l'articulation crico-thyroïdienne.
    K = tranche(nuage("Cricoid cartilage"), 1.462, 0.003)
    k = K[np.argmax(s * K[:, 0] + 0.3 * K[:, 1])]
    pts.append([k[0] + s * 0.0012, k[1] + 0.0008, 1.462])
    ray = [1.6] * (len(pts) - 1) + [1.1]
    return [spline(pts, ray, pas=0.004)]


# ---------------------------------------------------------------- le nerf glutéal inférieur


def gluteal_inferieur(c):
    s = 1.0 if c == "l" else -1.0
    racines = axes(f"Sciatic nerve.{c}")
    A = axes(f"Inferior gluteal artery.{c}")
    artere = max(A, key=lambda a: longueur(a[0]))[0]
    # Ses racines : L5 (le tronc lombo-sacral) et S2, qui se joignent en arrière du plexus, au bord inférieur du piriforme.
    tronc = max(racines, key=lambda a: longueur(a[0]))[0]
    l5 = tronc[int(np.argmin(np.abs(tronc[:, 2] - 0.92)))]
    s2 = min(racines, key=lambda a: a[0][0, 1] * -1)[0]  # la racine la plus postérieure
    s2 = s2[len(s2) // 2]
    ia = int(np.argmin(np.abs(artere[:, 2] - 0.888)))
    j = artere[ia] + [s * 0.002, -0.0035, 0.0]
    splines = [spline([l5, (l5 + j) / 2 + [0, 0.004, 0], j], [1.3, 1.5, 1.8], pas=0.004), spline([s2, (s2 + j) / 2 + [0, 0.002, 0], j], [1.2, 1.4, 1.8], pas=0.004)]
    # Avec l'artère glutéale inférieure, sous le piriforme, jusqu'à la face profonde du grand fessier.
    def le_long(P, debut=0):
        sortie = []
        for i in range(debut, len(P), 3):
            t = np.gradient(P, axis=0)[i]
            t /= np.linalg.norm(t) + 1e-12
            cote = np.cross(t, [0.0, 0.0, 1.0])
            cote = cote / (np.linalg.norm(cote) + 1e-12) * (1 if cote[0] * s > 0 else -1)
            sortie.append(list(P[i] + cote * 0.0032 + [0, 0.0012, 0]))
        return sortie
    principale = [list(j)] + le_long(artere, ia + 2)
    splines.append(spline(principale, np.linspace(1.9, 0.9, len(principale)), pas=0.004))
    for P, _ in A:
        if P is artere:
            continue
        b = le_long(P)
        if len(b) >= 2:
            splines.append(spline(b, np.linspace(1.1, 0.6, len(b)), pas=0.004, lisse=1))
    return splines


# ---------------------------------------------------------------- l'écriture

NERFS = [
    ("Phrenic nerve", phrenique, ["7: Nervous system & Sense organs", "Cervical plexus", "Nerves", "Peripheral nervous system", "Neck", "Thorax", "Trunk"]),
    ("Recurrent laryngeal nerve", laryngé_recurrent, ["7: Nervous system & Sense organs", "Cranial nerves", "Vagus nerve (X)", "Nerves", "Peripheral nervous system", "Neck", "Thorax"]),
    ("Inferior gluteal nerve", gluteal_inferieur, ["7: Nervous system & Sense organs", "Sacral plexus", "Lumbosacral plexus", "Nerves", "Peripheral nervous system", "Trunk"]),
]

if __name__ == "__main__":
    objets = []
    with open(os.path.join(BRUT, "geometrie-traces.bin"), "wb") as f:
        for nom, tracer, collections in NERFS:
            for c in ("l", "r"):
                splines = tracer(c)
                P, T = maillage(splines)
                o_s = f.tell()
                f.write(P.tobytes())
                o_t = f.tell()
                f.write(T.tobytes())
                o_m = f.tell()
                f.write(np.zeros(len(T), dtype=np.uint8).tobytes())
                courbe = {"bevel": BISEAU, "bevel_res": 4, "objet_bevel": None, "taper": None, "extrude": 0.0, "mode": "ROUND", "res": 12, "splines": splines}
                objets.append({"nom": f"{nom}.{c}", "type": "CURVE", "collections": collections, "parent": None, "mats": ["Nerve"], "mods": [], "sommets": int(len(P)), "triangles": int(len(T)), "o_sommets": o_s, "o_triangles": o_t, "o_matieres": o_m, "courbe": courbe, "source": SOURCE})
                long = sum(longueur(np.array(sp["points"])[:, :3]) for sp in splines[:1])
                print(f"{nom}.{c:2s} {len(splines)} splines, tronc {100 * long:.1f} cm, {len(T)} triangles")
    with open(os.path.join(BRUT, "index-traces.json"), "w", encoding="utf-8") as f:
        json.dump({"source": SOURCE, "blender": None, "geometrie": "geometrie-traces.bin", "objets": objets}, f, ensure_ascii=False, indent=1)
    print("écrit :", len(objets), "objets")
