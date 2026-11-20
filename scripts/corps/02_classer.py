# L'Écorché — étape 2 : classer chaque objet de Z-Anatomy.
# Pour chaque objet : sa couche (os, muscle, tendon, artère, veine, nerf, ligament, viscère, encéphale, lymphe),
# sa sorte (cartilage, dent, fascia, bourse…), son côté, son nom officiel (TA2 : français et latin), le muscle
# auquel appartient un chef, et ce qu'on écarte (peau, repères, pudeur, licences non commerciales).
# Usage : python 02_classer.py   → ~/donnees-corps/classement.json
import json, os, re, sys, collections
import numpy as np
from commun import DONNEES, objets_bruts, sommets, decouper, principale, norme, slug, lire_ta2

objs = objets_bruts()
par_nom = {o["nom"]: o for o in objs}
ta2, _ = lire_ta2()

# Les noms de Z-Anatomy absents de la table TA2 : (français, latin).
HORS_TABLE = {
    "Frenula capsulae": ("Freins de la capsule", "Frenula capsulae"),
    "Cruciform part of fibrous sheath of digit of hand": ("Partie cruciforme de la gaine fibreuse des doigts de la main", "Pars cruciformis vaginae fibrosae digitorum manus"),
    "Subfacial prepatellar bursa": ("Bourse prépatellaire subfasciale", "Bursa subfascialis prepatellaris"),
    "Tendon sheath of extensor digiti minimi manus": ("Gaine du tendon de l'extenseur du petit doigt", "Vagina tendinis musculi extensoris digiti minimi"),
    "Tendon sheath of extensors carpi radialis": ("Gaine des tendons des extenseurs radiaux du carpe", "Vagina tendinum musculorum extensorum carpi radialium"),
    "Trochanteric bursa of gluteus medius muscle": ("Bourse trochantérique du moyen fessier", "Bursa trochanterica musculi glutei medii"),
    "Anterior temporal branch": ("Rameau temporal antérieur", "Ramus temporalis anterior"),
    "Artery of central sulcus": ("Artère du sillon central", "Arteria sulci centralis"),
    "Artery of precentral sulcus": ("Artère du sillon précentral", "Arteria sulci precentralis"),
    "Branch to angular gyrus": ("Rameau du gyrus angulaire", "Ramus gyri angularis"),
    "Distal lateral striate branches": ("Rameaux striés latéraux distaux", "Rami striati laterales distales"),
    "Proximal lateral striate branches": ("Rameaux striés latéraux proximaux", "Rami striati laterales proximales"),
    "Inferior vein of left ventricle (//Posterior '')": ("Veine inférieure du ventricule gauche", "Vena inferior ventriculi sinistri"),
    "Insular branches of middle cerebral artery (M2-segment)": ("Artères insulaires (segment M2)", "Arteriae insulares"),
    "Middle cerebral artery (M1-segment)": ("Artère cérébrale moyenne (segment M1)", "Arteria cerebri media, pars sphenoidalis"),
    "Middle cerebral artery (M3 segment)": ("Artère cérébrale moyenne (segment M3)", "Arteria cerebri media, pars opercularis"),
    "Lateral frontobasal artery": ("Artère frontobasale latérale", "Arteria frontobasalis lateralis"),
    "Middle genicular artery": ("Artère moyenne du genou", "Arteria media genus"),
    "Posterior parietal artery": ("Artère pariétale postérieure", "Arteria parietalis posterior"),
    "Posterior temporal branch": ("Rameau temporal postérieur", "Ramus temporalis posterior"),
    "Prefrontal artery": ("Artère préfrontale", "Arteria prefrontalis"),
    "Temporo-occipital branch": ("Rameau temporo-occipital", "Ramus temporooccipitalis"),
    "Straight gyrus (Gyrus rectus)": ("Gyrus droit", "Gyrus rectus"),
    "Superior temporal gyrus (Lateral part)": ("Gyrus temporal supérieur", "Gyrus temporalis superior"),
    "Cingulate gyrus (Posteroventral part*)": ("Gyrus cingulaire (partie postéro-ventrale)", "Gyrus cinguli"),
    "Cingulate gyrus and sulcus (Middle anterior part)": ("Gyrus cingulaire (partie moyenne antérieure)", "Gyrus cinguli"),
    "Cingulate gyrus and sulcus (Middle posterior part)": ("Gyrus cingulaire (partie moyenne postérieure)", "Gyrus cinguli"),
    "Cingulate gyrus and sulcus (Posterior dorsal part)": ("Gyrus cingulaire (partie postéro-dorsale)", "Gyrus cinguli"),
    "Cingulate sulcus (Marginal part*)": ("Sillon cingulaire (partie marginale)", "Sulcus cinguli, ramus marginalis"),
    "Insula (Subcentral gyrus and ant. and post. sulci*)": ("Gyrus subcentral", "Gyrus subcentralis"),
    "Lateral occipital gyrus (Middle occipital gyrus*)": ("Gyrus occipital latéral", "Gyrus occipitalis lateralis"),
    "Medial occipitotemporal gyrus (Parahippocampal*)": ("Gyrus parahippocampique", "Gyrus parahippocampalis"),
    "Occipitotemporal sulcus (Lateral part*)": ("Sillon occipito-temporal", "Sulcus occipitotemporalis"),
    "Orbital gyri (Frontomarginal gyrus and sulcus*)": ("Gyrus frontomarginal", "Gyrus frontomarginalis"),
    "Orbital sulci (H-shaped orbital sulci*)": ("Sillons orbitaires", "Sulci orbitales"),
    "Orbital sulci (Lateral Orbital sulcus*)": ("Sillon orbitaire latéral", "Sulcus orbitalis lateralis"),
    "Paracentral gyrus and sulcus*": ("Lobule paracentral", "Lobulus paracentralis"),
    "Precentral sulcus (Superior part)*": ("Sillon précentral (partie supérieure)", "Sulcus precentralis"),
    "Precentral sulcus (inferior part)*": ("Sillon précentral (partie inférieure)", "Sulcus precentralis"),
    "Anterior occipital sulcus*": ("Sillon occipital antérieur", "Sulcus occipitalis anterior"),
    "Inferior occipital gyrus and sulcus*": ("Gyrus occipital inférieur", "Gyrus occipitalis inferior"),
    "Posterior transverse collateral sulcus": ("Sillon collatéral transverse postérieur", "Sulcus collateralis transversus posterior"),
    "Lat_Fis-ant-Horizont": ("Rameau antérieur du sillon latéral", "Ramus anterior sulci lateralis"),
    "Lat_Fis-ant-Vertical": ("Rameau ascendant du sillon latéral", "Ramus ascendens sulci lateralis"),
    "Lat_Fis-post": ("Sillon latéral (rameau postérieur)", "Ramus posterior sulci lateralis"),
    "Sulcus interm_prim-Jensen": ("Sillon intermédiaire primaire (de Jensen)", "Sulcus intermedius primus"),
    "Ciliary body-curve": ("Corps ciliaire", "Corpus ciliare"),
    "Tendon sheath - abd. pollicis longus - ext. pollicis brevis": ("Gaine des tendons du long abducteur et du court extenseur du pouce", "Vagina tendinum musculorum abductoris longi et extensoris pollicis brevis"),
}

