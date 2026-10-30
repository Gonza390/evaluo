import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StudyBlogArticlePage } from '@/components/marketing/study-blog-view';
import { STUDY_BLOG_ARTICLES, getStudyBlogArticle, getStudyBlogPath, getTranslation } from '@/lib/study-blog-articles';
import { toAbsoluteUrl } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return STUDY_BLOG_ARTICLES.en.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getStudyBlogArticle('en', slug);
  if (!article) return { robots: { index: false, follow: false } };
  const path = getStudyBlogPath('en', article);
  const translation = getTranslation('en', article);
  return {
    title: article.seoTitle,
    description: article.description,
    alternates: {
      canonical: toAbsoluteUrl(path),
      languages: { en: toAbsoluteUrl(path), ...(translation ? { es: toAbsoluteUrl(getStudyBlogPath('es', translation)) } : {}), 'x-default': toAbsoluteUrl(translation ? getStudyBlogPath('es', translation) : path) },
    },
    robots: { index: true, follow: true },
    openGraph: { type: 'article', title: article.seoTitle + ' | Evaluo', description: article.description, url: toAbsoluteUrl(path), locale: 'en_US' },
  };
}
export default async function EnglishStudyBlogPage({ params }: Props) {
  const { slug } = await params;
  const article = getStudyBlogArticle('en', slug);
  if (!article) notFound();
  return <StudyBlogArticlePage locale="en" article={article} />;
}
