import {describe,it,expect} from "vitest";
import {demo} from "./demo";import {mcdToMld} from "./mld";import {validate} from "./validate";import {generateSql} from "./sql";
describe("MCD → MLD",()=>{
  const {mcd}=demo();const mld=mcdToMld(mcd);const t=(n:string)=>mld.tables.find(x=>x.name===n)!;
  it("le MCD de démo est valide",()=>expect(validate(mcd).filter(d=>d.severity==="error")).toEqual([]));
  it("1:N → FK NOT NULL du côté 1,1",()=>{
    expect(t("commande").foreignKeys[0].refTable).toBe("client");
    expect(t("commande").columns.find(c=>c.name==="id_client")!.nullable).toBe(false)});
  it("N:N → table associative, PK composite, attribut porté",()=>{
    expect(t("contient").primaryKey).toEqual(["id_commande","id_produit"]);
    expect(t("contient").columns.some(c=>c.name==="quantite")).toBe(true)});
  it("SQL généré",()=>expect(generateSql(mld,"postgres")).toContain('REFERENCES "client"'));
  it("détecte une entité sans identifiant",()=>{
    const m=structuredClone(mcd);m.entities[0].attributes.forEach(a=>a.isIdentifier=false);
    expect(validate(m).some(d=>d.code==="ENTITY_NO_IDENTIFIER")).toBe(true)});
});
