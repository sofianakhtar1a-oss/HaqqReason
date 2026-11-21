# L'Écorché — étape 8 : la couverture de la nomenclature.
# La Terminologia Anatomica 2 (fournie par Z-Anatomy) range ses termes par chapitre (os, articulations, muscles,
# vaisseaux, nerfs…). Dans chaque chapitre, on retient les termes qui désignent une structure entière (« … muscle »,
# « … artery », « … nerve », les nœuds lymphatiques…), puis on compte ceux que le modèle montre. Pour les viscères,
# trop divers pour une règle, la référence est une liste d'organes écrite à la main.
# Sortie : src/lib/corps/modele/couverture.json (le site l'affiche ; le test vérifie qu'elle ne recule pas).
# Usage : python 08_couverture.py
import json, os, re

from commun import TA2_CSV, norme

ICI = os.path.dirname(os.path.abspath(__file__))
MODELE = os.path.abspath(os.path.join(ICI, "..", "..", "src", "lib", "corps", "modele"))

lignes = []
with open(TA2_CSV, encoding="utf-8-sig") as f:
    for l in f:
        l = l.strip()
        if l.startswith('"') and l.endswith('"'):
            l = l[1:-1]
        c = l.split(";")
        if len(c) >= 4 and c[0].isdigit():
            lignes.append({"id": int(c[0]), "anglais": c[1].strip(), "francais": c[3].strip().lstrip(".").strip()})

# Les chapitres de la TA2 (bornes des identifiants) et ce qui y fait une structure entière.
OS_NOMMES = r"^(Humerus|Radius|Ulna|Femur|Patella|Tibia|Fibula|Clavicle|Scapula|Sternum|Sacrum|Coccyx|Mandible|Maxilla|Vomer|Atlas|Axis|Talus|Calcaneus|Hyoid bone|Ribs?|Cuboid|Navicular|Scaphoid|Lunate|Triquetrum|Pisiform|Trapezium|Trapezoid|Capitate|Hamate|Malleus|Incus|Stapes|Ethmoid|Sphenoid|Occipital bone|Frontal bone|Parietal bone|Temporal bone|Nasal bone|Lacrimal bone|Zygomatic bone|Palatine bone|Inferior nasal concha|Hip bone|Ilium|Ischium|Pubis)$"
CHAPITRES = {
    "os": ([(366, 900), (951, 1514)], lambda n: bool(re.search(r" bones?$", n) or re.match(OS_NOMMES, n))),
    "ligament": ([(1515, 1973)], lambda n: bool(re.search(r"(ligament|ligaments|meniscus|labrum|intervertebral disc)$", n, re.I))),
    "muscle": ([(1975, 2772)], lambda n: n.endswith(" muscle") and not re.match(r"^(Part|Head|Belly|Tendon)\b", n) and " part of " not in n and " head of " not in n),
    "artere": ([(4075, 4106), (4175, 4744)], lambda n: bool(re.search(r" (artery|arteries)$", n))),
    "veine": ([(4107, 4174), (4745, 5149)], lambda n: bool(re.search(r" (vein|veins|sinus)$", n))),
    "lymphe": ([(5191, 5362)], lambda n: bool(re.search(r"\bnodes?$", n))),
    "nerf": ([(6178, 6729)], lambda n: bool(re.search(r" (nerve|nerves|plexus)$|ganglion$", n))),
    "encephale": ([(5415, 6177)], lambda n: bool(re.search(r"(gyrus|gyri|sulcus|sulci|lobe|lobule|nucleus|nuclei|tract|fasciculus|ventricle|commissure|peduncle|colliculus|thalamus|hypothalamus|cerebellum|pons|medulla oblongata|midbrain|corpus callosum|fornix|hippocampus|putamen|caudate nucleus|globus pallidus|amygdaloid body|insula)$", n, re.I))),
}
# Les organes qu'un atlas d'anatomie doit montrer (noms de la TA2) : la liste de référence des viscères.
ORGANES = [
    "Tongue", "Parotid gland", "Submandibular gland", "Sublingual gland", "Palatine tonsil", "Soft palate", "Nasopharynx", "Oropharynx", "Laryngopharynx", "Epiglottis",
    "Oesophagus", "Esophagus", "Stomach", "Duodenum", "Jejunum", "Ileum", "Caecum", "Cecum", "Vermiform appendix", "Ascending colon", "Transverse colon", "Descending colon", "Sigmoid colon", "Rectum", "Anal canal",
    "Liver", "Gallbladder", "Pancreas", "Spleen", "Greater omentum", "Lesser omentum",
    "Trachea", "Right lung", "Left lung", "Pleura", "Larynx",
    "Kidney", "Ureter", "Urinary bladder", "Prostate",
    "Thyroid gland", "Parathyroid glands", "Suprarenal gland", "Hypophysis", "Pituitary gland", "Pineal gland", "Thymus",
    "Right atrium", "Left atrium", "Right ventricle", "Left ventricle",
    "Eyeball", "Cornea", "Lens", "Retina", "Iris", "Lacrimal gland", "Tympanic membrane", "Cochlea", "Semicircular ducts", "Auditory tube",
]

