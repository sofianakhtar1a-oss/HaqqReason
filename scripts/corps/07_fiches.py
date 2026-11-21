# L'Écorché — étape 7 : les fiches du site.
# Réunit les lots rédigés et contrôlés (donnees/fiches/sortie/*.json) en un fichier par couche, que le site ne
# télécharge qu'au moment où l'on ouvre une fiche ou un quiz de cette couche. Les tendons nés d'une règle (le
# « tendon du biceps brachial », zone du maillage de son muscle) tirent leur fiche de celle du muscle.
# Usage : python 07_fiches.py   → src/lib/corps/fiches/<couche>.json et le bilan de couverture
import collections, glob, json, os, re, subprocess, sys

ICI = os.path.dirname(os.path.abspath(__file__))
MODELE = os.path.abspath(os.path.join(ICI, "..", "..", "src", "lib", "corps", "modele"))
SORTIE = os.path.abspath(os.path.join(ICI, "..", "..", "src", "lib", "corps", "fiches"))
LOTS = os.path.join(ICI, "donnees", "fiches", "sortie")
os.makedirs(SORTIE, exist_ok=True)
elements = json.load(open(os.path.join(MODELE, "elements.json"), encoding="utf-8"))
ensembles = json.load(open(os.path.join(MODELE, "ensembles.json"), encoding="utf-8"))
par_id = {e["id"]: e for e in elements + ensembles}

fiches = collections.defaultdict(dict)  # couche → id → fiche
sources = collections.defaultdict(dict)  # couche → clé → {titre, url}
refuses = []
for f in sorted(glob.glob(os.path.join(LOTS, "*.json"))):
    lot = os.path.basename(f)[:-5]
    # Un lot n'entre que s'il passe le contrôle (un lot en cours d'écriture attend).
    if subprocess.run([sys.executable, os.path.join(ICI, "valider_fiches.py"), lot], capture_output=True).returncode != 0:
        refuses.append(lot)
        continue
    d = json.load(open(f, encoding="utf-8"))
    for fiche in d["fiches"]:
        e = par_id.get(fiche["id"])
        if not e:
            continue
        couche = e["couche"]
        x = {k: v for k, v in fiche.items() if k != "id" and v not in (None, "", [])}
        cles = []
        for cle in fiche.get("sources", []):
            s = d["sources"].get(cle)
            if not s:
                continue
            # Deux lots peuvent donner la même clé à deux pages différentes : on la distingue par le lot.
            nom = cle if sources[couche].get(cle, s).get("url") == s.get("url") else f"{cle}@{lot}"
            sources[couche][nom] = {"titre": s.get("titre", cle), "url": s.get("url", "")}
            cles.append(nom)
        x["sources"] = cles
        fiches[couche][fiche["id"]] = x

# Les tendons nés d'une règle : leur fiche vient du muscle.
nb_derives = 0
for e in elements:
    if e["couche"] != "tendon" or not e.get("genere") or e["id"] in fiches["tendon"]:
        continue
    m = fiches["muscle"].get(e.get("muscle"))
    if not m:
        continue
    origine = e["id"].startswith("tendon-origine-")
    attaches = m.get("origine" if origine else "terminaison", [])
    muscle = par_id[e["muscle"]]
    art = muscle.get("art", "le ")
    du = {"le ": "du ", "les ": "des "}.get(art, "de " + art)
    fiches["tendon"][e["id"]] = {
        "resume": f"Le tendon par lequel {art}{muscle['nom'][0].lower() + muscle['nom'][1:]} {'prend son origine' if origine else 'se termine'}.",
        "muscles": [e["muscle"]],
        "attache": " ; ".join(a["texte"] for a in attaches)[:260],
        "role": ("Ancre le muscle à son point fixe : " if origine else "Transmet la force du muscle : ") + m["action"][0].lower() + m["action"][1:],
        "derive": True,
        "sources": m.get("sources", []),
    }
    for cle in m.get("sources", []):
        if cle in sources["muscle"]:
            sources["tendon"][cle] = sources["muscle"][cle]
    nb_derives += 1

bilan = {}
for couche in ("os", "muscle", "tendon", "artere", "ligament", "veine", "nerf", "viscere", "encephale", "lymphe"):
    attendus = [e["id"] for e in elements + ensembles if e["couche"] == couche and (e.get("membres") or e in elements)]
    faits = [i for i in attendus if i in fiches[couche]]
    bilan[couche] = [len(faits), len(attendus)]
    cible = os.path.join(SORTIE, couche + ".json")
    if fiches[couche]:
        utiles = {c for f in fiches[couche].values() for c in f.get("sources", [])}
        json.dump({"sources": {c: s for c, s in sorted(sources[couche].items()) if c in utiles}, "fiches": fiches[couche]}, open(cible, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        print(f"{couche:10s} {len(faits):4d} / {len(attendus):4d} fiches  {os.path.getsize(cible) / 1024:6.0f} Ko")
    else:
        print(f"{couche:10s}    0 / {len(attendus):4d}")
json.dump(bilan, open(os.path.join(SORTIE, "bilan.json"), "w", encoding="utf-8"), separators=(",", ":"))
print("tendons tirés de leur muscle :", nb_derives)
if refuses:
    print("lots en attente (contrôle non passé) :", ", ".join(refuses))
