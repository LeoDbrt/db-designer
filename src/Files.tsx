import {useState} from "react";import {useStore} from "./store";import {listProjects,saveProject} from "./projects";
export default function Files({onClose}:{onClose:()=>void}){
  const s=useStore();
  const [,bump]=useState(()=>{const c=useStore.getState();saveProject(c.projectId,c.name,{mcd:c.mcd,positions:c.positions});return 0});
  const list=listProjects().sort((a,b)=>b.updatedAt-a.updatedAt);
  const run=(f:()=>void)=>()=>{f();bump(x=>x+1)};
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
    <div className="max-h-[80vh] w-[32rem] overflow-auto rounded-xl bg-white p-4 shadow-xl dark:bg-zinc-800 dark:text-zinc-100" onClick={e=>e.stopPropagation()}>
      <div className="mb-3 flex items-center"><h2 className="flex-1 font-semibold">Fichiers récents</h2>
        <button className="mr-2 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600" onClick={()=>{s.newProject();onClose()}}>+ Nouveau</button>
        <button onClick={onClose}>✕</button></div>
      <ul className="space-y-1">{list.map(p=><li key={p.id} className={`flex items-center rounded px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 ${p.id===s.projectId?"bg-indigo-50 dark:bg-zinc-700":""}`}>
        <button className="flex-1 text-left" onClick={()=>{s.openProject(p.id);onClose()}}>
          <div className="font-medium">{p.name}{p.id===s.projectId&&" (ouvert)"}</div>
          <div className="text-xs text-zinc-500">{new Date(p.updatedAt).toLocaleString("fr-FR")}</div></button>
        <button title="Dupliquer" onClick={run(()=>s.duplicateProject(p.id))}>⧉</button>
        <button title="Supprimer" className="ml-2 text-red-500" onClick={run(()=>{if(confirm(`Supprimer « ${p.name} » ?`))s.removeProject(p.id)})}>🗑</button></li>)}</ul></div></div>;
}
