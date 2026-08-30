import { NextResponse } from 'next/server';
import { listAdminUserIds } from '@/lib/admin-users';
import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';

const AR_OFFSET_HOURS = -3;
const DAY_MS = 24 * 60 * 60 * 1000;
const STUDY_EVENT_NAMES = new Set([
  'study_content_opened',
  'materia_resumen_opened',
  'materia_resource_opened',
  'student_material_study_opened',
]);

type AnalyticsRow = {
  user_id: string | null;
  session_key: string | null;
  event_name: string;
  path: string | null;
  metadata: unknown | null;
  created_at: string | null;
};

type NewUserRow = {
  id: string;
  email: string;
  createdAt: string;
};

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

function startOfArgentinaDay(date: Date) {
  const shifted = new Date(date.getTime() + AR_OFFSET_HOURS * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - AR_OFFSET_HOURS * 60 * 60 * 1000);
}

function periodStart(days: 1 | 7 | 30, now = new Date()) {
  return startOfArgentinaDay(new Date(now.getTime() - (days - 1) * DAY_MS));
}

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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function metadataString(metadata: unknown, key: string) {
  const value = asRecord(metadata)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function metadataNumber(metadata: unknown, key: string) {
  const value = asRecord(metadata)[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function attributionRecord(metadata: unknown) {
  return asRecord(asRecord(metadata).attribution);
}

function extractUuid(value: string | null | undefined) {
  const match = String(value ?? '').match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
  );
  return match?.[0] ?? null;
}

function eventMateriaId(row: AnalyticsRow) {
  return metadataString(row.metadata, 'materia_id') ?? extractUuid(row.path);
}

function isMateriaVisit(row: AnalyticsRow) {
  return Boolean(row.path?.startsWith('/explorar/materia/')) || Boolean(eventMateriaId(row));
}

function isStudyPath(path: string | null) {
  if (!path) return false;
  return (
    path.startsWith('/materiales/') ||
    path.startsWith('/recursos/') ||
    path.startsWith('/resumenes/') ||
    path.startsWith('/estudiar/')
  );
}

function normalizeSource(value: string | null) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes('whatsapp')) return 'WhatsApp';
  if (lower.includes('instagram')) return 'Instagram';
  if (lower.includes('facebook') || lower === 'fb') return 'Facebook';
  if (lower.includes('linkedin')) return 'LinkedIn';
  if (lower.includes('google')) return 'Google';
  if (lower.includes('share')) return 'Compartido';
  if (lower.includes('email') || lower.includes('sender')) return 'Email';
  return raw.length > 28 ? `${raw.slice(0, 25)}…` : raw;
}

function sourceFromReferrer(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname.endsWith('evaluo.com.ar')) return null;
    return normalizeSource(url.hostname.replace(/^www\./, ''));
  } catch {
    return normalizeSource(value);
  }
}

function resolveAcquisitionSource(rows: AnalyticsRow[]) {
  const ordered = [...rows].sort((a, b) =>
    String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''))
  );

  for (const row of ordered) {
    const attribution = attributionRecord(row.metadata);
    const utmSource =
      typeof attribution.utm_source === 'string' ? normalizeSource(attribution.utm_source) : null;
    if (utmSource) return utmSource;

    if (row.event_name === 'acquisition_touch') {
      const referrer = sourceFromReferrer(metadataString(row.metadata, 'referrer'));
      if (referrer) return referrer;
    }
  }

  return 'Directo';
}

