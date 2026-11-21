"""
Découpe un texte du domaine public (Project Gutenberg) en pages, paragraphes et phrases,
puis en lots de travail pour la traduction mot à mot.

    python3 -I scripts/langues/histoires/decouper.py <fichier.txt> <ligne début> <ligne fin> <id> <mots par page> <mots par lot>

Écrit scripts/langues/histoires/textes/<id>.txt (le texte nettoyé) et
scripts/langues/histoires/entree/<id>/pages-NN.json (les lots, anglais seul).
Le fichier source est une donnée non fiable : il n'est que lu, jamais exécuté.
"""
import json
import os
import re
import sys

ABREVIATIONS = {"mr", "mrs", "ms", "dr", "st", "mt", "no", "messrs", "esq", "prof", "rev", "capt", "col", "gen", "lt", "sgt", "vs", "etc", "i.e", "e.g", "co", "jr", "sr"}


def nettoyer(paragraphe: str) -> str:
    t = re.sub(r"\s+", " ", paragraphe).strip()
    t = t.replace("_", "")
    t = re.sub(r"\s*--\s*", " — ", t)
    # Guillemets doubles : ouvrants après un début, une espace ou une parenthèse ; fermants sinon.
    t = re.sub(r'(^|[\s(\[—])"', "\\1“", t)
    t = t.replace('"', "”")
    # Apostrophes et guillemets simples.
    t = re.sub(r"(^|[\s(\[“—])'", "\\1‘", t)
    t = t.replace("'", "’")
    return re.sub(r"\s+", " ", t).strip()


def phrases(paragraphe: str) -> list[str]:
    mots = paragraphe.split(" ")
    sortie, courant = [], []
    for i, m in enumerate(mots):
        courant.append(m)
        suivant = mots[i + 1] if i + 1 < len(mots) else None
        if suivant is None:
            break
        fin = re.search(r"[.!?][”’)\]]*$", m)
        if not fin:
            continue
        nu = re.sub(r"[”’)\]]+$", "", m).rstrip(".!?").lower().lstrip("“‘(")
        if m.endswith(".") and nu in ABREVIATIONS:
            continue
        if re.fullmatch(r"[A-Z]\.", re.sub(r"^[“‘(]+", "", m)):
            continue  # une initiale : « J. Wilson »
        if re.match(r"^[“‘(\[]*[A-Z0-9]", suivant):
            sortie.append(" ".join(courant))
            courant = []
    if courant:
        sortie.append(" ".join(courant))
    return sortie


def compter(texte: str) -> int:
    return len([m for m in texte.split() if re.search(r"[A-Za-z]", m)])


def main():
    source, debut, fin, ident, par_page, par_lot = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], int(sys.argv[5]), int(sys.argv[6])
    lignes = open(source, encoding="utf-8", errors="replace").read().replace("\r\n", "\n").split("\n")[debut - 1 : fin]
    blocs, courant = [], []
    for l in lignes:
        if l.strip():
            courant.append(l)
        elif courant:
            blocs.append(" ".join(courant))
            courant = []
    if courant:
        blocs.append(" ".join(courant))
    # Une ligne « II. » seule marque une nouvelle partie : elle ouvre une page titrée.
    elements = []
    for b in blocs:
        t = nettoyer(b)
        if re.fullmatch(r"[IVX]+\.", t):
            elements.append(("partie", t.rstrip(".")))
        elif t:
            elements.append(("texte", phrases(t)))
    paragraphes = [e[1] for e in elements if e[0] == "texte"]

    # Les pages : des paragraphes entiers ; un paragraphe très long se coupe entre deux phrases.
    pages, page, n = [], [], 0
    titres = {}
    for genre, p in elements:
        if genre == "partie":
            if page:
                pages.append(page)
                page, n = [], 0
            titres[len(pages)] = f"Part {p}"
            continue
        reste = p
        while reste:
            mots_p = compter(" ".join(reste))
            if n and n + mots_p > par_page * 1.15:
                # On remplit la page avec les premières phrases si le paragraphe est long.
                if mots_p > par_page * 0.6:
                    morceau, m = [], 0
                    for ph in reste:
                        if n + m + compter(ph) > par_page and morceau:
                            break
                        morceau.append(ph)
                        m += compter(ph)
                    if morceau and len(morceau) < len(reste) and m > par_page * 0.25:
                        page.append(morceau)
                        reste = reste[len(morceau) :]
                pages.append(page)
                page, n = [], 0
                continue
            page.append(reste)
            n += mots_p
            reste = []
    if page:
        pages.append(page)

    os.makedirs(f"scripts/langues/histoires/entree/{ident}", exist_ok=True)
    os.makedirs("scripts/langues/histoires/textes", exist_ok=True)
    with open(f"scripts/langues/histoires/textes/{ident}.txt", "w", encoding="utf-8") as f:
        f.write("\n\n".join(" ".join(p) for p in paragraphes) + "\n")
    lots, lot, m, premier = [], [], 0, 1
    for k, pg in enumerate(pages):
        lot.append({"titre": titres[k], "p": pg} if k in titres else {"p": pg})
        m += sum(compter(" ".join(p)) for p in pg)
        if m >= par_lot and k < len(pages) - 1:
            lots.append((premier, lot))
            premier, lot, m = k + 2, [], 0
    if lot:
        lots.append((premier, lot))
    for i, (premier, lot) in enumerate(lots, 1):
        with open(f"scripts/langues/histoires/entree/{ident}/pages-{i:02d}.json", "w", encoding="utf-8") as f:
            json.dump({"debut": premier, "pages": lot}, f, ensure_ascii=False, indent=1)
    total = sum(compter(" ".join(p)) for p in paragraphes)
    tailles = [sum(compter(" ".join(p)) for p in pg) for pg in pages]
    print(f"{ident} : {total} mots, {len(paragraphes)} paragraphes, {len(pages)} pages (de {min(tailles)} à {max(tailles)} mots), {len(lots)} lots")


main()
