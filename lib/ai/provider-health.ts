import { createHash } from 'node:crypto';
import type { AiProviderName } from '@/lib/ai/providers';

const COOLDOWN_MS = 30 * 60 * 1000;
const blockedModels = new Map<string, number>();
const blockedCredentials = new Map<string, number>();

function modelId(provider: AiProviderName, model: string) {
  return provider + ':' + model;
}

function credentialId(provider: AiProviderName, apiKey: string) {
  return provider + ':' + createHash('sha256').update(apiKey).digest('hex');
}

function isActive(map: Map<string, number>, id: string, now: number) {
  const until = map.get(id) ?? 0;
  if (until <= now) {
    map.delete(id);
    return false;
  }
  return true;
}

export function isProviderAttemptBlocked(provider: AiProviderName, model: string, apiKey: string, now = Date.now()) {
  return isActive(blockedModels, modelId(provider, model), now) ||
    isActive(blockedCredentials, credentialId(provider, apiKey), now);
}

export function markProviderHttpFailure(provider: AiProviderName, model: string, apiKey: string, status: number, now = Date.now()) {
  if (status === 401 || status === 403) {
    blockedCredentials.set(credentialId(provider, apiKey), now + COOLDOWN_MS);
  } else if (status === 404 || status === 410) {
    blockedModels.set(modelId(provider, model), now + COOLDOWN_MS);
  }
}

export function clearProviderFailure(provider: AiProviderName, model: string, apiKey: string) {
  blockedModels.delete(modelId(provider, model));
  blockedCredentials.delete(credentialId(provider, apiKey));
}
