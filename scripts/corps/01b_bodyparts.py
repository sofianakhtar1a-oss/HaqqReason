# L'Écorché — étape 1 bis : les pièces que Z-Anatomy n'a pas, ou pas sous une licence libre, reprises de BodyParts3D
# (CC BY-SA 2.1 Japan) : le rein (celui de Z-Anatomy est sous licence non commerciale), le rectum, l'iléon, le
# semi-épineux de la tête.
#
# BodyParts3D est la base de Z-Anatomy : même orientation, en millimètres. Mais Z-Anatomy a déplacé ses organes un à
# un ; on place donc chaque pièce d'après ses voisines, présentes dans les deux atlas (le décalage moyen de leurs
# centres), ou d'après la pièce de Z-Anatomy qu'elle remplace (le rein : son centre et sa taille, rien d'autre).
#
# Sortie : brut/index-bp3d.json et brut/geometrie-bp3d.bin, au format de 01_exporter.py (repère de Blender).
# Lancer : python3 -I 01b_bodyparts.py
import json, os, struct, sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from commun import BP3D, BRUT, objets_bruts, sommets

# (FMA, nom de l'objet, collections, matières, placement)
#   placement : {"remplace": objet de Z-Anatomy} ou {"voisins": [(FMA, objet de Z-Anatomy), …]}
AJOUTS = [
    ("FMA7205", "Kidney (BodyParts3D).l", ["8: Visceral systems", "Urinary system", "Trunk"], ["Kidney"], {"remplace": "Kidney.l"}),
    ("FMA7204", "Kidney (BodyParts3D).r", ["8: Visceral systems", "Urinary system", "Trunk"], ["Kidney"], {"remplace": "Kidney.r"}),
    ("FMA14544", "Rectum", ["8: Visceral systems", "Digestive system", "Large intestine", "Pelvis"], ["Colon"], {"voisins": [("FMA15900", "Urinary bladder")], "suite": "Sigmoid colon"}),
    ("FMA7208", "Ileum", ["8: Visceral systems", "Digestive system", "Small intestine", "Abdomen"], ["Small intestine"], {"voisins": [("FMA7207", "Jejunum")]}),
    ("FMA22877", "Semispinalis capitis muscle.l", ["4: Muscular system", "Muscles", "Deep muscles of back", "Trunk"], ["Extensor", "Tendon"], {"voisins": [("FMA22875", "Semispinalis colli muscle.l"), ("FMA22729", "Splenius capitis muscle.l")]}),
    ("FMA22876", "Semispinalis capitis muscle.r", ["4: Muscular system", "Muscles", "Deep muscles of back", "Trunk"], ["Extensor", "Tendon"], {"voisins": [("FMA22874", "Semispinalis colli muscle.r"), ("FMA22728", "Splenius capitis muscle.r")]}),
]


def stl(fma):
    """Les triangles d'un fichier STL (binaire ou texte), en millimètres."""
    d = open(os.path.join(BP3D, "stl", fma + ".stl"), "rb").read()
    if d[:5] == b"solid" and b"facet" in d[:400]:
        v = [list(map(float, l.split()[1:4])) for l in d.decode("latin-1").splitlines() if l.strip().startswith("vertex")]
        return np.array(v, dtype=np.float64).reshape(-1, 3, 3)
    n = struct.unpack("<I", d[80:84])[0]
    a = np.frombuffer(d[84 : 84 + n * 50], dtype=np.dtype([("n", "<f4", 3), ("v", "<f4", (3, 3)), ("a", "<u2")]))
    return a["v"].astype(np.float64)


def souder(tri):
    """Une soupe de triangles → des sommets partagés (à un centième de millimètre près) et des triangles indexés."""
    P = tri.reshape(-1, 3)
    cle = np.round(P * 100).astype(np.int64)
    _, premier, inverse = np.unique(cle, axis=0, return_index=True, return_inverse=True)
    T = inverse.reshape(-1, 3)
    T = T[(T[:, 0] != T[:, 1]) & (T[:, 1] != T[:, 2]) & (T[:, 0] != T[:, 2])]
    return P[premier], T


def rayon(P):
    c = P.mean(0)
    return float(np.sqrt(((P - c) ** 2).sum(1).mean()))


bruts = {o["nom"]: o for o in objets_bruts() if o.get("source") != "BodyParts3D"}
sortie_bin = os.path.join(BRUT, "geometrie-bp3d.bin")
objets = []
with open(sortie_bin, "wb") as f:
    for fma, nom, collections, mats, placement in AJOUTS:
        P, T = souder(stl(fma))
        P = P / 1000.0
        if "remplace" in placement:
            ref = sommets(bruts[placement["remplace"]]).astype(np.float64)
            # Le centre et la taille de la pièce remplacée (la forme reste celle de BodyParts3D).
            P = (P - P.mean(0)) * (rayon(ref) / rayon(P)) + ref.mean(0)
        else:
            decalages = []
            for vf, vz in placement["voisins"]:
                Q = souder(stl(vf))[0] / 1000.0
                Z = sommets(bruts[vz]).astype(np.float64)
                decalages.append(Z.mean(0) - Q.mean(0))
            P = P + np.mean(decalages, axis=0)
            suite = placement.get("suite")
            if suite:
                # Le rectum continue le côlon sigmoïde : on rapproche son bout haut du bout bas du sigmoïde.
                S = sommets(bruts[suite]).astype(np.float64)
                bas = S[S[:, 2] < np.quantile(S[:, 2], 0.03)].mean(0)
                haut = P[P[:, 2] > np.quantile(P[:, 2], 0.97)].mean(0)
                ecart = bas - haut
                P = P + np.clip(ecart, -0.025, 0.025) * np.array([1.0, 1.0, 1.0])
        o_s = f.tell()
        f.write(P.astype(np.float32).tobytes())
        o_t = f.tell()
        f.write(T.astype(np.uint32).tobytes())
        o_m = f.tell()
        f.write(np.zeros(len(T), dtype=np.uint8).tobytes())
        objets.append({"nom": nom, "type": "MESH", "collections": collections, "parent": None, "mats": mats, "mods": [], "sommets": int(len(P)), "triangles": int(len(T)), "o_sommets": o_s, "o_triangles": o_t, "o_matieres": o_m, "source": "BodyParts3D", "fma": fma})
        print(f"{nom:34s} {len(P):6d} sommets {len(T):6d} triangles  centre {P.mean(0).round(3)}")
with open(os.path.join(BRUT, "index-bp3d.json"), "w", encoding="utf-8") as f:
    json.dump({"source": "BodyParts3D (CC BY-SA 2.1 Japan), via github.com/Kevin-Mattheus-Moerman/BodyParts3D", "blender": None, "geometrie": "geometrie-bp3d.bin", "objets": objets}, f, ensure_ascii=False, indent=1)
print("écrit :", len(objets), "objets")
