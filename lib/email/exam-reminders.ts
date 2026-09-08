import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { logError, logInfo } from '@/lib/observability';
import { getStudentMaterialRoute } from '@/lib/routes';
import { sendSenderTemplate } from '@/lib/email/sender';

const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const REMINDER_DAYS = [7, 3, 1] as const;

type ReminderDays = (typeof REMINDER_DAYS)[number];

type MaterialRow = {
  id: string;
  user_id: string;
  materia_id: string;
  title: string;
  exam_date: string;
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

function getTemplateId(days: ReminderDays) {
  const envName =
    days === 7
      ? 'SENDER_TEMPLATE_EXAM_7D'
      : days === 3
        ? 'SENDER_TEMPLATE_EXAM_3D'
        : 'SENDER_TEMPLATE_EXAM_1D';

  return process.env[envName]?.trim() || null;
}

function getReminderSubject(days: ReminderDays, materia: string) {
  if (days === 7) return `Tu examen de ${materia} es en una semana`;
  if (days === 3) return `Te quedan 3 días para tu examen de ${materia}`;
  return `Mañana rendís ${materia}`;
}

function buildMaterialUrl(materialId: string, days: ReminderDays) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://evaluo.com.ar').replace(/\/$/, '');
  const url = new URL(getStudentMaterialRoute(materialId), baseUrl);
  url.searchParams.set('utm_source', 'sender');
  url.searchParams.set('utm_medium', 'email');
  url.searchParams.set('utm_campaign', `exam_reminder_${days}d`);
  url.searchParams.set('utm_content', 'continue_studying');
  return url.toString();
}

function firstName(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return 'estudiante';
  return normalized.split(/\s+/)[0] || 'estudiante';
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
  // Esta tabla todavía no forma parte del tipo generado de Supabase.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data: rawMaterials, error: materialsError } = await db
    .from('student_materials')
    .select('id,user_id,materia_id,title,exam_date,created_at')
    .in('exam_date', [...targetDates.keys()])
    .eq('processing_status', 'ready')
    .order('created_at', { ascending: false });

  if (materialsError) throw materialsError;

  const latestByExam = new Map<string, MaterialRow>();
  for (const row of (rawMaterials ?? []) as MaterialRow[]) {
    if (!row.exam_date || !targetDates.has(row.exam_date)) continue;
    const key = `${row.user_id}:${row.materia_id}:${row.exam_date}`;
    if (!latestByExam.has(key)) latestByExam.set(key, row);
  }

  const materials = [...latestByExam.values()];
  const materiaIds = [...new Set(materials.map((material) => material.materia_id))];
  const userIds = [...new Set(materials.map((material) => material.user_id))];

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

  const userById = new Map<string, Awaited<ReturnType<typeof admin.auth.admin.getUserById>>['data']['user']>();
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
    candidates: materials.length,
    sent: 0,
    duplicates: 0,
    missingTemplate: 0,
    missingEmail: 0,
    failed: 0,
  };

  for (const material of materials) {
    const days = targetDates.get(material.exam_date);
    if (!days) continue;

    const templateId = getTemplateId(days);
    if (!templateId) {
      summary.missingTemplate += 1;
      continue;
    }

    const user = userById.get(material.user_id);
    if (!user?.email || !user.email_confirmed_at) {
      summary.missingEmail += 1;
      continue;
    }

    if (dryRun) continue;

    const { data: reservation, error: reservationError } = await db
      .from('email_reminder_deliveries')
      .insert({
        user_id: material.user_id,
        materia_id: material.materia_id,
        material_id: material.id,
        exam_date: material.exam_date,
        reminder_days: days,
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
      const profileName = profileNameById.get(material.user_id);
      const fallbackName =
        typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : typeof user.user_metadata?.name === 'string'
            ? user.user_metadata.name
            : null;
      const displayName = profileName || fallbackName;
      const displayFirstName = firstName(displayName);
      const materia = materiaNameById.get(material.materia_id) || 'tu materia';
      const formattedExamDate = formatExamDate(material.exam_date);
      const materialUrl = buildMaterialUrl(material.id, days);
      const subject = getReminderSubject(days, materia);

      const senderResult = await sendSenderTemplate({
        templateId,
        toEmail: user.email,
        toName: displayName,
        variables: {
          subject,
          firstname: displayFirstName,
          nombre: displayFirstName,
          materia,
          exam_date: formattedExamDate,
          fecha_del_examen: formattedExamDate,
          exam_date_iso: material.exam_date,
          days_left: days,
          material_title: material.title,
          titulo_del_material: material.title,
          material_url: materialUrl,
        },
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
          reminderDays: days,
        });
      }

      summary.sent += 1;
    } catch (error) {
      summary.failed += 1;
      logError('examReminders.send', error, {
        materialId: material.id,
        materiaId: material.materia_id,
        reminderDays: days,
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

  logInfo('examReminders.dispatch', summary);
  return summary;
}
