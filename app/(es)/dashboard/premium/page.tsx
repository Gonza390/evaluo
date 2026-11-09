import type { Metadata } from 'next';
import { requestAppLocale } from '@/lib/i18n/request-app-locale';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClientServer } from '@/lib/supabase-server';
import { premiumDashboardHref, safePremiumReturnTo } from '@/lib/premium-flow';
import { UpgradeScreen } from '@/components/pricing/UpgradeScreen';
import { getUpgradeNextExam } from '@/lib/premium-next-exam';
import { getSessionUser } from '@/lib/auth-session';

export const metadata: Metadata = {
  title: 'Premium',
  robots: { index: false, follow: false },
};

export default async function DashboardPremiumPage({
  searchParams,
}: {
  searchParams?: Promise<{ source?: string; materia?: string; parcial?: string; returnTo?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const source = typeof params.source==='string' && /^[a-zA-Z0-9_:-]{1,80}$/.test(params.source)
    ? params.source : 'dashboard_premium';
  const materiaId = typeof params.materia==='string' && /^[0-9a-f-]{36}$/i.test(params.materia)
    ? params.materia : undefined;
  const parsedParcial = Number(params.parcial);
  const parcial = Number.isInteger(parsedParcial)&&parsedParcial>=1&&parsedParcial<=99
    ? parsedParcial : undefined;
  const safeReturn = safePremiumReturnTo(params.returnTo);
  const returnTo = safeReturn && !safeReturn.startsWith('/dashboard/premium') ? safeReturn : undefined;
  const supabase = await createClientServer();
  const user = await getSessionUser();
  if (!user) {
    // El login no debe borrar la modalidad, materia y tema del upsell.
    const nextPath = premiumDashboardHref({source, materiaId, parcial, returnTo});
    const entryLocale = (await cookies()).get('evaluo_ui_locale')?.value;
    redirect((entryLocale === 'en' ? '/en/login' : '/login') + '?mode=login&intent=premium&next=' + encodeURIComponent(nextPath));
  }

  // "Mejorar mi plan" y los upsells de la app: pantalla propia con precio por
  // semana (diseño 7/11), en español e inglés. /pricing queda para visitantes.
  const uiLocale = await requestAppLocale(user.user_metadata);
  const nextExam = await getUpgradeNextExam(supabase, user.id);
  return (
    <main className="w-full min-w-0 bg-white">
      <UpgradeScreen locale={uiLocale} source={source} materiaId={materiaId}
        parcial={parcial} returnTo={returnTo} nextExam={nextExam} />
    </main>
  );
}