PUDEUR = re.compile(r"penis|testis|testicular|epididymis|scrot|pubic hair|ductus deferens|ejaculatory duct|urethra|seminal gland", re.I)
NON_COMMERCIAL = {"Cochlea": "oreille interne (CC BY-NC-SA)", "Vestibule": "oreille interne (CC BY-NC-SA)", "Kidney": "rein (CC BY-NC)", "Renal pelvis": "rein (CC BY-NC)"}
ENVELOPPES = re.compile(r"^(Pleura|Greater omentum|Lesser omentum|Mesocolon|Meso-appendix|Spinal dura|Falx cerebri|Tentorium cerebelli|Gingiva|Mucosa of nasal cavity)$")
ASYMETRIQUES = re.compile(r"atrium|ventricle|lung|coronary|colic|gastric|gastro-omental|hepatic|lobe|leaflet|segment|lobar|pulmonary artery|ascending lumbar|superior intercostal vein|subcostal vein|superior phrenic", re.I)


def nom_ta2(base):
    """Le nom officiel d'un objet : cherche l'anglais dans la table TA2, avec quelques variantes."""
    if base in HORS_TABLE:
        fr, la = HORS_TABLE[base]
        return {"id": None, "anglais": base, "latin": la, "francais": fr}
    b = re.sub(r"^\((.*)\)$", r"\1", base).strip()
    essais = [b, b + " muscle", re.sub(r" muscle$", "", b), re.sub(r"^(Left|Right) ", "", b), re.sub(r"\s*\(.*?\)\s*", " ", b).strip()]
    for e in essais:
        r = ta2.get(norme(e))
        if r:
            return r
    return None


