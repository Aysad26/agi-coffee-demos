import test from 'node:test';
import assert from 'node:assert/strict';
import {createController} from '../dist/controller.js';
import {products} from '../dist/products.js';
import {existsSync} from 'node:fs';

test('rapid requests keep the last selected variety without overlapping transitions',async()=>{
  const transitions=[],completed=[];let release;
  const controller=createController({count:4,transition:async(from,to)=>{transitions.push([from,to]);await new Promise(r=>{release=r;});},onChange:i=>completed.push(i)});
  const work=controller.request(1);controller.request(2);controller.request(3);
  assert.deepEqual(transitions,[[0,1]]);release();await new Promise(r=>setImmediate(r));
  assert.deepEqual(transitions,[[0,1],[1,3]]);release();await work;
  assert.equal(controller.index,3);assert.equal(controller.busy,false);assert.deepEqual(completed,[1,3]);
});
test('navigation wraps and stationary selection causes no transition',async()=>{
  const directions=[];const controller=createController({count:4,transition:async(a,b,d)=>directions.push(d)});
  await controller.request(0);assert.deepEqual(directions,[]);
  await controller.request(-1);assert.equal(controller.index,3);assert.equal(directions[0],-1);
  await controller.request(4);assert.equal(controller.index,0);assert.equal(directions[1],1);
});
test('asset failure retains the previous product and allows a retry',async()=>{
  let fail=true;const controller=createController({count:4,transition:async()=>{if(fail)throw Error('asset unavailable');}});
  await assert.rejects(controller.request(1));assert.equal(controller.index,0);assert.equal(controller.busy,false);
  fail=false;await controller.request(1);assert.equal(controller.index,1);
});
test('every coffee bag and every taste illustration exists',()=>{
  for(const p of products){assert.equal(p.ratings.length,3);assert.ok(existsSync(new URL(`../dist/assets/bag-${p.slug}.webp`,import.meta.url)));for(const art of p.art)assert.ok(existsSync(new URL(`../dist/assets/${art[0]}.png`,import.meta.url)));}
});
