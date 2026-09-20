'use server';

import { listAdminUserIds } from '@/lib/admin-users';
import { createAdminClient } from '@/lib/supabase-admin';

export type AcquisitionSourceKey = 'google' | 'whatsapp' | 'instagram' | 'linkedin';
export type AcquisitionTrendDirection = 'up' | 'down' | 'flat' | 'new';

export interface AcquisitionTimelinePoint {
  key: string;
  label: string;
  entries: number;
}

export interface AcquisitionTrend {
  previousEntries: number;
  absoluteChange: number;
  pctChange: number | null;
  direction: AcquisitionTrendDirection;
}

export interface AcquisitionLandingStats {
  path: string;
  entries: number;
  pct: number;
}

export interface AcquisitionBehaviorStats {
  key:
    | 'authenticated'
    | 'useful_action'
    | 'simulator_started'
    | 'meaningful_study'
    | 'pdf_uploaded'
    | 'signup_started'
    | 'signup_completed'
    | 'returned';
  label: string;
  count: number;
  pct: number;
}

export interface AcquisitionSourceStats {
  source: AcquisitionSourceKey;
  entries: number;
  identifiedUsers: number;
  anonymousEntries: number;
  pct: number;
  topLanding: string | null;
  lastEntryAt: string | null;
  trend: AcquisitionTrend;
  timeline: AcquisitionTimelinePoint[];
}

export interface AcquisitionSourceDetail {
  source: AcquisitionSourceKey;
  entries: number;
  identifiedUsers: number;
  pct: number;
  trend: AcquisitionTrend;
  timeline: AcquisitionTimelinePoint[];
  landings: AcquisitionLandingStats[];
  behavior: AcquisitionBehaviorStats[];
}

export interface AcquisitionOverviewStats {
  totalEntries: number;
  recognizedEntries: number;
  unclassifiedEntries: number;
  sources: AcquisitionSourceStats[];
  detail: AcquisitionSourceDetail | null;
}

const SOURCE_KEYS: AcquisitionSourceKey[] = ['google', 'whatsapp', 'instagram', 'linkedin'];
const ALLOWED_RANGE_DAYS = new Set([1, 7, 14, 30]);
const DAY_MS = 24 * 60 * 60 * 1000;
const ARGENTINA_OFFSET_MS = 3 * 60 * 60 * 1000;

const USEFUL_ACTION_EVENTS = new Set([
  'materia_resumen_opened',
  'materia_resource_opened',
  'materia_simulator_cta_clicked',
  'student_material_study_opened',
  'study_content_opened',
  'meaningful_study_completed',
  'simulator_started',
  'simulator_progress_checkpoint',
  'simulator_finished',
  'pdf_file_selected',
  'pdf_upload_completed',
]);

const DETAIL_EVENT_NAMES = [
  ...USEFUL_ACTION_EVENTS,
  'page_view',
  'login_success',
  'auth_completed',
  'signup_started',
  'signup_completed',
] as const;

type AcquisitionRow = {
  user_id: string | null;
  session_key: string | null;
  path: string | null;
  metadata: unknown;
  created_at: string;
};

type BehaviorRow = {
  event_name: string;
  user_id: string | null;
  session_key: string | null;
  created_at: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeSource(value: unknown): AcquisitionSourceKey | null {
  const normalized = asString(value)?.toLowerCase();
  if (!normalized) return null;

  if (normalized === 'google') return 'google';
  if (normalized === 'whatsapp' || normalized === 'wa') return 'whatsapp';
  if (normalized === 'instagram' || normalized === 'ig') return 'instagram';
  if (normalized === 'linkedin' || normalized === 'linked-in') return 'linkedin';
  return null;
}

function sourceFromReferrer(value: unknown): AcquisitionSourceKey | null {
  const referrer = asString(value);
  if (!referrer) return null;

  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');

    if (host === 'evaluo.com.ar' || host.endsWith('.evaluo.com.ar')) return null;
    if (host === 'accounts.google.com') return null;
    if (host === 'google.com' || /^google\.[a-z.]+$/.test(host)) return 'google';
    if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram';
    if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) return 'linkedin';
    if (host === 'whatsapp.com' || host.endsWith('.whatsapp.com') || host === 'wa.me') {
      return 'whatsapp';
    }
  } catch {
    return null;
  }

  return null;
}

