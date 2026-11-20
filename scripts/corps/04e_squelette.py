# L'Écorché — étape 4 quinquies : le squelette articulé et les poids d'animation.
#
#   1. Les articulations sont mesurées sur les os (squelette.py) et écrites dans squelette.json.
#   2. Chaque sommet de chaque pièce reçoit un ou deux segments à suivre et la part du premier (attributs BA, BB, BW) :
#        • un os suit son segment d'un bloc ; un cartilage costal va de sa côte au sternum ;
#        • tout le reste (muscles, tendons, ligaments, vaisseaux, nerfs, viscères…) suit les os les plus proches,
#          à proportion inverse de la distance : collé à l'os au ras d'une insertion, partagé entre deux os au
#          niveau d'une articulation.
#      Pour qu'un muscle du bras ne s'accroche pas aux côtes qu'il frôle, ni la cuisse à la main qui pend à côté
#      d'elle, chaque pièce n'a droit qu'aux segments de sa région (et, pour un muscle, à ceux de ses os d'attache).
#
# Usage : python 04e_squelette.py   (complète ~/donnees-corps/attributs ; écrit ~/donnees-corps/squelette.json
#         et src/lib/corps/modele/squelette.json). À relancer après 04_attributs.py, qui réécrit les attributs.
import collections, json, os, re, sys, time
import numpy as np
from scipy.spatial import cKDTree
from commun import DONNEES, GROUPES_INSERTION, decouper, norme
import squelette as S

ICI = os.path.dirname(os.path.abspath(__file__))
MODELE = os.path.abspath(os.path.join(ICI, "..", "..", "src", "lib", "corps", "modele"))
GEO = os.path.join(DONNEES, "geo")
ATT = os.path.join(DONNEES, "attributs")
t0 = time.time()
classement = json.load(open(os.path.join(DONNEES, "classement.json"), encoding="utf-8"))
index = json.load(open(os.path.join(GEO, "index.json"), encoding="utf-8"))
par_objet = {p["objet"]: p for p in classement["pieces"]}
insertions = {i["objet"]: i for i in classement["insertions"]}
cle_de = {e["objet"]: e["cle"] for e in index}

NA, NL = S.NB_AXIAUX, S.NB_LATERAUX
PUISSANCE = 3.0
MIROIR = np.array([-1.0, 1.0, 1.0])


def charger(objet, lod):
    f = os.path.join(GEO, f"lod{lod}", cle_de.get(objet, "?") + ".npz")
    return dict(np.load(f)) if os.path.exists(f) else None


def echantillons(d):
    """Les sommets d'un maillage et les centres de ses triangles : de quoi mesurer une distance à sa surface."""
    P, T = d["P"].astype(np.float64), d["T"]
    return np.r_[P, P[T].mean(1)]


# ---------------------------------------------------------------- 1. les articulations

mesures = S.mesurer()


def propre(v):
    if isinstance(v, np.ndarray):
        return S.arrondi(v)
    if isinstance(v, (list, tuple)):
        return [propre(x) for x in v]
    if isinstance(v, (float, np.floating)):
        return round(float(v), 5)
    return v


squelette = {
    "axiaux": S.AXIAUX,
    "lateraux": S.LATERAUX,
    "parents": {s: S.parent_de(s) for s in S.AXIAUX + S.LATERAUX},
    "ponts": {k: list(v) for k, v in S.PONTS.items()},
    "reperes": {nom: {k: propre(v) for k, v in a.items()} for nom, a in mesures.items()},
}

# ---------------------------------------------------------------- 2. les nuages d'os, segment par segment

