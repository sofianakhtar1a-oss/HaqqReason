# L'Écorché — étape 5 : les paquets que le site télécharge.
# Un paquet = une couche (os, muscle, tendon…), ses pièces paires (dessinées deux fois, en miroir) ou impaires,
# et un niveau de détail. Dans chaque fichier : un en-tête JSON (les pièces et leurs plages), puis des flux
# quantifiés et codés en différences, le tout compressé en gzip. Le nom du fichier porte l'empreinte du contenu :
# il ne change jamais d'adresse sans changer de nom, le navigateur peut le garder pour toujours.
# Usage : python 05_paquets.py   → public/corps/*.bin et src/lib/corps/modele/manifeste.json
import gzip, hashlib, json, os, re, struct, sys
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import reverse_cuthill_mckee
from commun import DONNEES, slug, decouper

ICI = os.path.dirname(os.path.abspath(__file__))
DEPOT = os.path.abspath(os.path.join(ICI, "..", ".."))
PUBLIC = os.path.join(DEPOT, "public", "corps")
MODELE = os.path.join(DEPOT, "src", "lib", "corps", "modele")
GEO = os.path.join(DONNEES, "geo")
os.makedirs(PUBLIC, exist_ok=True)
os.makedirs(MODELE, exist_ok=True)

ORIGINE = (-1.024, -0.1, -1.024)
PAS = 1 / 32000  # 1/32 de millimètre
VERSION = 1

classement = json.load(open(os.path.join(DONNEES, "classement.json"), encoding="utf-8"))
index = json.load(open(os.path.join(GEO, "index.json"), encoding="utf-8"))
par_objet = {p["objet"]: p for p in classement["pieces"]}
insertions = {i["objet"]: i for i in classement["insertions"]}
attributs_extra = {}
f_attr = os.path.join(DONNEES, "attributs")


def paquet_de(couche, sorte):
    """Le paquet d'une pièce : sa couche, sauf les enveloppes qu'on ne montre pas d'office."""
    if couche == "insertion":
        return "insertion"
    if sorte == "fascia":
        return "fascia"
    if sorte == "enveloppe":
        return "enveloppe"
    if sorte == "bourse":
        return "bourse"
    if sorte == "gaine":
        return "gaine"
    return couche


def cle_de(objet, cote, miroir):
    base, suff = decouper(objet)
    base = re.sub(r"^\((.*)\)$", r"\1", base)
    c = slug(base)
    if suff and suff[0] in "oe" and suff[-1] in "lr":  # une insertion : origine ou terminaison, et son rang
        return f"{c}~{suff[:-1]}"
    if cote and not miroir:
        return f"{c}:{cote}"
    return c


def oct16(N):
    """Normales → deux entiers 16 bits (projection octaédrique)."""
    n = N / np.maximum(np.abs(N).sum(1, keepdims=True), 1e-12)
    x, y = n[:, 0].copy(), n[:, 1].copy()
    bas = n[:, 2] < 0
    xo = (1 - np.abs(y)) * np.where(x >= 0, 1, -1)
    yo = (1 - np.abs(x)) * np.where(y >= 0, 1, -1)
    x = np.where(bas, xo, x)
    y = np.where(bas, yo, y)
    return np.clip(np.round(x * 32767), -32767, 32767).astype(np.int16), np.clip(np.round(y * 32767), -32767, 32767).astype(np.int16)


def zigzag16(d):
    """Différences sur 16 bits (elles bouclent : le décodeur additionne modulo 65 536), puis zigzag."""
    d = ((d.astype(np.int64) + 32768) % 65536 - 32768).astype(np.int32)
    return ((d << 1) ^ (d >> 31)).astype(np.uint16)


def varints(v):
    """Entiers positifs → octets (7 bits utiles par octet, le bit fort dit « encore »)."""
    v = np.asarray(v, dtype=np.uint64)
    out = bytearray()
    n = np.ones(len(v), dtype=np.int64)
    for k in range(1, 5):
        n += (v >= (1 << (7 * k))).astype(np.int64)
    total = int(n.sum())
    buf = np.zeros(total, dtype=np.uint8)
    pos = np.concatenate([[0], np.cumsum(n)[:-1]])
    reste = v.copy()
    for k in range(5):
        actif = n > k
        if not actif.any():
            break
        octet = (reste & 0x7F).astype(np.uint8)
        suite = (n > k + 1)
        buf[pos[actif] + k] = octet[actif] | (suite[actif].astype(np.uint8) << 7)
        reste >>= 7
    return buf.tobytes()


