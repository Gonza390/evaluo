import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function checkKey(key: string | undefined) {
  if (!key) {
    return { configured: false, ok: false, status: null, model: null, error: 'missing' };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: 'Respond only OK.' }],
        temperature: 0,
        max_tokens: 8,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return {
        configured: true,
        ok: false,
        status: response.status,
        model: null,
        error: text.slice(0, 160),
      };
    }

    const json = (await response.json()) as {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
    };

    return {
      configured: true,
      ok: true,
      status: response.status,
      model: json.model ?? null,
      content: json.choices?.[0]?.message?.content?.slice(0, 20) ?? '',
      error: null,
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      status: null,
      model: null,
      error: error instanceof Error ? error.message.slice(0, 160) : 'unknown',
    };
  }
}

export async function GET() {
  const [primary, pdf] = await Promise.all([
    checkKey(process.env.GROQ_API_KEY),
    checkKey(process.env.GROQ_PDF_API_KEY),
  ]);

  return NextResponse.json(
    { groq_api_key: primary, groq_pdf_api_key: pdf },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
