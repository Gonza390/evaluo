import LoginFormGoogleFirst from '@/components/LoginFormGoogleFirst';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { previewLoginCanonicalUrl } from '@/lib/auth/preview-login-origin';
import './login-clean.css';

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const destination = previewLoginCanonicalUrl({
    host: (await headers()).get('host'),
    vercelEnvironment: process.env.VERCEL_ENV,
    branch: process.env.VERCEL_GIT_COMMIT_REF,
    pathname: '/login',
    searchParams: (await searchParams) ?? {},
  });
  if (destination) redirect(destination);
  return (
    <main className="login-editorial min-h-screen bg-white px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[520px] items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <div className="w-full border-y border-slate-200 py-5 sm:py-7">
          <LoginFormGoogleFirst />
        </div>
      </div>
    </main>
  );
}
