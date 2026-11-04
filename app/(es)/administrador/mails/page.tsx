import {obtenerDashboardComunicaciones} from '../communications-dashboard-actions';
import {CommunicationsDashboard} from '../communications-dashboard';
export default async function Page({searchParams}:{searchParams?:Promise<Record<string,string|undefined>>}){
 const params=(await searchParams)??{};
 const r=await obtenerDashboardComunicaciones(params);
 return <CommunicationsDashboard snapshot={r.snapshot} filters={r.filters} today={r.today} earliest={r.earliest} />;
}
