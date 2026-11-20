# L'Écorché — étape 4 : ce que chaque sommet sait de son voisinage.
#   • La profondeur des muscles (0 superficiel, 1 intermédiaire, 2 profond) : on regarde lesquels voient le dehors,
#     on les retire, et on recommence.
#   • L'occlusion ambiante précalculée : la part de lumière d'ambiance qui atteint chaque sommet, parmi les seules
#     structures qui l'entourent encore quand sa couche est affichée (un os ne s'assombrit pas sous un muscle absent).
# Les rayons sont tirés par rayons.c (compilé à la volée). Usage : python 04_attributs.py
# → ~/donnees-corps/attributs/lod{0,1,2}/*.npz et attributs/profondeurs.json
import json, os, subprocess, sys, tempfile, time
import numpy as np
from scipy.spatial import cKDTree
from commun import DONNEES, bord_du_droit, decouper, voile

ICI = os.path.dirname(os.path.abspath(__file__))
GEO = os.path.join(DONNEES, "geo")
ATT = os.path.join(DONNEES, "attributs")
RAYONS = os.path.join(DONNEES, "rayons")
if not os.path.exists(RAYONS) or os.path.getmtime(RAYONS) < os.path.getmtime(os.path.join(ICI, "rayons.c")):
    subprocess.check_call(["gcc", "-O3", "-march=native", "-fopenmp", "-o", RAYONS, os.path.join(ICI, "rayons.c"), "-lm"])

classement = json.load(open(os.path.join(DONNEES, "classement.json"), encoding="utf-8"))
index = json.load(open(os.path.join(GEO, "index.json"), encoding="utf-8"))
par_objet = {p["objet"]: p for p in classement["pieces"]}
for lod in range(3):
    os.makedirs(os.path.join(ATT, f"lod{lod}"), exist_ok=True)

MIROIR = np.array([-1, 1, 1], dtype=np.float32)


def groupe_de(e):
    """Le groupe d'occlusion d'une pièce."""
    if e["couche"] == "insertion":
        return "insertion"
    s = e["sorte"]
    if s in ("fascia", "gaine", "bourse", "enveloppe"):
        return s
    return e["couche"]


pieces = []
for e in index:
    p = par_objet.get(e["objet"])
    pieces.append({"cle": e["cle"], "objet": e["objet"], "couche": e["couche"], "sorte": e["sorte"], "groupe": groupe_de(e), "miroir": bool(p["miroir"]) if p else True, "superficiel": bool(p and "Superficial muscles" in p["collections"])})

_cache = {}


def geo(cle, lod):
    k = (cle, lod)
    if k not in _cache:
        f = os.path.join(GEO, f"lod{lod}", cle + ".npz")
        if not os.path.exists(f):
            _cache[k] = None
        else:
            d = np.load(f)
            _cache[k] = (d["P"], d["N"], d["T"].astype(np.int64))
    return _cache[k]


_bord = {}


def bord(lod):
    """Le bord du droit de l'abdomen à ce niveau de détail (pour reconnaître la gaine qui passe devant)."""
    if lod not in _bord:
        droit = next((p for p in pieces if p["objet"] == "Rectus abdominis muscle.l"), None)
        g = geo(droit["cle"], lod) if droit else None
        _bord[lod] = bord_du_droit(g[0]) if g is not None else None
    return _bord[lod]


def soupe(liste, lod):
    """Les triangles (n × 9) d'une liste de pièces, des deux côtés quand la pièce est en miroir.
    Les voiles (platysma, gaine du droit) n'y sont pas : on ne les montre pas d'office, ils ne font pas d'ombre."""
    morceaux = []
    for p in liste:
        g = geo(p["cle"], lod)
        if g is None:
            continue
        P, _, T = g
        v = voile(decouper(p["objet"])[0], P, bord(lod))
        if v is not None:
            T = T[~(v[T] > 0.5).all(1)]
            if not len(T):
                continue
        t = P[T].reshape(-1, 9)
        morceaux.append(t)
        if p["miroir"]:
            morceaux.append((P * MIROIR)[T[:, ::-1]].reshape(-1, 9))
    return np.concatenate(morceaux).astype(np.float32) if morceaux else np.zeros((0, 9), dtype=np.float32)


