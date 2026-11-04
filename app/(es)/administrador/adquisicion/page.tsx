import {obtenerDashboardAdquisicion} from '../acquisition-dashboard-actions';
import {PackedAcquisitionDashboard} from '../packed-acquisition-dashboard';
export default async function Page(){
 const r=await obtenerDashboardAdquisicion();
 return <PackedAcquisitionDashboard data={r} />;
}
