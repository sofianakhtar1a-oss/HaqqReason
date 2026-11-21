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


RETOUCHES = [(r"inféfieure", "inférieure"), (r"\bcinqu[eè]me\b", "cinquième"), (r"\btrois[eè]me\b", "troisième"), (r"\bdoigt de pied\b", "orteil"), (r"\bdoigts de pied\b", "orteils")]


# Des noms français de l'atlas qui ne disent pas ce que dit le latin (relevés en rédigeant les fiches).
NOMS_PAR_ID = {
    "ligament-tibiofibullaire-posterieur": "Ligament talo-fibulaire postérieur",
    "ligament-talocalcaneen": "Ligament talo-calcanéen latéral",
    "ligament-talocalcaneen-lateral": "Ligament talo-calcanéen postérieur",
}


def retoucher(nom):
    for motif, par in RETOUCHES:
        nom = re.sub(motif, par, nom)
    return nom


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
    # Les retouches de noms viennent après l'identifiant, déjà distribué (fiches, progression) : il ne change pas.
    fr, nom = retoucher(fr), retoucher(nom)
    cotes = {p["cote"] for p in ps}
    pair = any(p["miroir"] for p in ps) or ("g" in cotes and "d" in cotes)
    # (Le rein de BodyParts3D porte sa source dans son nom de pièce, pour ne pas se confondre avec celui de Z-Anatomy.)
    ea = re.sub(r"\s*\(BodyParts3D\)", "", ea)
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
    # (la géométrie ne départage que ce que les collections de l'atlas ne disent pas : la main qui pend frôle la hanche)
    if (haut and not bas) or (not haut and not bas and not cols & {"Trunk", "Head", "Neck"} and x > X_EPAULE - 0.01 and y < Y["epaule"] + 0.02 and y > Y["poignet"] - 0.25):
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
    if x["id"] in NOMS_PAR_ID:
        x["nom"] = x["officiel"] = NOMS_PAR_ID[x["id"]]
    # Au pied, les « doigts » sont des orteils.
    if x["region"] == "pied" and re.search(r"\bdoigts?\b", x["nom"]):
        x["nom"] = re.sub(r"\bpetit doigt\b", "petit orteil", x["nom"])
        x["nom"] = re.sub(r"\bdes doigts\b", "des orteils", x["nom"])
        x["officiel"] = x["nom"] if x.get("officiel") else x.get("officiel")
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
# Les planches exhaustives : toute structure qui n'est encore dans aucune planche en reçoit une, à la suite des
# planches publiées, région par région (de la tête aux pieds), les plus importantes d'abord. Une catégorie
# nouvelle commence par ses incontournables. Une fois écrites, ces planches sont publiées à leur tour.
CAT_COUCHE = {"os": "os", "muscles": "muscle", "tendons": "tendon", "ligaments": "ligament", "arteres": "artere", "veines": "veine", "nerfs": "nerf", "visceres": "viscere", "encephale": "encephale", "lymphe": "lymphe"}
ORDRE_REGIONS = ["tete", "cou", "thorax", "abdomen", "dos", "bassin", "epaule", "bras", "avant-bras", "main", "hanche", "cuisse", "jambe", "pied"]
TAILLE = 8

