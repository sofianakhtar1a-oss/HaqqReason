# L'Écorché — outils communs de la chaîne de préparation (lecture des données brutes, noms, TA2).
import glob, json, os, re, unicodedata
import numpy as np

# Où sont les sources (hors du dépôt) : le dossier qui contient donnees-corps/, z-anatomy/ et kevin-mattheus-moerman/.
RACINE = os.environ.get("RACINE_CORPS", "/home/claude" if os.path.isdir("/home/claude/donnees-corps") else os.path.expanduser("~"))
DONNEES = os.environ.get("DONNEES_CORPS", os.path.join(RACINE, "donnees-corps"))
BRUT = os.path.join(DONNEES, "brut")
TA2_CSV = os.environ.get("TA2_CSV", os.path.join(RACINE, "z-anatomy/models-of-human-anatomy/TA2.csv"))
BP3D = os.environ.get("BP3D", os.path.join(RACINE, "kevin-mattheus-moerman/bodyparts3d/assets/BodyParts3D_data"))


def objets_bruts():
    """Tous les objets exportés par 01_exporter.py, chacun avec le chemin de son fichier de géométrie."""
    objs = []
    for f in sorted(glob.glob(os.path.join(BRUT, "index-*.json"))):
        j = json.load(open(f, encoding="utf-8"))
        for o in j["objets"]:
            o["fichier"] = os.path.join(BRUT, j["geometrie"])
            objs.append(o)
    return objs


def sommets(o):
    with open(o["fichier"], "rb") as h:
        h.seek(o["o_sommets"])
        return np.frombuffer(h.read(o["sommets"] * 12), dtype=np.float32).reshape(-1, 3).copy()


def triangles(o):
    with open(o["fichier"], "rb") as h:
        h.seek(o["o_triangles"])
        return np.frombuffer(h.read(o["triangles"] * 12), dtype=np.uint32).reshape(-1, 3).copy()


def matieres(o):
    with open(o["fichier"], "rb") as h:
        h.seek(o["o_matieres"])
        return np.frombuffer(h.read(o["triangles"]), dtype=np.uint8).copy()


def aretes(o):
    with open(o["fichier"], "rb") as h:
        h.seek(o["o_aretes"])
        return np.frombuffer(h.read(o["aretes"] * 8), dtype=np.uint32).reshape(-1, 2).copy()


def vers_repere(P):
    """De Blender (z vers le haut, l'avant vers −y) à L'Écorché (y vers le haut, x vers la gauche du sujet, z vers l'avant)."""
    return np.stack([P[:, 0], P[:, 2], -P[:, 1]], axis=1)


