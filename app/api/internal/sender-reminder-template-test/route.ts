import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendSenderTemplate } from '@/lib/email/sender';
import { logError, logInfo } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TEST_PURPOSE = 'sender_multi_template_test';
const TEST_DATE_UTC = '2026-09-08';

function getTodayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function firstName(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized?.split(/\s+/)[0] || 'Gonzalo';
}

async function consumeToken(request: Request, admin: ReturnType<typeof createAdminClient>) {
  const provided = new URL(request.url).searchParams.get('token')?.trim();
  if (!provided) return null;

  const tokenHash = createHash('sha256').update(provided).digest('hex');
  // Temporary test table; deliberately excluded from generated types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const now = new Date().toISOString();

  const { data: tokenRow, error: tokenError } = await db
    .from('internal_one_time_tokens')
    .select('id')
    .eq('purpose', TEST_PURPOSE)
    .eq('token_hash', tokenHash)
    .gt('expires_at', now)
    .is('used_at', null)
    .maybeSingle();

  if (tokenError) throw tokenError;
  if (!tokenRow?.id) return null;

  const { data: consumed, error: consumeError } = await db
    .from('internal_one_time_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenRow.id)
    .is('used_at', null)
    .select('id')
    .maybeSingle();

  if (consumeError) throw consumeError;
  return consumed?.id ?? null;
}

async function handle(request: Request) {
  if (getTodayUtc() !== TEST_DATE_UTC) {
    return NextResponse.json({ success: true, skipped: true, reason: 'outside_test_date' });
  }

  const url = new URL(request.url);
  const admin = createAdminClient();

  try {
    const consumed = await consumeToken(request, admin);
    if (!consumed) {
      return NextResponse.json({ success: false, message: 'Unauthorized or already used.' }, { status: 401 });
    }

    if (url.searchParams.get('mode') === 'diagnose') {
      return NextResponse.json({
        success: true,
        template3d: process.env.SENDER_TEMPLATE_EXAM_3D?.trim() || null,
        template1d: process.env.SENDER_TEMPLATE_EXAM_1D?.trim() || null,
      });
    }

    const days = Number(url.searchParams.get('days'));
    if (days !== 3 && days !== 1) {
      return NextResponse.json({ success: false, message: 'days must be 3 or 1' }, { status: 400 });
    }

    const envName = days === 3 ? 'SENDER_TEMPLATE_EXAM_3D' : 'SENDER_TEMPLATE_EXAM_1D';
    const templateId = process.env[envName]?.trim();
    if (!templateId) {
      return NextResponse.json({ success: false, message: `Falta ${envName}.` }, { status: 500 });
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id,nombre')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) throw new Error('No hay usuario admin para la prueba.');

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id);
    if (userError) throw userError;
    if (!userData.user?.email) throw new Error('El admin no tiene email.');

    const nombre = firstName(
      profile.nombre || userData.user.user_metadata?.name || userData.user.user_metadata?.full_name
    );
    const examDate = '15 de septiembre de 2026';
    const materialTitle = 'Resumen Administración';
    const materialUrl = 'https://evaluo.com.ar';
    const subject =
      days === 3
        ? 'Te quedan 3 días para tu examen de Administración'
        : 'Mañana rendís Administración';

    const result = await sendSenderTemplate({
      templateId,
      toEmail: userData.user.email,
      toName: nombre,
      variables: {
        subject,
        firstname: nombre,
        nombre,
        materia: 'Administración',
        exam_date: examDate,
        fecha_del_examen: examDate,
        exam_date_iso: '2026-09-15',
        days_left: days,
        material_title: materialTitle,
        titulo_del_material: materialTitle,
        material_url: materialUrl,
      },
    });

    logInfo('senderReminderTemplate.test', { success: true, days, templateId, emailId: result.emailId });
    return NextResponse.json({ success: true, days, emailId: result.emailId, templateId });
  } catch (error) {
    logError('senderReminderTemplate.test', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Error desconocido.' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
