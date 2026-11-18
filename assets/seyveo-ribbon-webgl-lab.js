/* SEYVEO · Sayvi frosted pearl material on a dimensional relief mesh.
   Opt-in experiment: ?sayvi-material=1
   Builds a curved 3D front and translucent back shell from the EXACT
   approved four-ribbon silhouette, not an unrelated flat vector outline.
   On shader/geometry failure the established living PNG remains intact. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('sayvi-material') !== '1') return;
  const orb = document.getElementById('orb');
  const hero = document.getElementById('plasmaVisual');
  const home = document.getElementById('homePage');
  if (!orb || !hero || !home) return;

  const vertexShader = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aUv;
    attribute float aBlade;
    attribute float aSide;
    uniform vec3 uRotation;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying float vBlade;
    varying float vSide;
    void main() {
      vec3 p = aPosition;
      vec3 n = aNormal;
      float cx = cos(uRotation.x), sx = sin(uRotation.x);
      float cy = cos(uRotation.y), sy = sin(uRotation.y);
      float cz = cos(uRotation.z), sz = sin(uRotation.z);
      mat3 rx = mat3(1.,0.,0., 0.,cx,sx, 0.,-sx,cx);
      mat3 ry = mat3(cy,0.,-sy, 0.,1.,0., sy,0.,cy);
      mat3 rz = mat3(cz,sz,0., -sz,cz,0., 0.,0.,1.);
      mat3 r = rz * ry * rx;
      p = r*p;
      n = normalize(r*n);
      // A real depth-dependent parallax projection, not a rotated flat picture.
      float perspective = 2.7 / (2.7 - p.z*.60);
      gl_Position = vec4(p.xy * perspective, -.25*p.z, 1.);
      vNormal = n;
      vPosition = p;
      vUv = aUv;
      vBlade = aBlade;
      vSide = aSide;
    }
  `;

  // The original Sayvi shader's hash, fBM, pearl/glass/depth palette,
  // fluid, Fresnel and two studio lights, now evaluated on 3D ribbon normals.
  const fragmentShader = `
    precision highp float;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    varying float vBlade;
    varying float vSide;
    uniform float uTime;
    uniform float uEnergy;
    uniform float uState;
    uniform sampler2D uShape;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p) {
      vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
        mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
    }
    float fbm(vec2 p) {
      float v=0.,a=.5;
      for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(12.1,4.3);a*=.5;}
      return v;
    }
    float gaussian(vec2 p,vec2 c,float k){
      vec2 d=p-c;return exp(-dot(d,d)*k);
    }
    void main() {
      // This is a geometry/matcap guide, not an image pasted onto a plane.
      // The alpha is the actual approved SEYVEO silhouette and the RGB only
      // gives the material the original pearl/aqua distribution.
      vec4 reference=texture2D(uShape,vUv);
      // The generated alpha has occasional almost-transparent stray pixels;
      // clipping those avoids the hairline fringe on iPhone screens.
      if(reference.a<.095)discard;
      vec2 q=vUv*2.-1.;
      vec3 n=normalize(vNormal);
      vec3 viewDir=normalize(vec3(-vPosition.xy*.12,1.));
      float facing=clamp(dot(n,viewDir),0.,1.);
      float fresnel=pow(1.-facing,2.25);
      vec2 drift=vec2(sin(uTime*.24),cos(uTime*.22))*.21;
      vec2 refractPos=q*(1.12+.25*(1.-facing));
      float n1=fbm(refractPos*2.2+drift+vec2(uTime*.044,-uTime*.03));
      float n2=fbm(refractPos*3.-drift*.7+vec2(-uTime*.031,uTime*.039));
      float fluid=smoothstep(.27,.77,n1*.65+n2*.35);

      // The HOME Sayvi's White Velvet material: mostly milky frost, with
      // narrow smooth-glass patches and pearl/teal silk deep inside.
      float glassFlow=fbm(q*2.2+vec2(vBlade*1.7,uTime*.035));
      float smoothGlass=.10+.77*smoothstep(.51,.76,
        .48+.18*sin(q.x*6.0+q.y*3.7+vBlade*1.6)+.28*glassFlow);
      smoothGlass=mix(smoothGlass,.86,clamp(vSide,0.,1.));
      float matte=1.-smoothGlass;
      vec3 pearl=vec3(.95,.985,.981);
      vec3 glass=vec3(.76,.89,.89);
      vec3 depthColor=vec3(.39,.61,.62);
      float depth=pow(clamp(length(q),0.,1.),1.8);
      vec3 color=mix(pearl,glass,depth*.36);
      color=mix(color,depthColor,(1.-fluid)*(.10+uEnergy*.06));
      color+=vec3(.05,.09,.085)*fluid*.20;

      float cloud=gaussian(q,vec2(sin(uTime*.31)*.09,cos(uTime*.27)*.09),10.);
      float beating=.75+.25*sin(uTime*(uState>2.5?8.:uState>.5?4.:1.6));
      color+=vec3(.10,.15,.14)*cloud*beating*(.55+uEnergy*.65);

      // The old animated filament and silk: a soft translucent thread,
      // continuously refracted INSIDE the real ribbon surface.
      float silk=fbm(q*3.7+drift*.6+vec2(uTime*.03,-uTime*.02));
      color=mix(color,vec3(.48,.68,.67),silk*(.07+.07*smoothGlass));
      float filament=pow(max(0.,1.-abs(sin(q.x*5.2+q.y*3.1+
        vBlade*.95+silk*.8+uTime*.085))),12.);
      color=mix(color,vec3(.38,.57,.57),filament*.12);

      // The reference's own glass gradients contain the curvature and
      // interweaving that a procedural flat tint could not reproduce.
      // The highlight remains responsive to the REAL mesh normals below.
      color=mix(color,reference.rgb,.76);

      // Broad frontal studio lights produce a white pearl highlight rather
      // than the dark metallic roll-off seen in the first mesh draft.
      // Studio reflections travel independently of the slow body turn.
      vec3 lightA=normalize(vec3(-.19+.17*sin(uTime*.19),.25+.12*cos(uTime*.16),1.));
      vec3 lightB=normalize(vec3(.33+.14*sin(uTime*.13),-.19+.09*sin(uTime*.21),1.));
      float dotA=max(dot(n,lightA),0.);
      float dotB=max(dot(n,lightB),0.);
      float specMatte=pow(dotA,12.)*.22;
      float specGlass=pow(dotA,78.)*.74+pow(dotB,90.)*.25;
      color+=vec3(.23,.28,.27)*mix(specMatte,specGlass,smoothGlass);
      color+=vec3(.05,.16,.15)*pow(dotB,32.)*(.3+.50*smoothGlass);
      color=mix(color,depthColor,fresnel*(.17+.14*smoothGlass));
      color+=vec3(.12,.15,.14)*gaussian(q,vec2(-.34,.57),35.)*.40;
      color+=vec3(.06,.10,.09)*gaussian(q,vec2(.49,-.58),80.)*.36;
      color=mix(color,vec3(.47,.66,.66),clamp(vSide,0.,1.)*.23);
      // A delicate opal seam is brighter than the milky face of each ribbon.
      float softEdge=smoothstep(.10,.36,reference.a)-smoothstep(.58,.88,reference.a);
      color+=vec3(.14,.24,.23)*softEdge*.28;
      color=pow(clamp(color,0.,1.),vec3(.98));

      // Frosted ribbons carry and scatter light; only polished sections are
      // notably translucent. Edgewalls have a visible, glassy teal rim.
      float alpha=mix(.94,.59,smoothGlass);
      alpha+=fresnel*.08;
      color=mix(color,vec3(.27,.48,.48),clamp(vSide,0.,1.)*.26);
      alpha=mix(alpha,.21,clamp(vSide,0.,1.));
      alpha*=smoothstep(.095,.78,reference.a);
      gl_FragColor=vec4(clamp(color,0.,1.),clamp(alpha,0.,.99));
    }
  `;

  function compile(gl,type,source) {
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) {
      const error=gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw Error('SEYVEO glass shader: '+error);
    }
    return shader;
  }
  async function buildGeometry(image) {
    if(!image.complete || !image.naturalWidth)await image.decode();
    const samples=97;
    const divisions=samples-1;
    const copy=document.createElement('canvas');
    copy.width=copy.height=samples;
    const context=copy.getContext('2d',{willReadFrequently:true});
    if(!context)throw Error('Cannot reconstruct glass surface');
    context.clearRect(0,0,samples,samples);
    context.drawImage(image,0,0,samples,samples);
    const pixels=context.getImageData(0,0,samples,samples).data;
    const z=new Float32Array(samples*samples);
    const luminance=new Float32Array(samples*samples);
    const alpha=new Float32Array(samples*samples);
    const at=(x,y)=>Math.min(samples-1,Math.max(0,y))*samples+
      Math.min(samples-1,Math.max(0,x));
    for(let y=0;y<samples;y++)for(let x=0;x<samples;x++){
      const i=y*samples+x,p=i*4;
      const a=pixels[p+3]/255;
      const l=(pixels[p]*.213+pixels[p+1]*.715+pixels[p+2]*.072)/255;
      const nx=x/divisions*2-1,ny=1-y/divisions*2;
      const radius=Math.hypot(nx,ny);
      const theta=Math.atan2(ny,nx);
      // Continuous curved shell, rippling around four overlapping ribbons.
      // Interior teal cavities sink deeper, opal highlights swell toward us.
      const dome=.125*(1.-Math.min(1,radius*radius));
      const braid=.045*Math.sin(theta*4.+radius*5.8+.3);
      z[i]=a*(.075+dome+braid+.22*(l-.68));
      luminance[i]=l;
      alpha[i]=a;
    }
    // Blur the inferred height, not the texture. This gets rid of noisy
    // polygon normals while keeping the original ribbon silhouette crisp.
    for(let pass=0;pass<2;pass++){
      const softened=new Float32Array(z.length);
      for(let y=0;y<samples;y++)for(let x=0;x<samples;x++){
        const i=y*samples+x;
        softened[i]=(z[i]*4+z[at(x-1,y)]+z[at(x+1,y)]+
          z[at(x,y-1)]+z[at(x,y+1)])/8;
      }
      z.set(softened);
    }
    const vertices=[];
    const makeShell=(back)=>{
      for(let y=0;y<samples;y++)for(let x=0;x<samples;x++){
        const i=y*samples+x;
        const xx=x/divisions*2-1,yy=1-y/divisions*2;
        const left=z[at(x-1,y)],right=z[at(x+1,y)];
        const up=z[at(x,y-1)],down=z[at(x,y+1)];
        const dzdx=(right-left)*divisions*.25;
        const dzdy=(up-down)*divisions*.25;
        let nx=-dzdx,ny=-dzdy,nz=1;
        const norm=Math.hypot(nx,ny,nz);
        nx/=norm;ny/=norm;nz/=norm;
        const w=alpha[i];
        vertices.push(xx,yy,z[i]+(back?-.062*(.25+w):0),
          back?-nx:nx,back?-ny:ny,back?-nz:nz,
          x/divisions,1-y/divisions,luminance[i],back?1:0);
      }
    };
    makeShell(true);
    makeShell(false);
    const indices=[];
    const shellVertices=samples*samples;
    for(let shell=0;shell<2;shell++){
      const offset=shell*shellVertices;
      for(let y=0;y<divisions;y++)for(let x=0;x<divisions;x++){
        const a=offset+y*samples+x,b=a+1,c=a+samples,d=c+1;
        if(shell===0)indices.push(a,c,b,b,c,d);
        else indices.push(a,b,c,b,d,c);
      }
    }
    // 2 curved shells of 97² vertices fit WebGL1 unsigned-short indices.
    if(vertices.length/10>65535)throw Error('3D mesh too dense for iPhone');
    return {vertices:new Float32Array(vertices),indices:new Uint16Array(indices)};
  }

  function setup(gl,geometry,image) {
    const vs=compile(gl,gl.VERTEX_SHADER,vertexShader);
    const fs=compile(gl,gl.FRAGMENT_SHADER,fragmentShader);
    const program=gl.createProgram();
    gl.attachShader(program,vs);gl.attachShader(program,fs);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))
      throw Error('SEYVEO material link: '+gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,geometry.vertices,gl.STATIC_DRAW);
    const elements=gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,elements);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,geometry.indices,gl.STATIC_DRAW);
    const stride=10*4;
    const attrs=[['aPosition',3,0],['aNormal',3,3],['aUv',2,6],['aBlade',1,8],['aSide',1,9]];
    for(const [name,size,offset] of attrs) {
      const location=gl.getAttribLocation(program,name);
      if(location<0)continue;
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location,size,gl.FLOAT,false,stride,offset*4);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    const texture=gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program,'uShape'),0);
    const uniforms={
      time:gl.getUniformLocation(program,'uTime'),
      energy:gl.getUniformLocation(program,'uEnergy'),
      state:gl.getUniformLocation(program,'uState'),
      rotation:gl.getUniformLocation(program,'uRotation')
    };
    return (time,energy,state,rotation) => {
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.time,time);
      gl.uniform1f(uniforms.energy,energy);
      gl.uniform1f(uniforms.state,state);
      gl.uniform3fv(uniforms.rotation,rotation);
      gl.drawElements(gl.TRIANGLES,geometry.indices.length,gl.UNSIGNED_SHORT,0);
    };
  }

  (async () => {
    let canvas;
    try {
      const geometry=await buildGeometry(hero);
      canvas=document.createElement('canvas');
      canvas.className='sv-sayvi-webgl-ribbons';
      canvas.setAttribute('aria-hidden','true');
      const gl=canvas.getContext('webgl',{
        alpha:true,antialias:true,depth:false,stencil:false,
        premultipliedAlpha:false,powerPreference:'low-power'
      });
      if(!gl)throw Error('WebGL unsupported');
      const render=setup(gl,geometry,hero);
      const style=document.createElement('style');
      style.textContent=`
        #orb > .sv-sayvi-webgl-ribbons {
          position:absolute;inset:0;width:100%;height:100%;
          pointer-events:none;opacity:0;z-index:1;
          transition:opacity 450ms ease-out;
        }
        html.sv-3d-glass-ready #orb > .sv-sayvi-webgl-ribbons {opacity:1}
        #orb #plasmaVisual {transition:opacity 450ms ease-out}
        html.sv-3d-glass-ready #orb #plasmaVisual {opacity:0!important}
        html.sv-3d-glass-ready #orb::before,
        html.sv-3d-glass-ready #orb::after {opacity:0!important}
        @media(prefers-reduced-motion:reduce) {
          #orb > .sv-sayvi-webgl-ribbons {transition:none!important}
        }
      `;
      document.head.appendChild(style);
      orb.appendChild(canvas);
      canvas.addEventListener('webglcontextlost',event=>{
        event.preventDefault();
        document.documentElement.classList.remove('sv-3d-glass-ready');
      },{once:true});

      let last=0,energy=0,ready=false;
      const reduce=matchMedia('(prefers-reduced-motion: reduce)');
      const sizeCanvas=() => {
        const rect=orb.getBoundingClientRect();
        const dpr=Math.min(1.4,devicePixelRatio||1);
        const size=Math.max(64,Math.round(Math.max(rect.width,rect.height)*dpr));
        if(canvas.width!==size||canvas.height!==size) {
          canvas.width=canvas.height=size;gl.viewport(0,0,size,size);
        }
      };
      const readAngle=(name) => {
        const v=parseFloat(orb.style.getPropertyValue(name));
        return Number.isFinite(v)?v*Math.PI/180:0;
      };
      function tick(ms) {
        requestAnimationFrame(tick);
        if(document.hidden||home.hidden||ms-last<31)return;
        last=ms;
        sizeCanvas();
        const time=reduce.matches?0:ms*.001;
        const listening=orb.matches('.seyveo-presence-listening,.pressing,.arming');
        const speaking=orb.matches('.seyveo-presence-speaking');
        const state=speaking?3:listening?1:0;
        const target=speaking ? .91 : listening ? .46 : 0;
        energy+=(target-energy)*.075;
        const motion=document.documentElement.classList.contains('sv-motion-lab-active');
        const rx=motion?readAngle('--sv-motion-rx'):Math.sin(time*.41)*.049;
        const ry=motion?readAngle('--sv-motion-ry'):Math.sin(time*.35+.5)*.064;
        const rz=motion?readAngle('--sv-motion-rz'):Math.sin(time*.31)*.014;
        render(time,energy,state,new Float32Array([rx,ry,rz]));
        if(!ready){ready=true;document.documentElement.classList.add('sv-3d-glass-ready');}
      }
      sizeCanvas();
      render(0,0,0,new Float32Array([0,0,0]));
      if(gl.getError()!==gl.NO_ERROR)throw Error('3D material could not render');
      document.documentElement.classList.add('sv-3d-glass-ready');
      ready=true;
      requestAnimationFrame(tick);
    } catch(error) {
      console.warn('SEYVEO ribbon material preview:',error);
      canvas?.remove();
      document.documentElement.classList.remove('sv-3d-glass-ready');
    }
  })();
})();
