import 'server-only';

export type SenderTemplateVariables = Record<string, string | number | boolean | null | undefined>;

export async function sendSenderTemplate(input: {
  templateId: string;
  toEmail: string;
  toName?: string | null;
  variables: SenderTemplateVariables;
  text?: string;
  html?: string;
}) {
  const token = process.env.SENDER_API_TOKEN?.trim();
  if (!token) {
    throw new Error('Falta SENDER_API_TOKEN.');
  }

  const variables = Object.fromEntries(
    Object.entries(input.variables)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );

  const response = await fetch(
    `https://api.sender.net/v2/message/${encodeURIComponent(input.templateId)}/send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        to: {
          email: input.toEmail,
          ...(input.toName ? { name: input.toName } : {}),
        },
        variables,
        ...(input.text ? { text: input.text } : {}),
        ...(input.html ? { html: input.html } : {}),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    }
  );

  const raw = await response.text();
  let payload: { success?: boolean; message?: string; emailId?: string } = {};

  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Sender respondió HTTP ${response.status}.`);
  }

  return {
    emailId: payload.emailId ?? null,
  };
}
