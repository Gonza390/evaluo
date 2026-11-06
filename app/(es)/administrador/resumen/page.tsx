import {obtenerTableroGeneral} from '../admin-home-actions';
import {AdminHome} from '../admin-home';
import {obtenerMetricasIdiomas} from '../admin-language-actions';
export default async function Page({searchParams}:{searchParams?:Promise<Record<string,string|undefined>>}){
 const params=(await searchParams)??{};
 const r=await obtenerTableroGeneral(params.date);
 const end=r.snapshot.day;
 const start=new Date(end+'T12:00:00Z');
 start.setUTCDate(start.getUTCDate()-6);
 const language=await obtenerMetricasIdiomas(start.toISOString().slice(0,10),end);
 return <AdminHome data={r.snapshot} minDay={r.minDay} language={language} />;
}
