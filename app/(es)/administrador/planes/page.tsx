import {obtenerDashboardPlanesEstudio} from '../study-plans-dashboard-actions';
import {StudyPlansDashboard} from '../study-plans-dashboard';
export default async function Page({searchParams}:{searchParams?:Promise<Record<string,string|undefined>>}){
 const params=(await searchParams)??{};
 const r=await obtenerDashboardPlanesEstudio(params);
 return <StudyPlansDashboard snapshot={r.snapshot} filters={r.filters} today={r.today} earliest={r.earliest} />;
}
