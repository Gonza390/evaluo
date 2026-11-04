import 'server-only';

import { FREE_STUDY_V2, isFreeStudyV2Active } from '@/lib/free-study-v2';
import { hasPremiumAccess } from '@/lib/premium';
import { createAdminClient } from '@/lib/supabase-admin';

export type FreeStudyUnlockKind =
  | 'multiple_choice' | 'true_false' | 'matching_round' | 'case'
  | 'flashcard' | 'simulator';

export const FREE_STUDY_KIND_LIMIT: Record<FreeStudyUnlockKind, number> = {
  multiple_choice: FREE_STUDY_V2.multipleChoice,
  true_false: FREE_STUDY_V2.trueFalse,
  matching_round: FREE_STUDY_V2.matchingRounds,
  case: FREE_STUDY_V2.cases,
  flashcard: FREE_STUDY_V2.flashcards,
  simulator: FREE_STUDY_V2.simulatorSessions,
};

export type FreeStudyUnlockResult = {
  allowed: boolean;
  used: number;
  limit: number | null;
  alreadyUnlocked: boolean;
};

type RpcResult = {
  allowed: boolean;
  used_count: number;
  limit_count: number;
  already_unlocked: boolean;
};

/**
 * Atomic, idempotent, server-only claim. Never call from a client with an
 * unverified key: the caller must validate the canonical item first.
 * Fail CLOSED on database errors so users never get uncapped new generations.
 */
export async function claimFreeStudyUnlock(input: {
  userId: string;
  materialId: string;
  kind: FreeStudyUnlockKind;
  itemKey: string;
  premium?: boolean;
}): Promise<FreeStudyUnlockResult> {
  const premium = input.premium ?? await hasPremiumAccess(input.userId);
  if (!isFreeStudyV2Active() || premium) {
    return { allowed: true, used: 0, limit: null, alreadyUnlocked: false };
  }
  if (!input.itemKey || input.itemKey.length > 300) throw new Error('invalid_free_study_key');
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('claim_free_study_v2_unlock' as never, {
    p_user_id: input.userId,
    p_material_id: input.materialId,
    p_kind: input.kind,
    p_item_key: input.itemKey,
  } as never);
  if (error) throw error;
  const record = (Array.isArray(data) ? data[0] : null) as RpcResult | null;
  if (!record || typeof record.allowed !== 'boolean' ||
      !Number.isInteger(record.used_count) || !Number.isInteger(record.limit_count)) {
    throw new Error('invalid_free_study_claim_response');
  }
  return {
    allowed: record.allowed,
    used: record.used_count,
    limit: record.limit_count,
    alreadyUnlocked: record.already_unlocked,
  };
}

/** Only for server-side rendering; never expose the complete locked bank. */
export async function listFreeStudyUnlockedKeys(input: {
  userId: string;
  kind: FreeStudyUnlockKind;
  premium?: boolean;
}): Promise<Set<string> | null> {
  const premium = input.premium ?? await hasPremiumAccess(input.userId);
  if (!isFreeStudyV2Active() || premium) return null;
  const { data, error } = await createAdminClient()
    .from('free_study_v2_unlocks' as never)
    .select('item_key')
    .eq('user_id', input.userId)
    .eq('kind', input.kind)
    .limit(FREE_STUDY_KIND_LIMIT[input.kind]);
  if (error) throw error;
  return new Set((data ?? []).map((entry) => (entry as {item_key: string}).item_key));
}

export type FreeStudyBankMode = 'true_false' | 'cases' | 'matching' | 'flashcards';

/** First validated bank wins, even when concurrent requests finish in a different order. */
export async function getFreeStudyBank<T>(input: {
  userId: string; materialId: string; mode: FreeStudyBankMode;
}): Promise<T[] | null> {
  const { data, error } = await createAdminClient()
    .from('free_study_v2_banks' as never)
    .select('payload')
    .eq('user_id', input.userId)
    .eq('material_id', input.materialId)
    .eq('mode', input.mode)
    .maybeSingle();
  if (error) throw error;
  const bank = (data as { payload?: unknown } | null)?.payload;
  return Array.isArray(bank) ? bank as T[] : null;
}

export async function saveFirstFreeStudyBank<T>(input: {
  userId: string; materialId: string; mode: FreeStudyBankMode; items: T[];
}): Promise<T[]> {
  if (!input.items.length) throw new Error('empty_free_study_bank');
  const admin = createAdminClient();
  const { error } = await admin
    .from('free_study_v2_banks' as never)
    .upsert({
      user_id: input.userId, material_id: input.materialId,
      mode: input.mode, payload: input.items,
    } as never, { onConflict: 'user_id,material_id,mode', ignoreDuplicates: true });
  if (error) throw error;
  const stored = await getFreeStudyBank<T>(input);
  if (!stored) throw new Error('free_study_bank_unavailable');
  return stored;
}

/**
 * For server-owned, source-verified AI banks. Unlock at most the account's
 * remaining distinct items, not 10/2 new exercises for every old Premium file.
 * An existing key remains repeatable at no additional cost.
 */
export async function claimVerifiedFreeStudySample<T extends { id: string }>(input: {
  userId: string;
  materialId: string;
  kind: 'true_false' | 'case';
  items: T[];
}): Promise<T[]> {
  const result: T[] = [];
  const limit = FREE_STUDY_KIND_LIMIT[input.kind];
  for (const item of input.items.slice(0, limit)) {
    if (!item || typeof item.id !== 'string' || !item.id.trim() ||
        item.id.length > 200) continue;
    const unlock = await claimFreeStudyUnlock({
      userId: input.userId, materialId: input.materialId,
      kind: input.kind, itemKey: input.materialId + ':' + item.id,
      premium: false,
    });
    if (unlock.allowed) result.push(item);
  }
  return result;
}

/** La primera carga lista sigue consumida aunque se elimine su material. */
export async function hasFreeStudyV2UploadClaim(userId: string): Promise<boolean> {
  if (!isFreeStudyV2Active()) return false;
  const { data, error } = await createAdminClient()
    .from('free_study_v2_upload_claims' as never)
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}
