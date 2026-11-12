import {useEffect,useState} from "react";
import Canvas from "./Canvas";import {RightPanel} from "./Panels";import {useStore} from "./store";
import Files from "./Files";import Header from "./components/Header";import Toolbar from "./components/Toolbar";import Diagram from "./components/Diagram";import Relational from "./components/Relational";
export type Tool="select"|"pan";
export type Module="mcd"|"mld"|"deps"|"uml";
export default function App(){
  const mcd=useStore(s=>s.mcd),positions=useStore(s=>s.positions),name=useStore(s=>s.name),extra=useStore(s=>s.extra);
  const [dark,setDark]=useState(false),[minimap,setMinimap]=useState(true),[files,setFiles]=useState(false),[tool,setTool]=useState<Tool>("select"),[module,setModule]=useState<Module>("mcd");
  useEffect(()=>{document.documentElement.classList.toggle("dark",dark)},[dark]);
  useEffect(()=>{const st=useStore.getState();st.setStatus("unsaved");const t=setTimeout(()=>st.save(),800);return()=>clearTimeout(t)},[mcd,positions,name,extra]);
  useEffect(()=>{const h=()=>useStore.getState().save();window.addEventListener("beforeunload",h);window.addEventListener("pagehide",h);
    return()=>{window.removeEventListener("beforeunload",h);window.removeEventListener("pagehide",h)}},[]);
  useEffect(()=>{const h=(e:KeyboardEvent)=>{
    const st=useStore.getState();const mod=e.ctrlKey||e.metaKey;const typing=(e.target as HTMLElement).matches("input,select,textarea");const k=e.key.toLowerCase();
    if(mod&&k==="s"){e.preventDefault();st.save()}
    else if(mod&&!typing&&k==="z"){e.preventDefault();e.shiftKey?st.redo():st.undo()}
    else if(mod&&!typing&&k==="y"){e.preventDefault();st.redo()}
    else if(!mod&&!typing&&k==="v")setTool("select");
    else if(!mod&&!typing&&k==="h")setTool("pan")};
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)},[]);
  return <div className="flex h-full flex-col bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
    <Header dark={dark} setDark={setDark} minimap={minimap} setMinimap={setMinimap} openFiles={()=>setFiles(true)} module={module} setModule={setModule}/>
    {module==="mcd"?<div className="flex min-h-0 flex-1"><main className="relative min-w-0 flex-1"><Toolbar tool={tool} setTool={setTool}/><Canvas dark={dark} minimap={minimap} tool={tool}/></main><RightPanel/></div>
      :module==="mld"?<Relational/>:<Diagram key={module} mod={module} dark={dark} minimap={minimap}/>}
    {files&&<Files onClose={()=>setFiles(false)}/>}</div>;
}
