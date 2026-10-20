import type {Doc} from "./core/types";
export interface Meta{id:string;name:string;updatedAt:number}
const IDX="db-designer:index",LAST="db-designer:last",P=(id:string)=>`db-designer:p:${id}`;
export const listProjects=():Meta[]=>{try{return JSON.parse(localStorage.getItem(IDX)??"[]")}catch{return[]}};
export const saveProject=(id:string,name:string,d:Doc)=>{
  localStorage.setItem(P(id),JSON.stringify({name,mcd:d.mcd,positions:d.positions}));
  const l=listProjects().filter(m=>m.id!==id);l.push({id,name,updatedAt:Date.now()});
  localStorage.setItem(IDX,JSON.stringify(l));localStorage.setItem(LAST,id)};
export const loadProject=(id:string):(Doc&{name:string})|null=>{try{const r=localStorage.getItem(P(id));return r?JSON.parse(r):null}catch{return null}};
export const deleteProject=(id:string)=>{localStorage.removeItem(P(id));localStorage.setItem(IDX,JSON.stringify(listProjects().filter(m=>m.id!==id)))};
export const lastId=()=>localStorage.getItem(LAST);
