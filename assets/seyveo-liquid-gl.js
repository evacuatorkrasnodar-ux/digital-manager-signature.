/* SEYVEO Liquid Sound · glass vessel and suspended matter · WebGL 1. */
(()=>{'use strict';
window.SEYVEO_LIQUID_GL={create(mobile){
 const canvas=document.createElement('canvas');
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:false,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 if(!gl)return null;
 let lost=false;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true});
 const vs=`precision highp float;
attribute vec4 aData;
uniform vec4 uMusic; uniform mediump float uKind,uMode; uniform float uSize;
varying mediump vec2 vUV; varying mediump float vLight;
const float PI=3.14159265;
// Five shared cubic contours traced from the approved matter silhouette.
vec2 bez(vec2 a,vec2 b,vec2 c,vec2 d,float t){float q=1.0-t;return q*q*q*a+3.0*q*q*t*b+3.0*q*t*t*c+t*t*t*d;}
vec3 contour(float k,float u){
 vec2 l=vec2(-.864,.174),r=vec2(.920,-.151),m,c1,c2,c3,c4;float z;
 if(k<.5){m=vec2(.12,-.794);c1=vec2(-.67,-.035);c2=vec2(-.52,-.77);c3=vec2(.52,-.788);c4=vec2(.84,-.48);z=-.13;}
 else if(k<1.5){m=vec2(-.08,.065);c1=vec2(-.73,.005);c2=vec2(-.40,.095);c3=vec2(.32,-.010);c4=vec2(.72,-.29);z=.23;}
 else if(k<2.5){m=vec2(-.08,.270);c1=vec2(-.73,.075);c2=vec2(-.43,.35);c3=vec2(.27,.190);c4=vec2(.73,-.34);z=.38;}
 else if(k<3.5){m=vec2(.31,.55);c1=vec2(-.50,.25);c2=vec2(-.02,.55);c3=vec2(.64,.56);c4=vec2(.99,.33);z=-.09;}
 else {m=vec2(-.06,.785);c1=vec2(-.91,.37);c2=vec2(-.46,.75);c3=vec2(.20,.83);c4=vec2(.94,.38);z=-.22;}
 vec2 p=u<.5?bez(l,c1,c2,m,u*2.0):bez(m,c3,c4,r,u*2.0-1.0);
 return vec3(p,z*sin(PI*u));
}
vec3 matter(float x,float v){
 float u=(x+1.0)*.5,t=uMusic.x,mid=uMusic.z;
 float k=uKind<2.5?0.0:uKind<3.5?1.0:uKind<4.5?2.0:3.0;
 vec3 p=mix(contour(k,u),contour(k+1.0,u),v);
 // The translucent return of the upper cloth, visible only at the left shoulder.
 if(uKind>6.5&&uKind<7.5){
  float h=u;u*=.50;vec3 q=contour(0.0,u);
  // The return has its own outer contour, joining the same cloth at both ends.
  vec2 outer=bez(contour(0.0,0.0).xy,vec2(-1.10,-.17),vec2(-.40,-.43),contour(0.0,.50).xy,h);
  q.xy=mix(q.xy,outer,v);
  float flap=sin(PI*h);
  q.z-=.24*flap*v;
  q.y+=sin(PI*u)*(.010+.035*mid)*sin(u*5.5+t*.65);
  q.z+=sin(PI*u)*.055*sin(t*.55+u*4.0)*(.30+mid);
  return q;
 }
 float f=sin(PI*v)*sin(PI*u),w=sin(PI*u);
 p.z+=f*(k<.5?.28:k<1.5?.20:-.16);
 p.x+=f*(.035*sin(PI*u*2.0+t*.32)+.115*sin(PI*u*1.6-.35)*(k<.5?1.0:-.6));
 p.y+=w*(.010+.035*mid)*sin(u*5.5+t*.65)+.016*f*sin(u*8.0-t*.4);
 p.z+=w*.055*sin(t*.55+u*4.0)*( .30+mid);
 return p;
}
// Soft emissive strips follow the animated crease positions, not the glass.
vec3 crease(float x,float v){
 float u=(x+1.0)*.5,t=uMusic.x,mid=uMusic.z,w=sin(PI*u);
 float k=uKind<8.5?2.0:uKind<9.5?4.0:1.0;
 vec3 p=contour(k,u);
 p.y+=w*(.010+.035*mid)*sin(u*5.5+t*.65);
 p.z+=w*.055*sin(t*.55+u*4.0)*(.30+mid);
 vec2 tangent=contour(k,min(1.0,u+.004)).xy-contour(k,max(0.0,u-.004)).xy;
 vec2 normal=normalize(vec2(-tangent.y,tangent.x)+vec2(.000001,0.0));
 float width=uKind<8.5?.115:uKind<9.5?.115:.055;
 p.xy+=normal*(v*2.0-1.0)*width*(.72+.28*w);
 return p;
}
void main(){
 float x=aData.x,v=aData.y;vec3 p;
 if(uKind>4.5&&uKind<5.5){p=vec3(x*1.10,(2.0*v-1.0)*1.10,0.0);vLight=1.0;}
 else if(uKind>7.5){p=crease(x,v);vLight=1.0;}
 else {p=matter(x,v);vec3 dx=matter(clamp(x+.006,-.9999,.9999),v)-matter(clamp(x-.006,-.9999,.9999),v);vec3 dy=matter(x,min(1.0,v+.006))-matter(x,max(0.0,v-.006));vec3 n=cross(dx,dy);vLight=abs(n.z)/(length(n)+.000001);}
 float glass=step(4.5,uKind)*(1.0-step(5.5,uKind));
 float scale=.82*(1.0+mix(.025,.003,glass)*uMusic.y)*(1.0+.020*p.z);
 gl_Position=vec4(scale*vec2(p.x+.012*p.z,-p.y+.012*p.z),p.z*.3,1.0);
 gl_PointSize=clamp(uSize*(uKind>3.5?.0020:.0027+.00030*uMusic.w),1.6,3.1);
 vUV=vec2(x,v);
}
`;
 const fs=`precision mediump float;
uniform mediump float uKind,uMode; varying mediump vec2 vUV; varying mediump float vLight;
float peak(float a,float c,float w){return exp(-(1.0-cos(a-c))/(w*w));}
float gauss(float x,float w){float q=x/w;return exp(-q*q);}
void main(){
 float x=vUV.x,v=vUV.y,alpha;vec3 col;
 if(uKind>4.5&&uKind<5.5){
  vec2 xy=1.10*vec2(x,2.0*v-1.0);float r=length(xy),a=atan(xy.y,xy.x+.00001);
  if(r>1.0){
   float glow=gauss(r-1.0,.033)*(.025+.24*peak(a,-2.16,.54)+.25*peak(a,1.30,.65));
   float floorGlow=gauss(xy.x,.30)*gauss(xy.y-1.045,.024)*.33+gauss(xy.x,.14)*gauss(xy.y-1.036,.010)*.29;
   glow=clamp(glow+floorGlow,0.0,.75);
   gl_FragColor=vec4(.10,.86,.88,glow);return;
  }
  float n=sqrt(max(0.0,1.0-r*r));
  float top=peak(a,-2.08,.61),bottom=peak(a,1.37,.57),right=peak(a,.60,.61),left=peak(a,2.85,.48);
  float lip=.14+.85*top+.54*bottom+.57*right+.22*left;
  float edge=gauss(r-.993,.0055),edgeSoft=gauss(r-.973,.021);
  float reflected=gauss(r-(.945-.080*top),.014+.037*top)*pow(top,1.8);
  // Broad curved softbox reflection: a distinct inner edge with a translucent tail.
  float innerArc=.945-.145*top;
  float crescent=smoothstep(innerArc-.012,innerArc+.010,r)*(1.0-smoothstep(.929,.975,r))*pow(top,1.5);
  float shoulder=peak(a,-1.05,.60)*gauss(r-.91,.045);
  float base=gauss(r-(.952-.048*bottom),.051)*bottom;
  float lowerLens=gauss(r-(.927-.035*bottom),.037)*peak(a,1.14,.66);
  float inner=gauss(r-.967,.008)*(.24+.45*right+.40*left);
  float fres=pow(max(0.0,1.0-n),3.0);
  float light=clamp(.82*reflected+1.09*edge*lip+.45*edgeSoft*lip+.76*base+.21*inner+.64*crescent+.19*lowerLens+.12*shoulder,0.0,1.0);
  col=mix(vec3(.02,.73,.85),vec3(.95,1.0,.99),smoothstep(.38,1.0,light));
  alpha=clamp(.006+.085*fres+.95*light,0.0,.98);
 }else if(uKind>7.5){
  float w=sin(3.14159265*(x+1.0)*.5);
  float tips=gauss(x+.91,.20)+gauss(x-.91,.20);
  float strength=uKind<8.5?(.28+.52*tips+.12*gauss(x+.30,.48)):uKind<9.5?.70*gauss(x+.10,.29):(.09+.26*tips);
  float g=gauss(v-.5,.068),soft=gauss(v-.5,.27);
  col=mix(vec3(.02,.91,.88),vec3(.88,1.0,.98),g*.78);
  float taper=smoothstep(0.0,.08,w);
  alpha=strength*(.42*g+.58*soft)*taper*(1.0-smoothstep(.46,.50,abs(v-.5)));
 }else{
  float tip=pow(abs(x),6.0),turn=pow(v,5.0),fres=1.0-vLight;
  float focus=gauss(x+.20,.78),edge=pow(v,20.0),start=pow(1.0-v,20.0);
  float tipGlow=gauss(x+.91,.18)+gauss(x-.92,.18);
  float facing=clamp(vLight,0.0,1.0);
  float frontLight=.57+.43*gauss(x-.22,.82);
  col=mix(vec3(.08,.88,.88),vec3(.84,1.0,.98),clamp(.24*turn+.22*fres+.30*tip,0.0,1.0));
  if(uKind<2.5)alpha=(.34+.31*v*v+.18*fres)*frontLight*(1.0-.46*tip);
  else if(uKind<3.5){alpha=(.64+.40*turn+.16*fres)*(1.0-.14*tip);col=mix(col,vec3(.80,1.0,.97),turn*.85);}
  else if(uKind<4.5)alpha=(.12+.10*fres+.12*facing*gauss(x-.28,.62))*(1.0-.60*tip);
  else alpha=(.10+.26*turn+.19*turn*gauss(x+.10,.42)+.12*fres)*(1.0-.60*tip);
  if(uMode<.5){
   if(uKind<2.5)alpha=.009+.025*fres+.09*start*focus+.09*pow(v,5.0)*tipGlow;
   else if(uKind<3.5){alpha=clamp(.035+.86*edge+.40*start+.30*pow(v,4.0)+.32*tipGlow+.025*fres,0.0,.98);col=mix(vec3(.035,.87,.85),vec3(.95,1.0,.99),clamp(edge*.92+start*.38+tipGlow*.30,0.0,1.0));}
   else if(uKind<4.5)alpha=.009+.019*fres+.17*edge*gauss(x-.35,.66)+.16*pow(1.0-v,12.0)*(.55+.45*focus);
   else {float low=gauss(x+.10,.29);alpha=clamp(.012+.95*edge*low+.65*pow(v,4.0)*low+.27*start*gauss(x-.25,.76),0.0,.98);col=mix(vec3(.02,.89,.86),vec3(.88,1.0,.98),edge*.90*low);}
  }
  if(uKind>6.5&&uKind<7.5){
   float taper=sin(3.14159265*(x+1.0)*.5);
   float foldLight=gauss(v-.78,.30)*gauss(x+.28,.75);
   col=mix(vec3(.015,.66,.72),vec3(.53,1.0,.98),clamp(.65*foldLight+.22*pow(v,8.0),0.0,1.0));
   alpha=(uMode<.5?(.018+.30*foldLight+.25*pow(v,15.0)):(.22+.40*foldLight))*taper;
  }
  if(uMode>.5&&uMode<1.5){float d=length(gl_PointCoord-.5);alpha*=exp(-d*d*8.0)*(1.0-smoothstep(.34,.50,d));}

 }
 gl_FragColor=vec4(col,clamp(alpha,0.0,1.0));
}
`;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(log)}return s}
 let vertex,fragment,program;
 try{vertex=shader(gl.VERTEX_SHADER,vs);fragment=shader(gl.FRAGMENT_SHADER,fs);program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}catch(e){if(vertex)gl.deleteShader(vertex);if(fragment)gl.deleteShader(fragment);if(program)gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();throw e}
 gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);
 const data=gl.getAttribLocation(program,'aData'),uniform={};for(const k of ['uMusic','uKind','uMode','uSize'])uniform[k]=gl.getUniformLocation(program,k);
 // Separate parametric matter meshes and an analytic spherical glass layer.
 function mesh(kind,n,m,mode){
  const values=[],indices=[];
  for(let j=0;j<=m;j++)for(let i=0;i<=n;i++){
   let x=kind===5?-1+2*i/n:Math.max(-.9999,Math.min(.9999,-1+2*(i+(mode===1?.22*(j%2):0))/(n+(mode===1?.22:0))));
   values.push(x,j/m,0,0);
  }
  if(mode===0)for(let j=0;j<m;j++)for(let i=0;i<n;i++){const k=j*(n+1)+i;indices.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1)}
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);
  let index=null;
  if(indices.length){index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW)}
  return {kind,mode,buffer,index,count:index?indices.length:values.length/4};
 }
 const glass=mesh(5,2,2,0),glowMid=mesh(8,96,12,0),glowBottom=mesh(9,96,12,0),glowSeam=mesh(10,96,8,0);
 const parts=[4,6,7,2,3].map(kind=>{
  const dims=kind===7?[52,20,78,28]:kind===2?[105,52,158,78]:kind===3?[112,30,170,44]:kind===4?[68,28,100,40]:[88,26,140,38];
  const n=mobile?dims[0]:dims[2],m=mobile?dims[1]:dims[3];
  return [mesh(kind,mobile?64:96,mobile?20:32,0),mesh(kind,n,m,1)];
 });
 function draw(obj){
  gl.uniform1f(uniform.uKind,obj.kind);gl.uniform1f(uniform.uMode,obj.mode);
  gl.bindBuffer(gl.ARRAY_BUFFER,obj.buffer);gl.enableVertexAttribArray(data);gl.vertexAttribPointer(data,4,gl.FLOAT,false,0,0);
  if(obj.index){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,obj.index);gl.drawElements(gl.TRIANGLES,obj.count,gl.UNSIGNED_SHORT,0)}
  else gl.drawArrays(gl.POINTS,0,obj.count);
 }
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
 return {render(size,phase,bass,mid,air){if(lost||gl.isContextLost())return null;if(canvas.width!==size||canvas.height!==size){canvas.width=canvas.height=size}gl.viewport(0,0,size,size);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform4f(uniform.uMusic,phase*.4,bass,mid,air);gl.uniform1f(uniform.uSize,size);for(const pair of parts){draw(pair[0]);draw(pair[1]);}gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);draw(glowBottom);draw(glowMid);draw(glowSeam);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);draw(glass);return gl.isContextLost()?null:canvas}};
}};
})();
