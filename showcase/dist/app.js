import {products} from './products.js';
import {animateElement as animate} from './motion.js';
import {createPreloader} from './loading.js';

const $=id=>document.getElementById(id);
const visual=$('visual'),canvasHost=$('canvas'),fallback=$('fallback'),details=$('details');
const buttons=[...document.querySelectorAll('[data-slide]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const preloader=createPreloader({root:$('preloader'),content:document.querySelector('.showcase'),documentRoot:document.documentElement,reducedMotion:reduced.matches,onFinish:()=>clearTimeout(window.agiPreloaderTimeout)});
const mobileLayout=matchMedia('(max-width: 760px)');
const arrows=$('arrows'),navigation=document.querySelector('.navigation');
function placeArrows(){(mobileLayout.matches?$('visual-shell'):navigation).append(arrows);}
placeArrows();
mobileLayout.addEventListener('change',placeArrows);
const EASE='cubic-bezier(.42,0,.32,1)',DURATION=1850;
let current=0,target=0,busy=false,queued=null,stage=null,transitionId=0;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function buildDecor(index){
  const p=products[index];const back=document.createElement('div'),front=document.createElement('div');back.className=front.className='decor-layer';
  const specs=[['far-branch','./assets/branch-source.png',p.far,back],['branch','./assets/branch-source.png',p.branch,front],['bean','./assets/bean-1-clean.webp',p.bean,front],['bean-near','./assets/bean-2-clean.webp',p.near,front],['bean-far','./assets/bean-3-clean.webp',p.farBean,back]];
  for(const [cls,src,offset,parent] of specs){const img=document.createElement('img');img.className='decor-item '+cls;img.src=src;img.alt='';img.style.transform=`translate(${offset[0]}%,${offset[1]}%) rotate(${offset[2]}deg)`;img.dataset.baseTransform=img.style.transform;parent.append(img);}
  return {back,front};
}
let decor=buildDecor(0);$('decor').append(decor.back);$('front-decor').append(decor.front);
function updateDescription(i){
  const p=products[i];$('title').textContent='Эфиопия '+p.name;$('process').textContent=p.process;$('flavour').textContent=p.flavour;
  ['body-rating','sweet-rating','acid-rating'].forEach((id,k)=>$(id).textContent=p.ratings[k]+'/5');
  $('order').href='mailto:office@agrogroupinvest.com?subject='+encodeURIComponent('Заказ кофе Эфиопия '+p.name);
  visual.setAttribute('aria-label','Чёрная пачка кофе Эфиопия '+p.name+' с оригинальной этикеткой');
  fallback.src='./assets/bag-'+p.slug+'.webp';
  $('announcement').textContent=`Сорт ${i+1} из 4. Эфиопия ${p.name}. ${p.flavour}.`;
  buttons.forEach((b,k)=>{b.classList.toggle('active',k===i);b.setAttribute('aria-pressed',String(k===i));});
}
async function select(i,direction=1){
  if(preloader.active)return;
  i=(i+products.length)%products.length;if(busy){queued={i,direction};return;}if(i===current)return;
  target=i;busy=true;const id=++transitionId;visual.setAttribute('aria-busy','true');
  if(reduced.matches){
    updateDescription(i);stage?.setProduct(i);decor.back.remove();decor.front.remove();decor=buildDecor(i);$('decor').append(decor.back);$('front-decor').append(decor.front);
  }else{
    const old=decor,newDecor=buildDecor(i);
    for(const layer of [newDecor.back,newDecor.front]){layer.style.opacity='0';}
    $('decor').append(newDecor.back);$('front-decor').append(newDecor.front);
    await Promise.all([...newDecor.back.children,...newDecor.front.children].map(img=>img.decode().catch(()=>{})));
    if(id!==transitionId)return;
    const oldItems=[...old.back.children,...old.front.children];
    oldItems.forEach((el,k)=>animate(el,[{opacity:getComputedStyle(el).opacity,transform:el.dataset.baseTransform},{opacity:0,transform:`translate(${direction*35}px,${k%2?30:-30}px) rotate(${direction*16}deg) scale(.94)`}],{duration:550,delay:k*35,easing:EASE,fill:'forwards'}));
    [...details.children].forEach((el,k)=>animate(el,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-12px)'}],{duration:420,delay:k*24,easing:EASE,fill:'forwards'}));
    stage?.turnTo(i,direction,DURATION);
    if(!stage)animate(fallback,[{opacity:1,transform:'translateX(-50%) rotate(4deg)'},{opacity:0,transform:`translateX(-50%) rotate(${direction*14}deg)`}],{duration:650,easing:EASE,fill:'forwards'});
    await sleep(780);if(id!==transitionId)return;
    updateDescription(i);old.back.remove();old.front.remove();decor=newDecor;
    newDecor.back.style.opacity=newDecor.front.style.opacity='1';
    const incoming=[];
    [...newDecor.back.children,...newDecor.front.children].forEach((el,k)=>{
      const op=el.classList.contains('far-branch')?.32:el.classList.contains('branch')?.85:1;
      incoming.push(animate(el,[{opacity:0,transform:`translate(${-direction*35}px,${k%2?25:-25}px) rotate(${-direction*12}deg) scale(.94)`},{opacity:op,transform:el.dataset.baseTransform}],{duration:820,delay:k*55,easing:EASE,fill:'forwards'}).finished);
    });
    [...details.children].forEach((el,k)=>incoming.push(animate(el,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:710,delay:k*45,easing:EASE,fill:'forwards'}).finished));
    if(!stage)incoming.push(animate(fallback,[{opacity:0,transform:`translateX(-50%) rotate(${-direction*10}deg)`},{opacity:1,transform:'translateX(-50%) rotate(4deg)'}],{duration:900,easing:EASE,fill:'forwards'}).finished);
    await Promise.all([sleep(DURATION-780),...incoming]);
  }
  current=i;target=i;busy=false;visual.removeAttribute('aria-busy');
  if(queued){const q=queued;queued=null;select(q.i,q.direction);}
}
buttons.forEach((b,i)=>b.addEventListener('click',()=>select(i,i>=target?1:-1)));
$('previous').addEventListener('click',()=>select((queued?.i??target)-1,-1));$('next').addEventListener('click',()=>select((queued?.i??target)+1,1));
document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();select((queued?.i??target)+(e.key==='ArrowRight'?1:-1),e.key==='ArrowRight'?1:-1);}});
let startTouch=null;visual.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')startTouch={x:e.clientX,y:e.clientY};});visual.addEventListener('pointerup',e=>{if(startTouch){const dx=e.clientX-startTouch.x,dy=e.clientY-startTouch.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4)select(target+(dx<0?1:-1),dx<0?1:-1);startTouch=null;}});visual.addEventListener('pointercancel',()=>startTouch=null);