# Les viscères se rangent par système et par organe, l'encéphale par partie : une planche réunit ce qui va ensemble.
# Le premier motif qui convient l'emporte (l'ordre compte : « segment-…-du-globe » avant les segments du foie).
CLASSES = {
    "viscere": [
        ("Le cœur", r"^(atrium|ventricule|valvule|cuspide|muscle-papillaire)"),
        ("Les poumons et les grosses bronches", r"^(lobe-(superieur|moyen|inferieur)-du-poumon|trachee|bronche-(principale|intermediaire|lobaire)|plevre)"),
        ("Les bronches segmentaires du poumon gauche", r"^bronche-(segmentaire|lingulaire).*(gauche|gau-)"),
        ("Les bronches segmentaires du poumon droit", r"^bronche-(segmentaire|lingulaire)"),
        ("La bouche et les glandes salivaires", r"^(langue|gencive|palais-mou|uvule-du-palais|tonsille-palatine|glande-(parotide|submandibulaire|sublinguale)|canal-(porotidien|submandibulaire))"),
        ("Le pharynx et le larynx", r"^(nasopharynx|oropharynx|laryngopharynx|epiglotte)"),
        ("L'œil", r"^(cornee|sclere|iris|cristallin|retine|corps-vitre|chambre-anterieure|segment-(anterieur|posterieur)-du-globe|fibres-zonulaires|ligament-suspenseur-du-bulbe)"),
        ("Les voies lacrymales, le nez et l'oreille", r"^(glande-lacrymale|canalicule-lacrymal|ampoule-du-canalicule|sac-lacrymal|canal-lacrymonasal|muqueuse-de-la-cavite-nasale|membrane-tympanique|trompe-auditive)"),
        ("L'œsophage, l'estomac et l'intestin", r"^(oesophage|estomac|muqueuse-de-l-estomac|duodenum|jejunum|ileon|colon|caecum|rectum|appendice|meso-appendice|tenia)"),
        ("Le foie et les voies biliaires", r"^(foie|segment-|vesicule-biliaire|canal-biliaire|canal-hepatique|canal-choledoque)"),
        ("Le pancréas, la rate et le péritoine", r"^(pancreas|canal-pancreatique|rate|grand-omentum|petit-omentum|mesocolon|mesentere|peritoine)"),
        ("Les glandes endocrines et le thymus", r"^(glande-(thyroide|parathyroide|pineale)|adenohypophyse|neurohypophyse|lobe-(droit|gauche)-du-thymus)"),
        ("La surrénale, l'uretère, la vessie et la prostate", r"^(glande-surrenale|rein|uretere|vessie|uretre|prostate)"),
        ("Les autres viscères", r""),
    ],
    "encephale": [
        ("Le lobe frontal", r"^(gyrus-frontal|sillon-frontal|gyrus-precentral|sillon-precentral|sillon-central|partie-(operculaire|orbitaire|triangulaire)|gyri-orbitaires|sillons-orbitaires|encephale-(gyri|sillons)-orbitaires|gyrus-rectus|sillon-olfactif|gyrus-et-sillon-frontopolaires)"),
        ("Le lobe pariétal", r"^(gyrus-postcentral|sillon-postcentral|lobule-parietal|gyrus-supramarginal|gyrus-angulaire|sillon-intraparietal|sillon-subparietal|precuneus|sillon-intermediaire-primaire)"),
        ("Le lobe temporal et l'insula", r"^(gyrus-temporal|sillon-temporal|planum-temporal|pole-temporal|sillon-lateral|rameau-(anterieur|ascendant)-du-sillon-lateral|cortex-insulaire|sillon-circulaire-de-l-insula)"),
        ("Le lobe occipital", r"^(gyrus-occipital|gyri-occipitaux|sillon-occipital|pole-occipital|cuneus|gyrus-lingual|sillon-calcarin|sillon-lunaire|sillon-parieto-occipital|gyrus-occipitotemporal|sillon-occipitotemporal|scissure-collaterale|sillon-collateral)"),
        ("La face médiale et le système limbique", r"^(gyrus-cingulaire|sillon-cingulaire|lobule-paracentral|sillon-paracentral|hippocampe|corps-amygdaloide|fornix|noyaux-septaux|septum-pellucidum|corps-calleux|commissure-(anterieure|hippocampale))"),
        ("Les noyaux gris centraux", r"^(noyau-caude|putamen|globus-pallidus|noyau-lenticulaire|substance-blanche-du-telencephale|claustrum|capsule)"),
        ("Le diencéphale", r"^(thalamus|hypothalamus|corps-mamillaire|habenula|strie-medullaire|corps-genicule|commissure-posterieure)"),
        ("La substance grise de la moelle spinale", r"^(corne-|noyau-(intermediolateral|intermediomedial|propre)|substance-intermediaire|processus-reticulaire)"),
        ("Les noyaux des nerfs crâniens", r"^(noyau-(accessoire-du-nerf|du-nerf|moteur-du-ne|ambigu|salivaire|cochleaire|posterieur-du-nerf|du-tractus-solitaire)|noyaux-vestibulaires)"),
        ("Le tronc cérébral", r"^(mesencephale|pont$|moelle-allongee|olive|pyramide-de-la-moelle|colliculus|base-du-pedoncule|fosse-interpedonculaire|noyau-rouge|racine-sensitive-du-nerf-trijumeau)"),
        ("Le cervelet", r"^(lobule-(quadrangulaire|biventral|central|gracile|semilunaire)|aile-du-lobule|culmen|declive|flocculus|folium|nodule|pyramide-du-vermis|tuber|uvule-du-vermis|lingula|tonsille-du-cervelet|pedoncule-(du-flocculus|cerebelleux))"),
        ("Les ventricules et les méninges", r"^(ventricule|troisieme-ventricule|quatrieme-ventricule|aqueduc|plexus-choroide|faux-du-cerveau|tente-du-cervelet|dure-mere|canal-central)"),
        ("Les voies de la moelle spinale", r"^(tractus-|faisceau-|substance-blanche-de-la-moelle)"),
        ("Les autres structures de l'encéphale", r""),
    ],
}


