import {obtenerAprendizajePracticas} from '../learning-dashboard-actions';
import {LearningDashboard} from '../learning-dashboard';
export default async function Page({searchParams}:{searchParams?:Promise<Record<string,string|undefined>>}){
 const params=(await searchParams)??{};
 const r=await obtenerAprendizajePracticas(params);
 return <LearningDashboard data={r.data} filters={r.filters} earliest={r.earliest} today={r.today} />;
}
