'use server';

import { revalidatePath } from 'next/cache';
import { listAdminUserIds } from '@/lib/admin-users';
import { requireAdminAccess } from '@/lib/auth';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';

export interface AdministradorResumenStats {
  usersActive: number;
  usersActiveTrendPct: number;
  loginToday: number;
  loginTopSources: Array<{ label: string; value: number }>;
  loginDevices: Array<{ name: string; value: number }>;
  newRegistrations: number;
  newRegistrationsTrendPct: number;
  answeredToday: number;
  answeredTodayTrendPct: number;
  simulatorAttempts: number;
  simulatorAttemptsTrendPct: number;
  topMaterias: Array<{ id: string; name: string; views: number }>;
  devices: Array<{ name: string; value: number; color: string }>;
  visitorLoginSeries: Array<{ label: string; visitantes: number; logins: number }>;
  topPages: Array<{ path: string; views: number }>;
  funnel: Array<{ step: string; value: number }>;
  simulatorLoginGate: {
    reached: number;
    converted: number;
    abandoned: number;
  };
  recentActivity: Array<{
    action: string;
    details: string;
    actor: string;
    date: string | null;
    tone: 'green' | 'blue' | 'orange' | 'violet';
  }>;
}

export interface AdministradorUsuarioRow {
  id: string;
  email: string;
  estado: 'activo' | 'inactivo';
  plan: 'free' | 'premium';
  role: 'admin' | 'student';
  last_sign_in_at: string | null;
  created_at: string | null;
}

export interface AdministradorUsuariosStats {
  totalUsers: number;
  activeToday: number;
  newRegistrationsToday: number;
}

export interface BibliotecaUniversidadOption {
  id: string;
  nombre: string;
}

export interface BibliotecaCarreraOption {
  id: string;
  nombre: string;
  universidadId: string | null;
}

export interface BibliotecaMateriaOption {
  id: string;
  nombre: string;
  slug: string | null;
  isGeneral: boolean;
  universidadIds: string[];
  carreraIds: string[];
  carreraIdByUniversidad: Record<string, string | null>;
}

export interface BibliotecaOverviewStats {
  carrerasTotal: number;
  materiasTotal: number;
  preguntasTotal: number;
}

export interface AdministradorMetricPeriods {
  newRegistrations: 1 | 7 | 30;
  answered: 1 | 7 | 30;
  simulatorAttempts: 1 | 7 | 30;
  anonymous: 1 | 7 | 30;
}

export interface AdministradorMateriaAnalyticsDetail {
  materiaId: string;
  materiaNombre: string;
  totalVisitas: number;
  directLinkEntries: number;
  careerSources: Array<{ label: string; value: number; pct: number }>;
  mobilePct: number;
  loggedPct: number;
  anonymousPct: number;
  actions: Array<{ label: string; value: number; pct: number }>;
  sharedLinkActions: Array<{ label: string; value: number; pct: number }>;
  partials: Array<{
    parcial: number;
    answeredQuestions: number;
    averageScore: number;
    attempts: number;
  }>;
}

export interface BibliotecaCarreraSimuladorMateriaRow {
  id: string;
  nombre: string;
  parcial1Preguntas: number;
  parcial2Preguntas: number;
  totalPreguntas: number;
}

export interface BibliotecaCarreraSimuladorRow {
  carreraId: string;
  carreraNombre: string;
  universidadId: string | null;
  universidadNombre: string | null;
  materias: BibliotecaCarreraSimuladorMateriaRow[];
}

export interface AdministradorLogsAlert {
  key: string;
  severity: 'high' | 'medium';
  message: string;
}

export interface AdministradorLogsEvent {
  id: string;
  eventName: string;
  path: string;
  actor: string;
  detail: string;
  createdAt: string | null;
}

export interface AdministradorLogsData {
  totalErrors: number;
  avgLatencyMs: number;
  duplicateGroups: number;
  orphanFiles: number;
  alerts: AdministradorLogsAlert[];
  failuresByPath: Array<{ path: string; count: number }>;
  recentErrors: Array<{ path: string; message: string; created_at: string | null }>;
  duplicateRows: Array<{
    normalized_name: string;
    materia_id: string | null;
    count: number;
    recursos: Array<{ id: string; nombre: string; url_archivo: string | null; paginas: number | null }>;
  }>;
  orphanSample: string[];
  recentEvents: AdministradorLogsEvent[];
}

function formatAdminError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return String(error);
    }
  }

  return error;
}

const ANALYTICS_UTC_OFFSET_HOURS = -3;
const HOUR_IN_MS = 60 * 60 * 1000;
const ANALYTICS_TIME_ZONE = 'America/Argentina/Buenos_Aires';

function startOfDay(date: Date) {
  // Normalize every admin metric to Argentina time so localhost and production
  // always query the same "day" boundary regardless of server timezone.
  const utcTimestamp = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const analyticsLocalTimestamp = utcTimestamp + ANALYTICS_UTC_OFFSET_HOURS * HOUR_IN_MS;
  const analyticsDate = new Date(analyticsLocalTimestamp);
  analyticsDate.setUTCHours(0, 0, 0, 0);

  return new Date(analyticsDate.getTime() - ANALYTICS_UTC_OFFSET_HOURS * HOUR_IN_MS);
}

function uniqueUsersFromEvents(
  events: Array<{ user_id: string | null; session_key: string | null }>
) {
  return new Set(events.map((event) => event.user_id ?? `anon:${event.session_key ?? 'unknown'}`)).size;
}

function calculateTrend(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function rollingPeriodStart(days: number, now = new Date()) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function calendarPeriodStart(days: number, now = new Date()) {
  if (days === 1) {
    return startOfDay(now);
  }

  return startOfDay(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
}

function formatAnalyticsDayLabel(dateLike: string | Date) {
  return new Date(dateLike).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: ANALYTICS_TIME_ZONE,
  });
}

function buildAnalyticsDayLabels(days: 1 | 7 | 30, now = new Date()) {
  const labels: string[] = [];
  const start = calendarPeriodStart(days, now);

  for (let index = 0; index < days; index += 1) {
    const day = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
    labels.push(formatAnalyticsDayLabel(day));
  }

  return labels;
}

function normalizeMetricPeriod(value: number | string | undefined, fallback: 1 | 7 | 30): 1 | 7 | 30 {
  const parsed = Number(value);
  if (parsed === 1 || parsed === 7 || parsed === 30) return parsed;
  return fallback;
}

function excludeUserIds<T>(query: T, userIds: string[], column = 'user_id') {
  if (userIds.length === 0) {
    return query;
  }

  const serializedIds = userIds.map((id) => `"${id}"`).join(',');
  return (query as { not: (column: string, operator: string, value: string) => T }).not(
    column,
    'in',
    `(${serializedIds})`
  );
}

async function fetchAllAdminRows<T>(
  queryFactory: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await queryFactory(from, to);
    if (error) {
      throw error;
    }

    const chunk = data ?? [];
    rows.push(...chunk);

    if (chunk.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function isNonAdminAnalyticsEvent<T extends { user_id: string | null }>(
  event: T,
  adminUserIdSet: Set<string>
) {
  return !event.user_id || !adminUserIdSet.has(event.user_id);
}

async function listStoragePathsRecursively(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  prefix = ''
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data: list, error } = await admin.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) throw error;
    if (!list || list.length === 0) break;

    for (const item of list) {
      if (!item.name) continue;
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      const metadata = (item as { metadata?: Record<string, unknown> | null }).metadata;
      const isFolder = !metadata || !('size' in metadata);

      if (isFolder) {
        const nested = await listStoragePathsRecursively(admin, bucket, fullPath);
        paths.push(...nested);
      } else {
        paths.push(fullPath);
      }
    }

    offset += limit;
    if (list.length < limit) break;
  }

  return paths;
}

async function fetchUserEmailsByIds(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[]
): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  if (userIds.length === 0) return emails;

  const wanted = new Set(userIds);
  let page = 1;
  const perPage = 1000;

  while (wanted.size > 0) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      logError('admin.fetchUserEmailsByIds.listUsers', error);
      break;
    }

    for (const user of data?.users ?? []) {
      if (!user.email || !wanted.has(user.id)) continue;
      emails.set(user.id, user.email);
      wanted.delete(user.id);
    }

    if ((data?.users?.length ?? 0) < perPage) break;
    page += 1;
  }

  return emails;
}

