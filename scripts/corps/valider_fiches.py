# L'Écorché — contrôler un lot de fiches rédigées (donnees/fiches/sortie/<lot>.json).
# Usage : python valider_fiches.py <lot> [<lot> …]   (sans argument : tous les lots présents)
# Sortie : la liste des défauts, lot par lot ; code de retour 0 quand tout est bon.
import json, os, re, sys

ICI = os.path.dirname(os.path.abspath(__file__))
FICHES = os.path.join(ICI, "donnees", "fiches")
voc = json.load(open(os.path.join(FICHES, "vocabulaire.json"), encoding="utf-8"))
index = json.load(open(os.path.join(FICHES, "entree", "_index.json"), encoding="utf-8"))
IDS = {c: {e["id"] for e in l} for c, l in index.items()}
TOUS = set().union(*IDS.values())
RACINE = re.compile(r"^(C[1-8]|T(1[0-2]|[1-9])|L[1-5]|S[1-5]|Co|I|II|III|IV|V|V1|V2|V3|VI|VII|VIII|IX|X|XI|XII)$")
ANGLAIS = re.compile(r"\b(the|and|of the|muscle is|which|artery|nerve|bone|with the|from the)\b", re.I)


class Lot:
    def __init__(self, nom):
        self.nom, self.defauts = nom, []

    def dire(self, ou, quoi):
        self.defauts.append(f"{ou} : {quoi}")

    def texte(self, f, cle, mini=8, maxi=320, requis=True):
        v = f.get(cle)
        ou = f"{f.get('id')}.{cle}"
        if v is None:
            if requis:
                self.dire(ou, "manque")
            return
        if not isinstance(v, str):
            return self.dire(ou, "doit être un texte")
        if len(v.strip()) < mini:
            self.dire(ou, f"trop court ({len(v.strip())} caractères)")
        if len(v) > maxi:
            self.dire(ou, f"trop long ({len(v)} caractères, {maxi} au plus)")
        if ANGLAIS.search(v):
            self.dire(ou, "semble contenir de l'anglais")
        if v != v.strip():
            self.dire(ou, "espaces au début ou à la fin")

    def renvois(self, f, cle, valeurs, couches, vide_permis=True):
        ou = f"{f.get('id')}.{cle}"
        if not isinstance(valeurs, list):
            return self.dire(ou, "doit être une liste")
        if not valeurs and not vide_permis:
            self.dire(ou, "liste vide")
        permis = set().union(*(IDS[c] for c in couches))
        for v in valeurs:
            if v not in permis:
                self.dire(ou, f"identifiant inconnu « {v} » (attendu : {', '.join(couches)})")
            if v == f.get("id"):
                self.dire(ou, "se cite lui-même")
        if len(set(valeurs)) != len(valeurs):
            self.dire(ou, "doublons")

    def attaches(self, f, cle):
        l = f.get(cle)
        ou = f"{f.get('id')}.{cle}"
        if not isinstance(l, list) or not l:
            return self.dire(ou, "liste d'attaches manquante ou vide")
        for k, a in enumerate(l):
            if not isinstance(a, dict) or not isinstance(a.get("texte"), str) or len(a["texte"]) < 4:
                self.dire(f"{ou}[{k}]", "il faut un texte")
                continue
            if len(a["texte"]) > 220:
                self.dire(f"{ou}[{k}].texte", "trop long (220 au plus)")
            self.renvois(f, f"{cle}[{k}].os", a.get("os", []), ["os", "tendon", "ligament"])


