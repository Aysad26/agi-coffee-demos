import test from 'node:test';
import assert from 'node:assert/strict';
import {animateElement} from '../dist/motion.js';

function element(){
 const el={style:{opacity:'1',transform:'rest'},isConnected:true,created:[]};
 el.animate=(frames,options)=>{
  let resolve,reject;
  const animation={frames,options,finished:new Promise((a,b)=>{resolve=a;reject=b;}),
   finish:()=>resolve(),
   cancel(){this.styleAtCancel={...el.style};reject(new Error('cancelled'));}};
  el.created.push(animation);return animation;
 };
 return el;
}

test('staggered decor stays hidden during the delay without commitStyles support',async()=>{
 const el=element();
 const motion=animateElement(el,[{opacity:0,transform:'enter'},{opacity:.32,transform:'rest'}],{duration:820,delay:220,fill:'forwards'});
 assert.equal(el.style.opacity,'0');assert.equal(el.created[0].options.fill,'both');
 el.created[0].finish();await motion.finished;
 assert.equal(el.style.opacity,'0.32');assert.equal(el.style.transform,'rest');
 assert.equal(el.created[0].styleAtCancel.opacity,'0.32');
});

test('outgoing decor remains invisible after the animation effect is released',async()=>{
 const el=element();const motion=animateElement(el,[{opacity:.85},{opacity:0}],{duration:550});
 el.created[0].finish();await motion.finished;
 assert.equal(el.style.opacity,'0');assert.equal(el.created[0].styleAtCancel.opacity,'0');
});

test('a stale completion cannot overwrite a subsequent slide animation',async()=>{
 const el=element();const outgoing=animateElement(el,[{opacity:1},{opacity:0}],{duration:550});
 // Completion is queued, but the incoming animation owns the element first.
 el.created[0].finish();
 const incoming=animateElement(el,[{opacity:0,transform:'enter'},{opacity:.85,transform:'rest'}],{duration:820});
 await outgoing.finished;assert.equal(el.style.transform,'enter');assert.equal(el.style.opacity,'0');
 el.created[1].finish();await incoming.finished;
 assert.equal(el.style.opacity,'0.85');assert.equal(el.style.transform,'rest');
});
