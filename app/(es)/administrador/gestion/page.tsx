import {obtenerDashboardGestion} from '../gestion-dashboard-actions';
import {GestionDashboard} from '../gestion-dashboard';
export default async function Page(){
 const r=await obtenerDashboardGestion();
 return <GestionDashboard snapshot={r.snapshot} actor={r.actor} limits={r.limits} />;
}
