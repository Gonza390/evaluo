import { SEO_HUBS } from '@/lib/student-seo-content';
import { StudentSeoHub, studyMetadata } from '@/components/marketing/student-seo-layout';

const hub=SEO_HUBS['herramientas'];
export const metadata=studyMetadata(hub.path,'Herramientas gratuitas para estudiar',hub.description);
export default function Page(){return <StudentSeoHub hub={hub}/>;}
