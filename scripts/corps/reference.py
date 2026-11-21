# L'Écorché — la référence de la nomenclature : les termes de la Terminologia Anatomica 2 qu'un atlas du corps entier
# doit montrer, couche par couche, et ceux qui restent hors du champ (avec leur raison). Partagé par l'étape 6 (qui en
# tire les ensembles) et l'étape 8 (qui compte la couverture).
import re

from commun import TA2_CSV, norme

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

# Les termes généraux (« os long », « muscle squelettique », « nerfs crâniens ») ne sont pas des structures ; et dans
# « Branche … de l'artère X », la structure est la branche : on juge le nom sur ce qui précède « of ».
GENERAUX = re.compile(r"^(Skeletal|Long|Short|Flat|Irregular|Pneumatized|Pneumatised|Sesamoid|Accessory|Membranous|Endochondral|Fusiform|Unipennate|Bipennate|Multipennate|Quadrate|Cutaneous|Striated|Smooth|Cranial|Spinal|Lymph|Capsular|Intracapsular|Extracapsular|Intrinsic|Extrinsic|Articular|Terminal|Visceral|Somatic|Muscular|Superficial|Deep|Regional|Primary|Secondary|Nerve|Muscle|Bone|Artery|Vein|Ligament|Nodes?|Gyrus|Sulcus|Nucleus|Tract)\b( \w+)?$", re.I)


# Hors du champ (seulement pour ce que le modèle n'a pas) : le corps est celui d'un homme adulte, montré à l'échelle
# d'un atlas, sans organes génitaux externes. Chaque terme écarté l'est pour une raison dite sur le site.
HORS_CHAMP = [
    ("pudeur", re.compile(r"\b(penis|scrotal|scrotum|scortal|Bulbospongiosus|Ischiocavernosus|Urethral artery|Deferential|Puboprostaticus|Cremasteric|Testicular plexus)\b", re.I)),
    ("feminin", re.compile(r"\b(ovarian|uterine|uterus|vaginal|vagina|clitoris|Pubovaginalis|Para-uterine|Paravaginal|Uterovaginal)\b|^(Anterior|Posterior) labial", re.I)),
    ("microscopique", re.compile(r"(Intrarenal|Interlobar (artery|vein) of|Arcuate (artery|vein) of kidney|Interlobular (artery|vein)|Capsular veins|^Smallest|\bEnteric plexus|Myenteric|Submucosal plexus|Central retinal|Vorticose|ciliary (arteries|veins)|Episcleral|Conjunctival|Spiral modiolar|cochlear artery|Vestibulocochlear artery|Anterior vestibular artery|Labyrinthine (artery|veins)|Nutrient arter|Radicular (artery|arteries|veins)|^Periodontal|Basivertebral|Central vein of|Portal veins of hypophysis|hypophys[ie]al artery|ligament of malleus|ligament of incus|Annular ligament of stapes|Ligaments of auditory ossicles)", re.I)),
    ("classement", re.compile(r"^(Compact bone|Spongy bone|Striated|Straight muscle|Triangular muscle|Two-bellied|Two-headed|Three-headed|Four-headed|Orbicular muscle|Sphincter muscle|Dilator muscle|Axis of pelvis)", re.I)),
    ("inconstant", re.compile(r"^\(|^Accessory (bones|carpal|tarsal)|^Sesamoid bones of knee|^Thyroidea ima|^Median artery$|^Communicating carotid", re.I)),
]
RAISONS = {
    "pudeur": "Les organes génitaux externes et ce qui n'existe que pour eux ne sont pas montrés (règle de pudeur).",
    "feminin": "Le corps du modèle est celui d'un homme : les structures propres au corps de la femme n'y sont pas.",
    "microscopique": "Trop petites ou cachées dans un organe pour un atlas à l'échelle du corps (vaisseaux du rein, de l'œil, de l'oreille interne, plexus de la paroi digestive…).",
    "classement": "Des termes de classement, pas des structures (« muscle biceps », « os compact »).",
    "inconstant": "Des variantes que beaucoup de corps n'ont pas (os accessoires, artère thyroïdienne moyenne…).",
}


def hors_champ(l):
    for raison, motif in HORS_CHAMP:
        if motif.search(l["anglais"]):
            return raison
    return None


def tete(n):
    # (les nerfs crâniens portent leur numéro : « Abducens nerve (VI) » est un nerf comme un autre)
    n = re.sub(r"\s*\((?:[IVX]+)\)$", "", n)
    return n.split(" of ")[0] if " of " in n else n




def reference():
    """{couche: [lignes de la TA2]} : les termes retenus (un par nom), avant tout tri entre présents et absents."""
    sortie = {}
    for couche, (bornes, garder) in CHAPITRES.items():
        vus = {}
        for l in lignes:
            if any(a <= l["id"] <= b for a, b in bornes) and garder(tete(l["anglais"])) and not GENERAUX.match(l["anglais"]):
                vus.setdefault(norme(l["anglais"]), l)
        sortie[couche] = list(vus.values())
    ref = {}
    for nom in ORGANES:
        for l in lignes:
            if l["anglais"] == nom and norme(nom) not in ref:
                ref[norme(nom)] = l
    sortie["viscere"] = list(ref.values())
    return sortie
