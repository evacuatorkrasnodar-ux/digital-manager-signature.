"""SEYVEO: first genuinely independent four-ribbon 3D model.

Blender preview and glTF export are experiments only; the approved app image
remains untouched. Geometry uses volumetric swept bands, not an alpha-map relief.
"""
import bpy
import math
from mathutils import Vector

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

PREVIEW = '/workspace/scratch/3ee1e8e658ec/seyveo-ribbon-preview/real-ribbons-preview.png'
MODEL = '/workspace/scratch/3ee1e8e658ec/seyveo-ribbon-preview/seyveo-real-ribbons.glb'

def make_material():
    mat = bpy.data.materials.new('SAYVI • aqua pearl / frosted glass')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (0.46, 0.74, 0.76, 1.0)
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = 0.25
    bsdf.inputs['IOR'].default_value = 1.38
    bsdf.inputs['Transmission Weight'].default_value = 0.77
    bsdf.inputs['Coat Weight'].default_value = 0.24
    bsdf.inputs['Coat Roughness'].default_value = 0.11
    bsdf.inputs['Subsurface Weight'].default_value = 0.035
    bsdf.inputs['Subsurface Radius'].default_value = (0.6, 1.0, 1.0)
    return mat

glass = make_material()

def add_blade(index):
    # Keep the mobile mesh lean while preserving a smooth radial outline.
    n_t, n_s = 84, 12
    phase = math.pi * .15 + index * math.pi * .5
    sweep = 2.66
    verts, faces, uv = [], [], []

    # Each blade spirals toward the centre and curves around its own width.
    # The leading end sits above the trailing end of the preceding blade.
    def position(t, s, back=False):
        theta = phase + (t - .16) * sweep + .08 * (s - .5) * math.sin(t * math.pi)
        taper = max(0.0, math.sin(math.pi * t)) ** .69
        half_width = .267 * taper
        center_radius = .775 - .202 * t + .036 * math.sin(math.pi * t)
        radius = center_radius + (2*s - 1) * half_width
        z = (.075 + .17*(1 - t) + .112 * math.sin(math.pi*t) *
             math.sin(math.pi*s) + .035*math.cos(2*math.pi*t))
        if back:
            z -= .032 + .012 * math.sin(math.pi * s)
        return (radius * math.cos(theta), radius * math.sin(theta), z)

    # Front shell and genuine independent back shell.
    for back in (False, True):
        for i in range(n_t + 1):
            t = i / n_t
            for j in range(n_s + 1):
                s = j / n_s
                verts.append(position(t, s, back))
                uv.append((t,s))

    step = n_s + 1
    per_shell = (n_t + 1) * step
    for back in (False,True):
        off = per_shell if back else 0
        for i in range(n_t):
            for j in range(n_s):
                a = off + i*step+j
                b = a + step
                c = b + 1
                d = a + 1
                faces.append((d,c,b,a) if back else (a,b,c,d))

    # Close the thickness along both long edges and the two tapered ends.
    for j in (0,n_s):
        for i in range(n_t):
            a = i*step+j
            b = (i+1)*step+j
            faces.append((a,a+per_shell,b+per_shell,b) if j==0 else
                         (b,b+per_shell,a+per_shell,a))
    for i in (0,n_t):
        for j in range(n_s):
            a = i*step+j
            b = a+1
            faces.append((b,b+per_shell,a+per_shell,a) if i==0 else
                         (a,a+per_shell,b+per_shell,b))

    mesh = bpy.data.meshes.new(f'SAYVI • ribbon {index+1}')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(f'SAYVI ribbon {index+1}',mesh)
    bpy.context.collection.objects.link(obj)
    for p in mesh.polygons:
        p.use_smooth = True
    obj.data.materials.append(glass)
    return obj

blades = [add_blade(i) for i in range(4)]

world = bpy.context.scene.world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (.012,.037,.032,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = .28

def add_area(name, pos, power, size, color):
    data = bpy.data.lights.new(name, type='AREA')
    data.energy = power
    data.shape = 'DISK'
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.location = pos
    direction = Vector((0,0,0))-obj.location
    obj.rotation_euler = direction.to_track_quat('-Z','Y').to_euler()

add_area('Large softbox · upper-left',(-2.8,3.4,4.1),390,4.3,(.88,1,1))
add_area('Wide aqua reflection · right',(3.6,0.9,2.8),310,3.1,(.70,.94,1.0))
add_area('Pearl rim · lower-left',(-2.2,-3.4,3.1),260,2.5,(1,.95,.91))

camera_data = bpy.data.cameras.new('Camera')
camera = bpy.data.objects.new('Camera',camera_data)
bpy.context.collection.objects.link(camera)
camera.location = (0.18,-0.24,5.1)
target = Vector((0,0,.13))
camera.rotation_euler = (target-Vector(camera.location)).to_track_quat('-Z','Y').to_euler()
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 2.15
bpy.context.scene.camera = camera

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 60
scene.cycles.use_denoising = False
scene.render.resolution_x = 720
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.film_transparent = False
scene.render.filepath = PREVIEW
scene.view_settings.view_transform = 'AgX'
scene.render.image_settings.color_mode = 'RGBA'

# Save a genuine mesh for later mobile WebGL integration.
bpy.ops.export_scene.gltf(filepath=MODEL,export_format='GLB',use_selection=False,
                          export_cameras=False,export_lights=False)
bpy.ops.render.render(write_still=True)
print(f'RENDERED {PREVIEW}\nEXPORTED {MODEL}')
