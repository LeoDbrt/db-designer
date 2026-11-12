import {useEffect,useMemo,useState,type CSSProperties,type ReactNode} from "react";
import {ReactFlow,Background,Controls,MiniMap,Handle,Position,BaseEdge,EdgeLabelRenderer,useInternalNode,type Node,type Edge,type NodeProps,type EdgeProps,type NodeChange,type InternalNode} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {useStore,uid} from "../store";

type DNode={id:string;kind:"attr"|"junction"|"class";x:number;y:number;name:string;attrs?:string;methods?:string};
type DEdge={id:string;from:string;to:string;kind:string;label?:string;m1?:string;m2?:string};
type DData={nodes:DNode[];edges:DEdge[]};
const KINDS:Record<string,{label:string;end?:string;start?:string;dash?:boolean}>={
  assoc:{label:"Association"},aggr:{label:"Agrégation (◇)",start:"m-dia"},comp:{label:"Composition (◆)",start:"m-dia-f"},
  inh:{label:"Héritage (△)",end:"m-tri"},real:{label:"Réalisation (implémente)",end:"m-tri",dash:true},dep:{label:"Dépendance",end:"m-arr",dash:true},
  df:{label:"Dépendance fonctionnelle",end:"m-arr"},join:{label:"Jonction"}};
const HELP={
  deps:"Ajoute des attributs (○), puis « Relier » : clique sur le déterminant, puis sur l'attribut qui en dépend (Prix → Client : Client dépend de Prix). Déterminant composé : ajoute une jonction (•), relie A et B vers elle, puis elle vers C.",
  uml:"Ajoute des classes (▤), puis « Relier » : clique sur la classe de départ puis d'arrivée. Choisis ensuite le type de lien (héritage, composition…) et les multiplicités. Pour l'agrégation et la composition, la classe de départ est le « tout »."};
const hid:CSSProperties={left:"50%",top:"50%",opacity:0,pointerEvents:"none"};
const Hs=()=><><Handle type="target" position={Position.Top} style={hid}/><Handle type="source" position={Position.Top} style={hid}/></>;
const box=(s?:boolean)=>`border-2 bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 ${s?"border-indigo-500":"border-zinc-500"}`;
function ClassNode({data,selected}:NodeProps){const n=data.n as DNode;
  return <div className={`min-w-40 ${box(selected)}`}><Hs/><div className="border-b-2 border-inherit px-3 py-1 text-center font-bold">{n.name||"Classe"}</div>
    <pre className="min-h-5 border-b-2 border-inherit px-3 py-1 font-mono text-xs">{n.attrs}</pre><pre className="min-h-5 px-3 py-1 font-mono text-xs">{n.methods}</pre></div>}
function AttrNode({data,selected}:NodeProps){const n=data.n as DNode;
  return <div className={`flex h-20 w-20 items-center justify-center rounded-full p-1 text-center text-xs ${box(selected)}`}><Hs/>{n.name}</div>}
function JunctionNode({selected}:NodeProps){return <div className={`h-3 w-3 rounded-full ${selected?"bg-indigo-500":"bg-zinc-600"}`}><Hs/></div>}
const nodeTypes={class:ClassNode,attr:AttrNode,junction:JunctionNode};

// Arête « flottante » : va de bord à bord (et non de centre à centre) pour que les symboles restent visibles.
function FloatEdge({id,source,target,markerEnd,markerStart,style,data,selected}:EdgeProps){
  const s=useInternalNode(source),t=useInternalNode(target);if(!s||!t)return null;
  const ctr=(n:InternalNode)=>({x:n.internals.positionAbsolute.x+(n.measured.width??0)/2,y:n.internals.positionAbsolute.y+(n.measured.height??0)/2});
  const edge=(n:InternalNode,o:{x:number;y:number})=>{const c=ctr(n),w=(n.measured.width??1)/2,h=(n.measured.height??1)/2,dx=o.x-c.x,dy=o.y-c.y;
    const k=n.type==="attr"?Math.hypot(dx,dy)/w:Math.max(Math.abs(dx)/w,Math.abs(dy)/h);return k?{x:c.x+dx/k,y:c.y+dy/k}:c};
  const a=edge(s,ctr(t)),b=edge(t,ctr(s));const e=data as DEdge;
  const lbl=(f:number,text?:string)=>text?<div className="nodrag nopan absolute rounded bg-white/85 px-1 text-xs text-zinc-900 dark:bg-zinc-900/85 dark:text-zinc-100"
    style={{transform:`translate(-50%,-50%) translate(${a.x+(b.x-a.x)*f}px,${a.y+(b.y-a.y)*f}px)`}}>{text}</div>:null;
  return <><BaseEdge id={id} path={`M${a.x},${a.y}L${b.x},${b.y}`} markerEnd={markerEnd} markerStart={markerStart} style={{...style,strokeWidth:selected?3:1.5}}/>
    <EdgeLabelRenderer>{lbl(0.5,e.label)}{lbl(0.12,e.m1)}{lbl(0.88,e.m2)}</EdgeLabelRenderer></>;
}
const edgeTypes={float:FloatEdge};
const mk=(id:string,vb:string,rx:number,path:string,fill:string)=><marker id={id} viewBox={vb} refX={rx} refY="10" markerWidth="16" markerHeight="14" orient="auto-start-reverse"><path d={path} fill={fill} stroke="#71717a" strokeWidth="1.6"/></marker>;
const Field=({label,children}:{label:string;children:ReactNode})=><label className="block"><span className="mb-1 block text-xs font-medium uppercase text-zinc-500">{label}</span>{children}</label>;
const inp="w-full rounded border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-600";

