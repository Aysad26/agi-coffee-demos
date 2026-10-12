import {clamp,stateAt} from './timeline.js';

const $=id=>document.getElementById(id);
const visual=$('visual'),scene=$('map-scene');
const map=$('cartography'),route=$('map-route'),labels=$('map-labels'),ship=$('ship-layer');
const line=$('route-line'),soft=$('route-soft'),traveller=$('traveller');
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:760px)');
const pathLength=line.getTotalLength();
let time=0,previous=0,paused=false,inView=true,initialized=false,raf=0;
let scrollParallax=0;
const cursor={x:0,y:0},smooth={x:0,y:0};

function resize(){
  scene.setAttribute('viewBox',mobile.matches?'390 50 750 670':'0 0 1140 750');
  updateScroll();
  if(initialized)paint(0);
}
function updateScroll(){
  const r=visual.getBoundingClientRect();
  scrollParallax=clamp((innerHeight/2-r.top-r.height/2)/(innerHeight+r.height),-1,1);
  if(reduced.matches&&initialized)paint(0);
}
function setPause(value){
  paused=value;
  $('pause').setAttribute('aria-pressed',String(value));
  $('pause').setAttribute('aria-label',value?'Продолжить анимацию':'Приостановить анимацию');
  $('pause-icon').setAttribute('d',value?'M9 6l8 6-8 6V6Z':'M9 6v12M15 6v12');
  previous=0;
}
function replay(){
  time=0;cursor.x=cursor.y=0;smooth.x=smooth.y=0;
  setPause(false);
  paint(0);
  $('announcement').textContent=reduced.matches?'Путь кофе — из Эфиопии в Россию.':'Повтор анимации: путь кофе из Эфиопии в Россию.';
}
$('pause').addEventListener('click',()=>setPause(!paused));
$('replay').addEventListener('click',replay);
mobile.addEventListener('change',resize);
reduced.addEventListener('change',()=>{smooth.x=smooth.y=0;previous=0;paint(0);});
window.addEventListener('resize',resize,{passive:true});
window.addEventListener('scroll',updateScroll,{passive:true});
visual.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||reduced.matches)return;
  const r=visual.getBoundingClientRect();
  cursor.x=clamp((e.clientX-r.left)/r.width,0,1)*2-1;
  cursor.y=clamp((e.clientY-r.top)/r.height,0,1)*2-1;
});
visual.addEventListener('pointerleave',()=>{cursor.x=cursor.y=0;});
document.addEventListener('visibilitychange',()=>{previous=0;});
const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;previous=0;},{threshold:.01});observer.observe(visual);

function transformGroup(el,x,y,scale=1,cx=570,cy=375){
  el.setAttribute('transform',`translate(${x.toFixed(3)} ${y.toFixed(3)}) translate(${cx} ${cy}) scale(${scale.toFixed(5)}) translate(${-cx} ${-cy})`);
}
function paint(dt){
  const still=reduced.matches;
  const state=stateAt(time,still);
  const damping=1-Math.exp(-dt*4.5);
  smooth.x+=(cursor.x-smooth.x)*damping;smooth.y+=(cursor.y-smooth.y)*damping;
  const mx=still?0:-smooth.x*7;
  const my=still?0:-smooth.y*5+scrollParallax*7;
  const mapScale=1.035-.035*state.map;
  for(const el of [map,route,labels])transformGroup(el,mx+(1-state.map)*-12,my+(1-state.map)*8,mapScale);
  map.style.opacity=String(state.map*.94);
  route.style.opacity=String(state.map);
  labels.style.opacity=String(state.map);
  line.setAttribute('stroke-dashoffset',String(1-state.route));
  soft.setAttribute('stroke-dashoffset',String(1-state.route));
  line.setAttribute('opacity',time<4.2?.9:.65);
  $('origin').setAttribute('opacity',String(state.origin));
  $('destination').setAttribute('opacity',String(state.destination));
  const p=line.getPointAtLength(pathLength*state.spark);
  traveller.setAttribute('transform',`translate(${p.x.toFixed(3)} ${p.y.toFixed(3)})`);
  traveller.setAttribute('opacity',String(state.sparkOpacity));
  const wave=still?0:Math.sin(time*.46)*2.1;
  const sx=(mobile.matches?14:0)+(1-state.ship)*65-(still?0:smooth.x*22);
  const sy=(mobile.matches?-12:0)+(1-state.ship)*30+(still?0:-smooth.y*12+scrollParallax*24)+wave;
  const scale=(mobile.matches?.86:1)*(.96+.04*state.ship);
  transformGroup(ship,sx,sy,scale,730,550);
  ship.setAttribute('opacity',String(state.ship));
  if(still){
    $('origin-pulse').setAttribute('r','15');$('origin-pulse').setAttribute('opacity','.2');
    $('destination-pulse').setAttribute('r','15');$('destination-pulse').setAttribute('opacity','.2');
  }else{
    for(const [id,offset] of [['origin-pulse',0],['destination-pulse',.5]]){
      const phase=(time*.22+offset)%1;
      $(id).setAttribute('r',String(13+phase*17));
      $(id).setAttribute('opacity',String(.3*(1-phase)));
    }
  }
}
function tick(timestamp){
  raf=requestAnimationFrame(tick);
  const dt=previous?Math.min((timestamp-previous)/1000,.05):0;previous=timestamp;
  if(document.hidden||!inView||!initialized)return;
  if(reduced.matches)return;
  if(!paused)time+=dt;
  paint(dt);
}
async function start(){
  resize();
  // Start the composed sequence once the two local bitmap layers are decoded.
  const imageReady=src=>{const im=new Image();im.src=src;return im.decode().catch(()=>{});};
  await Promise.all([imageReady('./assets/world-map.webp'),imageReady('./assets/ship.webp')]);
  initialized=true;previous=0;paint(0);raf=requestAnimationFrame(tick);
}
// Static SVG remains a complete fallback if scripts or animation APIs are unavailable.
if(!reduced.matches){map.style.opacity='0';route.style.opacity='0';labels.style.opacity='0';ship.setAttribute('opacity','0');}
start();