async function initialize3D(){
  const [THREE,{rotationAt,labelHidden},{buildImportedPouch},{FILM,PAPER,ENVIRONMENT_INTENSITY,ENVIRONMENT_ROTATION,addProductLighting},{GLTFLoader},{RectAreaLightUniformsLib},{RoomEnvironment},{HDRLoader}]=await preloader.track(Promise.all([
    import('three'),import('./model.js'),import('./client-pouch.js'),import('./lighting.js'),
    import('three/addons/loaders/GLTFLoader.js'),import('three/addons/lights/RectAreaLightUniformsLib.js'),
    import('three/addons/environments/RoomEnvironment.js'),import('three/addons/loaders/HDRLoader.js')
  ]),12);
  RectAreaLightUniformsLib.init();
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
  canvasHost.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=null;
  const camera=new THREE.PerspectiveCamera(36,1,.1,40);camera.position.set(0,.02,8.25);camera.lookAt(0,0,0);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();let environment=pmrem.fromScene(room,.045).texture;scene.environment=environment;scene.environmentIntensity=ENVIRONMENT_INTENSITY;scene.environmentRotation.y=ENVIRONMENT_ROTATION;room.dispose();
  preloader.advance(8);
  const loader=new THREE.TextureLoader();
  // Fetch independent assets together. HDR failure keeps the studio fallback.
  const [labels,bump,imported,hdr]=await Promise.all([
    Promise.all(products.map(p=>preloader.track(loader.loadAsync('./assets/label-'+p.slug+'.webp'),5))),
    preloader.track(loader.loadAsync('./assets/foil-bump.png'),4),
    preloader.track(new GLTFLoader().loadAsync('./assets/agi-coffee-pouch.glb'),18),
    preloader.track(new HDRLoader().loadAsync('./assets/studio_country_hall_1k.hdr').catch(()=>null),16)
  ]);
  labels.forEach(t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());});
  bump.wrapS=bump.wrapT=THREE.RepeatWrapping;
  if(hdr){
    const nextEnv=pmrem.fromEquirectangular(hdr).texture;scene.environment=nextEnv;environment.dispose();environment=nextEnv;hdr.dispose();
  }
  const body=new THREE.MeshPhysicalMaterial({...FILM,bumpMap:bump});
  const labelMaterial=new THREE.MeshStandardMaterial({...PAPER,map:labels[busy?target:current],polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const pouch=buildImportedPouch(imported,body,labelMaterial);const float=new THREE.Group();float.add(pouch.group);scene.add(float);float.position.x=-.25;
  addProductLighting(scene);
  let turn=null,pointer={x:0,y:0},smooth={x:0,y:0},active=true,frame=0;
  const resize=()=>{const r=visual.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.position.z=camera.aspect<.88?9.1:8.25;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(visual);resize();
  visual.addEventListener('pointermove',e=>{const r=visual.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width-.5)*2;pointer.y=((e.clientY-r.top)/r.height-.5)*2;});visual.addEventListener('pointerleave',()=>pointer={x:0,y:0});
  function tick(time){
    if(!active)return;frame=requestAnimationFrame(tick);
    smooth.x+=(pointer.x-smooth.x)*.035;smooth.y+=(pointer.y-smooth.y)*.035;
    let angle=0,lift=0;
    if(turn){const t=Math.min(1,(time-turn.start)/turn.duration);angle=rotationAt(t)*turn.direction;lift=Math.sin(t*Math.PI)*.1;
      if(!turn.swapped&&labelHidden(t)){labelMaterial.map=labels[turn.index];labelMaterial.needsUpdate=true;turn.swapped=true;}
      if(t>=1){angle=0;labelMaterial.map=labels[turn.index];turn=null;}
    }
    const idle=reduced.matches?0:1;
    pouch.group.rotation.set(.025+smooth.y*.035*idle,-.11+angle+smooth.x*.12*idle+Math.sin(time*.00022)*.027*idle,-.058+Math.sin(time*.00032)*.009*idle);
    float.position.y=lift+Math.sin(time*.00065)*.035*idle;float.position.x=-.25+smooth.x*.025*idle;
    renderer.render(scene,camera);
  }
  await preloader.track(renderer.compileAsync(scene,camera),10);
  stage={setProduct(i){turn=null;labelMaterial.map=labels[i];labelMaterial.needsUpdate=true;},turnTo(i,direction,duration){turn={index:i,direction,duration,start:performance.now(),swapped:false};},dispose(){cancelAnimationFrame(frame);renderer.dispose();}};
  // Upload textures and render the initial pose before uncovering the screen.
  tick(performance.now());canvasHost.classList.add('ready');fallback.classList.add('hidden');
  document.addEventListener('visibilitychange',()=>{if(document.hidden){active=false;cancelAnimationFrame(frame);}else{active=true;requestAnimationFrame(tick);}});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;cancelAnimationFrame(frame);stage=null;canvasHost.classList.remove('ready');fallback.classList.remove('hidden');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
}
const initialImages=preloader.track(Promise.all([...document.images].map(img=>img.decode().catch(()=>{}))),10);
const initialFonts=preloader.track(document.fonts.ready,2);
Promise.all([
  initialize3D().catch(error=>{console.warn('3D unavailable, photographic fallback active.',error);stage=null;canvasHost.replaceChildren();fallback.classList.remove('hidden');}),
  initialImages,initialFonts
]).finally(()=>preloader.finish());
// Preload all four photographs for immediate fallback transitions.
for(const p of products){const img=new Image();img.src='./assets/bag-'+p.slug+'.webp';}
