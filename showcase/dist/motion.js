// Hold the first frame during stagger delays and persist the last frame before
// releasing WAAPI. This also works on browsers without commitStyles().
const active=new WeakMap();
const applyFrame=(el,frame)=>{
  for(const property of ['opacity','transform'])if(property in frame)el.style[property]=String(frame[property]);
};
export function animateElement(el,keyframes,options){
  active.get(el)?.cancel();
  applyFrame(el,keyframes[0]);
  const animation=el.animate(keyframes,{...options,fill:'both'});
  active.set(el,animation);
  const finished=animation.finished.then(()=>{
    if(active.get(el)!==animation)return;
    if(el.isConnected!==false)applyFrame(el,keyframes.at(-1));
    active.delete(el);
    animation.cancel();
  },()=>{
    if(active.get(el)===animation)active.delete(el);
  });
  return {finished};
}
