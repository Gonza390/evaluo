import type { Metadata } from 'next';
import { InternationalStudyLanding } from '@/components/marketing/international-study-landing';
import { getStudyLandingMetadata } from '@/lib/international-study-landings';

export const metadata: Metadata = getStudyLandingMetadata('es');

export default function InternationalStudyPage() {
  return <InternationalStudyLanding market="es" />;
}