async function fetchAllAnalyticsRows(
  admin: ReturnType<typeof createAdminClient>,
  fromIso: string,
  toIso: string
) {
  const rows: AnalyticsRow[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await admin
      .from('analytics_events')
      .select('user_id, session_key, event_name, path, metadata, created_at')
      .gte('created_at', fromIso)
      .lte('created_at', toIso)
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const chunk = (data ?? []) as AnalyticsRow[];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function listNewUsers(
  admin: ReturnType<typeof createAdminClient>,
  start: Date,
  adminIds: Set<string>
) {
  const rows: NewUserRow[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    for (const user of data?.users ?? []) {
      if (adminIds.has(user.id) || !user.email || !user.created_at) continue;
      if (new Date(user.created_at).getTime() < start.getTime()) continue;
      rows.push({ id: user.id, email: user.email, createdAt: user.created_at });
    }

    if ((data?.users?.length ?? 0) < perPage) break;
    page += 1;
  }

  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function loadMateriaAvailability(
  admin: ReturnType<typeof createAdminClient>,
  materiaIds: string[]
) {
  const available = new Set<string>();
  const names = new Map<string, string>();
  if (materiaIds.length === 0) return { available, names };

  const [materias, resumenes, recursos, materials] = await Promise.all([
    admin.from('materias').select('id, nombre').in('id', materiaIds),
    admin.from('resumenes').select('materia_id').in('materia_id', materiaIds).not('file_url', 'is', null),
    admin.from('recursos').select('materia_id').in('materia_id', materiaIds).not('url_archivo', 'is', null),
    admin
      .from('student_materials')
      .select('materia_id')
      .in('materia_id', materiaIds)
      .eq('visibility', 'shared')
      .eq('processing_status', 'ready'),
  ]);

  for (const row of materias.data ?? []) {
    names.set(String(row.id), String(row.nombre ?? 'Materia'));
  }
  for (const response of [resumenes, recursos, materials]) {
    if (response.error) continue;
    for (const row of response.data ?? []) {
      const materiaId = String(row.materia_id ?? '');
      if (materiaId) available.add(materiaId);
    }
  }

  return { available, names };
}

function pct(value: number, base: number) {
  return base > 0 ? Number(((value / base) * 100).toFixed(1)) : 0;
}

export async function GET(request: Request) {
  try {
    await requireAdminAccess();
    const url = new URL(request.url);
    const rawPeriod = Number(url.searchParams.get('period') ?? 7);
    const period: 1 | 7 | 30 = rawPeriod === 1 || rawPeriod === 30 ? rawPeriod : 7;
    const now = new Date();
    const start = periodStart(period, now);
    const acquisitionLookback = new Date(start.getTime() - 7 * DAY_MS);
    const admin = createAdminClient();
    const adminUserIds = await listAdminUserIds();
    const adminIdSet = new Set(adminUserIds);

    const [newUsers, rawEvents] = await Promise.all([
      listNewUsers(admin, start, adminIdSet),
      fetchAllAnalyticsRows(admin, acquisitionLookback.toISOString(), now.toISOString()),
    ]);

    const excludedSessions = new Set(
      rawEvents
        .filter((row) => row.user_id && adminIdSet.has(row.user_id))
        .map((row) => row.session_key)
        .filter((value): value is string => Boolean(value))
    );
    const events = rawEvents.filter(
      (row) =>
        (!row.user_id || !adminIdSet.has(row.user_id)) &&
        (!row.session_key || !excludedSessions.has(row.session_key))
    );

    const sessionUsers = new Map<string, Set<string>>();
    for (const row of events) {
      if (!row.session_key || !row.user_id) continue;
      const set = sessionUsers.get(row.session_key) ?? new Set<string>();
      set.add(row.user_id);
      sessionUsers.set(row.session_key, set);
    }

    const sessionOwner = new Map<string, string>();
    for (const [session, users] of sessionUsers) {
      if (users.size === 1) sessionOwner.set(session, [...users][0]);
    }

    const eventsByUser = new Map<string, AnalyticsRow[]>();
    for (const row of events) {
      const derivedUserId = row.user_id ?? (row.session_key ? sessionOwner.get(row.session_key) : null);
      if (!derivedUserId) continue;
      const current = eventsByUser.get(derivedUserId) ?? [];
      current.push(row);
      eventsByUser.set(derivedUserId, current);
    }

    const newUserIds = newUsers.map((user) => user.id);
    const simulatorCounts = new Map<string, number>();
    const pdfUploadCounts = new Map<string, number>();

    if (newUserIds.length > 0) {
      const [{ data: simulatorRows, error: simulatorError }, { data: materialRows, error: materialError }] =
        await Promise.all([
          admin
            .from('simulator_attempts')
            .select('user_id, created_at')
            .in('user_id', newUserIds)
            .gte('created_at', start.toISOString()),
          admin
            .from('student_materials')
            .select('user_id, created_at')
            .in('user_id', newUserIds)
            .gte('created_at', start.toISOString()),
        ]);

      if (simulatorError) throw simulatorError;
      if (materialError) throw materialError;

      for (const row of simulatorRows ?? []) {
        const id = String(row.user_id ?? '');
        if (id) simulatorCounts.set(id, (simulatorCounts.get(id) ?? 0) + 1);
      }
      for (const row of materialRows ?? []) {
        const id = String(row.user_id ?? '');
        if (id) pdfUploadCounts.set(id, (pdfUploadCounts.get(id) ?? 0) + 1);
      }
    }

    const firstMateriaByUser = new Map<string, string>();
    for (const user of newUsers) {
      const userEvents = (eventsByUser.get(user.id) ?? []).filter(
        (row) => !row.created_at || new Date(row.created_at).getTime() >= new Date(user.createdAt).getTime() - DAY_MS
      );
      const materiaEvent = userEvents.find(isMateriaVisit);
      const materiaId = materiaEvent ? eventMateriaId(materiaEvent) : null;
      if (materiaId) firstMateriaByUser.set(user.id, materiaId);
    }

    const materiaIds = Array.from(new Set(firstMateriaByUser.values()));
    const { available: currentAvailableMaterias, names: materiaNames } = await loadMateriaAvailability(
      admin,
      materiaIds
    );

    const journeys: UserJourney[] = newUsers.map((user) => {
      const registeredAtMs = new Date(user.createdAt).getTime();
      const userEvents = (eventsByUser.get(user.id) ?? []).filter((row) => {
        if (!row.created_at) return true;
        const eventMs = new Date(row.created_at).getTime();
        return eventMs >= registeredAtMs - DAY_MS;
      });
      const activityEvents = userEvents.filter(
        (row) => !row.created_at || new Date(row.created_at).getTime() >= registeredAtMs
      );
      const materiaId = firstMateriaByUser.get(user.id) ?? null;
      const reachedMateria = activityEvents.some(isMateriaVisit) || Boolean(materiaId);
      const hasExplicitAvailable = activityEvents.some((row) => row.event_name === 'content_available');
      const hasExplicitEmpty = activityEvents.some((row) => row.event_name === 'content_empty');
      const contentAvailable = hasExplicitAvailable
        ? true
        : hasExplicitEmpty
          ? false
          : Boolean(materiaId && currentAvailableMaterias.has(materiaId));
      const contentOpened = activityEvents.some(
        (row) => STUDY_EVENT_NAMES.has(row.event_name) || (row.event_name === 'page_view' && isStudyPath(row.path))
      );
      const meaningfulStudy = activityEvents.some((row) => {
        if (row.event_name === 'meaningful_study_completed') return true;
        return (
          row.event_name === 'session_ping' &&
          isStudyPath(row.path) &&
          (metadataNumber(row.metadata, 'engagement_ms') ?? 0) >= 90_000
        );
      });
      const signupDay = argentinaDayKey(user.createdAt);
      const returned48h = activityEvents.some((row) => {
        if (!row.created_at) return false;
        const eventMs = new Date(row.created_at).getTime();
        return (
          eventMs > registeredAtMs &&
          eventMs <= registeredAtMs + 48 * 60 * 60 * 1000 &&
          argentinaDayKey(row.created_at) !== signupDay
        );
      });
      const activeDays = new Set(
        activityEvents
          .map((row) => row.created_at)
          .filter((value): value is string => Boolean(value))
          .map(argentinaDayKey)
      ).size;

      return {
        userId: user.id,
        email: user.email,
        registeredAt: user.createdAt,
        source: resolveAcquisitionSource(userEvents),
        materiaId,
        materiaName: materiaId ? materiaNames.get(materiaId) ?? 'Materia' : null,
        reachedMateria,
        contentAvailable,
        contentOpened,
        meaningfulStudy,
        returned48h,
        activeDays,
        simulatorAttempts: simulatorCounts.get(user.id) ?? 0,
        pdfSelected: activityEvents.filter((row) => row.event_name === 'pdf_file_selected').length,
        pdfUploads: Math.max(
          pdfUploadCounts.get(user.id) ?? 0,
          activityEvents.filter((row) => row.event_name === 'pdf_upload_completed').length
        ),
      };
    });

    const registered = journeys.length;
    const reachedMateria = journeys.filter((row) => row.reachedMateria).length;
    const contentAvailable = journeys.filter((row) => row.contentAvailable).length;
    const contentOpened = journeys.filter((row) => row.contentOpened).length;
    const meaningful = journeys.filter((row) => row.meaningfulStudy).length;
    const returned = journeys.filter((row) => row.meaningfulStudy && row.returned48h).length;
    const returnEligible = journeys.filter(
      (row) => row.meaningfulStudy && new Date(row.registeredAt).getTime() <= now.getTime() - 48 * 60 * 60 * 1000
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
    const biggestDrop = dropCandidates.sort((a, b) => b.dropPct - a.dropPct || b.lost - a.lost)[0] ?? null;

    const cohortMap = new Map<string, UserJourney[]>();
    for (const row of journeys) {
      const key = argentinaDayKey(row.registeredAt);
      const list = cohortMap.get(key) ?? [];
      list.push(row);
      cohortMap.set(key, list);
    }
    const cohorts = [...cohortMap.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, rows]) => ({
        date,
        label: formatDay(`${date}T12:00:00-03:00`),
        registered: rows.length,
        materia: rows.filter((row) => row.reachedMateria).length,
        available: rows.filter((row) => row.contentAvailable).length,
        opened: rows.filter((row) => row.contentOpened).length,
        meaningful: rows.filter((row) => row.meaningfulStudy).length,
        returned: rows.filter((row) => row.returned48h).length,
      }));

    const acquisitionMap = new Map<string, UserJourney[]>();
    for (const row of journeys) {
      const list = acquisitionMap.get(row.source) ?? [];
      list.push(row);
      acquisitionMap.set(row.source, list);
    }
    const acquisition = [...acquisitionMap.entries()]
      .map(([source, rows]) => ({
        source,
        registrations: rows.length,
        materia: rows.filter((row) => row.reachedMateria).length,
        meaningful: rows.filter((row) => row.meaningfulStudy).length,
        activationPct: pct(rows.filter((row) => row.meaningfulStudy).length, rows.length),
      }))
      .sort((a, b) => b.registrations - a.registrations || b.meaningful - a.meaningful);

    const emptyMateriaMap = new Map<string, { name: string; users: number }>();
    for (const row of journeys.filter((item) => item.reachedMateria && !item.contentAvailable && item.materiaId)) {
      const current = emptyMateriaMap.get(row.materiaId as string) ?? {
        name: row.materiaName ?? 'Materia',
        users: 0,
      };
      current.users += 1;
      emptyMateriaMap.set(row.materiaId as string, current);
    }
    const topEmptyMaterias = [...emptyMateriaMap.entries()]
      .map(([materiaId, value]) => ({ materiaId, ...value }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 8);

    const pdfSelectedUsers = journeys.filter((row) => row.pdfSelected > 0).length;
    const pdfCompletedUsers = journeys.filter((row) => row.pdfUploads > 0).length;

    return NextResponse.json({
      generatedAt: now.toISOString(),
      period,
      kpis: {
        newUsers: registered,
        activationPct: pct(meaningful, registered),
        meaningfulUsers: meaningful,
        meaningfulOfAvailablePct: pct(meaningful, contentAvailable),
        return48hPct: returnEligible.length > 0 ? pct(returnedEligible, returnEligible.length) : null,
        returnEligibleUsers: returnEligible.length,
        coveragePct: pct(contentAvailable, reachedMateria),
        contentEmptyUsers: journeys.filter((row) => row.reachedMateria && !row.contentAvailable).length,
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
        adminSessions: excludedSessions.size,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'No pudimos cargar las métricas de producto.',
      },
      { status: 500 }
    );
  }
}
