'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdminAccess } from '@/lib/auth';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';
import type { AdministradorLogsData, AdministradorLogsEvent } from './actions';

const STORAGE_AUDIT_KEY = 'biblioteca';
const STORAGE_AUDIT_SAMPLE_LIMIT = 50;

type StorageAuditSnapshot = {
  audit_key: string;
  scanned_at: string;
  total_files: number;
  orphan_count: number;
  orphan_sample: unknown;
};

function normalizeStorageSample(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').slice(0, STORAGE_AUDIT_SAMPLE_LIMIT);
}

function normalizeResourceName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
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
        paths.push(...(await listStoragePathsRecursively(admin, bucket, fullPath)));
      } else {
        paths.push(fullPath);
      }
    }

    offset += limit;
    if (list.length < limit) break;
  }

  return paths;
}

export async function obtenerLogsAdministradorRapido(): Promise<{
  success: boolean;
  data?: AdministradorLogsData;
  storageAuditScannedAt?: string | null;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const db = admin as unknown as SupabaseClient;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [eventsRes, recursosRes, snapshotRes] = await Promise.all([
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
      db
        .from('admin_storage_audit_snapshots')
        .select('audit_key,scanned_at,total_files,orphan_count,orphan_sample')
        .eq('audit_key', STORAGE_AUDIT_KEY)
        .maybeSingle(),
    ]);

    if (eventsRes.error) throw eventsRes.error;
    if (recursosRes.error) throw recursosRes.error;
    if (snapshotRes.error) throw snapshotRes.error;

    const events = eventsRes.data ?? [];
    const resources = recursosRes.data ?? [];
    const snapshot = (snapshotRes.data ?? null) as StorageAuditSnapshot | null;
    const orphanSample = normalizeStorageSample(snapshot?.orphan_sample);
    const orphanFiles = Number(snapshot?.orphan_count ?? 0);

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
        recursos: Array<{
          id: string;
          nombre: string;
          url_archivo: string | null;
          paginas: number | null;
        }>;
      }
    >();

    for (const row of resources) {
      const normalized = normalizeResourceName(row.nombre ?? '');
      if (!normalized) continue;
      const key = `${row.materia_id ?? 'sin-materia'}::${normalized}`;
      const current = duplicateGroupsMap.get(key) ?? {
        normalized_name: normalized,
        materia_id: row.materia_id ?? null,
        count: 0,
        recursos: [],
      };
      current.count += 1;
      current.recursos.push({
        id: row.id,
        nombre: row.nombre,
        url_archivo: row.url_archivo ?? null,
        paginas: row.paginas ?? null,
      });
      duplicateGroupsMap.set(key, current);
    }

    const duplicateRows = Array.from(duplicateGroupsMap.values())
      .filter((group) => group.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const alerts: AdministradorLogsData['alerts'] = [];
    if (errors.length > 0) {
      alerts.push({
        key: 'client-errors',
        severity: errors.length >= 20 ? 'high' : 'medium',
        message: `Se registraron ${errors.length.toLocaleString('es-AR')} errores de cliente en los últimos 7 días.`,
      });
    }
    if (duplicateRows.length > 0) {
      alerts.push({
        key: 'duplicate-pdfs',
        severity: 'medium',
        message: `Hay ${duplicateRows.length.toLocaleString('es-AR')} grupos de PDFs potencialmente duplicados para revisar.`,
      });
    }
    if (orphanFiles > 0) {
      alerts.push({
        key: 'orphan-files',
        severity: 'medium',
        message: `La última auditoría de Storage detectó ${orphanFiles.toLocaleString('es-AR')} archivos huérfanos.`,
      });
    }

    const eventRows = events.filter((event) => event.event_name !== 'session_ping');
    const recentUserIds = Array.from(
      new Set(eventRows.slice(0, 14).map((event) => event.user_id).filter((id): id is string => Boolean(id)))
    );
    const profilesRes = recentUserIds.length
      ? await admin.from('profiles').select('id,nombre').in('id', recentUserIds)
      : { data: [], error: null };
    if (profilesRes.error) throw profilesRes.error;
    const actorById = new Map(
      (profilesRes.data ?? []).map((profile) => [profile.id, profile.nombre?.trim() || null])
    );

    const recentEvents: AdministradorLogsEvent[] = eventRows.slice(0, 14).map((event, index) => {
      const metadata =
        event.metadata && typeof event.metadata === 'object'
          ? (event.metadata as Record<string, unknown>)
          : {};
      const rawDetail =
        event.event_name === 'client_error'
          ? (metadata.message ?? metadata.error ?? metadata.reason ?? 'Error de cliente')
          : event.event_name === 'login_success'
            ? 'Login correcto'
            : event.event_name === 'simulator_started'
              ? 'Simulador iniciado'
              : (metadata.label ?? metadata.action ?? metadata.resource ?? event.event_name);

      return {
        id: `${event.created_at ?? 'sin-fecha'}-${event.user_id ?? event.session_key ?? index}-${index}`,
        eventName: event.event_name,
        path: event.path ?? '/',
        actor: event.user_id
          ? (actorById.get(event.user_id) ?? `Usuario ${event.user_id.slice(0, 8)}`)
          : 'Sesión anónima',
        detail: String(rawDetail).slice(0, 180),
        createdAt: event.created_at ?? null,
      };
    });

    return {
      success: true,
      storageAuditScannedAt: snapshot?.scanned_at ?? null,
      data: {
        totalErrors: errors.length,
        avgLatencyMs,
        duplicateGroups: duplicateRows.length,
        orphanFiles,
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
          return {
            path: row.path ?? '/',
            message: String(metadata.message ?? metadata.error ?? metadata.reason ?? 'Error de cliente').slice(0, 240),
            created_at: row.created_at ?? null,
          };
        }),
        duplicateRows,
        orphanSample: orphanSample.slice(0, 14),
        recentEvents,
      },
    };
  } catch (error) {
    logError('admin.obtenerLogsRapido', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar Logs.',
    };
  }
}

