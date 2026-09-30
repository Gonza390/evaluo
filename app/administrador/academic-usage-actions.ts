'use server';

import { requireAdminAccess } from '@/lib/auth';
import { listAdminUserIds } from '@/lib/admin-users';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ENGAGEMENT_EVENT_MS = 30 * 60 * 1000;

type JsonRecord = Record<string, unknown>;

export interface AcademicUsageUniversityRow {
  id: string;
  name: string;
  users: number;
  activeUsers7d: number;
  avgMinutes7d: number;
  pdfs: number;
  flashcards: number;
  pdfSimulators: number;
  lastActivityAt: string | null;
}

export interface AcademicUsageStats {
  universitiesWithUsers: number;
  users: number;
  activeUsers7d: number;
  avgMinutes7d: number;
  pdfs: number;
  flashcards: number;
  pdfSimulators: number;
  universities: AcademicUsageUniversityRow[];
}

async function fetchAllRows<T>(
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
    if (error) throw error;

    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

function arrayLength(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function engagementMs(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return 0;
  const raw = Number((metadata as JsonRecord).engagement_ms ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(raw, MAX_ENGAGEMENT_EVENT_MS);
}

function newestDate(current: string | null, candidate: string | null | undefined) {
  if (!candidate) return current;
  if (!current) return candidate;
  return new Date(candidate).getTime() > new Date(current).getTime() ? candidate : current;
}

export async function obtenerUsoAcademicoAdministrador(): Promise<{
  success: boolean;
  stats?: AcademicUsageStats;
  message?: string;
}> {
  try {
    await requireAdminAccess();

    const admin = createAdminClient();
    const adminUserIds = new Set(await listAdminUserIds());
    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * DAY_MS).toISOString();
    const thirtyDaysAgo = new Date(now - 30 * DAY_MS).toISOString();

    const [universities, profiles, materials, analytics] = await Promise.all([
      fetchAllRows<{ id: string; nombre: string }>((from, to) =>
        admin.from('universidades').select('id,nombre').order('nombre').range(from, to)
      ),
      fetchAllRows<{ id: string; universidad_id: string | null; role: string | null }>((from, to) =>
        admin.from('profiles').select('id,universidad_id,role').range(from, to)
      ),
      fetchAllRows<{
        id: string;
        user_id: string;
        universidad_id: string | null;
        processing_status: string | null;
        pedagogical_artifacts: unknown;
        created_at: string | null;
      }>((from, to) =>
        admin
          .from('student_materials')
          .select(
            'id,user_id,universidad_id,processing_status,pedagogical_artifacts,created_at'
          )
          .range(from, to)
      ),
      fetchAllRows<{
        user_id: string | null;
        event_name: string;
        metadata: unknown;
        created_at: string | null;
      }>((from, to) =>
        admin
          .from('analytics_events')
          .select('user_id,event_name,metadata,created_at')
          .gte('created_at', thirtyDaysAgo)
          .not('user_id', 'is', null)
          .order('created_at', { ascending: false })
          .range(from, to)
      ),
    ]);

    const universityById = new Map(universities.map((row) => [row.id, row]));
    const universityIdByUser = new Map<string, string>();

    for (const profile of profiles) {
      if (adminUserIds.has(profile.id) || profile.role === 'admin') continue;
      const universityId = String(profile.universidad_id ?? '').trim();
      if (!universityId || !universityById.has(universityId)) continue;
      universityIdByUser.set(profile.id, universityId);
    }

    const rowsByUniversity = new Map<string, AcademicUsageUniversityRow>();
    const activeUsersByUniversity = new Map<string, Set<string>>();
    const engagementByUniversity = new Map<string, number>();

    for (const university of universities) {
      rowsByUniversity.set(university.id, {
        id: university.id,
        name: university.nombre,
        users: 0,
        activeUsers7d: 0,
        avgMinutes7d: 0,
        pdfs: 0,
        flashcards: 0,
        pdfSimulators: 0,
        lastActivityAt: null,
      });
      activeUsersByUniversity.set(university.id, new Set());
      engagementByUniversity.set(university.id, 0);
    }

    for (const universityId of universityIdByUser.values()) {
      const row = rowsByUniversity.get(universityId);
      if (row) row.users += 1;
    }

    for (const material of materials) {
      if (adminUserIds.has(material.user_id)) continue;

      const universityId =
        String(material.universidad_id ?? '').trim() || universityIdByUser.get(material.user_id);
      if (!universityId) continue;

      const row = rowsByUniversity.get(universityId);
      if (!row) continue;

      row.pdfs += 1;
      row.lastActivityAt = newestDate(row.lastActivityAt, material.created_at);

      if (material.processing_status !== 'ready') continue;
      const artifacts =
        material.pedagogical_artifacts &&
        typeof material.pedagogical_artifacts === 'object' &&
        !Array.isArray(material.pedagogical_artifacts)
          ? (material.pedagogical_artifacts as JsonRecord)
          : {};

      row.flashcards += arrayLength(artifacts.flashcards);
      if (arrayLength(artifacts.miniExamQuestionIds) > 0) {
        row.pdfSimulators += 1;
      }
    }

    for (const event of analytics) {
      if (!event.user_id || adminUserIds.has(event.user_id)) continue;
      const universityId = universityIdByUser.get(event.user_id);
      if (!universityId) continue;

      const row = rowsByUniversity.get(universityId);
      if (!row) continue;

      row.lastActivityAt = newestDate(row.lastActivityAt, event.created_at);

      if (!event.created_at || event.created_at < sevenDaysAgo) continue;
      activeUsersByUniversity.get(universityId)?.add(event.user_id);

      if (event.event_name === 'session_ping') {
        engagementByUniversity.set(
          universityId,
          (engagementByUniversity.get(universityId) ?? 0) + engagementMs(event.metadata)
        );
      }
    }

    const universityRows = Array.from(rowsByUniversity.values())
      .map((row) => {
        const activeUsers = activeUsersByUniversity.get(row.id)?.size ?? 0;
        const totalEngagementMs = engagementByUniversity.get(row.id) ?? 0;

        return {
          ...row,
          activeUsers7d: activeUsers,
          avgMinutes7d:
            activeUsers > 0
              ? Number((totalEngagementMs / activeUsers / 60_000).toFixed(1))
              : 0,
        };
      })
      .filter((row) => row.users > 0 || row.pdfs > 0)
      .sort((a, b) => b.users - a.users || b.pdfs - a.pdfs || a.name.localeCompare(b.name, 'es'));

    const users = universityRows.reduce((sum, row) => sum + row.users, 0);
    const activeUsers7d = universityRows.reduce((sum, row) => sum + row.activeUsers7d, 0);
    const totalEngagementMs = universityRows.reduce(
      (sum, row) =>
        sum + (engagementByUniversity.get(row.id) ?? 0),
      0
    );

    return {
      success: true,
      stats: {
        universitiesWithUsers: universityRows.filter((row) => row.users > 0).length,
        users,
        activeUsers7d,
        avgMinutes7d:
          activeUsers7d > 0
            ? Number((totalEngagementMs / activeUsers7d / 60_000).toFixed(1))
            : 0,
        pdfs: universityRows.reduce((sum, row) => sum + row.pdfs, 0),
        flashcards: universityRows.reduce((sum, row) => sum + row.flashcards, 0),
        pdfSimulators: universityRows.reduce((sum, row) => sum + row.pdfSimulators, 0),
        universities: universityRows,
      },
    };
  } catch (error) {
    logError('admin.obtenerUsoAcademico', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar Uso académico.',
    };
  }
}
