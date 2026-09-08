import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendSenderTemplate } from '@/lib/email/sender';
import { isInternalQueueRequestAuthorized } from '@/lib/student-materials/job-auth';
import { logError, logInfo } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TEST_DATE_UTC = '2026-09-08';
const TEST_PURPOSE = 'sender_template_test';

function getTodayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function firstName(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized?.split(/\s+/)[0] || 'Gonzalo';
}

async function consumeOneTimeAuthorization(request: Request, admin: ReturnType<typeof createAdminClient>) {
  // Esta tabla es deliberadamente temporal y no forma parte del tipo generado.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const now = new Date().toISOString();
  const internalRequest = isInternalQueueRequestAuthorized(request);

  let tokenQuery = db
    .from('internal_one_time_tokens')
    .select('id')
    .eq('purpose', TEST_PURPOSE)
    .gt('expires_at', now)
    .is('used_at', null)
    .order('created_at', { ascending: true })
    .limit(1);

  if (!internalRequest) {
    const provided = new URL(request.url).searchParams.get('token')?.trim();
    if (!provided) return null;

    const tokenHash = createHash('sha256').update(provided).digest('hex');
    tokenQuery = tokenQuery.eq('token_hash', tokenHash);
  }

  const { data: tokenRow, error: tokenError } = await tokenQuery.maybeSingle();
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

async function verifySenderAuthentication() {
  const token = process.env.SENDER_API_TOKEN?.trim();
  if (!token) {
    throw new Error('Falta SENDER_API_TOKEN.');
  }

  const response = await fetch('https://api.sender.net/v2/subscribers?limit=1', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(12_000),
  });

  const raw = await response.text();
  let message: string | null = null;

  try {
    const parsed = raw ? (JSON.parse(raw) as { message?: string }) : {};
    message = parsed.message ?? null;
  } catch {
    message = null;
  }

  if (!response.ok) {
    throw new Error(`Sender auth check HTTP ${response.status}${message ? `: ${message}` : ''}`);
  }

  return response.status;
}

async function handle(request: Request) {
  if (getTodayUtc() !== TEST_DATE_UTC) {
    return NextResponse.json({ success: true, skipped: true, reason: 'outside_test_date' });
  }

  const templateId = process.env.SENDER_TEMPLATE_EXAM_7D?.trim();
  if (!templateId) {
    return NextResponse.json(
      { success: false, message: 'Falta SENDER_TEMPLATE_EXAM_7D.' },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  let consumedTokenId: string | null = null;

  try {
    consumedTokenId = await consumeOneTimeAuthorization(request, admin);
    if (!consumedTokenId) {
      return NextResponse.json({ success: false, message: 'Unauthorized or already used.' }, { status: 401 });
    }

    const senderAuthStatus = await verifySenderAuthentication();

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id,nombre')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      throw new Error('No hay usuario admin para la prueba.');
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id);
    if (userError) throw userError;
    if (!userData.user?.email) {
      throw new Error('El admin no tiene email.');
    }

    const nombre = firstName(profile.nombre || userData.user.user_metadata?.name || userData.user.user_metadata?.full_name);
    const examDate = '15 de septiembre de 2026';
    const materialTitle = 'Resumen Administración';
    const materialUrl = 'https://evaluo.com.ar';
    const subject = 'Tu examen de Administración es en una semana';

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
        material_title: materialTitle,
        titulo_del_material: materialTitle,
        material_url: materialUrl,
        days_left: 7,
      },
    });

    logInfo('senderTemplate.test', {
      success: true,
      senderAuthStatus,
      templateId,
      emailId: result.emailId,
    });

    return NextResponse.json({ success: true, senderAuthStatus, emailId: result.emailId });
  } catch (error) {
    if (consumedTokenId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = admin as any;
      const { error: resetError } = await db
        .from('internal_one_time_tokens')
        .update({ used_at: null })
        .eq('id', consumedTokenId);
      if (resetError) {
        logError('senderTemplate.test.resetToken', resetError);
      }
    }

    logError('senderTemplate.test', error);
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
