import { createAdminClient } from '@/lib/supabase-admin';
import type { Json } from '@/types/supabase';

export async function trackServerAnalyticsEvent(input: {
  eventName: string;
  userId: string;
  path?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    await admin.from('analytics_events').insert({
      event_name: input.eventName,
      user_id: input.userId,
      session_key: `server:${input.userId}`,
      path: input.path ?? null,
      device_type: 'server',
      metadata: (input.metadata ?? {}) as Json,
    });
  } catch {
    // tracking es best-effort
  }
}
