/* SEYVEO · real independent swept-ribbon mesh, opt-in ?sayvi-model=1.
   Four watertight 3D bands exported from Blender with physical depth,
   normal-based pearl/frost material and gentle motion. The public home
   keeps its established Sayvi picture unless this experiment is enabled. */
(() => {
  'use strict';
  if(new URLSearchParams(location.search).get('sayvi-model')!=='1')return;
  const orb=document.getElementById('orb');
  const hero=document.getElementById('plasmaVisual');
  const home=document.getElementById('homePage');
  if(!orb||!hero||!home)return;

  const vertexSource=`
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform vec3 uRotation;
    uniform float uTime;
    uniform float uBlade;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vBlade;
    void main(){
      float cx=cos(uRotation.x),sx=sin(uRotation.x);
      float cy=cos(uRotation.y),sy=sin(uRotation.y);
      float cz=cos(uRotation.z),sz=sin(uRotation.z);
      mat3 rx=mat3(1.,0.,0.,0.,cx,sx,0.,-sx,cx);
      mat3 ry=mat3(cy,0.,-sy,0.,1.,0.,sy,0.,cy);
      mat3 rz=mat3(cz,sz,0.,-sz,cz,0.,0.,1.);
      mat3 r=rz*ry*rx;
      // Breathing is barely visible, but makes the model feel inhabited.
      float breath=1.+.0045*sin(uTime*.62);
      vec3 p=r*(aPosition*breath);
      vec3 n=normalize(r*aNormal);
      float perspective=3.1/(3.1-p.z*.64);
      gl_Position=vec4(p.xy*.91*perspective,-.27*p.z,1.);
      vPosition=p;
      vNormal=n;
      vBlade=uBlade;
    }
  `;

  const fragmentSource=`
    precision highp float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vBlade;
    uniform float uTime;
    uniform float uEnergy;
    uniform float uState;

    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);
      f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
                 mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
    }
    float fbm(vec2 p){
      float v=0.,a=.5;
      for(int i=0;i<4;i++){
        v+=a*noise(p);p=p*2.03+vec2(12.1,4.3);a*=.5;
      }
      return v;
    }
    void main(){
      vec3 n=normalize(vNormal);
      if(!gl_FrontFacing)n=-n;
      vec3 eye=normalize(vec3(-vPosition.xy*.18,1.));
      float facing=clamp(abs(dot(n,eye)),0.,1.);
      float fresnel=pow(1.-facing,2.5);
      vec2 q=vPosition.xy;
      vec2 drift=vec2(sin(uTime*.19),cos(uTime*.22))*.22;
      float fold=fbm(q*2.8+drift+vec2(vBlade*.71,-vBlade*.46));
      float silk=fbm(q*5.4-drift*.5+vec2(uTime*.035,-uTime*.028));
      float smoothGlass=smoothstep(.39,.75,
        .33+.40*fold+.23*sin(q.x*5.9+q.y*3.6+uTime*.11+vBlade));
      vec3 pearl=vec3(.83,.965,.958);
      vec3 deepGlass=vec3(.48,.72,.735);
      float inside=.17+.14*(1.-facing)+.09*(1.-fold);
      vec3 color=mix(pearl,deepGlass,inside);
      color=mix(color,vec3(.61,.84,.85),silk*.12);
      // A trailing ribbon is deeper inside the glass weave, not darker metal.
      float behind=1.-smoothstep(.075,.28,vPosition.z);
      color=mix(color,deepGlass,behind*(.045+.05*(1.-smoothGlass)));

      vec3 lightA=normalize(vec3(-.33+.17*sin(uTime*.21),.55,1.));
      vec3 lightB=normalize(vec3(.53,-.31+.13*cos(uTime*.18),1.));
      float diffuseA=max(dot(n,lightA),0.);
      float diffuseB=max(dot(n,lightB),0.);
      float studio=pow(diffuseA,15.)*.24+pow(diffuseB,22.)*.13;
      float polished=pow(max(dot(reflect(-lightA,n),eye),0.),60.)*.88+
                     pow(max(dot(reflect(-lightB,n),eye),0.),78.)*.43;
      color+=vec3(.17,.24,.23)*mix(studio,polished,smoothGlass);
      color+=vec3(.12,.21,.21)*fresnel*(.49+.28*smoothGlass);
      // A broad, faint reflection glides across polished glass without
      // disturbing the approved pearl base colour.
      float travel=dot(q,vec2(.94,.34))-.20*sin(uTime*.24+vBlade*.21);
      float caustic=exp(-32.*travel*travel);
      color+=vec3(.065,.11,.105)*caustic*smoothGlass*.24;
      color+=vec3(.035,.062,.067)*(.65+.35*sin(uTime*1.1+fold*2.));
      float energyGlow=.5+.5*sin(uTime*(uState>2.5?6.:1.4));
      color+=vec3(.085,.13,.125)*energyGlow*uEnergy*.16;
      color=pow(clamp(color,0.,1.),vec3(.93));

      // Airy on polished stretches, opaque-white velvet on the frosted areas.
      float alpha=mix(.94,.76,smoothGlass)+fresnel*.08;
      gl_FragColor=vec4(clamp(color,0.,1.),clamp(alpha,.61,.99));
    }
  `;

  function compile(gl,type,source){
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
      const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);
      throw Error('3D Sayvi shader: '+error);
    }
    return shader;
  }

  // Small glTF 2.0 binary reader: only float3 position/normal + uint16 index.
  // All ribbons are baked into mesh coordinates. Blender stores Z-up in glTF
  // as Y-up, so restore the app's expected XY face plane during decoding.
  async function loadRibbons(){
    const response=await fetch('assets/seyveo-real-ribbons.glb?v=1');
    if(!response.ok)throw Error('3D ribbon model unavailable');
    const binary=await response.arrayBuffer();
    const dv=new DataView(binary);
    if(dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2)
      throw Error('Invalid 3D Sayvi model');
    let json=null,binOffset=-1,at=12;
    while(at<binary.byteLength){
      const length=dv.getUint32(at,true),type=dv.getUint32(at+4,true);
      at+=8;
      if(type===0x4e4f534a)
        json=JSON.parse(new TextDecoder().decode(new Uint8Array(binary,at,length)));
      if(type===0x004e4942)binOffset=at;
      at+=length;
    }
    if(!json||binOffset<0||json.meshes.length!==4)
      throw Error('Missing four physical ribbons');
    const read=(index)=>{
      const a=json.accessors[index],view=json.bufferViews[a.bufferView];
      const start=binOffset+(view.byteOffset||0)+(a.byteOffset||0);
      if(a.bufferView===undefined||view.byteStride)
        throw Error('Unsupported ribbon vertex stream');
      const bytes=a.type==='VEC3'?3:1;
      if(a.componentType===5126)return new Float32Array(binary,start,a.count*bytes);
      if(a.componentType===5123)return new Uint16Array(binary,start,a.count*bytes);
      throw Error('Unsupported ribbon index format');
    };
    return json.meshes.map((mesh,index)=>{
      const p=mesh.primitives[0];
      const coords=read(p.attributes.POSITION);
      const normals=read(p.attributes.NORMAL);
      const indices=read(p.indices);
      if(coords.length!==normals.length||coords.length/3>65535)
        throw Error('3D ribbon vertex count invalid');
      const vertex=new Float32Array(coords.length*2);
      for(let i=0;i<coords.length;i+=3){
        const j=i*2;
        vertex[j]=coords[i];vertex[j+1]=-coords[i+2];vertex[j+2]=coords[i+1];
        vertex[j+3]=normals[i];vertex[j+4]=-normals[i+2];vertex[j+5]=normals[i+1];
      }
      return {vertex,indexBuffer:new Uint16Array(indices),blade:index};
    });
  }

  function setup(gl,ribbons){
    const program=gl.createProgram();
    gl.attachShader(program,compile(gl,gl.VERTEX_SHADER,vertexSource));
    gl.attachShader(program,compile(gl,gl.FRAGMENT_SHADER,fragmentSource));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))
      throw Error('3D Sayvi program: '+gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const locPos=gl.getAttribLocation(program,'aPosition');
    const locNormal=gl.getAttribLocation(program,'aNormal');
    const meshes=ribbons.map(r=>{
      const positions=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,positions);
      gl.bufferData(gl.ARRAY_BUFFER,r.vertex,gl.STATIC_DRAW);
      const indices=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,r.indexBuffer,gl.STATIC_DRAW);
      return {positions,indices,count:r.indexBuffer.length,blade:r.blade};
    });
    const u={
      time:gl.getUniformLocation(program,'uTime'),
      energy:gl.getUniformLocation(program,'uEnergy'),
      state:gl.getUniformLocation(program,'uState'),
      blade:gl.getUniformLocation(program,'uBlade'),
      rotation:gl.getUniformLocation(program,'uRotation')
    };
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    return (time,energy,state,rotation)=>{
      gl.clearColor(0,0,0,0);gl.clearDepth(1.);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(u.time,time);gl.uniform1f(u.energy,energy);
      gl.uniform1f(u.state,state);gl.uniform3fv(u.rotation,rotation);
      for(const mesh of meshes){
        gl.bindBuffer(gl.ARRAY_BUFFER,mesh.positions);
        gl.enableVertexAttribArray(locPos);
        gl.vertexAttribPointer(locPos,3,gl.FLOAT,false,24,0);
        gl.enableVertexAttribArray(locNormal);
        gl.vertexAttribPointer(locNormal,3,gl.FLOAT,false,24,12);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.indices);
        gl.uniform1f(u.blade,mesh.blade);
        gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
      }
    };
  }

  (async()=>{
    let canvas;
    try{
      const ribbons=await loadRibbons();
      canvas=document.createElement('canvas');
      canvas.className='sv-sayvi-real3d-canvas';
      canvas.setAttribute('aria-hidden','true');
      const gl=canvas.getContext('webgl',{
        alpha:true,antialias:true,depth:true,stencil:false,
        premultipliedAlpha:false,powerPreference:'low-power'
      });
      if(!gl)throw Error('iPhone WebGL unsupported');
      const render=setup(gl,ribbons);
      const style=document.createElement('style');
      style.textContent=`
        #orb > .sv-sayvi-real3d-canvas {
          position:absolute;inset:0;width:100%;height:100%;
          pointer-events:none;opacity:0;z-index:1;
          transition:opacity 500ms ease-out;
        }
        html.sv-real3d-ready #orb > .sv-sayvi-real3d-canvas {opacity:1}
        #orb #plasmaVisual {transition:opacity 500ms ease-out}
        html.sv-real3d-ready #orb #plasmaVisual {opacity:0!important}
        html.sv-real3d-ready #orb::before,
        html.sv-real3d-ready #orb::after {opacity:0!important}
        @media(prefers-reduced-motion:reduce) {
          #orb > .sv-sayvi-real3d-canvas {transition:none!important}
        }
      `;
      document.head.appendChild(style);
      orb.appendChild(canvas);
      canvas.addEventListener('webglcontextlost',e=>{
        e.preventDefault();document.documentElement.classList.remove('sv-real3d-ready');
      },{once:true});
      const reduce=matchMedia('(prefers-reduced-motion: reduce)');
      const size=()=>{
        const bounds=orb.getBoundingClientRect();
        const dpr=Math.min(1.35,devicePixelRatio||1);
        const length=Math.max(64,Math.round(Math.max(bounds.width,bounds.height)*dpr));
        if(canvas.width!==length||canvas.height!==length){
          canvas.width=canvas.height=length;gl.viewport(0,0,length,length);
        }
      };
      const angle=(name)=>{
        const value=parseFloat(orb.style.getPropertyValue(name));
        return Number.isFinite(value)?value*Math.PI/180:0;
      };
      let last=0,energy=0;
      function tick(ms){
        requestAnimationFrame(tick);
        if(document.hidden||home.hidden||ms-last<35)return;
        last=ms;size();
        const time=reduce.matches?0:ms*.001;
        const listening=orb.matches('.seyveo-presence-listening,.pressing,.arming');
        const speaking=orb.matches('.seyveo-presence-speaking');
        const state=speaking?3:listening?1:0;
        energy+=((speaking?.9:listening?.45:0)-energy)*.075;
        const motion=document.documentElement.classList.contains('sv-motion-lab-active');
        const rx=motion?angle('--sv-motion-rx'):Math.sin(time*.33)*.094;
        const ry=motion?angle('--sv-motion-ry'):Math.sin(time*.29+.55)*.13;
        const rz=motion?angle('--sv-motion-rz'):Math.sin(time*.21)*.018;
        render(time,energy,state,new Float32Array([rx,ry,rz]));
      }
      size();render(0,0,0,new Float32Array([0,0,0]));
      if(gl.getError()!==gl.NO_ERROR)throw Error('3D model could not draw');
      document.documentElement.classList.add('sv-real3d-ready');
      requestAnimationFrame(tick);
    }catch(error){
      console.warn('SEYVEO real 3D ribbon preview:',error);
      canvas?.remove();document.documentElement.classList.remove('sv-real3d-ready');
    }
  })();
})();
