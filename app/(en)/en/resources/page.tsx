import type { Metadata } from 'next';
import { EnglishStudyPage } from '@/components/marketing/english-study-page';
import { getEnglishSeoMetadata } from '@/lib/english-seo-metadata';

export const metadata: Metadata = {
  ...getEnglishSeoMetadata('home'),
  alternates: { canonical: '/en/resources' },
  title: 'English PDF study guides and worked examples | Evaluo',
  description: 'Explore educational PDF study guides, practice questions and worked examples from Evaluo.',
};

export default function EnglishResources() {
  return <EnglishStudyPage pageKey="home" />;
}
