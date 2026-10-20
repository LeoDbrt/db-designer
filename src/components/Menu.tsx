import {useEffect,useRef,useState} from "react";
export type Item={label:string;onClick?:()=>void;hint?:string;checked?:boolean;sep?:boolean};
export function Menu({label,items}:{label:string;items:Item[]}){
  const [open,setOpen]=useState(false);const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!open)return;const h=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false)};
    window.addEventListener("mousedown",h);return()=>window.removeEventListener("mousedown",h)},[open]);
  return <div ref={ref} className="relative">
    <button onClick={()=>setOpen(!open)} className={`rounded-md px-2.5 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${open?"bg-zinc-100 dark:bg-zinc-800":""}`}>{label}</button>
    {open&&<div className="absolute left-0 top-full z-40 mt-1 w-60 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
      {items.map((it,i)=>it.sep?<hr key={i} className="my-1 border-zinc-200 dark:border-zinc-700"/>:
        <button key={i} onClick={()=>{it.onClick?.();setOpen(false)}} className="flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700">
          <span className="w-4 text-indigo-600">{it.checked?"✓":""}</span><span className="flex-1">{it.label}</span><span className="text-xs text-zinc-400">{it.hint}</span></button>)}</div>}</div>;
}
