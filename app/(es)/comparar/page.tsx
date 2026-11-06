import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import { SEO_HUBS } from '@/lib/student-seo-content';
import { StudentSeoHub, studyMetadata } from '@/components/marketing/student-seo-layout';

const hub=SEO_HUBS['comparar'];
export const metadata={...studyMetadata(hub.path,'Comparativas de aplicaciones para estudiar',hub.description),alternates:hreflangAlternates('compare-hub','es')};
export default function Page(){return <StudentSeoHub hub={hub}/>;}