# La première planche d'une catégorie neuve : ce que tout le monde doit connaître (le rang ne départage pas ces couches).
INCONTOURNABLES = {
    "ligaments": ["ligament-croise-anterieur", "ligament-croise-posterieur", "menisque-medial", "menisque-lateral", "ligament-collateral-tibial", "ligament-collateral-fibulaire", "ligament-longitudinal-anterieur", "ligament-iliofemoral"],
    "veines": ["veine-cave-superieure", "veine-cave-inferieure", "veine-porte-du-foie", "veine-jugulaire-interne", "veine-brachiocephalique", "veine-grande-saphene", "veine-femorale", "veine-mediane-du-coude"],
    "nerfs": ["nerf-median", "nerf-ulnaire", "nerf-radial", "nerf-musculocutane", "nerf-axillaire", "nerf-sciatique", "nerf-femoral", "nerf-fibulaire-commun"],
    "visceres": ["foie", "estomac", "pancreas", "rate", "oesophage", "trachee", "langue", "glande-thyroide"],
    "encephale": ["thalamus", "hypothalamus", "corps-calleux", "hippocampe", "mesencephale", "pont", "moelle-allongee", "ventricule-lateral"],
    "lymphe": ["lymphonoeud-jugulodigastrique", "lymphonoeuds-supraclaviculaires", "lymphonoeuds-axillaires-centraux", "lymphonoeuds-axillaires-anterieurs", "lymphonoeuds-tracheobronchiques-inferieurs", "lymphonoeuds-coeliaques", "lymphonoeuds-pre-aortiques", "lymphonoeuds-inguinaux-superficiels-superomediaux"],
}


def classe(couche, e):
    for i, (titre, motif) in enumerate(CLASSES[couche]):
        if re.search(motif, e["id"]):
            return i, titre
    return len(CLASSES[couche]), ""


# Pour les vaisseaux, les nerfs et les nœuds, une planche suit un arbre : la branche avec son tronc, l'affluent avec sa
# veine. Le parent vient des fiches (provenance d'une artère, terminaison d'une veine, origine d'un nerf, drainage d'un nœud).
PARENT_DE = {"artere": ("provenance", "artere"), "veine": ("terminaison", "veine"), "nerf": ("origine", "nerf"), "lymphe": ("draine_vers", "lymphe")}
SUITE = {"artere": "et ses branches", "veine": "et ses affluents", "nerf": "et ses branches"}


