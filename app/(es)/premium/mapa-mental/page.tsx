import { redirect } from 'next/navigation';
import { legacyPremiumFunnelHref } from '@/lib/premium-flow';

/** Enlace histórico; evitar que reaparezcan las antiguas ventas de tres pasos.
 * El checkout nuevo se gestiona desde /dashboard/premium.
 */
export default async function LegacyPremiumPage({
  searchParams,
}: {
  searchParams?: Promise<{materia?: string; parcial?: string; returnTo?: string}>;
}) {
  const params = (await searchParams) ?? {};
  redirect(legacyPremiumFunnelHref('mapa-mental', {
    materiaId: params.materia,
    parcial: params.parcial,
    returnTo: params.returnTo,
  }));
}
