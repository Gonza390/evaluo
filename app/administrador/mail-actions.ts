'use server';

import { requireAdminAccess } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';

const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';

export type MailFilterType = 'all' | 'exam' | 'ready' | 'campaign';

export type AdminMailRow = {
  id: string;
  sentAt: string;
  kind: 'exam' | 'ready' | 'campaign' | 'flashcard' | 'study_return';
  label: 'Recordatorio' | 'Material listo' | 'Campaña';
  userName: string;
  userEmail: string;
  detail: string;
  status: string;
};

export type AdminUpcomingMailRow = {
  id: string;
  scheduledFor: string;
  kind: 'exam' | 'flashcard';
  label: 'Recordatorio';
  userName: string;
  userEmail: string;
  detail: string;
};

export type AdminMailData = {
  rows: AdminMailRow[];
  upcoming: AdminUpcomingMailRow[];
  generatedAt: string;
};

type BasicDeliveryRow = {
  id: string;
  user_id: string;
  status: string;
  sender_email_id?: string | null;
  sent_at?: string | null;
  created_at: string;
};

type ExamDeliveryRow = BasicDeliveryRow & {
  materia_id: string | null;
  material_id: string | null;
  exam_date: string;
  reminder_days: number;
  source_type: string | null;
  subject_key: string | null;
};

type ReadyDeliveryRow = BasicDeliveryRow & {
  material_id: string;
};

type FlashcardDeliveryRow = BasicDeliveryRow & {
  material_id: string;
  topics: string[] | null;
  unknown_count: number;
  scheduled_for: string;
  last_error: string | null;
};

type CampaignDeliveryRow = BasicDeliveryRow & {
  campaign_key: string;
  materia_id: string | null;
  context: Record<string, unknown> | null;
  triggered_at: string | null;
};

type StudyReturnDeliveryRow = BasicDeliveryRow & {
  material_id: string;
  pending_count: number;
  last_activity_at: string;
};

type MaterialRow = {
  id: string;
  user_id: string;
  materia_id: string | null;
  title: string | null;
  file_name?: string | null;
  exam_date?: string | null;
  created_at?: string;
};

type CalendarRow = {
  id: string;
  user_id: string;
  material_id: string | null;
  event_date: string;
  materia_id: string | null;
  materia_nombre: string | null;
  title: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  nombre: string | null;
};

type MateriaRow = {
  id: string;
  nombre: string;
};

function getDateKeyInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days, 12)).toISOString().slice(0, 10);
}

function normalizeSubjectName(value: string) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-AR')
    .replace(/\s+/g, ' ');
}

function buildSubjectKey(materiaId: string | null, materiaName: string) {
  if (materiaId) return `materia:${materiaId}`;
  const normalized = normalizeSubjectName(materiaName);
  return normalized ? `nombre:${normalized}` : 'nombre:sin-materia';
}

function dateToMillis(value: string | null | undefined) {
  const ms = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(ms) ? ms : 0;
}

function statusIsHistory(status: string) {
  return !['pending', 'cancelled'].includes(status);
}

