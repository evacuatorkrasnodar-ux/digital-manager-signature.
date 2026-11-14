/* The approved Sayvi pearl-sphere preview, scaled to 42px in the existing dock.
   No button is replaced; all touch/voice/navigation handlers stay untouched. */
(() => {
  'use strict';
  const button = document.getElementById('assistantButton');
  if (!button || button.querySelector('.sv-sayvi-dock-sphere')) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'sv-sayvi-dock-sphere';
  canvas.setAttribute('aria-hidden', 'true');
  // Render at no less than 3x the 42px size; downsampling removes rim stair-steps.
  canvas.width = canvas.height = 42 * 3;

  const vertexSource = `
    attribute vec2 position;
    varying vec2 uv;
    void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }
  `;

  // Retain the approved preview's exact pearl, refraction and studio glints.
  const fragmentSource = `
    precision highp float;
    varying vec2 uv;
    uniform float time;
    uniform float energy;
    uniform float state;

    float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p) {
      vec2 i=floor(p),f=fract(p);
      f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
        mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
    }
    float fbm(vec2 p) {
      float v=0.,a=.5;
      for(int i=0;i<4;i++) { v+=a*noise(p);p=p*2.03+vec2(12.1,4.3);a*=.5; }
      return v;
    }
    float gaussian(vec2 p,vec2 c,float k) {
      vec2 d=p-c;return exp(-dot(d,d)*k);
    }
    void main() {
      vec2 p=(uv-.5)*2.;
      float t=time,ang=atan(p.y,p.x);
      float speech=state>2.5?abs(sin(t*5.1)*sin(t*2.5)):1.;
      float active=energy*(.73+.27*speech);
      float edge=.92+.01*active*sin(ang*3.+t*2.1);
      float r=length(p);
      // A 1px optical fade: avoid a hard rasterized outline at dock-icon scale.
      float alpha=1.-smoothstep(edge-.043,edge+.009,r);
      if(alpha<.002) discard;

      vec2 q=p/edge;
      float z=sqrt(max(0.,1.-dot(q,q)));
      vec3 n=normalize(vec3(q,z));
      float fresnel=pow(1.-z,2.25);
      vec2 drift=vec2(sin(t*.24),cos(t*.22))*.21;
      vec2 refractPos=q*(1.12+.25*(1.-z));
      float n1=fbm(refractPos*2.2+drift+vec2(t*.044,-t*.03));
      float n2=fbm(refractPos*3.-drift*.7+vec2(-t*.031,t*.039));
      float fluid=smoothstep(.27,.77,n1*.65+n2*.35);

      vec3 pearl=vec3(.95,.976,.993);
      vec3 glass=vec3(.75,.84,.90);
      vec3 depthColor=vec3(.43,.59,.71);
      float depth=pow(clamp(r/edge,0.,1.),1.8);
      vec3 color=mix(pearl,glass,depth*.63);
      color=mix(color,depthColor,(1.-fluid)*(.19+active*.10));
      color+=vec3(.10,.12,.13)*fluid*.2;

      float cloud=gaussian(q,vec2(sin(t*.31)*.09,cos(t*.27)*.09),10.);
      float beating=.75+.25*sin(t*(state>2.5?8.:state>.5?4.:1.6));
      color+=vec3(.11,.15,.17)*cloud*beating*(.7+active*.75);

      vec3 lightA=normalize(vec3(-.5,.63,1.));
      vec3 lightB=normalize(vec3(.68,-.30,1.));
      float specA=pow(max(dot(n,lightA),0.),55.);
      float specB=pow(max(dot(n,lightB),0.),105.);
      color+=vec3(.53,.55,.57)*specA;
      color+=vec3(.14,.26,.31)*specB;
      // Keep glass volume, but soften the dark Fresnel ring into the pearl body.
      color=mix(color,depthColor,fresnel*.12);
      color+=vec3(.16,.22,.24)*smoothstep(.84,1.,r/edge)*.055;
      color+=vec3(.31,.33,.35)*gaussian(q,vec2(-.34,.57),35.);
      color+=vec3(.09,.15,.18)*gaussian(q,vec2(.49,-.58),80.);
      gl_FragColor=vec4(clamp(color,0.,1.),alpha);
    }
  `;

  function makeWebGLRenderer() {
    const gl = canvas.getContext('webgl', {
      alpha: true, antialias: true, premultipliedAlpha: false,
      preserveDrawingBuffer: false, powerPreference: 'low-power'
    });
    if (!gl) return null;
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('SEYVEO Sayvi sphere shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1, 1,-1, -1,1, 1,1
    ]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = {
      time: gl.getUniformLocation(program, 'time'),
      energy: gl.getUniformLocation(program, 'energy'),
      state: gl.getUniformLocation(program, 'state')
    };
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0,0,0,0);
    return (seconds, energy, state) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.time, seconds);
      gl.uniform1f(uniforms.energy, energy);
      gl.uniform1f(uniforms.state, state);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
  }

  // A readable 2D pearl lens remains if WebGL is unavailable on a device.
  let render;
  try { render = makeWebGLRenderer(); } catch (error) {
    console.warn('SEYVEO Sayvi sphere WebGL:', error);
  }
  if (!render) {
    // A WebGL canvas cannot switch contexts: use a fresh canvas for 2D fallback.
    const replacement = canvas.cloneNode(false);
    replacement.width = canvas.width;
    replacement.height = canvas.height;
    render = (() => {
      const ctx = replacement.getContext('2d');
      if (!ctx) return null;
      return (seconds, energy) => {
        const w=replacement.width,c=w/2,r=w*.46;
        ctx.clearRect(0,0,w,w);
        const g=ctx.createRadialGradient(c-r*.27,c-r*.38,r*.02,c,c,r);
        g.addColorStop(0,'#fff');g.addColorStop(.42,'#e4eef6');
        g.addColorStop(.78,'#9ebbd0');g.addColorStop(1,'#edf7ff');
        ctx.beginPath();ctx.arc(c,c,r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
        ctx.lineWidth=Math.max(1,w*.015);ctx.strokeStyle='rgba(255,255,255,.92)';ctx.stroke();
        const x=c+Math.sin(seconds*.30)*r*.07,y=c+Math.cos(seconds*.26)*r*.07;
        const inner=ctx.createRadialGradient(x,y,0,x,y,r*.68);
        inner.addColorStop(0,`rgba(255,255,255,${.59+energy*.19})`);
        inner.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=inner;ctx.fill();
      };
    })();
    if (!render) return;
    button.appendChild(replacement);
  } else {
    button.appendChild(canvas);
  }

  let energy = 0;
  let lastTime = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shouldRender = () => !document.hidden &&
    document.documentElement.dataset.theme === 'light' &&
    !!button.closest('footer.dock.sv-shared-dock:not(.seyveo-browser-dock):not(.seyveo-music-dock)') &&
    button.closest('dialog')?.dataset.space !== 'health';

  function tick(ms) {
    requestAnimationFrame(tick);
    if (!shouldRender() || ms-lastTime<32) return;
    lastTime = ms;
    const action = button.dataset.sayviMotion || '';
    const listening = button.matches('.listening,.pressing,.arming,[aria-pressed="true"]') || action === 'listening';
    const speaking = action === 'speaking' || action === 'reply';
    const state = speaking ? 3 : listening ? 1 : 0;
    const target = speaking ? .92 : listening ? .46 : 0;
    energy += (target-energy)*.075;
    render(reduced.matches ? 0 : ms*.001, energy, state);
    button.classList.add('sv-sayvi-sphere-ready');
  }
  requestAnimationFrame(tick);
})();
