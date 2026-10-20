'use server';

import { getAdminAccessContext } from '@/lib/access-control';
import { listAdminUserIds } from '@/lib/admin-users';
import { createAdminClient } from '@/lib/supabase-admin';

export interface UnlamFunnelStep {
  key: string;
  label: string;
  sessions: number;
  pctOfLanding: number;
}

export interface UnlamFunnelSnapshot {
  periodDays: number;
  steps: UnlamFunnelStep[];
  anonymousLandingEvents: number;
  caveat: string;
}

const PATH = '/como-estudiar-ingreso-unlam';
const SOURCE = 'ingreso-unlam-2027';
const EVENTS = [
  'seo_unlam_practice_started',
  'seo_unlam_practice_completed',
  'seo_unlam_practice_mode_selected',
  'cta_click',
  'pdf_selected',
  'signup_completed',
] as const;
type EventRow = {
  event_name: string;
  user_id: string | null;
  session_key: string | null;
  metadata: unknown;
};
type EntryRow = {
  session_key: string | null;
  user_id: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export async function obtenerEmbudoUnlamAdministrador(rangeDays = 7): Promise<{
  success: boolean;
  stats?: UnlamFunnelSnapshot;
  message?: string;
}> {
  const access = await getAdminAccessContext();
  if (!access.ok) return { success: false, message: 'Acceso restringido.' };

  try {
    const days = [1, 7, 14, 30].includes(rangeDays) ? rangeDays : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const admin = createAdminClient();
    const adminUserIds = new Set(await listAdminUserIds());

    const { data: rawEntries, error: entriesError } = await admin
      .from('analytics_events')
      .select('session_key,user_id')
      .eq('event_name', 'page_view')
      .eq('path', PATH)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10000);

    if (entriesError) throw entriesError;

    const entries = ((rawEntries ?? []) as EntryRow[]).filter(
      (entry) => !entry.user_id || !adminUserIds.has(entry.user_id)
    );
    const sessionKeys = new Set(entries.map((entry) => entry.session_key).filter((key): key is string => Boolean(key)));
    const entryCount = sessionKeys.size + entries.filter((entry) => !entry.session_key).length;
    const sessionsByEvent = new Map(EVENTS.map((event) => [event, new Set<string>()] as const));
    const pdfSessions = new Set<string>();
    const signupSessions = new Set<string>();
    const ctaSessions = new Set<string>();

    // Filtramos por sesiones que visitaron esta landing; evitamos atribuir acciones
    // posteriores de estudiantes procedentes de otras páginas o campañas.
    const keys = [...sessionKeys];
    for (let index = 0; index < keys.length; index += 150) {
      const batch = keys.slice(index, index + 150);
      const { data: events, error } = await admin
        .from('analytics_events')
        .select('event_name,user_id,session_key,metadata')
        .gte('created_at', since)
        .in('session_key', batch)
        .in('event_name', [...EVENTS])
        .limit(20000);
      if (error) throw error;

      for (const event of (events ?? []) as EventRow[]) {
        const key = event.session_key;
        if (!key || (event.user_id && adminUserIds.has(event.user_id))) continue;
        const meta = asRecord(event.metadata);
        const eligible = sessionsByEvent.get(event.event_name as typeof EVENTS[number]);
        eligible?.add(key);
        if (event.event_name === 'pdf_selected' && meta.source === SOURCE) {
          pdfSessions.add(key);
        }
        if (event.event_name === 'cta_click' &&
          typeof meta.destination === 'string' &&
          meta.destination.includes('estudiar-pdf-con-ia')) {
          ctaSessions.add(key);
        }
        if (event.event_name === 'signup_completed') {
          signupSessions.add(key);
        }
      }
    }

    const values = [
      { key: 'landing', label: 'Sesiones de la landing UNLaM', count: entryCount },
      { key: 'practice_started', label: 'Comenzaron una práctica', count: sessionsByEvent.get('seo_unlam_practice_started')?.size ?? 0 },
      { key: 'practice_completed', label: 'Completaron una práctica', count: sessionsByEvent.get('seo_unlam_practice_completed')?.size ?? 0 },
      { key: 'pdf_cta', label: 'Hicieron clic para estudiar un PDF', count: ctaSessions.size },
      { key: 'pdf_selected', label: 'Seleccionaron un PDF (origen UNLaM)', count: pdfSessions.size },
      { key: 'signup_completed', label: 'Completaron registro en la misma sesión', count: signupSessions.size },
    ];

    return {
      success: true,
      stats: {
        periodDays: days,
        anonymousLandingEvents: entries.filter((entry) => !entry.session_key).length,
        steps: values.map((step) => ({
          key: step.key,
          label: step.label,
          sessions: step.count,
          pctOfLanding: entryCount > 0 ? (step.count / entryCount) * 100 : 0,
        })),
        caveat: 'Son sesiones con eventos registrados, no usuarios únicos. El registro tras OAuth puede cambiar el identificador de sesión y quedar subcontado. Las impresiones, consultas y clics orgánicos se miden en Search Console, no en esta tabla.',
      },
    };
  } catch {
    return { success: false, message: 'No pudimos consultar el embudo UNLaM.' };
  }
}
