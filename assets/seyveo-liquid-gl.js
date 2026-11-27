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
 if(k<.5){m=vec2(-.04,-.794);c1=vec2(-1.04,-.10);c2=vec2(-.49,-.80);c3=vec2(.41,-.788);c4=vec2(.75,-.53);z=-.13;}
 else if(k<1.5){m=vec2(-.08,.055);c1=vec2(-.72,.026);c2=vec2(-.40,.11);c3=vec2(.32,-.010);c4=vec2(.72,-.29);z=.23;}
 else if(k<2.5){m=vec2(-.08,.255);c1=vec2(-.70,.086);c2=vec2(-.43,.32);c3=vec2(.27,.190);c4=vec2(.70,-.31);z=.38;}
 else if(k<3.5){m=vec2(.13,.478);c1=vec2(-.55,.29);c2=vec2(-.25,.43);c3=vec2(.51,.526);c4=vec2(.96,.30);z=-.09;}
 else {m=vec2(-.04,.785);c1=vec2(-.90,.40);c2=vec2(-.43,.79);c3=vec2(.35,.78);c4=vec2(.91,.40);z=-.22;}
 vec2 p=u<.5?bez(l,c1,c2,m,u*2.0):bez(m,c3,c4,r,u*2.0-1.0);
 return vec3(p,z*sin(PI*u));
}
vec3 matter(float x,float v){
 float u=(x+1.0)*.5,t=uMusic.x,mid=uMusic.z;
 float k=uKind<2.5?0.0:uKind<3.5?1.0:uKind<4.5?2.0:3.0;
 vec3 p=mix(contour(k,u),contour(k+1.0,u),v);
 float f=sin(PI*v)*sin(PI*u),w=sin(PI*u);
 p.z+=f*(k<.5?.22:k<1.5?.15:-.11);
 p.x+=.035*f*sin(PI*u*2.0+t*.32);
 p.y+=w*(.010+.035*mid)*sin(u*5.5+t*.65)+.016*f*sin(u*8.0-t*.4);
 p.z+=w*.055*sin(t*.55+u*4.0)*( .30+mid);
 return p;
}
void main(){
 float x=aData.x,v=aData.y;vec3 p;
 if(uKind>4.5&&uKind<5.5){p=vec3(x,2.0*v-1.0,0.0);vLight=1.0;}
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
  vec2 xy=vec2(x,2.0*v-1.0);float r=length(xy),a=atan(xy.y,xy.x+.00001);
  if(r>1.0)discard;
  float n=sqrt(max(0.0,1.0-r*r));
  float top=peak(a,-2.16,.47),bottom=peak(a,1.37,.47),right=peak(a,.60,.55),left=peak(a,2.85,.48);
  float lip=.13+.87*top+.95*bottom+.68*right+.22*left;
  float edge=gauss(r-.994,.007),edgeSoft=gauss(r-.977,.018);
  float reflected=gauss(r-(.920-.076*top),.020+.032*top)*top;
  float base=gauss(r-(.940-.055*bottom),.043)*bottom;
  float inner=gauss(r-.967,.008)*(.24+.45*right+.40*left);
  float fres=pow(max(0.0,1.0-n),3.0);
  float light=clamp(1.25*reflected+1.12*edge*lip+.40*edgeSoft*lip+.83*base+.21*inner,0.0,1.0);
  col=mix(vec3(.025,.55,.65),vec3(.93,1.0,.99),smoothstep(.28,1.0,light));
  alpha=clamp(.008+.10*fres+.96*light,0.0,.98);
 }else{
  float tip=pow(abs(x),6.0),turn=pow(v,5.0),fres=1.0-vLight;
  float focus=gauss(x+.20,.78),edge=pow(v,20.0),start=pow(1.0-v,20.0);
  col=mix(vec3(.10,.82,.83),vec3(.76,1.0,.98),clamp(.24*turn+.18*fres+.30*tip,0.0,1.0));
  if(uKind<2.5)alpha=(.33+.23*v*v+.09*fres)*(1.0-.65*tip);
  else if(uKind<3.5){alpha=(.56+.40*turn+.12*fres)*(1.0-.35*tip);col=mix(col,vec3(.80,1.0,.97),turn*.85);}
  else if(uKind<4.5)alpha=(.10+.08*fres)*(1.0-.75*tip);
  else alpha=(.12+.30*turn+.10*fres)*(1.0-.67*tip);
  if(uMode<.5){
   if(uKind<2.5)alpha=.009+.025*fres+.07*start*focus;
   else if(uKind<3.5){alpha=.035+.79*edge+.32*start+.14*pow(v,5.0)+.025*fres;col=mix(vec3(.04,.77,.78),vec3(.91,1.0,.99),clamp(edge*.9+start*.38,0.0,1.0));}
   else if(uKind<4.5)alpha=.009+.019*fres+.065*edge*focus;
   else {alpha=.012+.76*edge*gauss(x+.10,.60)+.24*pow(v,6.0)*focus+.12*start;col=mix(vec3(.02,.66,.72),vec3(.72,1.0,.96),edge*.85);}
  }else if(uMode<1.5){float d=length(gl_PointCoord-.5);alpha*=exp(-d*d*8.0)*(1.0-smoothstep(.34,.50,d));}

 }
 gl_FragColor=vec4(col,alpha);
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
 const glass=mesh(5,2,2,0);
 const parts=[4,6,2,3].map(kind=>{
  const dims=kind===2?[105,52,158,78]:kind===3?[112,30,170,44]:kind===4?[68,28,100,40]:[88,26,140,38];
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
 return {render(size,phase,bass,mid,air){if(lost||gl.isContextLost())return null;if(canvas.width!==size||canvas.height!==size){canvas.width=canvas.height=size}gl.viewport(0,0,size,size);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform4f(uniform.uMusic,phase*.4,bass,mid,air);gl.uniform1f(uniform.uSize,size);for(const pair of parts){draw(pair[0]);draw(pair[1]);}draw(glass);return gl.isContextLost()?null:canvas}};
}};
})();
