/* SEYVEO Living Handwriting · local, sampled vector letters (no font impersonation).
 * Pure geometry for the browser and Node tests. Never reads storage or edits Paper.
 */
((root,build)=>{
 const api=build();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SEYVEO_LIVING_HANDWRITING_CORE=api;
})(globalThis,()=>{
 'use strict';
 const WIDTH=320,HEIGHT=170,BASELINE=126,MAX_GLYPHS=100,MAX_VARIANTS=3;
 const LETTER=/^[а-яёa-z0-9.,!?:;+\-]$/i;
 const PAIR=/^[а-яёa-z]{2}$/i;
 const round=n=>Math.round(n*1000)/1000;
 const bounded=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
 const supported=character=>typeof character==='string'
  &&(LETTER.test(character)||PAIR.test(character));
 // Paper's top toolbar overlays the canvas. Give newly typeset ink comfortable
 // breathing room on both 1188px legacy pages and taller full-screen pages.
 const firstBaseline=height=>Math.max(350,Math.round((Number.isFinite(height)?height:1188)*.30));

 function makeGlyph(raw,{units=1}={}){
  if(units!==1&&units!==2)return null;
  if(!Array.isArray(raw)||!raw.length||raw.length>12)return null;
  let total=0,x0=WIDTH,y0=HEIGHT,x1=0,y1=0;
  const strokes=[];
  for(const stroke of raw){
   if(!Array.isArray(stroke)||!stroke.length||stroke.length>320)return null;
   total+=stroke.length;if(total>1500)return null;
   const points=[];
   for(const p of stroke){
    if(!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1])
     ||p[0]<0||p[0]>WIDTH||p[1]<0||p[1]>HEIGHT)return null;
    x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);
    y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);
    points.push([p[0],p[1],bounded(Number.isFinite(p[2])?p[2]:50,0,100)]);
   }
   strokes.push(points);
  }
  // One common sample baseline keeps dots, ascenders and descenders distinct.
  const span=Math.max(64,(x1-x0)/(units===2?3.4:1.7),(y1-y0)/1.55);
  return {
   ...(units===2?{units:2}:{}),
   advance:round(bounded((x1-x0+16)/span,.3,units===2?3.9:1.95)),
   strokes:strokes.map(stroke=>stroke.map(p=>[
    round((p[0]-x0)/span),round((p[1]-BASELINE)/span),Math.round(p[2])
   ]))
  };
 }

 function validGlyph(g,{units=1}={}){
  if(units!==1&&units!==2)return null;
  if(!g||typeof g!=='object'||!Number.isFinite(g.advance)
   ||g.advance<.3||g.advance>(units===2?3.9:1.95)
   ||(units===2?g.units!==2:g.units!==undefined&&g.units!==1)
   ||!Array.isArray(g.strokes)
   ||!g.strokes.length||g.strokes.length>12)return null;
  let total=0;
  const strokes=[];
  for(const stroke of g.strokes){
   if(!Array.isArray(stroke)||!stroke.length||stroke.length>320)return null;
   total+=stroke.length;if(total>1500)return null;
   const clean=[];
   for(const p of stroke){
    if(!Array.isArray(p)||p.length!==3
     ||!p.every(Number.isFinite)||p[0]<0||p[0]>(units===2?3.5:1.75)
     ||p[1]<-2||p[1]>.7||p[2]<0||p[2]>100)return null;
    clean.push(p.slice());
   }
   strokes.push(clean);
  }
  return {...(units===2?{units:2}:{}),advance:g.advance,strokes};
 }

 function variantsFor(input,{units=1}={}){
  const candidates=Array.isArray(input)?input:[input];
  if(candidates.length>MAX_VARIANTS)return [];
  return candidates.map(g=>validGlyph(g,{units})).filter(Boolean);
 }

 function cleanAlphabet(source){
  let input=source;
  if(typeof source==='string'){
   if(source.length>900000)return {};
   try{input=JSON.parse(source)}catch{return {}}
  }
  if(!input||input.version!==1||!input.glyphs||typeof input.glyphs!=='object'
   ||Array.isArray(input.glyphs))return {};
  const out={};
  for(const [key,glyph] of Object.entries(input.glyphs).slice(0,MAX_GLYPHS)){
   if(!supported(key))continue;
   const clean=variantsFor(glyph,{units:[...key].length});
   if(clean.length)out[key]=Array.isArray(glyph)?clean:clean[0];
  }
  return out;
 }

 function composeText(value,glyphs={}, {width=840,height=1188,left=70,baseline=175,
  size=53,color='#171e29',maxStrokes=200,maxPoints=5500}={}){
  const text=String(value||'').slice(0,240);
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<240||width>2000
   ||height<200||height>4000||!Number.isFinite(size)||size<18||size>90
   ||!Number.isFinite(left)||left<0||!Number.isFinite(baseline)||baseline<0
   ||!/^#[0-9a-f]{6}$/i.test(color)||!Number.isInteger(maxStrokes)||maxStrokes<1||maxStrokes>250
   ||!Number.isInteger(maxPoints)||maxPoints<1||maxPoints>11000)
   throw Error('invalid-composition-options');
  const missing=new Set(),strokes=[];
  const end=width-40,initial=left,lineStep=size*1.6;
  let cursor=left,base=baseline,lines=1,overflow=false,top=height,bottom=0,totalPoints=0;
  const line=()=>{cursor=initial;base+=lineStep;lines++};
  const characters=[...text];
  const usages=Object.create(null);
  const tokenAt=i=>{
   const pair=characters[i]+(characters[i+1]||'');
   const joined=PAIR.test(pair)?variantsFor(glyphs[pair],{units:2}):[];
   if(joined.length)return {key:pair,length:2,variants:joined};
   const key=characters[i];
   return {key,length:1,variants:variantsFor(glyphs[key],{units:1})};
  };
  for(let i=0;i<characters.length;){
   const char=characters[i];
   if(char==='\n'){line();i++;continue}
   if(char===' '||char==='\t'){
    cursor+=size*(char===' '?0.45:1.8);
    i++;continue;
   }
   // Respect word boundaries when paired handwritten samples are available.
   if(i===0||/[\s]/.test(characters[i-1])){
    let wordWidth=0;
    for(let j=i;j<characters.length&&!/\s/.test(characters[j]);){
     const token=tokenAt(j);
     wordWidth+=((token.variants[0]?.advance??.66)+.08)*size;
     j+=token.length;
    }
    if(cursor>initial&&cursor+wordWidth>end&&wordWidth<end-initial)line();
   }
   const token=tokenAt(i),{key}=token;
   const glyph=token.variants.length
    ?token.variants[(usages[key]||0)%token.variants.length]:null;
   if(glyph)usages[key]=(usages[key]||0)+1;
   const advance=(glyph?.advance??.66)*size+size*.08;
   if(cursor>initial&&cursor+advance>end)line();
   if(!glyph){missing.add(char);cursor+=advance;i++;continue}
   for(const segment of glyph.strokes){
    if(strokes.length>=maxStrokes||totalPoints+segment.length>maxPoints){overflow=true;break}
    const points=segment.map(([x,y,pressure])=>[
     Math.round((cursor+x*size)*10)/10,
     Math.round((base+y*size)*10)/10,
     pressure
    ]);
    for(const p of points){top=Math.min(top,p[1]);bottom=Math.max(bottom,p[1]);
     if(p[0]<0||p[0]>width||p[1]<0||p[1]>height)overflow=true;
    }
    strokes.push({tool:'pen',pressureSensitive:true,color,width:Math.max(2,round(size*.065)),points});
    totalPoints+=segment.length;
   }
   if(overflow)break;
   cursor+=advance;
   i+=token.length;
  }
  if(base+size*.35>height||strokes.length>maxStrokes)overflow=true;
  return {strokes,missing:[...missing],overflow,lines,top,bottom};
 }

 return Object.freeze({WIDTH,HEIGHT,BASELINE,MAX_GLYPHS,MAX_VARIANTS,supported,
  firstBaseline,makeGlyph,validGlyph,variantsFor,cleanAlphabet,composeText});
});
