import Link from 'next/link';
import { FooterHome } from '@/components/footer-home';
import { ENGLISH_POLICIES, type EnglishPolicyKey } from '@/lib/legal/english-policies';

export function EnglishLegalDocument({ policy }: { policy: EnglishPolicyKey }) {
 const doc=ENGLISH_POLICIES[policy];
 const links=[['terms','Terms'],['privacy','Privacy'],['billing','Billing'],['refunds','Refunds'],['acceptable-use','Acceptable use'],['copyright','Copyright']] as const;
 return <main lang="en" className="min-h-screen bg-[#F5F7FB] text-[#0F1B3D]">
  <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
   <Link href="/en" className="text-sm font-semibold text-[#2563EB] hover:underline">Back to Evaluo</Link>
   <header className="mt-8 border-b border-[#E7EBF4] pb-8">
    <p className="text-xs font-bold tracking-widest text-[#4F5DFF] uppercase">Legal</p>
    <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">{doc.title}</h1>
    <p className="mt-4 text-sm text-[#7F8AA3]">Last updated: {doc.updated}</p>
    <p className="mt-5 max-w-3xl text-[15px] leading-7 text-[#42506A]">{doc.intro}</p>
   </header>
   <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_230px]">
    <article className="space-y-10">
     {doc.sections.map(([heading,paragraphs])=><section key={heading} className="border-b border-[#E7EBF4] pb-8 last:border-0">
      <h2 className="text-lg font-bold sm:text-xl">{heading}</h2>
      <div className="mt-4 space-y-4">{paragraphs.map((paragraph)=><p key={paragraph} className="text-sm leading-7 text-[#42506A]">{paragraph}</p>)}</div>
     </section>)}
    </article>
    <aside className="lg:pt-2"><nav aria-label="Other legal documents" className="flex flex-col gap-3 rounded-2xl border border-[#E7EBF4] bg-white p-5 lg:sticky lg:top-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#7F8AA3]">Legal documents</p>
      {links.map(([key,label])=><Link key={key} href={`/en/${key}`} aria-current={policy===key?'page':undefined} className={policy===key?'text-sm font-semibold text-[#2563EB]':'text-sm text-[#42506A] hover:text-[#2563EB]'}>{label}</Link>)}
      <Link href="/en/pricing" className="mt-2 text-sm font-semibold text-[#2563EB] hover:underline">Premium pricing</Link>
      <a href="https://www.creem.io/buyer-terms" target="_blank" rel="noopener noreferrer" className="text-sm text-[#42506A] underline">Creem buyer terms</a>
      <a href="mailto:legal@evaluo.com.ar" className="text-xs text-[#42506A] underline">legal@evaluo.com.ar</a>
     </nav></aside>
   </div>
  </div>
  <FooterHome locale="en" variant="compact" />
 </main>;
}
