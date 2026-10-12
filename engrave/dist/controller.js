export function createController({count,initialIndex=0,transition,onChange=()=>{}}){
  let index=initialIndex,target=initialIndex,busy=false,pending=Promise.resolve();
  async function drain(){
    busy=true;
    try{
      while(target!==index){
        const next=target,delta=(next-index+count)%count,direction=delta>count/2?-1:1;
        await transition(index,next,direction);
        index=next;
        onChange(index);
      }
    }catch(error){target=index;throw error;}finally{busy=false;}
  }
  return {
    get index(){return index;},get target(){return target;},get busy(){return busy;},
    request(next){target=((next%count)+count)%count;if(!busy&&target!==index)pending=drain();return pending;}
  };
}
