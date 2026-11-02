import type { Metadata } from 'next';
import { BilingualPracticeLanding, practiceLandingCopy, practiceLandingPath } from '@/components/marketing/bilingual-practice-landings';
import { toAbsoluteUrl } from '@/lib/site';

const kind = 'match-concepts' as const;
const locale = 'en' as const;
const copy = practiceLandingCopy(kind, locale);
const path = practiceLandingPath(kind, locale);
const otherLocale = 'es' as const;
export const metadata: Metadata = {
 title: copy.title + ' | Evaluo',
 description: copy.intro.slice(0, 155),
 alternates: {canonical: toAbsoluteUrl(path), languages: { [locale]: toAbsoluteUrl(path), [otherLocale]: toAbsoluteUrl(practiceLandingPath(kind, otherLocale)), 'x-default': toAbsoluteUrl(practiceLandingPath(kind, 'es')) }},
 robots: {index:true, follow:true},
 openGraph: {type:'website',title:copy.title+' | Evaluo',description:copy.intro.slice(0,155),url:toAbsoluteUrl(path),locale:'en_US'}
};
export default function Page() { return <BilingualPracticeLanding kind={kind} locale={locale}/>; }
