import {useMemo} from "react";import {useStore} from "../store";import {validate} from "../core/validate";import {mcdToMld} from "../core/mld";
// Syntaxe : table(_clé_primaire, #clé_étrangère, attribut)   _# = clé primaire qui est aussi étrangère
const parse=(t:string)=>t.split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{
  const m=l.match(/^([^(]+)\((.*)\)\s*$/);if(!m)return {raw:l,name:"",cols:[]};
  return {raw:l,name:m[1].trim(),cols:m[2].split(",").map(c=>c.trim()).filter(Boolean).map(c=>({pk:c.startsWith("_"),fk:/^_?#/.test(c),name:c.replace(/^[_#]+/,"")}))}});
export default function Relational(){
  const text:string=useStore(s=>s.extra?.mld?.text)??"";
  const set=(t:string)=>useStore.getState().setExtra("mld",{text:t});
  const rels=useMemo(()=>parse(text),[text]);
  const fromMcd=()=>{const st=useStore.getState();
    if(validate(st.mcd).length){alert("Corrige d'abord les erreurs du MCD.");return}
    if(text&&!confirm("Remplacer le texte actuel ?"))return;
    set(mcdToMld(st.mcd).tables.map(t=>`${t.name}(${t.columns.map(c=>(t.primaryKey.includes(c.name)?"_":"")+(t.foreignKeys.some(f=>f.columns.includes(c.name))?"#":"")+c.name).join(", ")})`).join("\n"))};
  return <div className="flex min-h-0 flex-1">
    <section className="flex w-1/2 flex-col gap-2 border-r border-zinc-200 p-4 dark:border-zinc-700">
      <div className="flex items-center"><h2 className="flex-1 text-sm font-semibold">Écrire le modèle relationnel</h2>
        <button className="rounded border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800" onClick={fromMcd}>Importer depuis le MCD</button></div>
      <textarea className="min-h-0 flex-1 resize-none rounded border border-zinc-300 bg-transparent p-3 font-mono text-sm dark:border-zinc-600" value={text} onChange={e=>set(e.target.value)}
        placeholder={"client(_id_client, nom, email)\ncommande(_id_commande, date, #id_client)"}/>
      <p className="text-xs text-zinc-500">Une relation par ligne : <code>nom(attributs)</code>. <code>_</code> = clé primaire, <code>#</code> = clé étrangère, <code>_#</code> = les deux.</p></section>
    <section className="flex-1 space-y-2 overflow-auto p-6 text-lg">
      {rels.map((r,i)=>r.name?<div key={i}><b>{r.name}</b> (
        {r.cols.map((c,j)=><span key={j}>{j?", ":""}<span className={(c.pk?"underline ":"")+(c.fk?"text-indigo-600 dark:text-indigo-300":"")}>{c.fk?"#":""}{c.name}</span></span>)} )</div>
        :<div key={i} className="text-sm text-red-500">Syntaxe invalide : « {r.raw} » (attendu : nom(attribut, …))</div>)}</section></div>;
}