def classer(o, base, suff):
    """→ (couche, sorte) ou (None, raison de l'exclusion)."""
    col = principale(o)
    n = base.lower()
    mats = [m for m in (o.get("mats") or []) if m]
    if col in ("9: Regions of human body", "autre"):
        return None, "peau, régions de surface ou repères"
    if PUDEUR.search(base):
        return None, "organes génitaux externes (pudeur)"
    nu = re.sub(r"^\((.*)\)$", r"\1", base)
    if nu in NON_COMMERCIAL or "intrarenal" in n:
        return None, "licence non commerciale : " + NON_COMMERCIAL.get(nu, "rein (CC BY-NC)")
    if re.fullmatch(r"\?+x?", base):
        return None, "objet sans nom"
    if col == "1: Skeletal system":
        if n.startswith("sinus of") or "cells of ethmoid" in n:
            return None, "cavité (volume d'air)"
        if "cartilage" in n:
            return "os", "cartilage"
        if re.search(r"tooth|incisor|canine|premolar|molar", n):
            return "os", "dent"
        return "os", "os"
    if col == "3: Joints":
        if "fat pad" in n:
            return None, "graisse"
        if "triradiate" in n:
            return None, "n'existe pas chez l'adulte"
        for mot, sorte in (("capsule", "capsule"), ("nucleus pulposus", "disque"), ("disc", "disque"), ("meniscus", "menisque"), ("labrum", "labrum"), ("membrane", "membrane"), ("symphysis", "symphyse")):
            if mot in n:
                return "ligament", sorte
        return "ligament", "ligament"
    if col == "4: Muscular system":
        if "bursa" in n:
            return "ligament", "bourse"
        if re.search(r"fascia\b|fasciae$|septum|iliopectineal arch|tendinous arch", n) and "tensor" not in n:
            return "tendon", "fascia"
        if "retinaculum" in n:
            return "tendon", "retinaculum"
        if re.search(r"sheath", n):
            return "tendon", "gaine"
        if re.search(r"aponeurosis|linea alba|iliotibial tract|inguinal ligament", n):
            return "tendon", "aponevrose"
        if re.search(r"tendon|tendinous ring|trochlea of superior oblique|transverse metacarpal ligament|transverse metatarsal ligament|tarsus", n):
            return "tendon", "tendon"
        return "muscle", "muscle"
    if col == "5: Cardiovascular system":
        if "Artery" in mats:
            return "artere", "artere"
        if "Pulmonary artery" in mats:
            return "artere", "pulmonaire"
        if "Vein" in mats:
            return "veine", "sinus" if "sinus" in n and "coronary" not in n else "veine"
        if "Pulmonary vein" in mats:
            return "veine", "pulmonaire"
        return "viscere", "coeur"
    if col == "6: Lymphoid organs":
        if re.search(r"\bnodes?\b", n):
            return "lymphe", "noeud"
        return "viscere", "lymphoide"
    if col == "7: Nervous system & Sense organs":
        if o["type"] == "CURVE" or any(m.startswith("Nerve") for m in mats) or re.search(r"ganglion|ganglia", n):
            if "ciliary body" in n:
                return "viscere", "sens"
            return "nerf", "ganglion" if "gangli" in n else "nerf"
        if "Sense organs" in o["collections"] or re.search(r"eyeball|cornea|iris|lens|retina|sclera|vitreous|zonular|lacrimal|nasolacrimal|tympanic|auditory tube|suspensory ligament of eyeball|external axis", n):
            return "viscere", "sens"
        if ENVELOPPES.match(base):
            return "encephale", "enveloppe"
        return "encephale", "encephale"
    if col == "8: Visceral systems":
        if ENVELOPPES.match(base):
            return "viscere", "enveloppe"
        return "viscere", "viscere"
    return None, "collection inconnue : " + col


def meme_miroir(a, b):
    """Le côté droit est-il l'exact miroir du gauche ?"""
    if a.get("sommets", 0) == 0 or a.get("sommets") != b.get("sommets"):
        return False
    A = sommets(a)
    B = sommets(b)
    B[:, 0] *= -1
    if np.abs(A - B).max() < 2e-4:
        return True
    return bool(np.abs(A[np.lexsort(A.T)] - B[np.lexsort(B.T)]).max() < 5e-4)


def ancetre_piece(o):
    """Remonte les parents jusqu'à un objet qui est une pièce du corps (ni étiquette ni groupe)."""
    vus = 0
    p = o.get("parent")
    while p and vus < 8:
        q = par_nom.get(p)
        if not q:
            return None
        _, s = decouper(q["nom"])
        if q["type"] in ("MESH", "CURVE") and s in ("", "l", "r"):
            return q["nom"]
        p = q.get("parent")
        vus += 1
    return None


pieces, insertions, reperes, exclus = [], [], [], []
sans_nom = collections.Counter()
vus_droits = set()

