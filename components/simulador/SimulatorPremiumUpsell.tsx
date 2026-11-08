'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { LockKeyhole } from 'lucide-react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

interface SimulatorPremiumUpsellProps {
  /** Enunciados de las respuestas incorrectas que el plan gratis no explica. */
  lockedQuestions: string[];
  materiaId?: string | null;
  onUpgrade: () => void;
}

/**
 * Continúa la lista de explicaciones gratis: las preguntas falladas siguientes
 * se ven, la explicación aparece desenfocada y Evi invita a pasar a Premium.
 * Solo se muestra cuando realmente quedaron explicaciones sin ver.
 */
export function SimulatorPremiumUpsell({
  lockedQuestions,
  materiaId,
  onUpgrade,
}: SimulatorPremiumUpsellProps) {
  const remaining = lockedQuestions.length;

  useEffect(() => {
    if (remaining === 0) return;
    trackMarketingEvent('premium_gate_viewed', {
      source: 'simulator_explanations',
      materia_id: materiaId ?? undefined,
    });
  }, [remaining, materiaId]);

  if (remaining === 0) return null;

  return (
    <section data-premium-gate="simulator-explanations" className="mt-4">
      <div className="relative flex flex-col gap-2.5" aria-hidden="true">
        {lockedQuestions.slice(0, 2).map((question, index) => (
          <article
            key={`${index}-${question}`}
            className={
              index === 1
                ? 'hidden rounded-[14px] border border-[#e3e8f1] bg-white p-3.5 sm:block sm:px-[18px] sm:py-4'
                : 'rounded-[14px] border border-[#e3e8f1] bg-white p-3.5 sm:px-[18px] sm:py-4'
            }
          >
            <p className="line-clamp-2 text-sm leading-snug font-semibold text-[#14213d] sm:text-[15px]">
              {question}
            </p>
            <div className="mt-1 blur-[2.5px]">
              {[96, 88, 62].map((width) => (
                <span
                  key={width}
                  className="mt-2 block h-[9px] rounded-[5px] bg-[#d5dceb]"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
          </article>
        ))}
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-b from-white/0 to-white to-85%" />
      </div>

      <div className="relative -mt-9 flex flex-col items-center gap-2.5 text-center">
        <Image
          src="/evi-practica-limite.svg"
          alt=""
          width={64}
          height={64}
          className="size-14 object-contain sm:size-16"
        />
        <span className="inline-flex items-center gap-[7px] rounded-full border border-[#cfdcf5] bg-white px-3 py-1.5 text-xs font-bold text-[#2a5193]">
          <LockKeyhole className="size-[13px]" aria-hidden="true" />
          Se desbloquea con Premium
        </span>
        <h4 className="mt-0.5 text-[19px] leading-tight font-extrabold tracking-[-0.01em] text-[#14213d] sm:text-[21px]">
          {remaining === 1 ? 'Te falta 1 explicación' : `Te faltan ${remaining} explicaciones`}
        </h4>
        <p className="max-w-[380px] text-sm leading-normal text-[#4f5b6e]">
          Mirá por qué fallaste cada respuesta y cómo hacerlo bien en el parcial.
        </p>
        <button
          type="button"
          onClick={onUpgrade}
          className="mt-1 flex min-h-12 w-full max-w-[320px] items-center justify-center rounded-xl bg-[#3c6cba] text-[15px] font-bold text-white transition hover:bg-[#2a5193] focus-visible:ring-2 focus-visible:ring-[#3c6cba] focus-visible:ring-offset-2 focus-visible:outline-none sm:min-h-11 sm:max-w-[280px]"
        >
          Pasar a Premium
        </button>
      </div>
    </section>
  );
}
