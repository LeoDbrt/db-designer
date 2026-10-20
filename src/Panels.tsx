import {useMemo,useState} from "react";
import {useStore} from "./store";import {saveFile} from "./saveAs";import EntityPicker from "./components/EntityPicker";
import {validate} from "./core/validate";import {mcdToMld} from "./core/mld";import {generateSql,type Dialect} from "./core/sql";
import {CARDINALITIES,DATA_TYPES,type DataType,type Cardinality} from "./core/types";

const inp="rounded border border-zinc-300 bg-transparent px-1.5 py-0.5 dark:border-zinc-600";
function Properties(){
  const s=useStore();const id=s.selected.length===1?s.selected[0]:null;
  const ent=s.mcd.entities.find(e=>e.id===id),as=s.mcd.associations.find(a=>a.id===id);const o=ent??as;
  if(!o)return <p className="p-4 text-sm text-zinc-500">Sélectionne une entité ou une association.</p>;
  return <div className="space-y-3 p-4 text-sm">
    <input className={inp+" w-full font-semibold"} value={o.name} onChange={e=>s.rename(o.id,e.target.value)}/>
    {as&&<div className="space-y-1.5"><div className="text-xs font-medium uppercase text-zinc-500">Branches</div>
      {as.links.map(l=><div key={l.id} className="flex items-center gap-1.5">
        <div className="w-28"><EntityPicker entities={s.mcd.entities} current={s.mcd.entities.find(e=>e.id===l.entityId)?.name??"(supprimée)"} onPick={id=>s.updLink(as.id,l.id,{entityId:id})}/></div>
        <select className={inp} value={l.cardinality} onChange={e=>s.updLink(as.id,l.id,{cardinality:e.target.value as Cardinality})}>{CARDINALITIES.map(c=><option key={c}>{c}</option>)}</select>
        <input className={inp+" w-20"} placeholder="rôle" value={l.role??""} onChange={e=>s.updLink(as.id,l.id,{role:e.target.value})}/><button className="text-red-500" onClick={()=>s.delLink(as.id,l.id)}>✕</button></div>)}
      <EntityPicker entities={s.mcd.entities} placeholder="+ Ajouter une branche (rechercher une entité)…" onPick={id=>s.addLink(as.id,id)}/>
      <label className="flex items-center gap-2 pt-1"><input type="checkbox" checked={!as.hideCard} onChange={e=>s.setAssoc(as.id,{hideCard:!e.target.checked})}/>Afficher les cardinalités</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={!as.hideMax} onChange={e=>s.setAssoc(as.id,{hideMax:!e.target.checked})}/>Afficher les cardinalités max (1,N / M,N)</label></div>}
    <div className="text-xs font-medium uppercase text-zinc-500">Attributs</div>
    {o.attributes.map(a=><div key={a.id} className="flex items-center gap-1">
      <input className={inp+" w-28"} value={a.name} onChange={e=>s.updAttr(o.id,a.id,{name:e.target.value})}/>
      <select className={inp} value={a.type} onChange={e=>s.updAttr(o.id,a.id,{type:e.target.value as DataType})}>{DATA_TYPES.map(t=><option key={t}>{t}</option>)}</select>
      {ent&&<label title="Identifiant"><input type="checkbox" checked={a.isIdentifier} onChange={e=>s.updAttr(o.id,a.id,{isIdentifier:e.target.checked})}/> ID</label>}
      <button onClick={()=>s.moveAttr(o.id,a.id,-1)}>↑</button><button onClick={()=>s.moveAttr(o.id,a.id,1)}>↓</button>
      <button className="text-red-500" onClick={()=>s.delAttr(o.id,a.id)}>✕</button></div>)}
    <button className="text-indigo-600" onClick={()=>s.addAttr(o.id)}>+ Attribut</button></div>;
}
function Validation(){
  const mcd=useStore(s=>s.mcd),sel=useStore(s=>s.setSelection);const ds=useMemo(()=>validate(mcd),[mcd]);
  if(!ds.length)return <p className="p-4 text-sm text-emerald-600">✓ Aucun problème détecté.</p>;
  return <ul className="space-y-1 p-3 text-sm">{ds.map((d,i)=><li key={i}><button className="w-full rounded px-2 py-1 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700" onClick={()=>d.targetId&&sel([d.targetId])}>
    <span className="mr-1 text-red-500">●</span>{d.message}</button></li>)}</ul>;
}
function useMld(){
  const mcd=useStore(s=>s.mcd);
  return useMemo(()=>{const errs=validate(mcd);return errs.length?{errs,mld:null}:{errs,mld:mcdToMld(mcd)}},[mcd]);
}
function Blocked({n}:{n:number}){return <p className="p-4 text-sm text-red-500">{n} erreur(s) de validation : corrige le MCD pour générer le modèle relationnel.</p>}
function Mld(){
  const {errs,mld}=useMld();if(!mld)return <Blocked n={errs.length}/>;
  return <div className="space-y-3 p-4 text-sm">
    {mld.tables.map(t=><div key={t.name}><b>{t.name}</b>(
      {t.columns.map((c,i)=>{const pk=t.primaryKey.includes(c.name),fk=t.foreignKeys.some(f=>f.columns.includes(c.name));
        return <span key={c.name}>{i?", ":""}<span className={(pk?"underline ":"")+(fk?"italic text-indigo-600":"")}>{fk?"#":""}{c.name}</span></span>})})</div>)}
    {mld.warnings.map((w,i)=><p key={i} className="text-amber-600">⚠ {w.message}</p>)}
    <details><summary className="cursor-pointer text-zinc-500">Règles appliquées</summary><ul className="mt-1 list-disc pl-5 text-xs">{mld.rules.map((r,i)=><li key={i}>{r}</li>)}</ul></details>
    <p className="text-xs text-zinc-500">Souligné = clé primaire · # italique = clé étrangère</p></div>;
}
const KW=/\b(CREATE TABLE|PRIMARY KEY|FOREIGN KEY|REFERENCES|NOT NULL|UNIQUE|INTEGER|TEXT|REAL|BOOLEAN|DATE|NUMERIC)\b/g;
function Sql(){
  const {errs,mld}=useMld();const [d,setD]=useState<Dialect>("sqlite");const name=useStore(s=>s.name);
  if(!mld)return <Blocked n={errs.length}/>;
  const sql=generateSql(mld,d);
  return <div className="space-y-2 p-3 text-sm"><div className="flex gap-2">
    <select className={inp} value={d} onChange={e=>setD(e.target.value as Dialect)}><option value="sqlite">SQLite</option><option value="postgres">PostgreSQL</option></select>
    <button className={inp} onClick={()=>navigator.clipboard.writeText(sql)}>Copier</button>
    <button className={inp} onClick={()=>saveFile(`${name||"schema"}.sql`,"application/sql",()=>new Blob([sql]))}>.sql</button></div>
    <pre className="overflow-auto rounded bg-zinc-50 p-3 font-mono text-xs dark:bg-zinc-900">{sql.split(KW).map((p,i)=>i%2?<span key={i} className="font-medium text-indigo-500">{p}</span>:p)}</pre></div>;
}
export function RightPanel(){
  const [tab,setTab]=useState("Propriétés");const errs=useStore(s=>validate(s.mcd).length);
  const tabs=["Propriétés","Validation","MLD","SQL"];
  return <aside className="flex w-96 flex-col border-l border-zinc-200 dark:border-zinc-700">
    <div className="flex border-b border-zinc-200 text-sm dark:border-zinc-700">{tabs.map(t=><button key={t} onClick={()=>setTab(t)}
      className={`flex-1 px-2 py-2 ${tab===t?"border-b-2 border-indigo-600 font-medium":"text-zinc-500"}`}>{t}{t==="Validation"&&errs>0&&<span className="ml-1 rounded-full bg-red-500 px-1.5 text-xs text-white">{errs}</span>}</button>)}</div>
    <div className="flex-1 overflow-auto">{tab==="Propriétés"?<Properties/>:tab==="Validation"?<Validation/>:tab==="MLD"?<Mld/>:<Sql/>}</div></aside>;
}