def ordonner(P, T):
    """Range les sommets pour que les voisins soient proches en mémoire (Cuthill-McKee), puis les triangles dans cet ordre."""
    n = len(P)
    ar = np.concatenate([T[:, [0, 1]], T[:, [1, 2]], T[:, [2, 0]]])
    g = coo_matrix((np.ones(len(ar), dtype=np.int8), (ar[:, 0], ar[:, 1])), shape=(n, n)).tocsr()
    perm = reverse_cuthill_mckee(g, symmetric_mode=False).astype(np.int64)
    inv = np.empty(n, dtype=np.int64)
    inv[perm] = np.arange(n)
    T2 = inv[T]
    # Chaque triangle commence par son plus petit sommet (en gardant le sens), puis tri par ce sommet.
    k = T2.argmin(1)
    T2 = np.stack([T2[np.arange(len(T2)), k], T2[np.arange(len(T2)), (k + 1) % 3], T2[np.arange(len(T2)), (k + 2) % 3]], axis=1)
    T2 = T2[np.lexsort((T2[:, 1], T2[:, 0]))]
    return perm, T2


def charger(cle_fichier, lod):
    f = os.path.join(GEO, f"lod{lod}", cle_fichier + ".npz")
    if not os.path.exists(f):
        return None
    d = dict(np.load(f))
    fa = os.path.join(f_attr, f"lod{lod}", cle_fichier + ".npz")
    if os.path.exists(fa):
        d.update(dict(np.load(fa)))
    return d


# Répartir les pièces dans les paquets.
groupes = {}
for e in index:
    objet = e["objet"]
    if objet in par_objet:
        p = par_objet[objet]
        paquet = paquet_de(p["couche"], p["sorte"])
        paire = bool(p["miroir"])
        cle = cle_de(objet, p["cote"], p["miroir"])
    elif objet in insertions:
        paquet, paire = "insertion", True
        cle = cle_de(objet, "g", True)
    else:
        continue
    groupes.setdefault((paquet, paire), []).append((cle, e["cle"], objet))

publication = json.load(open(os.path.join(ICI, "donnees", "publication.json"), encoding="utf-8"))
# « haute » : le niveau le plus fin est-il publié ? (Tant que non, ses paquets restent hors du dépôt : voir .gitignore.)
manifeste = {"version": VERSION, "haute": bool(publication.get("haute")), "grille": {"origine": ORIGINE, "pas": PAS}, "paquets": {}, "total": {}}
vus = set()
anciens = set(os.listdir(PUBLIC))
gardes = set()

