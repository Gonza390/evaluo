import type { Metadata } from 'next';
import LoginFormGoogleFirst from '@/components/LoginFormGoogleFirst';
import { InternationalDocumentLanguage } from '@/components/marketing/international-document-language';
import '../../../(es)/login/login-clean.css';

export const metadata: Metadata = {
  title: 'Sign in or create an account | Evaluo',
  description: 'Sign in to Evaluo using Google or email. The full study dashboard is currently available primarily in Spanish.',
  robots: { index: false, follow: true },
};

export default function EnglishLoginPage() {
  return (
    <main lang="en" className="login-editorial min-h-screen bg-white px-4 py-6 sm:px-6 sm:py-10">
      <InternationalDocumentLanguage lang="en" />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[520px] items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <div className="w-full border-y border-slate-200 py-5 sm:py-7">
          <LoginFormGoogleFirst locale="en" />
        </div>
      </div>
    </main>
  );
}
