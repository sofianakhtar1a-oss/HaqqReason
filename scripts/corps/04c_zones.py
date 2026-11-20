# L'Écorché — étape 4 ter : les zones.
# Une pièce du modèle peut porter plusieurs structures : un muscle, son tendon d'origine et son tendon terminal
# (dans Z-Anatomy, les tendons sont des faces du muscle, pas des objets à part). Chaque sommet reçoit ici un code
# de zone (attribut EX) ; le site en tire, pour chaque zone, une structure qu'on peut toucher, allumer et nommer.
#   • muscles : 1 = côté de l'origine, 2 = côté de la terminaison, 3 = zone particulière (le ligament patellaire,
#     prolongement du tendon du quadriceps sous la patella ; l'aponévrose palmaire, éventail du long palmaire ;
#     la lame antérieure de la gaine du droit de l'abdomen, faite des aponévroses des obliques).
#     Le code vaut pour tous les sommets ; seul le tissu tendineux (poids W1) forme la zone.
# Les deux bouts d'un muscle viennent des surfaces d'insertion de Z-Anatomy quand elles existent ; à défaut, de la
# convention anatomique (l'origine est l'attache la plus proche du tronc).
# Usage : python 04c_zones.py   (complète ~/donnees-corps/attributs et écrit ~/donnees-corps/zones.json)
import collections, json, os, re, time
import numpy as np
from scipy.spatial import cKDTree
from commun import DONNEES, GROUPES_INSERTION, bord_du_droit, decouper, eloignement, norme, voile

GEO = os.path.join(DONNEES, "geo")
ATT = os.path.join(DONNEES, "attributs")
index = json.load(open(os.path.join(GEO, "index.json"), encoding="utf-8"))
t0 = time.time()


def charger(cle, lod):
    f = os.path.join(GEO, f"lod{lod}", cle + ".npz")
    return dict(np.load(f)) if os.path.exists(f) else None


def geo(objet, lod=1):
    for e in index:
        if e["objet"] == objet:
            return charger(e["cle"], lod)
    return None


ins = collections.defaultdict(lambda: {"o": [], "e": []})
for e in index:
    if e["couche"] != "insertion":
        continue
    base, suff = decouper(e["objet"])
    d = charger(e["cle"], 1)
    if d is not None:
        ins[norme(base)]["o" if suff[0] == "o" else "e"].append(d["P"].astype(np.float64))
for groupe, membres in GROUPES_INSERTION.items():
    for m in membres:
        for sorte in "oe":
            ins[norme(m)][sorte] += ins[norme(groupe)][sorte]


def bouts(nom, P):
    """Les deux bouts d'une pièce : le point d'origine, le point de terminaison, et d'où on les tient."""
    arbre = cKDTree(P)
    connus = {}
    for sorte in "oe":
        pts = ins.get(norme(nom), {}).get(sorte, [])
        if pts:
            Q = np.concatenate(pts)
            d, i = arbre.query(Q)
            pres = np.unique(i[d < 0.008])
            if len(pres) >= 3:
                connus[sorte] = P[pres].mean(0)
    if len(connus) == 2 and np.linalg.norm(connus["o"] - connus["e"]) > 0.012:
        return connus["o"], connus["e"], "insertions"
    if connus:
        sorte, k = next(iter(connus.items()))
        d = np.linalg.norm(P - k, axis=1)
        autre = P[d >= np.quantile(d, 0.94)].mean(0)
        return (k, autre, "une insertion") if sorte == "o" else (autre, k, "une insertion")
    c = P.mean(0)
    w, v = np.linalg.eigh(np.cov((P - c).T))
    t = (P - c) @ v[:, 2]
    g0, g1 = P[t <= np.quantile(t, 0.04)].mean(0), P[t >= np.quantile(t, 0.96)].mean(0)
    if eloignement(g0) > eloignement(g1):
        g0, g1 = g1, g0
    return g0, g1, "convention"