def muscle(L, f):
    L.texte(f, "resume", 20, 200)
    L.attaches(f, "origine")
    L.attaches(f, "terminaison")
    L.texte(f, "action", 10, 260)
    acts = f.get("actions")
    if not isinstance(acts, list) or not acts:
        L.dire(f"{f['id']}.actions", "liste manquante ou vide")
    else:
        vus = set()
        for k, a in enumerate(acts):
            ou = f"{f['id']}.actions[{k}]"
            if not isinstance(a, dict):
                L.dire(ou, "doit être un objet")
                continue
            if a.get("articulation") not in voc["articulations"]:
                L.dire(ou, f"articulation inconnue « {a.get('articulation')} »")
            if a.get("mouvement") not in voc["mouvements"]:
                L.dire(ou, f"mouvement inconnu « {a.get('mouvement')} »")
            if a.get("role") not in ("principal", "accessoire"):
                L.dire(ou, "role : « principal » ou « accessoire »")
            if "precision" in a and (not isinstance(a["precision"], str) or len(a["precision"]) > 160):
                L.dire(ou, "precision : un texte de 160 caractères au plus")
            cle = (a.get("articulation"), a.get("mouvement"))
            if cle in vus:
                L.dire(ou, "action en double")
            vus.add(cle)
        if not any(isinstance(a, dict) and a.get("role") == "principal" for a in acts):
            L.dire(f"{f['id']}.actions", "aucune action principale")
    L.renvois(f, "synergistes", f.get("synergistes", []), ["muscle"])
    L.renvois(f, "antagonistes", f.get("antagonistes", []), ["muscle"])
    inn = f.get("innervation")
    if not isinstance(inn, dict) or not isinstance(inn.get("texte"), str) or len(inn["texte"]) < 4:
        L.dire(f"{f['id']}.innervation", "il faut { nerf, texte, racines }")
    else:
        if inn.get("nerf") is not None:
            L.renvois(f, "innervation.nerf", [inn["nerf"]], ["nerf"])
        rac = inn.get("racines")
        if not isinstance(rac, list) or not rac:
            L.dire(f"{f['id']}.innervation.racines", "liste manquante ou vide (C5, L4, VII…)")
        else:
            for r in rac:
                if not RACINE.match(str(r)):
                    L.dire(f"{f['id']}.innervation.racines", f"« {r} » : attendu C1-C8, T1-T12, L1-L5, S1-S5 ou un nerf crânien (VII, V3…)")
    vasc = f.get("vascularisation")
    if not isinstance(vasc, dict) or not isinstance(vasc.get("texte"), str) or len(vasc["texte"]) < 4:
        L.dire(f"{f['id']}.vascularisation", "il faut { texte, arteres }")
    else:
        L.renvois(f, "vascularisation.arteres", vasc.get("arteres", []), ["artere"])
    L.texte(f, "palpation", requis=False)
    L.texte(f, "test", requis=False)
    L.texte(f, "atteinte", 12, 320)
    L.texte(f, "clinique", requis=False)
    L.texte(f, "memo", 8, 220)
    L.texte(f, "variantes", requis=False)


def artere(L, f):
    L.texte(f, "resume", 20, 200)
    p = f.get("provenance")
    if not isinstance(p, dict) or not isinstance(p.get("texte"), str):
        L.dire(f"{f['id']}.provenance", "il faut { artere, texte }")
    elif p.get("artere") is not None:
        L.renvois(f, "provenance.artere", [p["artere"]], ["artere", "viscere"])
    L.texte(f, "trajet", 12, 360)
    br = f.get("branches")
    if not isinstance(br, list):
        L.dire(f"{f['id']}.branches", "liste manquante (vide si l'artère n'a pas de branche nommée)")
    else:
        for k, b in enumerate(br):
            if not isinstance(b, dict) or not isinstance(b.get("texte"), str) or len(b["texte"]) < 3:
                L.dire(f"{f['id']}.branches[{k}]", "il faut { artere, texte }")
            elif b.get("artere") is not None:
                L.renvois(f, f"branches[{k}].artere", [b["artere"]], ["artere"])
    L.texte(f, "terminaison", 6, 220)
    t = f.get("territoire")
    if not isinstance(t, dict) or not isinstance(t.get("texte"), str) or len(t["texte"]) < 6:
        L.dire(f"{f['id']}.territoire", "il faut { texte, structures }")
    else:
        L.renvois(f, "territoire.structures", t.get("structures", []), ["os", "muscle", "viscere", "encephale", "tendon", "ligament", "nerf"])
    L.texte(f, "rapports", requis=False, maxi=360)
    pouls = f.get("pouls")
    if pouls is not None and (not isinstance(pouls, dict) or not isinstance(pouls.get("ou"), str) or len(pouls["ou"]) < 8):
        L.dire(f"{f['id']}.pouls", "null, ou { ou : « où et comment le prendre » }")
    L.texte(f, "anastomoses", requis=False, maxi=360)
    L.texte(f, "clinique", 12, 360)
    L.texte(f, "memo", 8, 220)
    L.texte(f, "variantes", requis=False)