export async function obtenerResumenAdministrador(
  rangeDays = 30,
  metricPeriods?: Partial<AdministradorMetricPeriods>
): Promise<{
  success: boolean;
  stats?: AdministradorResumenStats;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const adminUserIds = await listAdminUserIds();
    const adminUserIdSet = new Set(adminUserIds);

    const normalizedRangeDays = rangeDays === 1 || rangeDays === 7 || rangeDays === 30 ? rangeDays : 1;
    const newRegistrationsPeriod = normalizeMetricPeriod(
      metricPeriods?.newRegistrations,
      normalizedRangeDays === 7 ? 7 : normalizedRangeDays === 30 ? 30 : 1
    );
    const answeredPeriod = normalizeMetricPeriod(metricPeriods?.answered, 1);
    const simulatorAttemptsPeriod = normalizeMetricPeriod(
      metricPeriods?.simulatorAttempts,
      normalizedRangeDays === 7 ? 7 : 30
    );
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(new Date(todayStart.getTime() - 24 * 60 * 60 * 1000));
    const currentStart = calendarPeriodStart(normalizedRangeDays, now);
    const newRegistrationsCurrentStart = calendarPeriodStart(newRegistrationsPeriod, now);
    const newRegistrationsPreviousStart = calendarPeriodStart(newRegistrationsPeriod * 2, now);
    const answeredCurrentStart = calendarPeriodStart(answeredPeriod, now);
    const answeredPreviousStart = calendarPeriodStart(answeredPeriod * 2, now);
    const simulatorAttemptsCurrentStart = calendarPeriodStart(simulatorAttemptsPeriod, now);
    const simulatorAttemptsPreviousStart = calendarPeriodStart(simulatorAttemptsPeriod * 2, now);

    const [
      currentEvents,
      todayEvents,
      yesterdayEvents,
      answeredCurrentRes,
      answeredPreviousRes,
      recentAuthUsersRes,
      recentSimulatorEventsRaw,
      newRegistrationsCurrentRes,
      newRegistrationsPreviousRes,
      simulatorAttemptsCurrentRes,
      simulatorAttemptsPreviousRes,
    ] = await Promise.all([
      fetchAllAdminRows((from, to) =>
        admin
          .from('analytics_events')
          .select('user_id, session_key, event_name, created_at, path, device_type')
          .gte('created_at', currentStart.toISOString())
          .order('created_at', { ascending: false })
          .range(from, to)
      ),
      fetchAllAdminRows((from, to) =>
        admin
          .from('analytics_events')
          .select('user_id, session_key, event_name, path, device_type, metadata')
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false })
          .range(from, to)
      ),
      fetchAllAdminRows((from, to) =>
        admin
          .from('analytics_events')
          .select('user_id, session_key')
          .gte('created_at', yesterdayStart.toISOString())
          .lt('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false })
          .range(from, to)
      ),
      excludeUserIds(
        admin
          .from('historial_respuestas')
          .select('id', { count: 'exact', head: true })
          .gte('fecha_respuesta', answeredCurrentStart.toISOString()),
        adminUserIds,
        'usuario_id'
      ),
      excludeUserIds(
        admin
          .from('historial_respuestas')
          .select('id', { count: 'exact', head: true })
          .gte('fecha_respuesta', answeredPreviousStart.toISOString())
          .lt('fecha_respuesta', answeredCurrentStart.toISOString()),
        adminUserIds,
        'usuario_id'
      ),
      (async () => {
        try {
          return await admin.auth.admin.listUsers({ page: 1, perPage: 20 });
        } catch (error) {
          return { data: { users: [] }, error };
        }
      })(),
      (async () => {
        try {
          const data = await fetchAllAdminRows((from, to) =>
            admin
              .from('analytics_events')
              .select('event_name, user_id, path, created_at, metadata')
              .in('event_name', ['simulator_started', 'simulator_finished', 'simulator_abandoned'])
              .order('created_at', { ascending: false })
              .range(from, to),
            200
          );
          return { data, error: null };
        } catch (error) {
          return { data: [], error };
        }
      })(),
      admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('creado_at', newRegistrationsCurrentStart.toISOString()),
      admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('creado_at', newRegistrationsPreviousStart.toISOString())
        .lt('creado_at', newRegistrationsCurrentStart.toISOString()),
      excludeUserIds(
        admin
          .from('simulator_attempts')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', simulatorAttemptsCurrentStart.toISOString()),
        adminUserIds
      ),
      excludeUserIds(
        admin
          .from('simulator_attempts')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', simulatorAttemptsPreviousStart.toISOString())
          .lt('created_at', simulatorAttemptsCurrentStart.toISOString()),
        adminUserIds
      ),
    ]);

    if (answeredCurrentRes.error) throw answeredCurrentRes.error;
    if (answeredPreviousRes.error) throw answeredPreviousRes.error;
    if (newRegistrationsCurrentRes.error) throw newRegistrationsCurrentRes.error;
    if (newRegistrationsPreviousRes.error) throw newRegistrationsPreviousRes.error;
    if (simulatorAttemptsCurrentRes.error) throw simulatorAttemptsCurrentRes.error;
    if (simulatorAttemptsPreviousRes.error) throw simulatorAttemptsPreviousRes.error;

    if (recentAuthUsersRes.error) {
      console.warn(
        'No pudimos cargar usuarios recientes para administrador:',
        formatAdminError(recentAuthUsersRes.error)
      );
    }
    if (recentSimulatorEventsRaw.error) {
      console.warn(
        'No pudimos cargar eventos recientes de simulador para administrador:',
        formatAdminError(recentSimulatorEventsRaw.error)
      );
    }

    const recentAuthUsers = recentAuthUsersRes.data?.users ?? [];
    const recentSimulatorEvents = (recentSimulatorEventsRaw.data ?? [])
      .filter((event) => isNonAdminAnalyticsEvent(event, adminUserIdSet))
      .slice(0, 24);
    const currentEventsFiltered = currentEvents.filter((event) => isNonAdminAnalyticsEvent(event, adminUserIdSet));
    const todayEventsFiltered = todayEvents.filter((event) => isNonAdminAnalyticsEvent(event, adminUserIdSet));
    const yesterdayEventsFiltered = yesterdayEvents.filter((event) =>
      isNonAdminAnalyticsEvent(event, adminUserIdSet)
    );

    const topMateriaViews = new Map<string, number>();
    const topPageViews = new Map<string, number>();
    const visitorLoginSeriesMap = new Map<string, { visitantes: Set<string>; logins: Set<string> }>();
    const deviceCounters = { Desktop: 0, Mobile: 0, Tablet: 0 };
    const sessionStages = new Map<string, Set<string>>();
    const loginSourceCounts = new Map<string, number>();
    const loginDeviceCounts = { Desktop: 0, Mobile: 0, Tablet: 0 };
    const simulatorLoginGateReachedSessions = new Set<string>();
    const simulatorLoginGateConvertedSessions = new Set<string>();

    for (const event of currentEventsFiltered) {
      const path = event.path ?? '';
      const deviceType = event.device_type ?? '';
      const createdAt = event.created_at ?? '';
      const sessionKey = event.session_key ?? 'unknown';
      const actorId = event.user_id ?? `anon:${sessionKey}`;
      const stageSet = sessionStages.get(sessionKey) ?? new Set<string>();
      const isPageView = event.event_name === 'page_view';

      if (isPageView) {
        topPageViews.set(path || '/', (topPageViews.get(path || '/') ?? 0) + 1);
      }

      const materiaMatch = path.match(/\/explorar\/materia\/([^/?#]+)/);
      if (isPageView && materiaMatch?.[1]) {
        topMateriaViews.set(materiaMatch[1], (topMateriaViews.get(materiaMatch[1]) ?? 0) + 1);
      }

      if (event.event_name === 'simulator_login_gate_viewed') {
        simulatorLoginGateReachedSessions.add(sessionKey);
      }
      if (event.event_name === 'login_success' && simulatorLoginGateReachedSessions.has(sessionKey) && event.user_id) {
        simulatorLoginGateConvertedSessions.add(sessionKey);
      }

      if (createdAt) {
        const dayLabel = formatAnalyticsDayLabel(createdAt);

        const dayVisitors = visitorLoginSeriesMap.get(dayLabel) ?? {
          visitantes: new Set<string>(),
          logins: new Set<string>(),
        };
        if (isPageView || event.event_name === 'login_success') {
          dayVisitors.visitantes.add(actorId);
        }
        if (event.event_name === 'login_success' && event.user_id) {
          dayVisitors.logins.add(event.user_id);
        }
        visitorLoginSeriesMap.set(dayLabel, dayVisitors);
      }

      if (deviceType === 'mobile') deviceCounters.Mobile += 1;
      else if (deviceType === 'tablet') deviceCounters.Tablet += 1;
      else deviceCounters.Desktop += 1;

      stageSet.add('session');
      if (path.startsWith('/explorar')) stageSet.add('explorar');
      if (path.startsWith('/universidad/') || path.startsWith('/materias')) stageSet.add('carrera');
      if (path.includes('/materia/')) stageSet.add('materia');
      if (path.startsWith('/simulador')) stageSet.add('simulador');
      sessionStages.set(sessionKey, stageSet);
    }

    const loginTodayUsers = new Set<string>();

    for (const event of todayEventsFiltered) {
      const metadata =
        'metadata' in event && typeof event.metadata === 'object' && event.metadata
          ? (event.metadata as Record<string, unknown>)
          : {};

      if ('event_name' in event && event.event_name === 'login_success') {
        if (event.user_id) loginTodayUsers.add(event.user_id);

        const sourcePath = String(metadata.source_path ?? event.path ?? '/');
        loginSourceCounts.set(sourcePath, (loginSourceCounts.get(sourcePath) ?? 0) + 1);

        if (event.device_type === 'mobile') loginDeviceCounts.Mobile += 1;
        else if (event.device_type === 'tablet') loginDeviceCounts.Tablet += 1;
        else loginDeviceCounts.Desktop += 1;
      }
    }

    const recentActivityMateriaIds = recentSimulatorEvents
      .map((event) => {
        const metadata =
          typeof event.metadata === 'object' && event.metadata
            ? (event.metadata as Record<string, unknown>)
            : {};
        const materiaId = String(metadata.materia_id ?? '').trim();
        return materiaId || null;
      })
      .filter((value): value is string => Boolean(value));

    const recentActivityUserIds = Array.from(
      new Set(
        recentSimulatorEvents
          .map((event) => event.user_id)
          .filter((value): value is string => Boolean(value))
      )
    );
    const materiaIds = Array.from(new Set([...topMateriaViews.keys(), ...recentActivityMateriaIds]));
    const materiaNameById = new Map<string, string>();
    const userEmailById = new Map<string, string>();
    if (materiaIds.length > 0) {
      const { data: materiasRows, error: materiasError } = await admin
        .from('materias')
        .select('id, nombre')
        .in('id', materiaIds);

      if (materiasError) {
        logError('admin.obtenerResumen.materias', materiasError);
      } else {
        for (const row of materiasRows ?? []) {
          materiaNameById.set(row.id, row.nombre);
        }
      }
    }


    if (recentActivityUserIds.length > 0) {
      const recentEmails = await fetchUserEmailsByIds(admin, recentActivityUserIds);
      for (const [userId, email] of recentEmails) {
        userEmailById.set(userId, email);
      }
    }
    const usersActive = uniqueUsersFromEvents(todayEventsFiltered);
    const previousUsersActive = uniqueUsersFromEvents(yesterdayEventsFiltered);
    const newRegistrations = newRegistrationsCurrentRes.count ?? 0;
    const previousNewRegistrations = newRegistrationsPreviousRes.count ?? 0;
    const answeredToday = answeredCurrentRes.count ?? 0;
    const answeredYesterday = answeredPreviousRes.count ?? 0;
    const simulatorAttempts = simulatorAttemptsCurrentRes.count ?? 0;
    const previousSimulatorAttempts = simulatorAttemptsPreviousRes.count ?? 0;
    const funnelStages = Array.from(sessionStages.values());
    const sessionsTotal = funnelStages.length;
    const reachedExplorar = funnelStages.filter((item) => item.has('explorar')).length;
    const reachedCarrera = funnelStages.filter((item) => item.has('carrera')).length;
    const reachedMateria = funnelStages.filter((item) => item.has('materia')).length;
    const reachedSimulador = funnelStages.filter((item) => item.has('simulador')).length;
    const simulatorLoginGateReached = simulatorLoginGateReachedSessions.size;
    const simulatorLoginGateConverted = simulatorLoginGateConvertedSessions.size;
    const simulatorLoginGateAbandoned = Math.max(0, simulatorLoginGateReached - simulatorLoginGateConverted);
    const recentActivity = [
      ...recentAuthUsers.map((user) => ({
        action: 'Nuevo usuario',
        details: user.email ?? '(sin email)',
        actor: 'Sistema',
        date: user.created_at ?? null,
        tone: 'green' as const,
      })),
      ...recentSimulatorEvents.map((event) => {
        const metadata =
          typeof event.metadata === 'object' && event.metadata
            ? (event.metadata as Record<string, unknown>)
            : {};
        const metadataMateriaId = String(metadata.materia_id ?? '').trim();
        const simulatorLabel =
          (metadataMateriaId ? materiaNameById.get(metadataMateriaId) : null) ||
          String(metadata.materia_nombre ?? metadata.materiaName ?? '').trim() ||
          event.path ||
          'Simulador';

        return {
          action:
            event.event_name === 'simulator_started'
              ? 'Comenzó simulador'
              : event.event_name === 'simulator_abandoned'
                ? 'Abandonó simulador'
                : 'Terminó simulador',
          details: simulatorLabel,
          actor: event.user_id ? `Usuario ${event.user_id.slice(0, 8)}` : 'Usuario anónimo',
          date: event.created_at ?? null,
          tone:
            event.event_name === 'simulator_started'
              ? ('orange' as const)
              : event.event_name === 'simulator_abandoned'
                ? ('violet' as const)
                : ('blue' as const),
        };
      }),
    ]
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
      .slice(0, 5);

    return {
      success: true,
      stats: {
        usersActive,
        usersActiveTrendPct: calculateTrend(usersActive, previousUsersActive),
        loginToday: loginTodayUsers.size,
        loginTopSources: Array.from(loginSourceCounts.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 3),
        loginDevices: [
          { name: 'Desktop', value: loginDeviceCounts.Desktop },
          { name: 'Mobile', value: loginDeviceCounts.Mobile },
          { name: 'Tablet', value: loginDeviceCounts.Tablet },
        ].filter((item) => item.value > 0),
        newRegistrations,
        newRegistrationsTrendPct: calculateTrend(newRegistrations, previousNewRegistrations),
        answeredToday,
        answeredTodayTrendPct: calculateTrend(answeredToday, answeredYesterday),
        simulatorAttempts,
        simulatorAttemptsTrendPct: calculateTrend(simulatorAttempts, previousSimulatorAttempts),
        topMaterias: Array.from(topMateriaViews.entries())
          .map(([materiaId, views]) => ({
            id: materiaId,
            name: materiaNameById.get(materiaId) ?? `Materia ${materiaId.slice(0, 8)}`,
            views,
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 4),
        devices: [
          { name: 'Desktop', value: deviceCounters.Desktop, color: '#2f66ea' },
          { name: 'Mobile', value: deviceCounters.Mobile, color: '#9b5de5' },
          { name: 'Tablet', value: deviceCounters.Tablet, color: '#16c6b7' },
        ].filter((item) => item.value > 0),
        topPages: Array.from(topPageViews.entries())
          .map(([path, views]) => ({ path, views }))
          .filter((item) => item.path !== '/admin' && item.path !== '/administrador' && !item.path.startsWith('/administrador?'))
          .sort((a, b) => b.views - a.views)
          .slice(0, 5),
        funnel: [
          { step: 'Sesiones', value: sessionsTotal },
          { step: 'Explorar', value: reachedExplorar },
          { step: 'Carrera', value: reachedCarrera },
          { step: 'Materia', value: reachedMateria },
          { step: 'Simulador', value: reachedSimulador },
        ],
        simulatorLoginGate: {
          reached: simulatorLoginGateReached,
          converted: simulatorLoginGateConverted,
          abandoned: simulatorLoginGateAbandoned,
        },
        visitorLoginSeries: buildAnalyticsDayLabels(normalizedRangeDays, now).map((label) => {
          const value = visitorLoginSeriesMap.get(label);
          return {
            label,
            visitantes: value?.visitantes.size ?? 0,
            logins: value?.logins.size ?? 0,
          };
        }),
        recentActivity,
      },
    };
  } catch (error) {
    logError('admin.obtenerResumen', error, { formattedError: formatAdminError(error) });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar el resumen del administrador.',
    };
  }
}

export interface AdministradorConversionStats {
  funnel: Array<{ step: string; value: number; conversionPct: number | null }>;
  gate: { reached: number; converted: number; abandoned: number; conversionRatePct: number };
  postSignup: {
    landed: number;
    continued: number;
    dismissed: number;
    resumed: number;
    finished: number;
    resumeRatePct: number;
  };
  demoToSignup: {
    demoReached: number;
    signedUp: number;
    convertedPct: number;
  };
  retention: {
    newUsers: number;
    day2Cohort: number;
    activeDay2: number;
    day2RetentionPct: number;
    day7Cohort: number;
    activeDay7: number;
    day7RetentionPct: number;
    usersWithSimulator: number;
    usersWith2PlusSimulators: number;
    twoPlusPct: number;
  };
  signupSources: Array<{ label: string; value: number }>;
  dailyConversion: Array<{
    label: string;
    demo: number;
    gate: number;
    registros: number;
    landings: number;
    retomas: number;
    terminados: number;
  }>;
}

function labelSignupSource(location: string, provider: string) {
  const labels: Record<string, string> = {
    login: 'Página de login',
    login_premium_intent: 'Intento premium',
    auth_callback: provider === 'google' ? 'Google (signup)' : 'Email (confirmado)',
  };
  const value = labels[location] ?? location;
  return value.trim() || 'desconocido';
}

const CONVERSION_EVENT_NAMES = [
  'demo_checkpoint_reached',
  'simulator_login_gate_viewed',
  'simulator_login_gate_cta_clicked',
  'signup_completed',
  'post_signup_landing',
  'post_signup_landing_cta_clicked',
  'simulator_resumed',
  'simulator_finished',
  'login_success',
];

export async function obtenerConversionAdministrador(): Promise<{
  success: boolean;
  stats?: AdministradorConversionStats;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const adminUserIds = await listAdminUserIds();
    const adminUserIdSet = new Set(adminUserIds);

    const rangeDays = 30;
    const now = new Date();
    const currentStart = calendarPeriodStart(rangeDays, now);
    const DAY_MS = 24 * 60 * 60 * 1000;

    const [conversionEvents, profilesRes, simulatorAttemptUserRows, activityRows] = await Promise.all([
      fetchAllAdminRows((from, to) =>
        admin
          .from('analytics_events')
          .select('event_name, user_id, session_key, created_at, metadata')
          .in('event_name', CONVERSION_EVENT_NAMES)
          .gte('created_at', currentStart.toISOString())
          .order('created_at', { ascending: false })
          .range(from, to)
      ),
      fetchAllAdminRows((from, to) =>
        admin
          .from('profiles')
          .select('id, creado_at')
          .gte('creado_at', currentStart.toISOString())
          .order('creado_at', { ascending: false })
          .range(from, to)
      ),
      fetchAllAdminRows((from, to) =>
        excludeUserIds(
          admin
            .from('simulator_attempts')
            .select('user_id')
            .gte('created_at', currentStart.toISOString())
            .range(from, to),
          adminUserIds
        )
      ),
      fetchAllAdminRows((from, to) =>
        admin
          .from('analytics_events')
          .select('user_id, created_at')
          .not('user_id', 'is', null)
          .gte('created_at', currentStart.toISOString())
          .order('created_at', { ascending: false })
          .range(from, to)
      ),
    ]);

    const events = conversionEvents.filter((event) => isNonAdminAnalyticsEvent(event, adminUserIdSet));
    const newUserRows = profilesRes.filter((row) => !adminUserIdSet.has(row.id));
    const newUserIds = new Set(newUserRows.map((row) => row.id));

    const demoCheckpointSessions = new Set<string>();
    const gateViewedSessions = new Set<string>();
    const gateCtaSessions = new Set<string>();
    const signupIdentities = new Set<string>();
    const signupSources = new Map<string, number>();
    const landingUsers = new Set<string>();
    const continueUsers = new Set<string>();
    const dismissUsers = new Set<string>();
    const allResumedUsers = new Set<string>();
    const allFinishedUsers = new Set<string>();
    const resumedAtByUser = new Map<string, string>();
    const demoAnonymousIds = new Set<string>();
    const signupAnonymousIds = new Set<string>();
    const dailySignup = new Map<string, number>();
    const dailyLanding = new Map<string, number>();
    const dailyDemo = new Map<string, number>();
    const dailyGate = new Map<string, number>();
    const dailyFinished = new Map<string, number>();

    for (const event of events) {
      const sessionKey = event.session_key ?? 'unknown';
      const userId = event.user_id ?? '';
      const metadata =
        typeof event.metadata === 'object' && event.metadata
          ? (event.metadata as Record<string, unknown>)
          : {};
      const anonymousId = String(metadata.anonymous_id ?? '').trim();

      switch (event.event_name) {
        case 'demo_checkpoint_reached':
          demoCheckpointSessions.add(sessionKey);
          if (anonymousId) demoAnonymousIds.add(anonymousId);
          if (event.created_at) {
            const label = formatAnalyticsDayLabel(event.created_at);
            dailyDemo.set(label, (dailyDemo.get(label) ?? 0) + 1);
          }
          break;
        case 'simulator_login_gate_viewed':
          gateViewedSessions.add(sessionKey);
          if (event.created_at) {
            const label = formatAnalyticsDayLabel(event.created_at);
            dailyGate.set(label, (dailyGate.get(label) ?? 0) + 1);
          }
          break;
        case 'simulator_login_gate_cta_clicked':
          gateCtaSessions.add(sessionKey);
          break;
        case 'signup_completed': {
          const identity = userId || (anonymousId ? `anon:${anonymousId}` : `session:${sessionKey}`);
          signupIdentities.add(identity);
          if (anonymousId) signupAnonymousIds.add(anonymousId);
          const provider = String(metadata.provider ?? '').trim();
          const source = labelSignupSource(String(metadata.location ?? '').trim(), provider);
          signupSources.set(source, (signupSources.get(source) ?? 0) + 1);
          if (event.created_at) {
            const label = formatAnalyticsDayLabel(event.created_at);
            dailySignup.set(label, (dailySignup.get(label) ?? 0) + 1);
          }
          break;
        }
        case 'post_signup_landing':
          if (userId) {
            landingUsers.add(userId);
            if (event.created_at) {
              const label = formatAnalyticsDayLabel(event.created_at);
              dailyLanding.set(label, (dailyLanding.get(label) ?? 0) + 1);
            }
          }
          break;
        case 'post_signup_landing_cta_clicked':
          if (!userId) break;
          if (metadata.cta === 'continue') continueUsers.add(userId);
          else if (metadata.cta === 'dismiss') dismissUsers.add(userId);
          break;
        case 'simulator_resumed':
          if (userId) {
            allResumedUsers.add(userId);
            if (event.created_at) {
              const previous = resumedAtByUser.get(userId);
              if (!previous || previous < event.created_at) {
                resumedAtByUser.set(userId, event.created_at);
              }
            }
          }
          break;
        case 'simulator_finished':
          if (userId) {
            allFinishedUsers.add(userId);
            if (event.created_at) {
              const label = formatAnalyticsDayLabel(event.created_at);
              dailyFinished.set(label, (dailyFinished.get(label) ?? 0) + 1);
            }
          }
          break;
        default:
          break;
      }
    }

    const gateConvertedSessions = new Set<string>();
    for (const event of events) {
      if (
        event.event_name === 'login_success' &&
        event.user_id &&
        gateViewedSessions.has(event.session_key ?? 'unknown')
      ) {
        gateConvertedSessions.add(event.session_key ?? 'unknown');
      }
    }

    const resumedByNewUser = new Set([...allResumedUsers].filter((id) => newUserIds.has(id)));
    const finishedByNewUser = new Set([...allFinishedUsers].filter((id) => newUserIds.has(id)));

    const dailyResume = new Map<string, number>();
    for (const userId of resumedByNewUser) {
      const createdAt = resumedAtByUser.get(userId);
      if (!createdAt) continue;
      const label = formatAnalyticsDayLabel(createdAt);
      dailyResume.set(label, (dailyResume.get(label) ?? 0) + 1);
    }

    const demoToSignup = new Set([...demoAnonymousIds].filter((id) => signupAnonymousIds.has(id))).size;

    const activityByUser = new Map<string, string[]>();
    for (const row of activityRows) {
      if (!row.user_id || adminUserIdSet.has(row.user_id) || !row.created_at) continue;
      const list = activityByUser.get(row.user_id) ?? [];
      list.push(row.created_at);
      activityByUser.set(row.user_id, list);
    }
    let activeDay2 = 0;
    let day2Cohort = 0;
    let activeDay7 = 0;
    let day7Cohort = 0;
    for (const profile of newUserRows) {
      const createdMs = new Date(profile.creado_at ?? '').getTime();
      if (Number.isNaN(createdMs)) continue;
      const activity = activityByUser.get(profile.id) ?? [];
      const hasActivityBetween = (fromMs: number, toMs: number) =>
        activity.some((createdAt) => {
          const ms = new Date(createdAt).getTime();
          return ms >= fromMs && ms < toMs;
        });

      if (now.getTime() - createdMs >= 2 * DAY_MS) {
        day2Cohort += 1;
        if (hasActivityBetween(createdMs + DAY_MS, createdMs + 2 * DAY_MS)) activeDay2 += 1;
      }
      if (now.getTime() - createdMs >= 7 * DAY_MS) {
        day7Cohort += 1;
        if (hasActivityBetween(createdMs + 6 * DAY_MS, createdMs + 7 * DAY_MS)) activeDay7 += 1;
      }
    }

    const simulatorCountByUser = new Map<string, number>();
    for (const row of simulatorAttemptUserRows) {
      if (!row.user_id || adminUserIdSet.has(row.user_id)) continue;
      simulatorCountByUser.set(row.user_id, (simulatorCountByUser.get(row.user_id) ?? 0) + 1);
    }
    const usersWithSimulator = simulatorCountByUser.size;
    const usersWith2PlusSimulators = [...simulatorCountByUser.values()].filter(
      (count) => count >= 2
    ).length;

    const funnelSteps = [
      { step: 'Llegaron al checkpoint demo', value: demoCheckpointSessions.size },
      { step: 'Vieron el gate de login', value: gateViewedSessions.size },
      { step: 'Clickearon el CTA del gate', value: gateCtaSessions.size },
      { step: 'Completaron el registro', value: signupIdentities.size },
      { step: 'Aterrizaron en el dashboard', value: landingUsers.size },
      { step: 'Retomaron el simulador', value: resumedByNewUser.size },
      { step: 'Terminaron el simulador', value: finishedByNewUser.size },
    ];

    const gateReached = gateViewedSessions.size;
    const gateConverted = gateConvertedSessions.size;
    const postSignupResumed = resumedByNewUser.size;
    const postSignupLanded = landingUsers.size;

    return {
      success: true,
      stats: {
        funnel: funnelSteps.map((item, index) => {
          const base = index === 0 ? null : funnelSteps[index - 1].value;
          return {
            ...item,
            conversionPct: base && base > 0 ? Number(((item.value / base) * 100).toFixed(1)) : null,
          };
        }),
        gate: {
          reached: gateReached,
          converted: gateConverted,
          abandoned: Math.max(0, gateReached - gateConverted),
          conversionRatePct:
            gateReached > 0 ? Number(((gateConverted / gateReached) * 100).toFixed(1)) : 0,
        },
        postSignup: {
          landed: postSignupLanded,
          continued: continueUsers.size,
          dismissed: dismissUsers.size,
          resumed: postSignupResumed,
          finished: finishedByNewUser.size,
          resumeRatePct:
            postSignupLanded > 0
              ? Number(((postSignupResumed / postSignupLanded) * 100).toFixed(1))
              : 0,
        },
        demoToSignup: {
          demoReached: demoAnonymousIds.size,
          signedUp: demoToSignup,
          convertedPct:
            demoAnonymousIds.size > 0
              ? Number(((demoToSignup / demoAnonymousIds.size) * 100).toFixed(1))
              : 0,
        },
        retention: {
          newUsers: newUserRows.length,
          day2Cohort,
          activeDay2,
          day2RetentionPct: day2Cohort > 0 ? Number(((activeDay2 / day2Cohort) * 100).toFixed(1)) : 0,
          day7Cohort,
          activeDay7,
          day7RetentionPct: day7Cohort > 0 ? Number(((activeDay7 / day7Cohort) * 100).toFixed(1)) : 0,
          usersWithSimulator,
          usersWith2PlusSimulators,
          twoPlusPct:
            usersWithSimulator > 0
              ? Number(((usersWith2PlusSimulators / usersWithSimulator) * 100).toFixed(1))
              : 0,
        },
        signupSources: Array.from(signupSources.entries())
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value),
        dailyConversion: buildAnalyticsDayLabels(rangeDays, now).map((label) => ({
          label,
          demo: dailyDemo.get(label) ?? 0,
          gate: dailyGate.get(label) ?? 0,
          registros: dailySignup.get(label) ?? 0,
          landings: dailyLanding.get(label) ?? 0,
          retomas: dailyResume.get(label) ?? 0,
          terminados: dailyFinished.get(label) ?? 0,
        })),
      },
    };
  } catch (error) {
    logError('admin.obtenerConversion', error, { formattedError: formatAdminError(error) });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar la conversión del administrador.',
    };
  }
}

