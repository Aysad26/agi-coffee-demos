import * as THREE from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {createGlobe,routePoint,EASE,clamp} from './globe.js';

const $=id=>document.getElementById(id);
const host=$('canvas-host'),visual=$('visual'),ship=$('ship-wrap');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let scene,renderer,camera,model,observer,frameId;
let time=0,previous=0,ready=false,paused=false,visible=true,inView=true;
let dragX=0,dragY=0,targetDragX=0,targetDragY=0,pointer=null;
let focus=null,focusTween=null,lastPointer=null;
const mouse={x:0,y:0},mouseSmooth={x:0,y:0};
let autoRussia=false;

function selectLocation(key){
  for(const el of document.querySelectorAll('[data-location]')){
    const active=el.dataset.location===key;
    el.classList.toggle('is-active',active);el.setAttribute('aria-pressed',String(active));
  }
}
function hideLoading(message=''){
  $('loading').classList.add('is-done');
  if(message){$('globe-caption').textContent=message;$('globe-caption').style.maxWidth='180px';}
}
function reset(){
  time=reduced.matches?6:0;focus=null;focusTween=null;autoRussia=false;
  targetDragX=targetDragY=0;dragX=dragY=0;
  selectLocation('ethiopia');
  $('announcement').textContent='Путь кофе: из Эфиопии в Россию.';
  if(paused)setPause(false);
}
function setPause(value){
  paused=value;
  $('pause').setAttribute('aria-pressed',String(paused));
  $('pause').setAttribute('aria-label',paused?'Продолжить анимацию':'Приостановить анимацию');
  $('pause-icon').setAttribute('d',paused?'M9 6l8 6-8 6V6Z':'M9 6v12M15 6v12');
}
$('replay').addEventListener('click',reset);
$('pause').addEventListener('click',()=>setPause(!paused));
for(const el of document.querySelectorAll('[data-location]'))el.addEventListener('click',()=>{
  if(!ready)return;
  time=Math.max(time,5.2);autoRussia=true;
  const key=el.dataset.location;
  const current=viewAngles();
  focusTween=reduced.matches?null:{time:0,from:current,to:key==='ethiopia'?{yaw:-128.74*Math.PI/180,tilt:.158}:{yaw:-127.62*Math.PI/180,tilt:.81}};
  focus=key;targetDragX=targetDragY=0;selectLocation(key);
  $('announcement').textContent=key==='ethiopia'?'Эфиопия — истоки нашей арабики.':'Россия — прямые поставки кофе.';
});
reduced.addEventListener('change',()=>{if(reduced.matches){time=6;targetDragX=targetDragY=0;}});

function viewAngles(){
  const p=EASE(clamp((time-.4)/3.8));
  if(focusTween)return {
    yaw:THREE.MathUtils.lerp(focusTween.from.yaw,focusTween.to.yaw,EASE(clamp(focusTween.time/1.5))),
    tilt:THREE.MathUtils.lerp(focusTween.from.tilt,focusTween.to.tilt,EASE(clamp(focusTween.time/1.5))),
  };
  if(focus)return focus==='ethiopia'?{yaw:-128.74*Math.PI/180,tilt:.158}:{yaw:-127.62*Math.PI/180,tilt:.81};
  return {yaw:THREE.MathUtils.lerp(-105*Math.PI/180,-130*Math.PI/180,p),tilt:THREE.MathUtils.lerp(.08,.43,p)};
}