def parents(couche):
    if couche not in PARENT_DE:
        return {}
    champ, cle = PARENT_DE[couche]
    chemin = os.path.join(ICI, "..", "..", "src", "lib", "corps", "fiches", f"{couche}.json")
    if not os.path.exists(chemin):
        return {}
    with open(chemin, encoding="utf-8") as fl:
        fiches = json.load(fl).get("fiches", {})
    sortie = {}
    for i, fi in fiches.items():
        lien = fi.get(champ)
        if isinstance(lien, dict) and lien.get(cle):
            sortie[i] = lien[cle]
    return sortie


def paqueter(groupes):
    """Range des groupes ordonnés en planches de taille voisine (TAILLE environ), sans couper un groupe qui tient."""
    total = sum(len(g) for g in groupes)
    if not total:
        return []
    k = max(1, round(total / TAILLE))
    cible = total / k
    paquets, courant = [], []
    for g in groupes:
        if len(g) > cible + 2:
            if courant:
                paquets.append(courant)
                courant = []
            n = max(1, round(len(g) / cible))
            pas = len(g) / n
            paquets.extend(g[round(i * pas) : round((i + 1) * pas)] for i in range(n))
        elif not courant or len(courant) + len(g) <= cible + 2:
            courant = courant + g
        else:
            paquets.append(courant)
            courant = list(g)
    if courant:
        if paquets and len(courant) < TAILLE // 2:
            ensemble = paquets.pop() + courant
            if len(ensemble) <= TAILLE + 3:
                paquets.append(ensemble)
            else:
                moitie = len(ensemble) // 2
                paquets.extend([ensemble[:moitie], ensemble[moitie:]])
        else:
            paquets.append(courant)
    return paquets


def titre_arbre(e, couche):
    """« L'artère maxillaire et ses branches », « Le plexus brachial et ses branches »."""
    nom = re.sub(r"^Racines du ", "", e["nom"])
    art = "le " if nom != e["nom"] else e.get("art", "")
    pluriel = art == "les "
    suite = SUITE[couche].replace("ses ", "leurs ") if pluriel else SUITE[couche]
    tete = (art + nom[0].lower() + nom[1:]) if art else nom
    return f"{tete[0].upper()}{tete[1:]} {suite}"


GRANDE = {"tete": "tete-cou", "cou": "tete-cou", "thorax": "tronc", "abdomen": "tronc", "dos": "tronc", "bassin": "tronc", "epaule": "membre-sup", "bras": "membre-sup", "avant-bras": "membre-sup", "main": "membre-sup", "hanche": "membre-inf", "cuisse": "membre-inf", "jambe": "membre-inf", "pied": "membre-inf"}


titres_chemin = os.path.join(ICI, "donnees", "planches-titres.json")
titres = {}
if os.path.exists(titres_chemin):
    with open(titres_chemin, encoding="utf-8") as fl:
        titres = json.load(fl)
