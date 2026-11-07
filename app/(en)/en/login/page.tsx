import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { previewLoginCanonicalUrl } from '@/lib/auth/preview-login-origin';
import LoginFormGoogleFirst from '@/components/LoginFormGoogleFirst';
import { InternationalDocumentLanguage } from '@/components/marketing/international-document-language';
import { EnglishLoginLocale } from '@/components/i18n/english-login-locale';
import '../../../(es)/login/login-clean.css';

export const metadata: Metadata = {
  title: 'Sign in or create an account',
  description: 'Sign in to Evaluo using Google or email and continue to your first PDF or Word upload.',
  robots: { index: false, follow: true },
};

export default async function EnglishLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const destination = previewLoginCanonicalUrl({
    host: (await headers()).get('host'),
    vercelEnvironment: process.env.VERCEL_ENV,
    branch: process.env.VERCEL_GIT_COMMIT_REF,
    pathname: '/en/login',
    searchParams: (await searchParams) ?? {},
  });
  if (destination) redirect(destination);
  return (
    <main lang="en" className="login-editorial min-h-screen bg-white px-4 py-6 sm:px-6 sm:py-10">
      <InternationalDocumentLanguage lang="en" />
      <EnglishLoginLocale />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[520px] items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <div className="w-full border-y border-slate-200 py-5 sm:py-7">
          <LoginFormGoogleFirst locale="en" />
        </div>
      </div>
    </main>
  );
}
