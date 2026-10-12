import * as THREE from 'three';

export const ORIGIN={lat:9.03,lon:38.74};
export const DESTINATION={lat:55.75,lon:37.62};
export const EASE=t=>t<.5?4*t*t*t:1-((-2*t+2)**3)/2;
export const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));

// Matches SphereGeometry UV coordinates and the standard equirectangular map.
export function geoVector(lat,lon,r=1){
  const a=THREE.MathUtils.degToRad(lat),b=THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(r*Math.cos(a)*Math.cos(b),r*Math.sin(a),-r*Math.cos(a)*Math.sin(b));
}
export function routePoint(t){
  const a=geoVector(ORIGIN.lat,ORIGIN.lon),b=geoVector(DESTINATION.lat,DESTINATION.lon);
  const angle=a.angleTo(b),s=Math.sin(angle);
  return a.multiplyScalar(Math.sin((1-t)*angle)/s).add(b.multiplyScalar(Math.sin(t*angle)/s)).normalize().multiplyScalar(1.032+Math.sin(t*Math.PI)*.24);
}
class RouteCurve extends THREE.Curve{getPoint(t,target=new THREE.Vector3()){return target.copy(routePoint(t));}}

export function createGlobe(textures){
  const world=new THREE.Group();world.name='AGI / Ethiopia to Russia';
  const earth=new THREE.Mesh(new THREE.SphereGeometry(1,192,128),new THREE.MeshPhysicalMaterial({
    map:textures.color,roughnessMap:textures.roughness,roughness:.87,metalness:.77,
    displacementMap:textures.height,displacementScale:.018,
    bumpMap:textures.height,bumpScale:.012,clearcoat:.22,clearcoatRoughness:.52,
    envMapIntensity:.62,
  }));
  earth.name='Champagne gold continents / graphite oceans';world.add(earth);

  // The meridians sit under raised land, visible only in the dark oceans.
  const gridMaterial=new THREE.LineBasicMaterial({color:0x8b713e,transparent:true,opacity:.10});
  for(let lat=-60;lat<=60;lat+=30){
    const points=Array.from({length:181},(_,i)=>geoVector(lat,i*2-180,1.002));
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),gridMaterial));
  }
  for(let lon=-180;lon<180;lon+=30){
    const points=Array.from({length:91},(_,i)=>geoVector(i*2-90,lon,1.002));
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),gridMaterial));
  }

  const glow=new THREE.Mesh(new THREE.SphereGeometry(1.049,80,48),new THREE.ShaderMaterial({
    vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
    fragmentShader:'varying vec3 vN;varying vec3 vV;void main(){float rim=pow(1.-max(0.,dot(normalize(vN),normalize(vV))),4.5);gl_FragColor=vec4(.67,.45,.18,rim*.17);}',
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.FrontSide,
  }));world.add(glow);

  const curve=new RouteCurve();
  const routeGeometry=new THREE.TubeGeometry(curve,180,.0034,8,false);
  const route=new THREE.Mesh(routeGeometry,new THREE.MeshBasicMaterial({color:0xf5d397,transparent:true,opacity:.92}));
  route.renderOrder=3;route.geometry.setDrawRange(0,0);world.add(route);
  const glowRoute=new THREE.Mesh(new THREE.TubeGeometry(curve,180,.012,8,false),new THREE.MeshBasicMaterial({color:0xe3af5f,transparent:true,opacity:.07,depthWrite:false,blending:THREE.AdditiveBlending}));
  glowRoute.geometry.setDrawRange(0,0);world.add(glowRoute);
  const runner=new THREE.Mesh(new THREE.SphereGeometry(.010,12,8),new THREE.MeshBasicMaterial({color:0xffe6b5}));
  const runnerGlow=new THREE.Mesh(new THREE.SphereGeometry(.025,16,8),new THREE.MeshBasicMaterial({color:0xf6c36f,transparent:true,opacity:.18,depthWrite:false,blending:THREE.AdditiveBlending}));
  runner.add(runnerGlow);runner.visible=false;world.add(runner);

  function marker(location){
    const point=geoVector(location.lat,location.lon,1.03);
    const node=new THREE.Group();node.position.copy(point);
    node.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),point.clone().normalize());
    const pin=new THREE.Mesh(new THREE.SphereGeometry(.015,16,12),new THREE.MeshBasicMaterial({color:0xf7d392}));
    const rim=new THREE.Mesh(new THREE.RingGeometry(.028,.030,48),new THREE.MeshBasicMaterial({color:0xe6ba73,side:THREE.DoubleSide,transparent:true,opacity:.65,depthWrite:false}));
    const pulse=new THREE.Mesh(new THREE.RingGeometry(.031,.033,48),new THREE.MeshBasicMaterial({color:0xe6ba73,side:THREE.DoubleSide,transparent:true,opacity:.32,depthWrite:false}));
    rim.position.z=.002;pulse.position.z=.003;node.add(pin,rim,pulse);node.scale.setScalar(.001);world.add(node);
    return {node,pulse,point};
  }
  const origin=marker(ORIGIN),destination=marker(DESTINATION);
  return {world,origin,destination,route,glowRoute,runner};
}
