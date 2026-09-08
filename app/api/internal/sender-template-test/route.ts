import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendSenderTemplate } from '@/lib/email/sender';
import { isInternalQueueRequestAuthorized } from '@/lib/student-materials/job-auth';
import { logError, logInfo } from '@/lib/observability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TEST_DATE_UTC = '2026-09-08';

function getTodayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function firstName(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized?.split(/\s+/)[0] || 'Gonzalo';
}

async function handle(request: Request) {
  if (!isInternalQueueRequestAuthorized(request)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

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

  try {
    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id,nombre')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json({ success: false, message: 'No hay usuario admin para la prueba.' }, { status: 500 });
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id);
    if (userError) throw userError;
    if (!userData.user?.email) {
      return NextResponse.json({ success: false, message: 'El admin no tiene email.' }, { status: 500 });
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
      templateId,
      emailId: result.emailId,
    });

    return NextResponse.json({ success: true, emailId: result.emailId });
  } catch (error) {
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
