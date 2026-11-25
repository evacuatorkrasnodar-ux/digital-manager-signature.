/* SEYVEO: reusable local signature editor. No network, no certificate. */
(()=>{'use strict';
const cache=new Map();
const stylusPressure=e=>e.pointerType==='pen'&&Number.isFinite(e.pressure)?Math.max(.12,Math.min(1,e.pressure)):.5;
const stylusWeight=p=>.35+1.3*(Number.isFinite(p)?p:.5);
const stylusSamples=e=>{const a=typeof e.getCoalescedEvents==='function'?e.getCoalescedEvents():[];return a.length?[...a,e]:[e];};
const palmTouch=(e,until)=>e.pointerType==='touch'&&(Date.now()<until||Math.max(e.width||0,e.height||0)>27);

const el=(tag,cls='',text='')=>{const e=document.createElement(tag);e.className=cls;e.textContent=text;return e;};
const canvas=(w,h)=>{const c=el('canvas');c.width=w;c.height=h;return c;};
function button(text,fn){const b=el('button','',text);b.type='button';b.onclick=fn;return b;}
function open(source,{area}={}){
 if(!source?.width||!source?.height)return Promise.resolve(null);
 const scope=['personal','business'].includes(area)?area:null;
 return new Promise(resolve=>{
  const d=el('dialog','sv-sign-dialog'),head=el('header'),title=el('strong','','Подпись'),stage=el('div','sv-sign-stage'),rail=el('div','sv-sign-rail');
  d.setAttribute('aria-label','Рукописная подпись');
  let phase='draw',result=null,strokes=[],ink='#17447d',pointer=null,penUntil=0,pointerKind='',markImage=null,pos=null,observer=null;
  const pad=canvas(1000,360);pad.className='sv-sign-pad';pad.setAttribute('aria-label','Нарисуйте подпись пальцем');
  const ctx=pad.getContext('2d'),remember=el('input');remember.type='checkbox';
  const label=el('label','sv-sign-remember');label.append(remember,el('span','','Запомнить до закрытия приложения'));
  const back=button('‹',()=>{if(phase==='place')draw();else d.close();});back.setAttribute('aria-label','Назад');
  const done=button('✓',()=>{if(phase==='draw'){if(strokes.length)place();return;}result={image:markImage,...pos};if(scope){if(remember.checked)cache.set(scope,{strokes:strokes.map(s=>s.map(p=>({...p}))),ink});else cache.delete(scope);}d.close();});done.setAttribute('aria-label','Готово');
  head.append(back,title,done);d.append(head,stage,rail);document.body.append(d);
  function paint(){ctx.clearRect(0,0,pad.width,pad.height);ctx.strokeStyle=ink;ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';for(const s of strokes){for(let j=0;j<s.length;j++){const a=s[Math.max(0,j-1)],b=s[j];ctx.lineWidth=5*stylusWeight((a.p+b.p)/2);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x+(j===0?.01:0),b.y);ctx.stroke();}}done.disabled=!strokes.length;}
  function point(e){const r=pad.getBoundingClientRect();return {x:Math.max(0,Math.min(pad.width,(e.clientX-r.left)*pad.width/r.width)),y:Math.max(0,Math.min(pad.height,(e.clientY-r.top)*pad.height/r.height)),p:stylusPressure(e)};}
  pad.onpointerdown=e=>{if(e.pointerType==='pen'){penUntil=Date.now()+2800;if(pointer!==null&&pointerKind==='touch'){strokes.pop();pointer=null;}}if(pointer!==null||!e.isPrimary||e.button!==0||palmTouch(e,penUntil))return;e.preventDefault();pointer=e.pointerId;pointerKind=e.pointerType;pad.setPointerCapture?.(pointer);strokes.push([point(e)]);paint();};
  pad.onpointermove=e=>{if(e.pointerType==='pen')penUntil=Date.now()+2800;if(pointer!==e.pointerId)return;e.preventDefault();for(const sample of stylusSamples(e))strokes[strokes.length-1].push(point(sample));paint();};
  for(const event of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(event,e=>{if(pointer===e.pointerId)pointer=null;});
  function draw(){observer?.disconnect();phase='draw';d.dataset.phase=phase;title.textContent='Подпись';stage.replaceChildren(el('p','sv-sign-hint','Распишитесь пальцем или стилусом'),pad);if(scope)stage.append(label);
   const blue=button('Синий',()=>{ink='#17447d';paint();colors();}),black=button('Чёрный',()=>{ink='#20262d';paint();colors();});
   function colors(){blue.setAttribute('aria-pressed',String(ink==='#17447d'));black.setAttribute('aria-pressed',String(ink==='#20262d'));}
   rail.replaceChildren(button('Отменить',()=>{strokes.pop();paint();}),blue,black,button('Очистить',()=>{strokes=[];paint();}));
   if(scope&&cache.has(scope)){rail.append(button('Моя подпись',()=>{const s=cache.get(scope);if(!s)return;strokes=s.strokes.map(a=>a.map(p=>({...p})));ink=s.ink;remember.checked=true;paint();colors();}),button('Забыть',()=>{cache.delete(scope);remember.checked=false;strokes=[];draw();}));}
   paint();colors();
  }
  function trim(){let l=pad.width,t=pad.height,r=0,b=0;for(const s of strokes)for(const p of s){l=Math.min(l,p.x);t=Math.min(t,p.y);r=Math.max(r,p.x);b=Math.max(b,p.y);}l=Math.max(0,Math.floor(l-8));t=Math.max(0,Math.floor(t-8));r=Math.min(pad.width,Math.ceil(r+8));b=Math.min(pad.height,Math.ceil(b+8));const c=canvas(Math.max(1,r-l),Math.max(1,b-t));c.getContext('2d').drawImage(pad,l,t,c.width,c.height,0,0,c.width,c.height);return c;}
  function place(){phase='place';d.dataset.phase=phase;title.textContent='Разместить подпись';markImage=trim();
   const page=el('div','sv-sign-page'),preview=canvas(source.width,source.height);preview.getContext('2d').drawImage(source,0,0);preview.className='sv-sign-preview';
   const mark=el('div','sv-sign-mark');mark.tabIndex=0;mark.setAttribute('aria-label','Переместить подпись');const image=canvas(markImage.width,markImage.height);image.getContext('2d').drawImage(markImage,0,0);mark.append(image);page.append(preview,mark);stage.replaceChildren(page);
   const ratio=markImage.height/markImage.width*source.width/source.height;pos={x:.55,y:.78,w:Math.min(.35,.55/ratio),h:0};
   const range=el('input');range.type='range';range.min='4';range.max='90';range.setAttribute('aria-label','Размер подписи');
   function update(){pos.w=Math.min(.9,Math.max(.04,pos.w),.92/ratio);pos.h=pos.w*ratio;pos.x=Math.max(0,Math.min(1-pos.w,pos.x));pos.y=Math.max(0,Math.min(1-pos.h,pos.y));Object.assign(mark.style,{left:pos.x*100+'%',top:pos.y*100+'%',width:pos.w*100+'%',height:pos.h*100+'%'});range.value=String(Math.round(pos.w*100));}
   range.oninput=()=>{pos.w=Number(range.value)/100;update();};
   const pointers=new Map();let start=null;
   function reset(){const [a,b]=pointers.values();start=a?{x:pos.x,y:pos.y,w:pos.w,a,dist:b?Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)):0}:null;}
   mark.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();mark.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});reset();};
   mark.onpointermove=e=>{if(!pointers.has(e.pointerId)||!start)return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const [a,b]=pointers.values(),r=page.getBoundingClientRect();if(b&&start.dist)pos.w=start.w*Math.hypot(a.x-b.x,a.y-b.y)/start.dist;else{pos.x=start.x+(a.x-start.a.x)/r.width;pos.y=start.y+(a.y-start.a.y)/r.height;}update();};
   for(const event of ['pointerup','pointercancel','lostpointercapture'])mark.addEventListener(event,e=>{pointers.delete(e.pointerId);reset();});
   page.onclick=e=>{if(e.target!==preview)return;const r=page.getBoundingClientRect();pos.x=(e.clientX-r.left)/r.width-pos.w/2;pos.y=(e.clientY-r.top)/r.height-pos.h/2;update();};
   mark.onkeydown=e=>{const delta={ArrowLeft:[-.01,0],ArrowRight:[.01,0],ArrowUp:[0,-.01],ArrowDown:[0,.01]}[e.key];if(delta){e.preventDefault();pos.x+=delta[0];pos.y+=delta[1];update();}};
   const size=el('label','sv-sign-size','Размер');size.append(range);rail.replaceChildren(button('Изменить',draw),size);done.disabled=false;update();
   function fit(){const k=Math.min((stage.clientWidth-8)/source.width,(stage.clientHeight-8)/source.height);if(k>0){page.style.width=Math.floor(source.width*k)+'px';page.style.height=Math.floor(source.height*k)+'px';}}
   requestAnimationFrame(fit);if(typeof ResizeObserver==='function'){observer=new ResizeObserver(fit);observer.observe(stage);}
  }
  d.addEventListener('close',()=>{observer?.disconnect();d.remove();resolve(result);},{once:true});draw();d.showModal();
 });
}
window.SEYVEO_HANDWRITTEN_SIGNATURE=Object.freeze({open,forget:()=>cache.clear()});
})();