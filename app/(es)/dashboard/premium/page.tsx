import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClientServer } from '@/lib/supabase-server';
import { premiumDashboardHref, safePremiumReturnTo } from '@/lib/premium-flow';
import { PremiumDashboardScreen } from '@/components/pricing/PremiumDashboardScreen';

export const metadata: Metadata = {
  title: 'Premium | Evaluo',
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
  const {data:{user}} = await supabase.auth.getUser();
  if (!user) {
    // El login no debe borrar la modalidad, materia y tema del upsell.
    const nextPath = premiumDashboardHref({source, materiaId, parcial, returnTo});
    const entryLocale = (await cookies()).get('evaluo_ui_locale')?.value;
    redirect((entryLocale === 'en' ? '/en/login' : '/login') + '?mode=login&intent=premium&next=' + encodeURIComponent(nextPath));
  }

  return <PremiumDashboardScreen source={source} materiaId={materiaId}
    parcial={parcial} returnTo={returnTo} />;
}
