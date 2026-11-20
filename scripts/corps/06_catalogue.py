# L'Écorché — étape 6 : le catalogue tiré des modèles.
# Des pièces classées (étape 2) on fait les éléments à apprendre : un muscle réunit ses chefs, une paire ses deux côtés ;
# chaque élément reçoit son nom officiel (TA2 : français, latin, anglais), un identifiant stable (ceux de la première
# version de L'Écorché sont repris tels quels, avec leurs fiches), sa région, son rang, et ce que Z-Anatomy sait de lui :
# les os où un muscle s'attache (surfaces d'insertion), son nerf et sa loge (collections), sa profondeur.
# Usage : python 06_catalogue.py   → src/lib/corps/modele/{pieces,elements,ensembles,insertions,reperes}.json
import collections, json, os, re, sys
import numpy as np
from commun import DONNEES, decouper, lire_ta2, norme, slug, vers_repere

ICI = os.path.dirname(os.path.abspath(__file__))
DEPOT = os.path.abspath(os.path.join(ICI, "..", ".."))
MODELE = os.path.join(DEPOT, "src", "lib", "corps", "modele")
GEO = os.path.join(DONNEES, "geo")
os.makedirs(MODELE, exist_ok=True)

classement = json.load(open(os.path.join(DONNEES, "classement.json"), encoding="utf-8"))
index = json.load(open(os.path.join(GEO, "index.json"), encoding="utf-8"))
heritage = json.load(open(os.path.join(ICI, "donnees", "heritage.json"), encoding="utf-8"))
profondeurs = json.load(open(os.path.join(DONNEES, "attributs", "profondeurs.json"), encoding="utf-8")) if os.path.exists(os.path.join(DONNEES, "attributs", "profondeurs.json")) else {}
ta2, ta2_lignes = lire_ta2()
fichier_de = {e["objet"]: e["cle"] for e in index}
sys.path.insert(0, ICI)
from importlib import import_module

paquets = import_module("05_paquets".replace("05_", "p05_")) if False else None


def paquet_de(couche, sorte):
    if couche == "insertion":
        return "insertion"
    if sorte in ("fascia", "enveloppe", "bourse", "gaine"):
        return sorte
    return couche


def cle_de(objet, cote, miroir):
    base, suff = decouper(objet)
    base = re.sub(r"^\((.*)\)$", r"\1", base)
    c = slug(base)
    if suff and suff[0] in "oe" and suff[-1] in "lr":
        return f"{c}~{suff[:-1]}"
    if cote and not miroir:
        return f"{c}:{cote}"
    return c


def boite(objet):
    f = os.path.join(GEO, "lod2", fichier_de.get(objet, "?") + ".npz")
    if not os.path.exists(f):
        f = os.path.join(GEO, "lod1", fichier_de.get(objet, "?") + ".npz")
    if not os.path.exists(f):
        return None
    P = np.load(f)["P"]
    return P.min(0), P.max(0), P.mean(0)


def ta(anglais):
    b = anglais.strip()
    for e in (b, b + " muscle", re.sub(r" muscle$", "", b), re.sub(r"\s*\(.*?\)\s*", " ", b).strip()):
        r = ta2.get(norme(e))
        if r:
            return r
    return None


# ---------------------------------------------------------------- 1. à quel élément appartient chaque pièce

PARTIE = re.compile(r"^(?:(?!\bof\b).)+?\s(?:head|heads|part|parts|belly)\sof\s(.+)$", re.I)
# Quelques rattachements que la règle « … part of X » ne voit pas.
RATTACHEMENTS = {
    "Inferior vena cava (abdominal part)": "Inferior vena cava",
    "Inferior vena cava (thoracic part)": "Inferior vena cava",
    "Middle cerebral artery (M1-segment)": "Middle cerebral artery",
    "Middle cerebral artery (M3 segment)": "Middle cerebral artery",
    "Insular branches of middle cerebral artery (M2-segment)": "Middle cerebral artery",
    "Cingulate gyrus (Posteroventral part*)": "Cingulate gyrus",
    "Cingulate gyrus and sulcus (Middle anterior part)": "Cingulate gyrus",
    "Cingulate gyrus and sulcus (Middle posterior part)": "Cingulate gyrus",
    "Cingulate gyrus and sulcus (Posterior dorsal part)": "Cingulate gyrus",
    "Precentral sulcus (Superior part)*": "Precentral sulcus",
    "Precentral sulcus (inferior part)*": "Precentral sulcus",
    "Anterior meniscotibial ligament (Lateral meniscus)": "Meniscotibial ligaments",
    "Anterior meniscotibial ligament (Medial meniscus)": "Meniscotibial ligaments",
    "Posterior meniscotibial ligament (Lateral meniscus)": "Meniscotibial ligaments",
    "Posterior meniscotibial ligament (Medial meniscus)": "Meniscotibial ligaments",
}
HORS_TA = {
    "Middle cerebral artery": ("Artère cérébrale moyenne", "Arteria cerebri media", None),
    "Meniscotibial ligaments": ("Ligaments ménisco-tibiaux", "Ligamenta meniscotibialia", None),
    "Cingulate gyrus": ("Gyrus cingulaire", "Gyrus cinguli", None),
    "Precentral sulcus": ("Sillon précentral", "Sulcus precentralis", None),
    # Le gant de Z-Anatomy (voir 02_classer.py) ; la vraie aponévrose palmaire est une zone du long palmaire.
    "Palmar aponeurosis": ("Fascia palmaire", "Fascia palmaris manus", None),
}


CORRECTIONS = [
    (r"^\((.*)\)$", r"\1"), (r"\bArtere\b", "Artère"), (r"\bFacia\b", "Fascia"), (r"\bMusclé\b", "Muscle"), (r"\bTroisème\b", "Troisième"), (r"\bCristalin\b", "Cristallin"),
    (r"\bEpiglotte\b", "Épiglotte"), (r"\bEtrier\b", "Étrier"), (r"\bMoëlle\b", "Moelle"), (r"\bOesophage\b", "Œsophage"), (r"\boesophag", "œsophag"), (r"\bArythénoïde\b", "Aryténoïdien"),
    (r"ymphonoeud", "ymphonœud"), (r"\bHabenula\b", "Habénula"), (r"\bnoeud", "nœud"), (r"\bNoeud", "Nœud"), (r"\boeil\b", "œil"), (r"\bcoeur\b", "cœur"), (r"métacrapien", "métacarpien"),
    (r"\bplaxus\b", "plexus"), (r"\bocculaire\b", "oculaire"), (r"cunéïforme", "cunéiforme"), (r"^Os cornet\b", "Cornet"), (r"\bCuneus\b", "Cunéus"), (r"\s+", " "),
]