function sourceFromLanding(value: unknown): AcquisitionSourceKey | null {
  const landing = asString(value);
  if (!landing) return null;

  try {
    const url = new URL(landing, 'https://evaluo.com.ar');
    return normalizeSource(url.searchParams.get('utm_source'));
  } catch {
    return null;
  }
}

function resolveSource(metadataValue: unknown): AcquisitionSourceKey | null {
  const metadata = asRecord(metadataValue);
  if (!metadata) return null;

  const directSource = normalizeSource(metadata.source);
  if (directSource) return directSource;

  const landingSource = sourceFromLanding(metadata.landing_path);
  if (landingSource) return landingSource;

  const directReferrerSource = sourceFromReferrer(metadata.referrer);
  if (directReferrerSource) return directReferrerSource;

  const attribution = asRecord(metadata.attribution);
  const attributionSource =
    normalizeSource(attribution?.latest_source) ??
    normalizeSource(attribution?.source) ??
    normalizeSource(attribution?.latest_utm_source) ??
    normalizeSource(attribution?.utm_source);
  if (attributionSource) return attributionSource;

  return sourceFromReferrer(attribution?.latest_referrer) ?? sourceFromReferrer(attribution?.referrer);
}

function normalizeLanding(value: string | null) {
  if (!value) return '/';

  try {
    return new URL(value, 'https://evaluo.com.ar').pathname || '/';
  } catch {
    return value.split('?')[0] || '/';
  }
}

function resolveLanding(path: string | null, metadataValue: unknown) {
  const metadata = asRecord(metadataValue);
  return normalizeLanding(asString(metadata?.landing_path) ?? path ?? '/');
}

function startOfArgentinaDay(date: Date) {
  const argentinaLocal = new Date(date.getTime() - ARGENTINA_OFFSET_MS);
  argentinaLocal.setUTCHours(0, 0, 0, 0);
  return new Date(argentinaLocal.getTime() + ARGENTINA_OFFSET_MS);
}

function argentinaDateKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const local = new Date(date.getTime() - ARGENTINA_OFFSET_MS);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function argentinaHour(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const local = new Date(date.getTime() - ARGENTINA_OFFSET_MS);
  return local.getUTCHours();
}

