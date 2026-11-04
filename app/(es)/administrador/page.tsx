import {redirect} from 'next/navigation';
const panelKeys=new Set(["resumen","usuarios","adquisicion","producto","biblioteca","planes","monetizacion","mails","ia","gestion"]);
export default async function AdministradorPage({searchParams}:{searchParams?:Promise<Record<string,string|undefined>>}){
 const params=(await searchParams)??{};
 const selected=typeof params.panel==='string'&&panelKeys.has(params.panel)?params.panel:'resumen';
 const query=new URLSearchParams();
 for(const [key,value] of Object.entries(params))if(key!=='panel'&&typeof value==='string')query.set(key,value);
 redirect('/administrador/'+selected+(query.size?'?'+query.toString():''));
}
