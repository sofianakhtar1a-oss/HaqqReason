# L'Écorché — étape 1 quater : les structures que les atlas n'ont pas, construites d'après leurs voisines.
#
# Z-Anatomy a les grands vaisseaux, les grands nerfs et la plupart des muscles et ligaments, mais pas toutes les
# branches, ni les petits ligaments du larynx ou du pavillon, ni les ganglions et les plexus du système autonome. On
# les construit ici, à partir d'une description écrite structure par structure dans donnees/ajouts/*.json : où elle
# naît, par où elle passe, où elle se termine, chaque point étant posé sur une structure du modèle (un point de l'axe
# d'une artère, le bord d'un muscle, un relief nommé d'un os…). Les descriptions suivent les manuels (Gray's
# Anatomy, TeachMeAnatomy, Kenhub) ; ce sont des tracés, pas des dissections : la page « Sources » le dit.
#
# Les formes :
#   • « trace »     : une branche (artère, veine, nerf) : une courbe lisse par les points donnés, un rayon qui décroît ;
#   • « satellite » : les veines qui accompagnent une artère (une ou deux, de part et d'autre de son axe) ;
#   • « plexus »    : un réseau de fins rameaux autour d'un vaisseau ou d'un point ;
#   • « ganglion »  : un renflement (ellipsoïde) ; « noeuds » : un groupe de petits nœuds lymphatiques ;
#   • « bande »     : un ligament (ruban) ; « fuseau » : un muscle (fuseau aplati) ; « coupe » : une courbe de
#                     Z-Anatomy gardée jusqu'à un point (l'artère testiculaire s'arrête à l'anneau inguinal profond) ;
#   • « spirale » et « anneaux » : la cochlée et les conduits semi-circulaires (ceux de Z-Anatomy ne sont pas libres :
#                     on n'en garde que la place et la taille).
#
# Les points (« de », « par », « vers », « en »…) : {"objet": nom, …} avec
#   "a": t            un point de l'axe de l'objet (une courbe : son tracé ; un maillage : son grand axe), t de 0 à 1 ;
#   "rel": [u, v, w]  un point de la boîte de l'objet : u de −1 (bord médial) à 1 (bord latéral), v du bas (−1) au haut
#                     (1), w de l'arrière (−1) à l'avant (1) ; pour une structure de la ligne médiane, u > 0 va vers le
#                     côté tracé ;
#   "proche": true    le point de l'objet le plus proche du point précédent ;
#   "centre": true    son centre ; "bord": "superieur" | "inferieur" | "anterieur" | "posterieur" | "medial" | "lateral" ;
#   "decale": [l, h, a] un décalage en millimètres (vers le dehors, vers le haut, vers l'avant).
# ou {"repere": nom} : l'ancre d'un relief nommé de Z-Anatomy (les traits d'étiquette « .j »).
# Un nom d'objet sans côté est cherché d'abord avec celui du tracé (« .l » ou « .r », « Left … », « Right … »), puis seul.
#
# Sortie : brut/index-ajouts.json et brut/geometrie-ajouts.bin, au format de 01_exporter.py (repère de Blender : x vers
# la gauche du sujet, y vers l'arrière, z vers le haut, en mètres), et donnees/ajouts-textes.json (les textes des
# descriptions, pour les fiches).
# Lancer : python3 -I 01d_ajouts.py            (tout)
#          python3 -I 01d_ajouts.py --verifier [fichier…]   (contrôle les descriptions sans rien écrire)
#          python3 -I 01d_ajouts.py --apercu fichier…       (construit à part, dans /tmp/m1/apercu, pour un aperçu)
import glob, hashlib, json, math, os, re, sys
from importlib import import_module

import numpy as np

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
from commun import BRUT, objets_bruts, sommets

traces = import_module("01c_traces")
catmull, spline, maillage, longueur = traces.catmull, traces.spline, traces.maillage, traces.longueur

SOURCE = "L'Écorché (construit d'après les structures voisines de Z-Anatomy)"
BISEAU = traces.BISEAU
AJOUTS = os.path.join(ICI, "donnees", "ajouts")

