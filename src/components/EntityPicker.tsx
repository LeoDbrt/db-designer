import {useState} from "react";import type {Entity} from "../core/types";
export default function EntityPicker({entities,onPick,current,placeholder}:{entities:Entity[];onPick:(id:string)=>void;current?:string;placeholder?:string}){
  const [q,setQ]=useState("");const [open,setOpen]=useState(false);
  const list=entities.filter(e=>e.name.toLowerCase().includes(q.trim().toLowerCase()));
  const pick=(id:string)=>{onPick(id);setQ("");setOpen(false)};
  return <div className="relative">
    <input className="w-full rounded border border-zinc-300 bg-transparent px-1.5 py-0.5 text-sm dark:border-zinc-600" value={open?q:(current??"")} placeholder={placeholder??"Rechercher…"}
      onFocus={()=>{setQ("");setOpen(true)}} onBlur={()=>setOpen(false)} onChange={e=>setQ(e.target.value)}
      onKeyDown={e=>{if(e.key==="Enter"&&list[0])pick(list[0].id);if(e.key==="Escape")setOpen(false)}}/>
    {open&&<ul className="absolute z-30 mt-1 max-h-48 w-full min-w-44 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
      {list.length?list.map(e=><li key={e.id}><button className="w-full px-3 py-1 text-left hover:bg-indigo-50 dark:hover:bg-zinc-700" onMouseDown={ev=>{ev.preventDefault();pick(e.id)}}>{e.name}</button></li>)
        :<li className="px-3 py-1 text-zinc-400">Aucun résultat</li>}</ul>}</div>;
}