def nettoyer(nom):
    for motif, par in CORRECTIONS:
        nom = re.sub(motif, par, nom)
    return nom.strip()


# L'article : « le biceps », « la clavicule », « l'aorte », « les vertèbres lombaires ».
PLURIELS = set("artères bourses branches capsules cartilages courts fibres freins gaines ganglions gyri intercostaux interosseux intertransversaires interépineux ligaments lombricaux longs lymphonœuds nœuds multifides nerfs noyaux racines rameaux rotateurs sillons veines muscles tendons rétinaculums vertèbres côtes phalanges métacarpiens métatarsiens cunéiformes dents intersections plantaires fausses vraies vaisseaux glandes".split())
FEMININS = set("bifurcation bourse branche bronche base capsule carotide chambre clavicule commissure corde corne cornée couche cuspide côte dent division dure-mère faux fibula fosse gaine gencive glande grande lame langue ligne lingula mandibule membrane moelle muqueuse partie patella phalange plèvre prostate pyramide queue-de-cheval racine rate rétine scapula scissure sclère strie substance symphyse tente tonsille trachée trochlée trompe valvule veine vertèbre vessie vésicule zone petite première".split())
ORDINAUX = set("deuxième troisième quatrième cinquième sixième septième huitième neuvième dixième onzième douzième".split())
NOMS_FEMININS = set("côte vertèbre phalange molaire prémolaire artère veine branche dent".split())


def article(nom):
    mots = nom.lower().replace("’", "'").split()
    premier = mots[0]
    if premier in PLURIELS or (premier == "os" and len(mots) > 1 and re.search(r"[sx]$", mots[1])):
        return "les "
    if premier in ORDINAUX:
        suivant = mots[1] if len(mots) > 1 else ""
        return "la " if suivant in NOMS_FEMININS else ("le " if premier in ("huitième", "onzième") or not re.match(r"[aeéèêiîoôuœh]", premier) else "l'")
    if re.match(r"[aeéèêiîoôuœ]", premier) or (premier.startswith("h") and premier not in ("huitième", "hamatum")):
        return "l'"
    return "la " if premier in FEMININS else "le "


def de(nom):
    """« du biceps », « de la clavicule », « de l'aorte », « des lombricaux »."""
    a = article(nom)
    minus = nom if re.match(r"(C\d|T\d|L\d)", nom) else nom[0].lower() + nom[1:]
    return {"le ": "du ", "la ": "de la ", "l'": "de l'", "les ": "des "}[a] + minus


def element_anglais(p):
    """Le nom anglais de l'élément d'une pièce : le muscle pour un chef, la pièce elle-même sinon."""
    a = p["anglais"]
    if a in RATTACHEMENTS:
        return RATTACHEMENTS[a]
    if p["couche"] in ("muscle", "ligament"):
        m = PARTIE.match(a)
        if m:
            parent = m.group(1).strip()
            r = ta(parent)
            if r:
                return r["anglais"]
    return a


# ---------------------------------------------------------------- 2. les éléments

