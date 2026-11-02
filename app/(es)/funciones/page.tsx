import { SEO_HUBS } from '@/lib/student-seo-content';
import { StudentSeoHub, studyMetadata } from '@/components/marketing/student-seo-layout';

const hub=SEO_HUBS['funciones'];
export const metadata=studyMetadata(hub.path,'Funciones de Evaluo para estudiar PDFs',hub.description);
export default function Page(){return <StudentSeoHub hub={hub}/>;}
