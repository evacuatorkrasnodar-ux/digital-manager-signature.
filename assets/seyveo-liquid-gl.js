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
vec3 matter(float x,float v){
 float t=uMusic.x,mid=uMusic.z,e=sqrt(max(0.0,1.0-x*x));
 float wave=.025*sin(t*.65+x*2.7)+.045*mid*sin(x*3.1+t);
 float hook=exp(-((x+.78)/.27)*((x+.78)/.27));
 float up=e*(-.105-.16*hook+.035*x+wave);
 float down=e*(.17+.12*exp(-((x+.34)/.50)*((x+.34)/.50))-.08*x+wave);
 float seam=mix(down,e*.90,.44+.34*x);
 float f=sin(PI*v),y,z;
 if(uKind<2.5){y=mix(-e*.98,up,v)+e*.10*f*f*sin(x*2.4+.8+t*.45);z=.48*e*f;x+=.036*e*f*sin(x*1.9+t*.55);}
 else if(uKind<3.5){y=mix(up,down,v+.08*f);z=e*.42*f;x+=e*(.09+.025*mid)*f*(.74-.26*x);}
 else if(uKind<4.5){y=mix(down,seam,v)+e*.045*f*sin(x*2.0+t*.4);z=-.35*e*f;}
 else {y=mix(seam,e*.98,v);z=-.22*e*f;x+=.032*e*f;}
 float a=-.28+.035*sin(t*.7),c=cos(a),s=sin(a);
 return vec3(.875*vec2(x*c-y*s,x*s+y*c),z);
}
void main(){
 float x=aData.x,v=aData.y;vec3 p;
 if(uKind>4.5&&uKind<5.5){p=vec3(x,2.0*v-1.0,0.0);vLight=1.0;}
 else {p=matter(x,v);vec3 dx=matter(clamp(x+.006,-.9999,.9999),v)-matter(clamp(x-.006,-.9999,.9999),v);vec3 dy=matter(x,min(1.0,v+.006))-matter(x,max(0.0,v-.006));vec3 n=cross(dx,dy);vLight=abs(n.z)/(length(n)+.000001);}
 float glass=step(4.5,uKind)*(1.0-step(5.5,uKind));
 float scale=.82*(1.0+mix(.025,.003,glass)*uMusic.y)*(1.0+.020*p.z);
 gl_Position=vec4(scale*vec2(p.x+.012*p.z,-p.y+.012*p.z),p.z*.3,1.0);
 gl_PointSize=clamp(uSize*(uKind>3.5?.0026:.0034+.00035*uMusic.w),2.3,3.8);
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
  float lip=.22+.78*top+.95*bottom+.68*right+.32*left;
  float edge=gauss(r-.994,.007),edgeSoft=gauss(r-.977,.018);
  float reflected=gauss(r-(.925-.065*top),.026+.024*top)*top;
  float base=gauss(r-(.940-.035*bottom),.035)*bottom;
  float inner=gauss(r-.967,.008)*(.24+.45*right+.40*left);
  float fres=pow(max(0.0,1.0-n),3.0);
  float light=clamp(1.25*reflected+1.12*edge*lip+.40*edgeSoft*lip+.83*base+.21*inner,0.0,1.0);
  col=mix(vec3(.07,.53,.57),vec3(.91,1.0,.99),clamp(light*1.12,0.0,1.0));
  alpha=clamp(.010+.16*fres+.90*light,0.0,.97);
 }else{
  float tip=pow(abs(x),7.0),turn=pow(v,5.0),fres=1.0-vLight;
  col=mix(vec3(.24,.83,.76),vec3(.86,1.0,.96),clamp(.32*turn+.22*fres+.18*tip,0.0,1.0));
  if(uKind<2.5)alpha=(.28+.25*v*v+.14*fres)*(1.0-.45*tip);
  else if(uKind<3.5){alpha=(.42+.47*turn+.16*fres)*(1.0-.17*tip);col=mix(col,vec3(.78,1.0,.94),turn*.75);}
  else if(uKind<4.5)alpha=.18+.17*fres;
  else alpha=.15+.36*turn+.12*fres;
  if(uMode<.5){
   if(uKind<2.5)alpha=.012+.025*fres;
   else if(uKind<3.5)alpha=.025+.34*pow(v,16.0)+.10*pow(1.0-v,16.0)+.035*fres;
   else if(uKind<4.5)alpha=.012+.018*fres;
   else alpha=.018+.42*pow(v,18.0)*exp(-((x+.08)/.60)*((x+.08)/.60))+.10*pow(1.0-v,12.0);
  }else if(uMode<1.5){float d=length(gl_PointCoord-.5);alpha*=exp(-d*d*12.0)*(1.0-smoothstep(.34,.50,d));}
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
