# L'Écorché — étape 4 quater : qui couvre qui.
# Pour montrer un muscle profond, il faut ôter ce qui le cache — et rien d'autre. On tire, de chaque sommet d'une
# pièce, un rayon vers le point de peau le plus proche (la peau de Z-Anatomy ne sert qu'à cela : elle n'est jamais
# affichée) ; les pièces traversées sont celles qui la couvrent. On note aussi la profondeur sous la peau.
# Usage : python 04d_couvertures.py   → ~/donnees-corps/couvertures.json
import collections, json, os, re, subprocess, tempfile, time
import numpy as np
from scipy.spatial import cKDTree
from commun import DONNEES, bord_du_droit, decouper, objets_bruts, sommets, triangles, vers_repere, voile

ICI = os.path.dirname(os.path.abspath(__file__))
GEO = os.path.join(DONNEES, "geo")
RAYONS = os.environ.get("RAYONS", os.path.join(DONNEES, "rayons"))
if "RAYONS" not in os.environ and (not os.path.exists(RAYONS) or os.path.getmtime(RAYONS) < os.path.getmtime(os.path.join(ICI, "rayons.c"))):
    subprocess.check_call(["gcc", "-O3", "-march=native", "-fopenmp", "-o", RAYONS, os.path.join(ICI, "rayons.c"), "-lm"])
classement = json.load(open(os.path.join(DONNEES, "classement.json"), encoding="utf-8"))
index = json.load(open(os.path.join(GEO, "index.json"), encoding="utf-8"))
par_objet = {p["objet"]: p for p in classement["pieces"]}
MIROIR = np.array([-1, 1, 1])
debut = time.time()

# ---------------------------------------------------------------- la peau (des points serrés sur sa surface)
PAS_PEAU = re.compile(r"hair|eyelash|eyebrow|nail|perionyx|eponychium|hyponychium|lunule|line\b|plane\b", re.I)
pts = []
for o in objets_bruts():
    if "9: Regions of human body" not in o["collections"] or not o.get("triangles") or PAS_PEAU.search(o["nom"]):
        continue
    P = vers_repere(sommets(o).astype(np.float64))
    T = triangles(o).astype(np.int64)
    a, b, c = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]
    aire = np.linalg.norm(np.cross(b - a, c - a), axis=1) / 2
    # Assez de points par triangle pour un pas d'environ 4 mm.
    n = np.clip(np.ceil(aire / (0.004**2 * 0.5)).astype(int), 1, 400)
    rng = np.random.default_rng(len(pts) + 7)
    rep = np.repeat(np.arange(len(T)), n)
    u, v = rng.random(len(rep)), rng.random(len(rep))
    hors = u + v > 1
    u[hors], v[hors] = 1 - u[hors], 1 - v[hors]
    pts.append(a[rep] + (b[rep] - a[rep]) * u[:, None] + (c[rep] - a[rep]) * v[:, None])
    pts.append(P)
peau = np.concatenate(pts)
arbre_peau = cKDTree(peau)
print(f"peau : {len(peau)} points, de y = {peau[:, 1].min():.2f} à {peau[:, 1].max():.2f} m ({time.time() - debut:.0f} s)", flush=True)

# ---------------------------------------------------------------- les pièces charnues (muscles, tendons, aponévroses)
def charger(cle, lod=2):
    f = os.path.join(GEO, f"lod{lod}", cle + ".npz")
    return dict(np.load(f)) if os.path.exists(f) else None


droit = next((e for e in index if e["objet"] == "Rectus abdominis muscle.l"), None)
bord = bord_du_droit(charger(droit["cle"])["P"].astype(np.float64)) if droit else None
pieces = []
for e in index:
    p = par_objet.get(e["objet"])
    if not p or p["couche"] not in ("muscle", "tendon") or p["sorte"] in ("fascia", "gaine"):
        continue
    g = charger(e["cle"])
    if g is None:
        continue
    P, N, T = g["P"].astype(np.float64), g["N"].astype(np.float64), g["T"].astype(np.int64)
    v = voile(decouper(e["objet"])[0], P, bord)
    if v is not None:
        T = T[~(v[T] > 0.5).all(1)]  # un voile ne couvre rien : on ne le montre pas d'office
    pieces.append({"objet": e["objet"], "P": P, "T": T, "miroir": bool(p["miroir"]), "voile": v})

nb = len(pieces)
tri, etiq = [], []
for k, p in enumerate(pieces):
    if not len(p["T"]):
        continue
    tri.append(p["P"][p["T"]].reshape(-1, 9)); etiq.append(np.full(len(p["T"]), k))
    if p["miroir"]:
        tri.append((p["P"] * MIROIR)[p["T"][:, ::-1]].reshape(-1, 9)); etiq.append(np.full(len(p["T"]), k + nb))
