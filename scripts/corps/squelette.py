# L'Écorché — le squelette articulé : ses segments, et les centres et axes des articulations mesurés sur les os.
#
# Un segment est un groupe d'os qui bougent d'un bloc (le fémur ; le tibia et la fibula ; chaque vertèbre ; chaque
# phalange…). Les segments forment un arbre dont le bassin est la racine. Les segments du milieu du corps portent
# les premiers numéros ; viennent ensuite ceux du côté gauche, puis, dans le même ordre, ceux du côté droit : une
# pièce dessinée en miroir n'a qu'à ajouter NB_LATERAUX aux numéros latéraux de ses sommets.
#
# Les centres et les axes ne sont pas saisis à la main : ils sont mesurés sur la géométrie (une sphère ajustée sur
# la tête du fémur, un cercle sur la trochlée de l'humérus, les pointes des malléoles, le noyau de chaque disque…).
# Repère : mètres, y vers le haut, x vers la gauche du sujet, z vers l'avant.
import json, os, re
import numpy as np
from scipy.spatial import cKDTree
from commun import DONNEES, decouper

GEO = os.path.join(DONNEES, "geo")

ORDINAUX = {"first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "sixth": 6, "seventh": 7, "eighth": 8, "ninth": 9, "tenth": 10, "eleventh": 11, "twelfth": 12}
RANG = {v: k for k, v in ORDINAUX.items()}
DOIGTS = {2: "index", 3: "majeur", 4: "annulaire", 5: "auriculaire"}

AXIAUX = ["bassin"] + [f"l{i}" for i in (5, 4, 3, 2, 1)] + [f"t{i}" for i in range(12, 0, -1)] + [f"c{i}" for i in (7, 6, 5, 4, 3)] + ["axis", "atlas", "tete", "mandibule", "hyoide", "sternum"]
LATERAUX = (
    [f"cote-{i}" for i in range(1, 13)]
    + ["clavicule", "scapula", "humerus", "ulna", "radius", "main", "pouce-mc", "pouce-p1", "pouce-p2"]
    + [f"{d}-p{k}" for d in DOIGTS.values() for k in (1, 2, 3)]
    + ["femur", "patella", "jambe", "talus", "pied", "hallux-p1", "hallux-p2"]
    + [f"orteil{n}-p{k}" for n in (2, 3, 4, 5) for k in (1, 2, 3)]
    + ["oeil"]
)
NB_AXIAUX, NB_LATERAUX = len(AXIAUX), len(LATERAUX)
NB_SEGMENTS = NB_AXIAUX + 2 * NB_LATERAUX


def parent_de(s):
    """Le segment qui porte celui-ci (None pour le bassin)."""
    if s == "bassin":
        return None
    chaine = AXIAUX[: AXIAUX.index("tete") + 1]
    if s in chaine:
        return chaine[chaine.index(s) - 1]
    if s == "mandibule":
        return "tete"
    if s == "hyoide":
        return "c3"
    if s == "sternum":
        return "t7"  # en réalité porté par les côtes : le moteur le place entre T3 et T10 (voir PONTS)
    m = re.match(r"cote-(\d+)$", s)
    if m:
        return f"t{m.group(1)}"
    m = re.match(r"(\w+)-p(\d)$", s)
    if m:
        doigt, k = m.group(1), int(m.group(2))
        if k > 1:
            return f"{doigt}-p{k - 1}"
        return "pouce-mc" if doigt == "pouce" else "main" if doigt in DOIGTS.values() else "pied"
    return {"clavicule": "sternum", "scapula": "clavicule", "humerus": "scapula", "ulna": "humerus", "radius": "ulna", "main": "radius", "pouce-mc": "main",
            "femur": "bassin", "patella": "femur", "jambe": "femur", "talus": "jambe", "pied": "talus", "oeil": "tete"}[s]


# Un segment porté par deux autres à la fois : il se place à mi-chemin de ce que chacun lui ferait faire.
PONTS = {"sternum": ("t3", "t10")}


def numero(segment, cote="g"):
    """Le numéro d'un segment : les axiaux, puis les gauches, puis les droits."""
    if segment in AXIAUX:
        return AXIAUX.index(segment)
    return NB_AXIAUX + LATERAUX.index(segment) + (NB_LATERAUX if cote == "d" else 0)


def segment_de(objet):
    """Le segment d'un os (ou d'un cartilage, d'une dent, d'une pièce de l'œil), d'après le nom de l'objet.
    Rend (segment, côté) ; pour un cartilage costal : (("cartilage", n), côté) ; None si la pièce n'est pas rigide."""
    base, suff = decouper(objet)
    n = base.lower().strip()
    cote = "d" if suff == "r" else "g"
    m = re.match(r"vertebra ([ctl])(\d+)$", n)
    if m:
        return f"{m.group(1)}{m.group(2)}", cote
    if n.startswith("atlas"):
        return "atlas", cote
    if n.startswith("axis"):
        return "axis", cote
    if n in ("sacrum", "coccyx", "hip bone"):
        return "bassin", cote
    if n in ("manubrium of sternum", "body of sternum", "xiphoid process"):
        return "sternum", cote
    m = re.match(r"(\w+) rib$", n)
    if m:
        return f"cote-{ORDINAUX[m.group(1)]}", cote
    m = re.match(r"costal cartilage of (\w+) rib$", n)
    if m:
        return ("cartilage", ORDINAUX[m.group(1)]), cote
    if n == "mandible" or re.match(r"lower .*(incisor|canine|premolar|molar)", n):
        return "mandibule", cote
    if n in ("hyoid bone", "thyroid cartilage", "cricoid cartilage", "arytenoid cartilage", "corniculate cartilage"):
        return "hyoide", cote
    simples = {"clavicle": "clavicule", "scapula": "scapula", "humerus": "humerus", "ulna": "ulna", "radius": "radius", "femur": "femur", "patella": "patella", "tibia": "jambe", "fibula": "jambe", "talus": "talus"}
    if n in simples:
        return simples[n], cote
    m = re.match(r"(proximal|middle|distal) phalanx of (\w+) finger of (hand|foot)$", n)
    if m:
        k = {"proximal": 1, "middle": 2, "distal": 3}[m.group(1)]
        d = ORDINAUX[m.group(2)]
        if d == 1:
            return ("pouce" if m.group(3) == "hand" else "hallux") + f"-p{min(k, 2) if k < 3 else 2}", cote
        return (f"{DOIGTS[d]}-p{k}" if m.group(3) == "hand" else f"orteil{d}-p{k}"), cote
    if n == "first metacarpal bone":
        return "pouce-mc", cote
    if re.search(r"metacarpal bone$|^(scaphoid|lunate|triquetrum|pisiform|trapezium|trapezoid|capitate|hamate) bone$", n):
        return "main", cote
    if re.search(r"metatarsal bone$|^(calcaneus|navicular bone|cuboid bone|\w+ cuneiform bone|sesamoid bones of foot)$", n):
        return "pied", cote
    if n in ("sclera", "cornea", "iris", "lens", "vitreous body", "retina", "zonular fibres", "anterior chamber of eyeball", "anterior segment of eyeball", "posterior segment of eyeball"):
        return "oeil", cote
    return None


def os_de_la_tete(objet):
    base, _ = decouper(objet)
    return bool(re.search(r"^(parietal|frontal|occipital|nasal|ethmoid|lacrimal|temporal|sphenoid|zygomatic|palatine) bone$|^(maxilla|vomer|incus|malleus|stapes)$|nasal concha|nasal septal cartilage|alar cartilage|^upper ", base.lower().strip()))


# ---------------------------------------------------------------- la géométrie des os

_index = None
_cache = {}


def points(objet, lod=0):
    """Les sommets d'un objet (au niveau le plus fin disponible)."""
    global _index
    if _index is None:
        _index = {e["objet"]: e["cle"] for e in json.load(open(os.path.join(GEO, "index.json"), encoding="utf-8"))}
    if (objet, lod) not in _cache:
        P = None
        for l in (lod, 1, 2):
            f = os.path.join(GEO, f"lod{l}", _index.get(objet, "?") + ".npz")
            if os.path.exists(f):
                P = np.load(f)["P"].astype(np.float64)
                break
        if P is None:
            raise SystemExit(f"objet introuvable : {objet}")
        _cache[(objet, lod)] = P
    return _cache[(objet, lod)]


def maillage(objet):
    """Les sommets et les normales d'un objet, au niveau le plus fin disponible."""
    points(objet)
    for l in (0, 1, 2):
        f = os.path.join(GEO, f"lod{l}", _index.get(objet, "?") + ".npz")
        if os.path.exists(f):
            d = np.load(f)
            return d["P"].astype(np.float64), d["N"].astype(np.float64)


def tourner_nuage(P, pivot, axe, degres):
    a = unite(axe)
    t = np.radians(degres)
    v = P - pivot
    return pivot + v * np.cos(t) + np.cross(a, v) * np.sin(t) + np.outer(v @ a, a) * (1 - np.cos(t))


def ajuster(mobiles, fixes, p0, d0, angles, d_contact=0.005, libre=0.08):
    """Affine une charnière en la faisant jouer : on cherche l'axe autour duquel la surface articulaire de l'os
    mobile glisse sur celle de l'os fixe sans s'en écarter ni y entrer, tout au long du mouvement.
    Rend (centre, direction, écart moyen de l'interligne en mètres, écart avant l'ajustement)."""
    from scipy.optimize import minimize
    Pm = np.concatenate([maillage(m)[0] for m in mobiles])
    Pf = np.concatenate([maillage(f)[0] for f in fixes])
    Nf = np.concatenate([maillage(f)[1] for f in fixes])
    arbre = cKDTree(Pf)
    C = Pm[arbre.query(Pm, distance_upper_bound=d_contact)[0] < np.inf]
    if len(C) < 20:
        return np.asarray(p0), unite(d0), -1.0, -1.0
    if len(C) > 500:
        C = C[np.random.default_rng(0).choice(len(C), 500, replace=False)]

    def interligne(Q):
        dist, i = arbre.query(Q)
        return np.where(np.einsum("ij,ij->i", Q - Pf[i], Nf[i]) < 0, -dist, dist)

    repos = np.clip(interligne(C), 0, None)
    d0 = unite(d0)
    u0, v0 = base_perp(d0)

    def cout(x):
        d = unite(d0 + x[0] * u0 + x[1] * v0)
        p = p0 + x[2] * u0 + x[3] * v0
        total = 0.0
        for a in angles:
            g = interligne(tourner_nuage(C, p, d, a))
            e = np.abs(g - repos)
            total += float(np.mean(np.where(g < 0, 3 * np.abs(g) + e, e)))  # entrer dans l'os coûte triple
        return total / len(angles)

    avant = cout(np.zeros(4))
    r = minimize(cout, np.zeros(4), method="Nelder-Mead", options={"xatol": 1e-4, "fatol": 1e-7, "maxiter": 500, "initial_simplex": np.r_[np.zeros((1, 4)), np.diag([libre, libre, 0.003, 0.003])]})
    if r.fun >= avant:
        return np.asarray(p0), d0, avant, avant
    x = r.x
    return p0 + x[2] * u0 + x[3] * v0, unite(d0 + x[0] * u0 + x[1] * v0), float(r.fun), avant


def contact(a, b, d=0.004):
    """Les points de `a` (un nuage) à moins de d de `b`."""
    A = points(a) if isinstance(a, str) else a
    B = points(b) if isinstance(b, str) else b
    return A[cKDTree(B).query(A, distance_upper_bound=d)[0] < np.inf]


def unite(v):
    v = np.asarray(v, dtype=np.float64)
    return v / max(np.linalg.norm(v), 1e-12)


def sphere(pts, tours=4, tolerance=0.002):
    """La sphère des moindres carrés d'un nuage (en écartant, tour après tour, ce qui n'est pas sur elle)."""
    garde = np.ones(len(pts), dtype=bool)
    for _ in range(tours):
        q = pts[garde]
        A = np.c_[2 * q, np.ones(len(q))]
        x = np.linalg.lstsq(A, (q**2).sum(1), rcond=None)[0]
        c = x[:3]
        r = float(np.sqrt(max(x[3] + c @ c, 1e-12)))
        ecart = np.abs(np.linalg.norm(pts - c, axis=1) - r)
        nouveau = ecart < tolerance
        if nouveau.sum() < 12 or (nouveau == garde).all():
            break
        garde = nouveau
    return c, r


def base_perp(d):
    d = unite(d)
    a = np.array([0.0, 1.0, 0.0]) if abs(d[1]) < 0.9 else np.array([1.0, 0.0, 0.0])
    u = unite(np.cross(d, a))
    return u, np.cross(d, u)


def cercle(pts, d):
    """Pour une charnière d'axe d : le point de l'axe (cercle ajusté dans le plan perpendiculaire) et son rayon."""
    d = unite(d)
    u, v = base_perp(d)
    q = np.c_[pts @ u, pts @ v]
    A = np.c_[2 * q, np.ones(len(q))]
    x = np.linalg.lstsq(A, (q**2).sum(1), rcond=None)[0]
    r = float(np.sqrt(max(x[2] + x[0] ** 2 + x[1] ** 2, 1e-12)))
    return x[0] * u + x[1] * v + float(np.mean(pts @ d)) * d, r


def charniere(pts, d0, pas=3):
    """Affine la direction d'une charnière : celle qui rend les points les plus proches d'un cylindre."""
    def residu(d):
        c, r = cercle(pts, d)
        u, v = base_perp(d)
        return float(np.mean(np.abs(np.hypot((pts - c) @ u, (pts - c) @ v) - r)))
    d = unite(d0)
    meilleur = residu(d)
    for angle in (8, 4, 2, 1):
        bouge = True
        while bouge:
            bouge = False
            u, v = base_perp(d)
            for k in (u, -u, v, -v):
                e = unite(d + np.tan(np.radians(angle)) * k)
                r = residu(e)
                if r < meilleur - 1e-7:
                    d, meilleur, bouge = e, r, True
    return d, meilleur


def axes_principaux(pts):
    c = pts.mean(0)
    w, v = np.linalg.eigh(np.cov((pts - c).T))
    return c, v[:, ::-1].T, np.sqrt(np.maximum(w[::-1], 0))


def bout(objet, vers, part=0.2):
    """Les points du bout d'un os long du côté de la direction `vers` (une fraction de sa longueur)."""
    P = points(objet)
    c, axes, _ = axes_principaux(P)
    a = axes[0] if axes[0] @ np.asarray(vers) > 0 else -axes[0]
    t = (P - c) @ a
    return P[t > t.max() - part * (t.max() - t.min())], a


def tourner(p, pivot, axe, degres):
    """Le point p après une rotation autour de l'axe (pivot, axe)."""
    a = unite(axe)
    t = np.radians(degres)
    v = np.asarray(p, dtype=np.float64) - pivot
    return pivot + v * np.cos(t) + np.cross(a, v) * np.sin(t) + a * (a @ v) * (1 - np.cos(t))


def oriente(axe, pivot, temoin, sens):
    """Retourne l'axe pour qu'une rotation positive déplace le point témoin dans le sens voulu."""
    axe = unite(axe)
    d = tourner(temoin, pivot, axe, 8) - np.asarray(temoin)
    return axe if d @ np.asarray(sens, dtype=np.float64) > 0 else -axe


def arrondi(v, n=5):
    return [round(float(x), n) for x in v]


# ---------------------------------------------------------------- les articulations, mesurées

X, Y, Z = np.eye(3)


def mesurer():
    """Tous les centres et axes du côté gauche et du milieu : {nom: {"p": centre, …axes orientés}}.
    Chaque axe est orienté pour qu'un angle positif fasse le mouvement qui lui donne son nom."""
    A = {}
    G = lambda n: n + ".l"

    # -- la colonne : le noyau de chaque disque, et l'axe de la colonne à cet endroit
    niveaux = [("l5", "L5-S1"), ("l4", "L4-L5"), ("l3", "L3-L4"), ("l2", "L2-L3"), ("l1", "L1-L2"), ("t12", "T12-L1")] + [(f"t{i}", f"T{i}-T{i + 1}") for i in range(11, 0, -1)] + [("c7", "C7-T1")] + [(f"c{i}", f"C{i}-C{i + 1}") for i in (6, 5, 4, 3)] + [("axis", "C2-C3")]
    noyaux = {seg: points(f"Nucleus pulposus {d}").mean(0) for seg, d in niveaux}
    ordre = [seg for seg, _ in niveaux]
    for k, seg in enumerate(ordre):
        p = noyaux[seg]
        p[0] = 0.0
        long_ = unite(noyaux[ordre[min(k + 1, len(ordre) - 1)]] - noyaux[ordre[max(k - 1, 0)]])
        long_[0] = 0.0
        long_ = unite(long_)
        A[seg] = {"p": p, "flexion": X, "inclinaison": unite(np.cross(long_, X)) * -1, "rotation": long_}
        # inclinaison : positive vers la gauche (le haut de la colonne part vers +x)
        A[seg]["inclinaison"] = oriente(A[seg]["inclinaison"], p, p + long_ * 0.1, X)
        A[seg]["rotation"] = oriente(long_, p, p + Z * 0.1, X)
    # -- la tête : l'atlas tourne sur la dent de l'axis ; l'occiput bascule sur l'atlas
    axis = points("Axis (C2)")
    dent = axis[axis[:, 1] > axis[:, 1].max() - 0.012]
    pd = dent.mean(0)
    pd[0] = 0.0
    A["atlas"] = {"p": pd, "rotation": oriente(Y, pd, pd + Z * 0.1, X), "flexion": X, "inclinaison": oriente(Z, pd, pd + Y * 0.1, X)}
    occ = contact("Occipital bone", "Atlas (C1)", 0.006)
    atl = contact("Atlas (C1)", "Occipital bone", 0.006)
    # Les condyles de l'occipital roulent dans les cavités de l'atlas : le centre est au-dessus d'elles.
    c, r = cercle(np.r_[occ, atl], X)
    c[0] = 0.0
    if not (0.004 < r < 0.06) or c[1] < atl[:, 1].mean():
        c = np.array([0.0, atl[:, 1].mean() + 0.012, atl[:, 2].mean()])
    A["tete"] = {"p": c, "flexion": X, "inclinaison": oriente(Z, c, c + Y * 0.1, X), "rotation": oriente(Y, c, c + Z * 0.1, X)}
    # -- la mâchoire : l'axe passe par les deux condyles
    cond = contact("Mandible", G("Temporal bone"), 0.008)
    cond = cond[cond[:, 0] > 0]
    pc = cond.mean(0)
    haut = points("Mandible")
    tete_cond = haut[(haut[:, 0] > 0) & (np.linalg.norm(haut - pc, axis=1) < 0.012)]
    pc = tete_cond[tete_cond[:, 1] > tete_cond[:, 1].max() - 0.008].mean(0)
    menton = haut[haut[:, 2] > haut[:, 2].max() - 0.01].mean(0)
    A["mandibule"] = {"p": np.array([0.0, pc[1], pc[2]]), "condyle": pc, "ouverture": oriente(X, np.array([0.0, pc[1], pc[2]]), menton, -Y), "menton": menton}
    # -- l'os hyoïde : monte et descend (déglutition)
    A["hyoide"] = {"p": points("Hyoid bone").mean(0)}
    # -- le sternum
    A["sternum"] = {"p": points("Body of sternum").mean(0)}

    # -- les côtes : l'axe passe par la tête (contre les corps vertébraux) et le tubercule (contre le processus transverse)
    precedent = None
    for n in range(1, 13):
        cote = points(G(f"{RANG[n].capitalize()} rib"))
        vert = np.r_[points(f"Vertebra T{n}"), points(f"Vertebra T{n - 1}") if n > 1 else points("Vertebra C7")]
        vert = vert[vert[:, 0] > -0.005]
        touche = contact(cote, vert, 0.006)
        axe = None
        touche = contact(cote, vert, 0.004)
        if len(touche) >= 12 and n <= 10:
            # La tête touche les corps vertébraux, près du milieu ; le tubercule touche le processus transverse, plus en dehors.
            x = touche[:, 0]
            seuil = (x.min() + x.max()) / 2
            for _ in range(12):
                seuil = (x[x < seuil].mean() + x[x >= seuil].mean()) / 2
            tete, tub = touche[x < seuil], touche[x >= seuil]
            if min(len(tete), len(tub)) >= 5 and np.linalg.norm(tub.mean(0) - tete.mean(0)) > 0.012:
                axe = unite(tub.mean(0) - tete.mean(0))
                p = tete.mean(0)
        if axe is None:  # côtes flottantes : la tête seule ; on garde la direction de la côte précédente
            p = (touche if len(touche) else cote[np.argsort(np.abs(cote[:, 0]))[:20]]).mean(0)
            axe = precedent if precedent is not None else unite([0.6, 0.0, -0.8])
        precedent = axe
        avant = cote[np.argmax(cote[:, 2])]
        A[f"cote-{n}"] = {"p": p, "inspiration": oriente(axe, p, avant, Y), "avant": avant}

    # -- l'épaule
    sc = np.r_[contact(G("Clavicle"), "Manubrium of sternum", 0.008), contact(G("Clavicle"), G("Articular disc of sternoclavicular joint"), 0.004)]
    clav = points(G("Clavicle"))
    psc = sc.mean(0) if len(sc) else clav[np.argmin(clav[:, 0])]
    ac = contact(G("Clavicle"), G("Scapula"), 0.008)
    pac = ac.mean(0) if len(ac) else clav[np.argmax(clav[:, 0])]
    long_clav = unite(pac - psc)
    A["clavicule"] = {"p": psc, "elevation": oriente(Z, psc, pac, Y), "protraction": oriente(Y, psc, pac, Z), "rotation": oriente(long_clav, psc, pac + Z * 0.02, Y)}
    scap = points(G("Scapula"))
    hum = points(G("Humerus"))
    glene = contact(G("Scapula"), G("Humerus"), 0.012)
    tete_h = contact(G("Humerus"), G("Scapula"), 0.012)
    cg = glene.mean(0)
    proche = hum[np.linalg.norm(hum - cg, axis=1) < 0.034]
    ch, rh = sphere(proche, tolerance=0.0015)
    if not 0.017 < rh < 0.032:
        ch, rh = sphere(tete_h)
    # La scapula : elle pivote sur l'articulation acromio-claviculaire ; son plan donne l'axe de la sonnette.
    cs, axs, _ = axes_principaux(scap)
    normale = axs[2] if axs[2] @ Z > 0 else -axs[2]
    angle_inf = scap[np.argmin(scap[:, 1])]
    A["scapula"] = {"p": pac, "sonnette": oriente(normale, pac, angle_inf, X), "bascule": oriente(unite(np.cross(normale, Y)), pac, angle_inf, -Z), "rotation": oriente(Y, pac, cg, Z), "glene": cg, "angle": angle_inf}
    coude0 = hum[hum[:, 1] < hum[:, 1].min() + 0.03]
    # -- le coude : l'axe de la trochlée et du capitulum
    c_bas, ax_bas, _ = axes_principaux(coude0)
    d0 = ax_bas[0] if abs(ax_bas[0][0]) > 0.5 else X
    uln = points(G("Ulna"))
    rad = points(G("Radius"))
    surf = np.r_[contact(hum, uln, 0.005), contact(uln, hum, 0.005)]
    d_epi = unite(coude0[np.argmax(coude0[:, 0])] - coude0[np.argmin(coude0[:, 0])])
    pcoude, rc = cercle(surf, d_epi)
    d = oriente(d_epi, pcoude, rad[np.argmin(rad[:, 1])], Z)
    pcoude, d, res, res0 = ajuster([G("Ulna")], [G("Humerus")], pcoude, d, [20, 45, 70, 95, 120, 140])
    # (le centre le long de l'axe : au milieu de la palette humérale)
    pcoude = pcoude + d * float((coude0 @ d).mean() - pcoude @ d)
    poignet_r = rad[rad[:, 1] < rad[:, 1].min() + 0.012].mean(0)
    A["humerus"] = {"p": ch, "rayon": rh, "flexion": oriente(X, ch, pcoude, Z), "abduction": oriente(Z, ch, pcoude, X), "rotation": None}
    long_h = unite(pcoude - ch)
    A["humerus"]["rotation"] = oriente(long_h, ch, pcoude + Z * 0.05, -X)  # rotation médiale : le devant du coude va vers le dedans
    A["ulna"] = {"p": pcoude, "flexion": oriente(d, pcoude, poignet_r, Z), "interligne": [res0, res]}
    # -- la pronation : de la tête du radius à la tête de l'ulna
    tete_r = rad[rad[:, 1] > rad[:, 1].max() - 0.01].mean(0)
    tete_u = uln[uln[:, 1] < uln[:, 1].min() + 0.012].mean(0)
    styl_r = rad[np.argmin(rad[:, 1])]
    axe_p = unite(tete_u - tete_r)
    # Pronation : le radius passe devant l'ulna (son processus styloïde part vers l'avant, puis vers le dedans).
    A["radius"] = {"p": tete_r, "pronation": oriente(axe_p, tete_r, styl_r, Z), "bas": tete_u}
    # -- le poignet : la tête du capitatum
    cap = points(G("Capitate bone"))
    pp = cap[cap[:, 1] > cap[:, 1].max() - 0.008].mean(0)
    mc = {k: points(G(f"{RANG[k].capitalize()} metacarpal bone")) for k in range(1, 6)}
    tetes, bases, longs = {}, {}, {}
    for k in range(1, 6):
        t, a = bout(G(f"{RANG[k].capitalize()} metacarpal bone"), -Y, 0.16)
        b, _ = bout(G(f"{RANG[k].capitalize()} metacarpal bone"), Y, 0.16)
        tetes[k], bases[k], longs[k] = sphere(t)[0] if len(t) > 20 else t.mean(0), b.mean(0), a
        if np.linalg.norm(tetes[k] - t.mean(0)) > 0.006:
            tetes[k] = t.mean(0)
    plan = np.array([tetes[k] for k in (2, 3, 4, 5)] + [bases[k] for k in (2, 3, 4, 5)])
    _, axp, _ = axes_principaux(plan)
    paume = axp[2] if axp[2] @ Z > 0 else -axp[2]
    long_main = unite(tetes[3] - pp)
    travers = unite(np.cross(long_main, paume))
    A["main"] = {"p": pp, "flexion": oriente(travers, pp, tetes[3], paume), "abduction": oriente(paume, pp, tetes[3], tetes[2] - tetes[5]), "paume": paume, "long": long_main}
    # -- les doigts
    for k, nom in DOIGTS.items():
        o = RANG[k].capitalize()
        p1 = points(G(f"Proximal phalanx of {o.lower()} finger of hand"))
        p2 = points(G(f"Middle phalanx of {o.lower()} finger of hand"))
        p3 = points(G(f"Distal phalanx of {o.lower()} finger of hand"))
        pulpe = p3[np.argmin(p3[:, 1])]
        axe1 = unite(np.cross(unite(p1.mean(0) - tetes[k]), paume))
        A[f"{nom}-p1"] = {"p": tetes[k], "flexion": oriente(axe1, tetes[k], pulpe, paume), "abduction": oriente(paume, tetes[k], pulpe, (tetes[2] - tetes[5]) * (1 if k == 2 else -1))}
        for seg, proximal, distal in ((f"{nom}-p2", p1, p2), (f"{nom}-p3", p2, p3)):
            fin, a = bout_nuage(proximal, distal.mean(0) - proximal.mean(0), 0.14)
            axe = unite(np.cross(a, paume))
            A[seg] = {"p": fin.mean(0), "flexion": oriente(axe, fin.mean(0), pulpe if seg.endswith("p3") else distal.mean(0) + a * 0.02, paume)}
    # -- le pouce
    trap = points(G("Trapezium bone"))
    pcm = np.r_[contact(mc[1], trap, 0.004), contact(trap, mc[1], 0.004)]
    pcm = pcm.mean(0) if len(pcm) else bases[1]
    pp1 = points(G("Proximal phalanx of first finger of hand"))
    pp2 = points(G("Distal phalanx of first finger of hand"))
    bout_pouce = pp2[np.argmax(np.linalg.norm(pp2 - pcm, axis=1))]
    long_p = unite(tetes[1] - pcm)
    cote_ulnaire = unite(tetes[5] - tetes[2])
    A["pouce-mc"] = {"p": pcm, "flexion": oriente(paume, pcm, bout_pouce, cote_ulnaire), "abduction": oriente(unite(np.cross(paume, long_p)), pcm, bout_pouce, paume), "rotation": oriente(long_p, pcm, bout_pouce + paume * 0.01, cote_ulnaire)}
    # Le plan de flexion du pouce : celui de son ongle, perpendiculaire à la plus grande largeur de ses têtes.
    for seg, proximal, distal, centre in (("pouce-p1", mc[1], pp1, tetes[1]), ("pouce-p2", pp1, pp2, None)):
        fin, a = bout_nuage(proximal, distal.mean(0) - proximal.mean(0), 0.16)
        c0 = fin.mean(0) if centre is None else centre
        q = fin - fin.mean(0)
        q = q - np.outer(q @ a, a)
        w, v = np.linalg.eigh(np.cov(q.T))
        large = v[:, -1]
        A[seg] = {"p": c0, "flexion": oriente(large, c0, bout_pouce, cote_ulnaire + paume * 0.6), "allongement": float(np.sqrt(w[-1] / max(w[-2], 1e-12)))}

    # -- la hanche
    fem = points(G("Femur"))
    coxal = points(G("Hip bone"))
    tete_f = contact(fem, coxal, 0.008)
    cf, rf = sphere(tete_f)
    if not 0.018 < rf < 0.032:
        haut_f = fem[(fem[:, 1] > fem[:, 1].max() - 0.05) & (fem[:, 0] < fem[:, 0].min() + 0.05)]
        cf, rf = sphere(haut_f)
    tib = points(G("Tibia"))
    fib = points(G("Fibula"))
    bas_f = fem[fem[:, 1] < fem[:, 1].min() + 0.04]
    # -- le genou : l'axe passe par les centres des deux condyles
    milieu = bas_f[:, 0].mean()
    condyles = []
    for cote_c in (bas_f[bas_f[:, 0] < milieu], bas_f[bas_f[:, 0] >= milieu]):
        arriere = cote_c[(cote_c[:, 2] < np.percentile(cote_c[:, 2], 65)) & (cote_c[:, 1] < cote_c[:, 1].min() + 0.03)]
        c, r = sphere(arriere, tolerance=0.002)
        if not 0.012 < r < 0.035:
            c = arriere.mean(0)
        condyles.append(c)
    dg = unite(condyles[1] - condyles[0])
    pg = (condyles[0] + condyles[1]) / 2
    cheville0 = tib[tib[:, 1] < tib[:, 1].min() + 0.02].mean(0)
    A["femur"] = {"p": cf, "rayon": rf, "flexion": oriente(X, cf, pg, Z), "abduction": oriente(Z, cf, pg, X), "rotation": oriente(unite(pg - cf), cf, pg + Z * 0.05, -X)}
    dg = oriente(dg, pg, cheville0, -Z)
    pg2, dg2, resg, resg0 = ajuster([G("Tibia")], [G("Femur")], pg, dg, [20, 45, 70, 95, 120], d_contact=0.009, libre=0.05)
    if np.linalg.norm(pg2 - pg) < 0.012:
        pg, dg = pg2 + dg2 * float((pg - pg2) @ dg2), dg2
    A["jambe"] = {"p": pg, "flexion": oriente(dg, pg, cheville0, -Z), "rotation": oriente(unite(cheville0 - pg), pg, cheville0 + Z * 0.05, -X), "condyles": condyles, "interligne": [resg0, resg]}
    A["patella"] = {"p": pg, "flexion": A["jambe"]["flexion"]}
    # -- la cheville : l'axe passe sous les pointes des deux malléoles
    mm = tib[np.argmin(tib[:, 1] + 0.0 * tib[:, 0])]
    med = tib[tib[:, 0] < np.percentile(tib[:, 0], 25)]
    mm = med[np.argmin(med[:, 1])]
    ml = fib[np.argmin(fib[:, 1])]
    tal = points(G("Talus"))
    dome = np.r_[contact(tal, tib, 0.004), contact(tib, tal, 0.004)]
    dc0 = unite(ml - mm)
    dch, resc = charniere(dome, dc0) if len(dome) > 30 else (dc0, -1)
    if np.degrees(np.arccos(abs(dch @ dc0))) > 20:
        dch = dc0
    pch, rch = cercle(dome, dch) if len(dome) > 30 else ((mm + ml) / 2, 0)
    if not 0.012 < rch < 0.035:
        pch = (mm + ml) / 2 + np.array([0.0, -0.004, 0.0])
    pch = pch + dch * float(((mm + ml) / 2) @ dch - pch @ dch)
    calc = points(G("Calcaneus"))
    mt = {k: points(G(f"{RANG[k].capitalize()} metatarsal bone")) for k in range(1, 6)}
    tetes_mt = {}
    for k in range(1, 6):
        t, a = bout_nuage(mt[k], Z, 0.16)
        c, r = sphere(t)
        tetes_mt[k] = c if np.linalg.norm(c - t.mean(0)) < 0.006 else t.mean(0)
    avant_pied = tetes_mt[2]
    dch = oriente(dc0, pch, avant_pied, Y)
    pch2, dch2, resc, resc0 = ajuster([G("Talus")], [G("Tibia"), G("Fibula")], pch, dch, [-40, -25, -10, 10, 20], d_contact=0.006, libre=0.06)
    if np.linalg.norm(pch2 - pch) < 0.012:
        pch, dch = pch2 + dch2 * float((pch - pch2) @ dch2), dch2
    A["talus"] = {"p": pch, "flexion-dorsale": oriente(dch, pch, avant_pied, Y), "malleoles": [mm, ml], "interligne": [resc0, resc]}
    # -- l'articulation subtalaire : l'axe de Henke, du bord postéro-latéral du talon au col du talus (en haut, en avant, en dedans)
    talon = calc[np.argmin(calc[:, 2])]
    long_pied = unite(np.array([avant_pied[0] - talon[0], 0.0, avant_pied[2] - talon[2]]))
    dedans = np.array([-1.0, 0.0, 0.0])
    lat = unite(np.cross(Y, long_pied))
    lat = lat if lat @ dedans < 0 else -lat  # vers le dehors
    henke = unite(np.cos(np.radians(42)) * (np.cos(np.radians(23)) * long_pied - np.sin(np.radians(23)) * lat) + np.sin(np.radians(42)) * Y)
    sinus = (tal.mean(0) + calc.mean(0)) / 2
    sinus = np.array([tal.mean(0)[0], (tal[:, 1].min() + calc[:, 1].max()) / 2, tal.mean(0)[2]])
    bord_med = mt[1].mean(0)
    A["pied"] = {"p": sinus, "inversion": oriente(henke, sinus, bord_med, Y), "long": long_pied}
    # -- les orteils
    plante = -Y
    for k in range(1, 6):
        o = RANG[k].lower()
        p1 = points(G(f"Proximal phalanx of {o} finger of foot"))
        seg1 = "hallux-p1" if k == 1 else f"orteil{k}-p1"
        axe = unite(np.cross(unite(p1.mean(0) - tetes_mt[k]), Y))
        bout_o = p1[np.argmax(p1[:, 2])] + Z * 0.02
        # L'écartement se mesure par rapport à l'axe du 2e orteil : le gros orteil s'en écarte en dedans, les autres en dehors.
        A[seg1] = {"p": tetes_mt[k], "flexion": oriente(axe, tetes_mt[k], bout_o, plante), "abduction": oriente(Y, tetes_mt[k], bout_o, -X if k == 1 else X)}
        suite = [("hallux-p2", p1, points(G("Distal phalanx of first finger of foot")))] if k == 1 else [(f"orteil{k}-p2", p1, points(G(f"Middle phalanx of {o} finger of foot"))), (f"orteil{k}-p3", points(G(f"Middle phalanx of {o} finger of foot")), points(G(f"Distal phalanx of {o} finger of foot")))]
        for seg, proximal, distal in suite:
            fin, a = bout_nuage(proximal, distal.mean(0) - proximal.mean(0), 0.2)
            A[seg] = {"p": fin.mean(0), "flexion": oriente(A[seg1]["flexion"], fin.mean(0), distal.mean(0) + Z * 0.02, plante)}
    # -- l'œil : le centre du globe
    scl = points(G("Sclera"))
    co, ro = sphere(scl)
    cornee = points(G("Cornea")).mean(0)
    regard = unite(cornee - co)
    A["oeil"] = {"p": co, "rayon": ro, "elevation": oriente(X, co, cornee, Y), "adduction": oriente(Y, co, cornee, -X), "torsion": oriente(regard, co, co + Y * 0.01, -X), "regard": regard}
    return A


def bout_nuage(P, vers, part=0.2):
    c, axes, _ = axes_principaux(P)
    a = axes[0] if axes[0] @ np.asarray(vers) > 0 else -axes[0]
    t = (P - c) @ a
    return P[t > t.max() - part * (t.max() - t.min())], a


if __name__ == "__main__":
    def court(v):
        if isinstance(v, np.ndarray):
            return arrondi(v, 3)
        if isinstance(v, (list, tuple)):
            return [court(x) for x in v]
        if isinstance(v, float):
            return round(v, 5)
        return v
    for nom, a in mesurer().items():
        print(f"{nom:14s}", {k: court(v) for k, v in a.items()})