def os_(L, f):
    L.texte(f, "resume", 20, 220)
    if f.get("sorte") not in ("long", "court", "plat", "irregulier", "sesamoide", "cartilage", "dent", "groupe"):
        L.dire(f"{f['id']}.sorte", "long, court, plat, irregulier, sesamoide, cartilage, dent ou groupe")
    arts = f.get("articulations")
    if not isinstance(arts, list):
        L.dire(f"{f['id']}.articulations", "liste manquante (vide si l'os ne s'articule avec aucun autre)")
    else:
        for k, a in enumerate(arts):
            if not isinstance(a, dict) or not isinstance(a.get("nom"), str):
                L.dire(f"{f['id']}.articulations[{k}]", "il faut { os, nom, type }")
            else:
                L.renvois(f, f"articulations[{k}].os", [a.get("os")] if a.get("os") else [], ["os"])
    rel = f.get("reliefs")
    if not isinstance(rel, list):
        L.dire(f"{f['id']}.reliefs", "liste manquante")
    else:
        for k, r in enumerate(rel):
            if not isinstance(r, dict) or not isinstance(r.get("nom"), str) or not isinstance(r.get("role"), str):
                L.dire(f"{f['id']}.reliefs[{k}]", "il faut { nom, role }")
            elif len(r["role"]) > 240:
                L.dire(f"{f['id']}.reliefs[{k}].role", "trop long (240 au plus)")
    for k, o in enumerate(f.get("foramens", []) or []):
        if not isinstance(o, dict) or not isinstance(o.get("nom"), str) or not isinstance(o.get("contenu"), str):
            L.dire(f"{f['id']}.foramens[{k}]", "il faut { nom, contenu }")
    L.texte(f, "ossification", requis=False)
    L.texte(f, "palpation", requis=False)
    L.texte(f, "clinique", 12, 360)
    L.texte(f, "memo", 8, 220)
    L.texte(f, "variantes", requis=False)


def tendon(L, f):
    L.texte(f, "resume", 20, 220)
    L.renvois(f, "muscles", f.get("muscles", []), ["muscle"])
    L.texte(f, "attache", 6, 260)
    L.texte(f, "role", 10, 260)
    L.texte(f, "rapports", requis=False, maxi=360)
    r = f.get("reflexe")
    if r is not None:
        if not isinstance(r, dict) or not isinstance(r.get("nom"), str) or not isinstance(r.get("racines"), list) or not all(RACINE.match(str(x)) for x in r["racines"]):
            L.dire(f"{f['id']}.reflexe", "null, ou { nom, racines : [\"L4\"…] }")
    L.texte(f, "palpation", requis=False)
    L.texte(f, "clinique", 12, 360)
    L.texte(f, "memo", 8, 220)
    L.texte(f, "variantes", requis=False)


def lien(L, f, cle, couches, requis=True, champ="texte", mini=6, maxi=260):
    """Un objet { <identifiant> , texte } : `couches` dit où l'identifiant doit se trouver (clé = nom de la couche)."""
    v = f.get(cle)
    ou = f"{f['id']}.{cle}"
    if v is None:
        if requis:
            L.dire(ou, "manque")
        return
    if not isinstance(v, dict) or not isinstance(v.get(champ), str) or len(v[champ].strip()) < mini:
        return L.dire(ou, f"il faut {{ {', '.join(couches)}, {champ} }}")
    if len(v[champ]) > maxi:
        L.dire(f"{ou}.{champ}", f"trop long ({len(v[champ])} caractères, {maxi} au plus)")
    for c in couches:
        if v.get(c) is not None:
            L.renvois(f, f"{cle}.{c}", [v[c]], [c])


