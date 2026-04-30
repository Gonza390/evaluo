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

const DEFAULT_VOTE_SUMMARY: ResourceVoteSummary = {
  score: 0,
  likes: 0,
  dislikes: 0,
  userVote: 0,
};

export function getDefaultResourceVoteSummary(): ResourceVoteSummary {
  return DEFAULT_VOTE_SUMMARY;
}

export async function fetchResourceVoteSummaries(
  supabase: AppSupabaseClient,
  resourceIds: string[],
  userId?: string | null
): Promise<ResourceVoteSummaryMap> {
  if (resourceIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('resource_votes')
    .select('resource_id, user_id, vote_type')
    .in('resource_id', resourceIds);

  if (error) {
    throw error;
  }

  const summaries: ResourceVoteSummaryMap = {};

  for (const resourceId of resourceIds) {
    summaries[resourceId] = { ...DEFAULT_VOTE_SUMMARY };
  }

  for (const row of data ?? []) {
    const resourceId = row.resource_id;
    if (!resourceId) continue;

    const current = summaries[resourceId] ?? { ...DEFAULT_VOTE_SUMMARY };
    if (row.vote_type === 1) current.likes += 1;
    if (row.vote_type === -1) current.dislikes += 1;
    current.score = current.likes - current.dislikes;

    if (userId && row.user_id === userId && (row.vote_type === 1 || row.vote_type === -1)) {
      current.userVote = row.vote_type;
    }

    summaries[resourceId] = current;
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
