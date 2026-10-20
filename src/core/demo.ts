import type {Attribute,Doc,DataType} from "./types";
const uid=()=>crypto.randomUUID();
const at=(name:string,type:DataType="text",ident=false):Attribute=>({id:uid(),name,type,isIdentifier:ident,nullable:!ident,unique:false});
export function demo():Doc{
  const c=uid(),p=uid(),o=uid(),a1=uid(),a2=uid();
  return {mcd:{
    entities:[
      {id:c,name:"Client",attributes:[at("id_client","integer",true),at("nom"),at("email")]},
      {id:o,name:"Commande",attributes:[at("id_commande","integer",true),at("date_commande","date")]},
      {id:p,name:"Produit",attributes:[at("id_produit","integer",true),at("libelle"),at("prix","decimal")]}],
    associations:[
      {id:a1,name:"passe",attributes:[],links:[{id:uid(),entityId:c,cardinality:"0,N"},{id:uid(),entityId:o,cardinality:"1,1"}]},
      {id:a2,name:"contient",attributes:[at("quantite","integer")],links:[{id:uid(),entityId:o,cardinality:"1,N"},{id:uid(),entityId:p,cardinality:"0,N"}]}]},
    positions:{[c]:{x:40,y:140},[a1]:{x:300,y:160},[o]:{x:520,y:140},[a2]:{x:780,y:160},[p]:{x:980,y:140}}};
}