def sans_accents(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()


def norme(s):
    return re.sub(r"[^a-z0-9]+", " ", sans_accents(s).lower()).strip()


def slug(s):
    s = sans_accents(s.replace("œ", "oe").replace("Œ", "Oe").replace("æ", "ae")).lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def lire_ta2():
    """La Terminologia Anatomica 2 fournie par Z-Anatomy : {anglais normalisé: (id, anglais, latin, français)}."""
    table = {}
    lignes = []
    with open(TA2_CSV, encoding="utf-8-sig") as f:
        for ligne in f:
            ligne = ligne.strip()
            if not ligne:
                continue
            if ligne.startswith('"') and ligne.endswith('"'):
                ligne = ligne[1:-1]
            c = ligne.split(";")
            if len(c) < 4 or c[0] == "TA2ID":
                continue
            r = {"id": c[0].strip(), "anglais": c[1].strip(), "latin": c[2].strip(), "francais": c[3].strip().lstrip(".").strip()}
            lignes.append(r)
            table.setdefault(norme(r["anglais"]), r)
    return table, lignes


SUFFIXE = re.compile(r"\.(l|r|ol|or|el|er|[oe]\d+[lr]|i|g|t|j|s|st)$")


def decouper(nom):
    """« Femur.l » → (« Femur », « l ») ; « Diaphragm.o2r » → (« Diaphragm », « o2r ») ; sans suffixe → (nom, « »)."""
    nom = re.sub(r"\.\d{3}$", "", nom).strip()
    m = SUFFIXE.search(nom)
    if not m:
        return nom, ""
    return nom[: m.start()].strip(), m.group(1)


def principale(o):
    for c in o["collections"]:
        if re.match(r"^\d: ", c):
            return c
    return "autre"


# Les surfaces d'insertion que Z-Anatomy nomme d'après un muscle entier, et les chefs qui les partagent.
GROUPES_INSERTION = {
    "quadriceps femoris muscle": ["rectus femoris muscle", "vastus lateralis muscle", "vastus medialis muscle", "vastus intermedius muscle"],
    "triceps surae muscle": ["lateral head of gastrocnemius", "medial head of gastrocnemius", "soleus muscle"],
    "biceps brachii muscle": ["long head of biceps brachii", "short head of biceps brachii"],
    "triceps brachii muscle": ["long head of triceps brachii", "lateral head of triceps brachii", "medial head of triceps brachii"],
    "deltoid muscle": ["clavicular part of deltoid muscle", "acromial part of deltoid muscle", "scapular spinal part of deltoid muscle"],
    "biceps femoris muscle": ["long head of biceps femoris", "short head of biceps femoris"],
    "pectoralis major muscle": ["clavicular head of pectoralis major muscle", "sternocostal head of pectoralis major muscle", "abdominal part of pectoralis major muscle"],
    "iliopsoas muscle": ["psoas major", "iliacus muscle"],
    "adductor pollicis": ["oblique head of adductor pollicis", "transverse head of adductor pollicis"],
    "flexor digitorum superficialis": ["humero ulnar head of flexor digitorum superficialis", "radial head of flexor digitorum superficialis"],
    "flexor carpi ulnaris": ["humeral head of flexor carpi ulnaris", "ulnar head of flexor carpi ulnaris"],
    "extensor carpi ulnaris": ["humeral head of extensor carpi ulnaris", "ulnar head of extensor carpi ulnaris"],
    "pronator teres": ["superficial head of pronator teres", "deep head of pronator teres"],
    "masseter": ["superficial part of masseter", "deep part of masseter"],
    "lateral pterygoid muscle": ["superior head of lateral pterygoid muscle", "inferior head of lateral pterygoid muscle"],
}


def eloignement(p):
    """À quel point un point est loin du centre du corps en suivant le squelette : l'origine d'un muscle est, par
    convention, son attache la plus proche du tronc (la plus haute sur un membre, la plus en arrière au pied,
    la plus proche de l'axe sur le tronc, et à égalité la plus basse)."""
    x, y, z = abs(float(p[0])), float(p[1]), float(p[2])
    if x > 0.15 and y < 1.47:  # le membre supérieur, bras le long du corps
        return 1.0 + (1.47 - y)
    if y < 0.9 and not (x < 0.12 and y > 0.78):  # le membre inférieur (hors bassin)
        if y < 0.09:  # le pied : du talon vers les orteils
            return 2.0 + (0.9 - 0.09) + (z + 0.1)
        return 2.0 + (0.9 - y)
    return 2.0 * x + 0.3 * y


# ---------------------------------------------------------------- les voiles
# Ce qui couvre les muscles qu'on vient voir et qu'un écorché classique ôte : le platysma (un peaucier tendu devant
# le cou) et la lame antérieure de la gaine du droit de l'abdomen (dans Z-Anatomy, les aponévroses des obliques
# passent devant le droit et font partie du maillage de ces muscles). On ne les montre que sur demande, avec les
# fascias ; ils ne font d'ombre à personne et ne comptent pas pour décider qu'un muscle est profond.
VOILE_ENTIER = {"platysma"}
VOILE_GAINE = {"external abdominal oblique muscle", "internal abdominal oblique muscle"}


def bord_du_droit(P):
    """Le droit de l'abdomen, tranche par tranche (5 mm) : sa limite latérale et sa face arrière."""
    import numpy as np
    y = P[:, 1]
    ys = np.arange(y.min(), y.max() + 0.005, 0.005)
    xmax = np.full(len(ys), np.nan)
    zmin = np.full(len(ys), np.nan)
    for k, y0 in enumerate(ys):
        m = (y >= y0 - 0.004) & (y < y0 + 0.004)
        if m.sum() >= 3:
            xmax[k] = np.abs(P[m, 0]).max()
            zmin[k] = P[m, 2].min()
    bon = ~np.isnan(xmax)
    xmax = np.interp(ys, ys[bon], xmax[bon])
    zmin = np.interp(ys, ys[bon], zmin[bon])
    noyau = np.ones(5) / 5
    lisse = lambda v: np.convolve(np.concatenate([[v[0]] * 2, v, [v[-1]] * 2]), noyau, mode="valid")
    return ys, lisse(xmax), lisse(zmin)


def voile(nom, P, bord):
    """La part de voile de chaque sommet d'une pièce (0 à 1), ou None si la pièce n'en a pas."""
    import numpy as np
    n = norme(nom)
    if n in VOILE_ENTIER:
        return np.ones(len(P))
    if n not in VOILE_GAINE or bord is None:
        return None
    ys, xmax, zmin = bord
    x, y = np.abs(P[:, 0]), P[:, 1]
    dans = (y >= ys[0] - 0.012) & (y <= ys[-1] + 0.012) & (P[:, 2] > np.interp(y, ys, zmin) - 0.004)
    return np.clip((np.interp(y, ys, xmax) + 0.005 - x) / 0.006, 0, 1) * dans
