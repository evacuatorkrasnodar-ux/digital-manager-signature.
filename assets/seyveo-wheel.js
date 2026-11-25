/* One SEYVEO wheel: five visible rows, native inertial scrolling, snap and optional feedback. */
(()=>{
'use strict';
const pitch=40,key='seyveo.wheel.feedback.v1';
let enabled=true,context=null,lastTick=0;
try{enabled=localStorage.getItem(key)!=='off';}catch{}
function arm(){if(!enabled)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;context ||= new C();if(context.state==='suspended')void context.resume().catch(()=>{});}catch{}}
function tick(){
 if(!enabled||performance.now()-lastTick<45)return;lastTick=performance.now();
 try{navigator.vibrate?.(7);}catch{}
 try{if(context?.state!=='running')return;const t=context.currentTime,o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.setValueAtTime(1050,t);o.frequency.exponentialRampToValueAtTime(550,t+.022);g.gain.setValueAtTime(.025,t);g.gain.exponentialRampToValueAtTime(.0001,t+.028);o.connect(g);g.connect(context.destination);o.start(t);o.stop(t+.03);}catch{}
}
function mount(node,choices,value,change=()=>{}){
 const items=choices.map(x=>({value:x.value,label:String(x.label)}));
 if(!items.length)throw Error('Empty wheel');
 node.classList.add('sv-unified-wheel');node.replaceChildren();node.tabIndex=0;node.setAttribute('role','listbox');
 const label=node.getAttribute('aria-label')||'Выбор';node.setAttribute('aria-label',label);
 let index=Math.max(0,items.findIndex(x=>String(x.value)===String(value))),ready=false,gesture=false,settle=0;
 const options=items.map((item,i)=>{const b=document.createElement('button');b.type='button';b.className='sv-unified-wheel-option';b.tabIndex=-1;b.setAttribute('role','option');b.textContent=item.label;b.addEventListener('click',()=>{arm();gesture=true;select(i,true);center();});node.append(b);return b;});
 const clamp=n=>Math.max(0,Math.min(items.length-1,n));
 const nearest=()=>clamp(Math.round(node.scrollTop/pitch));
 function paint(){for(let i=0;i<options.length;i++){const b=options[i],distance=Math.abs(i-index);b.dataset.distance=String(Math.min(3,distance));b.classList.toggle('is-selected',!distance);b.setAttribute('aria-selected',String(!distance));}}
 function select(n,notify){n=clamp(n);if(index===n)return;index=n;paint();if(notify){if(gesture)tick();change(items[index].value);}}
 function center(){node.scrollTop=index*pitch;}
 function set(v){const n=items.findIndex(x=>String(x.value)===String(v));if(n<0)return;gesture=false;index=n;paint();center();}
 function init(){if(!node.isConnected||!node.clientHeight)return;center();ready=true;}
 function start(){arm();gesture=true;}
 node.addEventListener('pointerdown',start,{passive:true});
 node.addEventListener('touchstart',start,{passive:true});
 node.addEventListener('wheel',start,{passive:true});
 node.addEventListener('scroll',()=>{if(!ready||!node.clientHeight)return;select(nearest(),true);clearTimeout(settle);settle=setTimeout(()=>{if(node.isConnected&&node.clientHeight){select(nearest(),true);center();}gesture=false;},110);},{passive:true});
 node.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key))return;e.preventDefault();start();select(e.key==='Home'?0:e.key==='End'?items.length-1:index+({ArrowUp:-1,ArrowDown:1,PageUp:-5,PageDown:5}[e.key]||0),true);center();});
 paint();requestAnimationFrame(init);
 return {node,set(v){set(v);if(node.clientHeight)ready=true;else requestAnimationFrame(init);},get value(){if(ready&&node.clientHeight)select(nearest(),true);return items[index].value;},center:init};
}
function feedbackButton(){
 const b=document.createElement('button');b.type='button';b.className='sv-wheel-feedback';
 const sync=()=>{b.textContent=enabled?'Щелчок: вкл.':'Щелчок: выкл.';b.setAttribute('aria-pressed',String(enabled));};
 b.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem(key,enabled?'on':'off');}catch{}if(enabled)arm();sync();});sync();return b;
}
window.SEYVEO_WHEEL=Object.freeze({mount,feedbackButton});
})();