HERITAGE_ANGLAIS = {
    # identifiant d'origine → nom(s) anglais dans Z-Anatomy, quand le rapprochement automatique ne suffit pas
    "os-nasaux": ["Nasal bone"], "maxillaire": ["Maxilla"], "zygomatique": ["Zygomatic bone"], "hyoide": ["Hyoid bone"],
    "atlas": ["Atlas (C1)"], "axis": ["Axis (C2)"], "c7": ["Vertebra C7"],
    "scaphoide": ["Scaphoid bone"], "lunatum": ["Lunate bone"], "triquetrum": ["Triquetrum bone"], "pisiforme": ["Pisiform bone"],
    "os-trapeze": ["Trapezium bone"], "trapezoide": ["Trapezoid bone"], "capitatum": ["Capitate bone"], "hamatum": ["Hamate bone"],
    "naviculaire": ["Navicular bone"], "cuboide": ["Cuboid bone"],
    "muscle-temporal": ["Temporalis muscle"], "masseter": ["Masseter"], "orbiculaire-oeil": ["Orbicularis oculi"], "orbiculaire-bouche": ["Orbicularis oris muscle"],
    "grand-zygomatique": ["Zygomaticus major muscle"], "releveur-levre-superieure": ["Levator labii superioris"], "abaisseur-angle-bouche": ["Depressor anguli oris"],
    "buccinateur": ["Bucinator"], "trapeze": ["Trapezius muscle"], "splenius-tete": ["Splenius capitis muscle"], "elevateur-scapula": ["Levator scapulae"],
    "scalene-anterieur": ["Scalenus anterior muscle"], "scalene-moyen": ["Scalenus medius muscle"], "digastrique": ["Digastric muscle"],
    "droit-abdomen": ["Rectus abdominis muscle"], "oblique-externe": ["External abdominal oblique muscle"], "oblique-interne": ["Internal abdominal oblique muscle"],
    "transverse-abdomen": ["Transversus abdominis muscle"], "grand-psoas": ["Psoas major"], "carre-lombes": ["Quadratus lumborum muscle"],
    "supra-epineux": ["Supraspinatus muscle"], "infra-epineux": ["Infraspinatus muscle"], "tenseur-fascia-lata": ["Tensor fasciae latae"],
    "deltoide": ["Deltoid muscle"], "biceps-brachial": ["Biceps brachii muscle"], "triceps-brachial": ["Triceps brachii muscle"],
    "long-extenseur-radial-carpe": ["Extensor carpi radialis longus"], "court-extenseur-radial-carpe": ["Extensor carpi radialis brevis"],
    "extenseur-doigts": ["Extensor digitorum"], "extenseur-ulnaire-carpe": ["Extensor carpi ulnaris"], "long-abducteur-pouce": ["Abductor pollicis longus"],
    "court-extenseur-pouce": ["Extensor pollicis brevis"], "rond-pronateur": ["Pronator teres"], "flechisseur-radial-carpe": ["Flexor carpi radialis"],
    "flechisseur-ulnaire-carpe": ["Flexor carpi ulnaris"], "flechisseur-superficiel-doigts": ["Flexor digitorum superficialis"],
    "flechisseur-profond-doigts": ["Flexor digitorum profundus"], "long-flechisseur-pouce": ["Flexor pollicis longus"], "carre-pronateur": ["Pronator quadratus"],
    "court-abducteur-pouce": ["Abductor pollicis brevis"], "court-flechisseur-pouce": ["Flexor pollicis brevis"], "opposant-pouce": ["Opponens pollicis muscle"],
    "adducteur-pouce": ["Adductor pollicis"], "abducteur-petit-doigt": ["Abductor digiti minimi of hand"], "interosseux-dorsaux": ["Dorsal interossei muscles of hand"],
    "long-adducteur": ["Adductor longus"], "court-adducteur": ["Adductor brevis"], "grand-adducteur": ["Adductor magnus"], "biceps-femoral": ["Biceps femoris muscle"],
    "gastrocnemien": ["Gastrocnemius muscle"], "long-flechisseur-orteils": ["Flexor digitorum longus"], "long-flechisseur-hallux": ["Flexor hallucis longus"],
    "long-extenseur-orteils": ["Extensor digitorum longus"], "long-extenseur-hallux": ["Extensor hallucis longus"], "court-extenseur-orteils": ["Extensor digitorum brevis"],
    "abducteur-hallux": ["Abductor hallucis"], "abducteur-petit-orteil": ["Abductor digiti minimi of foot"], "court-flechisseur-orteils": ["Flexor digitorum brevis"],
    "retinaculum-flechisseurs": ["Flexor retinaculum of wrist"], "retinaculum-extenseurs": ["Extensor retinaculum of wrist"],
    "tronc-coeliaque": ["Coeliac trunk"], "humerale": ["Brachial artery"], "humerale-profonde": ["Deep brachial artery"],
    "semi-tendineux": ["Semitendinosus muscle"], "semi-membraneux": ["Semimembranosus muscle"], "sterno-cleido-mastoidien": ["Sternocleidomastoid muscle"],
    "sacrum": ["Sacrum"], "coccyx": ["Coccyx"], "tendons-extenseurs-orteils": ["Tendon of extensor digitorum longus"], "aponevrose-palmaire": ["(zone du long palmaire)"],
}
# Les éléments d'origine qui étaient des groupes : ils deviennent des ensembles (identifiant → noms anglais des membres).
ENSEMBLES_HERITES = {
    "vertebres-cervicales": ["Vertebra C3", "Vertebra C4", "Vertebra C5", "Vertebra C6"],
    "vertebres-thoraciques": [f"Vertebra T{i}" for i in range(1, 13)],
    "vertebres-lombaires": [f"Vertebra L{i}" for i in range(1, 6)],
    "sternum": ["Manubrium of sternum", "Body of sternum", "Xiphoid process"],
    "cotes-vraies": ["First rib", "Second rib", "Third rib", "Fourth rib", "Fifth rib", "Sixth rib", "Seventh rib"],
    "fausses-cotes": ["Eighth rib", "Ninth rib", "Tenth rib"],
    "cotes-flottantes": ["Eleventh rib", "Twelfth rib"],
    "cartilages-costaux": [f"Costal cartilage of {n} rib" for n in ("first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth")],
    "metacarpiens": [f"{n} metacarpal bone" for n in ("First", "Second", "Third", "Fourth", "Fifth")],
    "phalanges-proximales": [f"Proximal phalanx of {n} finger of hand" for n in ("first", "second", "third", "fourth", "fifth")],
    "phalanges-moyennes": [f"Middle phalanx of {n} finger of hand" for n in ("second", "third", "fourth", "fifth")],
    "phalanges-distales": [f"Distal phalanx of {n} finger of hand" for n in ("first", "second", "third", "fourth", "fifth")],
    "cuneiformes": ["Medial cuneiform bone", "Intermediate cuneiform bone", "Lateral cuneiform bone"],
    "metatarsiens": [f"{n} metatarsal bone" for n in ("First", "Second", "Third", "Fourth", "Fifth")],
    "phalanges-pied": [f"{a} phalanx of {n} finger of foot" for a in ("Proximal", "Middle", "Distal") for n in ("first", "second", "third", "fourth", "fifth")],
    "ilium": ["Hip bone"], "ischium": ["Hip bone"], "pubis": ["Hip bone"],
    "occipito-frontal": ["Frontalis muscle", "Occipitalis muscle"],
    "intercostaux": ["External intercostal muscles", "Internal intercostal muscles", "Innermost intercostal muscles"],
    "epineux": ["Spinalis thoracis muscle", "Spinalis colli muscle", "Spinalis capitis muscle"],
    "longissimus": ["Longissimus thoracis muscle", "Longissimus colli muscle", "Longissimus capitis muscle"],
    "ilio-costal": ["Iliocostalis lumborum muscle", "Iliocostalis thoracis muscle", "Iliocostalis colli muscle"],
    "aorte": ["Ascending aorta", "Aortic arch", "Thoracic aorta", "Abdominal aorta"],
    "arteres-intercostales": ["Posterior intercostal arteries", "First posterior intercostal artery", "Second posterior intercostal artery"],
    "plantaires": ["Medial plantar artery", "Lateral plantar artery"],
    "fascia-thoraco-lombaire": ["Posterior layer of thoracolumbar fascia", "Middle layer of thoracolumbar fascia", "Anterior layer of thoracolumbar fascia"],
    "retinaculums-cheville": ["Superior extensor retinaculum of ankle", "Inferior extensor retinaculum of ankle"],
}

# Les pièces → éléments.
groupes = collections.OrderedDict()
for p in classement["pieces"]:
    ea = element_anglais(p)
    groupes.setdefault((p["couche"], ea), []).append(p)

her_par_anglais = {}
for h in heritage:
    noms = HERITAGE_ANGLAIS.get(h["id"]) or [h["anglais"]]
    for n in noms:
        for v in (n, n + " muscle", n + " bone", re.sub(r" (muscle|bone)$", "", n)):
            her_par_anglais.setdefault((h["couche"], norme(v)), h)

