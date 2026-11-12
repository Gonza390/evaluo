import { NextResponse } from 'next/server';
import { generateStudyErrorReviewQuestion, streamEviChatReply } from '@/lib/ai-tutor';
import { prepareEviChat } from '@/lib/evi-chat-service';
import { logError } from '@/lib/observability';
import { trackServerAnalyticsEvent } from '@/lib/server-analytics';

export const maxDuration = 60;

const unavailable = (english: boolean) =>
  english
    ? 'Evi could not answer right now. Try again in a few seconds.'
    : 'Evi no pudo responder ahora. Probá de nuevo en unos segundos.';

/**
 * Chat "Preguntale a Evi".
 * - mode "chat": responde en texto plano que se va escribiendo (streaming).
 * - mode "quiz": devuelve una pregunta parecida con 3 opciones.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Solicitud no válida.' }, { status: 400 });
  }
  const mode = body.mode === 'quiz' ? 'quiz' : 'chat';
  const prepared = await prepareEviChat({
    context: body.context,
    history: body.history,
    message: body.message,
  }).catch((error: unknown) => {
    logError('eviChat.prepare', error);
    return null;
  });
  if (!prepared) return NextResponse.json({ message: unavailable(false) }, { status: 503 });
  if (!prepared.ok)
    return NextResponse.json(
      { message: prepared.message, limitReached: prepared.limitReached ?? false },
      { status: prepared.status }
    );

  const { grounding, english } = prepared;
  const track = (extra: Record<string, unknown>) =>
    trackServerAnalyticsEvent({
      eventName: 'evi_chat_message_sent',
      userId: prepared.userId,
      path: '/api/evi-chat',
      metadata: {
        context_kind: prepared.context.kind,
        material_id: grounding.materialId,
        study_error_id: prepared.context.kind === 'error' ? prepared.context.errorId : null,
        suggestion: body.suggestion === true,
        turn: prepared.history.filter((item) => item.role === 'user').length + 1,
        premium: prepared.premium,
        ...extra,
      },
    });

  if (mode === 'quiz') {
    if (!grounding.excerpt)
      return NextResponse.json(
        {
          message: english
            ? 'Your notes do not have enough on this to build a new question.'
            : 'Tu apunte no tiene suficiente sobre esto para armar otra pregunta.',
        },
        { status: 422 }
      );
    const generated = await generateStudyErrorReviewQuestion({
      locale: english ? 'en' : 'es',
      question: grounding.question.slice(0, 2000),
      topic: '',
      correctAnswer: (grounding.correctAnswer ?? '').slice(0, 1000),
      selectedAnswer: grounding.chosen?.slice(0, 1000),
      reviewedExplanation: grounding.explanation?.slice(0, 1600),
      source: grounding.excerpt,
    }).catch(() => null);
    if (!generated?.question)
      return NextResponse.json({ message: unavailable(english) }, { status: 503 });
    await track({ quiz: true });
    const { question, options, correctIndex, feedback } = generated.question;
    return NextResponse.json({
      quiz: { question, options, correctIndex, feedback },
      page: grounding.page,
      remaining: prepared.remaining,
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sent = false;
      try {
        await streamEviChatReply(
          {
            locale: english ? 'en' : 'es',
            question: grounding.question.slice(0, 2000),
            chosen: grounding.chosen?.slice(0, 1000),
            correctAnswer: grounding.correctAnswer?.slice(0, 1000),
            explanation: grounding.explanation?.slice(0, 1600),
            excerpt: grounding.excerpt,
            page: grounding.page,
            history: prepared.history,
            message: prepared.message,
          },
          (delta) => {
            sent = true;
            controller.enqueue(encoder.encode(delta));
          }
        );
        if (!sent) controller.enqueue(encoder.encode(`\u0000${unavailable(english)}`));
        else await track({});
      } catch (error) {
        logError('eviChat.stream', error, { userId: prepared.userId });
        if (!sent) controller.enqueue(encoder.encode(`\u0000${unavailable(english)}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Evi-Page': grounding.excerpt && grounding.page ? String(grounding.page) : '',
      'X-Evi-Remaining': prepared.remaining === null ? '' : String(prepared.remaining),
    },
  });
}
