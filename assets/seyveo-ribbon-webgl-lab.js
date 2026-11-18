/* SEYVEO · original Sayvi pearl shader on real extruded ribbon geometry.
   Opt-in experiment: ?sayvi-material=1
   Reuses the approved four ribbon paths. WebGL1, no third-party dependencies.
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
      float smoothGlass=.12+.70*smoothstep(.64,.89,
        .45+.16*sin(q.x*6.0+q.y*3.7+vBlade*1.6)+.28*glassFlow);
      smoothGlass=mix(smoothGlass,.85,clamp(vSide,0.,1.));
      float matte=1.-smoothGlass;
      vec3 pearl=vec3(.98,.995,.993);
      vec3 glass=vec3(.79,.88,.88);
      vec3 depthColor=vec3(.45,.63,.64);
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

      // Broad frontal studio lights produce a white pearl highlight rather
      // than the dark metallic roll-off seen in the first mesh draft.
      vec3 lightA=normalize(vec3(-.19,.25,1.));
      vec3 lightB=normalize(vec3(.33,-.19,1.));
      float dotA=max(dot(n,lightA),0.);
      float dotB=max(dot(n,lightB),0.);
      float specMatte=pow(dotA,18.)*.26;
      float specGlass=pow(dotA,86.)*.75+pow(dotB,90.)*.23;
      color+=vec3(.23,.28,.27)*mix(specMatte,specGlass,smoothGlass);
      color+=vec3(.06,.16,.15)*pow(dotB,35.)*(.3+.50*smoothGlass);
      color=mix(color,depthColor,fresnel*(.17+.14*smoothGlass));
      color+=vec3(.12,.15,.14)*gaussian(q,vec2(-.34,.57),35.)*.40;
      color+=vec3(.06,.10,.09)*gaussian(q,vec2(.49,-.58),80.)*.36;
      color=mix(color,vec3(.47,.66,.66),clamp(vSide,0.,1.)*.23);
      color=pow(clamp(color,0.,1.),vec3(.89));

      // Frosted ribbons carry and scatter light; only polished sections are
      // notably translucent. Edgewalls have a visible, glassy teal rim.
      float alpha=mix(.965,.75,smoothGlass);
      alpha+=fresnel*.08;
      alpha=mix(alpha,.92,clamp(vSide,0.,1.));
      gl_FragColor=vec4(clamp(color,0.,1.),clamp(alpha,.68,.99));
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
  function buildGeometry(svgText) {
    const doc=new DOMParser().parseFromString(svgText,'image/svg+xml');
    const paths=[...doc.querySelectorAll('path[d]')].slice(0,4);
    if(paths.length!==4)throw Error('Missing four SEYVEO ribbon paths');
    const svgNS='http://www.w3.org/2000/svg';
    const measure=document.createElementNS(svgNS,'svg');
    measure.setAttribute('viewBox','0 0 800 800');
    measure.style.cssText='position:fixed;width:0;height:0;opacity:0;pointer-events:none';
    document.body.appendChild(measure);
    const out=[];
    const offsets=[.055,.083,.042,.070];
    function pointZ(p,i) {
      const r2=p.x*p.x+p.y*p.y;
      return offsets[i]+.115*(1.-Math.min(1,r2));
    }
    function vertex(p,i,side=0,normalOverride=null,back=false) {
      const z=pointZ(p,i)-(back ? .037 : 0);
      const n=normalOverride||[p.x*.23,p.y*.23,back?-1:1];
      const mag=Math.hypot(...n)||1;
      out.push(p.x,p.y,z,n[0]/mag,n[1]/mag,n[2]/mag,
        (p.x+1)*.5,(p.y+1)*.5,i,side);
    }
    // Draw far leaves first so their translucent overlaps remain visible.
    for(const i of [2,0,3,1]) {
      const path=document.createElementNS(svgNS,'path');
      path.setAttribute('d',paths[i].getAttribute('d'));
      measure.appendChild(path);
      const length=path.getTotalLength();
      const count=Math.min(160,Math.max(105,Math.ceil(length/8)));
      const points=[];
      for(let j=0;j<count;j++) {
        const p=path.getPointAtLength(length*j/count);
        points.push({x:(p.x-374)/350,y:(355-p.y)/350});
      }
      path.remove();
      let area=0;
      for(let j=0;j<points.length;j++) {
        const a=points[j],b=points[(j+1)%points.length];
        area+=a.x*b.y-b.x*a.y;
      }
      if(area<0)points.reverse();
      const flat=points.flatMap(p=>[p.x,p.y]);
      const triangles=window.seyveoEarcut(flat,null,2);
      if(!triangles.length)throw Error('Could not triangulate ribbon '+i);
      for(let t=0;t<triangles.length;t+=3) {
        vertex(points[triangles[t]],i);
        vertex(points[triangles[t+1]],i);
        vertex(points[triangles[t+2]],i);
      }
      // Thin physical edgewalls give real depth on slow perspective turns.
      for(let j=0;j<points.length;j++) {
        const a=points[j],b=points[(j+1)%points.length];
        const dx=b.x-a.x,dy=b.y-a.y;
        const n=[dy,-dx,.12];
        vertex(a,i,1,n,false);vertex(a,i,1,n,true);vertex(b,i,1,n,false);
        vertex(b,i,1,n,false);vertex(a,i,1,n,true);vertex(b,i,1,n,true);
      }
    }
    measure.remove();
    return new Float32Array(out);
  }

  function setup(gl,geometry) {
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
    gl.bufferData(gl.ARRAY_BUFFER,geometry,gl.STATIC_DRAW);
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
      gl.drawArrays(gl.TRIANGLES,0,geometry.length/10);
    };
  }

  (async () => {
    let canvas;
    try {
      // Earcut is fetched only for the explicit 3D material experiment.
      if(!window.seyveoEarcut) {
        await new Promise((resolve,reject)=>{
          const script=document.createElement('script');
          script.src='assets/seyveo-earcut-v2.js?v=1';
          script.onload=resolve;
          script.onerror=()=>reject(Error('Ribbon triangulator unavailable'));
          document.head.appendChild(script);
        });
      }
      const response=await fetch('assets/seyveo-flow-traced.svg?v=1');
      if(!response.ok)throw Error('Ribbon geometry is unavailable');
      const geometry=buildGeometry(await response.text());
      canvas=document.createElement('canvas');
      canvas.className='sv-sayvi-webgl-ribbons';
      canvas.setAttribute('aria-hidden','true');
      const gl=canvas.getContext('webgl',{
        alpha:true,antialias:true,depth:false,stencil:false,
        premultipliedAlpha:false,powerPreference:'low-power'
      });
      if(!gl)throw Error('WebGL unsupported');
      const render=setup(gl,geometry);
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
        const rx=motion?readAngle('--sv-motion-rx'):Math.sin(time*.41)*.028;
        const ry=motion?readAngle('--sv-motion-ry'):Math.sin(time*.35+.5)*.038;
        const rz=motion?readAngle('--sv-motion-rz'):Math.sin(time*.31)*.009;
        render(time,energy,state,new Float32Array([rx,ry,rz]));
        if(!ready){ready=true;document.documentElement.classList.add('sv-3d-glass-ready');}
      }
      sizeCanvas();
      render(0,0,0,new Float32Array([0,0,0]));
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
