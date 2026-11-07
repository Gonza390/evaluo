'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Check, Layers3, ListChecks, Network, Timer, Zap, ArrowLeft } from 'lucide-react';
import { useOptionalAppLocale } from '@/components/i18n/app-locale-provider';
import { studyUiText } from '@/lib/i18n/study-ui-copy';

const modes = [
  { title: 'Flashcards', description: 'Recordá y girá las tarjetas.', slug: 'flashcards', Icon: Layers3, color: 'bg-[#E2F2F7] text-[#41839B]' },
  { title: 'Opciones', description: 'Decidí si cada afirmación es verdadera o falsa.', slug: 'opciones', Icon: Check, color: 'bg-[#E3F2E5] text-[#398052]' },
  { title: 'Unir conceptos', description: 'Relacioná términos y definiciones.', slug: 'unir', Icon: Network, color: 'bg-[#E0F2F0] text-[#348C85]' },
  { title: 'Completar', description: 'Encontrá la palabra que falta.', slug: 'completar', Icon: ListChecks, color: 'bg-[#FAE9DE] text-[#AE663F]' },
  { title: 'Casos', description: 'Aplicá conceptos a situaciones.', slug: 'casos', Icon: BookOpen, color: 'bg-[#EBE4FA] text-[#6C52A8]' },
  { title: 'Mixto', description: 'Una mezcla de todo, como en un examen.', slug: 'mixto', Icon: Zap, color: 'bg-[#FCF2DF] text-[#9A712C]' },
  { title: 'Simulacro de examen', description: 'Con reloj y resultados al final.', slug: 'simulacro', Icon: Timer, color: 'bg-[#E9EAED] text-[#626B7A]' },
] as const;

export function PdfPracticeModes({ materialId }: { materialId: string }) {
  const locale = useOptionalAppLocale();
  const english = locale === 'en';
  const t = (value: string) => studyUiText(locale, value);
  const [selected, setSelected] = useState<(typeof modes)[number] | null>(null);
  const [duration, setDuration] = useState<'rapido' | 'completo'>('rapido');
  const returnTo = `/materiales/${encodeURIComponent(materialId)}?tab=ejercicios`;
  const href = selected
    ? `/dashboard/practicar/${encodeURIComponent(materialId)}/${selected.slug}?repaso=${duration}&returnTo=${encodeURIComponent(returnTo)}`
    : '#';

  return (
    <section data-pdf-practice-modes className="mt-7 border-t border-[#E7EBF4] pt-6">
      {selected ? (
        <div className="mx-auto max-w-[560px] rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:p-5">
          <button type="button" onClick={() => setSelected(null)}
            className="mb-3 inline-flex min-h-10 items-center gap-1.5 text-[12px] font-medium text-[#526079] hover:text-[#0F1B3D]">
            <ArrowLeft className="size-4" aria-hidden="true" />
            {english ? 'Other practice modes' : 'Otras formas de practicar'}
          </button>
          <h3 className="text-[18px] font-semibold tracking-tight text-[#0F1B3D]">
            {english ? 'How would you like to review?' : '¿Cómo querés repasar?'}
          </h3>
          <p className="mt-1 text-[12px] text-[#66758D]">
            {english ? 'Choose how much time to spend.' : 'Elegí cuánto tiempo querés dedicarle.'}
          </p>
          <div role="radiogroup" aria-label={english ? 'Review duration' : 'Tipo de repaso'} className="mt-4 grid gap-2 sm:grid-cols-2">
            {(['rapido', 'completo'] as const).map(value => (
              <button key={value} type="button" role="radio" aria-checked={duration === value}
                onClick={() => setDuration(value)}
                className={`min-h-16 rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${duration === value ? 'border-[#456DBD] bg-[#F7FAFF] ring-1 ring-[#DBE8FF]' : 'border-[#E7EBF4] hover:border-blue-200'}`}>
                <span className="block text-[13px] font-semibold text-[#0F1B3D]">
                  {value === 'rapido' ? (english ? 'Quick review' : 'Repaso rápido') : (english ? 'Full review' : 'Repaso completo')}
                </span>
                <span className="mt-1 block text-[11px] text-[#66758D]">
                  {value === 'rapido' ? '≈ 10 min' : '≈ 40 min'}
                </span>
              </button>
            ))}
          </div>
          <Link href={href} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#456DBD] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#3A5CA8]">
            {english ? 'Start practice' : 'Empezar práctica'}
          </Link>
        </div>
      ) : (
        <>
          <h3 className="text-[16px] font-semibold tracking-tight text-[#0F1B3D]">
            {english ? 'Other ways to practice' : 'Otras formas de practicar'}
          </h3>
          <p className="mt-1 text-[12px] text-[#66758D]">
            {english ? 'Choose another way to review this PDF.' : 'Elegí otra modalidad para repasar este mismo PDF.'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {modes.map(mode => (
              <button key={mode.slug} type="button" onClick={() => { setDuration('rapido'); setSelected(mode); }}
                className={`flex min-h-[122px] min-w-0 flex-col items-start rounded-2xl border border-transparent p-3.5 text-left transition-all duration-150 hover:brightness-[0.985] hover:shadow-[0_4px_16px_rgba(15,23,42,0.035)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:min-h-[142px] sm:p-4 ${mode.color}`}>
                <mode.Icon className="size-4" aria-hidden="true" />
                <span className="mt-auto pt-4 text-[13px] font-medium leading-4">{t(mode.title)}</span>
                <span className="mt-1 text-[11px] leading-[1.4] opacity-85">{t(mode.description)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
