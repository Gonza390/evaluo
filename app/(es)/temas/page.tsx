import { SEO_HUBS } from '@/lib/student-seo-content';
import { StudentSeoHub, studyMetadata } from '@/components/marketing/student-seo-layout';

const hub=SEO_HUBS['temas'];
export const metadata=studyMetadata(hub.path,'Temas universitarios explicados con ejemplos',hub.description);
export default function Page(){return <StudentSeoHub hub={hub}/>;}
