/* SEYVEO Painting · deterministic Canvas 2D brush / airbrush / oil strokes.
 * No remote textures, no random per-frame output, no offscreen full-canvas
 * layers. Stroke geometry is saved by the existing Paper engine. */
(function(root){
 'use strict';
 const KINDS=new Set(['brush','spray','oil']);
 const stamps=new Map();
 const cap=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
 const colorOf=s=>/^#[0-9a-f]{6}$/i.test(s?.color||'')?s.color:'#171e29';
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const rgba=(hex,alpha)=>{
  const [r,g,b]=rgb(hex);return 'rgba('+r+','+g+','+b+','+cap(alpha,0,1)+')';
 };
 const blend=(hex,target,t)=>{
  const c=rgb(hex);return 'rgb('+c.map(v=>Math.round(v+(target-v)*t)).join(',')+')';
 };
 const alphaOf=s=>cap(Number.isFinite(s?.opacity)?s.opacity:(s.tool==='spray'?.48:s.tool==='oil'?.94:.8),.1,1);
 const widthOf=(s,p)=>{
  const base=cap(Number(s.width)||15,1,90);
  const press=s.pressureSensitive?cap((p?.[2]??50)/100,0,1):.5;
  return base*(s.pressureSensitive?.6+.8*press:1);
 };
 const grad=(ctx,s)=>{
  if(Array.isArray(s.gradient)&&s.gradient.length===2&&s.gradient.every(c=>/^#[0-9a-f]{6}$/i.test(c))){
   const g=ctx.createLinearGradient(0,0,840,0);
   g.addColorStop(0,s.gradient[0]);g.addColorStop(1,s.gradient[1]);return g;
  }
  return colorOf(s);
 };
 function line(ctx,a,b,width,style,alpha){
  ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);
  ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=Math.max(.5,width);
  ctx.globalAlpha=alpha;ctx.strokeStyle=style;ctx.stroke();
 }
 function brush(ctx,s,a,b){
  const width=(widthOf(s,a)+widthOf(s,b))/2,opacity=alphaOf(s);
  const color=grad(ctx,s);
  // Translucent feathered edge around a denser pigment centre.
  line(ctx,a,b,width*1.22,color,opacity*.16);
  line(ctx,a,b,width,color,opacity*.35);
  line(ctx,a,b,width*.76,color,opacity*.58);
  line(ctx,a,b,width*.35,color,opacity*.26);
 }
 function sprayStamp(color){
  if(stamps.has(color))return stamps.get(color);
  const tile=document.createElement('canvas');tile.width=80;tile.height=80;
  const c=tile.getContext('2d');
  if(c){
   const g=c.createRadialGradient(40,40,0,40,40,40);
   g.addColorStop(0,rgba(color,.17));
   g.addColorStop(.27,rgba(color,.13));
   g.addColorStop(.65,rgba(color,.055));
   g.addColorStop(1,rgba(color,0));
   c.fillStyle=g;c.fillRect(0,0,80,80);
  }
  if(stamps.size>=36)stamps.clear();
  stamps.set(color,tile);return tile;
 }
 function spray(ctx,s,a,b,dot=false){
  const width=(widthOf(s,a)+widthOf(s,b))/2,alpha=alphaOf(s);
  const color=colorOf(s),sprite=sprayStamp(color);
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  const spacing=Math.max(3,width*.23),n=dot?0:Math.min(150,Math.max(1,Math.ceil(length/spacing)));
  ctx.globalAlpha=alpha;
  for(let i=0;i<=n;i++){
   const t=n?i/n:0;
   const x=a[0]+dx*t,y=a[1]+dy*t;
   const w=width*(s.pressureSensitive?.85+.3*cap(((a[2]||50)*(1-t)+(b[2]||50)*t)/100,0,1):1);
   ctx.drawImage(sprite,x-w/2,y-w/2,w,w);
  }
 }
 function oil(ctx,s,a,b,dot=false){
  const opacity=alphaOf(s),width=(widthOf(s,a)+widthOf(s,b))/2;
  const base=colorOf(s);
  const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.max(.001,Math.hypot(dx,dy));
  const nx=-dy/len,ny=dx/len;
  if(dot){const radius=Math.max(1,width/2);ctx.beginPath();ctx.arc(a[0],a[1],radius,0,Math.PI*2);ctx.fillStyle=base;ctx.globalAlpha=opacity;ctx.fill();return;}
  const move=(shift)=>[[a[0]+nx*shift,a[1]+ny*shift],[b[0]+nx*shift,b[1]+ny*shift]];
  // Impression of pigmented impasto: dark edge, opaque body, raised bristles
  // and a narrow light-catching ridge. This is 2D relief, not fluid physics.
  const shadow=move(width*.11),light=move(-width*.1);
  line(ctx,shadow[0],shadow[1],width*.98,blend(base,0,.28),opacity*.57);
  line(ctx,a,b,width*.9,grad(ctx,s),opacity);
  line(ctx,light[0],light[1],width*.67,blend(base,255,.1),opacity*.66);
  const lanes=[-.28,-.12,.08,.22,.35];
  for(let i=0;i<lanes.length;i++){
   const p=move(width*lanes[i]);
   line(ctx,p[0],p[1],Math.max(.65,width*(i%2?.025:.042)),
    i%2?blend(base,0,.22):blend(base,255,.36),opacity*(i%2?.35:.48));
  }
 }
 function segment(ctx,s,a,b,dot=false){
  if(!KINDS.has(s?.tool)||!a||!b)return false;
  ctx.save();ctx.globalCompositeOperation='source-over';
  if(s.tool==='brush')dot?oil(ctx,{...s,tool:'oil'},a,a,true):brush(ctx,s,a,b);
  else if(s.tool==='spray')spray(ctx,s,a,b,dot);
  else oil(ctx,s,a,b,dot);
  ctx.restore();return true;
 }
 function stroke(ctx,s){
  if(!KINDS.has(s?.tool)||!Array.isArray(s.points)||!s.points.length)return false;
  const pts=s.points;
  if(pts.length===1){segment(ctx,s,pts[0],pts[0],true);return true;}
  for(let i=1;i<pts.length;i++)segment(ctx,s,pts[i-1],pts[i]);
  return true;
 }
 root.SEYVEO_PAINT_BRUSHES=Object.freeze({supports:kind=>KINDS.has(kind),segment,stroke});
})(window);