def liste_liens(L, f, cle, couche, requis=False):
    v = f.get(cle)
    ou = f"{f['id']}.{cle}"
    if v is None:
        if requis:
            L.dire(ou, "manque")
        return
    if not isinstance(v, list):
        return L.dire(ou, "doit être une liste")
    for k, b in enumerate(v):
        if not isinstance(b, dict) or not isinstance(b.get("texte"), str) or len(b["texte"]) < 3:
            L.dire(f"{ou}[{k}]", f"il faut {{ {couche}, texte }}")
        elif b.get(couche) is not None:
            L.renvois(f, f"{cle}[{k}].{couche}", [b[couche]], [couche])


def structures(L, f, cle, couches, requis=True):
    """Un objet { texte, structures : [identifiants] }."""
    v = f.get(cle)
    ou = f"{f['id']}.{cle}"
    if v is None:
        if requis:
            L.dire(ou, "manque")
        return
    if not isinstance(v, dict) or not isinstance(v.get("texte"), str) or len(v["texte"].strip()) < 6:
        return L.dire(ou, "il faut { texte, structures }")
    if len(v["texte"]) > 320:
        L.dire(f"{ou}.texte", "trop long (320 au plus)")
    for k, liste in v.items():
        if k != "texte":
            L.renvois(f, f"{cle}.{k}", liste, couches if k == "structures" else [{"arteres": "artere", "veines": "veine", "nerfs": "nerf", "muscles": "muscle"}.get(k, k)])


def racines(L, f, ou, rac, requis=True):
    if rac is None and not requis:
        return
    if not isinstance(rac, list) or (requis and not rac):
        return L.dire(ou, "liste manquante ou vide (C5, L4, VII…)")
    for r in rac:
        if not RACINE.match(str(r)):
            L.dire(ou, f"« {r} » : attendu C1-C8, T1-T12, L1-L5, S1-S5, Co ou un nerf crânien (VII, V3…)")


NATURES_LIGAMENT = ("ligament", "capsule", "disque", "noyau", "bourse", "menisque", "labrum", "membrane", "symphyse", "cartilage", "groupe")


def ligament(L, f):
    L.texte(f, "resume", 20, 220)
    if f.get("nature") not in NATURES_LIGAMENT:
        L.dire(f"{f['id']}.nature", " ou ".join(NATURES_LIGAMENT))
    L.texte(f, "articulation", 4, 160)
    att = f.get("attaches")
    if not isinstance(att, list):
        L.dire(f"{f['id']}.attaches", "liste manquante (vide pour une bourse : dire alors où elle est dans « situation »)")
    elif att:
        L.attaches(f, "attaches")
    L.texte(f, "situation", 8, 260, requis=not att)
    L.texte(f, "role", 10, 300)
    L.texte(f, "tendu", requis=False, maxi=200)
    L.texte(f, "test", requis=False)
    L.texte(f, "clinique", 12, 360)
    L.texte(f, "memo", 8, 220)
    L.texte(f, "variantes", requis=False)


def veine(L, f):
    L.texte(f, "resume", 20, 220)
    if f.get("plan") not in ("superficielle", "profonde", "sinus", "pulmonaire", "portale", "groupe"):
        L.dire(f"{f['id']}.plan", "superficielle, profonde, sinus, pulmonaire, portale ou groupe")
    lien(L, f, "origine", ["veine"])
    L.texte(f, "trajet", 12, 360)
    liste_liens(L, f, "affluents", "veine")
    lien(L, f, "terminaison", ["veine", "viscere"])
    structures(L, f, "drainage", ["os", "muscle", "viscere", "encephale", "tendon", "ligament"])
    L.texte(f, "rapports", requis=False, maxi=360)
    L.texte(f, "clinique", 12, 360)
    L.texte(f, "memo", 8, 220)
    L.texte(f, "variantes", requis=False)