elements = json.load(open(os.path.join(MODELE, "elements.json"), encoding="utf-8"))
ensembles = json.load(open(os.path.join(MODELE, "ensembles.json"), encoding="utf-8"))
COTES = re.compile(r"\b(left|right)\b", re.I)
presents_id = {}
presents_nom = {}
for e in elements + ensembles:
    if e.get("ta2"):
        presents_id.setdefault(str(e["ta2"]), e)
    presents_nom.setdefault(norme(COTES.sub("", e.get("anglais", ""))), e)
    presents_nom.setdefault(norme(COTES.sub("", e.get("anglais", "")).replace(" muscle", "")), e)


def present(ligne):
    return str(ligne["id"]) in presents_id or norme(COTES.sub("", ligne["anglais"])) in presents_nom


# Les termes généraux (« os long », « muscle squelettique », « nerfs crâniens ») ne sont pas des structures ; et dans
# « Branche … de l'artère X », la structure est la branche : on juge le nom sur ce qui précède « of ».
GENERAUX = re.compile(r"^(Skeletal|Long|Short|Flat|Irregular|Pneumatized|Pneumatised|Sesamoid|Accessory|Membranous|Endochondral|Fusiform|Unipennate|Bipennate|Multipennate|Quadrate|Cutaneous|Striated|Smooth|Cranial|Spinal|Lymph|Capsular|Intracapsular|Extracapsular|Intrinsic|Extrinsic|Articular|Terminal|Visceral|Somatic|Muscular|Superficial|Deep|Regional|Primary|Secondary|Nerve|Muscle|Bone|Artery|Vein|Ligament|Nodes?|Gyrus|Sulcus|Nucleus|Tract)\b( \w+)?$", re.I)


def tete(n):
    return n.split(" of ")[0] if " of " in n else n


sortie = {}
for couche, (bornes, garder) in CHAPITRES.items():
    termes = [l for l in lignes if any(a <= l["id"] <= b for a, b in bornes) and garder(tete(l["anglais"])) and not GENERAUX.match(l["anglais"])]
    # Un même nom peut revenir (deux contextes) : on le compte une fois.
    vus = {}
    for l in termes:
        vus.setdefault(norme(l["anglais"]), l)
    termes = list(vus.values())
    ok = [l for l in termes if present(l)]
    manque = [l for l in termes if not present(l)]
    sortie[couche] = {"reference": len(termes), "presents": len(ok), "part": round(len(ok) / max(1, len(termes)), 3), "manquants": [l["francais"] or l["anglais"] for l in manque][:15]}
ref = {}
for nom in ORGANES:
    for l in lignes:
        if l["anglais"] == nom and norme(nom) not in ref:
            ref[norme(nom)] = l
termes = list(ref.values())
ok = [l for l in termes if present(l)]
sortie["viscere"] = {"reference": len(termes), "presents": len(ok), "part": round(len(ok) / max(1, len(termes)), 3), "manquants": [l["francais"] or l["anglais"] for l in termes if not present(l)][:15]}

json.dump({"elements": len(elements) + len(ensembles), "couches": sortie}, open(os.path.join(MODELE, "couverture.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
for c, v in sortie.items():
    print(f"{c:10s} {v['presents']:4d} / {v['reference']:4d}  ({100 * v['part']:.0f} %)  manquent par exemple : {', '.join(v['manquants'][:6])}")
