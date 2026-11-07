import type { Metadata } from 'next';
import { EnglishStudyPage } from '@/components/marketing/english-study-page';
import { getEnglishSeoMetadata } from '@/lib/english-seo-metadata';

export const metadata: Metadata = getEnglishSeoMetadata('practice-by-topic');

export default function Page() {
  return <EnglishStudyPage pageKey="practice-by-topic" />;
}
