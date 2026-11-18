/* SEYVEO · real swept-ribbon mesh. Modes 1–5 remain comparison previews;
   ?sayvi-model=6 uses the ORIGINAL Sayvi pearl sphere's material math,
   adapted from a round 2D lens to normals/UVs of four physical ribbons.
   Four watertight 3D bands exported from Blender with physical depth,
   normal-based pearl/frost material and gentle motion. The public home
   keeps its established Sayvi picture unless this experiment is enabled. */
(() => {
  'use strict';
  const mode=new URLSearchParams(location.search).get('sayvi-model');
  if(mode!=='1'&&mode!=='2'&&mode!=='3'&&mode!=='4'&&mode!=='5'&&mode!=='6')return;
  const layeredGlass=mode!=='1';
  const velvetFlow=mode==='3'||mode==='4'||mode==='5'||mode==='6';
  const smokeBottle=mode==='4'||mode==='5';
  const darkVelvet=mode==='5';
  const originalMaterial=mode==='6';
  const orb=document.getElementById('orb');
  const hero=document.getElementById('plasmaVisual');
  const home=document.getElementById('homePage');
  if(!orb||!hero||!home)return;

  const vertexSource=`
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aFlowUv;
    uniform vec3 uRotation;
    uniform float uTime;
    uniform float uBlade;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vBlade;
    varying vec2 vFlowUv;
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
      vFlowUv=aFlowUv;
    }
  `;

  const fragmentSource=`
    precision highp float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vBlade;
    varying vec2 vFlowUv;
    uniform float uTime;
    uniform float uEnergy;
    uniform float uState;
    uniform float uLayeredGlass;
    uniform float uLayer;
    uniform float uVelvetFlow;
    uniform float uSmokeBottle;
    uniform float uDarkVelvet;
    uniform float uOriginalMaterial;

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
    float gaussian(vec2 p,vec2 c,float k){
      vec2 d=p-c;return exp(-dot(d,d)*k);
    }
    float fineFbm(vec2 p){
      float v=0.,a=.5;
      for(int i=0;i<3;i++){
        v+=a*noise(p);p=p*2.07+vec2(4.7,11.3);a*=.5;
      }
      return v;
    }
    void main(){
      vec3 n=normalize(vNormal);
      if(!gl_FrontFacing)n=-n;
      vec3 eye=normalize(vec3(-vPosition.xy*.18,1.));
      float facing=clamp(abs(dot(n,eye)),0.,1.);
      float fresnel=pow(1.-facing,2.25);
      vec2 q=vPosition.xy;
      if(uOriginalMaterial>.5){
        // This is the old seyveo-sayvi-dock-sphere.js White Velvet shader:
        // same pearl/glass/depth palette, twin advected fBM refraction,
        // moving cloud, Fresnel and two studio highlights. The necessary
        // adaptation is replacing the round sphere's artificial normal and
        // screen UV with real ribbon normals and intrinsic ribbon UV.
        vec2 oldQ=(vFlowUv-.5)*2.;
        float t=uTime;
        float speech=uState>2.5?abs(sin(t*5.1)*sin(t*2.5)):1.;
        float active=uEnergy*(.73+.27*speech);
        float z=facing;
        vec2 drift=vec2(sin(t*.24),cos(t*.22))*.21;
        vec2 refractPos=oldQ*(1.12+.25*(1.-z));
        float n1=fbm(refractPos*2.2+drift+vec2(t*.044,-t*.03));
        float n2=fbm(refractPos*3.-drift*.7+vec2(-t*.031,t*.039));
        float fluid=smoothstep(.27,.77,n1*.65+n2*.35);
        vec3 pearl=vec3(.95,.976,.993);
        vec3 glass=vec3(.75,.84,.90);
        vec3 depthColor=vec3(.43,.59,.71);
        float depth=pow(clamp(length(oldQ),0.,1.),1.8);
        float clearEdge=smoothstep(.43,.96,abs(vFlowUv.y-.5)*2.);
        float matteCore=1.-clearEdge;
        float filament=pow(max(0.,1.-abs(sin(oldQ.x*5.1+oldQ.y*3.2+
                        n2*1.1+t*.087))),11.);

        if(uLayer<.5){
          float fog=smoothstep(.31,.68,n1*.60+n2*.40);
          vec3 inside=mix(vec3(.29,.47,.56),vec3(.68,.82,.87),fog*.82);
          inside=mix(inside,vec3(.24,.43,.51),filament*.40);
          gl_FragColor=vec4(clamp(inside,0.,1.),.19+.29*fog*matteCore);
          return;
        }

        vec3 color=mix(pearl,glass,depth*.63);
        color=mix(color,depthColor,(1.-fluid)*(.19+active*.10));
        color+=vec3(.10,.12,.13)*fluid*.20;
        float cloud=gaussian(oldQ,vec2(sin(t*.31)*.09,cos(t*.27)*.09),10.);
        float beating=.75+.25*sin(t*(uState>2.5?8.:uState>.5?4.:1.6));
        color+=vec3(.11,.15,.17)*cloud*beating*(.7+active*.75);
        vec3 lightA=normalize(vec3(-.5,.63,1.));
        vec3 lightB=normalize(vec3(.68,-.30,1.));
        float specA=pow(max(dot(n,lightA),0.),55.);
        float specB=pow(max(dot(n,lightB),0.),105.);
        // The original sphere's bright studio spots are softened because
        // four truly curved strips catch them more frequently than a disc.
        color+=vec3(.53,.55,.57)*specA*.27;
        color+=vec3(.14,.26,.31)*specB*.27;
        color=mix(color,depthColor,fresnel*.12);
        color+=vec3(.16,.22,.24)*smoothstep(.84,1.,length(oldQ))*.055;
        color+=vec3(.31,.33,.35)*gaussian(oldQ,vec2(-.34,.57),35.)*.27;
        color+=vec3(.09,.15,.18)*gaussian(oldQ,vec2(.49,-.58),80.)*.27;
        // The moving dark strand is UNDER the pearl frost, not a glow.
        color=mix(color,depthColor,filament*matteCore*.12);
        color=mix(color,pearl,matteCore*.12);
        float alpha=mix(.80,.355,clearEdge)+fresnel*.075;
        gl_FragColor=vec4(clamp(color,0.,1.),clamp(alpha,.22,.94));
        return;
      }
      if(uLayeredGlass>.5&&uLayer<.5){
        // Efficient first pass: translucent inner/back surfaces only.
        vec3 inner=mix(vec3(.43,.66,.69),vec3(.73,.90,.91),facing*.46);
        if(uDarkVelvet>.5){
          // Approved White Velvet's lesson: darkness and internal contrast,
          // not another layer of opaque white haze. Fluid blue-smoke lives
          // on the back of each separate physical ribbon.
          vec2 uv=vFlowUv;
          float middle=1.-smoothstep(.36,.91,abs(uv.y-.5)*2.);
          vec2 smokeUv=vec2(uv.x*3.12-uTime*.050,
                             uv.y*2.25+.10*sin(uTime*.12))+vBlade*.34;
          float fieldA=fineFbm(smokeUv);
          float fieldB=fineFbm(smokeUv*1.68+vec2(.71,-uTime*.021));
          float density=smoothstep(.29,.65,fieldA*.65+fieldB*.35);
          inner=mix(vec3(.18,.36,.41),vec3(.49,.69,.71),density*.70);
          float shadowThread=pow(max(0.,1.-abs(sin(uv.x*11.3+
            uv.y*4.1+fieldA*1.7-uTime*.21))),7.);
          inner=mix(inner,vec3(.13,.32,.36),shadowThread*.25*middle);
          gl_FragColor=vec4(clamp(inner,0.,1.),.18+.37*density*middle);
          return;
        }
        if(uSmokeBottle>.5){
          // A soft three-dimensional-looking vapour lives on the INNER shell.
          // It billows along the ribbon while fading toward its clear edges.
          vec2 uv=vFlowUv;
          float core=1.-smoothstep(.45,.93,abs(uv.y-.5)*2.);
          vec2 driftSmoke=vec2(uv.x*3.35-uTime*.050,
                               uv.y*2.35+.12*sin(uTime*.13));
          float smokeA=fineFbm(driftSmoke+vBlade*.37);
          float smokeB=fineFbm(driftSmoke*1.61+vec2(.7,-uTime*.020));
          float density=smoothstep(.28,.67,smokeA*.66+smokeB*.34);
          inner=mix(vec3(.45,.68,.71),vec3(.77,.95,.94),density*.78);
          inner+=vec3(.055,.12,.12)*density*core;
          gl_FragColor=vec4(clamp(inner,0.,1.),.11+.25*density*core);
          return;
        }
        if(uVelvetFlow>.5){
          // Living liquid silk moves on the reverse surface in intrinsic
          // ribbon coordinates, so it visibly parallax-shifts under glass.
          vec2 strand=vFlowUv;
          float mist=fineFbm(vec2(strand.x*3.7-uTime*.075,
                                   strand.y*2.4+uTime*.026)+vBlade*.37);
          float strandGlow=pow(max(0.,1.-abs(sin(strand.x*17.+strand.y*3.2+
                                  mist*2.1-uTime*.54))),8.);
          inner=mix(inner,vec3(.67,.94,.95),mist*.38);
          inner+=vec3(.13,.20,.19)*strandGlow*.65;
          gl_FragColor=vec4(clamp(inner,0.,1.),.15+.10*mist);
          return;
        }
        gl_FragColor=vec4(inner,.115+.095*fresnel);
        return;
      }
      float speech=uState>2.5?abs(sin(uTime*5.1)*sin(uTime*2.5)):1.;
      float active=uEnergy*(.73+.27*speech);
      // Original Sayvi pearl-sphere's two independently advected refraction
      // fields. Apply them to 3D ribbons instead of the former round disc.
      vec2 drift=vec2(sin(uTime*.24),cos(uTime*.22))*.21;
      vec2 refractPos=q*(1.12+.25*(1.-facing));
      float n1=fbm(refractPos*2.2+drift+vec2(uTime*.044,-uTime*.03));
      float n2=fbm(refractPos*3.-drift*.7+vec2(-uTime*.031,uTime*.039));
      float fluid=smoothstep(.27,.77,n1*.65+n2*.35);
      float fold=fbm(q*2.8+drift+vec2(vBlade*.71,-vBlade*.46));
      float smoothGlass=smoothstep(.39,.75,
        .33+.40*fold+.23*sin(q.x*5.9+q.y*3.6+uTime*.11+vBlade));
      // The familiar White Velvet / pearl / ice-blue depth from old Sayvi,
      // gently warmed with SEYVEO's new aqua rather than a silver metal tint.
      vec3 pearl=vec3(.89,.975,.983);
      vec3 glass=vec3(.72,.87,.90);
      vec3 deepGlass=vec3(.44,.64,.70);
      float depth=pow(clamp(length(q),0.,1.),1.8);
      vec3 color=mix(pearl,glass,depth*.43);
      color=mix(color,deepGlass,(1.-fluid)*(.13+active*.075));
      color+=vec3(.065,.10,.12)*fluid*.20;

      // Sayvi's older breathing pearl cloud, now seen through the glass
      // volumes of separate overlapping ribbons.
      float cloud=gaussian(q,vec2(sin(uTime*.31)*.09,cos(uTime*.27)*.09),10.);
      float beating=.75+.25*sin(uTime*(uState>2.5?8.:uState>.5?4.:1.6));
      color+=vec3(.075,.11,.12)*cloud*beating*(.56+active*.60);
      color=mix(color,vec3(.56,.79,.81),n2*(.055+.075*smoothGlass));
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
      color+=vec3(.10,.14,.15)*gaussian(q,vec2(-.34,.57),35.)*.34;
      color+=vec3(.045,.065,.08)*gaussian(q,vec2(.49,-.58),80.)*.28;
      // A broad, faint reflection glides across polished glass without
      // disturbing the approved pearl base colour.
      float travel=dot(q,vec2(.94,.34))-.20*sin(uTime*.24+vBlade*.21);
      float caustic=exp(-32.*travel*travel);
      color+=vec3(.065,.11,.105)*caustic*smoothGlass*.24;
      color+=vec3(.030,.056,.063)*(.65+.35*sin(uTime*1.1+fold*2.));
      float energyGlow=.5+.5*sin(uTime*(uState>2.5?6.:1.4));
      color+=vec3(.085,.13,.125)*energyGlow*uEnergy*.16;
      color=pow(clamp(color,0.,1.),vec3(.93));

      // Airy on polished stretches, opaque-white velvet on the frosted areas.
      float alpha=mix(.94,.76,smoothGlass)+fresnel*.08;
      if(uLayeredGlass>.5){
        // An environment reflection moves across TRUE curved 3D normals.
        // This adds a clear-glass reflection that diffuse pearl alone lacks.
        vec3 reflected=reflect(-eye,n);
        float panelA=exp(-29.*pow(reflected.x+.34-.17*sin(uTime*.16),2.));
        float panelB=exp(-46.*pow(reflected.y-.25+.12*cos(uTime*.13),2.));
        float panel=panelA*(.56+.44*max(reflected.y,0.))+panelB*.31;
        color+=vec3(.11,.20,.205)*panel*(.26+.74*smoothGlass);

        // Frost remains pearl-white; polished windows reveal ice-blue volume.
        color=mix(color,vec3(.56,.82,.84),smoothGlass*(1.-fluid)*.19);
        color+=vec3(.075,.14,.145)*fresnel*.35;
        // Second pass: front velvet and smooth transparent glass.
        alpha=mix(.955,.655,smoothGlass)+fresnel*.085;
      }
      if(uVelvetFlow>.5&&uSmokeBottle<.5){
        // Frosted velvet on the exterior. The soft aqua silk and filaments
        // travel underneath it, especially visible through polished patches.
        vec2 strand=vFlowUv;
        float mist=fineFbm(vec2(strand.x*3.35-uTime*.080,
                                 strand.y*2.75+uTime*.032)+vBlade*.31);
        float filament=pow(max(0.,1.-abs(sin(strand.x*16.+strand.y*3.6+
                          mist*2.2-uTime*.48))),9.);
        color=mix(color,vec3(.47,.77,.79),mist*(.065+.14*smoothGlass));
        color+=vec3(.095,.16,.16)*filament*(.24+.62*smoothGlass);
        color+=vec3(.025,.045,.045)*(.5+.5*sin(uTime*.69+strand.x*4.))
          *(.30+.70*smoothGlass);
        alpha=mix(.96,.61,smoothGlass)+fresnel*.075;
      }
      if(uSmokeBottle>.5&&uDarkVelvet<.5){
        // The bottle analogy: matte milk at the band's centre, transparent
        // polished glass on its edges, with smoke visibly moving beneath.
        vec2 uv=vFlowUv;
        float across=abs(uv.y-.5)*2.;
        float clearEdge=smoothstep(.42,.94,across);
        float frostedCore=1.-clearEdge;
        vec2 smokeUv=vec2(uv.x*3.2-uTime*.052,
                           uv.y*2.6+.12*sin(uTime*.12))+vBlade*.29;
        float mist=fineFbm(smokeUv);
        float fog=smoothstep(.25,.70,mist);
        float wisps=sin(uv.x*11.+uv.y*4.5+mist*2.7-uTime*.24);
        float billow=.5+.5*wisps;

        color=mix(color,vec3(.88,.975,.973),frostedCore*.36);
        color=mix(color,vec3(.49,.73,.76),fog*frostedCore*.17);
        color+=vec3(.062,.12,.13)*billow*fog*frostedCore*.14;
        // Clean light-catching glass lips are distinct from the cloudy core.
        color=mix(color,vec3(.67,.90,.91),clearEdge*.22);
        color+=vec3(.09,.16,.17)*pow(clearEdge,3.)*.32;
        color+=vec3(.09,.16,.17)*fresnel*.32;
        alpha=mix(.90,.57,clearEdge)+fresnel*.085;
      }
      if(uDarkVelvet>.5){
        // A thin velvet frost sits ABOVE darker mobile smoke. The middle
        // scatters soft light; the clear edges stay optically lightweight.
        vec2 uv=vFlowUv;
        float across=abs(uv.y-.5)*2.;
        float clearEdge=smoothstep(.43,.96,across);
        float middle=1.-clearEdge;
        vec2 smokeUv=vec2(uv.x*3.10-uTime*.052,
                           uv.y*2.52+.12*sin(uTime*.115))+vBlade*.34;
        float mist=fineFbm(smokeUv);
        float fog=smoothstep(.30,.66,mist);
        float shade=smoothstep(.38,.75,fog+.12*sin(uv.x*8.1-
                      uTime*.22+mist*2.));
        // The old sphere used blue-gray contrast INSTEAD of white fog.
        color=mix(color,vec3(.80,.92,.93),middle*.45+.21);
        color=mix(color,vec3(.25,.48,.53),shade*middle*.40);
        color=mix(color,vec3(.55,.80,.82),clearEdge*.16);
        color+=vec3(.07,.13,.13)*pow(clearEdge,3.)*.27;
        color+=vec3(.065,.12,.12)*fresnel*.22;
        color*=vec3(.91,.94,.955);
        // Matte centre is translucent; polished lips reveal the back layer.
        alpha=mix(.73,.385,clearEdge)+fresnel*.075;
      }
      float alphaMin=uDarkVelvet>.5 ? .27 : .61;
      gl_FragColor=vec4(clamp(color,0.,1.),clamp(alpha,alphaMin,.99));
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
  async function loadRibbons(useFlowModel){
    const source=useFlowModel?'assets/seyveo-real-ribbons-uv.glb?v=1':
      'assets/seyveo-real-ribbons.glb?v=1';
    const response=await fetch(source);
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
      const bytes=a.type==='VEC3'?3:a.type==='VEC2'?2:1;
      if(a.componentType===5126)return new Float32Array(binary,start,a.count*bytes);
      if(a.componentType===5123)return new Uint16Array(binary,start,a.count*bytes);
      throw Error('Unsupported ribbon index format');
    };
    return json.meshes.map((mesh,index)=>{
      const p=mesh.primitives[0];
      const coords=read(p.attributes.POSITION);
      const normals=read(p.attributes.NORMAL);
      const flows=p.attributes.TEXCOORD_0===undefined?null:read(p.attributes.TEXCOORD_0);
      const indices=read(p.indices);
      if(coords.length!==normals.length||coords.length/3>65535||
         (useFlowModel&&(!flows||flows.length!==coords.length/3*2)))
        throw Error('3D ribbon vertex count invalid');
      const vertex=new Float32Array(coords.length/3*8);
      for(let i=0;i<coords.length;i+=3){
        const j=i/3*8;
        vertex[j]=coords[i];vertex[j+1]=-coords[i+2];vertex[j+2]=coords[i+1];
        vertex[j+3]=normals[i];vertex[j+4]=-normals[i+2];vertex[j+5]=normals[i+1];
        vertex[j+6]=flows?flows[i/3*2]:0;
        vertex[j+7]=flows?flows[i/3*2+1]:0;
      }
      return {vertex,indexBuffer:new Uint16Array(indices),blade:index};
    });
  }

  function setup(gl,ribbons,layeredGlass,velvetFlow,smokeBottle,darkVelvet,originalMaterial){
    const program=gl.createProgram();
    gl.attachShader(program,compile(gl,gl.VERTEX_SHADER,vertexSource));
    gl.attachShader(program,compile(gl,gl.FRAGMENT_SHADER,fragmentSource));
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))
      throw Error('3D Sayvi program: '+gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const locPos=gl.getAttribLocation(program,'aPosition');
    const locNormal=gl.getAttribLocation(program,'aNormal');
    const locFlowUv=gl.getAttribLocation(program,'aFlowUv');
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
      rotation:gl.getUniformLocation(program,'uRotation'),
      layered:gl.getUniformLocation(program,'uLayeredGlass'),
      layer:gl.getUniformLocation(program,'uLayer'),
      velvet:gl.getUniformLocation(program,'uVelvetFlow'),
      smoke:gl.getUniformLocation(program,'uSmokeBottle'),
      darkVelvet:gl.getUniformLocation(program,'uDarkVelvet'),
      original:gl.getUniformLocation(program,'uOriginalMaterial')
    };
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    const drawMeshes=()=>{
      for(const mesh of meshes){
        gl.bindBuffer(gl.ARRAY_BUFFER,mesh.positions);
        gl.enableVertexAttribArray(locPos);
        gl.vertexAttribPointer(locPos,3,gl.FLOAT,false,32,0);
        gl.enableVertexAttribArray(locNormal);
        gl.vertexAttribPointer(locNormal,3,gl.FLOAT,false,32,12);
        gl.enableVertexAttribArray(locFlowUv);
        gl.vertexAttribPointer(locFlowUv,2,gl.FLOAT,false,32,24);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.indices);
        gl.uniform1f(u.blade,mesh.blade);
        gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
      }
    };
    return (time,energy,state,rotation)=>{
      gl.clearColor(0,0,0,0);gl.clearDepth(1.);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(u.time,time);gl.uniform1f(u.energy,energy);
      gl.uniform1f(u.state,state);gl.uniform3fv(u.rotation,rotation);
      gl.uniform1f(u.layered,layeredGlass?1:0);
      gl.uniform1f(u.velvet,velvetFlow?1:0);
      gl.uniform1f(u.smoke,smokeBottle?1:0);
      gl.uniform1f(u.darkVelvet,darkVelvet?1:0);
      gl.uniform1f(u.original,originalMaterial?1:0);
      if(layeredGlass){
        // Back surfaces scatter a little light through the foreground.
        // Front surfaces then occlude according to real 3D depth.
        gl.enable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.cullFace(gl.FRONT);
        gl.uniform1f(u.layer,0);
        drawMeshes();
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.cullFace(gl.BACK);
        gl.uniform1f(u.layer,1);
        drawMeshes();
        gl.disable(gl.CULL_FACE);
      }else{
        gl.uniform1f(u.layer,1);
        drawMeshes();
      }
    };
  }

  (async()=>{
    let canvas;
    try{
      const ribbons=await loadRibbons(velvetFlow);
      canvas=document.createElement('canvas');
      canvas.className='sv-sayvi-real3d-canvas';
      canvas.setAttribute('aria-hidden','true');
      const gl=canvas.getContext('webgl',{
        alpha:true,antialias:true,depth:true,stencil:false,
        premultipliedAlpha:false,powerPreference:'low-power'
      });
      if(!gl)throw Error('iPhone WebGL unsupported');
      const render=setup(gl,ribbons,layeredGlass,velvetFlow,smokeBottle,darkVelvet,originalMaterial);
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
        // Higher internal resolution keeps the glass rim smooth on Retina;
        // capped for the iPhone XR's mobile GPU.
        const dpr=Math.min(velvetFlow?1.40:1.50,devicePixelRatio||1);
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