patella = geo("Patella.l")
Y_APEX = float(patella["P"][:, 1].min()) + 0.008 if patella else 0.43
QUADRICEPS = {norme(n) for n in ("Rectus femoris muscle", "Vastus lateralis muscle", "Vastus medialis muscle", "Vastus intermedius muscle")}

# Le long palmaire s'épanouit dans la paume en éventail : l'aponévrose palmaire, sous le pli du poignet.
PALMAIRE = norme("Palmaris longus muscle")
pisiforme = geo("Pisiform bone.l")
Y_POIGNET = float(pisiforme["P"][:, 1].min()) if pisiforme else 0.84

zones = {}
methodes = collections.Counter()
for e in index:
    if e["couche"] != "muscle":
        continue
    base, _ = decouper(e["objet"])
    base = re.sub(r"^\((.*)\)$", r"\1", base)
    g1 = charger(e["cle"], 1)
    if g1 is None:
        continue
    O, E, methode = bouts(base, g1["P"].astype(np.float64))
    methodes[methode] += 1
    axe = E - O
    l2 = float(axe @ axe) or 1.0
    for lod in range(3):
        g = charger(e["cle"], lod)
        fa = os.path.join(ATT, f"lod{lod}", e["cle"] + ".npz")
        if g is None or not os.path.exists(fa):
            continue
        a = dict(np.load(fa))
        P, T, W = g["P"].astype(np.float64), g["T"].astype(np.int64), g["W"]
        t = ((P - O) @ axe) / l2
        code = np.where(t < 0.5, 1, 2).astype(np.uint8)
        if norme(base) in QUADRICEPS:
            code[P[:, 1] < Y_APEX] = 3
        if norme(base) == PALMAIRE:
            code[P[:, 1] < Y_POIGNET] = 3
        # La gaine du droit de l'abdomen : les aponévroses des obliques qui passent devant lui. Z-Anatomy ne les
        # marque pas comme du tendon : on le fait ici (poids W1), et elles deviennent une zone à part.
        droit = geo("Rectus abdominis muscle.l", lod)
        v = voile(base, P, bord_du_droit(droit["P"].astype(np.float64)) if droit else None)
        if v is not None and v.min() < 1:
            W = W.copy()
            W[:, 0] = np.maximum(W[:, 0], np.round(v * 255).astype(np.uint8))
            code[v > 0.02] = 3
            a["W"] = W
        a["EX"] = code
        np.savez(fa, **a)
        if lod != 1:
            continue
        # Le bilan (au niveau standard) : pour chaque zone, la surface de tendon, sa boîte et un point sur le tendon.
        tend = W[:, 0] > 127
        n = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
        aire = np.linalg.norm(n, axis=1) / 2
        centre_t = P[T].mean(1)
        bilan = {}
        for k in (1, 2, 3):
            m = tend & (code == k)
            tri = m[T].all(1)
            s = float(aire[tri].sum())
            if s <= 0:
                continue
            c = (centre_t[tri] * aire[tri, None]).sum(0) / s
            pts = P[m]
            lo, hi = pts.min(0), pts.max(0)
            proche = pts[np.argmin(np.linalg.norm(pts - c, axis=1))]
            bilan[str(k)] = {"a": round(s * 1e4, 3), "c": [round(float(v), 4) for v in (lo + hi) / 2], "p": [round(float(v), 4) for v in proche], "r": round(float(np.linalg.norm(hi - lo) / 2), 4)}
        if bilan:
            zones[e["objet"]] = bilan

json.dump(zones, open(os.path.join(DONNEES, "zones.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
nb = sum(len(z) for z in zones.values())
print(f"{len(zones)} pièces de muscle à tendon, {nb} zones (surface médiane {np.median([z['a'] for b in zones.values() for z in b.values()]):.1f} cm²) en {time.time() - t0:.0f} s")
print("bouts :", dict(methodes))
