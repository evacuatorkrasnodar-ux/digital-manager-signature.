/* SEYVEO Liquid Sound V68 · transverse silk weave and returning light · WebGL 1. */
(()=>{'use strict';
window.SEYVEO_LIQUID_GL={create(mobile){
 const canvas=document.createElement('canvas');
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:false,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
 if(!gl)return null;
 let lost=false;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true});
 const vs=`precision highp float;
attribute vec4 aData;
uniform vec4 uMusic; uniform mediump float uKind,uMode; uniform float uSize;
varying mediump vec2 vUV; varying mediump float vLight,vSheen;
const float PI=3.14159265;
// Shared cubic contours with continuous tangents at each join.
vec2 bez(vec2 a,vec2 b,vec2 c,vec2 d,float t){float q=1.0-t;return q*q*q*a+3.0*q*q*t*b+3.0*q*t*t*c+t*t*t*d;}
vec3 contour(float k,float u){
 vec2 l=vec2(-.864,.207),r=vec2(.961,-.045),m,c1,c2,c3,c4;float z;
 // Central ribbon: separate dip, crest and rounded return, traced in sphere-relative coordinates.
 if(k>.5&&k<2.5){
  bool nearEdge=k>1.5;
  // The two lips have distinct endpoints, so the turn has a finite width.
  vec2 leftLip=nearEdge?vec2(-.878,.248):vec2(-.865,.190);
  vec2 dip=nearEdge?vec2(-.245,.263):vec2(-.245,.085);
  vec2 crest=nearEdge?vec2(.790,-.225):vec2(.790,-.242);
  vec2 dDip=nearEdge?vec2(1.70,0.0):vec2(1.65,-.14);
  vec2 dCrest=vec2(.90,0.0);
  vec2 p;
  if(u<.46)p=bez(leftLip,nearEdge?vec2(-.885,.105):vec2(-.854,.025),dip-dDip*(.46/3.0),dip,u/.46);
  else if(u<.86){
   float t=(u-.46)/.40;
   p=bez(dip,dip+dDip*(.40/3.0),crest-dCrest*(.40/3.0),crest,t);
   // Broaden the ribbon through its center-right face, without breaking the shared contours.
   float b=sin(PI*t);p.y+=(nearEdge?.085:-.040)*b*b;
  }
  else p=bez(crest,crest+dCrest*(.14/3.0),vec2(.947,-.185),r,(u-.86)/.14);
  return vec3(p,(nearEdge?.38:.23)*sin(PI*u));
 }
 if(k<.5){m=vec2(.105,-.795);c1=vec2(-.695,.185);c2=vec2(-.450,-.795);c3=vec2(.660,-.795);c4=vec2(.88,-.43);z=-.13;}
 else if(k<3.5){m=vec2(.43,.55);c1=vec2(-.48,.19);c2=vec2(.060,.55);c3=vec2(.800,.55);c4=vec2(1.035,.20);z=-.09;}
 else {m=vec2(-.045,.785);c1=vec2(-.92,.47);c2=vec2(-.475,.785);c3=vec2(.385,.785);c4=vec2(1.02,.32);z=-.22;}
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
  vec2 join=vec2(-.936,-.015);
  vec2 outer=h<.5?bez(contour(0.0,0.0).xy,vec2(-.955,.15),vec2(-.976,.095),join,h*2.0):bez(join,vec2(-.866,-.205),vec2(-.44,-.765),contour(0.0,.50).xy,h*2.0-1.0);
  float flap=sin(PI*h);
  q.xy=mix(q.xy,outer,v);
  q.xy+=vec2(-.035,.010)*flap*sin(PI*v);
  q.z-=.24*flap*v;
  q.y+=sin(PI*u)*(.010+.035*mid)*sin(u*5.5+t*.65);
  q.z+=sin(PI*u)*.055*sin(t*.55+u*4.0)*(.30+mid);
  return q;
 }
 float f=sin(PI*v)*sin(PI*u),w=sin(PI*u);
 // Convex body: a smooth interior bulge, with zero displacement at every shared edge.
 p.z+=f*(k<.5?.52:k<1.5?.20:-.16);
 if(k<.5){
  p.xy+=f*vec2(.085*sin(PI*u-.65),-.085*(.65+.35*sin(PI*u)));
  p.x+=f*.018*sin(t*.32+PI*u);
 }else p.x+=f*(.035*sin(PI*u*2.0+t*.32)+.115*sin(PI*u*1.6-.35)*(k<1.5?-.50:-.65));
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
 float width=uKind<8.5?(.115+.018*sin(PI*u)):uKind<9.5?.125:.065;
 p.xy+=normal*(v*2.0-1.0)*width*(.72+.28*w);
 return p;
}
void main(){
 float x=aData.x,v=aData.y;vec3 p;vSheen=0.0;
 // Reparameterize the particle lattice without changing the continuous silk surface.
 if(uMode>.5&&uKind<6.5){
  float u=(x+1.0)*.5;
  // Spread the broad faces, compress the rows at the turning edges.
  if(uKind<2.5||uKind>3.5){
   float curved=.5-.5*cos(PI*v);
   v=mix(v,curved,uKind<2.5?.37:.32);
   float sweep=uKind<2.5?.12:uKind<4.5?-.20:.12;
   // A monotonic shear fans the rows out without zig-zagging the individual points.
   u+=sweep*sin(PI*u)*sin(PI*v)*(v-.24);
   if(uKind<2.5){
    // Smooth fan: arc the rows across the convex body, with more curvature toward the right turn.
    float fan=.085*sin(PI*u)-.10*sin(2.0*PI*u)*u;
    v+=fan*sin(PI*v);
   }
  }else{
   u-=.07*sin(PI*u)*sin(PI*v)*(v-.36);
  }
  x=clamp(2.0*u-1.0,-.9999,.9999);
 }
 if(uKind>4.5&&uKind<5.5){p=vec3(x*1.10,(2.0*v-1.0)*1.10,0.0);vLight=1.0;}
 else if(uKind>7.5){p=crease(x,v);vLight=1.0;}
 else {p=matter(x,v);vec3 dx=matter(clamp(x+.006,-.9999,.9999),v)-matter(clamp(x-.006,-.9999,.9999),v);vec3 dy=matter(x,min(1.0,v+.006))-matter(x,max(0.0,v-.006));vec3 n=cross(dx,dy);n/=length(n)+.000001;n*=n.z<0.0?-1.0:1.0;vLight=abs(n.z);vec3 lightDir=normalize(vec3(-.72,-.55,.65));vSheen=pow(max(0.0,dot(n,lightDir)),2.0);}
 float glass=step(4.5,uKind)*(1.0-step(5.5,uKind));
 float scale=.82*mix(.985,1.0,glass)*(1.0+mix(.015,.003,glass)*uMusic.y)*(1.0+.020*p.z);
 gl_Position=vec4(scale*vec2(p.x+.012*p.z,-p.y+.012*p.z),p.z*.3,1.0);
 gl_PointSize=clamp(uSize*(uKind>3.5?.0018:uKind<2.5?.00175:.0025+.00030*uMusic.w),1.15,3.3);
 vUV=vec2(x,v);
}
`;
 const fs=`precision mediump float;
uniform mediump float uKind,uMode; varying mediump vec2 vUV; varying mediump float vLight,vSheen;
float peak(float a,float c,float w){return exp(-(1.0-cos(a-c))/(w*w));}
float gauss(float x,float w){float q=x/w;return exp(-q*q);}
void main(){
 float x=vUV.x,v=vUV.y,alpha;vec3 col;
 if(uKind>4.5&&uKind<5.5){
  vec2 xy=1.10*vec2(x,2.0*v-1.0);float r=length(xy),a=atan(xy.y,xy.x+.00001);
  if(r>1.0){
   float glow=gauss(r-1.0,.045)*(.025+.38*peak(a,-2.16,.44)+.35*peak(a,1.30,.58));
   float floorGlow=gauss(xy.x,.43)*gauss(xy.y-1.041,.034)*.42+gauss(xy.x,.21)*gauss(xy.y-1.033,.013)*.40;
   glow=clamp(glow+floorGlow,0.0,.75);
   gl_FragColor=vec4(.10,.86,.88,glow);return;
  }
  float n=sqrt(max(0.0,1.0-r*r));
  float top=peak(a,-2.08,.61),bottom=peak(a,1.37,.57),right=peak(a,.60,.61),left=peak(a,2.85,.48);
  float lip=.21+.78*top+.77*bottom+.72*right+.29*left;
  float edge=gauss(r-.993,.0055),edgeSoft=gauss(r-.973,.021);
  float reflected=gauss(r-(.957-.064*top),.014+.030*top)*pow(top,1.8);
  // Broad curved softbox reflection: a distinct inner edge with a translucent tail.
  float innerArc=.945-.185*top;
  float crescent=smoothstep(innerArc-.008,innerArc+.008,r)*(1.0-smoothstep(.929,.975,r))*pow(top,1.35);
  float shoulder=peak(a,-1.05,.60)*gauss(r-.91,.045);
  float base=gauss(r-(.952-.048*bottom),.044)*bottom;
  float lowerLens=gauss(r-(.927-.035*bottom),.044)*peak(a,1.14,.80);
  float inner=gauss(r-.967,.008)*(.24+.45*right+.40*left);
  float fres=pow(max(0.0,1.0-n),3.0);
  float light=clamp(.58*reflected+1.38*edge*lip+.48*edgeSoft*lip+.55*base+.22*inner+.58*crescent+.38*lowerLens+.16*shoulder,0.0,1.0);
  float blueDepth=gauss(r-.91,.085)*(.55+.45*peak(a,-.75,.9));
  col=mix(vec3(.015,.39,.62),vec3(.05,.87,.94),clamp(light*1.65+.15*blueDepth,0.0,1.0));
  col=mix(col,vec3(.95,1.0,.99),smoothstep(.48,.99,light));
  alpha=clamp(.006+.085*fres+.95*light+.11*blueDepth,0.0,.98);
 }else if(uKind>7.5){
  float w=sin(3.14159265*(x+1.0)*.5);
  float tips=gauss(x+.87,.19)+gauss(x-.86,.20);
  float strength=uKind<8.5?(.25+.68*tips+.20*gauss(x-.05,.65)):uKind<9.5?(.79*gauss(x+.01,.19)+.10*gauss(x-.26,.40)):(.10+.24*tips);
  float g=gauss(v-.5,.055),soft=gauss(v-.5,.29);
  col=mix(vec3(.02,.91,.88),vec3(.88,1.0,.98),g*.78);
  float taper=smoothstep(0.0,.08,w);
  alpha=strength*(.36*g+.64*soft)*taper*(1.0-smoothstep(.46,.50,abs(v-.5)));
 }else{
  float tip=pow(abs(x),6.0),turn=pow(v,5.0),fres=1.0-vLight;
  float focus=gauss(x+.20,.78),edge=pow(v,20.0),start=pow(1.0-v,20.0);
  float tipGlow=gauss(x+.87,.16)+gauss(x-.86,.19);
  float leftTurn=gauss(x+.94,.15);
  float facing=clamp(vLight,0.0,1.0);
  float frontLight=.56+.44*gauss(x-.10,.88);
  // Directional silk sheen: light spreads along the cloth, not just its outline.
  float shoulderLight=gauss(x+.43,.64)*gauss(v-.48,.45);
  float highlight=clamp(vSheen,0.0,1.0);
  float silkLight=pow(v,2.4)*(.57+.43*gauss(x+.25,.70));
  float middleLight=gauss(v-.60,.44)*(.68+.32*gauss(x-.36,.52));
  // Translucent absorption masks rear particles under the near-facing silk.
  float bodyMask=smoothstep(0.0,.13,v)*smoothstep(0.0,.13,1.0-v)*smoothstep(0.0,.18,1.0-abs(x));
  col=mix(vec3(.08,.88,.88),vec3(.84,1.0,.98),clamp(.24*turn+.22*fres+.30*tip,0.0,1.0));
  if(uKind<2.5){float upperRim=pow(1.0-v,12.0);alpha=(.76+.14*v*v+.14*fres+.20*shoulderLight+.22*highlight+.12*upperRim)*frontLight*(1.0-.25*tip);col=mix(col,vec3(.62,1.0,.98),clamp(.24*shoulderLight+.16*silkLight+.50*highlight+.18*upperRim,0.0,1.0));}
  else if(uKind<3.5){alpha=(.84+.16*turn+.16*fres)*(1.0-.12*tip);col=mix(col,vec3(.83,1.0,.97),clamp(.24+.63*silkLight+.25*turn+.18*middleLight,0.0,1.0));}
  else if(uKind<4.5){alpha=(.36+.14*fres+.24*facing*gauss(x-.27,.71)+.20*highlight)*(1.0-.40*tip);col=mix(col,vec3(.32,1.0,.98),.28*highlight);}
  else alpha=(.31+.23*turn+.30*pow(v,2.3)*gauss(x+.10,.48)+.14*gauss(x-.25,.52)*v*v+.15*fres)*(1.0-.44*tip);
  if(uMode<.5){
   if(uKind<2.5){float rimLight=.20*pow(1.0-v,32.0)*(.55+.45*focus);alpha=.010+.025*fres+rimLight+.10*pow(v,4.0)*tipGlow+.035*shoulderLight;col=mix(col,vec3(.008,.045,.065),.84*bodyMask);alpha+=.16*bodyMask;}
   else if(uKind<3.5){alpha=clamp(.055+.64*edge+.30*start+.35*silkLight+.26*tipGlow+.14*leftTurn+.025*fres,0.0,.98);col=mix(vec3(.035,.87,.85),vec3(.95,1.0,.99),clamp(edge*.92+start*.38+tipGlow*.30+.24*leftTurn,0.0,1.0));}
   else if(uKind<4.5){float rim=.29*edge*gauss(x-.35,.78)+.16*pow(1.0-v,12.0)*(.55+.45*focus);alpha=.009+.019*fres+rim+.29*bodyMask;col=mix(vec3(.006,.045,.065),vec3(.07,.92,.89),clamp(rim*2.7+.12*highlight,0.0,1.0));}
   else {float low=gauss(x-.06,.21),sweep=gauss(x-.27,.49);float seam=pow(1.0-v,32.0)*(.25+.75*gauss(x-.40,.66));alpha=clamp(.016+.90*edge*low+.65*pow(v,2.4)*low+.27*start*gauss(x-.25,.76)+.28*pow(v,2.5)*sweep+.62*seam,0.0,.98);col=mix(vec3(.02,.89,.86),vec3(.88,1.0,.98),clamp(edge*(.90*low+.24*sweep)+.44*seam,0.0,1.0));}
  }
  if(uKind>6.5&&uKind<7.5){
   float taper=sin(3.14159265*(x+1.0)*.5);
   // The returning silk catches light across its width, with a bright fine fold.
   float foldLight=gauss(v-.50,.40)*gauss(x+.38,.74);
   float hem=gauss(v-.985,.055)*gauss(x+.25,.78);
   float join=gauss(v-.025,.065)*gauss(x+.52,.66);
   col=mix(vec3(.015,.78,.79),vec3(.73,1.0,.96),clamp(.48*foldLight+.70*hem+.55*join,0.0,1.0));
   alpha=(uMode<.5?(.020+.33*foldLight+.64*hem+.60*join):(.43+.48*foldLight+.40*hem))*taper;
  }
  if(uMode>.5&&uMode<1.5){float d=length(gl_PointCoord-.5);alpha*=exp(-d*d*5.2)*(1.0-smoothstep(.24,.50,d));}
  // Subtle individual silk filaments, confined to the turning central fold.
  if(uMode>1.5){float taper=pow(max(0.0,sin(3.14159265*(x+1.0)*.5)),.55);col=mix(vec3(.015,.74,.77),vec3(.55,1.0,.97),pow(v,2.0));alpha=(.035+.19*middleLight+.14*pow(v,5.0))*taper*(1.0-.65*smoothstep(.70,.90,x));}

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
   if(mode===1&&j>0&&(i===0||i===n))continue;
   let x=kind===5?-1+2*i/n:Math.max(-.9999,Math.min(.9999,-1+2*i/n));
   values.push(x,j/m,0,0);
  }
  if(mode===0)for(let j=0;j<m;j++)for(let i=0;i<n;i++){const k=j*(n+1)+i;indices.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1)}
  if(mode===2)for(let i=1;i<n;i++)for(let j=0;j<m;j++){const k=j*(n+1)+i;indices.push(k,k+n+1)}
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);
  let index=null;
  if(indices.length){index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW)}
  return {kind,mode,buffer,index,count:index?indices.length:values.length/4};
 }
 const glass=mesh(5,2,2,0),glowMid=mesh(8,96,12,0),glowBottom=mesh(9,96,12,0),glowSeam=mesh(10,96,8,0);
 // Four distinct cloth intervals: 2=0..1, 3=1..2, 4=2..3, 6=3..4; 7 is the shoulder.
 // Back-to-front compositing keeps the lower returning silk behind the broad face.
 const parts=[6,4,7,2,3].map(kind=>{
  const dims=kind===7?[58,24,88,36]:kind===2?[94,32,144,46]:kind===3?[110,36,152,52]:kind===4?[90,27,132,38]:[78,35,114,48];
  const n=mobile?dims[0]:dims[2],m=mobile?dims[1]:dims[3];
  const layers=[mesh(kind,mobile?64:96,mobile?20:32,0)];
  if(kind===3)layers.push(mesh(kind,n,mobile?14:22,2));
  layers.push(mesh(kind,n,m,1));return layers;
 });
 function draw(obj){
  gl.uniform1f(uniform.uKind,obj.kind);gl.uniform1f(uniform.uMode,obj.mode);
  gl.bindBuffer(gl.ARRAY_BUFFER,obj.buffer);gl.enableVertexAttribArray(data);gl.vertexAttribPointer(data,4,gl.FLOAT,false,0,0);
  if(obj.index){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,obj.index);gl.drawElements(obj.mode===2?gl.LINES:gl.TRIANGLES,obj.count,gl.UNSIGNED_SHORT,0)}
  else gl.drawArrays(gl.POINTS,0,obj.count);
 }
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
 return {render(size,phase,bass,mid,air){if(lost||gl.isContextLost())return null;if(canvas.width!==size||canvas.height!==size){canvas.width=canvas.height=size}gl.viewport(0,0,size,size);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform4f(uniform.uMusic,phase*.4,bass,mid,air);gl.uniform1f(uniform.uSize,size);for(const layers of parts)for(const layer of layers)draw(layer);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);draw(glowBottom);draw(glowMid);draw(glowSeam);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);draw(glass);return gl.isContextLost()?null:canvas}};
}};
})();