export async function obtenerDetalleMateriaAnaliticaAdministrador(
  materiaId: string,
  rangeDays = 30
): Promise<{
  success: boolean;
  detail?: AdministradorMateriaAnalyticsDetail;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    if (!materiaId) {
      return {
        success: false,
        message: 'Falta la materia a analizar.',
      };
    }

    const admin = createAdminClient();
    const adminUserIds = await listAdminUserIds();
    const adminUserIdSet = new Set(adminUserIds);
    const normalizedRangeDays = rangeDays === 1 || rangeDays === 7 || rangeDays === 30 ? rangeDays : 1;
    const currentStart = rollingPeriodStart(normalizedRangeDays, new Date());
    const matterPath = `/explorar/materia/${materiaId}`;

    const [{ data: materiaRow, error: materiaError }, { data: relationRows, error: relationError }] = await Promise.all([
      admin.from('materias').select('id, nombre').eq('id', materiaId).maybeSingle(),
      admin.from('carrera_materias').select('carrera_id').eq('materia_id', materiaId),
    ]);

    if (materiaError) throw materiaError;
    if (relationError) throw relationError;

    const visitRowsRaw = await fetchAllAdminRows<{
      user_id: string | null;
      session_key: string | null;
      event_name: string;
      path: string | null;
      device_type: string | null;
      created_at: string | null;
      metadata: unknown | null;
    }>(async (from, to) =>
      admin
        .from('analytics_events')
        .select('user_id, session_key, event_name, path, device_type, created_at, metadata')
        .eq('event_name', 'page_view')
        .eq('path', matterPath)
        .gte('created_at', currentStart.toISOString())
        .order('created_at', { ascending: true })
        .range(from, to)
    );

    const visitRows = visitRowsRaw.filter((row) => !row.user_id || !adminUserIdSet.has(row.user_id));
    const sessionKeys = Array.from(new Set(visitRows.map((row) => row.session_key).filter((value): value is string => Boolean(value))));
    const relatedCareerIds = Array.from(
      new Set((relationRows ?? []).map((row) => row.carrera_id).filter((value): value is string => Boolean(value)))
    );

    const careerNameById = new Map<string, string>();
    if (relatedCareerIds.length > 0) {
      const { data: careersRows, error: careersError } = await admin
        .from('carreras')
        .select('id, nombre')
        .in('id', relatedCareerIds);

      if (careersError) throw careersError;

      for (const row of careersRows ?? []) {
        careerNameById.set(row.id, row.nombre);
      }
    }

    if (sessionKeys.length === 0) {
      return {
        success: true,
        detail: {
          materiaId,
          materiaNombre: materiaRow?.nombre ?? `Materia ${materiaId.slice(0, 8)}`,
          totalVisitas: 0,
          directLinkEntries: 0,
          careerSources: [],
          mobilePct: 0,
          loggedPct: 0,
          anonymousPct: 0,
          actions: [],
          sharedLinkActions: [],
          partials: [1, 2].map((parcial) => ({
            parcial,
            answeredQuestions: 0,
            averageScore: 0,
            attempts: 0,
          })),
        },
      };
    }

    const sessionEventChunks = await Promise.all(
      chunkArray(sessionKeys, 100).map((keys) =>
        fetchAllAdminRows<{
          user_id: string | null;
          session_key: string | null;
          event_name: string;
          path: string | null;
          device_type: string | null;
          created_at: string | null;
          metadata: unknown | null;
        }>(async (from, to) =>
          admin
            .from('analytics_events')
            .select('user_id, session_key, event_name, path, device_type, created_at, metadata')
            .in('session_key', keys)
            .gte('created_at', currentStart.toISOString())
            .order('created_at', { ascending: true })
            .range(from, to)
        )
      )
    );

    const sessionEvents = sessionEventChunks
      .flat()
      .filter((row) => !row.user_id || !adminUserIdSet.has(row.user_id));
    const loggedUserIds = Array.from(
      new Set(
        sessionEvents
          .map((row) => row.user_id)
          .filter((value): value is string => Boolean(value))
      )
    );

    const userCareerById = new Map<string, string | null>();
    if (loggedUserIds.length > 0) {
      const profileChunks = await Promise.all(
        chunkArray(loggedUserIds, 500).map(async (ids) =>
          admin.from('profiles').select('id, carrera_id').in('id', ids)
        )
      );

      for (const response of profileChunks) {
        if (response.error) throw response.error;

        for (const row of response.data ?? []) {
          userCareerById.set(row.id, row.carrera_id ?? null);
        }
      }
    }

    const eventsBySession = new Map<
      string,
      Array<{
        user_id: string | null;
        session_key: string | null;
        event_name: string;
        path: string | null;
        device_type: string | null;
        created_at: string | null;
        metadata: unknown | null;
      }>
    >();

    for (const row of sessionEvents) {
      const key = row.session_key ?? 'unknown';
      const current = eventsBySession.get(key) ?? [];
      current.push(row);
      eventsBySession.set(key, current);
    }

    const careerCounts = new Map<string, number>();
    const actionCounts = new Map<string, number>();
    const sharedLinkActionCounts = new Map<string, number>();
    let mobileSessions = 0;
    let loggedSessions = 0;
    let anonymousSessions = 0;
    let totalVisitas = 0;
    let directLinkEntries = 0;

    for (const [sessionKey, rawEvents] of eventsBySession.entries()) {
      const events = [...rawEvents].sort(
        (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
      );
      const firstVisitIndex = events.findIndex(
        (event) => event.event_name === 'page_view' && event.path === matterPath
      );

      if (firstVisitIndex === -1) continue;

      totalVisitas += 1;
      const firstVisit = events[firstVisitIndex];
      const firstSessionPageView = events.find((event) => event.event_name === 'page_view');
      const isDirectMatterEntry = firstSessionPageView?.path === matterPath;
      const metadata =
        typeof firstVisit.metadata === 'object' && firstVisit.metadata
          ? (firstVisit.metadata as Record<string, unknown>)
          : {};
      const explicitCareerId =
        typeof metadata.carrera_id === 'string'
          ? metadata.carrera_id
          : typeof metadata.carreraId === 'string'
          ? metadata.carreraId
          : null;
      const previousCareerId =
        events
          .slice(0, firstVisitIndex)
          .map((event) => {
            const eventMetadata =
              typeof event.metadata === 'object' && event.metadata
                ? (event.metadata as Record<string, unknown>)
                : {};
            if (typeof eventMetadata.carrera_id === 'string') return eventMetadata.carrera_id;
            if (typeof eventMetadata.carreraId === 'string') return eventMetadata.carreraId;
            return null;
          })
          .reverse()
          .find((value): value is string => Boolean(value)) ?? null;
      const profileCareerId = firstVisit.user_id ? userCareerById.get(firstVisit.user_id) ?? null : null;
      const fallbackCareerId = !explicitCareerId && !profileCareerId && relatedCareerIds.length === 1 ? relatedCareerIds[0] : null;
      const resolvedCareerId = explicitCareerId || previousCareerId || profileCareerId || fallbackCareerId;
      const careerLabel = resolvedCareerId
        ? careerNameById.get(resolvedCareerId) ?? `Carrera ${resolvedCareerId.slice(0, 8)}`
        : 'Ingreso directo / sin carrera detectada';
      careerCounts.set(careerLabel, (careerCounts.get(careerLabel) ?? 0) + 1);

      if (firstVisit.device_type === 'mobile') {
        mobileSessions += 1;
      }

      if (firstVisit.user_id) {
        loggedSessions += 1;
      } else {
        anonymousSessions += 1;
      }

      const nextEvents = events.slice(firstVisitIndex + 1);
      if (isDirectMatterEntry) {
        directLinkEntries += 1;
      }
      const exploredMatterSection = nextEvents.some((event) => {
        if (event.event_name !== 'page_view' || event.path !== matterPath) return false;
        const eventMetadata =
          typeof event.metadata === 'object' && event.metadata
            ? (event.metadata as Record<string, unknown>)
            : {};
        return ['resumenes', 'trabajos', 'pregunteros'].includes(String(eventMetadata.tab ?? ''));
      });
      const startedSimulator = nextEvents.some((event) => {
        if (!['simulator_started', 'simulator_resumed', 'simulator_finished', 'simulator_abandoned'].includes(event.event_name)) {
          return false;
        }

        const eventMetadata =
          typeof event.metadata === 'object' && event.metadata
            ? (event.metadata as Record<string, unknown>)
            : {};
        return (
          event.path?.startsWith(`/simulador/${materiaId}/`) ||
          String(eventMetadata.materia_id ?? '') === materiaId
        );
      });
      const finishedSimulator = nextEvents.some((event) => {
        if (event.event_name !== 'simulator_finished') return false;
        const eventMetadata =
          typeof event.metadata === 'object' && event.metadata
            ? (event.metadata as Record<string, unknown>)
            : {};
        return (
          event.path?.startsWith(`/simulador/${materiaId}/`) ||
          String(eventMetadata.materia_id ?? '') === materiaId
        );
      });
      const viewedResources = nextEvents.some(
        (event) => event.event_name === 'page_view' && event.path?.startsWith(`/recursos/${materiaId}`)
      );
      const viewedResumenes = nextEvents.some((event) => {
        if (!['materia_tab_viewed', 'materia_resumen_opened'].includes(event.event_name)) return false;
        const eventMetadata =
          typeof event.metadata === 'object' && event.metadata
            ? (event.metadata as Record<string, unknown>)
            : {};
        return (
          String(eventMetadata.materia_id ?? '') === materiaId &&
          (event.event_name === 'materia_resumen_opened' ||
            String(eventMetadata.tab ?? '').toLowerCase() === 'resumenes')
        );
      });
      const openedTrabajos = nextEvents.some((event) => {
        if (!['materia_tab_viewed', 'materia_resource_opened'].includes(event.event_name)) return false;
        const eventMetadata =
          typeof event.metadata === 'object' && event.metadata
            ? (event.metadata as Record<string, unknown>)
            : {};
        return (
          String(eventMetadata.materia_id ?? '') === materiaId &&
          String(eventMetadata.tab ?? '').toLowerCase() === 'trabajos'
        );
      });
      const openedPregunteros = nextEvents.some((event) => {
        if (!['materia_tab_viewed', 'materia_resource_opened', 'materia_simulator_cta_clicked'].includes(event.event_name)) {
          return false;
        }
        const eventMetadata =
          typeof event.metadata === 'object' && event.metadata
            ? (event.metadata as Record<string, unknown>)
            : {};
        return (
          String(eventMetadata.materia_id ?? '') === materiaId &&
          String(eventMetadata.tab ?? '').toLowerCase() === 'pregunteros'
        );
      });

      const actionLabel = finishedSimulator
        ? 'Terminaron simulador'
        : startedSimulator
        ? 'Iniciaron simulador'
        : viewedResources
        ? 'Vieron recursos'
        : exploredMatterSection
        ? 'Abrieron una sección y no avanzaron'
        : 'Solo miraron la materia';

      actionCounts.set(actionLabel, (actionCounts.get(actionLabel) ?? 0) + 1);
      if (isDirectMatterEntry) {
        const sharedActionLabels: string[] = [];

        if (openedTrabajos) sharedActionLabels.push('Abrieron trabajos practicos');
        if (openedPregunteros) sharedActionLabels.push('Abrieron simuladores');
        if (startedSimulator) sharedActionLabels.push('Iniciaron simulador');
        if (viewedResumenes || viewedResources) sharedActionLabels.push('Vieron resumenes');
        if (sharedActionLabels.length === 0) {
          sharedActionLabels.push('No hicieron nada');
        }

        for (const label of sharedActionLabels) {
          sharedLinkActionCounts.set(label, (sharedLinkActionCounts.get(label) ?? 0) + 1);
        }
      }
      eventsBySession.set(sessionKey, events);
    }

    const answerRowsRaw = await fetchAllAdminRows<{
      pregunta_id: string | null;
      usuario_id: string | null;
    }>(async (from, to) =>
      admin
        .from('historial_respuestas')
        .select('pregunta_id, usuario_id')
        .eq('materia_id', materiaId)
        .gte('fecha_respuesta', currentStart.toISOString())
        .range(from, to)
    );
    const answerRows = answerRowsRaw.filter((row) => !row.usuario_id || !adminUserIdSet.has(row.usuario_id));
    const answeredQuestionIds = Array.from(
      new Set(answerRows.map((row) => row.pregunta_id).filter((value): value is string => Boolean(value)))
    );

    const partialByQuestionId = new Map<string, number>();
    if (answeredQuestionIds.length > 0) {
      const bancoQuestionChunks = await Promise.all(
        chunkArray(answeredQuestionIds, 500).map(async (ids) =>
          admin.from('preguntas_banco').select('id, parcial').in('id', ids)
        )
      );

      for (const response of bancoQuestionChunks) {
        if (response.error) throw response.error;
        for (const row of response.data ?? []) {
          if (row.id && row.parcial) {
            partialByQuestionId.set(row.id, row.parcial);
          }
        }
      }

      const missingQuestionIds = answeredQuestionIds.filter((id) => !partialByQuestionId.has(id));
      if (missingQuestionIds.length > 0) {
        const premiumQuestionRows: Array<{ id: string; set_id: string }> = [];

        const premiumQuestionChunks = await Promise.all(
          chunkArray(missingQuestionIds, 500).map(async (ids) =>
            admin.from('premium_questions').select('id, set_id').in('id', ids)
          )
        );

        for (const response of premiumQuestionChunks) {
          if (response.error) throw response.error;
          premiumQuestionRows.push(...(response.data ?? []).filter((row): row is { id: string; set_id: string } => Boolean(row.id && row.set_id)));
        }

        const premiumSetIds = Array.from(new Set(premiumQuestionRows.map((row) => row.set_id)));
        const premiumPartialBySetId = new Map<string, number>();

        if (premiumSetIds.length > 0) {
          const premiumSetChunks = await Promise.all(
            chunkArray(premiumSetIds, 500).map(async (ids) =>
              admin.from('premium_question_sets').select('id, parcial').in('id', ids)
            )
          );

          for (const response of premiumSetChunks) {
            if (response.error) throw response.error;
            for (const row of response.data ?? []) {
              if (row.id && row.parcial) {
                premiumPartialBySetId.set(row.id, row.parcial);
              }
            }
          }
        }

        for (const row of premiumQuestionRows) {
          const parcial = premiumPartialBySetId.get(row.set_id);
          if (parcial) {
            partialByQuestionId.set(row.id, parcial);
          }
        }
      }
    }

    const answeredByPartial = new Map<number, number>();
    for (const row of answerRows) {
      if (!row.pregunta_id) continue;
      const parcial = partialByQuestionId.get(row.pregunta_id);
      if (!parcial) continue;
      answeredByPartial.set(parcial, (answeredByPartial.get(parcial) ?? 0) + 1);
    }

    const attemptRowsRaw = await fetchAllAdminRows<{
      parcial: number | null;
      total_questions: number | null;
      correct_answers: number | null;
      user_id: string | null;
    }>(async (from, to) =>
      admin
        .from('simulator_attempts')
        .select('parcial, total_questions, correct_answers, user_id')
        .eq('materia_id', materiaId)
        .gte('created_at', currentStart.toISOString())
        .range(from, to)
    );
    const attemptRows = attemptRowsRaw.filter((row) => !row.user_id || !adminUserIdSet.has(row.user_id));

    const partialAttemptTotals = new Map<number, { attempts: number; scoreSum: number }>();
    for (const row of attemptRows) {
      if (!row.parcial) continue;
      const current = partialAttemptTotals.get(row.parcial) ?? { attempts: 0, scoreSum: 0 };
      const totalQuestions = Math.max(1, row.total_questions ?? 0);
      const score = ((row.correct_answers ?? 0) / totalQuestions) * 10;
      current.attempts += 1;
      current.scoreSum += score;
      partialAttemptTotals.set(row.parcial, current);
    }

    const partialKeys = Array.from(
      new Set([
        1,
        2,
        ...Array.from(answeredByPartial.keys()),
        ...Array.from(partialAttemptTotals.keys()),
      ])
    ).sort((a, b) => a - b);

    return {
      success: true,
      detail: {
        materiaId,
        materiaNombre: materiaRow?.nombre ?? `Materia ${materiaId.slice(0, 8)}`,
        totalVisitas,
        directLinkEntries,
        careerSources: Array.from(careerCounts.entries())
          .map(([label, value]) => ({
            label,
            value,
            pct: totalVisitas > 0 ? Number(((value / totalVisitas) * 100).toFixed(1)) : 0,
          }))
          .sort((a, b) => b.value - a.value),
        mobilePct: totalVisitas > 0 ? Number(((mobileSessions / totalVisitas) * 100).toFixed(1)) : 0,
        loggedPct: totalVisitas > 0 ? Number(((loggedSessions / totalVisitas) * 100).toFixed(1)) : 0,
        anonymousPct: totalVisitas > 0 ? Number(((anonymousSessions / totalVisitas) * 100).toFixed(1)) : 0,
        actions: Array.from(actionCounts.entries())
          .map(([label, value]) => ({
            label,
            value,
            pct: totalVisitas > 0 ? Number(((value / totalVisitas) * 100).toFixed(1)) : 0,
          }))
          .sort((a, b) => b.value - a.value),
        sharedLinkActions: Array.from(sharedLinkActionCounts.entries())
          .map(([label, value]) => ({
            label,
            value,
            pct: directLinkEntries > 0 ? Number(((value / directLinkEntries) * 100).toFixed(1)) : 0,
          }))
          .sort((a, b) => b.value - a.value),
        partials: partialKeys.map((parcial) => {
          const attemptStats = partialAttemptTotals.get(parcial) ?? { attempts: 0, scoreSum: 0 };
          return {
            parcial,
            answeredQuestions: answeredByPartial.get(parcial) ?? 0,
            averageScore:
              attemptStats.attempts > 0
                ? Number((attemptStats.scoreSum / attemptStats.attempts).toFixed(1))
                : 0,
            attempts: attemptStats.attempts,
          };
        }),
      },
    };
  } catch (error) {
    logError('admin.obtenerDetalleMateriaAnalitica', error, {
      formattedError: formatAdminError(error),
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar el detalle de la materia.',
    };
  }
}

export async function obtenerUsuariosAdministrador(limit = 250): Promise<{
  success: boolean;
  stats?: AdministradorUsuariosStats;
  rows?: AdministradorUsuarioRow[];
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const adminUserIds = await listAdminUserIds();
    const todayStart = startOfDay(new Date());

    const [
      { data: authUsersData, error: authError },
      { data: subscriptionsDataRaw, error: subsError },
      { data: plansRaw, error: plansError },
      { data: profileRows, error: profilesError },
      profilesTotalRes,
      profilesTodayRes,
      todayActiveUsersRes,
    ] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: limit }),
      admin
        .from('user_subscriptions')
        .select('user_id, status, started_at, plan_id')
        .order('started_at', { ascending: false })
        .limit(5000),
      admin.from('subscription_plans').select('id, code'),
      admin.from('profiles').select('id, role').limit(limit),
      admin.from('profiles').select('id', { count: 'exact', head: true }),
      admin.from('profiles').select('id', { count: 'exact', head: true }).gte('creado_at', todayStart.toISOString()),
      excludeUserIds(
        admin
          .from('analytics_events')
          .select('user_id')
          .gte('created_at', todayStart.toISOString())
          .not('user_id', 'is', null)
          .limit(20000),
        adminUserIds
      ),
    ]);

    if (authError) throw authError;
    if (subsError) throw subsError;
    if (plansError) throw plansError;
    if (profilesError) throw profilesError;
    if (profilesTotalRes.error) throw profilesTotalRes.error;
    if (profilesTodayRes.error) throw profilesTodayRes.error;
    if (todayActiveUsersRes.error) throw todayActiveUsersRes.error;

    const subscriptionsData = (subscriptionsDataRaw ?? []) as Array<{
      user_id: string;
      status: string | null;
      started_at: string | null;
      plan_id: string;
    }>;
    const planCodeById = new Map(
      ((plansRaw ?? []) as Array<{ id: string; code: string }>).map((plan) => [plan.id, plan.code])
    );
    const latestPlanByUser = new Map<string, 'free' | 'premium'>();
    const profileRoleByUser = new Map(
      ((profileRows ?? []) as Array<{ id: string; role: string | null }>).map((row) => [
        row.id,
        row.role === 'admin' ? 'admin' : 'student',
      ])
    );

    for (const row of subscriptionsData) {
      if (!row.user_id || latestPlanByUser.has(row.user_id)) continue;
      const code = planCodeById.get(row.plan_id);
      latestPlanByUser.set(row.user_id, code === 'premium' ? 'premium' : 'free');
    }

    const rows: AdministradorUsuarioRow[] = (authUsersData?.users ?? [])
      .map((user) => {
        const lastSignIn = user.last_sign_in_at ?? null;
        const isActive =
          !!lastSignIn &&
          Date.now() - new Date(lastSignIn).getTime() < 30 * 24 * 60 * 60 * 1000;
        const resolvedRole =
          ((user.app_metadata?.role === 'admin' ? 'admin' : null) ??
            profileRoleByUser.get(user.id) ??
            'student') as 'admin' | 'student';

        return {
          id: user.id,
          email: user.email ?? '(sin email)',
          estado: isActive ? ('activo' as const) : ('inactivo' as const),
          plan: latestPlanByUser.get(user.id) ?? 'free',
          role: resolvedRole,
          last_sign_in_at: lastSignIn,
          created_at: user.created_at ?? null,
        };
      })
      .sort((left, right) => {
        const leftLastSignIn = left.last_sign_in_at ? new Date(left.last_sign_in_at).getTime() : 0;
        const rightLastSignIn = right.last_sign_in_at ? new Date(right.last_sign_in_at).getTime() : 0;

        if (leftLastSignIn !== rightLastSignIn) {
          return rightLastSignIn - leftLastSignIn;
        }

        const leftCreatedAt = left.created_at ? new Date(left.created_at).getTime() : 0;
        const rightCreatedAt = right.created_at ? new Date(right.created_at).getTime() : 0;

        return rightCreatedAt - leftCreatedAt;
      });

    const activeToday = new Set(
      (todayActiveUsersRes.data ?? [])
        .map((event) => event.user_id)
        .filter((value): value is string => Boolean(value))
    ).size;

    return {
      success: true,
      stats: {
        totalUsers: profilesTotalRes.count ?? rows.length,
        activeToday,
        newRegistrationsToday: profilesTodayRes.count ?? 0,
      },
      rows,
    };
  } catch (error) {
    logError('admin.obtenerUsuarios', error, { formattedError: formatAdminError(error) });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar el panel de usuarios.',
    };
  }
}

