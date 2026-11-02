import { SEO_HUBS } from '@/lib/student-seo-content';
import { StudentSeoHub, studyMetadata } from '@/components/marketing/student-seo-layout';

const hub=SEO_HUBS['ejemplos'];
export const metadata=studyMetadata(hub.path,'Ejemplos gratuitos de práctica',hub.description);
export default function Page(){return <StudentSeoHub hub={hub}/>;}