def tirer(obstacles, points, normales, rayons, portee, mode):
    with tempfile.TemporaryDirectory() as d:
        fo, fp, fs = (os.path.join(d, n) for n in ("o.bin", "p.bin", "s.bin"))
        with open(fo, "wb") as h:
            h.write(np.int32(len(obstacles)).tobytes())
            h.write(obstacles.astype(np.float32).tobytes())
        with open(fp, "wb") as h:
            h.write(np.int32(len(points)).tobytes())
            h.write(np.concatenate([points, normales], axis=1).astype(np.float32).tobytes())
        subprocess.check_call([RAYONS, fo, fp, fs, str(rayons), str(portee), str(mode)])
        return np.fromfile(fs, dtype=np.float32)


def points_de(liste, lod):
    Ps, Ns, bornes = [], [], []
    n = 0
    for p in liste:
        g = geo(p["cle"], lod)
        if g is None:
            bornes.append((n, n))
            continue
        Ps.append(g[0]); Ns.append(g[1])
        bornes.append((n, n + len(g[0])))
        n += len(g[0])
    if not Ps:
        return np.zeros((0, 3), np.float32), np.zeros((0, 3), np.float32), bornes
    return np.concatenate(Ps), np.concatenate(Ns), bornes


debut = time.time()
os_ = [p for p in pieces if p["groupe"] == "os"]
charnus = [p for p in pieces if p["groupe"] in ("muscle", "tendon")]

# ---------------------------------------------------------------- la profondeur des muscles
profondeur = {}
reste = list(charnus)
obst_os = soupe(os_, 2)
for niveau in (0, 1):
    obst = np.concatenate([obst_os, soupe(reste, 2)])
    P, N, bornes = points_de(reste, 2)
    vis = tirer(obst, P, N, 20, 0.7, 1)
    suivants = []
    for p, (a, b) in zip(reste, bornes):
        part = float((vis[a:b] > 0.12).mean()) if b > a else 0.0
        # La collection « muscles superficiels » de Z-Anatomy tranche pour le premier niveau.
        dehors = part > 0.22 or (niveau == 0 and p["superficiel"] and part > 0.08)
        if dehors:
            profondeur[p["cle"]] = niveau
        else:
            suivants.append(p)
    print(f"profondeur {niveau} : {len(reste) - len(suivants)} pièces ({time.time() - debut:.0f} s)", flush=True)
    reste = suivants
for p in reste:
    profondeur[p["cle"]] = 2
print(f"profondeur 2 : {len(reste)} pièces")
json.dump({p["objet"]: profondeur[p["cle"]] for p in charnus}, open(os.path.join(ATT, "profondeurs.json"), "w"), ensure_ascii=False, indent=0)

# ---------------------------------------------------------------- l'occlusion ambiante


def cuire(cibles, obstacles_liste, nom, portee=0.045, rayons=40):
    if not cibles:
        return
    obst = soupe(obstacles_liste, 1)
    P, N, bornes = points_de(cibles, 0)
    ao = tirer(obst, P, N, rayons, portee, 0)
    for p, (a, b) in zip(cibles, bornes):
        if b <= a:
            continue
        v0 = ao[a:b]
        arbre = cKDTree(geo(p["cle"], 0)[0])
        for lod in range(3):
            g = geo(p["cle"], lod)
            if g is None:
                continue
            v = v0 if lod == 0 else v0[arbre.query(g[0])[1]]
            np.savez(os.path.join(ATT, f"lod{lod}", p["cle"] + ".npz"), AO=np.clip(np.round(v * 255), 8, 255).astype(np.uint8))
    print(f"occlusion {nom} : {len(cibles)} pièces, {len(P)} sommets, {len(obst)} triangles d'obstacle ({time.time() - debut:.0f} s)", flush=True)


def de(groupe):
    return [p for p in pieces if p["groupe"] == groupe]


cuire(os_, os_, "os")
for d in (0, 1, 2):
    cibles = [p for p in charnus if profondeur[p["cle"]] == d]
    cuire(cibles, os_ + [p for p in charnus if profondeur[p["cle"]] >= d], f"muscles et tendons, profondeur {d}")
cuire(de("ligament"), os_ + de("ligament"), "ligaments")
for g in ("artere", "veine", "nerf", "lymphe"):
    cuire(de(g), os_ + de(g), g, portee=0.03)
cuire(de("viscere"), de("viscere"), "viscères")
cuire(de("encephale"), de("encephale"), "encéphale", portee=0.03)
for g in ("fascia", "gaine", "bourse", "enveloppe"):
    cuire(de(g), os_ + de(g), g)
cuire(de("insertion"), os_, "insertions", portee=0.02, rayons=16)
print(f"fini en {time.time() - debut:.0f} s")
