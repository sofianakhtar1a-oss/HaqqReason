# L'Écorché — préparer les lots de fiches à rédiger.
# Chaque lot (une couche, une région) reçoit la liste de ses structures avec ce que l'atlas sait déjà d'elles ;
# la rédaction se fait lot par lot (voir donnees/fiches/CONSIGNES.md), puis valider_fiches.py contrôle le résultat.
# Usage : python fiches_lots.py   → donnees/fiches/entree/*.json
import collections, json, os

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
}
os.makedirs(os.path.join(FICHES, "entree"), exist_ok=True)
bilan = []
for couche, regions in LOTS.items():
    for groupe in regions:
        gs = groupe.split("+")
        els = [e for e in elements + ensembles if e["couche"] == couche and GRANDE[e["region"]] in gs and not (couche == "tendon" and e.get("genere"))]
        els.sort(key=lambda e: (e["rang"], e["region"], e["nom"]))
        lot = f"{couche}-{'-'.join(g.replace('membre-', '') for g in gs)}" if len(gs) < 5 else couche
        json.dump({"lot": lot, "couche": couche, "structures": [contexte(e) for e in els]}, open(os.path.join(FICHES, "entree", lot + ".json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        bilan.append((lot, len(els)))
# L'index : tous les identifiants valides pour les renvois (un muscle cite ses os, son nerf, ses artères, ses antagonistes).
index = {c: [{"id": e["id"], "nom": e["nom"], "region": e["region"]} for e in elements + ensembles if e["couche"] == c] for c in ("os", "muscle", "tendon", "ligament", "artere", "veine", "nerf", "viscere", "encephale", "lymphe")}
json.dump(index, open(os.path.join(FICHES, "entree", "_index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
for lot, n in bilan:
    print(f"{lot:28s} {n:4d} structures")
