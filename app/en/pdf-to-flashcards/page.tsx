import type { Metadata } from 'next';
import { EnglishStudyPage } from '@/components/marketing/english-study-page';
import { getEnglishSeoMetadata } from '@/lib/english-seo-metadata';

export const metadata: Metadata = getEnglishSeoMetadata('pdf-to-flashcards');

export default function Page() {
  return <EnglishStudyPage pageKey="pdf-to-flashcards" />;
}
