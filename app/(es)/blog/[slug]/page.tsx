import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StudyBlogArticlePage } from '@/components/marketing/study-blog-view';
import { STUDY_BLOG_ARTICLES, getStudyBlogArticle, getStudyBlogPath, getTranslation } from '@/lib/study-blog-articles';
import { toAbsoluteUrl } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return STUDY_BLOG_ARTICLES.es.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getStudyBlogArticle('es', slug);
  if (!article) return { robots: { index: false, follow: false } };
  const path = getStudyBlogPath('es', article);
  const translation = getTranslation('es', article);
  return {
    title: article.seoTitle,
    description: article.description,
    alternates: {
      canonical: toAbsoluteUrl(path),
      languages: { es: toAbsoluteUrl(path), ...(translation ? { en: toAbsoluteUrl(getStudyBlogPath('en', translation)) } : {}), 'x-default': toAbsoluteUrl(path) },
    },
    robots: { index: true, follow: true },
    openGraph: { type: 'article', title: article.seoTitle + ' | Evaluo', description: article.description, url: toAbsoluteUrl(path), locale: 'es_AR' },
  };
}
export default async function StudyBlogPage({ params }: Props) {
  const { slug } = await params;
  const article = getStudyBlogArticle('es', slug);
  if (!article) notFound();
  return <StudyBlogArticlePage locale="es" article={article} />;
}
