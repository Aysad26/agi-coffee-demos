import * as THREE from './vendor/three.module.js';
import {gridGeometry} from './model.js';

export function buildImportedPouch(gltf,bodyMaterial,labelMaterial){
  const group=new THREE.Group();group.name='AGI · supplied pouch';
  const surface=gltf.scene;
  surface.traverse(n=>{if(n.isMesh){n.material=bodyMaterial;n.frustumCulled=false;}});
  group.add(surface);group.updateMatrixWorld(true);
  const ray=new THREE.Raycaster();ray.ray.direction.set(0,0,-1);
  const labelGeometry=gridGeometry(64,72,(u,v)=>{
    const x=(u-.5)*1.87,y=-1.34+v*2.16;
    ray.ray.origin.set(x,y,3);
    const hit=ray.intersectObject(surface,true)[0];
    if(!hit)throw new Error('The photographic label must remain on the pouch surface.');
    return [x,y,hit.point.z+.006];
  });
  const label=new THREE.Mesh(labelGeometry,labelMaterial);label.name='Original AGI photographic label';
  label.renderOrder=1;group.add(label);
  // Tiny horizontal seal embossing below the cut edge, like the client photos.
  const seamMaterial=bodyMaterial.clone();seamMaterial.bumpMap=null;seamMaterial.roughness=.42;
  for(const side of [-1,1])for(const y of [1.83,1.87,1.91]){
    const points=[new THREE.Vector3(-1.072,y,side*.012),new THREE.Vector3(1.072,y,side*.012)];
    const seam=new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(...points),1,.0016,4,false),seamMaterial);
    seam.name='Fine heat-seal embossing';group.add(seam);
  }
  return {group,label};
}
