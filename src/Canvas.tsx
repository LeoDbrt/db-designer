import {useMemo,type CSSProperties} from "react";
import {ReactFlow,ReactFlowProvider,SelectionMode,Background,Controls,MiniMap,Handle,Position,useReactFlow,type Node,type Edge,type NodeChange,type NodeProps} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {CARDINALITIES,type Entity,type Association} from "./core/types";
import {useStore} from "./store";

const hid:CSSProperties={left:"50%",top:"50%",opacity:0,pointerEvents:"none"};
const ring=(s?:boolean)=>s?"border-indigo-500 ring-2 ring-indigo-300":"border-zinc-300 dark:border-zinc-600";
function EntityNode({data,selected}:NodeProps){
  const e=data.entity as Entity;
  return <div className={`min-w-40 rounded-lg border bg-white text-sm shadow-sm dark:bg-zinc-800 dark:text-zinc-100 ${ring(selected)}`}>
    <Handle type="target" position={Position.Left} style={hid}/>
    <div className="rounded-t-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white">{e.name||"?"}</div>
    <ul className="px-3 py-1.5">{e.attributes.map(a=><li key={a.id} className={a.isIdentifier?"border-b border-zinc-200 pb-1 font-semibold underline dark:border-zinc-600":""}>
      {a.name}<span className="ml-2 text-xs text-zinc-400">{a.type}</span></li>)}</ul></div>;
}
function maxLabels(a:Association){
  const n=a.links.filter(l=>l.cardinality.endsWith("N")).length;const L=["M","N","P","Q","R","S"];let i=0;
  return a.links.map(l=>l.cardinality.endsWith("N")?(n===1?"N":L[i++]??"N"):"1").sort((x,y)=>(x==="1"?0:1)-(y==="1"?0:1)).join(",");
}
function AssocNode({data,selected}:NodeProps){
  const a=data.assoc as Association;
  return <div className={`relative min-w-24 rounded-[999px] border bg-amber-50 px-4 py-2 text-center text-sm shadow-sm dark:bg-zinc-700 dark:text-zinc-100 ${ring(selected)}`}>
    <Handle type="source" position={Position.Left} style={hid}/>
    {a.links.length>1&&!a.hideMax&&<div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-bold text-indigo-600 dark:text-indigo-300">{maxLabels(a)}</div>}
    <div className="font-semibold">{a.name||"?"}</div>
    {a.attributes.map(x=><div key={x.id} className="text-xs text-zinc-500 dark:text-zinc-300">{x.name}</div>)}</div>;
}
const nodeTypes={entity:EntityNode,assoc:AssocNode};

function Inner({dark,minimap,tool}:{dark:boolean;minimap:boolean;tool:"select"|"pan"}){
  const mcd=useStore(s=>s.mcd),positions=useStore(s=>s.positions),selected=useStore(s=>s.selected);
  const {setPos,applySelect,snap,deleteEls,addEntity,updLink}=useStore.getState();
  const {screenToFlowPosition}=useReactFlow();
  const nodes=useMemo<Node[]>(()=>[
    ...mcd.entities.map(e=>({id:e.id,type:"entity",position:positions[e.id]??{x:0,y:0},data:{entity:e},selected:selected.includes(e.id)})),
    ...mcd.associations.map(a=>({id:a.id,type:"assoc",position:positions[a.id]??{x:0,y:0},data:{assoc:a},selected:selected.includes(a.id)}))],[mcd,positions,selected]);
  const edges=useMemo<Edge[]>(()=>mcd.associations.flatMap(a=>a.links.filter(l=>mcd.entities.some(e=>e.id===l.entityId)).map((l,i)=>({
    id:l.id,source:a.id,target:l.entityId,type:a.links.slice(0,i).some(x=>x.entityId===l.entityId)?"step":"straight",
    label:a.hideCard?(l.role??""):`${l.role?l.role+" · ":""}${l.cardinality}`,labelStyle:{fontSize:12,fontWeight:600},deletable:false,selectable:false,interactionWidth:24}))),[mcd]);
  const onChange=(chs:NodeChange[])=>{for(const c of chs){
    if(c.type==="position"&&c.position)setPos(c.id,c.position);
    else if(c.type==="select")applySelect(c.id,c.selected)}};
  return <div className="h-full" onDragOver={e=>e.preventDefault()}
    onDrop={e=>{if(e.dataTransfer.getData("application/x-entity"))addEntity(screenToFlowPosition({x:e.clientX,y:e.clientY}))}}>
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onChange} onNodeDragStart={()=>snap()}
      selectionOnDrag={tool==="select"} panOnDrag={tool==="pan"?true:[1,2]} panOnScroll panActivationKeyCode="Space" selectionMode={SelectionMode.Partial} deleteKeyCode="Delete"
      onEdgeClick={(_,e)=>{const a=mcd.associations.find(x=>x.id===e.source);const l=a?.links.find(x=>x.id===e.id);
        if(a&&l)updLink(a.id,l.id,{cardinality:CARDINALITIES[(CARDINALITIES.indexOf(l.cardinality)+1)%4]})}} multiSelectionKeyCode={["Meta","Control"]} colorMode={dark?"dark":"light"} fitView minZoom={0.2}
      onBeforeDelete={async({nodes})=>nodes.length&&window.confirm(`Supprimer ${nodes.length} élément(s) ?`)?{nodes,edges:[]}:false}
      onNodesDelete={ns=>deleteEls(ns.map(n=>n.id))}>
      <Background gap={20} size={1}/><Controls/>{minimap&&<MiniMap pannable zoomable/>}</ReactFlow></div>;
}
export default function Canvas({dark,minimap,tool}:{dark:boolean;minimap:boolean;tool:"select"|"pan"}){return <ReactFlowProvider><Inner dark={dark} minimap={minimap} tool={tool}/></ReactFlowProvider>}
