import { SEO_HUBS } from '@/lib/student-seo-content';
import { StudentSeoHub, studyMetadata } from '@/components/marketing/student-seo-layout';

const hub=SEO_HUBS['planes-de-estudio'];
export const metadata=studyMetadata(hub.path,'Planes de estudio para preparar exámenes',hub.description);
export default function Page(){return <StudentSeoHub hub={hub}/>;}