for o in objs:
    if o["type"] not in ("MESH", "CURVE"):
        continue
    base, suff = decouper(o["nom"])
    col = principale(o)
    # Les étiquettes : un trait de deux points, de la structure vers son nom.
    if suff in ("j", "i"):
        if o.get("sommets", 0) >= 2 and col not in ("9: Regions of human body", "autre"):
            P = sommets(o)
            texte = par_nom.get(o.get("parent") or "")
            ancre = P[0]
            if texte and texte.get("position"):
                t = np.array(texte["position"], dtype=np.float32)
                ancre = P[int(np.argmax(((P - t) ** 2).sum(1)))]
            r = nom_ta2(base)
            reperes.append({"anglais": base, "francais": r["francais"] if r else None, "latin": r["latin"] if r else None, "ta2": r["id"] if r else None, "sorte": "relief" if suff == "i" else "etiquette", "ancre": [round(float(x), 5) for x in ancre], "collection": col, "porteur": ancetre_piece(texte) if texte else None})
        continue
    if suff in ("g", "t", "s", "st"):
        continue
    if o.get("triangles", 0) == 0:
        continue
    if col == "2: Muscular insertions":
        m = re.fullmatch(r"([oe])(\d*)([lr])", suff)
        if not m:
            exclus.append({"objet": o["nom"], "raison": "insertion sans côté"})
            continue
        r = nom_ta2(base)
        insertions.append({"objet": o["nom"], "muscle": base, "francais": r["francais"] if r else None, "sorte": "origine" if m.group(1) == "o" else "terminaison", "rang": int(m.group(2) or 0), "cote": "g" if m.group(3) == "l" else "d", "os": o.get("parent"), "mats": o.get("mats")})
        continue
    couche, sorte = classer(o, base, suff)
    if couche is None:
        exclus.append({"objet": o["nom"], "raison": sorte})
        continue
    # Le côté.
    cote, miroir, nom_el = None, False, base
    if suff in ("l", "r"):
        cote = "g" if suff == "l" else "d"
        jumeau = par_nom.get(f"{base}.{'r' if suff == 'l' else 'l'}")
        if suff == "r" and o["nom"] in vus_droits:
            continue  # déjà porté par le gauche, en miroir
        if suff == "l" and jumeau and classer(jumeau, base, "r")[0] == couche and meme_miroir(o, jumeau):
            miroir = True
            vus_droits.add(jumeau["nom"])
    else:
        m = re.match(r"^(Left|Right) (.+)$", base)
        if m and not ASYMETRIQUES.search(m.group(2)):
            autre = ("Right " if m.group(1) == "Left" else "Left ") + m.group(2)
            if autre in par_nom:
                cote = "g" if m.group(1) == "Left" else "d"
                nom_el = m.group(2)[0].upper() + m.group(2)[1:]
    r = nom_ta2(nom_el) or nom_ta2(base)
    if not r:
        sans_nom[base] += 1
    inconstant = base.startswith("(") and base.endswith(")")
    # Le muscle auquel appartient un chef ou une partie.
    groupe = None
    parent = par_nom.get(o.get("parent") or "")
    if parent:
        gb, gs = decouper(parent["nom"])
        groupe = gb
    p = {
        "objet": o["nom"],
        "type": o["type"],
        "couche": couche,
        "sorte": sorte,
        "cote": cote,
        "miroir": miroir,
        "anglais": re.sub(r"^\((.*)\)$", r"\1", nom_el),
        "francais": r["francais"] if r else None,
        "latin": r["latin"] if r else None,
        "ta2": r["id"] if r else None,
        "inconstant": inconstant,
        "groupe": groupe,
        "collections": [c for c in o["collections"] if not re.match(r"^\d: ", c)],
        "mats": o.get("mats") or [],
        "sommets": o.get("sommets", 0),
        "triangles": o.get("triangles", 0),
    }
    pieces.append(p)

# Les pièces droites dont le gauche est le miroir exact ont été sautées ; vérifier qu'aucune n'est restée orpheline.
droites = [p for p in pieces if p["cote"] == "d" and p["objet"] in vus_droits]
pieces = [p for p in pieces if not (p["cote"] == "d" and p["objet"] in vus_droits)]

json.dump({"pieces": pieces, "insertions": insertions, "reperes": reperes, "exclus": exclus}, open(os.path.join(DONNEES, "classement.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)

c = collections.Counter((p["couche"], p["sorte"]) for p in pieces)
print("pièces :", len(pieces), "dont en miroir :", sum(p["miroir"] for p in pieces))
for k, v in sorted(c.items()):
    print("  ", k, v)
print("insertions :", len(insertions), " repères :", len(reperes), " exclus :", len(exclus))
print("exclus par raison :", collections.Counter(e["raison"] for e in exclus).most_common())
print("sans nom officiel :", dict(sans_nom))
tri = collections.Counter()
for p in pieces:
    tri[p["couche"]] += p["triangles"] * (2 if p["miroir"] else 1)
print("triangles bruts par couche (les deux côtés) :", dict(tri))
