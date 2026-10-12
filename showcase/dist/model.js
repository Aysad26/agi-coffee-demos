import * as THREE from './vendor/three.module.js';

// Filled film expands below the shoulder; the two films meet in a flat heat seal.
// The closure zipper is below that seal, not a rounded cap on the filled body.
export const SEAL_START=.91;
export const SEAL_HALF_THICKNESS=.012;
// Restore the original film folds while retaining the rounded side profile.
const CREASE_STRENGTH=1;
const smoothstep=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function pouchPoint(u,v,side=1){
  const y=-2.2+v*4.4;
  const corner=(v<.024?1-Math.sqrt(Math.max(0,1-((.024-v)/.024)**2)):v>.985?1-Math.sqrt(Math.max(0,1-((v-.985)/.015)**2)):0)*.045;
  const width=1.06-corner+.015*Math.sin(v*Math.PI)*(1-smoothstep((v-.76)/.15));
  const x=u*width;
  if(v>=SEAL_START)return[x,y,side*SEAL_HALF_THICKNESS];
  const shoulder=1-smoothstep((v-.76)/(SEAL_START-.76));
  // A broader elliptical shoulder rounds the front into the side gussets.
  const profile=.215+.155*Math.sqrt(Math.max(0,1-u*u));
  const filledDepth=profile*(.88+.12*Math.sin(v*Math.PI));
  const edge=Math.pow(Math.abs(u),5);
  const wrinkle=(Math.sin(v*45+u*15)*.017+Math.sin(v*85-u*34)*.008)*edge;
  const baseFold=Math.sin(u*17+v*39)*.024*Math.exp(-(((v-.08)/.1)**2));
  const shoulderPleat=Math.sin(u*22)*.012*Math.exp(-(((v-.82)/.07)**2))*edge;
  return [x,y,side*(SEAL_HALF_THICKNESS+(filledDepth+CREASE_STRENGTH*(wrinkle+baseFold+shoulderPleat))*shoulder)];
}

export function gridGeometry(xCount,yCount,sample,reverse=false){
  const positions=[],uv=[],indices=[];
  for(let j=0;j<=yCount;j++)for(let i=0;i<=xCount;i++){
    positions.push(...sample(i/xCount,j/yCount));uv.push(i/xCount,j/yCount);
  }
  for(let j=0;j<yCount;j++)for(let i=0;i<xCount;i++){
    const a=j*(xCount+1)+i,b=a+1,c=a+xCount+1,d=c+1;
    if(reverse)indices.push(a,c,b,b,c,d);else indices.push(a,b,c,b,d,c);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

export function buildPouch(bodyMaterial,labelMaterial){
  const g=new THREE.Group();
  const sealMaterial=bodyMaterial.clone();sealMaterial.roughness=.5;sealMaterial.bumpScale=.002;
  for(const side of [-1,1]){
    const panel=new THREE.Mesh(gridGeometry(64,110,(x,y)=>pouchPoint(x*2-1,y*SEAL_START,side),side===-1),bodyMaterial);
    panel.name=side===1?'front filled panel':'rear filled panel';g.add(panel);
    const seal=new THREE.Mesh(gridGeometry(64,18,(x,y)=>pouchPoint(x*2-1,SEAL_START+y*(1-SEAL_START),side),side===-1),sealMaterial);
    seal.name=side===1?'front flat heat seal':'rear flat heat seal';g.add(seal);
  }
  for(const s of [-1,1])for(const sealed of [false,true]){
    const side=new THREE.Mesh(gridGeometry(8,sealed?18:110,(x,t)=>{
      const v=sealed?SEAL_START+t*(1-SEAL_START):t*SEAL_START;
      const f=pouchPoint(s,v,1),b=pouchPoint(s,v,-1);
      const gusset=Math.sin(x*Math.PI)*.035*(1-smoothstep((v-.70)/.21));
      return [f[0]-s*gusset,f[1],b[2]+x*(f[2]-b[2])];
    },s===1),sealed?sealMaterial:bodyMaterial);
    side.name=(s===1?'right':'left')+(sealed?' sealed edge':' gusset');g.add(side);
  }
  for(const v of [0,1])g.add(new THREE.Mesh(gridGeometry(64,3,(x,y)=>{
    const f=pouchPoint(x*2-1,v,1),b=pouchPoint(x*2-1,v,-1);return[f[0],f[1],b[2]+y*(f[2]-b[2])];
  },v===1),bodyMaterial));
  const label=new THREE.Mesh(gridGeometry(40,48,(x,y)=>{
    const u=(x*2-1)*.84,v=.205+y*.478;const p=pouchPoint(u,v);p[2]+=.004;return p;
  }),labelMaterial);g.add(label);
  const seamMaterial=sealMaterial.clone();seamMaterial.roughness=.58;
  for(const side of [-1,1])for(const v of [.872,.885,.936,.946,.956,.966,.976,.986]){
    const pts=[];for(let k=0;k<=40;k++){
      const u=-.985+k/40*1.97;const p=pouchPoint(u,v,side);p[2]+=side*.0015;pts.push(new THREE.Vector3(...p));
    }
    const ridge=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,v<SEAL_START?.005:.002,4,false),seamMaterial);
    ridge.name=v<SEAL_START?'closure zipper':'heat seal embossing';g.add(ridge);
  }
  return {group:g,label};
}

// Single easing curve with a slow start and zero speed at both endpoints.
export const easeInSoft=t=>t*t*t*(10+t*(-15+6*t));
export const rotationAt=t=>Math.PI*2*easeInSoft(Math.max(0,Math.min(1,t)));
export const labelHidden=t=>Math.cos(rotationAt(t))<-.35;