function contextText(context: Record<string, unknown> | null, key: string) {
  const value = context?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function obtenerMailsAdministrador(input?: {
  type?: MailFilterType;
  days?: 7 | 30;
}): Promise<{ success: true; data: AdminMailData } | { success: false; message: string }> {
  try {
    await requireAdminAccess();

    const activeType: MailFilterType =
      input?.type === 'exam' || input?.type === 'ready' || input?.type === 'campaign'
        ? input.type
        : 'all';
    const days = input?.days === 30 ? 30 : 7;
    const now = new Date();
    const cutoffMs = now.getTime() - days * 24 * 60 * 60 * 1000;

    const admin = createAdminClient();
    // Varias tablas de lifecycle todavía no están en los tipos generados.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;

    const [
      examResult,
      readyResult,
      flashResult,
      campaignResult,
      studyReturnResult,
    ] = await Promise.all([
      db
        .from('email_reminder_deliveries')
        .select('id,user_id,materia_id,material_id,exam_date,reminder_days,status,sender_email_id,sent_at,created_at,source_type,subject_key')
        .order('created_at', { ascending: false })
        .limit(500),
      db
        .from('student_material_ready_emails')
        .select('id,user_id,material_id,status,sender_email_id,sent_at,created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      db
        .from('flashcard_review_reminders')
        .select('id,user_id,material_id,topics,unknown_count,scheduled_for,status,sender_email_id,sent_at,last_error,created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      db
        .from('email_campaign_deliveries')
        .select('id,campaign_key,user_id,materia_id,context,status,sender_email_id,sent_at,triggered_at,created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      db
        .from('study_return_reminders')
        .select('id,user_id,material_id,last_activity_at,pending_count,status,sender_email_id,sent_at,created_at')
        .order('created_at', { ascending: false })
        .limit(500),
    ]);

    for (const result of [examResult, readyResult, flashResult, campaignResult, studyReturnResult]) {
      if (result.error) throw result.error;
    }

    const examRows = (examResult.data ?? []) as ExamDeliveryRow[];
    const readyRows = (readyResult.data ?? []) as ReadyDeliveryRow[];
    const flashRows = (flashResult.data ?? []) as FlashcardDeliveryRow[];
    const campaignRows = (campaignResult.data ?? []) as CampaignDeliveryRow[];
    const studyReturnRows = (studyReturnResult.data ?? []) as StudyReturnDeliveryRow[];

    const historicalUserIds = new Set<string>();
    const historicalMaterialIds = new Set<string>();
    const historicalMateriaIds = new Set<string>();

    for (const row of [...examRows, ...readyRows, ...flashRows, ...campaignRows, ...studyReturnRows]) {
      historicalUserIds.add(row.user_id);
    }
    for (const row of examRows) {
      if (row.material_id) historicalMaterialIds.add(row.material_id);
      if (row.materia_id) historicalMateriaIds.add(row.materia_id);
    }
    for (const row of [...readyRows, ...flashRows, ...studyReturnRows]) {
      historicalMaterialIds.add(row.material_id);
    }
    for (const row of campaignRows) {
      if (row.materia_id) historicalMateriaIds.add(row.materia_id);
    }

    const today = getDateKeyInTimeZone(now, ARGENTINA_TIME_ZONE);
    const targetDates = new Map<string, 1 | 3 | 7>([
      [addDays(today, 1), 1],
      [addDays(today, 3), 3],
      [addDays(today, 7), 7],
    ]);

    const [futureMaterialsResult, futureCalendarResult, futureFlashResult, existingUpcomingResult] =
      await Promise.all([
        db
          .from('student_materials')
          .select('id,user_id,materia_id,title,file_name,exam_date,created_at')
          .in('exam_date', [...targetDates.keys()])
          .order('created_at', { ascending: false }),
        db
          .from('study_calendar_events')
          .select('id,user_id,material_id,event_date,materia_id,materia_nombre,title,created_at')
          .eq('event_type', 'exam')
          .in('event_date', [...targetDates.keys()])
          .order('created_at', { ascending: false }),
        db
          .from('flashcard_review_reminders')
          .select('id,user_id,material_id,topics,unknown_count,scheduled_for,status,created_at')
          .eq('status', 'pending')
          .gt('scheduled_for', now.toISOString())
          .order('scheduled_for', { ascending: true })
          .limit(100),
        db
          .from('email_reminder_deliveries')
          .select('user_id,subject_key,exam_date,reminder_days,status')
          .in('exam_date', [...targetDates.keys()]),
      ]);

    for (const result of [
      futureMaterialsResult,
      futureCalendarResult,
      futureFlashResult,
      existingUpcomingResult,
    ]) {
      if (result.error) throw result.error;
    }

    const futureMaterials = (futureMaterialsResult.data ?? []) as MaterialRow[];
    const futureCalendar = (futureCalendarResult.data ?? []) as CalendarRow[];
    const futureFlash = (futureFlashResult.data ?? []) as Array<
      Pick<
        FlashcardDeliveryRow,
        'id' | 'user_id' | 'material_id' | 'topics' | 'unknown_count' | 'scheduled_for' | 'status' | 'created_at'
      >
    >;
    const existingUpcoming = (existingUpcomingResult.data ?? []) as Array<{
      user_id: string;
      subject_key: string;
      exam_date: string;
      reminder_days: number;
      status: string;
    }>;

    const alreadyReserved = new Set(
      existingUpcoming.map(
        (row) => `${row.user_id}:${row.subject_key}:${row.exam_date}:${row.reminder_days}`
      )
    );

    type ExamCandidate = {
      id: string;
      userId: string;
      materiaId: string | null;
      materialId: string | null;
      materiaFallback: string;
      examDate: string;
      days: 1 | 3 | 7;
      subjectKey: string;
      source: 'material' | 'calendar';
    };

    const candidates = new Map<string, ExamCandidate>();

    for (const row of futureMaterials) {
      if (!row.exam_date) continue;
      const reminderDays = targetDates.get(row.exam_date);
      if (!reminderDays) continue;
      const fallback = row.title?.trim() || row.file_name?.trim() || 'tu materia';
      const subjectKey = buildSubjectKey(row.materia_id, fallback);
      const reservationKey = `${row.user_id}:${subjectKey}:${row.exam_date}:${reminderDays}`;
      if (alreadyReserved.has(reservationKey)) continue;

      candidates.set(reservationKey, {
        id: `exam-material:${row.id}:${reminderDays}`,
        userId: row.user_id,
        materiaId: row.materia_id,
        materialId: row.id,
        materiaFallback: fallback,
        examDate: row.exam_date,
        days: reminderDays,
        subjectKey,
        source: 'material',
      });
    }

    for (const row of futureCalendar) {
      const reminderDays = targetDates.get(row.event_date);
      if (!reminderDays) continue;
      const fallback = row.materia_nombre?.trim() || row.title.trim() || 'tu materia';
      const subjectKey = buildSubjectKey(row.materia_id, fallback);
      const reservationKey = `${row.user_id}:${subjectKey}:${row.event_date}:${reminderDays}`;
      if (alreadyReserved.has(reservationKey) || candidates.has(reservationKey)) continue;

      candidates.set(reservationKey, {
        id: `exam-calendar:${row.id}:${reminderDays}`,
        userId: row.user_id,
        materiaId: row.materia_id,
        materialId: row.material_id,
        materiaFallback: fallback,
        examDate: row.event_date,
        days: reminderDays,
        subjectKey,
        source: 'calendar',
      });
    }

    for (const candidate of candidates.values()) {
      historicalUserIds.add(candidate.userId);
      if (candidate.materialId) historicalMaterialIds.add(candidate.materialId);
      if (candidate.materiaId) historicalMateriaIds.add(candidate.materiaId);
    }
    for (const row of futureFlash) {
      historicalUserIds.add(row.user_id);
      historicalMaterialIds.add(row.material_id);
    }

    const [profilesResult, materialsResult, materiasResult] = await Promise.all([
      historicalUserIds.size
        ? db.from('profiles').select('id,nombre').in('id', [...historicalUserIds])
        : Promise.resolve({ data: [], error: null }),
      historicalMaterialIds.size
        ? db.from('student_materials').select('id,title,file_name,user_id,materia_id').in('id', [...historicalMaterialIds])
        : Promise.resolve({ data: [], error: null }),
      historicalMateriaIds.size
        ? db.from('materias').select('id,nombre').in('id', [...historicalMateriaIds])
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (materialsResult.error) throw materialsResult.error;
    if (materiasResult.error) throw materiasResult.error;

    const profileById = new Map(
      ((profilesResult.data ?? []) as ProfileRow[]).map((row) => [row.id, row.nombre])
    );
    const materialById = new Map(
      ((materialsResult.data ?? []) as MaterialRow[]).map((row) => [row.id, row])
    );
    const materiaById = new Map(
      ((materiasResult.data ?? []) as MateriaRow[]).map((row) => [row.id, row.nombre])
    );

    const userById = new Map<
      string,
      Awaited<ReturnType<typeof admin.auth.admin.getUserById>>['data']['user']
    >();

    await Promise.all(
      [...historicalUserIds].map(async (userId) => {
        const { data, error } = await admin.auth.admin.getUserById(userId);
        if (!error && data.user) userById.set(userId, data.user);
      })
    );

    function userIdentity(userId: string) {
      const user = userById.get(userId);
      const profileName = profileById.get(userId)?.trim();
      const metadataName =
        typeof user?.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name.trim()
          : typeof user?.user_metadata?.name === 'string'
            ? user.user_metadata.name.trim()
            : '';
      const email = user?.email?.trim() || '';
      const fallback = email ? email.split('@')[0] : 'Usuario';
      return {
        name: profileName || metadataName || fallback,
        email: email || 'Sin email',
      };
    }

    function materialName(materialId: string | null | undefined) {
      if (!materialId) return null;
      const row = materialById.get(materialId);
      return row?.title?.trim() || row?.file_name?.trim() || null;
    }

    function materiaName(materiaId: string | null | undefined) {
      return materiaId ? materiaById.get(materiaId) ?? null : null;
    }

    const history: AdminMailRow[] = [];

    for (const row of examRows) {
      const eventMs = dateToMillis(row.sent_at ?? row.created_at);
      if (eventMs < cutoffMs || !statusIsHistory(row.status)) continue;
      const user = userIdentity(row.user_id);
      const subject =
        materiaName(row.materia_id) || materialName(row.material_id) || 'tu materia';
      history.push({
        id: `exam:${row.id}`,
        sentAt: row.sent_at ?? row.created_at,
        kind: 'exam',
        label: 'Recordatorio',
        userName: user.name,
        userEmail: user.email,
        detail: `Examen de ${subject} en ${row.reminder_days} día${row.reminder_days === 1 ? '' : 's'}`,
        status: row.status,
      });
    }

    for (const row of readyRows) {
      const eventMs = dateToMillis(row.sent_at ?? row.created_at);
      if (eventMs < cutoffMs || !statusIsHistory(row.status)) continue;
      const user = userIdentity(row.user_id);
      const title = materialName(row.material_id) || 'material';
      history.push({
        id: `ready:${row.id}`,
        sentAt: row.sent_at ?? row.created_at,
        kind: 'ready',
        label: 'Material listo',
        userName: user.name,
        userEmail: user.email,
        detail: `Material “${title}” listo para estudiar`,
        status: row.status,
      });
    }

    for (const row of flashRows) {
      const eventMs = dateToMillis(row.sent_at ?? row.created_at);
      if (eventMs < cutoffMs || !statusIsHistory(row.status)) continue;
      const user = userIdentity(row.user_id);
      const title = materialName(row.material_id) || 'tu material';
      history.push({
        id: `flashcard:${row.id}`,
        sentAt: row.sent_at ?? row.created_at,
        kind: 'flashcard',
        label: 'Recordatorio',
        userName: user.name,
        userEmail: user.email,
        detail: `${row.unknown_count} tarjeta${row.unknown_count === 1 ? '' : 's'} para reforzar · ${title}`,
        status: row.status,
      });
    }

    for (const row of campaignRows) {
      const effectiveAt = row.sent_at ?? row.triggered_at ?? row.created_at;
      const eventMs = dateToMillis(effectiveAt);
      if (eventMs < cutoffMs || !statusIsHistory(row.status)) continue;
      const user = userIdentity(row.user_id);
      const contextSubject =
        contextText(row.context, 'materia') ||
        contextText(row.context, 'subject') ||
        contextText(row.context, 'material_title');
      const subject = contextSubject || materiaName(row.materia_id);
      history.push({
        id: `campaign:${row.id}`,
        sentAt: effectiveAt,
        kind: 'campaign',
        label: 'Campaña',
        userName: user.name,
        userEmail: user.email,
        detail: subject ? `Campaña · ${subject}` : `Campaña · ${row.campaign_key}`,
        status: row.status,
      });
    }

    for (const row of studyReturnRows) {
      const eventMs = dateToMillis(row.sent_at ?? row.created_at);
      if (eventMs < cutoffMs || !statusIsHistory(row.status)) continue;
      const user = userIdentity(row.user_id);
      const title = materialName(row.material_id) || 'tu material';
      history.push({
        id: `study-return:${row.id}`,
        sentAt: row.sent_at ?? row.created_at,
        kind: 'study_return',
        label: 'Campaña',
        userName: user.name,
        userEmail: user.email,
        detail:
          row.pending_count > 0
            ? `Volver a “${title}” · ${row.pending_count} concepto${row.pending_count === 1 ? '' : 's'} pendiente${row.pending_count === 1 ? '' : 's'}`
            : `Volver a estudiar “${title}”`,
        status: row.status,
      });
    }

    history.sort((a, b) => dateToMillis(b.sentAt) - dateToMillis(a.sentAt));

    const filteredRows = history.filter((row) => {
      if (activeType === 'all') return true;
      if (activeType === 'exam') return row.kind === 'exam';
      if (activeType === 'ready') return row.kind === 'ready';
      return row.kind === 'campaign' || row.kind === 'study_return';
    });

    const examDispatchAt = new Date(`${today}T12:00:00.000Z`).toISOString();
    const upcoming: AdminUpcomingMailRow[] = [];

    for (const candidate of candidates.values()) {
      const user = userIdentity(candidate.userId);
      const subject =
        materiaName(candidate.materiaId) ||
        materialName(candidate.materialId) ||
        candidate.materiaFallback;
      upcoming.push({
        id: candidate.id,
        scheduledFor: examDispatchAt,
        kind: 'exam',
        label: 'Recordatorio',
        userName: user.name,
        userEmail: user.email,
        detail: `Examen de ${subject} en ${candidate.days} día${candidate.days === 1 ? '' : 's'}`,
      });
    }

    for (const row of futureFlash) {
      const user = userIdentity(row.user_id);
      const title = materialName(row.material_id) || 'tu material';
      upcoming.push({
        id: `flashcard-upcoming:${row.id}`,
        scheduledFor: row.scheduled_for,
        kind: 'flashcard',
        label: 'Recordatorio',
        userName: user.name,
        userEmail: user.email,
        detail: `${row.unknown_count} tarjeta${row.unknown_count === 1 ? '' : 's'} para reforzar · ${title}`,
      });
    }

    upcoming.sort(
      (a, b) => dateToMillis(a.scheduledFor) - dateToMillis(b.scheduledFor)
    );

    return {
      success: true,
      data: {
        rows: filteredRows.slice(0, 250),
        upcoming: upcoming.slice(0, 100),
        generatedAt: now.toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos cargar el historial de mails.',
    };
  }
}
