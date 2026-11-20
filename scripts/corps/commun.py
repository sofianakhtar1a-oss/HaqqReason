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
