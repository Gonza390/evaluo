import { NextResponse } from 'next/server';
import { getAdminAccessContext } from '@/lib/access-control';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendSenderTemplate } from '@/lib/email/sender';
import { getStudentMaterialRoute } from '@/lib/routes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function firstName(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) return 'estudiante';
  return normalized.split(/\s+/)[0] || 'estudiante';
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

function sevenDaysFromNowIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7, 12))
    .toISOString()
    .slice(0, 10);
}

async function handle(request: Request) {
  const access = await getAdminAccessContext();
  if (!access.ok) {
    const status = access.reason === 'forbidden' ? 403 : 401;
    return NextResponse.json({ success: false, message: access.message }, { status });
  }

  const url = new URL(request.url);
  if (url.searchParams.get('confirm') !== 'sender-7d') {
    return NextResponse.json(
      {
        success: false,
        message: 'Prueba no confirmada. Agregá ?confirm=sender-7d para enviar el mail a tu propia cuenta admin.',
      },
      { status: 400 }
    );
  }

  const templateId = process.env.SENDER_TEMPLATE_EXAM_7D?.trim();
  if (!templateId) {
    return NextResponse.json(
      { success: false, message: 'Falta SENDER_TEMPLATE_EXAM_7D en el entorno.' },
      { status: 500 }
    );
  }

  if (!access.user.email) {
    return NextResponse.json(
      { success: false, message: 'La cuenta admin autenticada no tiene email.' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const [{ data: profile }, { data: material }] = await Promise.all([
    admin.from('profiles').select('nombre').eq('id', access.user.id).maybeSingle(),
    admin
      .from('student_materials')
      .select('id,title,materia_id,exam_date')
      .eq('user_id', access.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let materia = 'Administración';
  if (material?.materia_id) {
    const { data: materiaRow } = await admin
      .from('materias')
      .select('nombre')
      .eq('id', material.materia_id)
      .maybeSingle();
    if (materiaRow?.nombre) materia = materiaRow.nombre;
  }

  const metadataName =
    typeof access.user.user_metadata?.full_name === 'string'
      ? access.user.user_metadata.full_name
      : typeof access.user.user_metadata?.name === 'string'
        ? access.user.user_metadata.name
        : null;
  const displayName = profile?.nombre || metadataName;
  const firstname = firstName(displayName);
  const examDateIso = material?.exam_date || sevenDaysFromNowIso();
  const examDate = formatExamDate(examDateIso);
  const materialTitle = material?.title || 'Material de prueba';
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://evaluo.com.ar').replace(/\/$/, '');
  const materialUrl = new URL(
    material?.id ? getStudentMaterialRoute(material.id) : '/dashboard/materiales',
    baseUrl
  );
  materialUrl.searchParams.set('utm_source', 'sender');
  materialUrl.searchParams.set('utm_medium', 'email');
  materialUrl.searchParams.set('utm_campaign', 'exam_reminder_7d_test');
  materialUrl.searchParams.set('utm_content', 'continue_studying');

  const result = await sendSenderTemplate({
    templateId,
    toEmail: access.user.email,
    toName: displayName,
    variables: {
      firstname,
      nombre: firstname,
      materia,
      exam_date: examDate,
      fecha_del_examen: examDate,
      exam_date_iso: examDateIso,
      days_left: 7,
      material_title: materialTitle,
      titulo_del_material: materialTitle,
      material_url: materialUrl.toString(),
      subject: `Tu examen de ${materia} es en una semana`,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Mail de prueba enviado a tu propia cuenta admin.',
    emailId: result.emailId,
    templateId,
    variables: {
      firstname,
      materia,
      exam_date: examDate,
      material_title: materialTitle,
      material_url: materialUrl.toString(),
    },
  });
}

export async function GET(request: Request) {
  return handle(request);
}
