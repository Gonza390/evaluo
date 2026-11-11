import type { Metadata } from 'next';
import { BilingualPracticeLanding, practiceLandingCopy, practiceLandingPath } from '@/components/marketing/bilingual-practice-landings';
import { toAbsoluteUrl } from '@/lib/site';
import { DEFAULT_OG_IMAGES } from '@/lib/seo';

const kind = 'true-false' as const;
const locale = 'es' as const;
const copy = practiceLandingCopy(kind, locale);
const path = practiceLandingPath(kind, locale);
const otherLocale = 'en' as const;
export const metadata: Metadata = {
 title: copy.metaTitle,
 description: copy.metaDescription,
 alternates: {canonical: toAbsoluteUrl(path), languages: { [locale]: toAbsoluteUrl(path), [otherLocale]: toAbsoluteUrl(practiceLandingPath(kind, otherLocale)), 'x-default': toAbsoluteUrl(practiceLandingPath(kind, 'es')) }},
 robots: {index:true, follow:true},
 openGraph: { images: DEFAULT_OG_IMAGES,type:'website',title:copy.metaTitle+' | Evaluo',description:copy.metaDescription,url:toAbsoluteUrl(path),locale:'es_AR'}
};
export default function Page() { return <BilingualPracticeLanding kind={kind} locale={locale}/>; }