elements = []
ids_pris = {}
el_par_anglais = {}
her_trouves = set()
for (couche, ea), ps in groupes.items():
    r = ta(ea)
    if ea in HORS_TA:
        fr, la, tid = HORS_TA[ea]
    elif r:
        fr, la, tid = r["francais"], r["latin"], r["id"]
    else:
        fr, la, tid = ps[0]["francais"] or ea, ps[0]["latin"] or ea, ps[0]["ta2"]
    fr = nettoyer(fr)
    h = her_par_anglais.get((couche, norme(ea))) or (her_par_anglais.get(("tendon", norme(ea))) if couche == "ligament" else None)
    if h and h["id"] in ENSEMBLES_HERITES:
        h = None
    nom = fr
    if couche == "muscle":
        nom = re.sub(r"^Muscles? ", "", nom)
        nom = nom[0].upper() + nom[1:]
    if h:
        ident = h["id"]
        her_trouves.add(h["id"])
    else:
        ident = slug(nom if couche == "muscle" else fr)
        if ident in ids_pris or any(x["id"] == ident for x in heritage):
            ident = f"{couche}-{ident}"
        k = 2
        base_id = ident
        while ident in ids_pris:
            ident = f"{base_id}-{k}"
            k += 1
    ids_pris[ident] = True
    cotes = {p["cote"] for p in ps}
    pair = any(p["miroir"] for p in ps) or ("g" in cotes and "d" in cotes)
    e = {"id": ident, "couche": couche, "nom": h["nom"] if h else nom, "officiel": fr, "latin": la, "anglais": ea, "ta2": tid, "pair": bool(pair), "nature": ps[0]["sorte"], "inconstant": all(p.get("inconstant") for p in ps), "_pieces": ps, "_heritage": h}
    elements.append(e)
    el_par_anglais[(couche, norme(ea))] = e
    el_par_anglais.setdefault(("*", norme(ea)), e)

# ---------------------------------------------------------------- 3. la région et le rang

boites = {p["objet"]: boite(p["objet"]) for p in classement["pieces"]}


def y_de(nom, bout):
    b = boites.get(nom)
    return float(b[0][1] if bout == "bas" else b[1][1] if bout == "haut" else b[2][1]) if b else None


Y = {
    "menton": y_de("Mandible", "bas"), "c7": y_de("Vertebra C7", "centre"), "epaule": y_de("Humerus.l", "haut"), "coude": y_de("Humerus.l", "bas"), "poignet": y_de("Radius.l", "bas"),
    "hanche": y_de("Femur.l", "haut"), "genou": y_de("Femur.l", "bas"), "cheville": y_de("Tibia.l", "bas"), "xiphoide": y_de("Xiphoid process", "bas"), "cretes": y_de("Hip bone.l", "haut"),
    "t1": y_de("Vertebra T1", "centre"),
}
X_EPAULE = float(boites["Humerus.l"][0][0])


def region_de(e):
    h = e["_heritage"]
    if h:
        return h["region"]
    ps = e["_pieces"]
    cols = set(c for p in ps for c in p["collections"])
    cs = [boites[p["objet"]] for p in ps if boites.get(p["objet"])]
    if not cs:
        return "thorax"
    c = np.mean([b[2] for b in cs], axis=0)
    x, y, z = abs(float(c[0])), float(c[1]), float(c[2])
    a = e["anglais"].lower()
    if e["couche"] == "os":
        if re.search(r"vertebra c|atlas|axis|hyoid|thyroid|cricoid|arytenoid|corniculate", a):
            return "cou"
        if re.search(r"vertebra [tl]", a):
            return "dos"
        if re.search(r"rib|sternum|xiphoid|costal", a):
            return "thorax"
        if re.search(r"sacrum|coccyx|hip bone", a):
            return "bassin"
        if re.search(r"clavicle|scapula", a):
            return "epaule"
    haut = cols & {"Left upper limb", "Right upper limb", "Left hand", "Right hand"}
    bas = cols & {"Left lower limb", "Right lower limb", "Left foot", "Right foot"}
    if haut and not bas or (not cols & {"Trunk", "Head", "Neck"} and x > X_EPAULE - 0.01 and y < Y["epaule"] + 0.02 and y > Y["poignet"] - 0.25):
        if y > Y["epaule"] - 0.07:
            return "epaule"
        if y > Y["coude"] - 0.015:
            return "bras"
        if y > Y["poignet"] + 0.012:
            return "avant-bras"
        return "main"
    if bas or (not cols & {"Trunk", "Head", "Neck"} and y < Y["hanche"] - 0.06):
        if y > Y["hanche"] - 0.05:
            return "hanche"
        if y > Y["genou"] - 0.02:
            return "cuisse"
        if y > Y["cheville"] + 0.03:
            return "jambe"
        return "pied"
    if "Head" in cols or y > Y["menton"] + 0.005:
        return "tete"
    if "Neck" in cols or y > Y["t1"]:
        return "cou"
    if "Back" in cols or (e["couche"] in ("muscle", "ligament") and z < -0.045 and "Abdomen" not in cols and "Thorax" not in cols):
        return "dos"
    if y > Y["xiphoide"] - 0.01:
        return "thorax"
    if y > Y["cretes"] - 0.02:
        return "abdomen"
    return "bassin"


def rang_de(e):
    h = e["_heritage"]
    if h:
        return h["rang"]
    a = e["anglais"].lower()
    ps = e["_pieces"]
    c = e["couche"]
    if c == "os":
        if e["nature"] == "dent" or re.search(r"phalanx|vertebra|rib\b|costal cartilage|sesamoid|corniculate|arytenoid|alar|septal", a):
            return 3
        return 2
    if c == "muscle":
        prof = min(profondeurs.get(p["objet"], 1) for p in ps)
        tri = sum(p["triangles"] for p in ps)
        return 1 if prof == 0 and tri > 3000 else 2 if prof <= 1 else 3
    if c in ("artere", "veine", "nerf"):
        tri = sum(p["triangles"] for p in ps)
        if re.search(r"branch|branches|digital|metacarpal|metatarsal|segment|perforating|ciliary|septal|striate", a):
            return 3
        return 2 if tri > 3500 else 3
    if c == "tendon":
        return 2 if e["nature"] in ("aponevrose", "retinaculum", "tendon") else 3
    return 2 if sum(p["triangles"] for p in ps) > 6000 else 3