nuages = collections.defaultdict(list)  # numéro de segment → points
segment_os = {}  # objet → numéro de segment (os rigides)
cartilages = {}  # objet → rang de la côte
for p in classement["pieces"]:
    sd = S.segment_de(p["objet"])
    if sd is None and p["couche"] == "os" and S.os_de_la_tete(p["objet"]):
        sd = ("tete", "d" if p["cote"] == "d" else "g")
    if sd is None:
        if p["couche"] == "os":
            print("os sans segment :", p["objet"])
        continue
    seg, cote = sd
    d = charger(p["objet"], 0) or charger(p["objet"], 1)
    if d is None:
        continue
    E = echantillons(d)
    if isinstance(seg, tuple):
        cartilages[p["objet"]] = seg[1]
        continue
    if p["couche"] not in ("os",) and seg != "oeil":
        continue
    if seg == "oeil" and not re.match(r"sclera", p["objet"].lower()):
        segment_os[p["objet"]] = S.numero(seg, cote)
        continue
    n = S.numero(seg, cote)
    segment_os[p["objet"]] = n
    nuages[n].append(E)
    if p["miroir"] and n >= NA:
        nuages[n + NL].append(E * MIROIR)
    elif p["miroir"]:
        nuages[n].append(E * MIROIR)  # un os pair d'un segment du milieu (l'os coxal) : ses deux côtés

# Les cartilages costaux : la moitié latérale compte pour la côte, la moitié médiale pour le sternum.
sternum_pts = np.concatenate(nuages[S.numero("sternum")])
arbre_sternum = cKDTree(sternum_pts)
poids_cartilage = {}
for objet, rang in cartilages.items():
    d0 = charger(objet, 0) or charger(objet, 1)
    cote_pts = np.concatenate(nuages[S.numero(f"cote-{rang}")])
    arbre_cote = cKDTree(cote_pts)
    maxi = {8: 0.6, 9: 0.5, 10: 0.4}.get(rang, 1.0)

    def part_sternum(P, arbre_cote=arbre_cote, maxi=maxi):
        dc = arbre_cote.query(P)[0]
        ds = arbre_sternum.query(P)[0]
        return np.clip(dc / np.maximum(dc + ds, 1e-9), 0, 1) * maxi if maxi == 1.0 else np.clip(dc / max(float(dc.max()), 1e-9), 0, 1) * maxi

    poids_cartilage[objet] = part_sternum
    E = echantillons(d0)
    t = part_sternum(E)
    n = S.numero(f"cote-{rang}")
    nuages[n].append(E[t < 0.5])
    nuages[n + NL].append(E[t < 0.5] * MIROIR)
    nuages[S.numero("sternum")].append(E[t >= 0.5])
    nuages[S.numero("sternum")].append(E[t >= 0.5] * MIROIR)

arbres = {n: cKDTree(np.concatenate(l)) for n, l in nuages.items() if l}
boites = {n: (a.data.min(0), a.data.max(0)) for n, a in arbres.items()}
print(f"{len(arbres)} segments ont des os ({sum(len(a.data) for a in arbres.values())} points) — {time.time() - t0:.0f} s")
sans = [s for s in range(NA + 2 * NL) if s not in arbres]
if sans:
    print("segments sans os :", sans)

# ---------------------------------------------------------------- 3. les segments permis à chaque pièce

SEG = lambda noms, cote: {S.numero(n, cote) for n in noms}
COLONNE = [s for s in S.AXIAUX if re.match(r"[ltc]\d+$", s)] + ["axis", "atlas"]
COTES = [f"cote-{i}" for i in range(1, 13)]
SUP = ["clavicule", "scapula", "humerus", "ulna", "radius", "main"] + [s for s in S.LATERAUX if re.match(r"(pouce|index|majeur|annulaire|auriculaire)-", s)]
INF = ["femur", "patella", "jambe", "talus", "pied"] + [s for s in S.LATERAUX if re.match(r"(hallux|orteil\d)-", s)]
Y_EPAULE = float(mesures["humerus"]["p"][1])
Y_COUDE = float(mesures["ulna"]["p"][1])
Y_POIGNET = float(mesures["main"]["p"][1])
Y_HANCHE = float(mesures["femur"]["p"][1])
Y_GENOU = float(mesures["jambe"]["p"][1])
Y_CHEVILLE = float(mesures["talus"]["p"][1])
X_EPAULE = float(S.points("Humerus.l").min(0)[0])


LOMBAIRES = ["bassin", "l5", "l4", "l3", "l2", "l1"]
# Ce qui est tenu d'un seul côté d'une articulation, quoi qu'en disent les distances.
RIGIDES = [(r"meniscus|meniscotibial", "jambe"), (r"^acetabular labrum", "bassin"), (r"^glenoid labrum", "scapula")]


