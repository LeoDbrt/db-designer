import type {Mcd,Diagnostic} from "./types";
import {CARDINALITIES} from "./types";
export function validate(m:Mcd):Diagnostic[]{
  const d:Diagnostic[]=[];
  const err=(code:string,message:string,targetId?:string)=>d.push({severity:"error",code,message,targetId});
  const ids=new Set(m.entities.map(e=>e.id));
  const seen=new Set<string>();
  for(const i of [...m.entities,...m.associations]){
    const n=i.name.trim().toLowerCase();
    if(!n){err("EMPTY_NAME","Un élément n'a pas de nom.",i.id);continue}
    if(seen.has(n))err("DUPLICATE_NAME",`Nom en double : « ${i.name} » (une entité et une association ne peuvent pas porter le même nom).`,i.id);
    seen.add(n);
  }
  for(const e of m.entities){
    if(!e.attributes.some(a=>a.isIdentifier))err("ENTITY_NO_IDENTIFIER",`L'entité « ${e.name} » n'a pas d'identifiant.`,e.id);
    const s=new Set<string>();
    for(const a of e.attributes){const n=a.name.trim().toLowerCase();
      if(!n)err("EMPTY_ATTR",`Attribut sans nom dans « ${e.name} ».`,e.id);
      else if(s.has(n))err("DUPLICATE_ATTR",`Attribut « ${a.name} » en double dans « ${e.name} ».`,e.id);
      s.add(n)}
  }
  for(const a of m.associations){
    if(a.links.length<2)err("ASSOC_INCOMPLETE",`L'association « ${a.name} » doit relier au moins 2 entités.`,a.id);
    const per=new Map<string,string[]>();
    for(const l of a.links){
      if(!ids.has(l.entityId)){err("DANGLING_LINK",`« ${a.name} » référence une entité supprimée.`,a.id);continue}
      if(!CARDINALITIES.includes(l.cardinality))err("BAD_CARDINALITY",`Cardinalité invalide dans « ${a.name} ».`,a.id);
      per.set(l.entityId,[...(per.get(l.entityId)??[]),(l.role??"").trim()]);
    }
    for(const roles of per.values())
      if(roles.length>1&&(roles.some(r=>!r)||new Set(roles).size!==roles.length))
        err("REFLEXIVE_ROLES",`Association réflexive « ${a.name} » : chaque branche doit avoir un rôle distinct.`,a.id);
  }
  return d;
}
