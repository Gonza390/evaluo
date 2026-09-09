'use server';

import { listAdminUserIds } from '@/lib/admin-users';
import { createAdminClient } from '@/lib/supabase-admin';

export type AcquisitionSourceKey = 'google' | 'whatsapp' | 'instagram' | 'linkedin';

export interface AcquisitionSourceStats {
  source: AcquisitionSourceKey;
  entries: number;
  identifiedUsers: number;
  pct: number;
  topLanding: string | null;
  lastEntryAt: string | null;
}

export interface AcquisitionOverviewStats {
  totalEntries: number;
  recognizedEntries: number;
  unclassifiedEntries: number;
  sources: AcquisitionSourceStats[];
}

const SOURCE_KEYS: AcquisitionSourceKey[] = ['google', 'whatsapp', 'instagram', 'linkedin'];

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

function resolveSource(metadataValue: unknown): AcquisitionSourceKey | null {
  const metadata = asRecord(metadataValue);
  if (!metadata) return null;

  const directSource = normalizeSource(metadata.source);
  if (directSource) return directSource;

  const attribution = asRecord(metadata.attribution);
  const attributionSource =
    normalizeSource(attribution?.latest_source) ??
    normalizeSource(attribution?.source) ??
    normalizeSource(attribution?.latest_utm_source) ??
    normalizeSource(attribution?.utm_source);
  if (attributionSource) return attributionSource;

  return sourceFromReferrer(metadata.referrer) ?? sourceFromReferrer(attribution?.referrer);
}

function resolveLanding(path: string | null, metadataValue: unknown) {
  const metadata = asRecord(metadataValue);
  return asString(metadata?.landing_path) ?? path ?? '/';
}

export async function obtenerAdquisicionAdministrador(rangeDays = 7): Promise<{
  success: boolean;
  stats?: AcquisitionOverviewStats;
  message?: string;
}> {
  try {
    const admin = createAdminClient();
    const adminUserIds = new Set(await listAdminUserIds());
    const normalizedRangeDays = rangeDays === 1 || rangeDays === 30 ? rangeDays : 7;
    const start = new Date(Date.now() - normalizedRangeDays * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await admin
      .from('analytics_events')
      .select('user_id, path, metadata, created_at')
      .eq('event_name', 'acquisition_touch')
      .gte('created_at', start)
      .order('created_at', { ascending: false })
      .limit(20000);

    if (error) throw error;

    const rows = (data ?? []).filter((row) => !row.user_id || !adminUserIds.has(row.user_id));
    const buckets = new Map<
      AcquisitionSourceKey,
      {
        entries: number;
        userIds: Set<string>;
        landings: Map<string, number>;
        lastEntryAt: string | null;
      }
    >();

    for (const source of SOURCE_KEYS) {
      buckets.set(source, {
        entries: 0,
        userIds: new Set<string>(),
        landings: new Map<string, number>(),
        lastEntryAt: null,
      });
    }

    let recognizedEntries = 0;

    for (const row of rows) {
      const source = resolveSource(row.metadata);
      if (!source) continue;

      recognizedEntries += 1;
      const bucket = buckets.get(source)!;
      bucket.entries += 1;
      if (row.user_id) bucket.userIds.add(row.user_id);

      const landing = resolveLanding(row.path, row.metadata);
      bucket.landings.set(landing, (bucket.landings.get(landing) ?? 0) + 1);
      if (!bucket.lastEntryAt) bucket.lastEntryAt = row.created_at;
    }

    const sources = SOURCE_KEYS.map((source) => {
      const bucket = buckets.get(source)!;
      const topLanding = [...bucket.landings.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      return {
        source,
        entries: bucket.entries,
        identifiedUsers: bucket.userIds.size,
        pct: recognizedEntries > 0 ? (bucket.entries / recognizedEntries) * 100 : 0,
        topLanding,
        lastEntryAt: bucket.lastEntryAt,
      } satisfies AcquisitionSourceStats;
    });

    return {
      success: true,
      stats: {
        totalEntries: rows.length,
        recognizedEntries,
        unclassifiedEntries: Math.max(0, rows.length - recognizedEntries),
        sources,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo cargar adquisición.',
    };
  }
}