for (paquet, paire), membres in sorted(groupes.items()):
    membres.sort(key=lambda m: m[0])
    lods = []
    for lod in range(3):
        if paquet == "insertion" and lod == 2:
            continue
        entete_pieces = []
        flux = {k: [] for k in ("px", "py", "pz", "nx", "ny", "w1", "w2", "ao", "fs", "fa", "fb", "tx", "ty", "ba", "bb", "bw", "ex")}
        ind = []
        s0 = 0
        i0 = 0
        for cle, fichier, objet in membres:
            d = charger(fichier, lod)
            if d is None:
                continue
            P, N, T = d["P"].astype(np.float64), d["N"].astype(np.float64), d["T"].astype(np.int64)
            utiles = np.unique(T)
            if len(utiles) < len(P):  # retirer les sommets orphelins
                re_ = np.full(len(P), -1, dtype=np.int64)
                re_[utiles] = np.arange(len(utiles))
                T = re_[T]
                sel = utiles
            else:
                sel = np.arange(len(P))
            perm, T = ordonner(P[sel], T)
            sel = sel[perm]
            P, N = P[sel], N[sel]
            q = np.round((P - np.array(ORIGINE)) / PAS)
            if q.min() < 0 or q.max() > 65535:
                raise SystemExit(f"hors de la grille : {objet}")
            q = q.astype(np.int64)
            for a, k in enumerate(("px", "py", "pz")):
                dlt = np.diff(q[:, a], prepend=0)
                flux[k].append(zigzag16(dlt))
            nx, ny = oct16(N)
            flux["nx"].append(zigzag16(np.diff(nx.astype(np.int32), prepend=0)))
            flux["ny"].append(zigzag16(np.diff(ny.astype(np.int32), prepend=0)))
            n = len(P)
            W = d["W"][sel]
            flux["w1"].append(W[:, 0]); flux["w2"].append(W[:, 1])
            for k, nom, defaut in (("ao", "AO", 255), ("fs", "FS", 0), ("fa", "FA", 128), ("fb", "FB", 128), ("tx", "TX", 128), ("ty", "TY", 128), ("ba", "BA", 0), ("bb", "BB", 0), ("bw", "BW", 255), ("ex", "EX", 0)):
                flux[k].append(d[nom][sel].astype(np.uint8) if nom in d else np.full(n, defaut, dtype=np.uint8))
            # Les triangles : (a − a précédent), (b − a), (c − a), tous positifs.
            a = T[:, 0]
            da = np.diff(a, prepend=0)
            code = np.stack([da, T[:, 1] - a, T[:, 2] - a], axis=1).ravel()
            ind.append(code)
            c = (P.min(0) + P.max(0)) / 2
            r = float(np.linalg.norm(P - c, axis=1).max())
            entete_pieces.append({"cle": cle, "s": [s0, n], "t": [i0, len(T)], "c": [round(float(x), 4) for x in c], "r": round(r, 4), "b": [round(float(x), 4) for x in np.concatenate([P.min(0), P.max(0)])]})
            s0 += n
            i0 += len(T)
        if not entete_pieces:
            continue
        corps = []
        decrit = {}
        pos = 0
        for k, morceaux in flux.items():
            b = np.concatenate(morceaux).tobytes()
            decrit[k] = [pos, len(b)]
            corps.append(b)
            pos += len(b)
        b = varints(np.concatenate(ind))
        decrit["tri"] = [pos, len(b)]
        corps.append(b)
        entete = {"version": VERSION, "paquet": paquet, "paire": paire, "lod": lod, "sommets": s0, "triangles": i0, "origine": ORIGINE, "pas": PAS, "pieces": entete_pieces, "flux": decrit}
        ej = json.dumps(entete, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        ej += b" " * ((4 - len(ej) % 4) % 4)
        brut = b"ECO1" + struct.pack("<I", len(ej)) + ej + b"".join(corps)
        comp = gzip.compress(brut, compresslevel=9, mtime=0)
        empreinte = hashlib.sha256(comp).hexdigest()[:10]
        nom = f"{paquet}-{'p' if paire else 'i'}{lod}-{empreinte}.bin"
        with open(os.path.join(PUBLIC, nom), "wb") as h:
            h.write(comp)
        gardes.add(nom)
        lods.append({"lod": lod, "fichier": nom, "octets": len(comp), "sommets": s0, "triangles": i0})
        print(f"{nom:44s} {len(comp) / 1e6:6.2f} Mo  {s0:8d} sommets {i0:8d} triangles {len(entete_pieces):4d} pièces")
    if lods:
        manifeste["paquets"].setdefault(paquet, {})["paire" if paire else "impaire"] = {"pieces": [m[0] for m in membres], "lods": lods}

# Retirer les anciens fichiers de paquets (les noms hachés qui ne servent plus).
for f in anciens:
    if f.endswith(".bin") and f not in gardes:
        os.remove(os.path.join(PUBLIC, f))

for lod in range(3):
    oct_ = tri = 0
    for p in manifeste["paquets"].values():
        for cote, g in p.items():
            for l in g["lods"]:
                if l["lod"] == lod:
                    oct_ += l["octets"]
                    tri += l["triangles"] * (2 if cote == "paire" else 1)
    manifeste["total"][str(lod)] = {"octets": oct_, "triangles_affiches": tri}
json.dump(manifeste, open(os.path.join(MODELE, "manifeste.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("total par niveau :", manifeste["total"])