async function init(){
  try{
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setClearColor(0x000000,0);
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
    host.append(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden','true');
    scene=new THREE.Scene();
    camera=new THREE.PerspectiveCamera(30,1,.1,40);
    scene.add(new THREE.HemisphereLight(0xeed7ae,0x15120e,1.1));
    const key=new THREE.DirectionalLight(0xffe1b0,2.8);key.position.set(-3,4,4);scene.add(key);
    const rim=new THREE.DirectionalLight(0xdcb66c,2.2);rim.position.set(3,2,-2);scene.add(rim);
    const fill=new THREE.DirectionalLight(0xe9e0cd,.6);fill.position.set(-3,-1,3);scene.add(fill);
    const loader=new THREE.TextureLoader();
    const [color,roughness,height]=await Promise.all(['earth-color.webp','earth-roughness.webp','earth-height.png'].map(file=>loader.loadAsync('./assets/'+file)));
    color.colorSpace=THREE.SRGBColorSpace;
    for(const map of [color,roughness,height]){map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());map.wrapS=THREE.RepeatWrapping;}
    model=createGlobe({color,roughness,height});scene.add(model.world);
    // The local CC0 environment lights the metal; the canvas itself stays transparent.
    const pmrem=new THREE.PMREMGenerator(renderer);
    new HDRLoader().loadAsync('./assets/studio_small_09_1k.hdr').then(hdr=>{
      if(!renderer)return;
      scene.environment=pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();pmrem.dispose();
    }).catch(()=>pmrem.dispose());
    resize();
    observer=new ResizeObserver(resize);observer.observe(visual);
    setupPointer();
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();visible=false;visual.classList.remove('webgl-ready');hideLoading('3D временно недоступно');});
    renderer.domElement.addEventListener('webglcontextrestored',()=>{visible=true;visual.classList.add('webgl-ready');$('globe-caption').lastChild.textContent='Поверните глобус';});
    ready=true;reset();hideLoading();visual.classList.add('webgl-ready');
    // Let the ship enter with the 3D scene rather than before the globe loads.
    update(0);frameId=requestAnimationFrame(tick);
    document.addEventListener('visibilitychange',()=>{visible=inView&&!document.hidden;previous=0;});
    new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;visible=inView&&!document.hidden;previous=0;},{threshold:.01}).observe(visual);
  }catch(error){
    console.warn('AGI globe fallback:',error);
    renderer?.dispose();renderer?.domElement.remove();renderer=null;
    ship.style.opacity='1';ship.style.transform='none';
    hideLoading('Карта происхождения кофе');
    $('replay').disabled=true;$('pause').disabled=true;
    $('replay').style.opacity=$('pause').style.opacity='.35';
    $('announcement').textContent='Показана карта. 3D не поддерживается на этом устройстве.';
  }
}

function resize(){
  if(!renderer)return;
  const {width,height}=visual.getBoundingClientRect();if(width<=0||height<=0)return;
  renderer.setSize(width,height,false);camera.aspect=width/height;
  const mobile=width<650;
  camera.position.set(0,0,mobile?4.85:4.62);
  // Keep the whole sphere in view in narrow viewports.
  camera.position.z=Math.max(camera.position.z,1.19/(Math.tan(Math.PI/12)*camera.aspect));
  camera.lookAt(0,.02,0);camera.updateProjectionMatrix();
}
function setupPointer(){
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    pointer=e.pointerId;lastPointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(pointer);
  });
  canvas.addEventListener('pointermove',e=>{
    const r=visual.getBoundingClientRect();
    if(e.pointerType==='mouse'){mouse.x=clamp((e.clientX-r.left)/r.width,0,1)*2-1;mouse.y=clamp((e.clientY-r.top)/r.height,0,1)*2-1;}
    if(e.pointerId!==pointer||!lastPointer)return;
    targetDragX=clamp(targetDragX+(e.clientX-lastPointer.x)*.003,-.68,.68);
    if(e.pointerType==='mouse')targetDragY=clamp(targetDragY+(e.clientY-lastPointer.y)*.0015,-.16,.16);
    lastPointer={x:e.clientX,y:e.clientY};
  });
  const release=e=>{if(e.pointerId===pointer){pointer=null;lastPointer=null;}};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('pointerleave',()=>{mouse.x=mouse.y=0;});
}

