import type { Metadata } from 'next';
import { EnglishStudyPage } from '@/components/marketing/english-study-page';
import { getEnglishSeoMetadata } from '@/lib/english-seo-metadata';

export const metadata: Metadata = getEnglishSeoMetadata('pdf-to-mind-map');

export default function Page() {
  return <EnglishStudyPage pageKey="pdf-to-mind-map" />;
}
