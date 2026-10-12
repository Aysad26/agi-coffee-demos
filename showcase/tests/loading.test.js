import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreloader} from '../dist/loading.js';

function view(){
  const bar={attributes:{},style:{setProperty(k,v){this[k]=v;}},setAttribute(k,v){this.attributes[k]=v;}};
  const percent={textContent:''};
  const root={hidden:false,attributes:{},setAttribute(k,v){this.attributes[k]=v;},querySelector:s=>s==='.preloader-progress'?bar:percent};
  const content={inert:false,attributes:{},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];}};
  const documentRoot={classList:{remove(k){this.removed=k;}}};
  let finishCalls=0;
  return {root,content,bar,percent,documentRoot,get finishCalls(){return finishCalls;},loader:createPreloader({root,content,documentRoot,reducedMotion:true,onFinish(){finishCalls++;}})};
}

test('an asset failure still permits the photographic fallback to leave the loading screen',async()=>{
  const v=view();assert.equal(v.content.inert,true);
  await assert.rejects(v.loader.track(Promise.reject(new Error('WebGL unavailable')),80));
  assert.equal(v.bar.attributes['aria-valuenow'],80);
  await v.loader.finish();assert.equal(v.root.hidden,true);assert.equal(v.content.inert,false);
  assert.equal(v.content.attributes['aria-busy'],undefined);assert.equal(v.percent.textContent,'100%');
  assert.equal(v.documentRoot.classList.removed,'is-loading');
  await v.loader.finish();assert.equal(v.finishCalls,1);
});

test('out-of-order resource completions never reach 100 before the ready gate',async()=>{
  const v=view();let release;
  const slow=v.loader.track(new Promise(resolve=>{release=resolve;}),60);
  await v.loader.track(Promise.resolve(),40);assert.equal(v.percent.textContent,'40%');
  release();await slow;assert.equal(v.percent.textContent,'99%');assert.equal(v.root.hidden,false);
  await v.loader.finish();assert.equal(v.percent.textContent,'100%');
  await v.loader.track(Promise.resolve(),10);assert.equal(v.percent.textContent,'100%');
});