LOGES = {
    "Anterior compartment of arm": "Loge antérieure du bras", "Posterior compartment of arm": "Loge postérieure du bras",
    "Anterior compartment of forearm": "Loge antérieure de l'avant-bras", "Posterior compartment of forearm": "Loge postérieure de l'avant-bras",
    "Anterior compartment of thigh": "Loge antérieure de la cuisse", "Medial compartment of thigh": "Loge médiale de la cuisse", "Posterior compartment of thigh": "Loge postérieure de la cuisse",
    "Anterior compartment of leg": "Loge antérieure de la jambe", "Lateral compartment of leg": "Loge latérale de la jambe", "Posterior compartment of leg": "Loge postérieure de la jambe",
    "Rotator cuff muscles": "Coiffe des rotateurs", "Facial muscles": "Muscles de la mimique", "Erector spinae": "Érecteurs du rachis", "Transversospinal muscles": "Muscles transversaires épineux",
    "Suboccipital muscles": "Muscles sous-occipitaux", "Laryngeal muscles": "Muscles du larynx", "Pharyngeal muscles": "Muscles du pharynx", "Deep gluteal muscles": "Muscles fessiers profonds",
    "Superficial gluteal muscles": "Muscles fessiers superficiels", "Muscles of hand": "Muscles intrinsèques de la main", "Muscles of foot": "Muscles intrinsèques du pied",
    "Muscles of abdomen": "Paroi de l'abdomen", "Hypaxial muscles of back": "Muscles superficiels du dos",
}
compte_col = collections.Counter(c for p in classement["pieces"] for c in p["collections"])
nerfs_connus = {norme(e["anglais"]): e for e in elements if e["couche"] == "nerf"}

for e in elements:
    e["region"] = region_de(e)
    e["rang"] = rang_de(e)
    ps = e["_pieces"]
    if e["couche"] in ("muscle", "tendon"):
        profs = [profondeurs.get(p["objet"]) for p in ps if p["objet"] in profondeurs]
        if profs:
            e["profondeur"] = int(min(profs))
    if e["couche"] == "muscle":
        cols = collections.Counter(c for p in ps for c in p["collections"])
        nerfs = [c for c in cols if norme(c) in nerfs_connus]
        if nerfs:
            # Le plus précis : la collection la moins peuplée.
            nerfs.sort(key=lambda c: compte_col[c])
            e["nerf"] = nerfs_connus[norme(nerfs[0])]["id"]
        loges = [LOGES[c] for c in cols if c in LOGES]
        if loges:
            e["loge"] = loges[0]
        fam = [m for p in ps for m in p["mats"] if m and m != "Tendon"]
        if fam:
            e["famille"] = collections.Counter(fam).most_common(1)[0][0]
        e["tendineux"] = any("Tendon" in p["mats"] for p in ps)
    n = len(ps) + sum(1 for p in ps if p["miroir"])
    if len(ps) > 1:
        e["chefs"] = len(ps)

# ---------------------------------------------------------------- 4. les insertions (origines et terminaisons sur les os)

COLLECTIFS = {
    "Quadriceps femoris muscle": ["Rectus femoris muscle", "Vastus lateralis muscle", "Vastus medialis muscle", "Vastus intermedius muscle"],
    "Triceps surae muscle": ["Gastrocnemius muscle", "Soleus muscle"],
    "Erector spinae": ["Iliocostalis lumborum muscle", "Longissimus thoracis muscle", "Spinalis thoracis muscle"],
    "Iliopsoas muscle": ["Psoas major", "Iliacus muscle"],
    "Common flexor tendon": ["Flexor carpi radialis", "Palmaris longus muscle", "Flexor carpi ulnaris", "Flexor digitorum superficialis", "Pronator teres"],
    "Common extensor tendon": ["Extensor carpi radialis brevis", "Extensor digitorum", "Extensor digiti minimi", "Extensor carpi ulnaris"],
    "Levator ani": ["Pubococcygeus muscle", "Iliococcygeus muscle", "Pubo-analis muscle"],
    "Patellar ligament": ["Rectus femoris muscle", "Vastus lateralis muscle", "Vastus medialis muscle", "Vastus intermedius muscle"],
}


def muscles_de(nom):
    noms = COLLECTIFS.get(nom) or [nom]
    res = []
    for n in noms:
        faux = {"couche": "muscle", "anglais": n}
        ea = element_anglais(faux)
        e = el_par_anglais.get(("muscle", norme(ea))) or el_par_anglais.get(("muscle", norme(ea + " muscle"))) or el_par_anglais.get(("muscle", norme(re.sub(r" muscle$", "", ea)))) or el_par_anglais.get(("*", norme(ea)))
        if e:
            res.append(e)
    return res


os_par_objet = {}
for e in elements:
    for p in e["_pieces"]:
        os_par_objet[p["objet"]] = e
insertions_json = []
sans_muscle = collections.Counter()
for i in classement["insertions"]:
    if i["cote"] != "g":
        continue
    ms = muscles_de(i["muscle"])
    porteur = os_par_objet.get(i["os"]) or os_par_objet.get((i["os"] or "")[:-2] + ".l")
    if not ms:
        sans_muscle[i["muscle"]] += 1
        continue
    cle = cle_de(i["objet"], "g", True)
    insertions_json.append({"cle": cle, "sorte": i["sorte"], "muscles": [m["id"] for m in ms], "os": porteur["id"] if porteur else None})
    for m in ms:
        champ = "origines" if i["sorte"] == "origine" else "terminaisons"
        if porteur and porteur["id"] not in m.setdefault(champ, []):
            m[champ].append(porteur["id"])

# ---------------------------------------------------------------- 5. les ensembles (groupes d'éléments)