def nerf(L, f):
    L.texte(f, "resume", 20, 220)
    if f.get("sorte") not in ("cranien", "spinal", "plexus", "branche", "ganglion", "groupe"):
        L.dire(f"{f['id']}.sorte", "cranien, spinal, plexus, branche, ganglion ou groupe")
    o = f.get("origine")
    lien(L, f, "origine", ["nerf"])
    if isinstance(o, dict):
        racines(L, f, f"{f['id']}.origine.racines", o.get("racines"), requis=False)
    L.texte(f, "trajet", 12, 360)
    orif = f.get("orifices")
    if orif is not None and (not isinstance(orif, list) or not all(isinstance(x, str) and 3 <= len(x) <= 120 for x in orif)):
        L.dire(f"{f['id']}.orifices", "une liste de noms (foramen, canal, fissure…)")
    liste_liens(L, f, "branches", "nerf")
    m = f.get("moteur")
    if m is not None:
        structures(L, f, "moteur", ["muscle"])
    sens = f.get("sensitif")
    if sens is not None and (not isinstance(sens, dict) or not isinstance(sens.get("texte"), str) or len(sens["texte"]) < 6):
        L.dire(f"{f['id']}.sensitif", "null, ou { texte }")
    if m is None and sens is None and f.get("autonome") is None and f.get("sorte") not in ("plexus", "groupe", "ganglion"):
        L.dire(f"{f['id']}", "un nerf est moteur, sensitif ou autonome : remplis au moins un des trois")
    L.texte(f, "autonome", requis=False)
    r = f.get("reflexe")
    if r is not None:
        if not isinstance(r, dict) or not isinstance(r.get("nom"), str):
            L.dire(f"{f['id']}.reflexe", "null, ou { nom, racines }")
        else:
            racines(L, f, f"{f['id']}.reflexe.racines", r.get("racines"))
    L.texte(f, "atteinte", 12, 360)
    L.texte(f, "test", requis=False)
    L.texte(f, "clinique", requis=False, maxi=360)
    L.texte(f, "memo", 8, 220)
    L.texte(f, "variantes", requis=False)


SYSTEMES = ("digestif", "respiratoire", "circulatoire", "urinaire", "genital", "endocrinien", "lymphatique", "sensoriel", "nerveux", "tegumentaire")


def viscere(L, f):
    L.texte(f, "resume", 20, 220)
    if f.get("systeme") not in SYSTEMES:
        L.dire(f"{f['id']}.systeme", " ou ".join(SYSTEMES))
    L.texte(f, "situation", 10, 300)
    L.texte(f, "fonction", 10, 320)
    for k, p in enumerate(f.get("parties", []) or []):
        if not isinstance(p, dict) or not isinstance(p.get("nom"), str) or not isinstance(p.get("role"), str):
            L.dire(f"{f['id']}.parties[{k}]", "il faut { nom, role }")
        elif len(p["role"]) > 240:
            L.dire(f"{f['id']}.parties[{k}].role", "trop long (240 au plus)")
    L.texte(f, "rapports", requis=False, maxi=360)
    structures(L, f, "vascularisation", ["artere"])
    if f.get("innervation") is not None:
        structures(L, f, "innervation", ["nerf"])
    L.texte(f, "examen", requis=False, maxi=320)
    L.texte(f, "clinique", 12, 360)
    L.texte(f, "memo", 8, 220)
    L.texte(f, "variantes", requis=False)


PARTIES = ("telencephale", "diencephale", "tronc-cerebral", "cervelet", "moelle-spinale", "ventricules", "meninges", "voies")


