'use server';

import { createClientServer } from '@/lib/supabase-server';
import { logError } from '@/lib/observability';
import { hasPremiumAccess } from '@/lib/premium';

export async function getPremiumStatus(): Promise<{ isPremium: boolean }> {
  try {
    const supabase = await createClientServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { isPremium: false };
    return { isPremium: await hasPremiumAccess(user.id) };
  } catch (error) {
    logError('actions.getPremiumStatus', error);
    return { isPremium: false };
  }
}
