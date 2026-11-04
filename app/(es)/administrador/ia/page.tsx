import {obtenerDashboardSistemaIA} from '../system-ai-dashboard-actions';
import {SystemAiDashboard} from '../system-ai-dashboard';
export default async function Page({searchParams}:{searchParams?:Promise<Record<string,string|undefined>>}){
 const params=(await searchParams)??{};
 const r=await obtenerDashboardSistemaIA(params);
 return <SystemAiDashboard data={r.snapshot} days={r.days} />;
}
