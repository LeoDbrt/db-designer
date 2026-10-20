import type {Mld,Table} from "./types";
export type Dialect="sqlite"|"postgres";
const TYPES:Record<Dialect,Record<string,string>>={
  sqlite:{integer:"INTEGER",text:"TEXT",boolean:"INTEGER",date:"TEXT",decimal:"REAL"},
  postgres:{integer:"INTEGER",text:"TEXT",boolean:"BOOLEAN",date:"DATE",decimal:"NUMERIC"}};
const q=(s:string)=>`"${s}"`;
export function generateSql(mld:Mld,d:Dialect):string{
  const ordered:Table[]=[];const seen=new Set<string>();const by=new Map(mld.tables.map(t=>[t.name,t]));
  const visit=(t:Table)=>{if(seen.has(t.name))return;seen.add(t.name);
    for(const fk of t.foreignKeys){const r=by.get(fk.refTable);if(r)visit(r)}ordered.push(t)};
  mld.tables.forEach(visit);
  return ordered.map(t=>{
    const lines=t.columns.map(c=>`  ${q(c.name)} ${TYPES[d][c.type]}${c.nullable?"":" NOT NULL"}${c.unique?" UNIQUE":""}`);
    if(t.primaryKey.length)lines.push(`  PRIMARY KEY (${t.primaryKey.map(q).join(", ")})`);
    for(const fk of t.foreignKeys)lines.push(`  FOREIGN KEY (${fk.columns.map(q).join(", ")}) REFERENCES ${q(fk.refTable)} (${fk.refColumns.map(q).join(", ")})`);
    return `CREATE TABLE ${q(t.name)} (\n${lines.join(",\n")}\n);`;
  }).join("\n\n")+"\n";
}
