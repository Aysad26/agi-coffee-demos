export const clamp=(n,min=0,max=1)=>Math.max(min,Math.min(max,n));
export const ease=t=>t<.5?4*t*t*t:1-((-2*t+2)**3)/2;
export function stateAt(time,reduced=false){
  if(reduced)return {map:1,origin:1,route:1,destination:1,ship:1,spark:0,sparkOpacity:0};
  const cycle=(time-3.8)%8;
  const route=ease(clamp((time-.95)/2.55));
  const travelling=time>=.95&&time<3.5;
  const idle=time>=3.8&&cycle<3.4;
  const spark=travelling?route:idle?ease(clamp(cycle/3.4)):1;
  return {
    map:ease(clamp(time/1.7)),
    origin:ease(clamp((time-.35)/.85)),
    route,
    destination:ease(clamp((time-2.8)/.85)),
    ship:ease(clamp((time-.4)/2.4)),
    spark,
    sparkOpacity:travelling?1:idle?Math.sin(clamp(cycle/3.4)*Math.PI)*.8:0,
  };
}
