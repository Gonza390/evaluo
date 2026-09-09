import { unstable_cache as nextCache } from 'next/cache';
import { NextResponse } from 'next/server';
import { listAdminUserIds } from '@/lib/admin-users';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';

type ProductPeriod = 1 | 7 | 14 | 30;

type UserJourney = {
  userId: string;
  email: string;
  registeredAt: string;
  source: string;
  materiaId: string | null;
  materiaName: string | null;
  reachedMateria: boolean;
  contentAvailable: boolean;
  contentOpened: boolean;
  meaningfulStudy: boolean;
  returned48h: boolean;
  activeDays: number;
  simulatorAttempts: number;
  pdfSelected: number;
  pdfUploads: number;
};

function argentinaDayKey(value: string | Date) {
  return new Date(value).toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

function formatDay(value: string | Date) {
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

function pct(value: number, base: number) {
  return base > 0 ? Number(((value / base) * 100).toFixed(1)) : 0;
}

async function loadProductAnalytics(period: ProductPeriod) {
  const admin = createAdminClient();
  const adminUserIds = await listAdminUserIds();
  const { data, error } = await admin.rpc('admin_product_user_journeys', {
    p_period_days: period,
    p_excluded_user_ids: adminUserIds,
  });

  if (error) throw error;

  const now = new Date();
  const rows = data ?? [];
  const journeys: UserJourney[] = rows.map((row) => ({
    userId: row.user_id,
    email: row.email,
    registeredAt: row.registered_at,
    source: row.source,
    materiaId: row.materia_id,
    materiaName: row.materia_id ? row.materia_name ?? 'Materia' : null,
    reachedMateria: row.reached_materia,
    contentAvailable: row.content_available,
    contentOpened: row.content_opened,
    meaningfulStudy: row.meaningful_study,
    returned48h: row.returned_48h,
    activeDays: Number(row.active_days ?? 0),
    simulatorAttempts: Number(row.simulator_attempts ?? 0),
    pdfSelected: Number(row.pdf_selected ?? 0),
    pdfUploads: Number(row.pdf_uploads ?? 0),
  }));

  const registered = journeys.length;
  const reachedMateria = journeys.filter((row) => row.reachedMateria).length;
  const contentAvailable = journeys.filter((row) => row.contentAvailable).length;
  const contentOpened = journeys.filter((row) => row.contentOpened).length;
  const meaningful = journeys.filter((row) => row.meaningfulStudy).length;
  const returned = journeys.filter((row) => row.meaningfulStudy && row.returned48h).length;
  const returnEligible = journeys.filter(
    (row) =>
      row.meaningfulStudy &&
      new Date(row.registeredAt).getTime() <= now.getTime() - 48 * 60 * 60 * 1000
  );
  const returnedEligible = returnEligible.filter((row) => row.returned48h).length;

  const funnelRaw = [
    { key: 'registered', label: 'Registro', value: registered },
    { key: 'materia', label: 'Materia', value: reachedMateria },
    { key: 'available', label: 'Contenido disponible', value: contentAvailable },
    { key: 'opened', label: 'Contenido abierto', value: contentOpened },
    { key: 'meaningful', label: 'Estudio significativo', value: meaningful },
    { key: 'returned', label: 'Regreso 48 h', value: returned },
  ];
  const funnel = funnelRaw.map((step, index) => ({
    ...step,
    conversionPct: index === 0 ? 100 : pct(step.value, funnelRaw[index - 1].value),
  }));
  const dropCandidates = funnel.slice(1).map((step, index) => ({
    from: funnel[index].label,
    to: step.label,
    lost: Math.max(0, funnel[index].value - step.value),
    dropPct: Math.max(0, Number((100 - step.conversionPct).toFixed(1))),
  }));
  const biggestDrop =
    dropCandidates.sort((a, b) => b.dropPct - a.dropPct || b.lost - a.lost)[0] ?? null;

  const cohortMap = new Map<string, UserJourney[]>();
  for (const row of journeys) {
    const key = argentinaDayKey(row.registeredAt);
    const list = cohortMap.get(key) ?? [];
    list.push(row);
    cohortMap.set(key, list);
  }
  const cohorts = [...cohortMap.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, cohortRows]) => ({
      date,
      label: formatDay(`${date}T12:00:00-03:00`),
      registered: cohortRows.length,
      materia: cohortRows.filter((row) => row.reachedMateria).length,
      available: cohortRows.filter((row) => row.contentAvailable).length,
      opened: cohortRows.filter((row) => row.contentOpened).length,
      meaningful: cohortRows.filter((row) => row.meaningfulStudy).length,
      returned: cohortRows.filter((row) => row.returned48h).length,
    }));

  const acquisitionMap = new Map<string, UserJourney[]>();
  for (const row of journeys) {
    const list = acquisitionMap.get(row.source) ?? [];
    list.push(row);
    acquisitionMap.set(row.source, list);
  }
  const acquisition = [...acquisitionMap.entries()]
    .map(([source, sourceRows]) => ({
      source,
      registrations: sourceRows.length,
      materia: sourceRows.filter((row) => row.reachedMateria).length,
      meaningful: sourceRows.filter((row) => row.meaningfulStudy).length,
      activationPct: pct(
        sourceRows.filter((row) => row.meaningfulStudy).length,
        sourceRows.length
      ),
    }))
    .sort((a, b) => b.registrations - a.registrations || b.meaningful - a.meaningful);

  const emptyMateriaMap = new Map<string, { name: string; users: number }>();
  for (const row of journeys.filter(
    (item) => item.reachedMateria && !item.contentAvailable && item.materiaId
  )) {
    const materiaId = row.materiaId as string;
    const current = emptyMateriaMap.get(materiaId) ?? {
      name: row.materiaName ?? 'Materia',
      users: 0,
    };
    current.users += 1;
    emptyMateriaMap.set(materiaId, current);
  }
  const topEmptyMaterias = [...emptyMateriaMap.entries()]
    .map(([materiaId, value]) => ({ materiaId, ...value }))
    .sort((a, b) => b.users - a.users)
    .slice(0, 8);

  const pdfSelectedUsers = journeys.filter((row) => row.pdfSelected > 0).length;
  const pdfCompletedUsers = journeys.filter((row) => row.pdfUploads > 0).length;

  return {
    generatedAt: now.toISOString(),
    period,
    kpis: {
      newUsers: registered,
      activationPct: pct(meaningful, registered),
      meaningfulUsers: meaningful,
      meaningfulOfAvailablePct: pct(meaningful, contentAvailable),
      return48hPct:
        returnEligible.length > 0 ? pct(returnedEligible, returnEligible.length) : null,
      returnEligibleUsers: returnEligible.length,
      coveragePct: pct(contentAvailable, reachedMateria),
      contentEmptyUsers: journeys.filter((row) => row.reachedMateria && !row.contentAvailable)
        .length,
    },
    funnel,
    biggestDrop,
    cohorts,
    acquisition,
    coverage: {
      reachedMateria,
      availableUsers: contentAvailable,
      emptyUsers: journeys.filter((row) => row.reachedMateria && !row.contentAvailable).length,
      topEmptyMaterias,
    },
    pdf: {
      selectedUsers: pdfSelectedUsers,
      completedUsers: pdfCompletedUsers,
      conversionPct: pct(pdfCompletedUsers, pdfSelectedUsers),
    },
    users: [...journeys]
      .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
      .slice(0, 50),
    exclusions: {
      adminUsers: adminUserIds.length,
      adminSessions: Number(rows[0]?.excluded_admin_sessions ?? 0),
    },
  };
}

const loadProductAnalyticsCached = nextCache(
  loadProductAnalytics,
  ['admin-product-analytics-v4'],
  { revalidate: 60, tags: ['admin-product-analytics'] }
);

export async function GET(request: Request) {
  try {
    await requireAdminAccess();
    const url = new URL(request.url);
    const rawPeriod = Number(url.searchParams.get('period') ?? 7);
    const period: ProductPeriod =
      rawPeriod === 1 || rawPeriod === 14 || rawPeriod === 30 ? rawPeriod : 7;
    const payload = await loadProductAnalyticsCached(period);

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'No pudimos cargar las métricas de producto.',
      },
      { status: 500 }
    );
  }
}
