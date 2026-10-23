import 'server-only';

import { createAdminClient } from '@/lib/supabase-admin';
import { logError } from '@/lib/observability';

type Volume = { sent_24h: number; sent_7d: number };

/**
 * Shared delivery budget for non-urgent PDF lifecycle emails.
 * Transactional PDF-ready notices and next-day exam alerts are intentionally exempt.
 * Fail closed if the check cannot run, rather than accidentally spamming students.
 */
export async function canSendPdfStudyNudge(userId: string): Promise<boolean> {
  const db = createAdminClient() as unknown as {
    rpc(name: string, args: Record<string, string>): Promise<{ data: Volume[] | null; error: unknown }>;
  };
  const { data, error } = await db.rpc('get_pdf_lifecycle_email_volume', { p_user_id: userId });
  if (error || !data?.length) {
    logError('pdfEmail.frequencyCheck', error ?? new Error('Empty frequency response'), { userId });
    return false;
  }
  const count24 = Number(data[0].sent_24h ?? 0);
  const count7 = Number(data[0].sent_7d ?? 0);
  return count24 < 1 && count7 < 3;
}
