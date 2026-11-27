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
 float peak(float a,float c,float w){return exp(-(1.0-cos(a-c))/(w*w));}
 vec3 shell(float a,float v){
  float t=uMusic.x, mid=uMusic.z;
  float lip=aData.z,back=aData.w;
  float knot=peak(a,-1.02,.21),r;
  if(uKind<.5)r=mix(back,lip,v)+(.024+.009*mid)*knot*sin(PI*v);
  else r=.753+.007*sin(2.0*a+t)+(.052*peak(a,-1.85,.54)-(.107+.012*mid)*peak(a,1.52,.40)+.045*peak(a,1.49,.12))*v+.016*peak(a,1.49,.12)*sin(PI*v);
  float bend=sin(PI*v),z=.19*bend*cos(a+.8)+.09*sin(2.0*a+.7)*v;
  if(uMode>2.5){r=(uKind<.5?lip:.753+.007*sin(2.0*a+t))+(v-.5)*.021;z=uKind<.5?.09*sin(2.0*a+.7):0.0;bend=0.0;}
  float theta=a+.018*bend*sin(2.0*a+t)+.028*sin(t*.55);
  return vec3(r*cos(theta),r*sin(theta),z);
 }
 vec3 fabric(float x,float v){
  float t=uMusic.x,mid=uMusic.z,e=sqrt(max(0.0,1.0-x*x));
  float curl=exp(-((x+.73)/.30)*((x+.73)/.30));
  float wave=.025*sin(t*.65+x*2.7)+.035*mid*sin(x*3.1+t);
  float up=e*(-.16-.105*curl+.035*x+wave);
  float down=e*(.16+.135*exp(-((x+.36)/.53)*((x+.36)/.53))-.08*x+wave);
  float f=sin(PI*v),y,z;
  if(uKind<2.5){y=mix(-e*.97,up,v)+e*.07*f*f*sin(x*2.4+.8+t*.45);z=.47*e*f; x+=.032*e*f*sin(x*1.9+t*.55);}
  else if(uKind<3.5){y=mix(up,down,v+.08*f);z=e*.40*f; x+=e*(.075+.025*mid)*f*(.74-.26*x);}
  else {y=mix(down,e*.96,v)+e*.08*f*sin(x*2.3+t*.4);z=-.38*e*f;}
  float angle=-.27+.035*sin(t*.7),c=cos(angle),s=sin(angle);
  return vec3(.865*vec2(x*c-y*s,x*s+y*c),z);
 }
 void main(){
  float a=aData.x,v=aData.y; vec3 p;
  if(uKind<1.5){p=shell(a,v);vec3 d1=shell(a+.006,v)-shell(a-.006,v);vec3 d2=shell(a,min(1.0,v+.006))-shell(a,max(0.0,v-.006));vec3 n=cross(d1,d2);vLight=abs(n.z)/(length(n)+.000001);}
  else if(uKind<4.5){p=fabric(a,v);vLight=1.0;}else{p=vec3(a,2.0*v-1.0,0.0);vLight=1.0;}
  float scale=.82*(1.0+(uKind<1.5||uKind>4.5?.009:.027)*uMusic.y)*(1.0+.020*p.z);
  gl_Position=vec4(scale*vec2(p.x+.012*p.z,-p.y+.012*p.z),p.z*.3,1.0);
  gl_PointSize=clamp(uSize*(uKind>3.5?.0021:.0030+.00035*uMusic.w),2.0,3.2);
  vUV=vec2(a,v);
 }
 `;
 const fs=`precision mediump float;
 uniform mediump float uKind,uMode; varying mediump vec2 vUV; varying mediump float vLight;
 float peak(float a,float c,float w){return exp(-(1.0-cos(a-c))/(w*w));}
 void main(){
  float a=vUV.x,v=vUV.y,alpha; vec3 col;
  if(uKind>4.5){
   vec2 xy=vec2(a,2.0*v-1.0);float r=length(xy),ang=atan(xy.y,xy.x);
   if(r>1.0)discard;
   float n=sqrt(max(0.0,1.0-r*r));
   float fres=pow(1.0-n,2.4);
   float top=peak(ang,-2.05,.51),right=peak(ang,.65,.56),bottom=peak(ang,1.50,.50);
   float edge=exp(-pow((r-.988)/.011,2.0));
   float halo=exp(-pow((r-.956)/.035,2.0));
   float light=clamp(.17+.85*top+.80*right+.76*bottom,0.0,1.0);
   col=mix(vec3(.10,.63,.66),vec3(.86,1.0,.98),clamp(edge*.8+.20*light,0.0,1.0));
   alpha=clamp(.012+.10*fres+.30*halo*light+.75*edge*light,0.0,.96);
  }else if(uKind<1.5){
   float rim=uKind<.5?v:1.0-v;
   float upper=peak(a,-2.16,.60),right=peak(a,.58,.68),bottom=peak(a,1.53,.47),left=peak(a,2.77,.40),shoulder=peak(a,-.82,.22);
   float light=uKind<.5?clamp(.05+.95*upper+.90*right+.83*bottom+.31*left+.40*shoulder,0.0,1.0):clamp(.24+.78*peak(a,-1.85,.60)+.78*bottom,0.0,1.0);
   float spec=pow(rim,2.8),body=sin(3.14159265*v),fres=1.0-vLight;
   col=mix(vec3(.22,.96,.83),vec3(.90,1.0,.97),clamp(spec*.78+.12*fres,0.0,1.0));
   alpha=clamp(light*(.025+.30*body+.76*spec)*(.74+.26*fres),0.0,.90);
   if(uMode>2.5){float k=(v-.5)/.19;float g=exp(-k*k);col=mix(vec3(.30,.95,.83),vec3(.95,1.0,.98),g);alpha=(uKind<.5?light:.95)*(.22*exp(-k*k*.22)+.76*g);}
   else if(uMode>1.5){col=vec3(.93,1.0,.98);alpha=uKind<.5?clamp(.12+.88*light,0.0,1.0):.94;}
   else if(uMode>.5){alpha=.13*light;col=vec3(.72,1.0,.93);}
  }else{
   float tip=pow(abs(a),7.0),near=peak(a,-.75,.65);
   col=mix(vec3(.36,.79,.73),vec3(.78,1.0,.94),clamp(.40*v+.32*tip,0.0,1.0));
   if(uKind<2.5)alpha=(.20+.22*v*v)*(1.0-.35*tip);
   else if(uKind<3.5){float turn=pow(v,5.0);alpha=(.26+.60*turn+.13*near)*(1.0-.16*tip);col=mix(col,vec3(.72,1.0,.94),turn*.75);}
   else alpha=.12+.09*pow(v,6.0);
   if(uMode<.5){alpha=uKind<3.5?.025+.10*pow(v,5.0):.025;}
  }
  if(uMode>.5&&uMode<1.5){float d=length(gl_PointCoord-.5);alpha*=.76*exp(-d*d*22.0)*(1.0-smoothstep(.36,.50,d));}
  gl_FragColor=vec4(col,alpha);
 }
 `;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(log)}return s}
 let vertex,fragment,program;
 try{vertex=shader(gl.VERTEX_SHADER,vs);fragment=shader(gl.FRAGMENT_SHADER,fs);program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}catch(e){if(vertex)gl.deleteShader(vertex);if(fragment)gl.deleteShader(fragment);if(program)gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();throw e}
 gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);
 const data=gl.getAttribLocation(program,'aData'),uniform={};for(const k of ['uMusic','uKind','uMode','uSize'])uniform[k]=gl.getUniformLocation(program,k);
 const profiles=[[.997,.996,.966,.982,.996,.994,.973,.981,.981,.989,.969,.965,.950,.912,.884,.872,.890,.911,.901,.832,.813,.935,.993,.996],[.90,.914,.935,.947,.951,.942,.917,.927,.953,.930,.899,.997,1,1,1,1,1,1,1,1,1,.999,.930,.909]];
 function profile(arr,a){const z=a/(2*Math.PI)*arr.length,i=Math.floor(z),f=z-i,n=arr.length,g=k=>arr[(i+k+n)%n],A=g(-1),B=g(0),C=g(1),D=g(2);return B+.5*f*(C-A+f*(2*A-5*B+4*C-D+f*(3*(B-C)+D-A)))}
 function mesh(kind,n,m,mode){const values=[],indices=[];for(let j=0;j<=m;j++)for(let i=0;i<=n;i++){let a=kind<2?i/n*Math.PI*2:-1+2*(i+.22*(j%2))/(n+.22);if(kind>=2&&kind<5)a=Math.max(-.9999,Math.min(.9999,a));if(kind===5)a=-1+2*i/n;const v=j/m;values.push(a,v,kind===0?profile(profiles[0],a):0,kind===0?profile(profiles[1],a):0)}if(mode===0)for(let j=0;j<m;j++)for(let i=0;i<n;i++){const k=j*(n+1)+i;indices.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1)}const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);let index=null;if(indices.length){index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW)}return {kind,mode,buffer,index,count:index?indices.length:values.length/4,n,m}}
 const outerEdge=mesh(0,mobile?144:216,12,0),glass=mesh(5,2,2,0),foldVeil=mesh(3,80,20,0),backVeil=mesh(4,64,16,0);
 const outer=mesh(0,mobile?144:216,mobile?24:36,0),upper=mesh(2,mobile?105:158,mobile?52:78,1),fold=mesh(3,mobile?112:170,mobile?30:44,1),back=mesh(4,mobile?48:72,mobile?18:26,1);
 function draw(obj,mode=obj.mode){gl.uniform1f(uniform.uKind,obj.kind);gl.uniform1f(uniform.uMode,mode);gl.bindBuffer(gl.ARRAY_BUFFER,obj.buffer);gl.enableVertexAttribArray(data);gl.vertexAttribPointer(data,4,gl.FLOAT,false,0,0);if(mode===0||mode===3){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,obj.index);gl.drawElements(gl.TRIANGLES,obj.count,gl.UNSIGNED_SHORT,0)}else if(mode===2){gl.drawArrays(gl.LINE_STRIP,obj.kind===0?obj.m*(obj.n+1):0,obj.n+1)}else gl.drawArrays(gl.POINTS,0,obj.index?(obj.n+1)*(obj.m+1):obj.count)}
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
 return {render(size,phase,bass,mid,air){if(lost||gl.isContextLost())return null;if(canvas.width!==size||canvas.height!==size){canvas.width=canvas.height=size}gl.viewport(0,0,size,size);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform4f(uniform.uMusic,phase*.4,bass,mid,air);gl.uniform1f(uniform.uSize,size);draw(backVeil);draw(back);draw(upper);draw(foldVeil);draw(fold);draw(outer);draw(outerEdge,3);draw(glass);return gl.isContextLost()?null:canvas}};
}};
})();
