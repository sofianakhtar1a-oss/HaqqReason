# L'Écorché — étape 4 bis : le sens des fibres.
# Pour chaque muscle (et chaque tendon, ligament, vaisseau), trois attributs par sommet :
#   • FS : la position le long de la fibre, de l'origine (0) à la terminaison (255) ;
#   • TX, TY : la direction de la fibre (octaédrique), pour étirer les reflets et orienter le relief ;
#   • FA, FB : la position en travers des fibres, sous la forme d'une phase (cosinus, sinus) de période 16 mm,
#     pour dessiner des faisceaux qui suivent vraiment le muscle.
# La méthode : un champ harmonique sur la surface, entre les deux attaches (les surfaces d'insertion de Z-Anatomy,
# à défaut les contacts avec les os, à défaut les deux bouts) ; les fibres suivent sa pente ; la coordonnée en travers
# vient d'une intégration (Poisson) pour les muscles plats, de l'angle autour de l'axe pour les muscles ronds.
# Usage : python 04b_fibres.py [couche ...]   (ajoute ses champs aux fichiers de ~/donnees-corps/attributs)
import json, os, re, sys, time, collections
import numpy as np
from scipy import sparse
from scipy.sparse import csgraph
from scipy.sparse.linalg import spsolve
from scipy.spatial import cKDTree
from commun import DONNEES, GROUPES_INSERTION, decouper, eloignement, norme, slug

GEO = os.path.join(DONNEES, "geo")
ATT = os.path.join(DONNEES, "attributs")
PERIODE = 0.016
classement = json.load(open(os.path.join(DONNEES, "classement.json"), encoding="utf-8"))
index = json.load(open(os.path.join(GEO, "index.json"), encoding="utf-8"))
par_objet = {p["objet"]: p for p in classement["pieces"]}
filtre = set(sys.argv[1:])


def charger(cle, lod):
    f = os.path.join(GEO, f"lod{lod}", cle + ".npz")
    return dict(np.load(f)) if os.path.exists(f) else None


# Les surfaces d'insertion de chaque muscle (côté gauche), et les os (pour les contacts).
ins_par_muscle = collections.defaultdict(lambda: {"origine": [], "terminaison": []})
for e in index:
    if e["couche"] != "insertion":
        continue
    base, suff = decouper(e["objet"])
    d = charger(e["cle"], 1)
    if d is None:
        continue
    ins_par_muscle[norme(base)]["origine" if suff[0] == "o" else "terminaison"].append(d["P"])
os_P, os_id = [], []
for k, e in enumerate(index):
    if e["couche"] == "os":
        d = charger(e["cle"], 1)
        if d is not None:
            os_P.append(d["P"]); os_id.append(np.full(len(d["P"]), k))
            p = par_objet.get(e["objet"])
            if p and p["miroir"]:
                os_P.append(d["P"] * np.array([-1, 1, 1], dtype=np.float32)); os_id.append(np.full(len(d["P"]), k + 100000))
arbre_os = cKDTree(np.concatenate(os_P))
os_id = np.concatenate(os_id)

for groupe, membres in GROUPES_INSERTION.items():
    for m in membres:
        for sorte in ("origine", "terminaison"):
            ins_par_muscle[norme(m)][sorte] += ins_par_muscle[norme(groupe)][sorte]


def aires_normales(P, T):
    n = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
    a2 = np.linalg.norm(n, axis=1)
    return a2 / 2, n / np.maximum(a2, 1e-20)[:, None]


def laplacien(P, T):
    """Laplacien aux cotangentes (bornées pour rester positif)."""
    n = len(P)
    I, J, V = [], [], []
    for k in range(3):
        i, j, o = T[:, k], T[:, (k + 1) % 3], T[:, (k + 2) % 3]
        u, v = P[i] - P[o], P[j] - P[o]
        cot = (u * v).sum(1) / np.maximum(np.linalg.norm(np.cross(u, v), axis=1), 1e-20)
        w = np.clip(0.5 * cot, 1e-3, 30.0)
        I += [i, j]; J += [j, i]; V += [w, w]
    W = sparse.coo_matrix((np.concatenate(V), (np.concatenate(I), np.concatenate(J))), shape=(n, n)).tocsr()
    return sparse.diags(np.asarray(W.sum(1)).ravel()) - W


def gradient(P, T, f, nf, A):
    """La pente d'un champ scalaire sur chaque face (vecteur dans le plan de la face)."""
    f0, f1, f2 = f[T[:, 0]], f[T[:, 1]], f[T[:, 2]]
    p0, p1, p2 = P[T[:, 0]], P[T[:, 1]], P[T[:, 2]]
    g = f0[:, None] * np.cross(nf, p2 - p1) + f1[:, None] * np.cross(nf, p0 - p2) + f2[:, None] * np.cross(nf, p1 - p0)
    return g / np.maximum(2 * A, 1e-20)[:, None]


