# L'Écorché — étape 8 : la couverture de la nomenclature.
# La Terminologia Anatomica 2 (fournie par Z-Anatomy) range ses termes par chapitre (os, articulations, muscles,
# vaisseaux, nerfs…). Dans chaque chapitre, on retient les termes qui désignent une structure entière (« … muscle »,
# « … artery », « … nerve », les nœuds lymphatiques…), puis on compte ceux que le modèle montre : par un modèle, par un
# ensemble (le groupe de ses membres) ou par un repère (un point nommé sur sa structure). Pour les viscères, trop
# divers pour une règle, la référence est une liste d'organes écrite à la main (reference.py).
# Sortie : src/lib/corps/modele/couverture.json (le site l'affiche ; le test vérifie qu'elle ne recule pas).
# Usage : python 08_couverture.py
import json, os, re

from commun import norme
from reference import RAISONS, hors_champ, reference

ICI = os.path.dirname(os.path.abspath(__file__))
MODELE = os.path.abspath(os.path.join(ICI, "..", "..", "src", "lib", "corps", "modele"))

elements = json.load(open(os.path.join(MODELE, "elements.json"), encoding="utf-8"))
ensembles = json.load(open(os.path.join(MODELE, "ensembles.json"), encoding="utf-8"))
reperes = json.load(open(os.path.join(MODELE, "reperes.json"), encoding="utf-8"))
COTES = re.compile(r"\b(left|right)\b", re.I)
presents_id = {}
presents_nom = {}
for e in elements + ensembles:
    for t in [e.get("ta2")] + (e.get("ta2_aussi") or []):
        if t:
            presents_id.setdefault(str(t), e)
    presents_nom.setdefault(norme(COTES.sub("", e.get("anglais", ""))), e)
    presents_nom.setdefault(norme(COTES.sub("", e.get("anglais", "")).replace(" muscle", "")), e)
# Un repère nommé vaut présence : le point est montré sur sa structure, on le trouve en cherchant son nom.
par_repere = {}
for r in reperes:
    if r.get("ta2"):
        par_repere.setdefault(str(r["ta2"]), r)
    par_repere.setdefault(norme(COTES.sub("", re.sub(r"^\((.*)\)$", r"\1", r.get("anglais", "")))), r)


def present(ligne):
    n = norme(COTES.sub("", ligne["anglais"]))
    return str(ligne["id"]) in presents_id or n in presents_nom or str(ligne["id"]) in par_repere or n in par_repere


def par_repere_seul(ligne):
    n = norme(COTES.sub("", ligne["anglais"]))
    return not (str(ligne["id"]) in presents_id or n in presents_nom)


sortie = {}
tout = {}
for couche, termes in reference().items():
    ecartes = {}
    for l in termes:
        r = None if present(l) else hors_champ(l)
        if r:
            ecartes.setdefault(r, []).append(l["francais"] or l["anglais"])
    termes = [l for l in termes if present(l) or not hors_champ(l)]
    ok = [l for l in termes if present(l)]
    manque = [l for l in termes if not present(l)]
    x = {"reference": len(termes), "presents": len(ok), "part": round(len(ok) / max(1, len(termes)), 3), "reperes": sum(1 for l in ok if par_repere_seul(l)), "manquants": [l["francais"] or l["anglais"] for l in manque][:15]}
    if ecartes:
        x["hors_champ"] = ecartes
    sortie[couche] = x
    tout[couche] = [(l["id"], l["anglais"], l["francais"]) for l in manque]

construits = sum(1 for e in elements if e.get("construit"))
json.dump({"elements": len(elements) + len(ensembles), "ensembles": sum(1 for e in ensembles if e.get("membres")), "reperes": sum(1 for r in reperes if r.get("sur")), "construits": construits, "raisons": RAISONS, "couches": sortie}, open(os.path.join(MODELE, "couverture.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
# (pour le travail : la liste complète de ce qui manque, si on la demande)
if os.environ.get("COUVERTURE_TOUT"):
    json.dump(tout, open(os.environ["COUVERTURE_TOUT"], "w", encoding="utf-8"), ensure_ascii=False, indent=0)
for c, v in sortie.items():
    print(f"{c:10s} {v['presents']:4d} / {v['reference']:4d}  ({100 * v['part']:.0f} %, dont {v['reperes']} par repère)  manquent par exemple : {', '.join(v['manquants'][:5])}")
