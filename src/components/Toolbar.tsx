import {useStore} from "../store";import type {Tool} from "../App";
export default function Toolbar({tool,setTool}:{tool:Tool;setTool:(t:Tool)=>void}){
  const s=useStore();const hasEnt=s.selected.some(id=>s.mcd.entities.some(e=>e.id===id));
  const b=(a:boolean)=>`flex h-9 w-9 items-center justify-center rounded-lg text-lg disabled:opacity-30 ${a?"bg-indigo-600 text-white":"hover:bg-zinc-100 dark:hover:bg-zinc-700"}`;
  return <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white/95 p-1 shadow-md dark:border-zinc-700 dark:bg-zinc-800/95">
    <button className={b(tool==="select")} title="Sélection (V) : glisse pour sélectionner" onClick={()=>setTool("select")}>↖</button>
    <button className={b(tool==="pan")} title="Main (H) : glisse pour déplacer la vue" onClick={()=>setTool("pan")}>✋</button>
    <hr className="my-0.5 border-zinc-200 dark:border-zinc-700"/>
    <div draggable onDragStart={e=>e.dataTransfer.setData("application/x-entity","1")} className={b(false)+" cursor-grab"} title="Entité : clique ou glisse sur le canevas" onClick={()=>s.addEntity()}>▭</div>
    <button className={b(false)} disabled={!hasEnt} title="Association : sélectionne d'abord une ou plusieurs entités" onClick={s.addAssociation}>⬭</button></div>;
}
