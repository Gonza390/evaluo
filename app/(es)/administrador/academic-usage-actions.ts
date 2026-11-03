'use server';

import { unstable_cache as nextCache } from 'next/cache';
import { requireAdminAccess } from '@/lib/auth';
import { logError } from '@/lib/observability';
import { createAdminClient } from '@/lib/supabase-admin';

export interface AcademicUsageUniversityRow {
  id: string;
  name: string;
  users: number;
  activeUsers7d: number;
  avgMinutes7d: number;
  pdfs: number;
  flashcardSessionsStarted: number;
  pdfSimulatorsStarted: number;
  lastActivityAt: string | null;
}

export interface AcademicUsageStats {
  universitiesWithUsers: number;
  users: number;
  usersWithoutUniversity: number;
  activeUsers7d: number;
  engagementUsers7d: number;
  avgMinutes7d: number;
  pdfs: number;
  flashcardSessionsStarted: number;
  pdfSimulatorsStarted: number;
  universities: AcademicUsageUniversityRow[];
}

async function loadAcademicAggregate(): Promise<AcademicUsageStats> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('admin_academic_usage_aggregates_v1');
  if (error) throw error;

  const raw = data ?? [];
  const universities = raw.map((row) => {
    const measuredUsers = Number(row.engagement_users_7d ?? 0);
    const totalMs = Number(row.engagement_ms_7d ?? 0);
    return {
      id: row.university_id,
      name: row.university_name,
      users: Number(row.users ?? 0),
      activeUsers7d: Number(row.active_users_7d ?? 0),
      avgMinutes7d: measuredUsers ? Number((totalMs / measuredUsers / 60000).toFixed(1)) : 0,
      pdfs: Number(row.pdfs ?? 0),
      flashcardSessionsStarted: Number(row.flashcard_sessions_started ?? 0),
      pdfSimulatorsStarted: Number(row.pdf_simulators_started ?? 0),
      lastActivityAt: row.last_activity_at,
    };
  });

  const sum = (field: 'users' | 'activeUsers7d' | 'pdfs' | 'flashcardSessionsStarted' | 'pdfSimulatorsStarted') =>
    universities.reduce((total, item) => total + item[field], 0);
  const engagementUsers7d = raw.reduce((total, row) => total + Number(row.engagement_users_7d ?? 0), 0);
  const totalEngagementMs = raw.reduce((total, row) => total + Number(row.engagement_ms_7d ?? 0), 0);

  return {
    universitiesWithUsers: universities.filter((item) => item.id !== 'unknown' && item.users > 0).length,
    users: sum('users'),
    usersWithoutUniversity: universities.find((item) => item.id === 'unknown')?.users ?? 0,
    activeUsers7d: sum('activeUsers7d'),
    engagementUsers7d,
    avgMinutes7d: engagementUsers7d ? Number((totalEngagementMs / engagementUsers7d / 60000).toFixed(1)) : 0,
    pdfs: sum('pdfs'),
    flashcardSessionsStarted: sum('flashcardSessionsStarted'),
    pdfSimulatorsStarted: sum('pdfSimulatorsStarted'),
    universities,
  };
}

// No pagination of the profiles, materials or raw event tables is needed here.
// The database returns only a small row for each university.
const cachedAcademicAggregate = nextCache(
  loadAcademicAggregate,
  ['admin-academic-aggregate-v1'],
  { revalidate: 900 }
);

export async function obtenerUsoAcademicoAdministrador(): Promise<{
  success: boolean;
  stats?: AcademicUsageStats;
  message?: string;
}> {
  try {
    await requireAdminAccess();
    return { success: true, stats: await cachedAcademicAggregate() };
  } catch (error) {
    logError('admin.obtenerUsoAcademico', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar Uso académico.',
    };
  }
}
