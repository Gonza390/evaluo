import type { Metadata } from 'next';
import { EnglishStudyPage } from '@/components/marketing/english-study-page';
import { getEnglishSeoMetadata } from '@/lib/english-seo-metadata';

export const metadata: Metadata = getEnglishSeoMetadata('ai-for-students');

export default function Page() {
  return <EnglishStudyPage pageKey="ai-for-students" />;
}
