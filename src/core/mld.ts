import type {Mcd,Mld,Table,Column,Link,Diagnostic} from "./types";
export const snake=(s:string)=>s.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"_").replace(/^_+|_+$/g,"").toLowerCase();
const isN=(l:Link)=>l.cardinality.endsWith("N");
const optional=(l:Link)=>l.cardinality.startsWith("0");

export function mcdToMld(mcd:Mcd):Mld{
  const byEntity=new Map<string,Table>();const tables:Table[]=[];const warnings:Diagnostic[]=[];const rules:string[]=[];
  const warn=(code:string,message:string,targetId?:string)=>warnings.push({severity:"warning",code,message,targetId});
  for(const e of mcd.entities){
    const t:Table={name:snake(e.name),columns:e.attributes.map(a=>({name:snake(a.name),type:a.type,nullable:!a.isIdentifier&&a.nullable,unique:a.unique,origin:"attribut"})),
      primaryKey:e.attributes.filter(a=>a.isIdentifier).map(a=>snake(a.name)),foreignKeys:[]};
    tables.push(t);byEntity.set(e.id,t);
    rules.push(`Entité « ${e.name} » → table ${t.name}, clé primaire (${t.primaryKey.join(", ")})`);
  }
  const addFk=(from:Table,to:Table,role:string|undefined,nullable:boolean,unique:boolean,reason:string)=>{
    const prefix=role?snake(role)+"_":"";const cols:string[]=[];
    for(const pk of to.primaryKey){
      const src=to.columns.find(c=>c.name===pk)!;let name=prefix+pk;
      while(from.columns.some(c=>c.name===name))name+="_2";
      from.columns.push({name,type:src.type,nullable,unique,origin:"clé étrangère"});cols.push(name);
    }
    from.foreignKeys.push({columns:cols,refTable:to.name,refColumns:[...to.primaryKey],reason});
    return cols;
  };
  for(const a of mcd.associations){
    const ls=a.links.filter(l=>byEntity.has(l.entityId));
    if(ls.length<2)continue;
    const extra:Column[]=a.attributes.map(x=>({name:snake(x.name),type:x.type,nullable:x.nullable,unique:x.unique,origin:`attribut de « ${a.name} »`}));
    const assocTable=()=>{
      const t:Table={name:snake(a.name),columns:[],primaryKey:[],foreignKeys:[]};
      const groups=ls.map(l=>({l,cols:addFk(t,byEntity.get(l.entityId)!,l.role,false,false,`branche de « ${a.name} »`)}));
      const nn=groups.filter(g=>isN(g.l));
      t.primaryKey=(nn.length?nn:groups).flatMap(g=>g.cols);
      t.columns.push(...extra);tables.push(t);
      rules.push(`« ${a.name} » (${ls.length} branches) → table associative ${t.name}, clé primaire (${t.primaryKey.join(", ")})`+(ls.length>2&&nn.length<ls.length?" ; les branches à max 1 sont exclues de la clé":""));
    };
    if(ls.length!==2){assocTable();continue}
    const [l1,l2]=ls;
    if(isN(l1)&&isN(l2)){assocTable();continue}
    if(isN(l1)!==isN(l2)){
      const one=isN(l1)?l2:l1,many=one===l1?l2:l1;
      const from=byEntity.get(one.entityId)!,to=byEntity.get(many.entityId)!;
      addFk(from,to,many.role,optional(one),false,`« ${a.name} » est de type 1:N`);
      from.columns.push(...extra);
      rules.push(`« ${a.name} » (1:N) → clé étrangère dans ${from.name}${optional(one)?" (nullable)":" (NOT NULL)"}${extra.length?", avec ses attributs":""}`);
      continue;
    }
    let from=l1,other=l2;
    if(optional(l1)&&!optional(l2)){from=l2;other=l1}
    if(optional(l1)===optional(l2))
      warn("ONE_TO_ONE_AMBIGUOUS",optional(l1)?`« ${a.name} » (0,1 – 0,1) : côté de la clé étrangère choisi arbitrairement.`:`« ${a.name} » (1,1 – 1,1) : envisager de fusionner les deux entités.`,a.id);
    const f=byEntity.get(from.entityId)!;
    addFk(f,byEntity.get(other.entityId)!,other.role,optional(from),true,`« ${a.name} » est de type 1:1`);
    f.columns.push(...extra);
    rules.push(`« ${a.name} » (1:1) → clé étrangère UNIQUE dans ${f.name}`);
  }
  return {tables,warnings,rules};
}
