import type { Metadata } from 'next';
import { hreflangAlternates } from '@/lib/seo/hreflang-clusters';
import Link from 'next/link';
import { PricingPlanSelector } from '@/components/pricing/PricingPlanSelector';
import { RegionalPricingMessage } from '@/components/pricing/RegionalPricingMessage';
import { FooterHome } from '@/components/footer-home';

export const metadata: Metadata = {
 title: 'Free and Premium Plans',
 description: 'Compare Free and Premium study plans. Study PDF and Word documents with AI, practice by topic, review mistakes and track progress.',
 alternates: hreflangAlternates('pricing', 'en'),
};
const freeFeatures = [
 '1 PDF or Word upload per month',
 'Topic summaries and glossary',
 '12 multiple-choice and 10 true-or-false questions',
 '25 flashcards, 2 practical cases and 1 matching round',
 '1 mock exam and 1 Free study plan',
];
const premiumFeatures = [
 'Everything in Free: practice, results and progress by topic',
 'Upload up to 3 new PDF or Word materials per day',
 'More AI explanations and exercises to review mistakes',
 'Mind maps to connect ideas from your notes',
 'Premium mock exam modes and more detailed explanations',
];

export default function EnglishPricingPage() {
 return <main lang="en" className="min-h-screen bg-[#F5F7FB] text-[#0F1B3D]">
  <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
   <nav className="flex items-center justify-between gap-4">
    <Link href="/en" className="text-xl font-extrabold tracking-tight">Evaluo</Link>
    <Link href="/en/login?mode=signup" className="rounded-full bg-[#456DBD] px-5 py-2.5 text-sm font-semibold text-white">Create account</Link>
   </nav>
   <header className="mx-auto mb-10 mt-12 max-w-3xl text-center sm:mt-16">
    <p className="text-xs font-bold uppercase tracking-widest text-[#5D70C4]">Free and Premium</p>
    <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">Study better with your own notes</h1>
    <p className="mt-4 text-base leading-7 text-[#42506A]">Start free with your PDF or Word documents. Upgrade to Premium when you need more materials, practice and study tools.</p>
   </header>
   <PricingPlanSelector locale="en" freeFeatures={freeFeatures} premiumFeatures={premiumFeatures} source="english_pricing" />
   <section className="mx-auto mt-12 max-w-3xl border-t border-[#E7EBF4] py-8 text-sm leading-7 text-[#42506A]">
    <h2 className="text-lg font-bold text-[#0F1B3D]">Billing for your country</h2>
    <RegionalPricingMessage locale="en" placement="billing" />
    <p className="mt-3">Review our <Link href="/en/terms" className="text-blue-700 underline">Terms</Link>, <Link href="/en/billing" className="text-blue-700 underline">Billing Terms</Link>, <Link href="/en/refunds" className="text-blue-700 underline">Refund Policy</Link>, and <Link href="/en/privacy" className="text-blue-700 underline">Privacy Policy</Link> before buying.</p>
   </section>
  </div>
  <FooterHome locale="en" />
 </main>;
}
