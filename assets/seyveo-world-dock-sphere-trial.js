/* My World experiment: the alternate Liquid Intelligence lens from the user's
   reference, in a subtly bluer palette so it is distinct from pearl Sayvi. */
(() => {
  'use strict';
  const button=document.getElementById('navPicture');
  if(!button||button.querySelector('.sv-world-dock-sphere-trial'))return;
  const canvas=document.createElement('canvas');
  canvas.className='sv-world-dock-sphere-trial';
  canvas.setAttribute('aria-hidden','true');
  canvas.width=canvas.height=Math.round(40*Math.min(window.devicePixelRatio||1,2.5));

  const vertex=`
    attribute vec2 a_position;
    void main(){gl_Position=vec4(a_position,0.,1.);}
  `;
  const fragment=`
    precision highp float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_palette;

    float hash(vec3 p) {
      p=fract(p*0.1031);
      p+=dot(p,p.yxz+33.33);
      return fract((p.x+p.y)*p.z);
    }
    float noise3(vec3 x) {
      vec3 i=floor(x),f=fract(x);
      f=f*f*(3.0-2.0*f);
      return mix(
        mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
            mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
        mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
            mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
    }
    float fbm(vec3 p) {
      float v=0.0,a=0.55;
      for(int i=0;i<3;i++){
        v+=a*noise3(p);
        p=p*2.07+vec3(5.1,9.7,3.4);
        a*=0.49;
      }
      return v;
    }
    void main() {
      vec2 p=(gl_FragCoord.xy*2.0-u_resolution.xy)/min(u_resolution.x,u_resolution.y);
      float radius=0.915;
      vec2 q=p/radius;
      float r=length(q);
      if(r>1.025)discard;

      float edge=1.0-smoothstep(0.992,1.012,r);
      float z=sqrt(max(0.0,1.0-dot(q,q)));
      vec3 n=normalize(vec3(q,z+0.001));
      float t=u_time;
      float energy=0.18;
      float pulse=0.5+0.5*sin(t*(1.35+energy*1.15));

      vec3 pearl=mix(vec3(0.968,0.980,0.996),vec3(0.946,0.988,1.000),u_palette);
      vec3 glass=mix(vec3(0.710,0.804,0.880),vec3(0.590,0.835,0.971),u_palette);
      vec3 depth=mix(vec3(0.355,0.515,0.670),vec3(0.205,0.500,0.780),u_palette);
      vec3 lightColor=mix(vec3(0.760,0.895,1.000),vec3(0.540,0.875,1.000),u_palette);

      vec3 field=vec3(q*1.35,z*0.78);
      field+=vec3(0.14*sin(t*0.23+q.y*2.1),
                  0.13*cos(t*0.19+q.x*2.3),
                  0.10*sin(t*0.17+q.x*1.2));
      field+=vec3(t*0.038,-t*0.028,t*0.020);
      field*=1.48;

      float cloud1=fbm(field);
      float cloud2=fbm(field*1.46+vec3(3.1,-1.7,4.8));
      float liquid=cloud1*0.69+cloud2*0.31;
      float broad=smoothstep(0.32,0.66,liquid);
      float deepPool=smoothstep(0.52,0.72,liquid);
      float fresnel=pow(1.0-z,1.35);

      vec3 col=mix(pearl,glass,0.15+0.41*broad);
      col=mix(col,depth,0.14*deepPool+0.24*fresnel);
      col+=lightColor*(0.055+0.065*pulse*energy)*(1.0-broad);
      vec2 nucleusPos=vec2(0.055*sin(t*0.31),0.048*cos(t*0.27));
      float nucleus=exp(-dot((q-nucleusPos)*1.42,(q-nucleusPos)*1.42)*1.8);
      col+=lightColor*nucleus*(0.055+0.17*energy+0.065*pulse*energy);

      float wave1=sin(6.8*liquid-t*0.32);
      float wave2=sin(4.9*cloud2+t*0.18);
      float iridescence=(wave1*wave2*0.5+0.5)*0.048;
      col+=mix(vec3(0.060,0.104,0.160),vec3(0.050,0.125,0.182),u_palette)
          *iridescence*3.0*(1.0-fresnel);
      float dnX=fbm(field+vec3(0.075,0,0))-fbm(field-vec3(0.075,0,0));
      float dnY=fbm(field+vec3(0,0.075,0))-fbm(field-vec3(0,0.075,0));
      vec3 curvedNormal=normalize(n+vec3(dnX,dnY,0.0)*0.30);
      vec3 L=normalize(vec3(-0.62,0.80,1.48));
      vec3 V=vec3(0.0,0.0,1.0);
      float diffuse=clamp(dot(curvedNormal,L)*0.5+0.5,0.0,1.0);
      col*=0.88+0.12*diffuse;
      float spec=pow(max(dot(reflect(-L,curvedNormal),V),0.0),31.0);
      float soft=pow(max(dot(reflect(-L,n),V),0.0),6.0);
      col+=vec3(1.0)*spec*0.43;
      col+=vec3(1.0)*soft*0.19;
      float upperReflection=exp(-pow((q.x+0.39)*1.52,2.0)*2.2
                               -pow((q.y-0.45)*1.30,2.0)*3.5);
      col+=vec3(1.0)*upperReflection*0.12;
      float glassEdge=exp(-pow((r-0.972)*47.0,2.0));
      float glassInner=exp(-pow((r-0.930)*23.0,2.0));
      float rimDirection=0.40+0.60*max(dot(normalize(q+vec2(0.0001)),
                                         normalize(vec2(-0.58,0.80))),0.0);
      col=mix(col,glass,glassInner*0.09);
      col+=mix(vec3(0.84,0.93,1.0),vec3(0.69,0.91,1.0),u_palette)
          *glassEdge*(0.12+0.26*rimDirection);
      col=clamp(col,0.0,1.0);
      gl_FragColor=vec4(col,edge*(0.955+0.045*fresnel));
    }
  `;

  function makeRenderer() {
    const gl=canvas.getContext('webgl',{
      alpha:true,antialias:true,premultipliedAlpha:false,
      preserveDrawingBuffer:false,powerPreference:'low-power'
    });
    if(!gl)return null;
    const compile=(type,source)=>{
      const shader=gl.createShader(type);
      gl.shaderSource(shader,source);
      gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
        console.warn('SEYVEO My World lens:',gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };
    const vs=compile(gl.VERTEX_SHADER,vertex);
    const fs=compile(gl.FRAGMENT_SHADER,fragment);
    if(!vs||!fs)return null;
    const program=gl.createProgram();
    gl.attachShader(program,vs);
    gl.attachShader(program,fs);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
    gl.useProgram(program);
    const buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const uniforms={
      size:gl.getUniformLocation(program,'u_resolution'),
      time:gl.getUniformLocation(program,'u_time'),
      palette:gl.getUniformLocation(program,'u_palette')
    };
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0,0,0,0);
    return (seconds)=>{
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uniforms.size,canvas.width,canvas.height);
      gl.uniform1f(uniforms.time,seconds);
      gl.uniform1f(uniforms.palette,1.0);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    };
  }

  let renderer;
  try{renderer=makeRenderer();}catch(error){console.warn('SEYVEO My World lens:',error);}
  let artwork=canvas;
  if(!renderer){
    artwork=canvas.cloneNode(false);
    artwork.width=artwork.height=canvas.width;
    const ctx=artwork.getContext('2d');
    if(!ctx)return;
    renderer=(seconds)=>{
      const w=artwork.width,c=w/2,r=w*.46;
      ctx.clearRect(0,0,w,w);
      const g=ctx.createRadialGradient(c-r*.24,c-r*.36,r*.02,c,c,r);
      g.addColorStop(0,'#fff');g.addColorStop(.42,'#d3f6ff');
      g.addColorStop(.8,'#79bddd');g.addColorStop(1,'#e6f9ff');
      ctx.beginPath();ctx.arc(c,c,r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.93)';ctx.lineWidth=Math.max(1,w*.015);ctx.stroke();
      const x=c+Math.sin(seconds*.3)*r*.07,y=c+Math.cos(seconds*.26)*r*.07;
      const inner=ctx.createRadialGradient(x,y,0,x,y,r*.68);
      inner.addColorStop(0,'rgba(255,255,255,.72)');
      inner.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=inner;ctx.fill();
    };
  }

  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let last=-100;
  function tick(now){
    requestAnimationFrame(tick);
    const dock=button.closest('footer.dock.sv-shared-dock');
    if(!dock||document.hidden||document.documentElement.dataset.theme!=='light'||
       dock.matches('.seyveo-browser-dock,.seyveo-music-dock')||
       button.closest('dialog')?.dataset.space==='health')return;
    if(!button.contains(artwork))button.appendChild(artwork);
    if(now-last<45)return;
    last=now;
    renderer(reduced.matches?0:now*.001);
    button.classList.add('sv-world-sphere-ready');
  }
  requestAnimationFrame(tick);
})();
