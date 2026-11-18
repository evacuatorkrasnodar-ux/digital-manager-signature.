/* SEYVEO · real swept-ribbon mesh. Modes 1–8 remain comparison previews;
   ?sayvi-model=8 restores the old animated plasma-signature-light.svg's
   physical layer order: moving silk, smoky filaments, still glass shell.
   ?sayvi-model=9 is the original SVG silk as a GPU-independent diagnostic.
   ?sayvi-model=10 uses soft fabric/smoke instead of mapped old filaments,
   with the new ribbon silhouette constrained to a precise outer circle.
   ?sayvi-model=11 ensures that the whole outer silhouette is a TRUE circle:
   scale up the sculpture enough to cover the circle, then feather its edge.
   Four watertight 3D bands exported from Blender with physical depth,
   normal-based pearl/frost material and gentle motion. The public home
   keeps its established Sayvi picture unless this experiment is enabled. */
(() => {
  'use strict';
  const mode=new URLSearchParams(location.search).get('sayvi-model');
  if(mode!=='1'&&mode!=='2'&&mode!=='3'&&mode!=='4'&&mode!=='5'&&mode!=='6'&&mode!=='7'&&mode!=='8'&&mode!=='9'&&mode!=='10'&&mode!=='11'&&mode!=='12')return;
  const layeredGlass=mode!=='1';
  const cleanGlass=mode==='12';
  const velvetFlow=mode==='3'||mode==='4'||mode==='5'||mode==='6'||mode==='7'||mode==='8';
  const smokeBottle=mode==='4'||mode==='5';
  const darkVelvet=mode==='5';
  const originalMaterial=mode==='6';
  const archiveSilk=mode==='7'||mode==='8';
  const visibleThreads=mode==='8';
  const orb=document.getElementById('orb');
  const hero=document.getElementById('plasmaVisual');
  const home=document.getElementById('homePage');
  if(!orb||!hero||!home)return;

  if(mode==='9'||mode==='10'||mode==='11'){
    const softCircle=mode==='10'||mode==='11';
    const preciseCircle=mode==='11';
    // Isolate the question 'does the archived silk look alive in our new
    // shape?' from the separate question 'does this device permit WebGL?'.
    // Reuse the REAL old light sphere's path data and its alternating motion.
    // The existing 3D artwork is still the outer shell; only flowing
    // internal semi-transparent details are overlaid and masked to its alpha.
    const style=document.createElement('style');
    style.textContent=`
      #orb > .sv-sayvi-archived-flow {
        position:absolute;inset:0;width:100%;height:100%;z-index:2;
        pointer-events:none;overflow:hidden;
        -webkit-mask-image:url('assets/seyveo-living-ribbon.png?v=1');
        mask-image:url('assets/seyveo-living-ribbon.png?v=1');
        -webkit-mask-position:center;mask-position:center;
        -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;
        -webkit-mask-size:contain;mask-size:contain;
      }
      #orb > .sv-sayvi-archived-flow svg{width:100%;height:100%;display:block;overflow:visible}
      #orb .sv-sayvi-archived-flow .sv-fabric-a,
      #orb .sv-sayvi-archived-flow .sv-threads-a,
      #orb .sv-sayvi-archived-flow .sv-soft-threads-a {
        transform-box:view-box;transform-origin:260px 250px;
        animation:sv-archive-silk-a 7.2s ease-in-out infinite alternate;
      }
      #orb .sv-sayvi-archived-flow .sv-fabric-b,
      #orb .sv-sayvi-archived-flow .sv-threads-b,
      #orb .sv-sayvi-archived-flow .sv-smoke-b {
        transform-box:view-box;transform-origin:260px 250px;
        animation:sv-archive-silk-b 9.1s ease-in-out infinite alternate;
      }
      @keyframes sv-archive-silk-a {
        0%{transform:translate(-9px,5px) rotate(-9deg) scale(.98);opacity:.68}
        48%{transform:translate(1px,-2px) rotate(.8deg) scale(1.003);opacity:1}
        100%{transform:translate(9px,-6px) rotate(9deg) scale(1.02);opacity:.83}
      }
      @keyframes sv-archive-silk-b {
        0%{transform:translate(8px,-7px) rotate(8deg) scale(1.018);opacity:.83}
        52%{transform:translate(-2px,2px) rotate(-1.8deg) scale(.998);opacity:1}
        100%{transform:translate(-10px,6px) rotate(-9deg) scale(.98);opacity:.64}
      }
      @media(prefers-reduced-motion:reduce){
        #orb .sv-sayvi-archived-flow :is(.sv-fabric-a,.sv-fabric-b,
          .sv-threads-a,.sv-threads-b,.sv-soft-threads-a,.sv-smoke-b){
          animation:none!important;
        }
      }
    `;
    const visual=document.createElement('div');
    visual.className='sv-sayvi-archived-flow';
    visual.setAttribute('aria-hidden','true');
    visual.innerHTML=`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="40 30 440 440">
        <defs>
          <linearGradient id="sv-archive-silk" x1=".13" y1=".15" x2=".87" y2=".95">
            <stop stop-color="#d9f4f0" stop-opacity="0"/>
            <stop offset=".2" stop-color="#487c7b" stop-opacity=".30"/>
            <stop offset=".5" stop-color="#eaf9f6" stop-opacity=".04"/>
            <stop offset=".8" stop-color="#477b7b" stop-opacity=".30"/>
            <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="sv-archive-ink" x1="0" y1="0" x2="1" y2="1">
            <stop stop-color="#577c80" stop-opacity=".04"/>
            <stop offset=".24" stop-color="#25494e" stop-opacity=".74"/>
            <stop offset=".48" stop-color="#7bafad" stop-opacity=".24"/>
            <stop offset=".7" stop-color="#254950" stop-opacity=".65"/>
            <stop offset="1" stop-color="#5d9798" stop-opacity=".09"/>
          </linearGradient>
          <radialGradient id="sv-archive-smoke">
            <stop stop-color="#456e71" stop-opacity=".25"/>
            <stop offset=".48" stop-color="#7faeb0" stop-opacity=".17"/>
            <stop offset="1" stop-color="#8eb7b7" stop-opacity="0"/>
          </radialGradient>
          <filter id="sv-archive-blur" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="4.3"/>
          </filter>
          <filter id="sv-archive-vapour" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="11"/>
          </filter>
        </defs>
        <g class="sv-smoke-b" filter="url(#sv-archive-vapour)">
          <ellipse cx="230" cy="166" rx="146" ry="49" fill="url(#sv-archive-smoke)"/>
          <ellipse cx="315" cy="325" rx="135" ry="64" fill="url(#sv-archive-smoke)"/>
          <ellipse cx="150" cy="307" rx="89" ry="75" fill="url(#sv-archive-smoke)"/>
        </g>
        <g class="sv-fabric-b" fill="url(#sv-archive-silk)">
          <path d="M99 254C124 155 206 101 316 111C392 120 445 187 448 257C418 181 358 150 290 156C194 164 140 222 99 254Z" opacity=".60"/>
          <path d="M102 290C142 372 254 422 358 373C421 343 445 268 431 210C438 312 347 386 264 375C183 367 134 329 102 290Z" opacity=".42"/>
          <path d="M133 143C236 71 370 121 423 221C442 255 446 290 431 330C422 239 353 169 276 162C215 154 159 161 133 143Z" opacity=".48"/>
        </g>
        <g class="sv-fabric-a" fill="url(#sv-archive-silk)" opacity=".34">
          <path d="M110 298C190 164 310 144 426 259C368 203 268 204 190 276C154 308 127 319 110 298Z"/>
        </g>
        <g class="sv-soft-threads-a" stroke="url(#sv-archive-ink)" stroke-linecap="round"
           fill="none" filter="url(#sv-archive-blur)" opacity=".86">
          <path d="M104 270C172 93 314 87 425 228" stroke-width="12"/>
          <path d="M115 315C212 435 352 411 431 281" stroke-width="9"/>
          <path d="M134 143C231 106 328 168 398 335" stroke-width="8"/>
        </g>
        <g class="sv-threads-a" fill="none" stroke="url(#sv-archive-ink)"
           stroke-linecap="round" stroke-linejoin="round">
          <path d="M101 278C128 188 204 118 288 112C348 109 394 150 427 229" stroke-width="2.7" opacity=".86"/>
          <path d="M105 276C157 162 254 127 331 163C384 189 418 249 428 306" stroke-width="1.3" opacity=".41"/>
          <path d="M117 211C165 124 272 89 352 125C397 145 426 197 436 255" stroke-width="2" opacity=".73"/>
          <path d="M130 139C232 110 351 181 403 314" stroke-width="1.5" opacity=".52"/>
          <path d="M109 327C176 402 291 415 378 348C417 318 439 278 444 229" stroke-width="1.9" opacity=".65"/>
          <path d="M123 349C177 432 305 451 394 366" stroke-width="1.7" opacity=".65"/>
        </g>
        <g class="sv-threads-b" fill="none" stroke="url(#sv-archive-ink)"
           stroke-linecap="round">
          <path d="M111 212C199 125 261 174 310 246C341 295 367 348 414 378" stroke-width="2.4" opacity=".59"/>
          <path d="M133 403C192 338 214 260 278 175C315 126 368 120 403 153" stroke-width="1.5" opacity=".42"/>
          <path d="M99 273C145 353 228 409 331 414C388 416 431 373 440 309" stroke-width="1.5" opacity=".47"/>
        </g>
      </svg>
    `;
    if(softCircle){
      // Avoid overlaying the old circular sphere's thin path geometry on a
      // completely different four-ribbon shape. It read as scratches.
      // Only diffuse silk and smoke remain, moving underneath an unchanged
      // copy of the approved glass reflections.
      style.textContent+=`
        #orb #plasmaVisual {clip-path:circle(41% at 50% 50%)}
        #orb > .sv-sayvi-soft-flow {clip-path:circle(41% at 50% 50%)}
        #orb > .sv-sayvi-soft-flow svg {opacity:.54;mix-blend-mode:multiply}
        #orb > .sv-sayvi-soft-flow::after {
          content:"";position:absolute;inset:0;z-index:1;
          background:url('assets/seyveo-living-ribbon.png?v=1') center/contain no-repeat;
          opacity:.19;pointer-events:none;
        }
      `;
      visual.classList.add('sv-sayvi-soft-flow');
      visual.innerHTML=`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="40 30 440 440">
          <defs>
            <radialGradient id="sv-soft-velvet" cx=".48" cy=".48" r=".59">
              <stop stop-color="#355f63" stop-opacity=".27"/>
              <stop offset=".43" stop-color="#639fa1" stop-opacity=".16"/>
              <stop offset=".81" stop-color="#aed8d6" stop-opacity=".07"/>
              <stop offset="1" stop-color="#e4f9f5" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="sv-soft-fabric" cx=".5" cy=".5" r=".5">
              <stop stop-color="#456e70" stop-opacity=".24"/>
              <stop offset=".47" stop-color="#79acae" stop-opacity=".15"/>
              <stop offset="1" stop-color="#bbdfe0" stop-opacity="0"/>
            </radialGradient>
            <filter id="sv-soft-vapour" x="-45%" y="-45%" width="190%" height="190%">
              <feGaussianBlur stdDeviation="12"/>
            </filter>
            <filter id="sv-soft-silk" x="-45%" y="-45%" width="190%" height="190%">
              <feGaussianBlur stdDeviation="9"/>
            </filter>
          </defs>
          <g class="sv-fabric-a" filter="url(#sv-soft-silk)" fill="none"
             stroke="#456f72" stroke-linecap="round" opacity=".22">
            <path d="M111 269C177 109 317 105 418 225" stroke-width="30"/>
            <path d="M127 347C214 413 349 395 425 284" stroke-width="37"/>
          </g>
          <g class="sv-fabric-b" filter="url(#sv-soft-silk)" fill="none"
             stroke="#6da3a4" stroke-linecap="round" opacity=".19">
            <path d="M112 235C204 143 321 169 414 325" stroke-width="44"/>
            <path d="M134 375C233 292 312 200 390 148" stroke-width="35"/>
          </g>
          <g class="sv-smoke-b" filter="url(#sv-soft-vapour)">
            <ellipse cx="221" cy="166" rx="130" ry="49" fill="url(#sv-soft-velvet)"/>
            <ellipse cx="313" cy="319" rx="141" ry="64" fill="url(#sv-soft-fabric)"/>
            <ellipse cx="157" cy="289" rx="91" ry="91" fill="url(#sv-soft-velvet)"/>
          </g>
        </svg>
      `;
    }
    if(preciseCircle){
      // The transparent PNG's actual outer radial extent is 385–427px,
      // relative to the 1024px square: a 10% variation. Merely clipping
      // at radius 41% left dents wherever the art had no pixels. At 1.11x,
      // even the narrowest radius covers our desired 412px target circle.
      // The image's centre/hole remains transparent; only the outer contour
      // is mathematically fixed, with a tiny feathered glass lip.
      style.textContent+=`
        html.sv-living-ribbon.sv-precision-circle #orb #plasmaVisual {
          animation:sv-ribbon-pearl-breathe 7.2s ease-in-out infinite !important;
          transform:scale(1.11) !important;
          clip-path:none !important;
          -webkit-mask-image:radial-gradient(circle closest-side at 50% 50%,
            #000 0 72.30%,rgba(0,0,0,.96) 72.58%,transparent 72.86%);
          mask-image:radial-gradient(circle closest-side at 50% 50%,
            #000 0 72.30%,rgba(0,0,0,.96) 72.58%,transparent 72.86%);
        }
        html.sv-precision-circle #orb > .sv-sayvi-soft-flow {
          transform:scale(1.11) !important;
          clip-path:circle(36.43% at 50% 50%) !important;
        }
        html.sv-precision-circle #orb::before,
        html.sv-precision-circle #orb::after {opacity:0!important}
        @media(prefers-reduced-motion:reduce){
          html.sv-living-ribbon.sv-precision-circle #orb #plasmaVisual{
            animation:none!important
          }
        }
      `;
      document.documentElement.classList.add('sv-precision-circle');
    }
    document.head.appendChild(style);
    orb.appendChild(visual);
    document.documentElement.classList.add('sv-archived-silk-ready');
    return;
  }

  const vertexSource=`
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aFlowUv;
    uniform vec3 uRotation;
    uniform float uTime;
    uniform float uBlade;
    uniform float uShellOffset;
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
      vec3 p=r*((aPosition+aNormal*uShellOffset)*breath);
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
    uniform float uArchiveSilk;
    uniform float uVisibleThreads;
    uniform float uCleanGlass;

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
      if(uCleanGlass>.5){
        // Real GLB ribbon geometry, entirely procedural pearl glass.
        // No sampled pictures, fog fields, filaments or baked smoke.
        float across=abs(vFlowUv.y-.5)*2.;
        float polishedLip=smoothstep(.57,.97,across);
        vec3 keyLight=normalize(vec3(-.34+.08*sin(uTime*.17),.49,1.));
        vec3 fillLight=normalize(vec3(.51,-.30+.06*cos(uTime*.13),1.));
        float key=max(dot(n,keyLight),0.);
        float fill=max(dot(n,fillLight),0.);
        float spec=pow(max(dot(reflect(-keyLight,n),eye),0.),64.)*.48+
                   pow(max(dot(reflect(-fillLight,n),eye),0.),94.)*.21;
        vec3 cool=vec3(.63,.80,.835);
        vec3 pearl=vec3(.86,.94,.955);
        vec3 color=mix(cool,pearl,.54+.16*key);
        color*=.88+.12*key;
        color+=vec3(.25,.29,.30)*pow(key,16.)*.23;
        color+=vec3(.34,.40,.43)*spec;
        color=mix(color,vec3(.91,.97,.99),fresnel*.34);
        color=mix(color,vec3(.54,.74,.78),polishedLip*.23);
        float alpha=mix(.89,.51,polishedLip)+fresnel*.07;
        if(uLayer<.5){
          color=mix(color,vec3(.47,.69,.72),.28);
          alpha=.20+.13*polishedLip;
        }
        gl_FragColor=vec4(clamp(color,0.,1.),clamp(alpha,.18,.97));
        return;
      }
      if(uArchiveSilk>.5){
        // The ORIGINAL light sphere SVG isn't a single opaque pearl paint.
        // Its markup, in order: body -> g-b silk -> blurred g-a filaments
        // -> crisp independently moving threads -> glass glint -> still rim.
        // The three draws below project those components through the four
        // real curved glass strips. Never paint a studio-white specular spot.
        vec2 uv=vFlowUv;
        float clearLips=smoothstep(.43,.98,abs(uv.y-.5)*2.);
        float softMiddle=1.-clearLips;
        float breathA=sin(uTime*.44+vBlade*.91);
        float breathB=cos(uTime*.35-vBlade*.77);
        vec2 driftA=vec2(breathA*.075,-breathB*.045);
        vec2 driftB=vec2(-breathB*.095,breathA*.06);

        if(uLayer<.5){
          // g-b: the actual #silk gradient (muted sea-glass / pearl fabric),
          // two wide flowing veils fading at their edges, never a metal fill.
          float veilA=.5+.5*sin(uv.x*8.6+uv.y*4.2+driftA.x*7.+
                            .38*sin(uv.x*6.4+uTime*.29));
          float veilB=.5+.5*sin(uv.x*5.5-uv.y*8.3+driftB.y*6.+
                            .29*cos(uv.x*7.5-uTime*.31));
          float silk=pow(veilA,.9)*.58+pow(veilB,1.3)*.42;
          float tissue=fineFbm(uv*vec2(3.3,2.0)+driftA+vBlade*.27);
          vec3 shade=mix(vec3(.21,.39,.41),vec3(.68,.84,.85),
                         clamp(.28+.48*silk+.24*tissue,0.,1.));
          float alpha=(.16+.36*silk+.13*tissue)*(.56+.44*softMiddle);
          gl_FragColor=vec4(shade,clamp(alpha,.13,.66));
          return;
        }
        if(uLayer<1.5){
          // g-a: smoke is a blurred shadow of fine, dark filaments.
          // Their travel follows the original 7.2s / 9.1s alternating
          // inner animations; they sway, not endlessly spin or shine.
          vec2 smokeUv=uv*vec2(3.4,2.55)+driftB+vBlade*.29;
          float hazeA=fineFbm(smokeUv+vec2(breathA*.14,breathB*.09));
          float hazeB=fineFbm(smokeUv*1.7+vec2(.7,-uTime*.028));
          float haze=smoothstep(.28,.65,hazeA*.65+hazeB*.35);
          float curveA=uv.y-(.24+.51*uv.x+.105*sin(uv.x*7.0+
                        breathA*.6+vBlade*.49));
          float curveB=uv.y-(.83-.53*uv.x+.09*sin(uv.x*6.1+
                        breathB*.63-vBlade*.44));
          float curveC=uv.y-(.52+.20*sin(uv.x*10.3+breathA*.7+
                        vBlade*.38));
          float blurry=exp(-115.*curveA*curveA)*.65+
                        exp(-90.*curveB*curveB)*.55;
          float threads=exp(-1300.*curveA*curveA)*.62+
                        exp(-1700.*curveB*curveB)*.48+
                        exp(-2200.*curveC*curveC)*.32;
          float shadow=clamp(blurry*.6+threads*.67,0.,1.);
          vec3 fog=mix(vec3(.43,.63,.65),vec3(.64,.81,.82),haze*.58);
          fog=mix(fog,vec3(.19,.37,.40),shadow*.87);
          gl_FragColor=vec4(fog,clamp((.18+.24*haze+.37*shadow)*
                            (.56+.44*softMiddle),.12,.80));
          return;
        }
        // The outer shell: velvet-white in its middle, optically clean on
        // the lips. Old #body, #edgewash and #rim are toned for dark velvet.
        // Importantly this shell NEVER takes part in the silk drift above.
        float velvet=fineFbm(uv*vec2(2.4,1.8)+vBlade*.21);
        vec3 pearl=vec3(.87,.945,.948);
        vec3 coolGlass=vec3(.67,.84,.85);
        vec3 color=mix(coolGlass,pearl,clamp(.67+.15*velvet+
                         .10*max(dot(n,normalize(vec3(-.5,.66,1.))),0.),0.,1.));
        color=mix(color,vec3(.59,.78,.80),fresnel*.25);
        // Broad diffused light, like cloth behind a wet glass surface.
        float satin=pow(max(dot(n,normalize(vec3(-.38,.56,1.))),0.),7.);
        color+=vec3(.028,.042,.042)*satin;
        if(uVisibleThreads>.5){
          // A curved lens must transmit the dark moving texture BELOW it.
          // V7 put the threads only on the backfaces, so the milk-white front
          // scattered them away. Refract a subdued view of those same
          // under-glass currents THROUGH the front surface instead.
          vec2 behind=uv+vec2(.028*(1.-facing)*n.x,
                              .028*(1.-facing)*n.y);
          float flowingA=behind.y-(.24+.51*behind.x+
             .105*sin(behind.x*7.+breathA*.6+vBlade*.49));
          float flowingB=behind.y-(.83-.53*behind.x+
             .09*sin(behind.x*6.1+breathB*.63-vBlade*.44));
          float flowingC=behind.y-(.52+.20*sin(behind.x*10.3+
             breathA*.7+vBlade*.38));
          float filamentA=exp(-1250.*flowingA*flowingA);
          float filamentB=exp(-1500.*flowingB*flowingB);
          float filamentC=exp(-1900.*flowingC*flowingC);
          float softness=exp(-95.*flowingA*flowingA)*.59+
                         exp(-100.*flowingB*flowingB)*.42;
          float strand=clamp(filamentA*.75+filamentB*.65+
                             filamentC*.45+softness*.38,0.,1.);
          float movingSilk=.5+.5*sin(behind.x*7.3+behind.y*3.1+
                     .48*sin(uTime*.44+vBlade*.9));
          float vaporA=fineFbm(behind*vec2(3.0,2.35)+
                          vec2(breathA*.16,breathB*.11)+vBlade*.23);
          float vaporB=fineFbm(behind*vec2(5.5,3.8)+
                          vec2(-uTime*.032,breathA*.15));
          float vapor=smoothstep(.24,.68,vaporA*.64+vaporB*.36);
          // Delicate blue-grey ink is visible through the milky membrane;
          // both fabric and fog gently migrate, while the shell stays still.
          float smoked=.13+.21*vapor+.12*movingSilk;
          color=mix(color,vec3(.52,.73,.74),smoked*softMiddle);
          color=mix(color,vec3(.24,.47,.51),
                    strand*(.34+.15*vapor)*(.30+.70*softMiddle));
          color=mix(color,vec3(.72,.88,.88),clearLips*.15);
        }
        color=mix(color,vec3(.67,.86,.86),clearLips*.18);
        float alpha=mix(uVisibleThreads>.5?.72:.69,
                        uVisibleThreads>.5?.31:.255,clearLips)+fresnel*.095;
        gl_FragColor=vec4(clamp(color,0.,1.),clamp(alpha,.23,.80));
        return;
      }
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

  function setup(gl,ribbons,layeredGlass,velvetFlow,smokeBottle,darkVelvet,originalMaterial,archiveSilk,visibleThreads,cleanGlass){
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
      shellOffset:gl.getUniformLocation(program,'uShellOffset'),
      rotation:gl.getUniformLocation(program,'uRotation'),
      layered:gl.getUniformLocation(program,'uLayeredGlass'),
      layer:gl.getUniformLocation(program,'uLayer'),
      velvet:gl.getUniformLocation(program,'uVelvetFlow'),
      smoke:gl.getUniformLocation(program,'uSmokeBottle'),
      darkVelvet:gl.getUniformLocation(program,'uDarkVelvet'),
      original:gl.getUniformLocation(program,'uOriginalMaterial'),
      archiveSilk:gl.getUniformLocation(program,'uArchiveSilk'),
      threads:gl.getUniformLocation(program,'uVisibleThreads'),
      clean:gl.getUniformLocation(program,'uCleanGlass')
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
      gl.uniform1f(u.archiveSilk,archiveSilk?1:0);
      gl.uniform1f(u.threads,visibleThreads?1:0);
      gl.uniform1f(u.clean,cleanGlass?1:0);
      if(archiveSilk){
        // Three separate translucent depths, matching the source artwork's
        // silk -> smoke/filaments -> external clear/frosted glass order.
        gl.enable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.cullFace(gl.FRONT);
        gl.uniform1f(u.layer,0);
        gl.uniform1f(u.shellOffset,-.009);
        drawMeshes();
        gl.uniform1f(u.layer,1);
        gl.uniform1f(u.shellOffset,-.004);
        drawMeshes();
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.cullFace(gl.BACK);
        gl.uniform1f(u.layer,2);
        gl.uniform1f(u.shellOffset,0);
        drawMeshes();
        gl.disable(gl.CULL_FACE);
      }else if(layeredGlass){
        // Back surfaces scatter a little light through the foreground.
        // Front surfaces then occlude according to real 3D depth.
        gl.enable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.cullFace(gl.FRONT);
        gl.uniform1f(u.layer,0);
        gl.uniform1f(u.shellOffset,0);
        drawMeshes();
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);
        gl.cullFace(gl.BACK);
        gl.uniform1f(u.layer,1);
        drawMeshes();
        gl.disable(gl.CULL_FACE);
      }else{
        gl.uniform1f(u.layer,1);
        gl.uniform1f(u.shellOffset,0);
        drawMeshes();
      }
    };
  }

  (async()=>{
    let canvas;
    try{
      const ribbons=await loadRibbons(velvetFlow||cleanGlass);
      canvas=document.createElement('canvas');
      canvas.className='sv-sayvi-real3d-canvas';
      canvas.setAttribute('aria-hidden','true');
      const gl=canvas.getContext('webgl',{
        alpha:true,antialias:true,depth:true,stencil:false,
        premultipliedAlpha:false,powerPreference:'low-power'
      });
      if(!gl)throw Error('iPhone WebGL unsupported');
      const render=setup(gl,ribbons,layeredGlass,velvetFlow,smokeBottle,darkVelvet,originalMaterial,archiveSilk,visibleThreads,cleanGlass);
      const style=document.createElement('style');
      style.textContent=`
        #orb > .sv-sayvi-real3d-canvas {
          position:absolute;inset:0;width:100%;height:100%;
          pointer-events:none;opacity:0;z-index:5;
          transition:opacity 500ms ease-out;
        }
        html.sv-real3d-ready #orb > .sv-sayvi-real3d-canvas {opacity:1}
        #orb #plasmaVisual {transition:opacity 500ms ease-out}
        html.sv-real3d-ready #orb #plasmaVisual,
        html.sv-real3d-ready #orb > .sv-ribbon-glass-composite,
        html.sv-real3d-ready #orb > .sv-sayvi-programmable-glass,
        html.sv-real3d-ready #orb > .sv-sayvi-webgl-ribbons {opacity:0!important}
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
