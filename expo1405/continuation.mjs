// A small, independent handoff control; the server chooses the next panel.
export class PanelContinuation{
 constructor({root,button,label,eligible,request,existingToken,navigate,notify}){
  Object.assign(this,{root,button,label,eligible,request,existingToken,navigate,notify});
  this.target=null;this.busy=false;this.loading=false;this.checkedAt=0;this.generation=0;
  button.addEventListener('click',()=>this.continue());this.render();
 }
 render(){
  const visible=this.eligible();this.root.hidden=!visible;
  this.button.disabled=!visible||this.busy||!this.target;
  this.button.textContent=this.busy?'در حال ورود…':'ورود به پنل بعدی ←';
  this.label.textContent=this.target?.title||(this.loading?'در حال دریافت پنل بعدی…':'پنل بعدی هنوز آماده نیست');
 }
 sync(){
  if(!this.eligible()){this.generation++;this.target=null;this.checkedAt=0;this.render();return;}
  this.render();this.refresh();
 }
 async refresh(force=false){
  if(!this.eligible()||this.loading||(!force&&this.checkedAt&&Date.now()-this.checkedAt<12000))return;
  const generation=this.generation;this.loading=true;this.checkedAt=Date.now();this.render();
  try{const data=await this.request('/next-panel');if(generation===this.generation&&this.eligible())this.target=(data.canContinue??data.finished)?data.nextPanel:null;}
  catch{if(generation===this.generation)this.target=null;}
  finally{this.loading=false;this.render();}
 }
 async continue(){
  if(this.busy||!this.target||!this.eligible())return;
  const target=this.target;this.busy=true;this.render();
  try{
   const result=await this.request('/next-panel',{method:'POST',body:{targetId:target.id,existingToken:this.existingToken(target.id)||null}});
   if(!this.eligible()||result.room!==target.id)throw Error('پنل بعدی تغییر کرده است. دوباره تلاش کنید.');
   await this.navigate(result);
  }catch(e){this.notify(e.message,true);await this.refresh(true);}
  finally{this.busy=false;this.render();}
 }
}
