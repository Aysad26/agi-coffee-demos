import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.js';
import {pouchPoint,buildPouch,SEAL_START,SEAL_HALF_THICKNESS,rotationAt,labelHidden} from '../dist/model.js';

test('heat seal is planar across its full width, with two touching films',()=>{
 for(let v=SEAL_START;v<=1;v+=.005)for(let u=-1;u<=1;u+=.025){
  const front=pouchPoint(u,v),back=pouchPoint(u,v,-1);
  assert.equal(front[2],SEAL_HALF_THICKNESS);assert.equal(back[2],-SEAL_HALF_THICKNESS);
  assert.equal(front[1],back[1]);assert.equal(front[0],back[0]);
 }
 assert.ok(pouchPoint(0,.5)[2]>SEAL_HALF_THICKNESS*20);
});
test('shoulder joins the seal continuously and film surfaces never cross',()=>{
 for(let u=-1;u<=1;u+=.02){assert.ok(Math.abs(pouchPoint(u,SEAL_START-1e-6)[2]-SEAL_HALF_THICKNESS)<1e-8);}
 for(let v=0;v<=1;v+=.005)for(let u=-1;u<=1;u+=.02){const f=pouchPoint(u,v),b=pouchPoint(u,v,-1);assert.ok(f.every(Number.isFinite));assert.ok(f[2]>b[2]);}
});
test('pouch retains finite geometry, separate flat seals, and the original label area',()=>{
 const m=new THREE.MeshStandardMaterial();const {group,label}=buildPouch(m,m);
 assert.equal(group.children.filter(n=>n.name.includes('flat heat seal')).length,2);
 for(const mesh of group.children)for(const name of ['position','normal'])assert.ok([...mesh.geometry.getAttribute(name).array].every(Number.isFinite));
 const p=label.geometry.getAttribute('position');for(let i=0;i<p.count;i++)assert.ok(p.getY(i)<1 && p.getZ(i)>0);
 assert.equal(rotationAt(0),0);assert.equal(rotationAt(1),Math.PI*2);assert.ok(labelHidden(.5));
});
