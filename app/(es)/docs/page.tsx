import { SEO_HUBS } from '@/lib/student-seo-content';
import { StudentSeoHub, studyMetadata } from '@/components/marketing/student-seo-layout';

const hub=SEO_HUBS['docs'];
export const metadata=studyMetadata(hub.path,'Cómo usar Evaluo: ayuda y tutoriales',hub.description);
export default function Page(){return <StudentSeoHub hub={hub}/>;}