export async function auditarStorageBibliotecaAdministrador(): Promise<{
  success: boolean;
  totalFiles?: number;
  orphanFiles?: number;
  scannedAt?: string;
  message: string;
}> {
  try {
    await requireAdminAccess();
    const admin = createAdminClient();
    const db = admin as unknown as SupabaseClient;

    const [dbResourcesRes, dbMaterialesRes, storagePaths] = await Promise.all([
      admin.from('recursos').select('url_archivo').not('url_archivo', 'is', null).limit(10000),
      admin.from('materiales').select('archivo_url').limit(10000),
      listStoragePathsRecursively(admin, 'biblioteca'),
    ]);

    if (dbResourcesRes.error) throw dbResourcesRes.error;
    if (dbMaterialesRes.error) throw dbMaterialesRes.error;

    const dbSet = new Set([
      ...(dbResourcesRes.data ?? []).map((row) => String(row.url_archivo)),
      ...(dbMaterialesRes.data ?? []).map((row) => String(row.archivo_url)),
    ]);
    const orphanPaths = storagePaths.filter((path) => !dbSet.has(path));
    const scannedAt = new Date().toISOString();

    const { error: snapshotError } = await db.from('admin_storage_audit_snapshots').upsert(
      {
        audit_key: STORAGE_AUDIT_KEY,
        scanned_at: scannedAt,
        total_files: storagePaths.length,
        orphan_count: orphanPaths.length,
        orphan_sample: orphanPaths.slice(0, STORAGE_AUDIT_SAMPLE_LIMIT),
      },
      { onConflict: 'audit_key' }
    );
    if (snapshotError) throw snapshotError;

    return {
      success: true,
      totalFiles: storagePaths.length,
      orphanFiles: orphanPaths.length,
      scannedAt,
      message: `Auditoría completa: ${storagePaths.length.toLocaleString('es-AR')} archivos revisados y ${orphanPaths.length.toLocaleString('es-AR')} huérfanos detectados.`,
    };
  } catch (error) {
    logError('admin.auditarStorageBiblioteca', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos auditar Storage.',
    };
  }
}
