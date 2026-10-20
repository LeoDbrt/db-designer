import {create} from "zustand";
import type {Doc,Attribute,Association,Link,Pos} from "./core/types";
import {demo} from "./core/demo";
import {saveProject,loadProject,deleteProject,listProjects,lastId} from "./projects";
export const uid=()=>crypto.randomUUID();
export const newAttr=(name:string,ident=false):Attribute=>({id:uid(),name,type:ident?"integer":"text",isIdentifier:ident,nullable:!ident,unique:false});
function initial():{projectId:string;name:string}&Doc{
  try{
    const last=lastId();const p=last?loadProject(last):null;if(last&&p)return {projectId:last,...p};
    const old=localStorage.getItem("db-designer:project");
    if(old){const o=JSON.parse(old);const id=uid();saveProject(id,o.name,o);return {projectId:id,...o}}
  }catch{}
  return {projectId:uid(),name:"Boutique (démo)",...demo()};
}
type Status="saved"|"saving"|"unsaved";
interface S extends Doc{
  projectId:string;name:string;selected:string[];past:Doc[];future:Doc[];status:Status;
  setName(n:string):void;setStatus(s:Status):void;setSelection(ids:string[]):void;applySelect(id:string,on:boolean):void;
  addEntity(pos?:Pos):void;addAssociation():void;rename(id:string,name:string):void;
  addAttr(o:string):void;updAttr(o:string,a:string,p:Partial<Attribute>):void;delAttr(o:string,a:string):void;moveAttr(o:string,a:string,dir:-1|1):void;
  updLink(aid:string,lid:string,p:Partial<Link>):void;deleteEls(ids:string[]):void;setPos(id:string,p:Pos):void;
  snap():void;undo():void;redo():void;load(name:string,d:Doc):void;
  save():void;openProject(id:string):void;newProject():void;duplicateProject(id:string):void;removeProject(id:string):void;addLink(aid:string,entityId:string):void;setAssoc(id:string,p:Partial<Association>):void;delLink(aid:string,lid:string):void;
}
export const useStore=create<S>((set,get)=>{
  const cur=():Doc=>({mcd:get().mcd,positions:get().positions});
  const mutate=(fn:(d:Doc)=>void)=>{const prev=cur();const d=structuredClone(prev);fn(d);set({...d,past:[...get().past,prev].slice(-100),future:[]})};
  const owner=(d:Doc,id:string)=>d.mcd.entities.find(e=>e.id===id)??d.mcd.associations.find(a=>a.id===id);
  const switchTo=(name:string,d:Doc,id:string)=>set({projectId:id,name,mcd:structuredClone(d.mcd),positions:structuredClone(d.positions),selected:[],past:[],future:[]});
  const empty:Doc={mcd:{entities:[],associations:[]},positions:{}};
  return {...initial(),selected:[],past:[],future:[],status:"saved" as Status,
    setName:name=>set({name}),setStatus:status=>set({status}),setSelection:selected=>set({selected}),
    applySelect:(id,on)=>set(s=>({selected:on?[...new Set([...s.selected,id])]:s.selected.filter(x=>x!==id)})),
    addEntity:pos=>{const id=uid();const n=get().mcd.entities.length+1;
      mutate(d=>{d.mcd.entities.push({id,name:`Entité ${n}`,attributes:[newAttr(`id_entite_${n}`,true)]});d.positions[id]=pos??{x:60+n*30,y:60+n*30}});
      set({selected:[id]})},
    addAssociation:()=>{
      const ents=get().selected.filter(id=>get().mcd.entities.some(e=>e.id===id));if(!ents.length)return;
      const id=uid();const pts=ents.map(e=>get().positions[e]??{x:0,y:0});
      const pos={x:pts.reduce((s,p)=>s+p.x,0)/pts.length+80,y:pts.reduce((s,p)=>s+p.y,0)/pts.length+120};
      const mk=(entityId:string,role?:string):Link=>({id:uid(),entityId,cardinality:"0,N",role});
      const links=ents.length===1?[mk(ents[0],"rôle 1"),mk(ents[0],"rôle 2")]:ents.map(e=>mk(e));
      mutate(d=>{d.mcd.associations.push({id,name:`associe_${d.mcd.associations.length+1}`,links,attributes:[]});d.positions[id]=pos});
      set({selected:[id]})},
    rename:(id,name)=>mutate(d=>{const o=owner(d,id);if(o)o.name=name}),
    addAttr:o=>mutate(d=>{const x=owner(d,o);if(x)x.attributes.push(newAttr(`attribut_${x.attributes.length+1}`))}),
    updAttr:(o,a,p)=>mutate(d=>{const at=owner(d,o)?.attributes.find(x=>x.id===a);if(at)Object.assign(at,p)}),
    delAttr:(o,a)=>mutate(d=>{const x=owner(d,o);if(x)x.attributes=x.attributes.filter(y=>y.id!==a)}),
    moveAttr:(o,a,dir)=>mutate(d=>{const x=owner(d,o);if(!x)return;const i=x.attributes.findIndex(y=>y.id===a),j=i+dir;
      if(i<0||j<0||j>=x.attributes.length)return;[x.attributes[i],x.attributes[j]]=[x.attributes[j],x.attributes[i]]}),
    updLink:(aid,lid,p)=>mutate(d=>{const l=d.mcd.associations.find(a=>a.id===aid)?.links.find(x=>x.id===lid);if(l)Object.assign(l,p)}),
    deleteEls:ids=>{mutate(d=>{
      d.mcd.entities=d.mcd.entities.filter(e=>!ids.includes(e.id));
      d.mcd.associations=d.mcd.associations.filter(a=>!ids.includes(a.id));
      d.mcd.associations.forEach(a=>a.links=a.links.filter(l=>!ids.includes(l.entityId)));
      ids.forEach(i=>delete d.positions[i])});set({selected:[]})},
    setPos:(id,p)=>set(s=>({positions:{...s.positions,[id]:p}})),
    snap:()=>set(s=>({past:[...s.past,cur()].slice(-100),future:[]})),
    undo:()=>{const {past,future}=get();const prev=past.at(-1);if(!prev)return;set({...prev,past:past.slice(0,-1),future:[cur(),...future]})},
    redo:()=>{const {past,future}=get();const nxt=future[0];if(!nxt)return;set({...nxt,past:[...past,cur()],future:future.slice(1)})},
    save:()=>{const s=get();set({status:"saving"});saveProject(s.projectId,s.name,{mcd:s.mcd,positions:s.positions});setTimeout(()=>set({status:"saved"}),250)},
    load:(name,d)=>{get().save();switchTo(name,d,uid());get().save()},
    openProject:id=>{if(id===get().projectId)return;get().save();const p=loadProject(id);if(p)switchTo(p.name,p,id)},
    newProject:()=>get().load("Nouveau projet",empty),
    duplicateProject:id=>{get().save();const p=loadProject(id);if(p)saveProject(uid(),`${p.name} (copie)`,p)},
    removeProject:id=>{deleteProject(id);if(id!==get().projectId)return;const n=listProjects()[0];const p=n?loadProject(n.id):null;
      if(n&&p)switchTo(p.name,p,n.id);else{switchTo("Nouveau projet",empty,uid());get().save()}},
    setAssoc:(id,p)=>mutate(d=>{const a=d.mcd.associations.find(x=>x.id===id);if(a)Object.assign(a,p)}),
    addLink:(aid,entityId)=>mutate(d=>{d.mcd.associations.find(a=>a.id===aid)?.links.push({id:uid(),entityId,cardinality:"0,N"})}),
    delLink:(aid,lid)=>mutate(d=>{const a=d.mcd.associations.find(x=>x.id===aid);if(a)a.links=a.links.filter(l=>l.id!==lid)}),
  };
});