bruts = {o["nom"]: o for o in objets_bruts() if o.get("source") in (None, "BodyParts3D", traces.SOURCE)}
par_base = {}
for n in bruts:
    par_base.setdefault(re.sub(r"\.\d{3}$", "", n).strip(), n)

COLLECTIONS = {
    "artere": (["5: Cardiovascular system", "Systemic arteries"], ["Artery"]),
    "veine": (["5: Cardiovascular system", "Systemic veins"], ["Vein"]),
    "nerf": (["7: Nervous system & Sense organs", "Peripheral nervous system"], ["Nerve"]),
    "lymphe": (["6: Lymphoid organs", "Lymph nodes"], ["Lymph node"]),
    "ligament": (["3: Joints", "Ligaments"], ["Ligament"]),
    "muscle": (["4: Muscular system", "Muscles"], ["Muscle"]),
    "os": (["1: Skeletal system", "Bones"], ["Bone"]),
    "viscere": (["8: Visceral systems"], ["Organ"]),
    "sens": (["7: Nervous system & Sense organs", "Sense organs"], ["Sense organ"]),
    "encephale": (["7: Nervous system & Sense organs", "Central nervous system"], ["Brain"]),
}
REGIONS = {"Head", "Neck", "Trunk", "Thorax", "Abdomen", "Pelvis", "Back", "Left upper limb", "Right upper limb", "Left lower limb", "Right lower limb", "Left hand", "Right hand", "Left foot", "Right foot"}


class Erreur(Exception):
    pass


# ---------------------------------------------------------------- les objets du modèle


def nom_objet(nom, cote):
    """Le nom exact d'un objet de l'atlas, du côté voulu quand il en a deux."""
    gauche = cote == "l"
    essais = []
    if cote:
        cote_mot = "Left" if gauche else "Right"
        essais += [f"{nom}.{cote}", f"{cote_mot} {nom[0].lower() + nom[1:]}", f"{cote_mot} {nom}", f"{cote_mot} {nom[0].lower() + nom[1:]}.{cote}", f"{cote_mot} {nom}.{cote}"]
    essais += [nom, f"{nom}.l" if not cote else None]
    for e in essais:
        if e and e in par_base:
            return par_base[e]
    raise Erreur(f"objet introuvable : « {nom} »" + (f" (côté {cote})" if cote else ""))


_cache = {}


def geometrie(nom):
    """(points, rayons ou None, axe principal) d'un objet : une courbe donne son tracé, un maillage ses sommets."""
    if nom in _cache:
        return _cache[nom]
    o = bruts[nom]
    if o["type"] == "CURVE" and o.get("courbe"):
        if nom in traces.bruts:
            A = traces.axes(nom)
        else:
            A = [(np.array([p[:3] for p in s["points"]], dtype=np.float64), np.array([p[3] for p in s["points"]]) * o["courbe"]["bevel"]) for s in o["courbe"]["splines"]]
        P = np.concatenate([a[0] for a in A])
        axe = max(A, key=lambda a: longueur(a[0]))
        r = (P, np.concatenate([a[1] for a in A]), axe)
    else:
        P = sommets(o).astype(np.float64)
        if len(P) == 0:
            raise Erreur(f"objet sans géométrie : « {nom} »")
        c = P.mean(0)
        _, _, V = np.linalg.svd(P - c, full_matrices=False)
        d = V[0] if V[0][2] >= 0 else -V[0]
        t = (P - c) @ d
        # le grand axe, du bas vers le haut (ou de la gauche vers la droite s'il est horizontal)
        axe = (np.linspace(c + d * t.min(), c + d * t.max(), 24), None)
        r = (P, None, axe)
    _cache[nom] = r
    return r


def ancres_reperes():
    """Les reliefs nommés de Z-Anatomy : l'ancre de chaque trait d'étiquette, au bout opposé au texte."""
    sortie = {}
    for o in bruts.values():
        if o["type"] != "MESH" or not re.search(r"\.[ji]$", o["nom"]) or o.get("sommets", 0) < 2:
            continue
        P = sommets(o).astype(np.float64)
        t = bruts.get(o.get("parent") or "")
        a = P[0]
        if t and t.get("position"):
            q = np.array(t["position"], dtype=np.float64)
            a = P[int(np.argmax(((P - q) ** 2).sum(1)))]
        base = re.sub(r"\.[ji]$", "", o["nom"]).strip()
        sortie.setdefault(base, []).append(a)
    return sortie