def famille(p, P):
    """La région d'une pièce : « sup » (membre supérieur), « inf » (membre inférieur) ou « axe » (le tronc, la tête),
    avec les segments latéraux et les segments du milieu qui lui sont permis."""
    cols = set(p.get("collections") or [])
    c = (P.min(0) + P.max(0)) / 2
    x, y = abs(float(c[0])), float(c[1])
    haut = bool(cols & {"Left upper limb", "Right upper limb", "Left hand", "Right hand"})
    bas = bool(cols & {"Left lower limb", "Right lower limb", "Left foot", "Right foot"})
    tronc = bool(cols & {"Trunk", "Head", "Neck", "Thorax", "Abdomen", "Back", "Pelvis"})
    if (haut and not bas and not tronc) or (not tronc and not bas and x > X_EPAULE - 0.01 and Y_POIGNET - 0.25 < y < Y_EPAULE + 0.02):
        return "sup", SUP, []
    if (bas and not haut and not tronc) or (not tronc and not haut and y < Y_HANCHE - 0.06):
        return "inf", INF, LOMBAIRES
    return "axe", COTES + ["clavicule", "scapula", "humerus", "femur", "oeil"], S.AXIAUX


def segments_des_os(noms_os, cote_piece):
    """Les segments des os d'attache d'un muscle (les noms d'objets des os, côté gauche)."""
    res = set()
    for o in noms_os:
        if not o:
            continue
        if o in cartilages or o[:-2] + ".l" in cartilages:
            rang = cartilages.get(o, cartilages.get(o[:-2] + ".l"))
            res |= {S.numero(f"cote-{rang}", "g"), S.numero("sternum")}
            continue
        sd = S.segment_de(o)
        if sd is None and S.os_de_la_tete(o):
            sd = ("tete", "g")
        if sd is None or isinstance(sd[0], tuple):
            continue
        res.add(S.numero(sd[0], "g"))
    return res


attaches = collections.defaultdict(set)  # muscle (nom normalisé) → objets des os d'attache
for i in classement["insertions"]:
    if i.get("os"):
        attaches[norme(i["muscle"])].add(i["os"] if i["os"].endswith(".l") or not re.search(r"\.[lr]$", i["os"]) else i["os"][:-2] + ".l")
for groupe, membres in GROUPES_INSERTION.items():
    for m in membres:
        attaches[norme(m)] |= attaches[norme(groupe)]


def permis(p, P):
    """Les segments qu'une pièce a le droit de suivre, et sa famille."""
    base, _ = decouper(p["objet"])
    cote = p["cote"]
    cotes = ("g",) if (cote == "g" or p["miroir"]) else ("d",) if cote == "d" else ("g", "d")
    for motif, seg in RIGIDES:
        if re.search(motif, base.lower()):
            return {S.numero(seg, cotes[0])}, "rigide"
    fam, lateraux, axiaux = famille(p, P)
    res = SEG(axiaux, "g")
    for c in cotes:
        res |= SEG(lateraux, c)
    s_att = segments_des_os(attaches.get(norme(base), set()), cote)
    if cotes == ("d",):
        s_att = {s + NL if s >= NA else s for s in s_att}
    return res | s_att, fam


# ---------------------------------------------------------------- 4. les poids

def poids(P, candidats):
    """Pour chaque point : les deux segments les plus proches parmi les candidats, et la part du premier."""
    n = len(P)
    lo, hi = P.min(0), P.max(0)
    marge = 0.14
    utiles = [s for s in candidats if s in arbres and np.all(boites[s][0] - marge < hi) and np.all(boites[s][1] + marge > lo)]
    if not utiles:
        utiles = [s for s in candidats if s in arbres] or [0]
    D = np.full((n, len(utiles)), np.inf)
    for k, s in enumerate(utiles):
        D[:, k] = arbres[s].query(P, workers=-1)[0]
    ordre = np.argsort(D, axis=1)[:, :2] if len(utiles) > 1 else np.zeros((n, 2), dtype=np.int64)
    lig = np.arange(n)
    d1 = D[lig, ordre[:, 0]]
    d2 = D[lig, ordre[:, 1]] if len(utiles) > 1 else np.full(n, np.inf)
    e = 0.0015
    a1 = (d1 + e) ** -PUISSANCE
    a2 = np.where(np.isfinite(d2), (d2 + e) ** -PUISSANCE, 0.0)
    w = a1 / (a1 + a2)
    u = np.array(utiles)
    return u[ordre[:, 0]], u[ordre[:, 1]], w