export async function obtenerBibliotecaFormularioAdministrador(): Promise<{
  success: boolean;
  universidades?: BibliotecaUniversidadOption[];
  carreras?: BibliotecaCarreraOption[];
  materias?: BibliotecaMateriaOption[];
  carrerasSimuladores?: BibliotecaCarreraSimuladorRow[];
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const globalSlugs = new Set(['aprender-21', 'tecnologia-humanidades']);

    const [
      universidadesRows,
      carrerasRows,
      materiasRows,
      carreraMateriasRows,
      preguntasRows,
      premiumSetsRows,
      premiumQuestionsRows,
    ] = await Promise.all([
      fetchAllAdminRows<{ id: string; nombre: string }>(async (from, to) =>
        admin.from('universidades').select('id, nombre').order('nombre').range(from, to)
      ),
      fetchAllAdminRows<{ id: string; nombre: string | null; universidad_id: string | null }>(async (from, to) =>
        admin.from('carreras').select('id, nombre, universidad_id').order('nombre').range(from, to)
      ),
      fetchAllAdminRows<{ id: string; nombre: string; slug: string | null; carrera_id: string | null }>(async (from, to) =>
        admin.from('materias').select('id, nombre, slug, carrera_id').order('nombre').range(from, to)
      ),
      fetchAllAdminRows<{ carrera_id: string | null; materia_id: string | null }>(async (from, to) =>
        admin.from('carrera_materias').select('carrera_id, materia_id').range(from, to)
      ),
      fetchAllAdminRows<{ materia_id: string | null; parcial: number | null }>(async (from, to) =>
        admin.from('preguntas_banco').select('materia_id, parcial').range(from, to)
      ),
      fetchAllAdminRows<{
        id: string;
        materia_id: string | null;
        parcial: number | null;
        is_active: boolean | null;
        created_at: string | null;
      }>(async (from, to) =>
        admin
          .from('premium_question_sets')
          .select('id, materia_id, parcial, is_active, created_at')
          .eq('is_active', true)
          .range(from, to)
      ),
      fetchAllAdminRows<{ set_id: string | null }>(async (from, to) =>
        admin.from('premium_questions').select('set_id').range(from, to)
      ),
    ]);

    const universidades = universidadesRows;
    const universidadIds = universidades.map((row) => row.id);
    const universidadNombreById = new Map(universidades.map((row) => [row.id, row.nombre]));
    const carreraToUniversidad = new Map(
      carrerasRows.map((row) => [
        row.id,
        row.universidad_id,
      ])
    );
    const carrerasByMateria = new Map<string, Set<string>>();

    for (const relation of carreraMateriasRows) {
      if (!relation.carrera_id || !relation.materia_id) continue;
      const current = carrerasByMateria.get(relation.materia_id) ?? new Set<string>();
      current.add(relation.carrera_id);
      carrerasByMateria.set(relation.materia_id, current);
    }

    const materias = materiasRows.map((materia) => {
      const normalizedName = materia.nombre.toLowerCase();
      const isGeneral =
        globalSlugs.has(materia.slug ?? '') || normalizedName.includes('aprender en el siglo 21');
      const carreraIds = new Set(carrerasByMateria.get(materia.id) ?? []);
      if (!carreraIds.size && materia.carrera_id) {
        carreraIds.add(materia.carrera_id);
      }

      const carreraIdByUniversidad: Record<string, string | null> = {};
      const universidadIdsForMateria = new Set<string>();

      for (const carreraId of carreraIds) {
        const universidadId = carreraToUniversidad.get(carreraId);
        if (!universidadId) continue;
        universidadIdsForMateria.add(universidadId);
        if (!(universidadId in carreraIdByUniversidad)) {
          carreraIdByUniversidad[universidadId] = carreraId;
        }
      }

      if (isGeneral) {
        for (const universidadId of universidadIds) {
          universidadIdsForMateria.add(universidadId);
          carreraIdByUniversidad[universidadId] = null;
        }
      }

      return {
        id: materia.id,
        nombre: materia.nombre,
        slug: materia.slug,
        isGeneral,
        universidadIds: Array.from(universidadIdsForMateria),
        carreraIds: Array.from(carreraIds),
        carreraIdByUniversidad,
      };
    });

    const questionCountsByMateria = new Map<string, { parcial1: number; parcial2: number }>();
    for (const row of preguntasRows) {
      if (!row.materia_id) continue;
      const current = questionCountsByMateria.get(row.materia_id) ?? { parcial1: 0, parcial2: 0 };
      if (row.parcial === 2) {
        current.parcial2 += 1;
      } else {
        current.parcial1 += 1;
      }
      questionCountsByMateria.set(row.materia_id, current);
    }

    const premiumCountsBySetId = new Map<string, number>();
    for (const row of premiumQuestionsRows) {
      if (!row.set_id) continue;
      premiumCountsBySetId.set(row.set_id, (premiumCountsBySetId.get(row.set_id) ?? 0) + 1);
    }

    const latestPremiumSetByMateriaAndParcial = new Map<
      string,
      { id: string; materia_id: string; parcial: number; created_at: string | null }
    >();
    for (const row of premiumSetsRows) {
      if (!row.id || !row.materia_id || !row.parcial) continue;
      const key = `${row.materia_id}::${row.parcial}`;
      const current = latestPremiumSetByMateriaAndParcial.get(key);
      if (!current) {
        latestPremiumSetByMateriaAndParcial.set(key, {
          id: row.id,
          materia_id: row.materia_id,
          parcial: row.parcial,
          created_at: row.created_at,
        });
        continue;
      }

      if ((row.created_at ?? '') > (current.created_at ?? '')) {
        latestPremiumSetByMateriaAndParcial.set(key, {
          id: row.id,
          materia_id: row.materia_id,
          parcial: row.parcial,
          created_at: row.created_at,
        });
      }
    }

    for (const setRow of latestPremiumSetByMateriaAndParcial.values()) {
      const premiumCount = premiumCountsBySetId.get(setRow.id) ?? 0;
      if (!premiumCount) continue;
      const current = questionCountsByMateria.get(setRow.materia_id) ?? { parcial1: 0, parcial2: 0 };
      if (setRow.parcial === 2) {
        current.parcial2 += premiumCount;
      } else {
        current.parcial1 += premiumCount;
      }
      questionCountsByMateria.set(setRow.materia_id, current);
    }

    const carrerasSimuladores = ((carrerasRows ?? []) as Array<{
      id: string;
      nombre?: string | null;
      universidad_id: string | null;
    }>)
      .map((carrera) => ({
        carreraId: carrera.id,
        carreraNombre: String(carrera.nombre ?? ''),
        universidadId: carrera.universidad_id,
        universidadNombre: carrera.universidad_id
          ? (universidadNombreById.get(carrera.universidad_id) ?? null)
          : null,
        materias: materias
          .filter((materia) => materia.carreraIds.includes(carrera.id))
          .map((materia) => {
            const counts = questionCountsByMateria.get(materia.id) ?? {
              parcial1: 0,
              parcial2: 0,
            };
            return {
              id: materia.id,
              nombre: materia.nombre,
              parcial1Preguntas: counts.parcial1,
              parcial2Preguntas: counts.parcial2,
              totalPreguntas: counts.parcial1 + counts.parcial2,
            };
          })
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
      }))
      .sort((a, b) => a.carreraNombre.localeCompare(b.carreraNombre, 'es'));

    return {
      success: true,
      universidades: universidades.map((row) => ({ id: row.id, nombre: row.nombre })),
      carreras: carrerasRows.map(
        (row) => ({
          id: row.id,
          nombre: String(row.nombre ?? ''),
          universidadId: row.universidad_id,
        })
      ),
      materias,
      carrerasSimuladores,
    };
  } catch (error) {
    logError('admin.obtenerBibliotecaFormulario', error, {
      formattedError: formatAdminError(error),
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar la configuracion de biblioteca.',
    };
  }
}

