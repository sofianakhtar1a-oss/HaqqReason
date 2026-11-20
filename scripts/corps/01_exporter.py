# L'Écorché — étape 1 de la chaîne : lire le fichier Blender de Z-Anatomy (CC BY-SA 4.0) et en sortir
# chaque objet sous une forme simple : un index JSON et un fichier binaire (positions, triangles, matière par triangle).
# Lecture seule, scripts du fichier désactivés. Usage :
#   python 01_exporter.py -- <Startup.blend> <dossier de sortie> [début fin]
# (Blender garde en mémoire chaque maillage évalué : on exporte par tranches d'objets, une exécution par tranche.)
import sys, json, struct, re, os
import numpy as np
import bpy

chemin = sys.argv[sys.argv.index("--") + 1]
sortie = sys.argv[sys.argv.index("--") + 2]
reste = sys.argv[sys.argv.index("--") + 3:]
debut, fin = (int(reste[0]), int(reste[1])) if len(reste) >= 2 else (0, 10 ** 9)
os.makedirs(sortie, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=chemin, use_scripts=False, load_ui=False)

# Tout rendre visible pour que tout soit évalué (les étiquettes et les reliefs sont cachés dans le fichier).
def ouvrir(lc):
    lc.exclude = False
    lc.hide_viewport = False
    lc.collection.hide_viewport = False
    for e in lc.children:
        ouvrir(e)
ouvrir(bpy.context.view_layer.layer_collection)
for o in bpy.data.objects:
    o.hide_viewport = False
    try:
        o.hide_set(False)
    except Exception:
        pass
    for m in o.modifiers:
        if m.type == "SUBSURF":
            m.levels = max(m.levels, m.render_levels)
        m.show_viewport = True

deps = bpy.context.evaluated_depsgraph_get()
deps.update()

PRINCIPALE = re.compile(r"^\d: ")
blob = open(os.path.join(sortie, f"geometrie-{debut:05d}.bin"), "wb")
decalage = 0
index = []

def ecrire(a):
    global decalage
    b = a.tobytes()
    blob.write(b)
    d = decalage
    decalage += len(b)
    return d

for rang, o in enumerate(sorted(bpy.data.objects, key=lambda x: x.name)):
    if rang < debut or rang >= fin:
        continue
    if o.type not in ("MESH", "CURVE"):
        if o.type == "FONT":
            try:
                corps = o.data.body
            except Exception:
                corps = None
            p = o.matrix_world.translation
            index.append({"nom": o.name, "type": "FONT", "collections": [c.name for c in o.users_collection], "parent": o.parent.name if o.parent else None, "texte": corps, "position": [round(p.x, 5), round(p.y, 5), round(p.z, 5)]})
        continue
    e = o.evaluated_get(deps)
    if os.environ.get("TRACE"):
        rss = int(open("/proc/self/statm").read().split()[1]) * 4096 // (1 << 20)
        print("->", rss, "Mo", o.name, flush=True)
    try:
        m = e.to_mesh()
    except Exception as err:
        print("échec", o.name, err)
        continue
    d = {"nom": o.name, "type": o.type, "collections": [c.name for c in o.users_collection], "parent": o.parent.name if o.parent else None,
         "mats": [s.material.name if s.material else None for s in e.material_slots], "mods": [x.type for x in o.modifiers]}
    if m is not None and len(m.vertices) > 0:
        n = len(m.vertices)
        co = np.empty(n * 3, dtype=np.float32)
        m.vertices.foreach_get("co", co)
        co = co.reshape(n, 3).astype(np.float64)
        M = np.array(e.matrix_world)
        monde = (co @ M[:3, :3].T + M[:3, 3]).astype(np.float32)
        m.calc_loop_triangles()
        nt = len(m.loop_triangles)
        tri = np.empty(nt * 3, dtype=np.int32)
        m.loop_triangles.foreach_get("vertices", tri)
        tri = tri.reshape(nt, 3)
        if np.linalg.det(M[:3, :3]) < 0:
            tri = tri[:, ::-1]
        mat = np.empty(nt, dtype=np.int32)
        m.loop_triangles.foreach_get("material_index", mat)
        d["sommets"] = n
        d["triangles"] = nt
        d["o_sommets"] = ecrire(monde)
        d["o_triangles"] = ecrire(np.ascontiguousarray(tri, dtype=np.uint32))
        d["o_matieres"] = ecrire(mat.astype(np.uint8))
        if nt == 0 and len(m.edges) > 0:
            ne = len(m.edges)
            ar = np.empty(ne * 2, dtype=np.int32)
            m.edges.foreach_get("vertices", ar)
            d["aretes"] = ne
            d["o_aretes"] = ecrire(ar.astype(np.uint32))
    else:
        d["sommets"] = 0
        d["triangles"] = 0
    e.to_mesh_clear()
    if o.type == "CURVE":
        c = o.data
        M = np.array(o.matrix_world)
        ech = float(np.cbrt(abs(np.linalg.det(M[:3, :3]))))
        splines = []
        for s in c.splines:
            pts = []
            if s.type == "BEZIER":
                for p in s.bezier_points:
                    w = M[:3, :3] @ np.array(p.co) + M[:3, 3]
                    g = M[:3, :3] @ np.array(p.handle_left) + M[:3, 3]
                    dr = M[:3, :3] @ np.array(p.handle_right) + M[:3, 3]
                    pts.append([*map(float, w), float(p.radius), *map(float, g), *map(float, dr)])
            else:
                for p in s.points:
                    w = M[:3, :3] @ np.array(p.co[:3]) + M[:3, 3]
                    pts.append([*map(float, w), float(p.radius)])
            splines.append({"sorte": s.type, "ferme": bool(s.use_cyclic_u), "ordre": int(s.order_u), "res": int(s.resolution_u), "points": [[round(x, 6) for x in p] for p in pts]})
        d["courbe"] = {"bevel": float(c.bevel_depth) * ech, "bevel_res": int(c.bevel_resolution), "objet_bevel": c.bevel_object.name if c.bevel_object else None, "taper": c.taper_object.name if c.taper_object else None, "extrude": float(c.extrude) * ech, "mode": c.bevel_mode, "res": int(c.resolution_u), "splines": splines}
    index.append(d)

blob.close()
json.dump({"source": os.path.basename(chemin), "blender": bpy.app.version_string, "geometrie": f"geometrie-{debut:05d}.bin", "objets": index}, open(os.path.join(sortie, f"index-{debut:05d}.json"), "w"), ensure_ascii=False)
print("exporté", len(index), "objets,", decalage, "octets")