ANCRES = ancres_reperes()


def signe(cote):
    return -1.0 if cote == "r" else 1.0


def point(spec, cote, avant=None):
    """Un point (repère de Blender, en mètres) d'après sa description."""
    s = signe(cote)
    if "repere" in spec:
        A = ANCRES.get(spec["repere"])
        if not A:
            raise Erreur(f"relief introuvable : « {spec['repere']} »")
        A = np.array(A)
        # du côté voulu : le plus latéral de ce côté ; un relief médian n'a qu'une ancre
        q = A[np.argmax(A[:, 0] * s)] if cote else A[np.argmin(np.abs(A[:, 0]))]
        if cote and q[0] * s < -0.004 and len(A) == 1:
            q = q * np.array([-1.0, 1.0, 1.0])
    else:
        nom = nom_objet(spec["objet"], cote)
        P, R, axe = geometrie(nom)
        lo, hi = P.min(0), P.max(0)
        c, h = (lo + hi) / 2, (hi - lo) / 2
        mediane = abs(c[0]) < max(0.6 * h[0], 0.004)
        if "a" in spec:
            A = axe[0]
            seg = np.linalg.norm(np.diff(A, axis=0), axis=1)
            cum = np.concatenate([[0.0], np.cumsum(seg)])
            t = float(spec["a"]) * cum[-1]
            i = int(np.clip(np.searchsorted(cum, t) - 1, 0, len(A) - 2))
            f = (t - cum[i]) / max(seg[i], 1e-9)
            q = A[i] * (1 - f) + A[i + 1] * f
        elif "rel" in spec:
            u, v, w = spec["rel"]
            if mediane:
                x = c[0] + s * u * h[0]
            else:
                # u : du bord médial (−1) au bord latéral (1) de l'objet de ce côté
                med, lat = (lo[0], hi[0]) if c[0] > 0 else (hi[0], lo[0])
                x = (med + lat) / 2 + u * (lat - med) / 2
            q = np.array([x, c[1] - w * h[1], c[2] + v * h[2]])
        elif spec.get("proche"):
            if avant is None:
                raise Erreur("« proche » sans point précédent")
            q = P[int(np.argmin(((P - avant) ** 2).sum(1)))]
        elif spec.get("centre"):
            q = P.mean(0)
        elif "bord" in spec:
            dx = 1.0 if c[0] >= 0 else -1.0
            d = {"superieur": [0, 0, 1], "inferieur": [0, 0, -1], "anterieur": [0, -1, 0], "posterieur": [0, 1, 0], "medial": [-dx, 0, 0], "lateral": [dx, 0, 0]}[spec["bord"]]
            k = P @ np.array(d, dtype=np.float64)
            q = P[k >= np.quantile(k, 0.97)].mean(0)
        else:
            raise Erreur(f"point sans position : {spec}")
    q = np.array(q, dtype=np.float64)
    if "decale" in spec:
        l, hh, a = spec["decale"]
        dehors = s if cote else (1.0 if q[0] >= 0 else -1.0)
        q = q + np.array([dehors * l, -a, hh]) / 1000.0
    return q


def points(specs, cote):
    sortie = []
    for sp in specs:
        sortie.append(point(sp, cote, sortie[-1] if sortie else None))
    return sortie


def regions_de(specs, cote):
    cols = set()
    for sp in specs[::-1]:
        if "objet" in sp:
            try:
                cols |= set(bruts[nom_objet(sp["objet"], cote)]["collections"]) & REGIONS
            except Erreur:
                pass
            if cols:
                break
    return sorted(cols)


# ---------------------------------------------------------------- les formes


