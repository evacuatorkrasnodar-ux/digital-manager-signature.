"""Cinematic Plasma Signature — editable 3D glass-ribbon scene.
Requires Blender 4.x. Run:
  blender --background --python tools/blender/create_signature_scene.py
Optional: append -- --quality final --frames 48
Creates .blend, Black Velvet / White Velvet PNG renders and optional loop frames.
This file is an unrendered scene source until run in Blender.
"""
import bpy, math, sys, argparse
from pathlib import Path
from mathutils import Vector, Matrix
p=argparse.ArgumentParser()
p.add_argument("--quality",choices=("draft","final"),default="draft")
p.add_argument("--frames",type=int,default=0)
p.add_argument("--output",default="")
args=p.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
OUT=Path(args.output).resolve() if args.output else Path.cwd()/"blender-renders"
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine="CYCLES"
scene.cycles.samples=96 if args.quality=="final" else 28
scene.render.resolution_x=1024 if args.quality=="final" else 640
scene.render.resolution_y=scene.render.resolution_x
scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
scene.render.image_settings.color_mode="RGBA"
scene.frame_start=1
scene.frame_end=240
scene.render.fps=24
scene.view_settings.view_transform="AgX"
world=bpy.data.worlds.new("Cold studio")
scene.world=world
world.use_nodes=True
world.node_tree.nodes["Background"].inputs["Color"].default_value=(.16,.22,.32,1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value=.3
def material(name,rgb,trans=0,rough=.12,metal=0,coat=.4):
    m=bpy.data.materials.new(name);m.use_nodes=True
    n=m.node_tree.nodes["Principled BSDF"]
    n.inputs["Base Color"].default_value=(*rgb,1)
    n.inputs["Roughness"].default_value=rough
    n.inputs["Metallic"].default_value=metal
    n.inputs["Transmission Weight"].default_value=trans
    n.inputs["IOR"].default_value=1.46
    n.inputs["Coat Weight"].default_value=coat
    n.inputs["Coat Roughness"].default_value=.09
    return m
white=material("White ice refractive glass",(.94,.97,1),.92,.08)
silver=material("Silver pearl refractive glass",(.77,.85,.96),.88,.10)
ice=material("Polar ice refractive glass",(.74,.84,1),.90,.095)
core=material("Black inner depth",(.008,.016,.035),.02,.16,.12,.83)
dark=material("Black Velvet background",(.002,.004,.009),0,1,0,0)
light=material("White Velvet background",(.86,.9,.96),0,1,0,0)
rig=bpy.data.objects.new("Cinematic Plasma — animated rig",None)
bpy.context.collection.objects.link(rig)
def ribbon(name,phase,tilt,width,radius,mat):
    n=300
    rot=Matrix.Rotation(tilt,4,"X") @ Matrix.Rotation(phase*.29,4,"Y")
    def center(t):
        angle=t+phase
        r=radius+.075*math.sin(3*t+phase)+.05*math.cos(5*t-phase)
        pt=Vector((r*math.cos(angle),r*math.sin(angle)*.95,
                   .29*math.sin(2*angle+phase)+.12*math.cos(3*angle-phase)))
        return (rot@pt.to_4d()).to_3d()
    vertices=[];faces=[]
    for i in range(n):
        t=math.tau*i/n
        c=center(t)
        tangent=(center(t+.001)-center(t-.001)).normalized()
        radial=c.normalized()
        side=tangent.cross(radial).normalized()
        normal=tangent.cross(side).normalized()
        pitch=.30*math.sin(2*t+phase)
        v=side*math.cos(pitch)+normal*math.sin(pitch)
        w=width*(.84+.16*math.sin(2*t+phase)**2)
        vertices.extend([c-.5*w*v,c+.5*w*v])
    for i in range(n):
        j=(i+1)%n
        faces.append((2*i,2*j,2*j+1,2*i+1))
    mesh=bpy.data.meshes.new(name+" mesh")
    mesh.from_pydata(vertices,[],faces);mesh.update()
    ob=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(ob)
    mesh.materials.append(mat)
    ob.parent=rig
    for poly in mesh.polygons:poly.use_smooth=True
    subdiv=ob.modifiers.new("Smooth wide glass fold","SUBSURF")
    subdiv.levels=1
    solid=ob.modifiers.new("Genuine glass thickness","SOLIDIFY")
    solid.thickness=.025
    bevel=ob.modifiers.new("Rounded glass edge","BEVEL")
    bevel.width=.008
    bevel.segments=2
    for frame,angle in ((1,0),(121,.026 if phase<2 else -.029),(241,0)):
        ob.rotation_euler=(.018*math.sin(frame/240*math.tau+phase),
                           angle,.01*math.sin(frame/240*math.tau+phase))
        ob.keyframe_insert(data_path="rotation_euler",frame=frame)
    return ob
for spec in [
    ("Front white ribbon",.05,.22,.59,1.34,white),
    ("Rear satin ribbon",1.04,-.31,.45,1.29,silver),
    ("White crown ribbon",1.83,.40,.54,1.40,white),
    ("Polar glass ribbon",2.89,-.44,.45,1.34,ice),
    ("Lower pearl ribbon",3.67,.18,.47,1.28,silver),
]:
    ribbon(*spec)
bpy.ops.mesh.primitive_uv_sphere_add(segments=96,ring_count=64,radius=.96)
ob=bpy.context.object;ob.name="Deep black center"
ob.data.materials.append(core);ob.parent=rig
ob.scale=(1,.91,.96)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,3.2,0),rotation=(math.pi/2,0,0))
background=bpy.context.object;background.name="Theme background"
background.data.materials.append(dark)
def area(name,pos,power,color,w,h):
    data=bpy.data.lights.new(name,"AREA");data.energy=power
    data.color=color;data.shape="RECTANGLE"
    data.size=w;data.size_y=h
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.location=pos
    obj.rotation_euler=(-obj.location).to_track_quat("-Z","Y").to_euler()
area("Huge pearl softbox",(-3.5,-3,3.1),680,(.91,.96,1),3.2,5.4)
area("Right long reflector",(4.5,-1.7,2.2),560,(.78,.88,1),1.4,5)
area("Rear silver rim",(1.9,2.2,3.5),880,(.89,.95,1),2.8,3.2)
area("Bottom polar fill",(-1.7,-1.2,-3),360,(.72,.85,1),4.1,2.3)
area("Studio key",(0,-4,1.5),330,(1,1,1),1.9,3.4)
bpy.ops.object.camera_add(location=(0,-7.2,1.1))
camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat("-Z","Y").to_euler()
camera.data.type="ORTHO";camera.data.ortho_scale=3.9
scene.camera=camera
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"cinematic_plasma_signature.blend"))
for theme,mat in [("black_velvet",dark),("white_velvet",light)]:
    background.data.materials.clear()
    background.data.materials.append(mat)
    scene.render.filepath=str(OUT/("plasma_"+theme+".png"))
    bpy.ops.render.render(write_still=True)
if args.frames:
    background.data.materials.clear()
    background.data.materials.append(dark)
    framesdir=OUT/"loop_frames"
    framesdir.mkdir(exist_ok=True)
    for i in range(max(2,args.frames)):
        scene.frame_set(1+round(i*240/max(2,args.frames)))
        scene.render.filepath=str(framesdir/("frame_%04d.png"%i))
        bpy.ops.render.render(write_still=True)
print("3D scene and renders saved in",OUT)