export async function obtenerBibliotecaResumenAdministrador(): Promise<{
  success: boolean;
  stats?: BibliotecaOverviewStats;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const [carrerasRes, materiasRes, preguntasRes] = await Promise.all([
      admin.from('carreras').select('id', { count: 'exact', head: true }),
      admin.from('materias').select('id', { count: 'exact', head: true }),
      admin.from('preguntas_banco').select('id', { count: 'exact', head: true }),
    ]);

    if (carrerasRes.error) throw carrerasRes.error;
    if (materiasRes.error) throw materiasRes.error;
    if (preguntasRes.error) throw preguntasRes.error;

    return {
      success: true,
      stats: {
        carrerasTotal: carrerasRes.count ?? 0,
        materiasTotal: materiasRes.count ?? 0,
        preguntasTotal: preguntasRes.count ?? 0,
      },
    };
  } catch (error) {
    logError('admin.obtenerBibliotecaResumen', error, {
      formattedError: formatAdminError(error),
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar el resumen de biblioteca.',
    };
  }
}

export async function obtenerLogsAdministrador(): Promise<{
  success: boolean;
  data?: AdministradorLogsData;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [eventsRes, recursosRes, dbResourcesRes, dbMaterialesRes] = await Promise.all([
      admin
        .from('analytics_events')
        .select('event_name, path, metadata, created_at, user_id, session_key')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(12000),
      admin
        .from('recursos')
        .select('id, nombre, url_archivo, materia_id, paginas')
        .order('creado_at', { ascending: false })
        .limit(6000),
      admin.from('recursos').select('url_archivo').not('url_archivo', 'is', null).limit(10000),
      admin.from('materiales').select('archivo_url').limit(10000),
    ]);

    if (eventsRes.error) throw eventsRes.error;
    if (recursosRes.error) throw recursosRes.error;
    if (dbResourcesRes.error) throw dbResourcesRes.error;
    if (dbMaterialesRes.error) throw dbMaterialesRes.error;

    const events = eventsRes.data ?? [];
    const resources = recursosRes.data ?? [];
    const dbSet = new Set([
      ...(dbResourcesRes.data ?? []).map((row) => String(row.url_archivo)),
      ...(dbMaterialesRes.data ?? []).map((row) => String(row.archivo_url)),
    ]);
    const storagePaths = await listStoragePathsRecursively(admin, 'biblioteca');
    const orphanSample = storagePaths.filter((path) => !dbSet.has(path));

    const errors = events.filter((event) => event.event_name === 'client_error');
    const pings = events.filter((event) => event.event_name === 'session_ping');
    const failuresByPathMap = new Map<string, number>();

    for (const event of errors) {
      const path = event.path ?? 'unknown';
      failuresByPathMap.set(path, (failuresByPathMap.get(path) ?? 0) + 1);
    }

    const avgLatencyMs =
      pings.length > 0
        ? Math.round(
            pings.reduce((acc, event) => {
              const metadata =
                event.metadata && typeof event.metadata === 'object'
                  ? (event.metadata as Record<string, unknown>)
                  : {};
              return acc + Number(metadata.engagement_ms ?? 0);
            }, 0) / pings.length
          )
        : 0;

    const duplicateGroupsMap = new Map<
      string,
      {
        normalized_name: string;
        materia_id: string | null;
        count: number;
        recursos: Array<{ id: string; nombre: string; url_archivo: string | null; paginas: number | null }>;
      }
    >();

    for (const row of resources) {
      const normalized = row.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
      const key = `${row.materia_id ?? 'sin_materia'}:${normalized}:${row.paginas ?? 'np'}`;
      const current = duplicateGroupsMap.get(key) ?? {
        normalized_name: normalized,
        materia_id: row.materia_id,
        count: 0,
        recursos: [],
      };
      current.count += 1;
      current.recursos.push({
        id: row.id,
        nombre: row.nombre,
        url_archivo: row.url_archivo,
        paginas: row.paginas,
      });
      duplicateGroupsMap.set(key, current);
    }

    const duplicateRows = Array.from(duplicateGroupsMap.values())
      .filter((row) => row.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const sessionStages = new Map<string, Set<string>>();
    for (const event of events) {
      if (event.event_name !== 'page_view') continue;
      const set = sessionStages.get(event.session_key ?? 'unknown') ?? new Set<string>();
      const path = event.path ?? '/';
      if (path.startsWith('/explorar')) set.add('explorar');
      if (path.includes('/materia/')) set.add('materia');
      sessionStages.set(event.session_key ?? 'unknown', set);
    }

    const totalSessions = sessionStages.size;
    const reachedMateria = Array.from(sessionStages.values()).filter((set) => set.has('materia')).length;
    const abandonoRate =
      totalSessions > 0 ? Number((((totalSessions - reachedMateria) / totalSessions) * 100).toFixed(2)) : 0;

    const alerts: AdministradorLogsAlert[] = [];
    if (abandonoRate > 70) {
      alerts.push({
        key: 'abandono_alto',
        severity: 'high',
        message: `Abandono alto detectado (${abandonoRate}%) en el paso explorar -> materia.`,
      });
    }
    if (errors.length > 50) {
      alerts.push({
        key: 'errores_altos',
        severity: 'high',
        message: `Se detectaron ${errors.length} errores de cliente en los últimos 7 días.`,
      });
    }
    if (duplicateRows.length > 0) {
      alerts.push({
        key: 'duplicados_pdf',
        severity: 'medium',
        message: `Hay ${duplicateRows.length} grupos de PDFs potencialmente duplicados para revisar.`,
      });
    }
    if (orphanSample.length > 0) {
      alerts.push({
        key: 'archivos_huerfanos',
        severity: 'medium',
        message: `Hay ${orphanSample.length} archivos huérfanos en storage sin registro asociado.`,
      });
    }

    const eventRows = events.filter((event) =>
      ['login_success', 'client_error', 'simulator_started', 'simulator_finished'].includes(event.event_name)
    );
    const recentUserIds = Array.from(
      new Set(eventRows.map((row) => row.user_id).filter((value): value is string => Boolean(value)))
    );
    const userEmailById = new Map<string, string>();

    if (recentUserIds.length > 0) {
      const recentEmails = await fetchUserEmailsByIds(admin, recentUserIds);
      for (const [userId, email] of recentEmails) {
        userEmailById.set(userId, email);
      }
    }

    const recentEvents: AdministradorLogsEvent[] = eventRows.slice(0, 14).map((event, index) => {
      const metadata =
        event.metadata && typeof event.metadata === 'object'
          ? (event.metadata as Record<string, unknown>)
          : {};
      const rawDetail =
        event.event_name === 'client_error'
          ? metadata.message ?? metadata.error ?? metadata.reason ?? 'Error de cliente'
          : event.event_name === 'login_success'
            ? 'Login correcto'
            : event.event_name === 'simulator_started'
              ? 'Inicio de simulador'
              : 'Fin de simulador';

      return {
        id: `${event.event_name}-${event.created_at ?? index}`,
        eventName: event.event_name,
        path: event.path ?? '/',
        actor: event.user_id
          ? userEmailById.get(event.user_id) ?? `Usuario ${event.user_id.slice(0, 8)}`
          : 'Sesión anónima',
        detail: String(rawDetail).slice(0, 180),
        createdAt: event.created_at ?? null,
      };
    });

    return {
      success: true,
      data: {
        totalErrors: errors.length,
        avgLatencyMs,
        duplicateGroups: duplicateRows.length,
        orphanFiles: orphanSample.length,
        alerts,
        failuresByPath: Array.from(failuresByPathMap.entries())
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8),
        recentErrors: errors.slice(0, 12).map((row) => {
          const metadata =
            row.metadata && typeof row.metadata === 'object'
              ? (row.metadata as Record<string, unknown>)
              : {};
          const rawMessage =
            metadata.message ?? metadata.error ?? metadata.reason ?? metadata.description ?? 'Sin detalle adicional';

          return {
            path: row.path ?? 'unknown',
            message: String(rawMessage).slice(0, 220),
            created_at: row.created_at ?? null,
          };
        }),
        duplicateRows,
        orphanSample: orphanSample.slice(0, 14),
        recentEvents,
      },
    };
  } catch (error) {
    logError('admin.obtenerLogs', error, { formattedError: formatAdminError(error) });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar los logs del sistema.',
    };
  }
}