def encephale(L, f):
    L.texte(f, "resume", 20, 220)
    if f.get("partie") not in PARTIES:
        L.dire(f"{f['id']}.partie", " ou ".join(PARTIES))
    L.texte(f, "situation", 10, 300)
    L.texte(f, "fonction", 10, 320)
    if f.get("connexions") is not None:
        structures(L, f, "connexions", ["encephale", "nerf", "viscere"])
    if f.get("vascularisation") is not None:
        structures(L, f, "vascularisation", ["artere"])
    L.texte(f, "atteinte", 12, 360)
    L.texte(f, "clinique", requis=False, maxi=360)
    L.texte(f, "memo", 8, 220)
    L.texte(f, "variantes", requis=False)


def lymphe(L, f):
    L.texte(f, "resume", 20, 220)
    L.texte(f, "situation", 10, 300)
    structures(L, f, "recoit", ["os", "muscle", "viscere", "lymphe", "encephale", "tendon", "ligament"])
    lien(L, f, "draine_vers", ["lymphe", "veine"])
    L.texte(f, "palpation", requis=False)
    L.texte(f, "clinique", 12, 360)
    L.texte(f, "memo", 8, 220)
    L.texte(f, "variantes", requis=False)


PAR_COUCHE = {"muscle": muscle, "artere": artere, "os": os_, "tendon": tendon, "ligament": ligament, "veine": veine, "nerf": nerf, "viscere": viscere, "encephale": encephale, "lymphe": lymphe}


def valider(nom):
    L = Lot(nom)
    fe, fs = os.path.join(FICHES, "entree", nom + ".json"), os.path.join(FICHES, "sortie", nom + ".json")
    if not os.path.exists(fe):
        L.dire(nom, "lot inconnu")
        return L
    entree = json.load(open(fe, encoding="utf-8"))
    try:
        sortie = json.load(open(fs, encoding="utf-8"))
    except Exception as err:
        L.dire(nom, f"fichier de sortie illisible : {err}")
        return L
    sources = sortie.get("sources")
    if not isinstance(sources, dict) or len(sources) < 2:
        L.dire("sources", "il faut au moins deux références (clé → { titre, url })")
        sources = {}
    for cle, s in sources.items():
        if not isinstance(s, dict) or not isinstance(s.get("titre"), str) or not re.match(r"https?://", str(s.get("url", ""))):
            L.dire(f"sources.{cle}", "il faut { titre, url }")
    attendus = [s["id"] for s in entree["structures"]]
    fiches = sortie.get("fiches")
    if not isinstance(fiches, list):
        L.dire(nom, "« fiches » doit être une liste")
        return L
    vus = set()
    for f in fiches:
        if not isinstance(f, dict) or f.get("id") not in attendus:
            L.dire(str(f.get("id") if isinstance(f, dict) else f)[:40], "n'est pas une structure de ce lot")
            continue
        if f["id"] in vus:
            L.dire(f["id"], "fiche en double")
        vus.add(f["id"])
        PAR_COUCHE[entree["couche"]](L, f)
        src = f.get("sources")
        if not isinstance(src, list) or len(set(src)) < 2:
            L.dire(f"{f['id']}.sources", "au moins deux références consultées")
        else:
            for s in src:
                if s not in sources:
                    L.dire(f"{f['id']}.sources", f"clé inconnue « {s} »")
        if "divergences" in f and f["divergences"] is not None:
            L.texte(f, "divergences", 8, 320)
    for i in attendus:
        if i not in vus:
            L.dire(i, "fiche manquante")
    L.total, L.faites = len(attendus), len(vus)
    return L


if __name__ == "__main__":
    lots = sys.argv[1:] or sorted(f[:-5] for f in os.listdir(os.path.join(FICHES, "sortie")) if f.endswith(".json"))
    mauvais = 0
    for nom in lots:
        L = valider(nom)
        print(f"{nom} : {getattr(L, 'faites', 0)}/{getattr(L, 'total', '?')} fiches, {len(L.defauts)} défaut(s)")
        for d in L.defauts[:60]:
            print("   -", d)
        if len(L.defauts) > 60:
            print(f"   … et {len(L.defauts) - 60} autres")
        mauvais += len(L.defauts)
    sys.exit(1 if mauvais else 0)
