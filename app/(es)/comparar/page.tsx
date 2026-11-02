import { SEO_HUBS } from '@/lib/student-seo-content';
import { StudentSeoHub, studyMetadata } from '@/components/marketing/student-seo-layout';

const hub=SEO_HUBS['comparar'];
export const metadata=studyMetadata(hub.path,'Comparativas de aplicaciones para estudiar',hub.description);
export default function Page(){return <StudentSeoHub hub={hub}/>;}
