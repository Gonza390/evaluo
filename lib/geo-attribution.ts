// Una referencia de IA indica origen de navegación, no una mención de marca.
// No se guarda el texto de la consulta o la URL de una conversación.
export type AiReferralSource = 'chatgpt.com' | 'perplexity.ai' | 'claude.ai' | 'gemini' | 'copilot';

function matchesHost(host: string, domain: string) {
  return host === domain || host.endsWith('.' + domain);
}

export function aiSourceFromReferrer(referrer: string | null): AiReferralSource | undefined {
  if (!referrer) return undefined;
  let host: string;
  try {
    const url = new URL(referrer);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    host = url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return undefined;
  }
  if (matchesHost(host, 'chatgpt.com') || matchesHost(host, 'chat.openai.com')) return 'chatgpt.com';
  if (matchesHost(host, 'perplexity.ai')) return 'perplexity.ai';
  if (matchesHost(host, 'claude.ai')) return 'claude.ai';
  if (matchesHost(host, 'gemini.google.com')) return 'gemini';
  if (matchesHost(host, 'copilot.microsoft.com')) return 'copilot';
  return undefined;
}
