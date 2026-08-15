import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export type AppSupabaseClient = SupabaseClient<Database>;

export type ResourceVoteSummary = {
  score: number;
  likes: number;
  dislikes: number;
  userVote: 1 | -1 | 0;
};

export type ResourceVoteSummaryMap = Record<string, ResourceVoteSummary>;
export type ResourceViewCountMap = Record<string, number>;

const DEFAULT_VOTE_SUMMARY: ResourceVoteSummary = {
  score: 0,
  likes: 0,
  dislikes: 0,
  userVote: 0,
};

export function getDefaultResourceVoteSummary(): ResourceVoteSummary {
  return DEFAULT_VOTE_SUMMARY;
}

export async function fetchResourceViewCounts(
  supabase: AppSupabaseClient,
  resourceIds: string[]
): Promise<ResourceViewCountMap> {
  if (resourceIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('resource_view_counts')
    .select('resource_id, views')
    .in('resource_id', resourceIds);

  if (error) {
    throw error;
  }

  const counts: ResourceViewCountMap = {};

  for (const resourceId of resourceIds) {
    counts[resourceId] = 0;
  }

  for (const row of data ?? []) {
    if (!row.resource_id) continue;
    counts[row.resource_id] = row.views ?? 0;
  }

  return counts;
}

export async function registerResourceView(
  supabase: AppSupabaseClient,
  input: {
    resourceId: string;
    userId?: string | null;
    sessionKey?: string | null;
  }
) {
  const { error } = await supabase.from('resource_views').insert({
    resource_id: input.resourceId,
    user_id: input.userId ?? null,
    session_key: input.sessionKey ?? null,
  });

  if (error) {
    throw error;
  }
}

export async function fetchResourceVoteSummaries(
  supabase: AppSupabaseClient,
  resourceIds: string[],
  userId?: string | null
): Promise<ResourceVoteSummaryMap> {
  if (resourceIds.length === 0) {
    return {};
  }

  const { data, error } = await (supabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: unknown; error: unknown }>;
  }).rpc('get_resource_vote_summaries', {
    p_resource_ids: resourceIds,
    p_user_id: userId ?? null,
  });

  if (error) {
    throw error;
  }

  const summaries: ResourceVoteSummaryMap = {};

  for (const resourceId of resourceIds) {
    summaries[resourceId] = { ...DEFAULT_VOTE_SUMMARY };
  }

  const rows = data as Array<{
    resource_id: string;
    likes: number;
    dislikes: number;
    score: number;
    user_vote: number;
  }>;

  for (const row of rows ?? []) {
    const resourceId = row.resource_id;
    if (!resourceId) continue;

    summaries[resourceId] = {
      likes: Number(row.likes ?? 0),
      dislikes: Number(row.dislikes ?? 0),
      score: Number(row.score ?? 0),
      userVote:
        row.user_vote === 1 || row.user_vote === -1
          ? (row.user_vote as 1 | -1)
          : 0,
    };
  }

  return summaries;
}

export async function upsertResourceVote(
  supabase: AppSupabaseClient,
  input: {
    userId: string;
    resourceId: string;
    voteType: 1 | -1;
  }
) {
  const { error } = await supabase.from('resource_votes').upsert(
    {
      user_id: input.userId,
      resource_id: input.resourceId,
      vote_type: input.voteType,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,resource_id' }
  );

  if (error) {
    throw error;
  }
}

export function sortResourcesByVotes<T extends { id: string; creado_at?: string | null }>(
  resources: T[],
  voteSummaries: ResourceVoteSummaryMap
) {
  return [...resources].sort((a, b) => {
    const scoreDiff =
      (voteSummaries[b.id]?.score ?? 0) - (voteSummaries[a.id]?.score ?? 0);

    if (scoreDiff !== 0) return scoreDiff;

    const aTime = a.creado_at ? new Date(a.creado_at).getTime() : 0;
    const bTime = b.creado_at ? new Date(b.creado_at).getTime() : 0;
    return bTime - aTime;
  });
}

export async function fetchMateriaRecursos(
  supabase: AppSupabaseClient,
  materiaId: string
) {
  const { data, error } = await supabase
    .from('recursos')
    .select('id, nombre, tipo, url_archivo, creado_at, materia_id, etiqueta, paginas')
    .eq('materia_id', materiaId)
    .order('creado_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