def lisser(T, sa, sb, w, tours=2):
    """Adoucit les poids le long du maillage, sans changer les deux segments de chaque sommet."""
    n = len(w)
    ar = np.concatenate([T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]])
    ar = np.concatenate([ar, ar[:, ::-1]])
    for _ in range(tours):
        # la part du segment sa[i] chez chaque voisin j (0 s'il ne le suit pas)
        i, j = ar[:, 0], ar[:, 1]
        chez_j = np.where(sa[j] == sa[i], w[j], np.where(sb[j] == sa[i], 1 - w[j], 0.0))
        som = np.bincount(i, weights=chez_j, minlength=n)
        nb = np.bincount(i, minlength=n)
        w = np.where(nb > 0, 0.5 * w + 0.5 * som / np.maximum(nb, 1), w)
    return w


bilan = collections.Counter()
exemples = {}
faits = 0
for lod in (0, 1, 2):
    dossier = os.path.join(ATT, f"lod{lod}")
    os.makedirs(dossier, exist_ok=True)
    for e in index:
        objet = e["objet"]
        d = charger(objet, lod)
        if d is None:
            continue
        P = d["P"].astype(np.float64)
        n = len(P)
        if objet in cartilages:
            rang = cartilages[objet]
            t = poids_cartilage[objet](P)
            sa = np.full(n, S.numero(f"cote-{rang}", "g"))
            sb = np.full(n, S.numero("sternum"))
            w = 1 - t
        elif objet in segment_os:
            sa = sb = np.full(n, segment_os[objet])
            w = np.ones(n)
        elif objet in insertions:
            porteur = insertions[objet].get("os")
            porteur = porteur if porteur in cle_de else (porteur or "")[:-2] + ".l"
            if porteur in cartilages:
                rang = cartilages[porteur]
                sa = np.full(n, S.numero(f"cote-{rang}", "g"))
                sb = np.full(n, S.numero("sternum"))
                w = 1 - poids_cartilage[porteur](P)
            else:
                sd = S.segment_de(porteur) if porteur else None
                if sd is None and porteur and S.os_de_la_tete(porteur):
                    sd = ("tete", "g")
                if sd is None or isinstance(sd[0], tuple):
                    sa, sb, w = poids(P, set(range(NA)) | SEG(S.LATERAUX, "g"))
                    w = np.ones(n)
                    sb = sa
                else:
                    sa = sb = np.full(n, S.numero(sd[0], "g"))
                    w = np.ones(n)
        elif objet in par_objet:
            p = par_objet[objet]
            cand, fam = permis(p, P)
            sa, sb, w = poids(P, cand)
            if len(d["T"]):
                w = lisser(d["T"].astype(np.int64), sa, sb, w)
            if lod == 1:
                bilan[fam] += 1
        else:
            continue
        # Le premier segment est celui qui pèse le plus ; BW est sa part (255 : lui seul).
        inverse = w < 0.5
        sa, sb = np.where(inverse, sb, sa), np.where(inverse, sa, sb)
        w = np.where(inverse, 1 - w, w)
        f = os.path.join(dossier, e["cle"] + ".npz")
        att = dict(np.load(f)) if os.path.exists(f) else {}
        att["BA"] = sa.astype(np.uint8)
        att["BB"] = sb.astype(np.uint8)
        att["BW"] = np.clip(np.round(w * 255), 0, 255).astype(np.uint8)
        np.savez_compressed(f, **att)
        faits += 1
    print(f"niveau {lod} : poids écrits — {time.time() - t0:.0f} s")

json.dump(squelette, open(os.path.join(DONNEES, "squelette.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(squelette, open(os.path.join(MODELE, "squelette.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"{faits} fichiers d'attributs complétés ; familles (niveau 1) : {dict(bilan)} — {time.time() - t0:.0f} s")