ensembles = []
for h in heritage:
    membres_a = ENSEMBLES_HERITES.get(h["id"])
    if not membres_a:
        continue
    membres = []
    for n in membres_a:
        e = el_par_anglais.get((h["couche"], norme(n))) or el_par_anglais.get(("*", norme(n))) or el_par_anglais.get(("*", norme(n + " muscle")))
        if e and e["id"] not in membres:
            membres.append(e["id"])
    her_trouves.add(h["id"])
    x = dict(h)
    x["membres"] = membres
    ensembles.append(x)
    for mid in membres:
        e = next(x for x in elements if x["id"] == mid)
        e.setdefault("ensemble", h["id"])

# ---------------------------------------------------------------- 5 bis. les tendons portés par les muscles (zones)

# Dans Z-Anatomy, le tendon d'un muscle est une partie de son maillage. L'étape 4 ter a donné un code à chaque zone
# (1 : côté de l'origine, 2 : côté de la terminaison, 3 : le ligament patellaire). Chaque zone assez grande devient
# une structure de la couche des tendons : celle de la première version quand elle existait, sinon « Tendon du … ».
f_zones = os.path.join(DONNEES, "zones.json")
zones = json.load(open(f_zones, encoding="utf-8")) if os.path.exists(f_zones) else {}
SEUIL_ZONE = 0.3  # cm² de tendon pour faire une structure
QUADRICEPS = ["Rectus femoris muscle", "Vastus lateralis muscle", "Vastus medialis muscle", "Vastus intermedius muscle"]
ZONES_HERITEES = {
    "tendon-long-biceps": [("Long head of biceps brachii", 1)],
    "tendon-biceps": [("Long head of biceps brachii", 2), ("Short head of biceps brachii", 2)],
    "tendon-triceps": [(n, 2) for n in ("Long head of triceps brachii", "Lateral head of triceps brachii", "Medial head of triceps brachii")],
    "tendon-brachio-radial": [("Brachioradialis muscle", 2)],
    "tendon-flechisseur-radial-carpe": [("Flexor carpi radialis", 2)],
    "tendon-long-palmaire": [("Palmaris longus muscle", 2)],
    "aponevrose-palmaire": [("Palmaris longus muscle", 3)],
    "tendon-flechisseur-ulnaire-carpe": [("Humeral head of flexor carpi ulnaris", 2), ("Ulnar head of flexor carpi ulnaris", 2)],
    "tendons-extenseurs-radiaux": [("Extensor carpi radialis longus", 2), ("Extensor carpi radialis brevis", 2)],
    "tendon-extenseur-ulnaire-carpe": [("Humeral head of extensor carpi ulnaris", 2), ("Ulnar head of extensor carpi ulnaris", 2)],
    "tendons-pouce": [("Abductor pollicis longus", 2), ("Extensor pollicis brevis", 2), ("Extensor pollicis longus", 2)],
    "tendons-flechisseurs-doigts": [("Humero-ulnar head of flexor digitorum superficialis", 2), ("Radial head of flexor digitorum superficialis", 2), ("Flexor digitorum profundus", 2)],
    "tendons-extenseurs-doigts": [("Extensor digitorum", 2), ("Extensor indicis", 2), ("Extensor digiti minimi", 2)],
    "tendon-quadricipital": [(n, 2) for n in QUADRICEPS],
    "ligament-patellaire": [(n, 3) for n in QUADRICEPS],
    "tendon-semi-tendineux": [("Semitendinosus muscle", 2)],
    "tendon-tibial-anterieur": [("Tibialis anterior muscle", 2)],
    "tendon-long-extenseur-hallux": [("Extensor hallucis longus", 2)],
    "tendons-extenseurs-orteils": [("Extensor digitorum longus", 2)],
    "tendons-fibulaires": [("Fibularis longus muscle", 2), ("Fibularis brevis muscle", 2)],
    "tendons-malleole-mediale": [("Tibialis posterior muscle", 2), ("Flexor digitorum longus", 2), ("Flexor hallucis longus", 2)],
    "intersections-tendineuses": [("Rectus abdominis muscle", 1), ("Rectus abdominis muscle", 2)],
    "centre-tendineux": [("Diaphragm", 1), ("Diaphragm", 2)],
    "tendon-calcaneen": [("Soleus muscle", 2), ("Lateral head of gastrocnemius", 2), ("Medial head of gastrocnemius", 2)],
}
zone_heritee = {(norme(n), code): ident for ident, l in ZONES_HERITEES.items() for n, code in l}
her_par_id = {h["id"]: h for h in heritage}
el_par_id = {e["id"]: e for e in elements}
zones_de_piece = {}
nb_zones = collections.Counter()
# Des tendons que la règle générale nommerait mal.
ZONES_NOMMEES = {
    ("Short head of biceps brachii", 1): ("tendon-court-biceps", "Tendon du chef court du biceps", "Tendo capitis brevis musculi bicipitis brachii", "Tendon of short head of biceps brachii"),
    ("External abdominal oblique muscle", 3): ("gaine-du-droit", "Gaine du droit de l'abdomen", "Vagina musculi recti abdominis (lamina anterior)", "Rectus sheath (anterior layer)"),
    ("Internal abdominal oblique muscle", 3): ("gaine-du-droit", "Gaine du droit de l'abdomen", "Vagina musculi recti abdominis (lamina anterior)", "Rectus sheath (anterior layer)"),
}
# Ce qu'on ne montre qu'avec les fascias (voir commun.py : les voiles).
VOILES = {"gaine-du-droit": "fascia", "platysma": "fascia"}
zone_nommee = {(norme(n), code): v for (n, code), v in ZONES_NOMMEES.items()}
VISAGE = re.compile(r"zygomatic|risorius|procerus|nasalis|mentalis|depressor|levator (labii|nasolabialis|anguli)|platysma|temporoparietalis|frontalis|occipitalis|orbicularis|corrugator|bucinator|auricular", re.I)
for e in list(elements):
    if e["couche"] != "muscle" or VISAGE.search(e["anglais"]):
        continue  # les muscles de la mimique s'attachent à la peau : pas de tendon à apprendre
    trouvees = []
    for p in e["_pieces"]:
        base = norme(re.sub(r"^\((.*)\)$", r"\1", p["anglais"]))
        for code, info in sorted((zones.get(p["objet"]) or {}).items()):
            if info["a"] >= SEUIL_ZONE:
                trouvees.append((p, int(code), info, zone_heritee.get((base, int(code))), zone_nommee.get((base, int(code)))))
    # Sans tendon terminal propre (il porte déjà un autre nom, ou le muscle n'en a pas), c'est le tendon d'origine.
    libres = {code for _, code, _, her, nommee in trouvees if not her and not nommee}
    origine_seule = libres == {1}
    for p, code, info, her, nommee in trouvees:
        if her:
            ident = her
        elif nommee:
            ident = nommee[0]
        else:
            ident = ("tendon-origine-" if origine_seule else "tendon-") + e["id"]
        t = el_par_id.get(ident)
        if t is None:
            h = her_par_id.get(ident)
            if h:
                t = {"id": ident, "couche": "tendon", "nom": h["nom"], "officiel": h["nom"], "latin": h["latin"], "anglais": h["anglais"], "ta2": None, "pair": h["pair"], "nature": "tendon", "inconstant": False, "_pieces": [], "_heritage": h, "region": h["region"], "rang": h["rang"]}
                her_trouves.add(ident)
            else:
                court = re.sub(r" muscle$", "", e["anglais"])
                if nommee:
                    nom, latin, anglais = nommee[1], nommee[2], nommee[3]
                else:
                    nom = ("Tendon d'origine " if origine_seule else "Tendon ") + de(e["nom"])
                    latin = "Tendo — " + e["latin"]
                    anglais = ("Tendon of origin of " if origine_seule else "Tendon of ") + court[0].lower() + court[1:]
                t = {"id": ident, "couche": "tendon", "nom": nom, "officiel": nom, "latin": latin, "anglais": anglais, "ta2": None, "pair": e["pair"], "nature": "tendon", "inconstant": False, "_pieces": [], "_heritage": None, "region": e["region"], "rang": 3, "muscle": e["id"], "genere": not nommee}
            t["zone"] = True
            if "profondeur" in e:
                t["profondeur"] = e["profondeur"]
            elements.append(t)
            el_par_id[ident] = t
            ids_pris[ident] = True
        elif t["couche"] != "tendon":
            continue
        zones_de_piece.setdefault(p["objet"], {})[str(code)] = [ident] + info["c"] + [info["r"]]
        nb_zones[ident] += 1

