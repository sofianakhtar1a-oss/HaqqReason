# L'Écorché — étape 4 sexies : l'onde du pouls.
#
# Quand le cœur bat, une onde de pression court le long des artères (environ 6 mètres par seconde) : elle passe
# au cou avant d'arriver au poignet, et au poignet avant le dos du pied. Pour la montrer, chaque sommet d'artère
# reçoit sa distance au cœur EN SUIVANT L'ARBRE ARTÉRIEL (attribut FS : 255 = 2 mètres). Le moteur fait gonfler
# l'artère au passage de l'onde.
#
# Le chemin : on relie tous les sommets des artères en un seul graphe (les arêtes des maillages, plus des ponts
# entre deux pièces qui se touchent), et l'on mesure le plus court chemin depuis la racine de l'aorte (et, pour
# la petite circulation, depuis la racine du tronc pulmonaire).
#
# Usage : python 04f_pouls.py   (complète ~/donnees-corps/attributs). À relancer après 04_attributs.py.
import json, os, time
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components, dijkstra
from scipy.spatial import cKDTree
from commun import DONNEES

GEO = os.path.join(DONNEES, "geo")
ATT = os.path.join(DONNEES, "attributs")
PORTEE = 2.0  # mètres pour 255
PONT = 0.0025  # deux pièces à moins de 2,5 mm l'une de l'autre communiquent
t0 = time.time()
classement = json.load(open(os.path.join(DONNEES, "classement.json"), encoding="utf-8"))
cle_de = {e["objet"]: e["cle"] for e in json.load(open(os.path.join(GEO, "index.json"), encoding="utf-8"))}
MIROIR = np.array([-1.0, 1.0, 1.0])


def charger(objet, lod):
    f = os.path.join(GEO, f"lod{lod}", cle_de.get(objet, "?") + ".npz")
    return dict(np.load(f)) if os.path.exists(f) else None


# ---------------------------------------------------------------- le graphe de toutes les artères (niveau standard)
pieces = [p for p in classement["pieces"] if p["couche"] == "artere" and charger(p["objet"], 1) is not None]
noeuds, de_piece, debut = [], [], {}
lignes, colonnes, longueurs = [], [], []
n = 0
for k, p in enumerate(pieces):
    d = charger(p["objet"], 1)
    P, T = d["P"].astype(np.float64), d["T"].astype(np.int64)
    for miroir in ([False, True] if p["miroir"] else [False]):
        Q = P * MIROIR if miroir else P
        debut[(p["objet"], miroir)] = n
        noeuds.append(Q)
        de_piece.append(np.full(len(Q), 2 * k + int(miroir)))
        ar = np.concatenate([T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]])
        lignes.append(ar[:, 0] + n)
        colonnes.append(ar[:, 1] + n)
        longueurs.append(np.linalg.norm(Q[ar[:, 0]] - Q[ar[:, 1]], axis=1))
        n += len(Q)
N = np.concatenate(noeuds)
de_piece = np.concatenate(de_piece)
arbre = cKDTree(N)
paires = arbre.query_pairs(PONT, output_type="ndarray")
paires = paires[de_piece[paires[:, 0]] != de_piece[paires[:, 1]]]
lignes.append(paires[:, 0])
colonnes.append(paires[:, 1])
longueurs.append(np.linalg.norm(N[paires[:, 0]] - N[paires[:, 1]], axis=1) + 1e-6)
L, C, W = np.concatenate(lignes), np.concatenate(colonnes), np.concatenate(longueurs)
print(f"{len(pieces)} artères, {n} sommets, {len(paires)} ponts — {time.time() - t0:.0f} s")


def racine(objet):
    """Les sommets du bas d'un tronc qui sort du cœur."""
    a = debut[(objet, False)]
    P = charger(objet, 1)["P"]
    return a + np.where(P[:, 1] < P[:, 1].min() + 0.006)[0]


sources = np.concatenate([racine("Ascending aorta"), racine("Pulmonary trunk")])
dist = None
for tour in range(40):
    # (Une arête partagée par deux triangles arrive deux fois : on n'en garde qu'une, la matrice additionnerait les doublons.)
    lo, hi = np.minimum(L, C), np.maximum(L, C)
    _, garde = np.unique(lo * n + hi, return_index=True)
    L, C, W = lo[garde], hi[garde], W[garde]
    G = coo_matrix((np.r_[W, W], (np.r_[L, C], np.r_[C, L])), shape=(n, n)).tocsr()
    dist = dijkstra(G, directed=False, indices=sources, min_only=True)
    loin = ~np.isfinite(dist)
    if not loin.any():
        break
    # Les pièces que le graphe n'atteint pas (un petit écart dans le modèle) : un pont vers l'artère atteinte la plus proche.
    nb, comp = connected_components(G, directed=False)
    atteints = np.where(~loin)[0]
    a2 = cKDTree(N[atteints])
    isoles = np.where(loin)[0]
    d, i = a2.query(N[isoles])
    meilleur = {}
    for j, (dj, ij) in enumerate(zip(d, i)):
        c = comp[isoles[j]]
        if c not in meilleur or dj < meilleur[c][0]:
            meilleur[c] = (dj, isoles[j], atteints[ij])
    # (seulement les plus proches à chaque tour : les suivants passeront par eux)
    seuil = np.percentile([m[0] for m in meilleur.values()], 50)
    ajout = [m for m in meilleur.values() if m[0] <= seuil + 1e-9]
    L = np.r_[L, [m[1] for m in ajout]]
    C = np.r_[C, [m[2] for m in ajout]]
    W = np.r_[W, [m[0] + 1e-6 for m in ajout]]
print(f"distance au cœur : médiane {np.median(dist):.2f} m, maximum {dist.max():.2f} m — {time.time() - t0:.0f} s")

# ---------------------------------------------------------------- l'écrire à chaque niveau de détail
for p in pieces:
    a = debut[(p["objet"], False)]
    P1 = charger(p["objet"], 1)["P"].astype(np.float64)
    arbre1 = cKDTree(P1)
    d1 = dist[a : a + len(P1)]
    for lod in range(3):
        g = charger(p["objet"], lod)
        f = os.path.join(ATT, f"lod{lod}", cle_de[p["objet"]] + ".npz")
        if g is None:
            continue
        att = dict(np.load(f)) if os.path.exists(f) else {}
        att["FS"] = np.clip(np.round(d1[arbre1.query(g["P"].astype(np.float64))[1]] / PORTEE * 255), 0, 255).astype(np.uint8)
        np.savez_compressed(f, **att)
exemples = {}
for nom in ("Ascending aorta", "Common carotid artery.l", "Radial artery.l", "Femoral artery.l", "Dorsalis pedis artery.l", "Dorsal artery of foot.l"):
    if (nom, False) in debut:
        a = debut[(nom, False)]
        exemples[nom] = round(float(np.median(dist[a : a + len(charger(nom, 1)["P"])])), 2)
print("exemples (m) :", exemples)
print(f"fini en {time.time() - t0:.0f} s")
