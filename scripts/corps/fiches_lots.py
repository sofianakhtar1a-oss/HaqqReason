# L'Écorché — préparer les lots de fiches à rédiger.
# Chaque lot (une couche, une région) reçoit la liste de ses structures avec ce que l'atlas sait déjà d'elles ;
# la rédaction se fait lot par lot (voir donnees/fiches/CONSIGNES.md), puis valider_fiches.py contrôle le résultat.
# Usage : python fiches_lots.py [--refaire]   → donnees/fiches/entree/*.json (les lots existants ne sont réécrits
#         qu'avec --refaire)
import collections, json, os, re, sys

ICI = os.path.dirname(os.path.abspath(__file__))
MODELE = os.path.abspath(os.path.join(ICI, "..", "..", "src", "lib", "corps", "modele"))
FICHES = os.path.join(ICI, "donnees", "fiches")
elements = json.load(open(os.path.join(MODELE, "elements.json"), encoding="utf-8"))
ensembles = [e for e in json.load(open(os.path.join(MODELE, "ensembles.json"), encoding="utf-8")) if e.get("membres")]
pieces = json.load(open(os.path.join(MODELE, "pieces.json"), encoding="utf-8"))
par_id = {e["id"]: e for e in elements + ensembles}
nom = lambda i: par_id[i]["nom"] if i in par_id else i

GRANDE = {"tete": "tete", "cou": "cou", "thorax": "tronc", "abdomen": "tronc", "dos": "tronc", "bassin": "tronc", "epaule": "membre-sup", "bras": "membre-sup", "avant-bras": "membre-sup", "main": "membre-sup", "hanche": "membre-inf", "cuisse": "membre-inf", "jambe": "membre-inf", "pied": "membre-inf"}
chefs = collections.defaultdict(list)
peau = {}
for p in pieces:
    if p.get("nom"):
        chefs[p["element"]].append(p["nom"])
    if p.get("peau"):
        peau[p["element"]] = min(peau.get(p["element"], 1e9), p["peau"][0])

HERITES = ("noms", "action", "origine", "terminaison", "innervation", "sorte", "articulations", "provenance", "territoire", "muscle", "attache", "memo", "anecdote", "nombre")


def contexte(e):
    """Ce qu'on sait déjà d'une structure : ses noms, et ce que l'atlas ou la première version en disent."""
    x = {"id": e["id"], "nom": e["nom"], "latin": e["latin"], "anglais": e["anglais"], "region": e["region"], "rang": e["rang"]}
    for k in ("officiel", "ta2", "nature", "loge", "profondeur", "inconstant", "zone", "genere"):
        if e.get(k) not in (None, False, ""):
            x[k] = e[k]
    connu = {k: e[k] for k in HERITES if e.get(k)}
    if e.get("origines"):
        connu["os_d_origine_selon_l_atlas"] = [nom(i) for i in e["origines"]]
    if e.get("terminaisons"):
        connu["os_de_terminaison_selon_l_atlas"] = [nom(i) for i in e["terminaisons"]]
    if e.get("nerf"):
        connu["nerf_selon_l_atlas"] = {"id": e["nerf"], "nom": nom(e["nerf"])}
    if e.get("muscle") and e["muscle"] in par_id:
        connu["muscle"] = {"id": e["muscle"], "nom": nom(e["muscle"])}
    if e.get("membres"):
        connu["membres"] = [{"id": i, "nom": nom(i)} for i in e["membres"]]
    if e.get("ensemble"):
        connu["ensemble"] = {"id": e["ensemble"], "nom": nom(e["ensemble"])}
    if chefs.get(e["id"]):
        connu["parties_modelisees"] = sorted(set(chefs[e["id"]]))
    # Une structure construite par L'Écorché : la description écrite pour la tracer, et ce sur quoi elle s'appuie.
    if e.get("resume"):
        connu["description_du_trace"] = e["resume"]
    if e.get("appui"):
        connu["appui_dans_le_modele"] = {"id": e["appui"], "nom": nom(e["appui"])}
    if e.get("noms"):
        connu["autres_noms"] = e["noms"]
    if e["id"] in peau:
        connu["profondeur_sous_la_peau_mm"] = peau[e["id"]]
    if connu:
        x["connu"] = connu
    return x


