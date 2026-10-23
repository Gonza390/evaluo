'use client';

import { useState } from 'react';
import { BookOpenCheck, FileQuestion, GraduationCap } from 'lucide-react';
import { UnlamExamFormatSample } from '@/components/marketing/unlam-exam-format-sample';
import { UnlamIngresoPractice } from '@/components/marketing/unlam-ingreso-practice';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

type Mode = 'modelo_seminario' | 'materias';

export function UnlamUnifiedPractice() {
  const [mode, setMode] = useState<Mode>('modelo_seminario');
  function choose(next: Mode) {
    if (next === mode) return;
    setMode(next);
    trackMarketingEvent('seo_unlam_practice_mode_selected', {
      location: 'seo_ingreso_unlam_2027_unified_practice',
      subject: next,
    });
  }
  return (
    <section id="practica-ingreso" aria-labelledby="unlam-unified-practice-title" className="scroll-mt-8 border-b border-slate-200 bg-[#f4f7ff] py-12 sm:py-16">
      <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-8">
        <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">
          <GraduationCap className="h-4 w-4" aria-hidden="true"/> Sin registro, con explicaciones
        </p>
        <h2 id="unlam-unified-practice-title" className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Probá una práctica de ingreso UNLaM antes de estudiar tu PDF
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          Empezá con una consigna original de lectura y justificación, inspirada en habilidades presentes
          en un manual histórico de la universidad. O elegí una materia y resolvé preguntas breves.
          <strong> No son exámenes oficiales ni predicen el ingreso 2027.</strong>
        </p>
        <div className="mt-6 grid max-w-3xl gap-2 sm:grid-cols-2" role="group" aria-label="Tipo de práctica">
          <button type="button" aria-pressed={mode === 'modelo_seminario'} onClick={() => choose('modelo_seminario')}
            className={'flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ' +
              (mode === 'modelo_seminario' ? 'border-[#174BBD] bg-[#174BBD] text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-blue-50')}>
            <FileQuestion className="h-5 w-5 shrink-0" aria-hidden="true" /> Modelo guiado: Seminario
          </button>
          <button type="button" aria-pressed={mode === 'materias'} onClick={() => choose('materias')}
            className={'flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ' +
              (mode === 'materias' ? 'border-[#174BBD] bg-[#174BBD] text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-blue-50')}>
            <BookOpenCheck className="h-5 w-5 shrink-0" aria-hidden="true" /> Ejercicios por materia
          </button>
        </div>
        <div className="mt-6">
          {mode === 'modelo_seminario' ? <UnlamExamFormatSample /> : <UnlamIngresoPractice />}
        </div>
        <p className="mt-4 text-xs leading-6 text-slate-700">
          El modelo de Seminario permite revisar tu propia respuesta escrita, no calificarla automáticamente.
          Las preguntas breves corrigen únicamente la opción elegida. Contrastá siempre con tu manual vigente.
        </p>
      </div>
    </section>
  );
}
