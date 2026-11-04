import {obtenerDashboardMonetizacion} from '../monetization-dashboard-actions';
import {MonetizationDashboard} from '../monetization-dashboard';
export default async function Page({searchParams}:{searchParams?:Promise<Record<string,string|undefined>>}){
 const params=(await searchParams)??{};
 const r=await obtenerDashboardMonetizacion(params);
 return <MonetizationDashboard snapshot={r.snapshot} filters={r.filters} today={r.today} earliest={r.earliest} />;
}
