import {useRef} from "react";import {z} from "zod";import {toPng,toSvg} from "html-to-image";
import {useStore} from "../store";import {demo} from "../core/demo";import {saveFile} from "../saveAs";import Logo from "./Logo";import {Menu} from "./Menu";import type {Module} from "../App";
const MODS:[Module,string][]=[["mcd","MCD"],["mld","Relationnel"],["deps","Dépendances"],["uml","UML"]];
const FileSchema=z.object({format:z.literal("db-designer/1"),name:z.string(),
  mcd:z.object({entities:z.array(z.any()),associations:z.array(z.any())}),positions:z.record(z.object({x:z.number(),y:z.number()})),extra:z.record(z.any()).optional()});
const LABEL={saved:"✓ Enregistré",saving:"Enregistrement…",unsaved:"Non enregistré"};
interface P{dark:boolean;setDark(v:boolean):void;minimap:boolean;setMinimap(v:boolean):void;openFiles():void;module:Module;setModule(m:Module):void}
export default function Header({dark,setDark,minimap,setMinimap,openFiles,module,setModule}:P){
  const s=useStore();const file=useRef<HTMLInputElement>(null);
  const exportJson=()=>saveFile(`${s.name}.json`,"application/json",()=>new Blob([JSON.stringify({format:"db-designer/1",name:s.name,mcd:s.mcd,positions:s.positions,extra:s.extra},null,2)]));
  const exportImg=(k:"png"|"svg")=>{const el=document.querySelector(".react-flow") as HTMLElement;
    const o={backgroundColor:dark?"#18181b":"#ffffff",filter:(n:HTMLElement)=>!n.classList?.contains("react-flow__controls")&&!n.classList?.contains("react-flow__minimap")};
    return saveFile(`${s.name}.${k}`,k==="png"?"image/png":"image/svg+xml",async()=>(await fetch(k==="png"?await toPng(el,o):await toSvg(el,o))).blob())};
  const importJson=async(f:File)=>{try{const p=FileSchema.parse(JSON.parse(await f.text()));s.load(p.name,{mcd:p.mcd as never,positions:p.positions,extra:p.extra})}catch{alert("Fichier JSON invalide.")}};
  const ic="rounded-md px-2 py-1 text-base hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800";
  return <header className="flex items-center gap-1 border-b border-zinc-200 px-3 py-1.5 dark:border-zinc-700">
    <Logo/><span className="ml-1.5 mr-3 font-semibold tracking-tight">DB<span className="text-indigo-600"> Designer</span></span>
    <div className="mr-2 flex rounded-lg bg-zinc-100 p-0.5 text-sm dark:bg-zinc-800">{MODS.map(([k,l])=><button key={k} onClick={()=>setModule(k)} className={`rounded-md px-2.5 py-0.5 ${module===k?"bg-white font-medium shadow-sm dark:bg-zinc-700":"text-zinc-500"}`}>{l}</button>)}</div>
    <Menu label="Fichier" items={[
      {label:"Nouveau",onClick:s.newProject},{label:"Ouvrir un fichier récent…",onClick:openFiles},{label:"Importer un JSON…",onClick:()=>file.current?.click()},{sep:true,label:""},
      {label:"Enregistrer",hint:"Ctrl+S",onClick:s.save},{label:"Exporter en JSON",onClick:exportJson},{label:"Exporter en PNG",onClick:()=>exportImg("png")},{label:"Exporter en SVG",onClick:()=>exportImg("svg")},{sep:true,label:""},
      {label:"Charger l'exemple",onClick:()=>s.load("Boutique (démo)",demo())}]}/>
    <Menu label="Affichage" items={[{label:"Minimap",checked:minimap,onClick:()=>setMinimap(!minimap)},{label:"Thème sombre",checked:dark,onClick:()=>setDark(!dark)}]}/>
    <Menu label="Aide" items={[{label:"Annuler / Rétablir",hint:"Ctrl+Z / Ctrl+Y"},{label:"Outil sélection",hint:"V"},{label:"Outil main",hint:"H"},{label:"Déplacer la vue",hint:"Espace + glisser"},
      {label:"Défiler / zoomer",hint:"2 doigts / pincer"},{label:"Supprimer",hint:"Suppr"},{label:"Changer une cardinalité",hint:"Clic dessus"}]}/>
    <div className="flex flex-1 justify-center"><input className="w-64 rounded bg-transparent px-2 py-1 text-center text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800" value={s.name} onChange={e=>s.setName(e.target.value)}/></div>
    <button className={ic} onClick={s.undo} disabled={!s.past.length} title="Annuler (Ctrl+Z)">↶</button>
    <button className={ic} onClick={s.redo} disabled={!s.future.length} title="Rétablir (Ctrl+Y)">↷</button>
    <span className="w-28 text-right text-xs text-zinc-500">{LABEL[s.status]}</span>
    <input ref={file} type="file" accept=".json" hidden onChange={e=>{const f=e.target.files?.[0];if(f)importJson(f);e.target.value=""}}/></header>;
}