def divergence(P, T, X, nf, A):
    """La divergence d'un champ de vecteurs par face, ramenée aux sommets (second membre de Poisson)."""
    n = len(P)
    d = np.zeros(n)
    p = [P[T[:, k]] for k in range(3)]
    for k in range(3):
        # la pente de la fonction chapeau du sommet k : cross(nf, arête opposée) / (2A)
        e = p[(k + 2) % 3] - p[(k + 1) % 3]
        gk = np.cross(nf, e) / np.maximum(2 * A, 1e-20)[:, None]
        np.add.at(d, T[:, k], A * (gk * X).sum(1))
    return d


def aux_sommets(n, T, X, A):
    V = np.zeros((n, 3))
    for k in range(3):
        np.add.at(V, T[:, k], X * A[:, None])
    return V


def unitaires(V, defaut):
    l = np.linalg.norm(V, axis=1)
    bon = l > 1e-9
    return np.where(bon[:, None], V / np.maximum(l, 1e-20)[:, None], defaut)


def axe_principal(P):
    c = P.mean(0)
    w, v = np.linalg.eigh(np.cov((P - c).T))
    return c, v[:, 2], v[:, 1], np.sqrt(np.maximum(w, 0))[::-1]


def octa(V):
    n = V / np.maximum(np.abs(V).sum(1, keepdims=True), 1e-12)
    x, y = n[:, 0].copy(), n[:, 1].copy()
    bas = n[:, 2] < 0
    xo = (1 - np.abs(y)) * np.where(x >= 0, 1, -1)
    yo = (1 - np.abs(x)) * np.where(y >= 0, 1, -1)
    x = np.where(bas, xo, x); y = np.where(bas, yo, y)
    return np.clip(np.round((x * 0.5 + 0.5) * 255), 0, 255).astype(np.uint8), np.clip(np.round((y * 0.5 + 0.5) * 255), 0, 255).astype(np.uint8)


def bouts(P, comp_P, nom, tendon):
    """Les deux attaches d'une composante : indices de l'origine, indices de la terminaison (dans la composante)."""
    ins = ins_par_muscle.get(norme(nom))
    if ins and (ins["origine"] or ins["terminaison"]):
        res = []
        for sorte in ("origine", "terminaison"):
            if ins[sorte]:
                d, _ = cKDTree(np.concatenate(ins[sorte])).query(comp_P)
                res.append(np.where(d < 0.006)[0])
            else:
                res.append(np.zeros(0, dtype=int))
        if len(res[0]) and len(res[1]) and not np.intersect1d(res[0], res[1]).size:
            return res[0], res[1], "insertions"
        # Une seule attache connue : l'autre est le bout opposé.
        connu = res[0] if len(res[0]) else res[1]
        if len(connu):
            c0 = comp_P[connu].mean(0)
            d = np.linalg.norm(comp_P - c0, axis=1)
            autre = np.where(d > np.quantile(d, 0.94))[0]
            autre = np.setdiff1d(autre, connu)
            if len(autre):
                return (connu, autre, "une insertion") if len(res[0]) else (autre, connu, "une insertion")
    # Les contacts avec les os : les deux groupes les plus éloignés.
    d, i = arbre_os.query(comp_P)
    contact = np.where(d < 0.0032)[0]
    if len(contact) >= 6:
        ids = os_id[i[contact]]
        groupes = [contact[ids == g] for g in np.unique(ids)]
        groupes = [g for g in groupes if len(g) >= 3]
        if len(groupes) >= 2:
            centres = np.array([comp_P[g].mean(0) for g in groupes])
            D = np.linalg.norm(centres[:, None] - centres[None], axis=2)
            a, b = np.unravel_index(D.argmax(), D.shape)
            if D[a, b] > 0.012:
                # Chaque groupe de contact rejoint le pôle dont il est le plus proche.
                g0 = np.concatenate([g for g, c in zip(groupes, centres) if np.linalg.norm(c - centres[a]) <= np.linalg.norm(c - centres[b])])
                g1 = np.concatenate([g for g, c in zip(groupes, centres) if np.linalg.norm(c - centres[a]) > np.linalg.norm(c - centres[b])])
                # L'origine : le bout le plus proche du tronc (ou le plus haut).
                if eloignement(comp_P[g0].mean(0)) > eloignement(comp_P[g1].mean(0)):
                    g0, g1 = g1, g0
                return g0, g1, "os"
    # À défaut : les deux bouts le long du grand axe.
    c, axe, _, _ = axe_principal(comp_P)
    t = (comp_P - c) @ axe
    lo, hi = np.quantile(t, 0.035), np.quantile(t, 0.965)
    g0, g1 = np.where(t <= lo)[0], np.where(t >= hi)[0]
    if eloignement(comp_P[g0].mean(0)) > eloignement(comp_P[g1].mean(0)):
        g0, g1 = g1, g0
    return g0, g1, "axe"


