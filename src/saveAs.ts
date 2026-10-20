// Ouvre la fenêtre « Enregistrer sous » (Chrome/Edge), sinon téléchargement classique.
export async function saveFile(name:string,mime:string,getBlob:()=>Promise<Blob>|Blob){
  const ext="."+name.split(".").pop();const w=window as any;
  if(w.showSaveFilePicker){
    try{
      const h=await w.showSaveFilePicker({suggestedName:name,types:[{description:ext.slice(1).toUpperCase(),accept:{[mime]:[ext]}}]});
      const ws=await h.createWritable();await ws.write(await getBlob());await ws.close();return;
    }catch(e:any){if(e?.name==="AbortError")return}
  }
  const a=document.createElement("a");a.href=URL.createObjectURL(await getBlob());a.download=name;a.click();
}