# Les lots : couche → régions (les tendons nés d'une règle se déduiront de la fiche de leur muscle).
LOTS = {
    "muscle": ["tete", "cou", "tronc", "membre-sup", "membre-inf"],
    "artere": ["tete+cou", "tronc", "membre-sup+membre-inf"],
    "os": ["tete+cou", "tronc", "membre-sup+membre-inf"],
    "tendon": ["tete+cou+tronc+membre-sup+membre-inf"],
    "ligament": ["tete+cou+tronc", "membre-sup", "membre-inf"],
    "veine": ["tete+cou", "tronc", "membre-sup+membre-inf"],
    "nerf": ["tete+cou+tronc", "membre-sup", "membre-inf"],
    "viscere": ["tete+cou", "tronc"],
    "encephale": ["cortex", "profond"],
    "lymphe": ["tete+cou+tronc", "abdomen+bassin+membres"],
}
# L'encéphale est presque entier dans la tête : on le partage entre le cortex (lobes, gyrus, sillons) et le reste.
CORTEX = re.compile(r"^(gyrus|gyri|sillon|lobe|lobule|scissure|p[oô]le|insula|op[ée]rcule|cun[ée]us|pr[ée]cun[ée]us|uncus|cortex|aire|fissure|incisure)", re.I)


def dans(e, couche, groupe):
    gs = groupe.split("+")
    if couche == "encephale":
        return (groupe == "cortex") == bool(CORTEX.match(e["nom"]))
    if couche == "lymphe":
        tronc = e["region"] in ("tete", "cou", "thorax")
        return tronc if groupe == "tete+cou+tronc" else not tronc
    return GRANDE[e["region"]] in gs
os.makedirs(os.path.join(FICHES, "entree"), exist_ok=True)
bilan = []
# --manquantes : les structures qui n'ont pas encore de fiche (ajoutées après la première rédaction) forment des lots
# nouveaux, « <couche>-ajouts-<n> », de 40 structures au plus, rangées par région ; les lots existants ne bougent pas.
if "--manquantes" in sys.argv:
    MODELE_FICHES = os.path.abspath(os.path.join(ICI, "..", "..", "src", "lib", "corps", "fiches"))
    deja = set()
    for f in os.listdir(os.path.join(FICHES, "sortie")):
        if f.endswith(".json"):
            deja |= {x["id"] for x in json.load(open(os.path.join(FICHES, "sortie", f), encoding="utf-8")).get("fiches", []) if isinstance(x, dict)}
    distribues = set()
    for f in os.listdir(os.path.join(FICHES, "entree")):
        if f.endswith(".json") and not f.startswith("_"):
            distribues |= {x["id"] for x in json.load(open(os.path.join(FICHES, "entree", f), encoding="utf-8")).get("structures", [])}
    ORDRE = ["tete", "cou", "thorax", "abdomen", "dos", "bassin", "epaule", "bras", "avant-bras", "main", "hanche", "cuisse", "jambe", "pied"]
    for couche in LOTS:
        els = [e for e in elements + ensembles if e["couche"] == couche and e["id"] not in deja and e["id"] not in distribues and not (couche == "tendon" and e.get("genere"))]
        els.sort(key=lambda e: (ORDRE.index(e["region"]) if e["region"] in ORDRE else 99, e["rang"], e["nom"]))
        if not els:
            continue
        n = max(1, -(-len(els) // 40))
        pas = -(-len(els) // n)
        k = 1
        while os.path.exists(os.path.join(FICHES, "entree", f"{couche}-ajouts-{k}.json")):
            k += 1
        for i in range(n):
            part = els[i * pas : (i + 1) * pas]
            lot = f"{couche}-ajouts-{k + i}"
            json.dump({"lot": lot, "couche": couche, "structures": [contexte(e) for e in part]}, open(os.path.join(FICHES, "entree", lot + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            bilan.append((lot, len(part)))
    LOTS = {}
for couche, regions in LOTS.items():
    for groupe in regions:
        gs = groupe.split("+")
        els = [e for e in elements + ensembles if e["couche"] == couche and dans(e, couche, groupe) and not (couche == "tendon" and e.get("genere"))]
        els.sort(key=lambda e: (e["rang"], e["region"], e["nom"]))
        lot = f"{couche}-{'-'.join(g.replace('membre-', '') for g in gs)}" if len(gs) < 5 else couche
        if couche in ("encephale", "lymphe"):
            lot = f"{couche}-{groupe.replace('+', '-')}"
        cible = os.path.join(FICHES, "entree", lot + ".json")
        # Un lot déjà distribué ne change plus (sa rédaction s'y réfère), sauf demande expresse.
        if os.path.exists(cible) and "--refaire" not in sys.argv:
            bilan.append((lot + " (inchangé)", len(els)))
            continue
        json.dump({"lot": lot, "couche": couche, "structures": [contexte(e) for e in els]}, open(cible, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        bilan.append((lot, len(els)))
# L'index : tous les identifiants valides pour les renvois (un muscle cite ses os, son nerf, ses artères, ses antagonistes).
index = {c: [{"id": e["id"], "nom": e["nom"], "region": e["region"]} for e in elements + ensembles if e["couche"] == c] for c in ("os", "muscle", "tendon", "ligament", "artere", "veine", "nerf", "viscere", "encephale", "lymphe")}
json.dump(index, open(os.path.join(FICHES, "entree", "_index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
for lot, n in bilan:
    print(f"{lot:28s} {n:4d} structures")