def champ(P, T, nom, tendon, rond_force=False):
    """Pour une composante connexe : (s, direction de fibre par sommet, phase en travers)."""
    n = len(P)
    A, nf = aires_normales(P, T)
    c, axe, axe2, ecarts = axe_principal(P)
    g0, g1, methode = bouts(P, P, nom, tendon)
    s = None
    if len(g0) and len(g1) and n >= 8:
        L = laplacien(P, T)
        fixe = np.zeros(n, dtype=bool)
        fixe[g0] = fixe[g1] = True
        val = np.zeros(n)
        val[g1] = 1.0
        libre = ~fixe
        if libre.sum() > 0:
            try:
                x = spsolve(L[libre][:, libre].tocsc(), -(L[libre][:, fixe] @ val[fixe]))
                if np.all(np.isfinite(x)):
                    s = val.copy()
                    s[libre] = np.clip(x, 0, 1)
            except Exception:
                s = None
    if s is None:
        t = (P - c) @ axe
        s = (t - t.min()) / max(1e-9, t.max() - t.min())
        methode = "axe (sans champ)"
    gs = gradient(P, T, s, nf, A)
    tf = unitaires(gs, np.cross(nf, np.cross(axe, nf)))  # direction de fibre par face
    tv = unitaires(aux_sommets(n, T, tf, A), axe)
    # L'axe du muscle : les centres de tranches de s, leur repère, leurs largeurs.
    K = int(np.clip(n // 120, 5, 28))
    bord = np.linspace(0, 1, K + 1)
    rang = np.clip(np.searchsorted(bord, s, side="right") - 1, 0, K - 1)
    centres = np.zeros((K, 3)); valides = np.zeros(K, dtype=bool)
    for k in range(K):
        m = rang == k
        if m.sum() >= 3:
            centres[k] = P[m].mean(0); valides[k] = True
    if valides.sum() < 2:
        centres = np.array([c - axe * 0.01, c + axe * 0.01]); K = 2; valides = np.ones(2, dtype=bool)
        rang = (s > 0.5).astype(int)
    idx = np.where(valides)[0]
    for k in range(K):
        if not valides[k]:
            j = idx[np.argmin(np.abs(idx - k))]
            centres[k] = centres[j]
    tau = np.gradient(centres, axis=0)
    tau = unitaires(tau, axe)
    e1s, s1, s2 = np.zeros((K, 3)), np.zeros(K), np.zeros(K)
    prec = None
    for k in range(K):
        m = rang == k
        Q = P[m] - centres[k] if m.sum() >= 3 else P - c
        Q = Q - np.outer(Q @ tau[k], tau[k])
        w, v = np.linalg.eigh(Q.T @ Q / max(1, len(Q)))
        e1 = v[:, 2]
        if prec is not None and e1 @ prec < 0:
            e1 = -e1
        prec = e1
        e1s[k] = e1; s1[k] = np.sqrt(max(w[2], 1e-10)); s2[k] = np.sqrt(max(w[1], 1e-10))
    plat = float(np.median(s1 / np.maximum(s2, 1e-6)))
    s1r, s2r = float(np.median(s1)), float(np.median(s2))
    pos = np.clip(s * K - 0.5, 0, K - 1)
    k0 = np.floor(pos).astype(int); k1 = np.minimum(k0 + 1, K - 1); f = (pos - k0)[:, None]
    cv = centres[k0] * (1 - f) + centres[k1] * f
    e1v = unitaires(e1s[k0] * (1 - f) + e1s[k1] * f, axe2)
    tauv = unitaires(tau[k0] * (1 - f) + tau[k1] * f, axe)
    if plat > 2.2 and not rond_force:
        # Muscle plat : la coordonnée en travers s'intègre sur la surface (Poisson), orientée par le grand axe des tranches.
        sf = s[T].mean(1)
        posf = np.clip(sf * K - 0.5, 0, K - 1)
        kf = np.round(posf).astype(int)
        b = np.cross(nf, tf)
        signe = np.sign((b * e1s[kf]).sum(1))
        signe[signe == 0] = 1
        b = b * signe[:, None]
        L = laplacien(P, T)
        div = divergence(P, T, b, nf, A)
        try:
            u = spsolve((L + sparse.identity(n) * 1e-8).tocsc(), div)
            # Le signe du laplacien : L = D − W, donc L u = −div.
            u = -u
            if not np.all(np.isfinite(u)):
                raise ValueError
        except Exception:
            u = (P - cv) @ e1v.T if False else ((P - cv) * e1v).sum(1)
        # Vérifier l'orientation et l'échelle : la pente de u doit valoir b.
        gu = gradient(P, T, u, nf, A)
        accord = float(((gu * b).sum(1) * A).sum() / max(1e-12, A.sum()))
        if accord < 0:
            u = -u
            accord = -accord
        if accord < 0.25:  # l'intégration a échoué : coordonnée latérale simple
            u = ((P - cv) * e1v).sum(1)
        phase = 2 * np.pi * u / PERIODE
        forme = "plat"
    else:
        # Muscle rond : l'angle autour de l'axe, un nombre entier de périodes sur le tour.
        e2v = np.cross(tauv, e1v)
        o = P - cv
        x = (o * e1v).sum(1) / max(s1r, 1e-6)
        y = (o * e2v).sum(1) / max(s2r, 1e-6)
        theta = np.arctan2(y, x)
        tour = 2 * np.pi * np.sqrt(2) * np.sqrt(s1r * s2r)
        M = max(2, int(round(tour / PERIODE)))
        phase = theta * M
        forme = "rond"
    return s, tv, phase, methode, forme


CIBLES = ("muscle", "tendon", "ligament")
debut = time.time()
stats = collections.Counter()
for e in index:
    couche = e["couche"]
    if filtre and couche not in filtre:
        continue
    if couche not in CIBLES and couche not in ("artere", "veine", "nerf"):
        continue
    d0 = charger(e["cle"], 0)
    if d0 is None:
        continue
    P, T = d0["P"].astype(np.float64), d0["T"].astype(np.int64)
    n = len(P)
    S = np.zeros(n); TV = np.zeros((n, 3)); PH = np.zeros(n)
    if couche in CIBLES:
        base, _ = decouper(e["objet"])
        base = re.sub(r"^\((.*)\)$", r"\1", base)
        ar = np.concatenate([T[:, [0, 1]], T[:, [1, 2]]])
        g = sparse.coo_matrix((np.ones(len(ar)), (ar[:, 0], ar[:, 1])), shape=(n, n))
        nc, lab = csgraph.connected_components(g, directed=False)
        labf = lab[T[:, 0]]
        for c in range(nc):
            sel = np.where(lab == c)[0]
            if len(sel) < 4:
                continue
            re_ = np.full(n, -1); re_[sel] = np.arange(len(sel))
            Tc = re_[T[labf == c]]
            if len(Tc) < 2:
                continue
            try:
                s, tv, ph, methode, forme = champ(P[sel], Tc, base, d0["W"][sel, 0], rond_force=couche != "muscle" and e["sorte"] in ("tendon", "ligament"))
            except Exception as err:
                cc, axe, _, _ = axe_principal(P[sel])
                t = (P[sel] - cc) @ axe
                s = (t - t.min()) / max(1e-9, t.max() - t.min()); tv = np.tile(axe, (len(sel), 1)); ph = np.zeros(len(sel)); methode, forme = "échec", "rond"
            S[sel] = s; TV[sel] = tv; PH[sel] = ph
            stats[(couche, methode, forme)] += 1
    else:
        # Vaisseaux et nerfs : la fibre suit l'axe du tube (la pente de l'abscisse).
        if "A" in d0:
            A, nf = aires_normales(P, T)
            absc = d0["A"].astype(np.float64)
            gs = gradient(P, T, absc, nf, A)
            c, axe, _, _ = axe_principal(P)
            TV = unitaires(aux_sommets(n, T, gs, A), axe)
            S = (absc - absc.min()) / max(1e-9, absc.max() - absc.min())
        else:
            c, axe, _, _ = axe_principal(P)
            TV = np.tile(axe, (n, 1)); t = (P - c) @ axe; S = (t - t.min()) / max(1e-9, t.max() - t.min())
    arbre = cKDTree(P)
    tx, ty = octa(TV)
    champs0 = {"FS": np.clip(np.round(S * 255), 0, 255).astype(np.uint8), "FA": np.clip(np.round((np.cos(PH) * 0.5 + 0.5) * 255), 0, 255).astype(np.uint8), "FB": np.clip(np.round((np.sin(PH) * 0.5 + 0.5) * 255), 0, 255).astype(np.uint8), "TX": tx, "TY": ty}
    for lod in range(3):
        g = charger(e["cle"], lod)
        if g is None:
            continue
        f = os.path.join(ATT, f"lod{lod}", e["cle"] + ".npz")
        acquis = dict(np.load(f)) if os.path.exists(f) else {}
        if lod == 0:
            acquis.update(champs0)
        else:
            i = arbre.query(g["P"])[1]
            acquis.update({k: v[i] for k, v in champs0.items()})
        np.savez(f, **acquis)
print("fibres :", {k: v for k, v in sorted(stats.items(), key=lambda x: -x[1])})
print(f"fini en {time.time() - debut:.0f} s")