deja = {i for niveaux in publiees.values() for niveau in niveaux for i in niveau}
ajouts = 0
par_id_json = {e["id"]: e for e in elements_json}
for cat, couche in CAT_COUCHE.items():
    restants = [e for e in elements_json if e["couche"] == couche and e["id"] not in deja]
    if not restants:
        continue
    niveaux = publiees.setdefault(cat, [])
    noms = titres.setdefault(cat, {})
    # Une catégorie déjà publiée qui reçoit quelques structures de plus (un organe repris d'un autre atlas) : elles
    # forment une planche à elles, à la suite ; les planches en ligne ne bougent pas.
    if niveaux and len(restants) <= TAILLE + 4:
        lot = sorted(restants, key=lambda e: (ORDRE_REGIONS.index(e["region"]), e["rang"], e["nom"]))
        le = lambda e: (e.get("art") or "") + e["nom"][0].lower() + e["nom"][1:] if e.get("art") else e["nom"]
        if len(lot) <= 3:
            liste = [le(e) for e in lot]
            titre = liste[0] if len(liste) == 1 else ", ".join(liste[:-1]) + " et " + liste[-1]
            titre = titre[0].upper() + titre[1:]
        else:
            titre = "Les compléments"
        noms[str(len(niveaux))] = titre
        niveaux.append([e["id"] for e in lot])
        ajouts += 1
        deja |= {e["id"] for e in restants}
        continue
    if not niveaux:
        choisis = [i for i in INCONTOURNABLES.get(cat, []) if i in {e["id"] for e in restants}]
        if choisis:
            tete = [par_id_json[i] for i in choisis]
        else:
            tete = sorted(restants, key=lambda e: (e["rang"], ORDRE_REGIONS.index(e["region"]), e["nom"]))[:TAILLE]
        niveaux.append([e["id"] for e in tete])
        restants = [e for e in restants if e not in tete]
    nouveaux = []  # (paquet, titre ou None)
    if couche in CLASSES:
        par_classe = collections.defaultdict(list)
        for e in restants:
            par_classe[classe(couche, e)].append(e)
        for (_, titre), lot in sorted(par_classe.items()):
            lot.sort(key=lambda e: (e["rang"], e["nom"]))
            n = max(1, round(len(lot) / TAILLE))
            pas = len(lot) / n
            for i in range(n):
                nouveaux.append((lot[round(i * pas) : round((i + 1) * pas)], titre))
    elif couche not in PARENT_DE:
        # Os, muscles, tendons, ligaments : par région, les petites régions rejoignant leurs voisines de la même grande région.
        for grande in ("tete-cou", "tronc", "membre-sup", "membre-inf"):
            groupes = []
            for region in ORDRE_REGIONS:
                if GRANDE[region] != grande:
                    continue
                lot = sorted((e for e in restants if e["region"] == region), key=lambda e: (e["rang"], e["nom"]))
                if lot:
                    groupes.append(lot)
            for p in paqueter(groupes):
                nouveaux.append((p, None))
    else:
        parent = parents(couche)
        rangees_par_grande = collections.defaultdict(list)
        troncs = {}
        for region in ORDRE_REGIONS:
            lot = [e for e in restants if e["region"] == region]
            if not lot:
                continue
            ici = {e["id"] for e in lot}

            def tronc(i):
                vus = set()
                while parent.get(i) in ici and i not in vus:
                    vus.add(i)
                    i = parent[i]
                return i

            groupes = collections.defaultdict(list)
            for e in lot:
                groupes[tronc(e["id"])].append(e)
            ordre = sorted(groupes.items(), key=lambda kv: (min(x["rang"] for x in kv[1]), -len(kv[1]), kv[0]))
            rangees = []
            for t, membres in ordre:
                membres.sort(key=lambda e: (e["id"] != t, e["rang"], e["nom"]))
                rangees.append(membres)
            for membres in rangees:
                for e in membres:
                    troncs[e["id"]] = tronc(e["id"])
            rangees_par_grande[GRANDE[region]].extend(rangees)
        for grande in ("tete-cou", "tronc", "membre-sup", "membre-inf"):
            for p in paqueter(rangees_par_grande.get(grande, [])):
                titre = None
                if couche in SUITE:
                    compte = collections.Counter(troncs[e["id"]] for e in p)
                    t, n = compte.most_common(1)[0]
                    if n >= max(4, 0.7 * len(p)) and t in par_id_json:
                        titre = titre_arbre(par_id_json[t], couche)
                nouveaux.append((p, titre))
    for p, titre in nouveaux:
        if titre:
            noms[str(len(niveaux))] = titre
        niveaux.append([e["id"] for e in p])
        ajouts += 1
    deja |= {e["id"] for e in restants}
titres = {c: t for c, t in titres.items() if t}
if ajouts:
    with open(os.path.join(ICI, "donnees", "planches-publiees.json"), "w", encoding="utf-8") as fl:
        json.dump(publiees, fl, ensure_ascii=False, indent=0)
    with open(titres_chemin, "w", encoding="utf-8") as fl:
        json.dump(titres, fl, ensure_ascii=False, indent=1)
    print("planches ajoutées :", ajouts)
ecrire("planches-titres.json", titres)
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
