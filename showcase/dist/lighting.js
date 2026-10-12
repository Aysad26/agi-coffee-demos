import * as THREE from './vendor/three.module.js';

export const FILM={color:0x141516,metalness:.025,roughness:.32,clearcoat:.12,clearcoatRoughness:.24,ior:1.47,specularIntensity:.85,bumpScale:.0012,envMapIntensity:1};
export const PAPER={color:0xffffff,metalness:0,roughness:.67,envMapIntensity:.7};
export const ENVIRONMENT_INTENSITY=.24;
export const ENVIRONMENT_ROTATION=.72;
export const LIGHTS=[
  {name:'Warm window key',color:0xfff4e7,intensity:6.8,width:1.25,height:4.2,position:[-3.0,2.7,4.3],target:[0,.3,0]},
  {name:'Narrow edge strip',color:0xf2f6ff,intensity:5.2,width:.58,height:3.5,position:[3.0,1.6,-1.9],target:[0,.2,0]},
  {name:'Quiet label fill',color:0xffffff,intensity:1.15,width:3.2,height:3.4,position:[1.0,-.1,5.2],target:[0,0,0]},
  {name:'Top seam highlight',color:0xfff5e6,intensity:2.5,width:1.8,height:.45,position:[-.7,4.0,1.0],target:[0,1.5,0]}
];
export function addProductLighting(scene){
  for(const spec of LIGHTS){
    const light=new THREE.RectAreaLight(spec.color,spec.intensity,spec.width,spec.height);
    light.name=spec.name;light.position.set(...spec.position);light.lookAt(...spec.target);scene.add(light);
  }
}