function formatDayLabel(key: string) {
  const [, month, day] = key.split('-').map(Number);
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${day} ${monthNames[Math.max(0, Math.min(11, month - 1))]}`;
}

function getRange(rangeDays: number) {
  const now = new Date();
  const todayStart = startOfArgentinaDay(now);
  const currentStart = new Date(todayStart.getTime() - (rangeDays - 1) * DAY_MS);
  const currentDurationMs = Math.max(1, now.getTime() - currentStart.getTime());
  const previousStart = new Date(currentStart.getTime() - rangeDays * DAY_MS);
  const previousEnd = new Date(previousStart.getTime() + currentDurationMs);

  return { now, currentStart, previousStart, previousEnd };
}

function acquisitionRowKey(row: AcquisitionRow, index: number) {
  return row.session_key || `anonymous:${row.created_at}:${row.path ?? '/'}:${index}`;
}

function dedupeAcquisitionRows(rows: AcquisitionRow[]) {
  const deduped = new Map<string, AcquisitionRow>();
  rows.forEach((row, index) => {
    const key = acquisitionRowKey(row, index);
    if (!deduped.has(key)) deduped.set(key, row);
  });
  return [...deduped.values()];
}

function buildTrend(currentEntries: number, previousEntries: number): AcquisitionTrend {
  const absoluteChange = currentEntries - previousEntries;

  if (previousEntries === 0) {
    return {
      previousEntries,
      absoluteChange,
      pctChange: currentEntries === 0 ? 0 : null,
      direction: currentEntries === 0 ? 'flat' : 'new',
    };
  }

  const pctChange = (absoluteChange / previousEntries) * 100;
  return {
    previousEntries,
    absoluteChange,
    pctChange,
    direction: absoluteChange > 0 ? 'up' : absoluteChange < 0 ? 'down' : 'flat',
  };
}

function buildTimeline(rows: AcquisitionRow[], rangeDays: number, now: Date) {
  if (rangeDays === 1) {
    const currentHour = argentinaHour(now);
    const counts = new Map<number, number>();
    for (const row of rows) {
      const hour = argentinaHour(row.created_at);
      counts.set(hour, (counts.get(hour) ?? 0) + 1);
    }

    return Array.from({ length: currentHour + 1 }, (_, hour) => ({
      key: String(hour),
      label: `${String(hour).padStart(2, '0')}:00`,
      entries: counts.get(hour) ?? 0,
    }));
  }

  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = argentinaDateKey(row.created_at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const todayStart = startOfArgentinaDay(now);
  return Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date(todayStart.getTime() - (rangeDays - 1 - index) * DAY_MS);
    const key = argentinaDateKey(date);
    return {
      key,
      label: formatDayLabel(key),
      entries: counts.get(key) ?? 0,
    };
  });
}

function chunk<T>(items: T[], size = 200) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function loadBehaviorRows(
  sessionKeys: string[],
  startIso: string,
  endIso: string
): Promise<BehaviorRow[]> {
  if (sessionKeys.length === 0) return [];
  const admin = createAdminClient();
  const rows: BehaviorRow[] = [];

  for (const keys of chunk(sessionKeys)) {
    const { data, error } = await admin
      .from('analytics_events')
      .select('event_name, user_id, session_key, created_at')
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .in('session_key', keys)
      .in('event_name', [...DETAIL_EVENT_NAMES])
      .limit(20000);

    if (error) throw error;
    rows.push(...((data ?? []) as BehaviorRow[]));
  }

  return rows;
}

async function loadReturnRows(userIds: string[], startIso: string, endIso: string) {
  if (userIds.length === 0) return [] as Array<{ user_id: string | null; created_at: string }>;
  const admin = createAdminClient();
  const rows: Array<{ user_id: string | null; created_at: string }> = [];

  for (const ids of chunk(userIds)) {
    const { data, error } = await admin
      .from('analytics_events')
      .select('user_id, created_at')
      .eq('event_name', 'page_view')
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .in('user_id', ids)
      .limit(30000);

    if (error) throw error;
    rows.push(...((data ?? []) as Array<{ user_id: string | null; created_at: string }>));
  }

  return rows;
}

async function buildSourceDetail({
  source,
  currentRows,
  recognizedEntries,
  trend,
  timeline: _timeline,
  rangeDays,
  currentStart,
  now,
}: {
  source: AcquisitionSourceKey;
  currentRows: AcquisitionRow[];
  recognizedEntries: number;
  trend: AcquisitionTrend;
  timeline: AcquisitionTimelinePoint[];
  rangeDays: number;
  currentStart: Date;
  now: Date;
}): Promise<AcquisitionSourceDetail> {
  const sourceRows = currentRows.filter((row) => resolveSource(row.metadata) === source);
  const sourceEntries = sourceRows.length;
  const anonymousEntries = sourceRows.filter((row) => !row.user_id).length;
  const landingCounts = new Map<string, number>();

  for (const row of sourceRows) {
    const landing = resolveLanding(row.path, row.metadata);
    landingCounts.set(landing, (landingCounts.get(landing) ?? 0) + 1);
  }

  const landings = [...landingCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, entries]) => ({
      path,
      entries,
      pct: sourceEntries > 0 ? (entries / sourceEntries) * 100 : 0,
    }));

  const sessionKeys = sourceRows.map((row) => row.session_key).filter((value): value is string => Boolean(value));
  const behaviorRows = await loadBehaviorRows(
    [...new Set(sessionKeys)],
    currentStart.toISOString(),
    now.toISOString()
  );

  const behaviorBySession = new Map<string, Set<string>>();
  const sessionUserIds = new Map<string, string>();

  for (const row of sourceRows) {
    if (row.session_key && row.user_id) sessionUserIds.set(row.session_key, row.user_id);
  }

  for (const row of behaviorRows) {
    if (!row.session_key) continue;
    const events = behaviorBySession.get(row.session_key) ?? new Set<string>();
    events.add(row.event_name);
    behaviorBySession.set(row.session_key, events);
    if (row.user_id) sessionUserIds.set(row.session_key, row.user_id);
  }

  const identifiedUsers = new Set(sessionUserIds.values());
  const returnRows = await loadReturnRows(
    [...identifiedUsers],
    currentStart.toISOString(),
    now.toISOString()
  );
  const pageViewsByUser = new Map<string, string[]>();
  for (const row of returnRows) {
    if (!row.user_id) continue;
    const timestamps = pageViewsByUser.get(row.user_id) ?? [];
    timestamps.push(row.created_at);
    pageViewsByUser.set(row.user_id, timestamps);
  }

  let authenticatedCount = 0;
  let usefulActionCount = 0;
  let simulatorStartedCount = 0;
  let meaningfulStudyCount = 0;
  let pdfUploadedCount = 0;
  let signupStartedCount = 0;
  let signupCompletedCount = 0;
  let returnedCount = 0;

  for (const acquisition of sourceRows) {
    const sessionKey = acquisition.session_key;
    const events = sessionKey ? behaviorBySession.get(sessionKey) ?? new Set<string>() : new Set<string>();

    const userId = sessionKey ? sessionUserIds.get(sessionKey) : acquisition.user_id ?? undefined;
    if (userId) authenticatedCount += 1;
    if ([...events].some((eventName) => USEFUL_ACTION_EVENTS.has(eventName))) usefulActionCount += 1;
    if (events.has('simulator_started')) simulatorStartedCount += 1;
    if (events.has('meaningful_study_completed')) meaningfulStudyCount += 1;
    if (events.has('pdf_upload_completed')) pdfUploadedCount += 1;
    if (events.has('signup_started')) signupStartedCount += 1;
    if (events.has('signup_completed')) signupCompletedCount += 1;

    if (!userId) continue;

    const acquisitionTime = new Date(acquisition.created_at).getTime();
    const acquisitionDay = argentinaDateKey(acquisition.created_at);
    const returned = (pageViewsByUser.get(userId) ?? []).some((createdAt) => {
      const eventTime = new Date(createdAt).getTime();
      return eventTime > acquisitionTime && argentinaDateKey(createdAt) !== acquisitionDay;
    });
    if (returned) returnedCount += 1;
  }

  const pctOfEntries = (count: number) => (sourceEntries > 0 ? (count / sourceEntries) * 100 : 0);

  return {
    source,
    entries: sourceEntries,
    identifiedUsers: identifiedUsers.size,
    anonymousEntries,
    pct: recognizedEntries > 0 ? (sourceEntries / recognizedEntries) * 100 : 0,
    trend,
    timeline: buildTimeline(sourceRows, rangeDays, now),
    landings,
    behavior: [
      {
        key: 'authenticated',
        label: 'Se autenticaron',
        count: authenticatedCount,
        pct: pctOfEntries(authenticatedCount),
      },
      {
        key: 'useful_action',
        label: 'Hicieron una acción útil',
        count: usefulActionCount,
        pct: pctOfEntries(usefulActionCount),
      },
      {
        key: 'simulator_started',
        label: 'Iniciaron simulador',
        count: simulatorStartedCount,
        pct: pctOfEntries(simulatorStartedCount),
      },
      {
        key: 'meaningful_study',
        label: 'Estudio significativo',
        count: meaningfulStudyCount,
        pct: pctOfEntries(meaningfulStudyCount),
      },
      {
        key: 'pdf_uploaded',
        label: 'Subieron un PDF',
        count: pdfUploadedCount,
        pct: pctOfEntries(pdfUploadedCount),
      },
      {
        key: 'signup_started',
        label: 'Iniciaron registro',
        count: signupStartedCount,
        pct: pctOfEntries(signupStartedCount),
      },
      {
        key: 'signup_completed',
        label: 'Se registraron',
        count: signupCompletedCount,
        pct: pctOfEntries(signupCompletedCount),
      },
      {
        key: 'returned',
        label: 'Volvieron otro día',
        count: returnedCount,
        pct: pctOfEntries(returnedCount),
      },
    ],
  };
}

export async function obtenerAdquisicionAdministrador(
  rangeDays = 7,
  selectedSource: AcquisitionSourceKey | null = null
): Promise<{
  success: boolean;
  stats?: AcquisitionOverviewStats;
  message?: string;
}> {
  try {
    const admin = createAdminClient();
    const adminUserIds = new Set(await listAdminUserIds());
    const normalizedRangeDays = ALLOWED_RANGE_DAYS.has(rangeDays) ? rangeDays : 7;
    const { now, currentStart, previousStart, previousEnd } = getRange(normalizedRangeDays);

    const { data, error } = await admin
      .from('analytics_events')
      .select('user_id, session_key, path, metadata, created_at')
      .eq('event_name', 'acquisition_touch')
      .gte('created_at', previousStart.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: false })
      .limit(50000);

    if (error) throw error;

    const rows = dedupeAcquisitionRows(
      ((data ?? []) as AcquisitionRow[]).filter((row) => !row.user_id || !adminUserIds.has(row.user_id))
    );

    const currentRows = rows.filter((row) => new Date(row.created_at).getTime() >= currentStart.getTime());
    const previousRows = rows.filter((row) => {
      const createdAt = new Date(row.created_at).getTime();
      return createdAt >= previousStart.getTime() && createdAt <= previousEnd.getTime();
    });

    const currentBuckets = new Map<
      AcquisitionSourceKey,
      {
        entries: number;
        userIds: Set<string>;
        landings: Map<string, number>;
        lastEntryAt: string | null;
        rows: AcquisitionRow[];
      }
    >();
    const previousCounts = new Map<AcquisitionSourceKey, number>();

    for (const source of SOURCE_KEYS) {
      currentBuckets.set(source, {
        entries: 0,
        userIds: new Set<string>(),
        landings: new Map<string, number>(),
        lastEntryAt: null,
        rows: [],
      });
      previousCounts.set(source, 0);
    }

    let recognizedEntries = 0;

    for (const row of currentRows) {
      const source = resolveSource(row.metadata);
      if (!source) continue;

      recognizedEntries += 1;
      const bucket = currentBuckets.get(source)!;
      bucket.entries += 1;
      bucket.rows.push(row);
      if (row.user_id) bucket.userIds.add(row.user_id);

      const landing = resolveLanding(row.path, row.metadata);
      bucket.landings.set(landing, (bucket.landings.get(landing) ?? 0) + 1);
      if (!bucket.lastEntryAt) bucket.lastEntryAt = row.created_at;
    }

    for (const row of previousRows) {
      const source = resolveSource(row.metadata);
      if (!source) continue;
      previousCounts.set(source, (previousCounts.get(source) ?? 0) + 1);
    }

    const sources = SOURCE_KEYS.map((source) => {
      const bucket = currentBuckets.get(source)!;
      const topLanding = [...bucket.landings.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      const trend = buildTrend(bucket.entries, previousCounts.get(source) ?? 0);

      return {
        source,
        entries: bucket.entries,
        identifiedUsers: bucket.userIds.size,
        pct: recognizedEntries > 0 ? (bucket.entries / recognizedEntries) * 100 : 0,
        topLanding,
        lastEntryAt: bucket.lastEntryAt,
        trend,
        timeline: buildTimeline(bucket.rows, normalizedRangeDays, now),
      } satisfies AcquisitionSourceStats;
    });

    const detailSource = selectedSource && SOURCE_KEYS.includes(selectedSource) ? selectedSource : null;
    const selectedStats = detailSource ? sources.find((item) => item.source === detailSource) ?? null : null;
    const detail =
      detailSource && selectedStats
        ? await buildSourceDetail({
            source: detailSource,
            currentRows,
            recognizedEntries,
            trend: selectedStats.trend,
            timeline: selectedStats.timeline,
            rangeDays: normalizedRangeDays,
            currentStart,
            now,
          })
        : null;

    return {
      success: true,
      stats: {
        totalEntries: currentRows.length,
        recognizedEntries,
        unclassifiedEntries: Math.max(0, currentRows.length - recognizedEntries),
        sources,
        detail,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo cargar adquisición.',
    };
  }
}
