'use client';

import { useAppLocale } from '@/components/i18n/app-locale-provider';
import { useToast } from '@/components/ui/use-toast';
import { parseAppLocale } from '@/lib/i18n/app-locale';

export function StudyLanguagePicker() {
  const { locale, studyLocale, savingStudyLocale, changeStudyLocale } = useAppLocale();
  const { toast } = useToast();
  const english = locale === 'en';
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 py-4 text-[13px] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <label htmlFor="evaluo-study-language" className="font-medium text-slate-800">
          {english ? 'Language for AI study content' : 'Idioma del contenido de estudio generado por IA'}
        </label>
        <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">
          {english
            ? 'Choose the language for newly generated summaries, flashcards and exercises. Existing materials are not automatically translated. Original PDF/Word files and source quotations remain unchanged.'
            : 'Elegí el idioma de nuevos resúmenes, tarjetas y ejercicios. Los materiales ya procesados no se traducen automáticamente. El PDF/Word original y las citas se conservan intactos.'}
        </p>
      </div>
      <select id="evaluo-study-language" value={studyLocale} disabled={savingStudyLocale}
        onChange={event => {
          const next = parseAppLocale(event.target.value);
          if (!next) return;
          void changeStudyLocale(next).catch(() =>
            toast({ title: english ? 'Could not save study language' : 'No pudimos guardar el idioma de estudio', variant: 'destructive' }));
        }}
        className="min-h-10 min-w-[130px] rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60">
        <option value="es">Español</option><option value="en">English</option>
      </select>
    </div>
  );
}
