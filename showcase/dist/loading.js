// Readiness progress comes from settled assets, never a synthetic timer.
export function createPreloader({root,content,documentRoot,reducedMotion=false,onFinish=()=>{}}){
  const bar=root.querySelector('.preloader-progress');
  const percent=root.querySelector('.preloader-percent');
  let completed=0,finished=false;
  content.inert=true;content.setAttribute('aria-busy','true');
  function update(value){
    completed=Math.max(completed,Math.min(99,Math.max(0,value)));
    if(finished)return;
    bar.style.setProperty('--progress',completed/100);
    bar.setAttribute('aria-valuenow',Math.round(completed));
    percent.textContent=String(Math.round(completed)).padStart(2,'0')+'%';
  }
  update(0);
  return {
    get active(){return !finished&&!root.hidden;},
    advance(weight){update(completed+weight);},
    async track(promise,weight){try{return await promise;}finally{update(completed+weight);}},
    async finish(){
      if(finished)return;finished=true;onFinish();
      bar.style.setProperty('--progress',1);bar.setAttribute('aria-valuenow','100');percent.textContent='100%';
      content.inert=false;content.removeAttribute('aria-busy');root.setAttribute('aria-hidden','true');
      if(!root.hidden&&!reducedMotion&&typeof root.animate==='function'){
        const exit=root.animate([{opacity:1},{opacity:0}],{duration:650,easing:'cubic-bezier(.42,0,.32,1)',fill:'forwards'});
        await exit.finished.catch(()=>{});root.hidden=true;exit.cancel();
      }else root.hidden=true;
      documentRoot.classList.remove('is-loading');
    }
  };
}