export async function eliminarArchivosHuerfanosAdministrador(): Promise<{
  success: boolean;
  deletedCount?: number;
  message: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const [{ data: dbResources, error: dbResourcesError }, { data: dbMateriales, error: dbMaterialesError }] = await Promise.all([
      admin
      .from('recursos')
      .select('url_archivo')
      .not('url_archivo', 'is', null)
      .limit(10000),
      admin.from('materiales').select('archivo_url').limit(10000),
    ]);

    if (dbResourcesError) throw dbResourcesError;
    if (dbMaterialesError) throw dbMaterialesError;

    const dbSet = new Set([
      ...(dbResources ?? []).map((row) => String(row.url_archivo)),
      ...(dbMateriales ?? []).map((row) => String(row.archivo_url)),
    ]);
    const storagePaths = await listStoragePathsRecursively(admin, 'biblioteca');
    const orphanPaths = storagePaths.filter((path) => !dbSet.has(path));

    let deletedCount = 0;
    for (let index = 0; index < orphanPaths.length; index += 100) {
      const chunk = orphanPaths.slice(index, index + 100);
      if (chunk.length === 0) continue;
      const { error } = await admin.storage.from('biblioteca').remove(chunk);
      if (error) throw error;
      deletedCount += chunk.length;
    }

    revalidatePath('/administrador');

    return {
      success: true,
      deletedCount,
      message:
        deletedCount > 0
          ? `Eliminamos ${deletedCount} archivos huérfanos del bucket biblioteca.`
          : 'No había archivos huérfanos para eliminar.',
    };
  } catch (error) {
    logError('admin.eliminarArchivosHuerfanos', error, {
      formattedError: formatAdminError(error),
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos limpiar los archivos huérfanos.',
    };
  }
}