tri, etiq = np.concatenate(tri).astype(np.float32), np.concatenate(etiq).astype(np.int32)

# Un rayon par sommet, vers la peau la plus proche (sa longueur : la distance à la peau).
Ps, bornes = [], []
n = 0
for p in pieces:
    Ps.append(p["P"]); bornes.append((n, n + len(p["P"]))); n += len(p["P"])
Ps = np.concatenate(Ps)
d, i = arbre_peau.query(Ps)
vers = peau[i] - Ps
with tempfile.TemporaryDirectory() as dossier:
    fo, fp, fe, fs = (os.path.join(dossier, x) for x in ("o.bin", "p.bin", "e.bin", "s.bin"))
    with open(fo, "wb") as h:
        h.write(np.int32(len(tri)).tobytes()); h.write(tri.tobytes())
    with open(fe, "wb") as h:
        h.write(np.int32(len(etiq)).tobytes()); h.write(etiq.tobytes())
    with open(fp, "wb") as h:
        h.write(np.int32(len(Ps)).tobytes()); h.write(np.concatenate([Ps, vers], axis=1).astype(np.float32).tobytes())
    subprocess.check_call([RAYONS, fo, fp, fs, "1", "0", "3", fe])
    vus = np.fromfile(fs, dtype=np.int32).reshape(len(Ps), 6)

SEUIL = 0.15   # une pièce en couvre une autre quand elle cache au moins un sommet sur sept
RESTE = 0.4    # et l'on ôte assez de pièces pour qu'il reste moins de deux cinquièmes de la surface cachée
sortie = {}
for k, (p, (a, b)) in enumerate(zip(pieces, bornes)):
    if b <= a:
        continue
    n = b - a
    v = vus[a:b]
    par_piece = {}
    for col in range(6):
        for lab in np.unique(v[:, col]):
            if lab >= 0 and lab != k:
                par_piece.setdefault(int(lab), np.zeros(n, dtype=bool))
                par_piece[int(lab)] |= v[:, col] == lab
    # D'abord celles qui couvrent franchement ; puis, tant que trop de surface reste cachée (une structure profonde
    # est couverte par beaucoup de pièces dont aucune ne la cache seule), celle qui en cache le plus parmi ce qui reste.
    choisies = {lab: float(m.mean()) for lab, m in par_piece.items() if m.mean() >= SEUIL}
    cachee = np.zeros(n, dtype=bool)
    for lab, m in par_piece.items():
        if lab not in choisies:
            cachee |= m
    while cachee.mean() > RESTE:
        lab = max((l for l in par_piece if l not in choisies), key=lambda l: (par_piece[l] & cachee).sum(), default=None)
        if lab is None or not (par_piece[lab] & cachee).any():
            break
        choisies[lab] = float(par_piece[lab].mean())
        cachee = np.zeros(n, dtype=bool)
        for l2, m in par_piece.items():
            if l2 not in choisies:
                cachee |= m
    couvrants = [[pieces[lab % nb]["objet"] + ("~" if lab >= nb else ""), round(part, 2)] for lab, part in sorted(choisies.items(), key=lambda x: -x[1])]
    dd = d[a:b] * 1000
    sortie[p["objet"]] = {"couvert": couvrants, "peau": [round(float(np.percentile(dd, 5)), 1), round(float(np.median(dd)), 1)]}

json.dump(sortie, open(os.path.join(DONNEES, "couvertures.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
couverts = sum(1 for s in sortie.values() if s["couvert"])
print(f"{len(sortie)} pièces, {couverts} couvertes par une autre ; en {time.time() - debut:.0f} s")
print("pièces couvrantes par pièce : médiane", int(np.median([len(x["couvert"]) for x in sortie.values()])), " maximum", max(len(x["couvert"]) for x in sortie.values()))
for nom in ("Diaphragm", "Sternocleidomastoid muscle.l", "Rectus abdominis muscle.l", "Supraspinatus muscle.l", "Vastus intermedius muscle.l", "Soleus muscle.l", "Brachialis muscle.l", "Sternocostal head of pectoralis major muscle.l", "Piriformis muscle.l", "Flexor digitorum profundus.l", "Masseter", "Superficial part of masseter.l", "Rectus femoris muscle.l", "Pectoralis minor muscle.l"):
    if nom in sortie:
        print(f"  {nom:50s} peau {sortie[nom]['peau']} mm  couvert par {sortie[nom]['couvert']}")