manquants = [h["id"] for h in heritage if h["id"] not in her_trouves]

# ---------------------------------------------------------------- 6. les couleurs propres (viscères, encéphale…)

COULEURS = [
    (r"liver|segment of liver", "#6e2f24"), (r"spleen", "#5b2a3c"), (r"stomach", "#c98a7a"), (r"duodenum|jejunum|ileum", "#d6a48f"), (r"colon|appendix|caec|rectum|taenia", "#c79a86"),
    (r"lung|lobe of", "#c18c8a"), (r"trachea|bronch", "#ddd6c8"), (r"oesophagus|pharynx", "#c58a7c"), (r"gallbladder", "#4f7a3a"), (r"bile duct|pancreatic duct|duct\b", "#b9a24e"),
    (r"pancreas", "#d9b78c"), (r"suprarenal", "#c9a04a"), (r"kidney|renal", "#7a3328"), (r"ureter", "#d8c0a0"), (r"bladder", "#d6b49c"), (r"prostate", "#c08a78"),
    (r"thyroid gland|parathyroid", "#9a4a3a"), (r"parotid|submandibular|sublingual|lacrimal gland", "#cfa57f"), (r"thymus", "#d9b3a3"), (r"tonsil", "#c9706a"), (r"tongue", "#b5545a"),
    (r"soft palate|uvula|gingiva|mucosa", "#c9665a"), (r"epiglottis", "#d9d2bd"), (r"hypophysis|pineal", "#c98a80"),
    (r"atrium|ventricle|papillary", "#8a2420"), (r"leaflet|valve", "#e2d9c8"),
    (r"sclera|eyeball", "#f1ede2"), (r"cornea|lens|vitreous|chamber", "#bcd3de"), (r"iris", "#5a4a32"), (r"retina", "#c9785f"), (r"tympanic", "#d9c9b0"),
    (r"ventricle|aqueduct|central canal|choroid", "#9fc3d6"), (r"white matter|corpus callosum|fornix|commissure|tract|fasciculus|peduncle|capsule|optic", "#ece2d2"),
    (r"nucleus|nuclei|thalamus|putamen|pallidus|caudate|amygdal|hippocampus|colliculus|mamillary|habenula|substance|horn of", "#b9a094"),
    (r"cerebell|vermis|flocculus|lobule|tonsil of|culmen|declive|folium|tuber|pyramis|uvula of|nodule|lingula", "#cfa696"),
    (r"medulla|pons|midbrain|olive|pyramid", "#d9c2b0"), (r"dura|falx|tentorium", "#d9d4c6"),
]


def couleur_de(p):
    if p["couche"] not in ("viscere", "encephale"):
        return None
    a = p["anglais"].lower()
    if p["couche"] == "encephale":
        for motif, c in COULEURS[-6:]:
            if re.search(motif, a):
                return c
        return None
    for motif, c in COULEURS:
        if re.search(motif, a):
            return c
    return None


# ---------------------------------------------------------------- 7. écrire

el_de_objet = {}
for e in elements:
    for p in e["_pieces"]:
        el_de_objet[p["objet"]] = e

# Qui couvre qui (étape 4 quater) : pour chaque pièce, celles qu'il faut ôter pour la voir, et sa profondeur sous la peau.
f_couv = os.path.join(DONNEES, "couvertures.json")
couvertures = json.load(open(f_couv, encoding="utf-8")) if os.path.exists(f_couv) else {}
par_objet = {p["objet"]: p for p in classement["pieces"]}


def cle_couvrant(nom):
    """La clé d'une pièce qui en couvre une autre : « paquet/clé », avec son côté pour une pièce paire (« ~ » : la jumelle)."""
    autre = nom.endswith("~")
    q = par_objet.get(nom.rstrip("~"))
    if not q:
        return None
    k = f"{paquet_de(q['couche'], q['sorte'])}/{cle_de(q['objet'], q['cote'], q['miroir'])}"
    return f"{k}:{'d' if autre else 'g'}" if q["miroir"] else k


# Le squelette (étape 4 quinquies) : le segment que chaque pièce suit le plus, et les deux bouts de chaque muscle.
f_bouts = os.path.join(DONNEES, "bouts.json")
bouts = json.load(open(f_bouts, encoding="utf-8")) if os.path.exists(f_bouts) else {}


