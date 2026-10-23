import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { logError, logInfo } from '@/lib/observability';
import { getDashboardMateriaRoute, getStudentMaterialRoute } from '@/lib/routes';
import { sendSenderTransactional } from '@/lib/email/sender';
import { buildEvaluoEmailHtml, escapeEmailHtml } from '@/lib/email/evaluo-email';

const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const REMINDER_DAYS = [7, 3, 1] as const;

type ReminderDays = (typeof REMINDER_DAYS)[number];
type ReminderSource = 'material' | 'calendar';

type MaterialRow = {
  id: string;
  user_id: string;
  materia_id: string | null;
  title: string;
  exam_date: string;
  created_at: string;
};

type CalendarEventRow = {
  id: string;
  user_id: string;
  material_id: string | null;
  event_date: string;
  materia_id: string | null;
  materia_nombre: string | null;
  title: string;
  created_at: string;
};

type MateriaRow = {
  id: string;
  nombre: string;
};

type ProfileRow = {
  id: string;
  nombre: string | null;
};

type ReminderCandidate = {
  sourceType: ReminderSource;
  userId: string;
  materiaId: string | null;
  materiaFallback: string | null;
  subjectKey: string;
  examDate: string;
  days: ReminderDays;
  materialId: string | null;
  materialTitle: string | null;
  calendarEventId: string | null;
  calendarTitle: string | null;
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
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));
  return date.toISOString().slice(0, 10);
}

function formatExamDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function getReminderSubject(days: ReminderDays, materia: string) {
  if (days === 7) return `Tu examen de ${materia} es en una semana`;
  if (days === 3) return `Te quedan 3 días para tu examen de ${materia}`;
  return `Mañana rendís ${materia}`;
}

function buildExamReminderMessage(input: {
  firstname: string;
  materia: string;
  examDate: string;
  days: ReminderDays;
  materialTitle: string;
  destinationUrl: string;
  hasMaterial: boolean;
  pendingTopics: string[];
}) {
  const subject = getReminderSubject(input.days, input.materia);
  const heading =
    input.days === 7
      ? 'Tu examen es en una semana'
      : input.days === 3
        ? 'Te quedan 3 días'
        : 'Mañana rendís';

  const topics = [...new Set(input.pendingTopics.map((topic) => topic.trim()).filter(Boolean))].slice(0, 3);
  const guidance = input.days === 7
    ? 'Todavía tenés tiempo para organizar el repaso y practicar los temas que te cuestan.'
    : input.days === 3
      ? 'Enfocate en los temas que te costaron y comprobá qué entendiste con una nueva práctica.'
      : 'Hoy conviene repasar los puntos que te costaron, sin empezar todo de nuevo.';
  const topicsHtml = topics.length
    ? `<p style="margin:14px 0 8px;font-weight:700;color:#0F1B3D;">Según tus respuestas, estos temas necesitan refuerzo:</p><ul style="margin:0;padding-left:20px;">${topics.map((topic) => `<li style="margin:0 0 6px;">${escapeEmailHtml(topic)}</li>`).join('')}</ul>`
    : input.hasMaterial
      ? '<p style="margin:12px 0 0;">Si todavía no practicaste lo suficiente, una tanda de ejercicios puede ayudarte a identificar qué reforzar.</p>'
      : '<p style="margin:12px 0 0;">Entrá a tu espacio y prepará una práctica con tus apuntes.</p>';
  const bodyHtml = `<p style="margin:0 0 12px;">Tu examen de <strong>${escapeEmailHtml(input.materia)}</strong> está programado para <strong>${escapeEmailHtml(input.examDate)}</strong>.</p>
<p style="margin:0 0 12px;">${escapeEmailHtml(guidance)}</p>
${input.hasMaterial ? `<p style="margin:0;">Podés continuar con <strong>${escapeEmailHtml(input.materialTitle)}</strong>.</p>` : ''}
${topicsHtml}`;

  const html = buildEvaluoEmailHtml({
    firstname: input.firstname,
    heading,
    eyebrow: input.materia,
    bodyHtml,
    ctaLabel: topics.length ? 'Repasar mis temas pendientes' : input.hasMaterial ? 'Practicar con mi PDF' : 'Ir a mi espacio',
    ctaUrl: input.destinationUrl,
    reason: 'Te enviamos este recordatorio porque registraste esta fecha de examen en Evaluo.',
  });

  const text = `Hola ${input.firstname}. ${subject}. Tu examen es el ${input.examDate}. Continuá estudiando: ${input.destinationUrl}`;
  return { subject, html, text };
}

function buildTrackedUrl(path: string, days: ReminderDays, content: string) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://evaluo.com.ar').replace(/\/$/, '');
  const url = new URL(path, baseUrl);
  url.searchParams.set('utm_source', 'sender');
  url.searchParams.set('utm_medium', 'email');
  url.searchParams.set('utm_campaign', `exam_reminder_${days}d`);
  url.searchParams.set('utm_content', content);
  return url.toString();
}

