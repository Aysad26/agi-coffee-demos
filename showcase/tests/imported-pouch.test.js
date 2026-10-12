import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../dist/vendor/three.module.js';
import {GLTFLoader} from '../dist/vendor/addons/loaders/GLTFLoader.js';
import {RectAreaLightUniformsLib} from '../dist/vendor/addons/lights/RectAreaLightUniformsLib.js';
import {buildImportedPouch} from '../dist/client-pouch.js';
import {FILM,PAPER,addProductLighting} from '../dist/lighting.js';

const file=readFileSync(new URL('../dist/assets/agi-coffee-pouch.glb',import.meta.url));
const gltf=await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'');

test('supplied pouch has photographic proportions and a genuinely thin sealed top',()=>{
 const size=new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
 assert.ok(Math.abs(size.x/size.y-.505)<.01);assert.ok(size.z/size.y<.21);
 gltf.scene.traverse(n=>{if(n.isMesh){const p=n.geometry.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)>=1.81)assert.ok(Math.abs(p.getZ(i))<.012);}});
 const json=JSON.parse(file.subarray(20,20+file.readUInt32LE(12)).toString());
 assert.equal(json.images,undefined);assert.equal(json.textures,undefined);
});

test('complete AGI label conforms to the front surface, without holes or intersections',()=>{
 const {group,label}=buildImportedPouch(gltf,new THREE.MeshPhysicalMaterial(FILM),new THREE.MeshStandardMaterial(PAPER));
 const p=label.geometry.attributes.position;assert.equal(p.count,65*73);
 const ray=new THREE.Raycaster();ray.ray.direction.set(0,0,-1);group.updateMatrixWorld(true);
 for(let i=0;i<p.count;i+=19){
   ray.ray.origin.set(p.getX(i),p.getY(i),3);const hit=ray.intersectObject(gltf.scene,true)[0];
   assert.ok(hit);assert.ok(p.getZ(i)>hit.point.z+.005);assert.ok(p.getZ(i)<hit.point.z+.007);
 }
 assert.ok([...p.array].every(Number.isFinite));
});

test('vendored area-light uniforms initialize and all lights support film and label materials',()=>{
 RectAreaLightUniformsLib.init();assert.ok(THREE.UniformsLib.LTC_HALF_1);
 const scene=new THREE.Scene();addProductLighting(scene);assert.equal(scene.children.length,4);
 for(const l of scene.children){assert.ok(l.isRectAreaLight);assert.ok(l.position.length()>2);}
});