def segment_dominant(objet):
    for lod in (2, 1):
        f = os.path.join(DONNEES, "attributs", f"lod{lod}", fichier_de.get(objet, "?") + ".npz")
        if os.path.exists(f):
            a = np.load(f)
            if "BA" in a:
                return int(np.bincount(a["BA"]).argmax())
    return None


pieces_json = []
for p in classement["pieces"]:
    e = el_de_objet[p["objet"]]
    x = {"cle": cle_de(p["objet"], p["cote"], p["miroir"]), "paquet": paquet_de(p["couche"], p["sorte"]), "paire": bool(p["miroir"]), "element": e["id"]}
    b = boites.get(p["objet"])
    if b is not None:
        centre = (b[0] + b[1]) / 2
        x["c"] = [round(float(v), 3) for v in centre]
        x["r"] = round(float(np.linalg.norm(b[1] - b[0]) / 2), 3)
    if p["cote"] and not p["miroir"]:
        x["cote"] = p["cote"]
    if p["objet"] in profondeurs:
        x["prof"] = profondeurs[p["objet"]]
    if len(e["_pieces"]) > 1 and norme(p["anglais"]) != norme(e["anglais"]):
        x["nom"] = nettoyer(p["francais"] or p["anglais"])
    c = couleur_de(p)
    if c:
        x["couleur"] = c
    if p["sorte"] == "cartilage":
        x["couleur"] = "#c5d3da"
    if p["sorte"] == "pulmonaire":
        x["couleur"] = "#3d4d9c" if p["couche"] == "artere" else "#b3211f"
    if p["objet"] in zones_de_piece:
        x["z"] = zones_de_piece[p["objet"]]
    cv = couvertures.get(p["objet"])
    if cv:
        cles = [k for k in (cle_couvrant(n) for n, _ in cv["couvert"]) if k]
        if cles:
            x["couv"] = cles
        x["peau"] = cv["peau"]
    sg = segment_dominant(p["objet"])
    if sg:
        x["sg"] = sg
    bt = bouts.get(p["objet"])
    if bt:
        x["o"], x["i"] = [round(v, 3) for v in bt["o"]], [round(v, 3) for v in bt["e"]]
    pieces_json.append(x)

CHAMPS_HERITES = ("noms", "nombre", "action", "origine", "terminaison", "innervation", "sorte", "articulations", "provenance", "territoire", "muscle", "attache", "memo", "anecdote")
elements_json = []
for e in elements:
    # (Attention : en Python 0 == False ; un rang 0 ou une profondeur 0 sont des valeurs, on les garde.)
    x = {k: v for k, v in e.items() if not k.startswith("_") and not (v is None or v is False or v == [] or v == "")}
    x["pair"] = e["pair"]
    h = e["_heritage"]
    if h:
        for k in CHAMPS_HERITES:
            if k in h and h[k] not in (None, "", []):
                x[k] = h[k]
    if x.get("nature") == e["couche"]:
        del x["nature"]
    x["art"] = article(x["nom"])
    if x["id"] in VOILES:
        x["voile"] = VOILES[x["id"]]
        if x["id"] == "gaine-du-droit":
            x["nature"], x["rang"], x["region"] = "aponevrose", 2, "abdomen"
            x["attache"] = "Elle engaine le droit de l'abdomen et rejoint sa jumelle sur la ligne blanche"
    elements_json.append(x)
for x in ensembles:
    x["art"] = article(x["nom"])

reperes_json = []
vus = set()
for r in classement["reperes"]:
    if not r.get("francais"):
        continue
    P = vers_repere(np.array([r["ancre"]], dtype=np.float32))[0]
    porteur = os_par_objet.get(r["porteur"]) if r.get("porteur") else None
    cle = (r["anglais"], round(float(P[0]), 3), round(float(P[1]), 3), round(float(P[2]), 3))
    if cle in vus:
        continue
    vus.add(cle)
    reperes_json.append({"nom": r["francais"], "latin": r["latin"], "anglais": r["anglais"], "p": [round(float(v), 4) for v in P], "sur": porteur["id"] if porteur else None, "relief": r["sorte"] == "relief"})


def ecrire(nom, donnees):
    with open(os.path.join(MODELE, nom), "w", encoding="utf-8") as f:
        json.dump(donnees, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{nom:18s} {os.path.getsize(os.path.join(MODELE, nom)) / 1024:7.0f} Ko  {len(donnees)} entrées")


ecrire("pieces.json", pieces_json)
ecrire("elements.json", elements_json)
ecrire("ensembles.json", ensembles)
ecrire("insertions.json", insertions_json)
ecrire("reperes.json", reperes_json)
# Les planches : celles qui sont publiées gardent leur contenu pour toujours (la progression enregistrée en dépend) ;
# on en retire seulement les structures qui n'ont pas encore de modèle. Les nouvelles s'ajouteront à la suite.
with open(os.path.join(ICI, "donnees", "planches-publiees.json"), encoding="utf-8") as f:
    publiees = json.load(f)
connus = {e["id"] for e in elements} | {x["id"] for x in ensembles if x["membres"]}
planches = {c: [[i for i in niveau if i in connus] for niveau in niveaux] for c, niveaux in publiees.items()}
ecrire("planches.json", planches)
vieux = os.path.join(MODELE, "niveaux-herites.json")
if os.path.exists(vieux):
    os.remove(vieux)
print("tendons portés par un muscle :", len(nb_zones), "éléments,", sum(nb_zones.values()), "zones")
par_couche = collections.Counter(e["couche"] for e in elements)
print("éléments par couche :", dict(par_couche))
print("éléments d'origine repris :", len(her_trouves), "/", len(heritage), " non retrouvés :", manquants)
print("insertions sans muscle :", dict(sans_muscle))
print("régions :", dict(collections.Counter(e["region"] for e in elements)))
print("rangs :", dict(collections.Counter((e["couche"], e["rang"]) for e in elements)))
print("muscles avec nerf :", sum(1 for e in elements if e.get("nerf")), " avec origines :", sum(1 for e in elements if e.get("origines")), " avec terminaisons :", sum(1 for e in elements if e.get("terminaisons")))