export default function Diagram({mod,dark,minimap}:{mod:"deps"|"uml";dark:boolean;minimap:boolean}){
  const stored=useStore(s=>s.extra?.[mod]) as DData|undefined;const data=stored??{nodes:[],edges:[]};
  const cur=():DData=>useStore.getState().extra?.[mod]??{nodes:[],edges:[]};
  const put=(d:DData)=>useStore.getState().setExtra(mod,d);
  const [sel,setSel]=useState<{t:"n"|"e";id:string}|null>(null);const [linking,setLinking]=useState(false);const [from,setFrom]=useState<string|null>(null);
  const add=(kind:DNode["kind"])=>{const d=cur(),n=d.nodes.length,id=uid(),cls=kind==="class";
    put({...d,nodes:[...d.nodes,{id,kind,x:80+n*40,y:80+n*30,name:kind==="junction"?"":cls?`Classe${n+1}`:`attribut${n+1}`,attrs:cls?"- attribut: type":"",methods:cls?"+ methode(): void":""}]});setSel({t:"n",id})};
  const remove=()=>{if(!sel)return;const d=cur();
    put(sel.t==="n"?{nodes:d.nodes.filter(n=>n.id!==sel.id),edges:d.edges.filter(x=>x.from!==sel.id&&x.to!==sel.id)}:{...d,edges:d.edges.filter(x=>x.id!==sel.id)});setSel(null)};
  useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==="Delete"&&!(e.target as HTMLElement).matches("input,textarea,select"))remove()};
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)});
  const upN=(p:Partial<DNode>)=>{const d=cur();put({...d,nodes:d.nodes.map(n=>n.id===sel?.id?{...n,...p}:n)})};
  const upE=(p:Partial<DEdge>)=>{const d=cur();put({...d,edges:d.edges.map(e=>e.id===sel?.id?{...e,...p}:e)})};
  const onNodeClick=(_:unknown,n:Node)=>{
    if(!linking){setSel({t:"n",id:n.id});return}
    if(!from){setFrom(n.id);return}
    if(from!==n.id){const d=cur(),t=d.nodes.find(x=>x.id===n.id);
      put({...d,edges:[...d.edges,{id:uid(),from,to:n.id,kind:mod==="deps"?(t?.kind==="junction"?"join":"df"):"assoc"}]})}
    setFrom(null);setLinking(false)};
  const onChange=(chs:NodeChange[])=>{const pos=chs.filter(c=>c.type==="position"&&c.position) as {id:string;position:{x:number;y:number}}[];
    if(pos.length){const d=cur();put({...d,nodes:d.nodes.map(n=>{const p=pos.find(c=>c.id===n.id);return p?{...n,x:p.position.x,y:p.position.y}:n})})}};
  const nodes:Node[]=useMemo(()=>data.nodes.map(n=>({id:n.id,type:n.kind,position:{x:n.x,y:n.y},data:{n},selected:sel?.id===n.id||from===n.id})),[stored,sel,from]);
  const edges:Edge[]=useMemo(()=>data.edges.map(e=>{const k=KINDS[e.kind]??KINDS.assoc;
    return {id:e.id,source:e.from,target:e.to,type:"float",data:e,selected:sel?.id===e.id,markerEnd:k.end,markerStart:k.start,style:k.dash?{strokeDasharray:"6 4"}:undefined}}),[stored,sel]);
  const selN=sel?.t==="n"?data.nodes.find(n=>n.id===sel.id):undefined,selE=sel?.t==="e"?data.edges.find(e=>e.id===sel.id):undefined;
  const b=(a:boolean)=>`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${a?"bg-indigo-600 text-white":"hover:bg-zinc-100 dark:hover:bg-zinc-700"}`;
  return <div className="flex min-h-0 flex-1"><div className="relative min-w-0 flex-1">
    <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white/95 p-1 shadow-md dark:border-zinc-700 dark:bg-zinc-800/95">
      {mod==="deps"?<><button className={b(false)} title="Ajouter un attribut" onClick={()=>add("attr")}>○</button><button className={b(false)} title="Ajouter une jonction (déterminant composé)" onClick={()=>add("junction")}>•</button></>
        :<button className={b(false)} title="Ajouter une classe" onClick={()=>add("class")}>▤</button>}
      <hr className="my-0.5 border-zinc-200 dark:border-zinc-700"/>
      <button className={b(linking)} title="Relier : clique sur l'élément de départ puis d'arrivée" onClick={()=>{setLinking(!linking);setFrom(null)}}>↗</button></div>
    {linking&&<div className="absolute left-16 top-4 z-10 rounded-lg bg-indigo-600 px-3 py-1 text-sm text-white">{from?"Clique sur l'élément d'arrivée":"Clique sur l'élément de départ"}</div>}
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onChange} onNodeClick={onNodeClick} onEdgeClick={(_,e)=>setSel({t:"e",id:e.id})}
      onPaneClick={()=>{setSel(null);setLinking(false);setFrom(null)}} nodesConnectable={false} deleteKeyCode={null} panOnScroll colorMode={dark?"dark":"light"} fitView minZoom={0.2}>
      <svg style={{position:"absolute",width:0,height:0}}><defs>
        {mk("m-tri","0 0 20 20",19,"M1 1L19 10L1 19Z","#fff")}{mk("m-dia","0 0 24 20",23,"M1 10L12 3L23 10L12 17Z","#fff")}
        {mk("m-dia-f","0 0 24 20",23,"M1 10L12 3L23 10L12 17Z","#71717a")}{mk("m-arr","0 0 20 20",19,"M2 3L18 10L2 17","none")}</defs></svg>
      <Background gap={20} size={1}/><Controls/>{minimap&&<MiniMap pannable zoomable/>}</ReactFlow></div>
    <aside className="w-72 space-y-3 overflow-auto border-l border-zinc-200 p-4 text-sm dark:border-zinc-700">
      {!selN&&!selE&&<p className="text-zinc-500">{HELP[mod]}</p>}
      {selN&&(selN.kind==="junction"?<p className="text-zinc-500">Point de jonction : relie plusieurs attributs (déterminant composé) vers un attribut dépendant.</p>:<>
        <Field label="Nom"><input className={inp} value={selN.name} onChange={e=>upN({name:e.target.value})}/></Field>
        {selN.kind==="class"&&<><Field label="Attributs (un par ligne)"><textarea className={inp+" font-mono text-xs"} rows={5} value={selN.attrs} onChange={e=>upN({attrs:e.target.value})}/></Field>
          <Field label="Méthodes (une par ligne)"><textarea className={inp+" font-mono text-xs"} rows={5} value={selN.methods} onChange={e=>upN({methods:e.target.value})}/></Field>
          <p className="text-xs text-zinc-500">Visibilité : + public, - privé, # protégé.</p></>}</>)}
      {selE&&<>{mod==="uml"&&<Field label="Type de lien"><select className={inp} value={selE.kind} onChange={e=>upE({kind:e.target.value})}>
          {Object.entries(KINDS).filter(([k])=>!["df","join"].includes(k)).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></Field>}
        {selE.kind!=="join"&&<Field label="Libellé"><input className={inp} value={selE.label??""} onChange={e=>upE({label:e.target.value})}/></Field>}
        {mod==="uml"&&<div className="flex gap-2"><Field label="Mult. départ"><input className={inp} placeholder="0..*" value={selE.m1??""} onChange={e=>upE({m1:e.target.value})}/></Field>
          <Field label="Mult. arrivée"><input className={inp} placeholder="1" value={selE.m2??""} onChange={e=>upE({m2:e.target.value})}/></Field></div>}
        <button className="text-indigo-600" onClick={()=>upE({from:selE.to,to:selE.from,m1:selE.m2,m2:selE.m1})}>⇄ Inverser le sens</button></>}
      {sel&&<button className="block text-red-500" onClick={remove}>Supprimer (Suppr)</button>}</aside></div>;
}