function update(dt){
  const motion=!reduced.matches;
  const smooth=1-Math.exp(-dt*4.5);
  dragX=THREE.MathUtils.lerp(dragX,targetDragX,smooth);dragY=THREE.MathUtils.lerp(dragY,targetDragY,smooth);
  mouseSmooth.x=THREE.MathUtils.lerp(mouseSmooth.x,mouse.x,smooth);mouseSmooth.y=THREE.MathUtils.lerp(mouseSmooth.y,mouse.y,smooth);
  if(focusTween){focusTween.time+=dt;if(focusTween.time>=1.5)focusTween=null;}
  const view=viewAngles();
  const drift=motion&&time>5&&pointer===null&&!focus?Math.sin((time-5)*.17)*.035:0;
  model.world.rotation.set(view.tilt+dragY+(motion?mouseSmooth.y*.015:0),view.yaw+dragX+drift,0,'XYZ');
  model.world.position.set(visual.clientWidth<650?.01:.05,.12+(motion?Math.sin(time*.5)*.009:0),0);
  const entry=motion?EASE(clamp(time/2)):1;
  host.style.opacity=String(motion?EASE(clamp(time/1.4)):1);
  model.world.scale.setScalar(.86+.14*entry);
  // route starts after origin marker and finishes while the globe settles.
  const originP=motion?EASE(clamp((time-.4)/1)):1;
  const routeP=motion?EASE(clamp((time-1.1)/3.0)):1;
  const destP=motion?EASE(clamp((time-3.45)/.9)):1;
  model.origin.node.scale.setScalar(Math.max(.001,originP));
  model.destination.node.scale.setScalar(Math.max(.001,destP));
  for(const line of [model.route,model.glowRoute]){
    const segments=Math.floor(routeP*180);line.geometry.setDrawRange(0,segments*8*6);
  }
  model.origin.pulse.scale.setScalar(motion?1+((time*.30)%1)*1.5:1.3);
  model.origin.pulse.material.opacity=motion?.26*(1-((time*.30)%1)):.15;
  model.destination.pulse.scale.setScalar(motion?1+((time*.30+.5)%1)*1.5:1.3);
  model.destination.pulse.material.opacity=motion?.26*(1-((time*.30+.5)%1)):.15;
  model.runner.visible=motion&&time>1.1;
  if(time<4.1)model.runner.position.copy(routePoint(routeP));
  else{
    const cycle=(time-4.1)%7;
    model.runner.visible=motion&&cycle<3.7;
    model.runner.position.copy(routePoint(clamp(cycle/3.7)));
  }
  const shipP=motion?EASE(clamp((time-.55)/2.8)):1;
  ship.style.opacity=String(shipP);
  const shipX=(1-shipP)*48-(motion?mouseSmooth.x*5:0);
  const shipY=(1-shipP)*22+(motion?Math.sin(time*.46)*2.0-mouseSmooth.y*3:0);
  ship.style.transform=`translate3d(${shipX}px,${shipY}px,0) scale(${.96+.04*shipP})`;
  document.documentElement.style.setProperty('--route-progress',routeP.toFixed(3));
  model.world.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  updateLabel($('origin-label'),model.origin,originP);
  updateLabel($('destination-label'),model.destination,destP);
  if(time>4.2&&!autoRussia){autoRussia=true;selectLocation('russia');}
  renderer.render(scene,camera);
}
function updateLabel(element,marker,progress){
  const point=marker.point.clone().applyMatrix4(model.world.matrixWorld);
  const normal=marker.point.clone().normalize().transformDirection(model.world.matrixWorld);
  const facing=normal.dot(camera.position.clone().sub(point).normalize());
  const projected=point.clone().project(camera);
  const x=(projected.x*.5+.5)*visual.clientWidth,y=(-projected.y*.5+.5)*visual.clientHeight;
  const width=element.offsetWidth;
  const tx=clamp(x+17,8,visual.clientWidth-width-8),ty=clamp(y-12,12,visual.clientHeight-45);
  element.style.transform=`translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0)`;
  element.style.opacity=String(progress*clamp((facing-.13)*3));
}
function tick(timestamp){
  frameId=requestAnimationFrame(tick);
  const dt=previous?Math.min((timestamp-previous)/1000,.06):0;previous=timestamp;
  if(!visible||!ready)return;
  if(!paused)time+=dt;
  // A paused scene can still be inspected with the pointer.
  update(dt);
}
ship.style.opacity=reduced.matches?'1':'0';
init();
