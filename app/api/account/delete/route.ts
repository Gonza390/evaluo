import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { cancelMercadoPagoSubscription } from '@/lib/payments/mercadopago';
import { enforceRateLimit, getRequestClientKey, rateLimitHeaders } from '@/lib/rate-limit';

const USER_TABLES = [
  'ai_daily_usage',
  'analytics_events',
  'analytics_events_archive',
  'explanations_history',
  'payment_checkout_attempts',
  'payment_promotion_claims',
  'payment_transactions',
  'question_ratings',
  'rag_explanation_feedback',
  'resource_views',
  'resource_votes',
  'resumen_votes',
  'student_material_ai_usage',
  'student_material_feedback',
  'student_material_flashcard_progress',
  'student_topic_performance',
  'study_calendar_events',
  'university_requests',
  'user_favorites',
  'user_notifications',
  'user_subscriptions',
] as const;

function isAllowedOrigin(request: Request) {
  if (process.env.NODE_ENV !== 'production') return true;

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  const requestOrigin = request.headers.get('origin');
  if (!configuredSiteUrl || !requestOrigin) return false;

  const allowedOrigins = new Set([
    configuredSiteUrl,
    configuredSiteUrl.replace('://', '://www.'),
  ]);
  return allowedOrigins.has(requestOrigin);
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'invalid_origin' }, { status: 403 });
  }

  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const rateLimit = await enforceRateLimit({
    key: `account-delete:${user.id}:${getRequestClientKey(request)}`,
    limit: 2,
    windowMs: 24 * 60 * 60_000,
    failClosed: true,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  let payload: { confirmation?: string } = {};
  try {
    payload = (await request.json()) as { confirmation?: string };
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  if (payload.confirmation?.trim().toUpperCase() !== 'ELIMINAR') {
    return NextResponse.json({ error: 'confirmation_required' }, { status: 400 });
  }

  const admin = createAdminClient() as unknown as SupabaseClient;

  const { data: subscription, error: subscriptionError } = await admin
    .from('user_subscriptions')
    .select('provider_subscription_id')
    .eq('user_id', user.id)
    .eq('payment_provider', 'mercadopago')
    .in('status', ['active', 'approved', 'authorized', 'trialing', 'past_due', 'paused'])
    .not('provider_subscription_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) {
    return NextResponse.json({ error: 'subscription_unavailable' }, { status: 500 });
  }

  if (subscription?.provider_subscription_id) {
    try {
      const canceled = await cancelMercadoPagoSubscription(subscription.provider_subscription_id);
      if (canceled.status.toLowerCase() !== 'canceled') {
        return NextResponse.json({ error: 'subscription_not_canceled' }, { status: 502 });
      }
    } catch {
      return NextResponse.json({ error: 'subscription_provider_error' }, { status: 502 });
    }
  }

  const { data: materials, error: materialsError } = await admin
    .from('student_materials')
    .select('file_path')
    .eq('user_id', user.id);

  if (materialsError) {
    return NextResponse.json({ error: 'materials_unavailable' }, { status: 500 });
  }

  const filePaths = (materials ?? [])
    .map((material) => material.file_path)
    .filter((path): path is string => Boolean(path));

  if (filePaths.length > 0) {
    const { error: storageError } = await admin.storage.from('biblioteca').remove(filePaths);
    if (storageError) {
      return NextResponse.json({ error: 'storage_cleanup_failed' }, { status: 500 });
    }
  }

  const { error: attemptsError } = await admin
    .from('simulator_attempts')
    .delete()
    .eq('user_id', user.id);
  if (attemptsError) {
    return NextResponse.json({ error: 'data_cleanup_failed' }, { status: 500 });
  }

  const { error: materialsDeleteError } = await admin
    .from('student_materials')
    .delete()
    .eq('user_id', user.id);
  if (materialsDeleteError) {
    return NextResponse.json({ error: 'data_cleanup_failed' }, { status: 500 });
  }

  for (const table of USER_TABLES) {
    const { error } = await admin.from(table).delete().eq('user_id', user.id);
    if (error) {
      return NextResponse.json({ error: 'data_cleanup_failed', table }, { status: 500 });
    }
  }

  const { error: questionSetsError } = await admin
    .from('premium_question_sets')
    .update({ created_by: null })
    .eq('created_by', user.id);
  if (questionSetsError) {
    return NextResponse.json({ error: 'data_cleanup_failed' }, { status: 500 });
  }

  const { error: profileError } = await admin.from('profiles').delete().eq('id', user.id);
  if (profileError) {
    return NextResponse.json({ error: 'profile_cleanup_failed' }, { status: 500 });
  }

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id);
  if (authDeleteError) {
    return NextResponse.json({ error: 'auth_delete_failed' }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
