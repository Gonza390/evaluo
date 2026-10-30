import type { Metadata } from 'next';
import { EnglishStudyPage } from '@/components/marketing/english-study-page';
import { getEnglishSeoMetadata } from '@/lib/english-seo-metadata';

export const metadata: Metadata = getEnglishSeoMetadata('study-pdf-with-ai');

export default function Page() {
  return <EnglishStudyPage pageKey="study-pdf-with-ai" />;
}
