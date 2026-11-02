import { SEO_HUBS } from '@/lib/student-seo-content';
import { StudentSeoHub, studyMetadata } from '@/components/marketing/student-seo-layout';

const hub=SEO_HUBS['examenes'];
export const metadata=studyMetadata(hub.path,'Mini exámenes gratuitos para practicar',hub.description);
export default function Page(){return <StudentSeoHub hub={hub}/>;}
