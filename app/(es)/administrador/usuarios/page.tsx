import {obtenerUsuariosRetencion} from '../users-retention-actions';
import {UsersRetentionDashboard} from '../users-retention-dashboard';
export default async function Page({searchParams}:{searchParams?:Promise<Record<string,string|undefined>>}){
 const params=(await searchParams)??{};
 const r=await obtenerUsuariosRetencion({period:[1,7,14,30].includes(Number(params.period))?Number(params.period):7,from:params.from??null,to:params.to??null,page:Math.max(1,Number(params.usersPage??1)||1),search:params.usersSearch??'',plan:params.usersPlan??'all',materials:params.usersMaterials??'all',country:params.usersCountry??'all',university:params.usersUniversity??'all',selectedUserId:params.userId??null});
 return <UsersRetentionDashboard stats={r.stats} segments={r.segments} language={r.language} list={r.list} detail={r.detail} filters={r.filters} today={r.today} minDay={r.minDay} />;
}