function buildMaterialUrl(materialId: string, days: ReminderDays, hasPending: boolean) {
  return buildTrackedUrl(`${getStudentMaterialRoute(materialId)}?tab=${hasPending ? 'progreso' : 'ejercicios'}`, days, hasPending ? 'topic_review' : 'start_practice');
}

function buildMateriaWorkspaceUrl(materiaId: string, days: ReminderDays) {
  return buildTrackedUrl(getDashboardMateriaRoute(materiaId), days, 'subject_space');
}

function buildMySpaceUrl(days: ReminderDays) {
  return buildTrackedUrl('/dashboard', days, 'my_space');
}

function firstName(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return 'estudiante';
  return normalized.split(/\s+/)[0] || 'estudiante';
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
  const normalizedName = normalizeSubjectName(materiaName);
  return normalizedName ? `nombre:${normalizedName}` : 'nombre:sin-materia';
}

function buildCandidateKey(candidate: Pick<ReminderCandidate, 'userId' | 'subjectKey' | 'examDate' | 'days'>) {
  return `${candidate.userId}:${candidate.subjectKey}:${candidate.examDate}:${candidate.days}`;
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
  );
}

export async function runExamReminderDispatch(options?: { dryRun?: boolean }) {
  const dryRun = Boolean(options?.dryRun);
  const today = getDateKeyInTimeZone(new Date(), ARGENTINA_TIME_ZONE);
  const targetDates = new Map<string, ReminderDays>(
    REMINDER_DAYS.map((days) => [addDays(today, days), days])
  );

  const admin = createAdminClient();
  // Estas tablas todavía no forman parte del tipo generado de Supabase.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const [materialsResult, calendarResult] = await Promise.all([
    db
      .from('student_materials')
      .select('id,user_id,materia_id,title,exam_date,created_at')
      .in('exam_date', [...targetDates.keys()])
      .order('created_at', { ascending: false }),
    db
      .from('study_calendar_events')
      .select(
        'id,user_id,material_id,event_date,materia_id,materia_nombre,title,created_at'
      )
      .eq('event_type', 'exam')
      .in('event_date', [...targetDates.keys()])
      .order('created_at', { ascending: false }),
  ]);

  if (materialsResult.error) throw materialsResult.error;
  if (calendarResult.error) throw calendarResult.error;

  const candidatesByKey = new Map<string, ReminderCandidate>();

  for (const row of (materialsResult.data ?? []) as MaterialRow[]) {
    const days = targetDates.get(row.exam_date);
    if (!days) continue;

    const candidate: ReminderCandidate = {
      sourceType: 'material',
      userId: row.user_id,
      materiaId: row.materia_id,
      materiaFallback: row.title,
      subjectKey: buildSubjectKey(row.materia_id, row.title),
      examDate: row.exam_date,
      days,
      materialId: row.id,
      materialTitle: row.title,
      calendarEventId: null,
      calendarTitle: null,
    };

    const key = buildCandidateKey(candidate);
    if (!candidatesByKey.has(key)) candidatesByKey.set(key, candidate);
  }

  for (const row of (calendarResult.data ?? []) as CalendarEventRow[]) {
    const days = targetDates.get(row.event_date);
    if (!days) continue;

    const materiaFallback = row.materia_nombre?.trim() || row.title.trim() || 'tu materia';
    const candidate: ReminderCandidate = {
      sourceType: 'calendar',
      userId: row.user_id,
      materiaId: row.materia_id,
      materiaFallback,
      subjectKey: buildSubjectKey(row.materia_id, materiaFallback),
      examDate: row.event_date,
      days,
      materialId: row.material_id,
      materialTitle: null,
      calendarEventId: row.id,
      calendarTitle: row.title,
    };

    const key = buildCandidateKey(candidate);
    // Si la misma materia/fecha ya viene de un PDF, priorizamos el PDF y evitamos doble mail.
    if (!candidatesByKey.has(key)) candidatesByKey.set(key, candidate);
  }

  const candidates = [...candidatesByKey.values()];
  const materiaIds = [
    ...new Set(candidates.map((candidate) => candidate.materiaId).filter(Boolean) as string[]),
  ];
  const userIds = [...new Set(candidates.map((candidate) => candidate.userId))];

  const [materiasResult, profilesResult] = await Promise.all([
    materiaIds.length
      ? db.from('materias').select('id,nombre').in('id', materiaIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? db.from('profiles').select('id,nombre').in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (materiasResult.error) throw materiasResult.error;
  if (profilesResult.error) throw profilesResult.error;

  const materiaNameById = new Map(
    ((materiasResult.data ?? []) as MateriaRow[]).map((materia) => [materia.id, materia.nombre])
  );
  const profileNameById = new Map(
    ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => [profile.id, profile.nombre])
  );

  const linkedMaterialIds = [...new Set(candidates.map((candidate) => candidate.materialId).filter((id): id is string => Boolean(id)))];
  const errorsResult = linkedMaterialIds.length
    ? await db.from('study_errors').select('user_id,student_material_id,topic')
        .eq('status', 'pending').in('student_material_id', linkedMaterialIds).limit(2000)
    : { data: [], error: null };
  if (errorsResult.error) throw errorsResult.error;
  const pendingTopics = new Map<string, Set<string>>();
  for (const row of (errorsResult.data ?? []) as Array<{ user_id: string; student_material_id: string | null; topic: string | null }>) {
    const topic = row.topic?.trim();
    if (!topic || !row.student_material_id) continue;
    const key = `${row.user_id}:${row.student_material_id}`;
    const topics = pendingTopics.get(key) ?? new Set<string>();
    topics.add(topic);
    pendingTopics.set(key, topics);
  }

  const userById = new Map<
    string,
    Awaited<ReturnType<typeof admin.auth.admin.getUserById>>['data']['user']
  >();
  await Promise.all(
    userIds.map(async (userId) => {
      const { data, error } = await admin.auth.admin.getUserById(userId);
      if (error) {
        logError('examReminders.getUser', error, { userId });
        return;
      }
      userById.set(userId, data.user);
    })
  );

  const summary = {
    success: true,
    dryRun,
    today,
    candidates: candidates.length,
    materialCandidates: candidates.filter((candidate) => candidate.sourceType === 'material').length,
    calendarCandidates: candidates.filter((candidate) => candidate.sourceType === 'calendar').length,
    sent: 0,
    duplicates: 0,
    missingEmail: 0,
    failed: 0,
  };

  for (const candidate of candidates) {
    const user = userById.get(candidate.userId);
    if (!user?.email || !user.email_confirmed_at) {
      summary.missingEmail += 1;
      continue;
    }

    if (dryRun) continue;

    const { data: reservation, error: reservationError } = await db
      .from('email_reminder_deliveries')
      .insert({
        user_id: candidate.userId,
        materia_id: candidate.materiaId,
        material_id: candidate.materialId,
        calendar_event_id: candidate.calendarEventId,
        source_type: candidate.sourceType,
        subject_key: candidate.subjectKey,
        exam_date: candidate.examDate,
        reminder_days: candidate.days,
        status: 'sending',
      })
      .select('id')
      .single();

    if (reservationError) {
      if (isUniqueViolation(reservationError)) {
        summary.duplicates += 1;
        continue;
      }
      throw reservationError;
    }

    try {
      const profileName = profileNameById.get(candidate.userId);
      const fallbackName =
        typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : typeof user.user_metadata?.name === 'string'
            ? user.user_metadata.name
            : null;
      const displayName = profileName || fallbackName;
      const displayFirstName = firstName(displayName);
      const materia =
        (candidate.materiaId ? materiaNameById.get(candidate.materiaId) : null) ||
        candidate.materiaFallback ||
        'tu materia';
      const formattedExamDate = formatExamDate(candidate.examDate);
      const topics = candidate.materialId
        ? [...(pendingTopics.get(`${candidate.userId}:${candidate.materialId}`) ?? [])].slice(0, 3)
        : [];
      const materialUrl = candidate.materialId
        ? buildMaterialUrl(candidate.materialId, candidate.days, topics.length > 0)
        : null;
      const materiaUrl =
        !materialUrl && candidate.materiaId
          ? buildMateriaWorkspaceUrl(candidate.materiaId, candidate.days)
          : null;
      const mySpaceUrl = buildMySpaceUrl(candidate.days);
      const destinationUrl = materialUrl ?? materiaUrl ?? mySpaceUrl;
      const displayTitle = candidate.materialTitle || candidate.calendarTitle || materia;
      const message = buildExamReminderMessage({
        firstname: displayFirstName,
        materia,
        examDate: formattedExamDate,
        days: candidate.days,
        materialTitle: displayTitle,
        destinationUrl,
        hasMaterial: Boolean(candidate.materialId),
        pendingTopics: topics,
      });

      const senderResult = await sendSenderTransactional({
        toEmail: user.email,
        toName: displayName,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      const { error: markSentError } = await db
        .from('email_reminder_deliveries')
        .update({
          status: 'sent',
          sender_email_id: senderResult.emailId,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservation.id);

      if (markSentError) {
        logError('examReminders.markSent', markSentError, {
          deliveryId: reservation.id,
          reminderDays: candidate.days,
          sourceType: candidate.sourceType,
        });
      }

      summary.sent += 1;
    } catch (error) {
      summary.failed += 1;
      logError('examReminders.send', error, {
        materialId: candidate.materialId,
        calendarEventId: candidate.calendarEventId,
        materiaId: candidate.materiaId,
        reminderDays: candidate.days,
        sourceType: candidate.sourceType,
      });

      const { error: cleanupError } = await db
        .from('email_reminder_deliveries')
        .delete()
        .eq('id', reservation.id);
      if (cleanupError) {
        logError('examReminders.cleanupReservation', cleanupError, {
          deliveryId: reservation.id,
        });
      }
    }
  }

  const { error: heartbeatError } = await db.from('analytics_events').insert({
    event_name: 'exam_reminder_dispatch',
    session_key: 'server:exam-reminders',
    path: '/api/internal/exam-reminders',
    metadata: summary,
  });

  if (heartbeatError) {
    logError('examReminders.heartbeat', heartbeatError, {
      dryRun,
      candidates: summary.candidates,
      sent: summary.sent,
    });
  }

  logInfo('examReminders.dispatch', summary);
  return summary;
}
