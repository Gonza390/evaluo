import {obtenerTableroGeneral} from '../admin-home-actions';
import {AdminHome} from '../admin-home';
export default async function Page({searchParams}:{searchParams?:Promise<Record<string,string|undefined>>}){
 const params=(await searchParams)??{};
 const r=await obtenerTableroGeneral(params.date);
 return <AdminHome data={r.snapshot} minDay={r.minDay} />;
}
