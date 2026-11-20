# L'Écorché — rendu de contrôle avec Cycles : les pièces préparées (étape 3), par couche, sous l'angle voulu.
# Sert à juger la géométrie indépendamment du moteur du site, et de référence pour régler ses matières.
# Usage : python apercu.py <sortie.png> <lod> <couches,séparées,par,virgules> <azimut°> <élévation°> <cx> <cy> <cz> <hauteur visible en m> [largeur px] [hauteur px]
import sys, os, json, math
import numpy as np
import bpy
from mathutils import Vector
from commun import DONNEES

a = sys.argv[1:]
sortie, lod, couches = a[0], int(a[1]), a[2].split(",")
azimut, elevation = math.radians(float(a[3])), math.radians(float(a[4]))
centre = np.array([float(a[5]), float(a[6]), float(a[7])])
hauteur = float(a[8])
largeur_px = int(a[9]) if len(a) > 9 else 900
hauteur_px = int(a[10]) if len(a) > 10 else 1200
GEO = os.path.join(DONNEES, "geo")
index = json.load(open(os.path.join(GEO, "index.json")))
cl = json.load(open(os.path.join(DONNEES, "classement.json"), encoding="utf-8"))
miroir = {p["objet"]: p["miroir"] for p in cl["pieces"]}
sortes = {p["objet"]: p["sorte"] for p in cl["pieces"]}

COULEURS = {"os": (0.86, 0.80, 0.66), "muscle": (0.45, 0.06, 0.05), "tendon": (0.88, 0.87, 0.82), "ligament": (0.80, 0.80, 0.74), "artere": (0.70, 0.05, 0.05), "veine": (0.12, 0.16, 0.50), "nerf": (0.85, 0.75, 0.30), "viscere": (0.60, 0.35, 0.30), "encephale": (0.75, 0.62, 0.58), "lymphe": (0.45, 0.6, 0.35), "insertion": (0.2, 0.3, 0.8)}
SECOND = {"os": (0.72, 0.80, 0.86), "muscle": (0.90, 0.89, 0.84)}

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene


def depuis(P):  # de L'Écorché vers Blender
    return np.stack([P[:, 0], -P[:, 2], P[:, 1]], axis=1)


for couche in couches:
    Ps, Ts, Ws = [], [], []
    base = 0
    for e in index:
        if e["couche"] != couche:
            continue
        if sortes.get(e["objet"]) in ("fascia", "enveloppe", "bourse", "gaine"):
            continue
        f = os.path.join(GEO, f"lod{lod}", e["cle"] + ".npz")
        if not os.path.exists(f):
            continue
        d = np.load(f)
        P, T, W = d["P"], d["T"].astype(np.int64), d["W"]
        copies = [(P, T)]
        if miroir.get(e["objet"], couche == "insertion"):
            copies.append((P * np.array([-1, 1, 1], dtype=np.float32), T[:, ::-1]))
        for Pc, Tc in copies:
            Ps.append(depuis(Pc)); Ts.append(Tc + base); Ws.append(W[:, 0]); base += len(Pc)
    if not Ps:
        continue
    P = np.concatenate(Ps); T = np.concatenate(Ts); W = np.concatenate(Ws).astype(np.float32) / 255
    m = bpy.data.meshes.new(couche)
    m.vertices.add(len(P)); m.vertices.foreach_set("co", P.astype(np.float32).ravel())
    m.loops.add(len(T) * 3); m.loops.foreach_set("vertex_index", T.astype(np.int32).ravel())
    m.polygons.add(len(T)); m.polygons.foreach_set("loop_start", np.arange(0, len(T) * 3, 3, dtype=np.int32)); m.polygons.foreach_set("loop_total", np.full(len(T), 3, dtype=np.int32))
    m.polygons.foreach_set("use_smooth", np.ones(len(T), dtype=bool))
    m.update(calc_edges=True)
    att = m.color_attributes.new("poids", "FLOAT_COLOR", "POINT")
    att.data.foreach_set("color", np.repeat(W[:, None], 4, axis=1).ravel())
    o = bpy.data.objects.new(couche, m); sc.collection.objects.link(o)
    mat = bpy.data.materials.new(couche); mat.use_nodes = True
    nt = mat.node_tree; b = nt.nodes["Principled BSDF"]
    c1 = COULEURS.get(couche, (0.6, 0.6, 0.6)); c2 = SECOND.get(couche, c1)
    att_n = nt.nodes.new("ShaderNodeAttribute"); att_n.attribute_name = "poids"
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
    mix.inputs[6].default_value = (*c1, 1); mix.inputs[7].default_value = (*c2, 1)
    nt.links.new(att_n.outputs["Fac"], mix.inputs[0]); nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.42 if couche in ("muscle", "artere", "veine", "viscere") else 0.6
    m.materials.append(mat)
    print(couche, len(P), "sommets", len(T), "triangles")

c = Vector((centre[0], -centre[2], centre[1]))
d = Vector((math.sin(azimut) * math.cos(elevation), -math.cos(azimut) * math.cos(elevation), math.sin(elevation)))
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam)
cam.data.type = "ORTHO"; cam.data.ortho_scale = hauteur * max(1.0, largeur_px / hauteur_px)
cam.location = c + d * 4; cam.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
cam.data.clip_end = 20
sc.camera = cam
for (dx, dy, dz, e, ang) in [(-0.6, 0.9, 0.9, 3.2, 0.25), (0.9, 0.6, 0.2, 1.0, 0.6), (0.2, -1.0, 0.5, 1.6, 0.4)]:
    l = bpy.data.objects.new("l", bpy.data.lights.new("l", "SUN")); l.data.energy = e; l.data.angle = ang
    sc.collection.objects.link(l)
    droite = d.cross(Vector((0, 0, 1))).normalized(); haut = droite.cross(d).normalized()
    vers = (droite * dx + d * dy + haut * dz).normalized()
    l.rotation_euler = (-vers).to_track_quat("-Z", "Y").to_euler()
sc.render.engine = "CYCLES"; sc.cycles.samples = int(os.environ.get("ECHANTILLONS", "20")); sc.cycles.device = "CPU"; sc.cycles.use_denoising = False
sc.render.resolution_x = largeur_px; sc.render.resolution_y = hauteur_px
sc.view_settings.view_transform = "AgX"
sc.world = bpy.data.worlds.new("w"); sc.world.use_nodes = True
sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.045, 0.07, 0.065, 1)
sc.world.node_tree.nodes["Background"].inputs[1].default_value = 0.6
sc.render.filepath = sortie
bpy.ops.render.render(write_still=True)