def forme_trace(d, cote):
    """Une ou plusieurs branches : chaque tracé est une courbe lisse par ses points."""
    chemins = d.get("traces") or [d["points"]]
    rayons = d.get("rayon", [1.0, 0.6])
    splines, tous = [], []
    for ch in chemins:
        C = points(ch, cote)
        r0, r1 = (rayons if not isinstance(rayons[0], list) else rayons[len(splines)])[:2]
        R = np.linspace(r0, r1, len(C)) * 2.0  # en demi-millimètres
        splines.append(spline(C, R, pas=min(0.004, max(0.0015, longueur(np.array(C)) / 12)), lisse=2))
        tous += ch
    return splines, tous


def perpendiculaire(t, prefere):
    u = np.cross(t, prefere)
    if np.linalg.norm(u) < 1e-6:
        u = np.cross(t, [1.0, 0.0, 0.0])
    return u / np.linalg.norm(u)


def forme_satellite(d, cote):
    """Les veines satellites : l'axe de l'artère, décalé d'un côté et de l'autre."""
    nom = nom_objet(d["suit"], cote)
    P, R, axe = geometrie(nom)
    A = axe[0]
    seg = np.linalg.norm(np.diff(A, axis=0), axis=1)
    cum = np.concatenate([[0.0], np.cumsum(seg)]) / max(seg.sum(), 1e-9)
    de, a = d.get("de", 0.0), d.get("a", 1.0)
    garde = (cum >= de - 1e-9) & (cum <= a + 1e-9)
    B = A[garde]
    if len(B) < 2:
        raise Erreur(f"satellite trop court sur « {nom} »")
    ra = axe[1][garde] if axe[1] is not None else np.full(len(B), 0.002)
    tan = np.gradient(B, axis=0)
    tan /= np.linalg.norm(tan, axis=1, keepdims=True) + 1e-12
    n = d.get("nombre", 2)
    ecart = d.get("ecart_mm", 0.0) / 1000.0
    rv = d.get("rayon", [1.0, 0.6])
    splines = []
    for k in range(n):
        signe_k = 1.0 if (n == 1 or k == 0) else -1.0
        C = []
        for i in range(len(B)):
            u = perpendiculaire(tan[i], [0.0, -1.0, 0.0])  # dans le plan frontal : de part et d'autre de l'artère
            C.append(B[i] + signe_k * u * (ra[i] + ecart + rv[0] / 1000.0))
        C = np.array(C)[:: max(1, len(C) // 14)]
        if len(C) < 2:
            C = np.array([B[0], B[-1]])
        splines.append(spline(C, np.linspace(rv[0], rv[1], len(C)) * 2.0, pas=0.004, lisse=2))
    return splines, [{"objet": d["suit"]}]


def forme_plexus(d, cote):
    """Un réseau : des rameaux fins enroulés autour d'un axe (un vaisseau), reliés de place en place."""
    graine = int(hashlib.md5((d["nom"] + (cote or "m")).encode()).hexdigest()[:8], 16)
    hasard = np.random.default_rng(graine)
    if "autour" in d:
        sp = d["autour"]
        nom = nom_objet(sp["objet"], cote)
        P, R, axe = geometrie(nom)
        A = axe[0]
        seg = np.linalg.norm(np.diff(A, axis=0), axis=1)
        cum = np.concatenate([[0.0], np.cumsum(seg)]) / max(seg.sum(), 1e-9)
        B = A[(cum >= sp.get("de", 0.0) - 1e-9) & (cum <= sp.get("a", 1.0) + 1e-9)]
        if len(B) < 2:
            i = int(np.argmin(np.abs(cum - sp.get("de", 0.0))))
            B = A[max(0, i - 1) : i + 2]
        ra = 0.003 if axe[1] is None else float(np.mean(axe[1]))
        refs = [sp]
    else:
        C = points(d["le_long"], cote) if "le_long" in d else [point(d["en"], cote)]
        if len(C) == 1:
            t = np.array([0.0, 0.0, 1.0])
            demi = d.get("etendue_mm", 10) / 2000.0
            C = [C[0] - t * demi, C[0] + t * demi]
        B = catmull(C, n=6)
        ra = 0.0
        refs = d.get("le_long") or [d["en"]]
    tan = np.gradient(B, axis=0)
    tan /= np.linalg.norm(tan, axis=1, keepdims=True) + 1e-12
    ecart = ra + d.get("ecart_mm", 3.0) / 1000.0
    brins = d.get("brins", 4)
    r = d.get("rayon", 0.35)
    splines = []
    tours = max(0.5, min(3.0, longueur(B) / 0.03))
    for b in range(brins):
        phase = 2 * math.pi * b / brins + hasard.uniform(-0.3, 0.3)
        C = []
        for i in range(len(B)):
            u = perpendiculaire(tan[i], [0.0, 0.0, 1.0] if abs(tan[i][2]) < 0.9 else [1.0, 0.0, 0.0])
            v = np.cross(tan[i], u)
            a = phase + tours * 2 * math.pi * i / max(1, len(B) - 1) * (1 if b % 2 == 0 else -1)
            e = ecart * (1 + 0.25 * hasard.uniform(-1, 1))
            C.append(B[i] + e * (math.cos(a) * u + math.sin(a) * v))
        C = np.array(C)[:: max(1, len(C) // 16)]
        splines.append(spline(C, np.full(len(C), r * 2.0), pas=0.003, lisse=1))
    return splines, refs


def ellipsoide(c, axes, n=10, m=7, rot=None):
    P, T = [], []
    for i in range(m + 1):
        th = math.pi * i / m
        for j in range(n):
            ph = 2 * math.pi * j / n
            p = np.array([math.sin(th) * math.cos(ph) * axes[0], math.sin(th) * math.sin(ph) * axes[1], math.cos(th) * axes[2]])
            P.append(c + (rot @ p if rot is not None else p))
    for i in range(m):
        for j in range(n):
            a, b = i * n + j, i * n + (j + 1) % n
            T.append((a, a + n, b))
            T.append((b, a + n, b + n))
    return np.array(P), np.array(T)


def repere_oriente(direction):
    z = np.asarray(direction, dtype=np.float64)
    z = z / (np.linalg.norm(z) + 1e-12)
    x = perpendiculaire(z, [0.0, -1.0, 0.0])
    y = np.cross(z, x)
    return np.stack([x, y, z], axis=1)


def forme_ganglion(d, cote):
    c = point(d["en"], cote)
    a, b, h = [x / 2000.0 for x in d.get("taille_mm", [4, 4, 8])]
    rot = None
    if "vers" in d:
        rot = repere_oriente(point(d["vers"], cote) - c)
    P, T = ellipsoide(c, (a, b, h), rot=rot)
    return (P, T), [d["en"]]


def forme_noeuds(d, cote):
    Ps, Ts, base = [], [], 0
    for k, sp in enumerate(d["en"]):
        c = point(sp, cote)
        t = d.get("taille_mm", 5) / 2000.0
        graine = int(hashlib.md5(f"{d['nom']}{cote}{k}".encode()).hexdigest()[:8], 16) % 1000 / 1000.0
        P, T = ellipsoide(c, (t * (1.15 + 0.2 * graine), t * 0.8, t * (0.9 + 0.3 * graine)), n=8, m=5)
        Ps.append(P)
        Ts.append(T + base)
        base += len(P)
    return (np.concatenate(Ps), np.concatenate(Ts)), d["en"]


def ruban(C, largeur, epaisseur, profil=None, normale=None):
    """Un ruban (ligament) ou un fuseau (muscle) le long des points C : une section elliptique aplatie."""
    D = catmull(C, n=8)
    D, _ = traces.reechantillonner(D, max(0.0015, longueur(D) / 24))
    n = len(D)
    tan = np.gradient(D, axis=0)
    tan /= np.linalg.norm(tan, axis=1, keepdims=True) + 1e-12
    pref = np.asarray(normale if normale is not None else [0.0, -1.0, 0.0], dtype=np.float64)
    P, T, cotes = [], [], 10
    for i in range(n):
        t = i / max(1, n - 1)
        f = profil(t) if profil else 1.0
        nrm = pref - tan[i] * (pref @ tan[i])
        if np.linalg.norm(nrm) < 1e-6:
            nrm = perpendiculaire(tan[i], [1.0, 0.0, 0.0])
        nrm /= np.linalg.norm(nrm)
        lat = np.cross(tan[i], nrm)
        for j in range(cotes):
            a = 2 * math.pi * j / cotes
            P.append(D[i] + lat * math.cos(a) * largeur / 2 * f + nrm * math.sin(a) * epaisseur / 2 * max(f, 0.35))
    for i in range(n - 1):
        for j in range(cotes):
            a, b = i * cotes + j, i * cotes + (j + 1) % cotes
            T.append((a, b, a + cotes))
            T.append((b, b + cotes, a + cotes))
    # les deux bouts fermés
    for bout, signe_b in ((0, 1), (n - 1, -1)):
        c = len(P)
        P.append(D[bout])
        for j in range(cotes):
            a, b = bout * cotes + j, bout * cotes + (j + 1) % cotes
            T.append((c, b, a) if signe_b > 0 else (c, a, b))
    return np.array(P), np.array(T)


def normale_de(d, cote, C):
    if "face" in d:
        q = point(d["face"], cote)
        m = np.mean(C, axis=0)
        return q - m
    return None


def forme_bande(d, cote):
    specs = [d["de"]] + d.get("par", []) + [d["a"]]
    C = points(specs, cote)
    w, e = d.get("largeur_mm", 5) / 1000.0, d.get("epaisseur_mm", 1.2) / 1000.0
    return ruban(C, w, e, profil=lambda t: 0.85 + 0.3 * math.sin(math.pi * t), normale=normale_de(d, cote, C)), specs


def forme_fuseau(d, cote):
    specs = [d["de"]] + d.get("par", []) + [d["a"]]
    C = points(specs, cote)
    w, e = d.get("largeur_mm", 8) / 1000.0, d.get("epaisseur_mm", 3) / 1000.0
    return ruban(C, w, e, profil=lambda t: 0.3 + 0.7 * math.sin(math.pi * t) ** 0.8, normale=normale_de(d, cote, C)), specs


def forme_coupe(d, cote):
    """Une courbe de Z-Anatomy gardée jusqu'à la hauteur d'un point (l'anneau inguinal profond…)."""
    nom = nom_objet(d["objet"], cote)
    o = bruts[nom]
    z = point(d["jusqua"], cote)[2]
    splines = []
    for s in o["courbe"]["splines"]:
        pts = [p for p in s["points"] if p[2] >= z]
        if len(pts) >= 2:
            splines.append({**s, "points": pts})
    if not splines:
        raise Erreur(f"rien au-dessus du point de coupe sur « {nom} »")
    return splines, [{"objet": d["objet"]}], o["courbe"]["bevel"]


def forme_spirale(d, cote):
    """La cochlée : un tube enroulé sur deux tours trois quarts autour du modiolus, de la base vers l'apex."""
    c = point(d["en"], cote)
    axe = point(d["axe"], cote) - c if "axe" in d else np.array([signe(cote) * 0.3, -0.8, 0.5])
    rot = repere_oriente(axe)
    r_base, hauteur, tours = d.get("rayon_mm", 4.5) / 1000.0, d.get("hauteur_mm", 5.0) / 1000.0, d.get("tours", 2.75)
    C = []
    for k in range(80):
        t = k / 79
        a = 2 * math.pi * tours * t
        r = r_base * (1 - 0.72 * t)
        C.append(c + rot @ np.array([r * math.cos(a), signe(cote) * r * math.sin(a), hauteur * t]))
    R = np.linspace(d.get("tube_mm", [1.0, 0.45])[0], d.get("tube_mm", [1.0, 0.45])[1], len(C)) * 2.0
    return [spline(np.array(C), R, pas=0.0008, lisse=0)], [d["en"]]


def forme_anneaux(d, cote):
    """Les conduits semi-circulaires : trois anneaux presque à angle droit, partant du vestibule."""
    c = point(d["en"], cote)
    s = signe(cote)
    r = d.get("rayon_mm", 3.2) / 1000.0
    plans = {
        # (axe autour duquel l'anneau tourne, direction où il s'élève depuis le vestibule)
        "Anterior semicircular duct": (np.array([s * 0.7, -0.7, 0.0]), np.array([s * 0.2, -0.6, 0.8])),
        "Posterior semicircular duct": (np.array([s * 0.7, 0.7, 0.0]), np.array([s * 0.3, 0.7, 0.6])),
        "Lateral semicircular duct": (np.array([0.0, 0.0, 1.0]), np.array([s * 0.8, 0.2, 0.0])),
    }
    splines = []
    for nom, (n, dirc) in plans.items():
        n = n / np.linalg.norm(n)
        dirc = dirc - n * (dirc @ n)
        dirc /= np.linalg.norm(dirc)
        centre = c + dirc * r
        u = -dirc
        v = np.cross(n, u)
        C = [centre + r * (math.cos(a) * u + math.sin(a) * v) for a in np.linspace(0.15, 2 * math.pi - 0.15, 40)]
        splines.append(spline(np.array(C), np.full(len(C), d.get("tube_mm", 0.4) * 2.0), pas=0.0008, lisse=0))
    return splines, [d["en"]]


# La sorte d'une pièce (étape 2) d'après sa couche et sa forme, quand la description ne la dit pas.
SORTES = {("nerf", "ganglion"): "ganglion", ("lymphe", "noeuds"): "noeud", ("viscere", "spirale"): "sens", ("viscere", "anneaux"): "sens", ("encephale", "ganglion"): "encephale", ("os", "ganglion"): "os"}

FORMES = {"trace": forme_trace, "satellite": forme_satellite, "plexus": forme_plexus, "ganglion": forme_ganglion, "noeuds": forme_noeuds, "bande": forme_bande, "fuseau": forme_fuseau, "coupe": forme_coupe, "spirale": forme_spirale, "anneaux": forme_anneaux}
COURBES = {"trace", "satellite", "plexus", "coupe", "spirale", "anneaux"}


def cotes_de(d):
    c = d.get("cotes", "deux")
    return {"deux": ["l", "r"], "gauche": ["l"], "droite": ["r"], "milieu": [None]}[c]


def construire(d, cote):
    """→ (type, géométrie, collections, matières, courbe ou None)."""
    forme = d["forme"]
    if forme not in FORMES:
        raise Erreur(f"forme inconnue : {forme}")
    r = FORMES[forme](d, cote)
    couche = d["couche"]
    cols, mats = COLLECTIONS["sens" if forme in ("spirale", "anneaux") else couche]
    if couche == "encephale":
        cols = cols + ["Brain", "Head"]
    if forme in COURBES:
        splines, refs = r[0], r[1]
        bevel = r[2] if len(r) > 2 else BISEAU
        if bevel != BISEAU:
            # la coupe garde le biseau de son objet : on remet les rayons à l'échelle commune
            splines = [{**s, "points": [p[:3] + [round(p[3] * bevel / BISEAU, 3)] + p[4:] for p in s["points"]]} for s in splines]
        P, T = maillage(splines)
        courbe = {"bevel": BISEAU, "bevel_res": 4, "objet_bevel": None, "taper": None, "extrude": 0.0, "mode": "ROUND", "res": 12, "splines": splines}
        return "CURVE", (P.astype(np.float32), T.astype(np.uint32)), cols + regions_de(refs, cote), mats, courbe
    (P, T), refs = r
    return "MESH", (P.astype(np.float32), T.astype(np.uint32)), cols + regions_de(refs, cote), mats, None


def descriptions(fichiers=None):
    fichiers = fichiers or sorted(glob.glob(os.path.join(AJOUTS, "*.json")))
    sortie = []
    for f in fichiers:
        try:
            d = json.load(open(f, encoding="utf-8"))
        except (OSError, ValueError) as ex:
            print(f"✗ {os.path.basename(f)} illisible : {ex}")
            continue
        for x in d.get("structures", []):
            x["_lot"] = os.path.basename(f)
            sortie.append(x)
    return sortie


def controler(d, P, cote):
    """Quelques garde-fous : un point hors du corps, un tracé démesuré."""
    defauts = []
    lo, hi = P.min(0), P.max(0)
    if lo[2] < -0.02 or hi[2] > 1.95 or abs(lo[0]) > 0.95 or abs(hi[0]) > 0.95:
        defauts.append("hors du corps")
    taille = float(np.linalg.norm(hi - lo))
    if d["forme"] in ("ganglion", "noeuds") and taille > 0.25:
        defauts.append(f"trop étendu ({100 * taille:.0f} cm)")
    if d["forme"] in ("bande", "fuseau") and taille > 0.6:
        defauts.append(f"trop long ({100 * taille:.0f} cm)")
    if d["forme"] in ("bande", "fuseau", "trace") and taille < 0.002:
        defauts.append("de longueur nulle")
    return defauts


if __name__ == "__main__":
    verifier = "--verifier" in sys.argv
    apercu = "--apercu" in sys.argv
    fichiers = [a for a in sys.argv[1:] if not a.startswith("--")]
    descs = descriptions(fichiers or None)
    objets, textes, erreurs = [], {}, 0
    vus = set()
    # (--apercu : les seules structures des fichiers donnés, à part, pour voir.py ; la chaîne n'y touche pas)
    dossier = "/tmp/m1/apercu" if apercu else BRUT
    os.makedirs(dossier, exist_ok=True)
    nom_sortie = ("-".join(os.path.basename(x)[:-5] for x in fichiers) or "tout") if apercu else "ajouts"
    sortie_bin = os.path.join(dossier, f"geometrie-{nom_sortie}.bin")
    f = open(os.devnull if verifier else sortie_bin, "wb")
    position = 0
    for d in descs:
        if d["nom"] in vus:
            print(f"✗ {d['_lot']} : « {d['nom']} » décrit deux fois")
            erreurs += 1
            continue
        vus.add(d["nom"])
        for cote in cotes_de(d):
            try:
                typ, (P, T), cols, mats, courbe = construire(d, cote)
            except (Erreur, KeyError, IndexError, ValueError, TypeError) as ex:
                print(f"✗ {d['_lot']} : « {d['nom']} » ({cote or 'milieu'}) : {ex}")
                erreurs += 1
                continue
            defauts = controler(d, P, cote)
            if defauts:
                print(f"✗ {d['_lot']} : « {d['nom']} » ({cote or 'milieu'}) : {', '.join(defauts)}")
                erreurs += 1
                continue
            nom = f"{d['nom']}.{cote}" if cote else d["nom"]
            o_s = position
            octets = P.tobytes() + T.tobytes()
            o_t = o_s + P.nbytes
            o_m = o_s + len(octets)
            f.write(octets)
            f.write(np.zeros(len(T), dtype=np.uint8).tobytes())
            position = o_m + len(T)
            o = {"nom": nom, "type": typ, "collections": cols, "parent": None, "mats": mats, "mods": [], "sommets": int(len(P)), "triangles": int(len(T)), "o_sommets": o_s, "o_triangles": o_t, "o_matieres": o_m, "source": SOURCE}
            if courbe:
                o["courbe"] = courbe
            # La couche et la sorte sont dites par la description : l'étape 2 n'a pas à les deviner.
            o["couche"] = d["couche"]
            o["sorte"] = d.get("sorte") or SORTES.get((d["couche"], d["forme"])) or d["couche"]
            if d.get("pudeur_ok"):
                o["pudeur_ok"] = True
            objets.append(o)
        if d.get("texte"):
            textes[d["nom"]] = {"couche": d["couche"], "texte": d["texte"], "lot": d["_lot"], **({"sources": d["sources"]} if d.get("sources") else {})}
    f.close()
    if verifier:
        print(f"{len(descs)} descriptions, {len(objets)} objets, {erreurs} erreur(s)")
        sys.exit(1 if erreurs else 0)
    with open(os.path.join(dossier, f"index-{nom_sortie}.json"), "w", encoding="utf-8") as g:
        json.dump({"source": SOURCE, "blender": None, "geometrie": f"geometrie-{nom_sortie}.bin", "objets": objets}, g, ensure_ascii=False, indent=1)
    if not apercu:
        with open(os.path.join(ICI, "donnees", "ajouts-textes.json"), "w", encoding="utf-8") as g:
            json.dump(textes, g, ensure_ascii=False, indent=1)
    print(f"écrit : {len(objets)} objets ({len(descs)} descriptions), {erreurs} erreur(s)")
