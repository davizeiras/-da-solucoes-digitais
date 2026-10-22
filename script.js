(() => {
'use strict';
const q=s=>document.querySelector(s), all=s=>[...document.querySelectorAll(s)];
const root=document.documentElement, body=document.body, opening=q('.opening'), openingTitle=q('.opening-title'), siteBody=q('.site-body'), header=q('.site-header');
const shell=q('.story-shell'), sceneOne=q('.scene-one'), sceneTwo=q('.scene-two'), photo=q('.floating-photo'), marquee=q('.manifesto-track');
const motion=q('.motion-toggle'), motionIcon=q('.motion-icon'), reduced=matchMedia('(prefers-reduced-motion:reduce)'), fine=matchMedia('(hover:hover) and (pointer:fine)');
const magnets=all('.magnetic'), services=all('details.service');
let enabled=!reduced.matches, explicit=false, raf=0, active=null;const pointer={x:0,y:0};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));const ease=v=>v*v*(3-2*v);const prop=(el,k,v)=>el?.style.setProperty(k,v);
q('#year').textContent=new Date().getFullYear();
all('[data-whatsapp]').forEach(a=>a.href='https://wa.me/5599996510214?text='+encodeURIComponent('Olá, Davi! Vim pelo seu site e quero conversar sobre um projeto.'));
all('[data-service]').forEach(a=>a.href='https://wa.me/5599996510214?text='+encodeURIComponent('Olá, Davi! Tenho interesse em '+a.dataset.service+'. Podemos conversar?'));
all('[data-split]').forEach(el=>{
 const label=el.textContent;el.setAttribute('aria-label',label);el.textContent='';let i=0;
 label.split(/(\s+)/).forEach(token=>{
  if(/^\s+$/.test(token)){el.appendChild(document.createTextNode(' '));return}
  const word=document.createElement('span');word.className='split-word';word.setAttribute('aria-hidden','true');
  [...token].forEach(char=>{const span=document.createElement('span');span.className='split-char';span.style.setProperty('--i',i++);span.textContent=char;word.appendChild(span)});el.appendChild(word);
 });
});
const chars=all('.split-char'), splitTargets=all('[data-split]');
if('IntersectionObserver' in window){const letterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('letters-active');letterObserver.unobserve(entry.target)}}),{threshold:.45});splitTargets.forEach(el=>letterObserver.observe(el))}
services.forEach(item=>item.addEventListener('toggle',()=>{if(item.open)services.forEach(other=>{if(other!==item)other.open=false});schedule()}));
function resetMagnet(){if(active){prop(active,'--magnet-x','0px');prop(active,'--magnet-y','0px')}active=null}
magnets.forEach(el=>{el.addEventListener('pointerenter',e=>{if(enabled&&fine.matches&&e.pointerType!=='touch'){active=el;schedule()}});el.addEventListener('pointerleave',resetMagnet)});
addEventListener('pointermove',e=>{if(!active)return;pointer.x=e.clientX;pointer.y=e.clientY;schedule()},{passive:true});
function applyMotion(){body.classList.toggle('no-motion',!enabled);root.classList.toggle('effects-on',enabled);root.classList.toggle('motion-enabled',enabled);motion.setAttribute('aria-pressed',String(!enabled));motion.setAttribute('aria-label',enabled?'Reduzir animações':'Ativar animações');motionIcon.textContent=enabled?'Ⅱ':'▷';if(!enabled)resetMagnet();schedule()}
motion.addEventListener('click',()=>{explicit=true;enabled=!enabled;applyMotion()});reduced.addEventListener('change',()=>{if(!explicit){enabled=!reduced.matches;applyMotion()}});fine.addEventListener('change',resetMagnet);
function update(){
raf=0;if(document.hidden)return;const vh=innerHeight;
const intro=opening.getBoundingClientRect(), page=siteBody.getBoundingClientRect(), hidden=intro.bottom>vh*.12;
body.classList.toggle('opening-active',hidden);if('inert'in header)header.inert=hidden;prop(header,'--page-progress',clamp(-page.top/Math.max(1,page.height-vh)).toFixed(4));
if(!enabled)return;
if(intro.bottom>0){const p=clamp(-intro.top/(vh*.8));openingTitle.style.transform='scale('+(1+p*.22)+') translateY('+(-p*50)+'px)';openingTitle.style.opacity=String(1-p*.88)}
const sr=shell.getBoundingClientRect(), travel=Math.max(1,sr.height-vh), p=clamp(-sr.top/travel), swap=ease(clamp((p-.25)/.34)), settle=ease(clamp((p-.5)/.25));
prop(shell,'--story-progress',p.toFixed(4));prop(sceneOne,'--scene-one-opacity',(1-swap).toFixed(3));prop(sceneOne,'--scene-one-x',(-swap*90).toFixed(1)+'px');prop(sceneOne,'--scene-one-y',(-swap*28).toFixed(1)+'px');
prop(sceneTwo,'--scene-two-opacity',swap.toFixed(3));prop(sceneTwo,'--scene-two-x',((1-swap)*70).toFixed(1)+'px');sceneTwo.style.pointerEvents=swap>.7?'auto':'none';
const mobile=innerWidth<=700;
const start={left:mobile?24:61,top:mobile?46:18,width:mobile?72:31};const end={left:mobile?7:8,top:mobile?48:19,width:mobile?58:31};
prop(photo,'--photo-left',(start.left+(end.left-start.left)*swap).toFixed(2)+'%');prop(photo,'--photo-top',(start.top+(end.top-start.top)*swap).toFixed(2)+'%');prop(photo,'--photo-width',(start.width+(end.width-start.width)*swap).toFixed(2)+'%');prop(photo,'--photo-x',((1-settle)*Math.sin(p*Math.PI*2)*9).toFixed(2)+'px');prop(photo,'--photo-y',(-settle*12).toFixed(2)+'px');prop(photo,'--photo-rotate',((1-swap)*2.3).toFixed(2)+'deg');prop(photo,'--photo-clip',((1-clamp(p/.16))*22).toFixed(2)+'%');prop(photo,'--photo-scale',(1.12-p*.07).toFixed(3));prop(photo,'--image-y',(-p*18).toFixed(1)+'px');
// Letters settle on the same baseline; short entrance/hover hops are CSS-only.
chars.forEach(char=>{prop(char,'--char-y','0px');prop(char,'--char-r','0deg')});
const mr=marquee.getBoundingClientRect();if(mr.bottom>0&&mr.top<vh){const mp=clamp((vh-mr.top)/(vh+mr.height));prop(marquee,'--marquee-x',(-mp*innerWidth*.65).toFixed(1)+'px')}
if(active&&fine.matches){const r=active.getBoundingClientRect();prop(active,'--magnet-x',clamp((pointer.x-r.left-r.width/2)*.08,-7,7).toFixed(1)+'px');prop(active,'--magnet-y',clamp((pointer.y-r.top-r.height/2)*.08,-7,7).toFixed(1)+'px')}
}
function schedule(){if(!raf&&!document.hidden)raf=requestAnimationFrame(update)}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});addEventListener('load',schedule);addEventListener('pageshow',schedule);addEventListener('blur',resetMagnet);document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;resetMagnet()}else schedule()});document.fonts?.ready.then(schedule);applyMotion();
})();
