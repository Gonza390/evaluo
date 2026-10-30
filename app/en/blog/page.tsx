import type { Metadata } from 'next';
import { StudyBlogHub } from '@/components/marketing/study-blog-view';
import { toAbsoluteUrl } from '@/lib/site';

const path = '/en/blog';
export const metadata: Metadata = {
  title: 'Study Blog: Exam Preparation, Spaced Repetition and More',
  description: 'Free, practical study methods with worked examples: accounting, oral exams, spaced repetition, finals and long PDF notes.',
  alternates: { canonical: toAbsoluteUrl(path), languages: { es: toAbsoluteUrl('/blog'), en: toAbsoluteUrl(path), 'x-default': toAbsoluteUrl('/blog') } },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', title: 'Study blog | Evaluo', description: 'Study methods with examples and exercises, without needing to sign up.', url: toAbsoluteUrl(path), locale: 'en_US' },
};
export default function EnglishBlogPage() { return <StudyBlogHub locale="en" />; }
