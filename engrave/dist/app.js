import {products} from './products.js';
import {createController} from './controller.js';

const main=document.querySelector('main'),visual=document.getElementById('visual-slides'),details=document.getElementById('details-stage');
const buttons=[...document.querySelectorAll('[data-slide]')],playback=document.getElementById('playback');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const PERIOD=7200,EASE='cubic-bezier(.22,1,.36,1)';
let paused=motion.matches,hovered=false,focused=false,timer=null,touchStart=null,introDone=Promise.resolve();
const imageCache=new Map(),activeAnimations=new Set();
function loadImage(src){
  if(!imageCache.has(src))imageCache.set(src,new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=src;}));
  return imageCache.get(src);
}
function sources(product){return [`./assets/bag-${product.slug}.webp`,...product.art.map(a=>`./assets/${a[0]}.png`)];}
function element(tag,cls,text){const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function makeVisual(product,index){
  const layer=element('div','visual-layer');layer.dataset.product=index;
  product.art.forEach((a,i)=>{
    const image=element('img','art');image.src=`./assets/${a[0]}.png`;image.alt='';image.draggable=false;
    Object.assign(image.style,{left:`${a[1]/820*100}%`,top:`${a[2]/770*100}%`,width:`${a[3]/820*100}%`,height:`${a[4]/770*100}%`});
    image.style.setProperty('--order',i);layer.append(image);
  });
  const position=element('div','pack-position'),movement=element('div','pack-motion'),pack=element('img','pack');
  pack.src=`./assets/bag-${product.slug}.webp`;pack.alt=`Пачка кофе Эфиопия ${product.name}`;pack.draggable=false;
  movement.append(pack);position.append(movement);layer.append(position);return layer;
}
function makeDetails(product){
  const section=element('section','details');section.setAttribute('aria-label',`Эфиопия ${product.name}`);
  const process=element('p','process');process.append(document.createTextNode('В зернах · средняя обжарка'),document.createElement('br'),document.createTextNode(`Обработка — ${product.process}`));
  const ratings=element('dl','ratings');['Плотность','Сладость','Кислотность'].forEach((label,i)=>{const cell=document.createElement('div');cell.append(element('dt','',label),element('dd','',`${product.ratings[i]}/5`));ratings.append(cell);});
  const order=element('a','order','Заказать кофе');order.href=`mailto:office@agrogroupinvest.com?subject=${encodeURIComponent(`Заказ кофе Эфиопия ${product.name}`)}`;
  section.append(element('h1','',`Эфиопия ${product.name}`),process,element('p','flavour',product.flavour),ratings,element('p','weight','Масса нетто: 250 г / 1000 г'),order);
  return section;
}
function animate(node,frames,options){
  if(motion.matches||!node.animate)return Promise.resolve();
  const animation=node.animate(frames,{easing:EASE,fill:'both',...options});activeAnimations.add(animation);
  return animation.finished.catch(()=>{}).finally(()=>activeAnimations.delete(animation));
}
function updateNavigation(index){
  buttons.forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',String(i===index));});
  document.getElementById('counter').textContent=`${String(index+1).padStart(2,'0')} / 04`;
}
async function transition(from,to,direction){
  await introDone;
  clearTimeout(timer);
  const ready=await Promise.all(sources(products[to]).map(loadImage));
  if(!ready.every(Boolean))throw new Error('Не удалось загрузить иллюстрации сорта. Попробуйте ещё раз.');
  const oldVisual=visual.lastElementChild,oldDetails=details.lastElementChild;
  const newVisual=makeVisual(products[to],to),newDetails=makeDetails(products[to]);
  newVisual.style.opacity='0';newDetails.style.opacity='0';newVisual.setAttribute('aria-hidden','true');newDetails.setAttribute('aria-hidden','true');newDetails.inert=true;
  visual.append(newVisual);details.append(newDetails);
  main.classList.add('is-changing');main.setAttribute('aria-busy','true');
  updateNavigation(to);
  if(motion.matches||!newVisual.animate){
    oldVisual.remove();oldDetails.remove();
  }else{
    newVisual.style.opacity='1';newDetails.style.opacity='1';
    const jobs=[];
    jobs.push(animate(oldVisual.querySelector('.pack-motion'),[{opacity:1,transform:'translate(0,0) rotate(4deg) scale(1)'},{opacity:0,transform:`translate(${-direction*105}px,22px) rotate(${4-direction*7}deg) scale(.94)`}],{duration:580}));
    [...oldVisual.querySelectorAll('.art')].forEach((art,i)=>jobs.push(animate(art,[{opacity:.85,transform:'translate(0,0) rotate(0deg)'},{opacity:0,transform:`translate(${-direction*(48+i*17)}px,${i%2?28:-32}px) rotate(${-direction*8}deg)`}],{duration:460,delay:i*25})));
    [...oldDetails.children].forEach((row,i)=>jobs.push(animate(row,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-14px)'}],{duration:280,delay:i*24})));
    jobs.push(animate(newVisual.querySelector('.pack-motion'),[{opacity:0,transform:`translate(${direction*105}px,-18px) rotate(${4+direction*6}deg) scale(1.025)`},{opacity:1,transform:'translate(0,0) rotate(4deg) scale(1)'}],{duration:900,delay:250}));
    [...newVisual.querySelectorAll('.art')].forEach((art,i)=>jobs.push(animate(art,[{opacity:0,transform:`translate(${direction*(52+i*15)}px,${i%2?-38:36}px) rotate(${direction*9}deg) scale(.90)`},{opacity:.85,transform:'translate(0,0) rotate(0deg) scale(1)'}],{duration:900,delay:310+i*85})));
    [...newDetails.children].forEach((row,i)=>jobs.push(animate(row,[{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:630,delay:370+i*65})));
    oldVisual.setAttribute('aria-hidden','true');oldDetails.setAttribute('aria-hidden','true');oldDetails.inert=true;
    await Promise.all(jobs);
    oldVisual.remove();oldDetails.remove();
    for(const n of [newVisual,newDetails,...newVisual.querySelectorAll('.art,.pack-motion'),...newDetails.children])for(const a of n.getAnimations())if(a.effect?.getTiming().fill==='both')a.cancel();
  }
  newVisual.style.opacity='1';newDetails.style.opacity='1';newVisual.removeAttribute('aria-hidden');newDetails.removeAttribute('aria-hidden');newDetails.inert=false;
  main.classList.remove('is-changing');main.removeAttribute('aria-busy');
}
const controller=createController({count:products.length,transition,onChange:index=>{
  document.getElementById('announcement').textContent=`Эфиопия ${products[index].name}. ${products[index].flavour}`;
  schedule();
}});
function schedule(){clearTimeout(timer);main.classList.toggle('motion-paused',paused||document.hidden||hovered||focused);if(!paused&&!document.hidden&&!hovered&&!focused)timer=setTimeout(()=>request(controller.index+1),PERIOD);}
function request(index){clearTimeout(timer);return controller.request(index).catch(error=>{document.getElementById('announcement').textContent=error.message;updateNavigation(controller.index);schedule();});}
function updatePlayback(){playback.classList.toggle('paused',paused);playback.setAttribute('aria-pressed',String(paused));playback.setAttribute('aria-label',paused?'Включить автоматическую смену':'Приостановить автоматическую смену');schedule();}
buttons.forEach(b=>b.addEventListener('click',()=>{const to=Number(b.dataset.slide);request(to);if(!controller.busy)schedule();}));
document.getElementById('previous').addEventListener('click',()=>request(controller.target-1));
document.getElementById('next').addEventListener('click',()=>request(controller.target+1));
playback.addEventListener('click',()=>{paused=!paused;updatePlayback();});
document.addEventListener('keydown',event=>{if(event.altKey||event.ctrlKey||event.metaKey||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();request(controller.target+(event.key==='ArrowRight'?1:-1));}});
document.getElementById('visual').addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse')touchStart={x:event.clientX,y:event.clientY};});
document.getElementById('visual').addEventListener('pointerup',event=>{if(!touchStart)return;const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.3)request(controller.target+(dx<0?1:-1));});
document.getElementById('visual').addEventListener('pointercancel',()=>{touchStart=null;});
for(const controls of document.querySelectorAll('.navigation, .arrows')){
  controls.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;schedule();}});
  controls.addEventListener('pointerleave',()=>{hovered=false;schedule();});
}
main.addEventListener('focusin',()=>{focused=true;schedule();});
main.addEventListener('focusout',event=>{if(!main.contains(event.relatedTarget)){focused=false;schedule();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const a of activeAnimations)a.finish();schedule();});
motion.addEventListener('change',()=>{if(motion.matches){paused=true;for(const a of activeAnimations)a.finish();}updatePlayback();});
const start=async()=>{await Promise.all(sources(products[0]).map(loadImage));updatePlayback();if(!motion.matches){main.classList.add('is-changing');const layer=visual.firstElementChild;await Promise.all([animate(layer.querySelector('.pack-motion'),[{opacity:0,transform:'translateY(30px) rotate(1deg)'},{opacity:1,transform:'translateY(0) rotate(4deg)'}],{duration:1000}),...[...layer.querySelectorAll('.art')].map((art,i)=>animate(art,[{opacity:0,transform:'translateY(22px)'},{opacity:.85,transform:'translateY(0)'}],{duration:900,delay:170+i*90}))]);for(const n of [layer.querySelector('.pack-motion'),...layer.querySelectorAll('.art')])for(const a of n.getAnimations())if(a.effect?.getTiming().fill==='both')a.cancel();main.classList.remove('is-changing');}for(const product of products.slice(1))for(const src of sources(product))loadImage(src);};
introDone=start();
