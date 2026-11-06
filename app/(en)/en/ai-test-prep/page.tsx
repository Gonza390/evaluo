import type { Metadata } from 'next';
import { EnglishStudyPage } from '@/components/marketing/english-study-page';
import { getEnglishSeoMetadata } from '@/lib/english-seo-metadata';

export const metadata: Metadata = getEnglishSeoMetadata('ai-test-prep');

export default function Page() {
  return <EnglishStudyPage pageKey="ai-test-prep" />;
}
