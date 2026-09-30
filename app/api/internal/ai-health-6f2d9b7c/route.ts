import { NextResponse } from 'next/server';
import { requestGroqText } from '@/lib/ai/providers';

const DIAGNOSTIC_TOKEN = '6f2d9b7c1a4e8c55b2a1d9f46b7e3c0f';

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('token') !== DIAGNOSTIC_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const state = {
    groqApiKeyConfigured: Boolean(process.env.GROQ_API_KEY?.trim()),
    groqPdfApiKeyConfigured: Boolean(process.env.GROQ_PDF_API_KEY?.trim()),
    nvidiaApiKeyConfigured: Boolean(process.env.NVIDIA_API_KEY?.trim()),
  };

  try {
    const result = await requestGroqText({
      prompt: 'Respondé únicamente con la palabra OK.',
      system: 'Respondé exactamente lo pedido y nada más.',
      temperature: 0,
      maxTokens: 8,
    });

    return NextResponse.json({
      ok: Boolean(result),
      ...state,
      provider: result?.provider ?? null,
      model: result?.model ?? null,
      response: result?.content?.trim() ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        ...state,
        error: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 500 }
    );
  }
}
