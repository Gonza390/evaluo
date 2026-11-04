import {obtenerActivacionRecorrido} from '../activation-dashboard-actions';
import {PackedActivationDashboard} from '../packed-activation-dashboard';
export default async function Page(){
 const r=await obtenerActivacionRecorrido();
 return <PackedActivationDashboard data={r} />;
}
