import { SEO_HUBS } from '@/lib/student-seo-content';
import { StudentSeoHub, studyMetadata } from '@/components/marketing/student-seo-layout';

const hub=SEO_HUBS['recursos'];
export const metadata=studyMetadata(hub.path,'Recursos y plantillas de estudio',hub.description);
export default function Page(){return <StudentSeoHub hub={hub}/>;}
