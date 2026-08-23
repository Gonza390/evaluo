'use client';

import { useState } from 'react';
import { Building2, CheckCircle2, Loader2, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function UniversityRequestForm() {
  const [universityName, setUniversityName] = useState('');
  const [country, setCountry] = useState('Argentina');
  const [city, setCity] = useState('');
  const [careerName, setCareerName] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!universityName.trim() || !careerName.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const rpc = supabase.rpc as unknown as (
        name: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message?: string } | null }>;

      const { error } = await rpc('submit_university_request', {
        p_university_name: universityName.trim(),
        p_country: country.trim() || 'Argentina',
        p_city: city.trim() || null,
        p_career_name: careerName.trim(),
        p_note: note.trim() || null,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch {
      setErrorMessage('No pudimos enviar la solicitud. Intentá nuevamente en unos segundos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 p-6 text-center sm:p-8">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <h2 className="mt-4 text-xl font-bold tracking-[-0.04em] text-slate-950">
          Solicitud recibida
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Vamos a revisar la universidad y la carrera que nos compartiste. La solicitud no agrega
          contenido automáticamente: primero la revisamos nosotros.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="university-name" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Universidad
          </label>
          <Input
            id="university-name"
            value={universityName}
            onChange={(event) => setUniversityName(event.target.value)}
            placeholder="Nombre de tu universidad"
            minLength={2}
            maxLength={160}
            required
          />
        </div>

        <div>
          <label htmlFor="university-country" className="mb-1.5 block text-sm font-semibold text-slate-800">
            País
          </label>
          <Input
            id="university-country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            minLength={2}
            maxLength={100}
            required
          />
        </div>

        <div>
          <label htmlFor="university-city" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Ciudad <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <Input
            id="university-city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Ej. Córdoba"
            maxLength={120}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="university-career" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Carrera
          </label>
          <Input
            id="university-career"
            value={careerName}
            onChange={(event) => setCareerName(event.target.value)}
            placeholder="¿Qué carrera estudiás?"
            minLength={2}
            maxLength={160}
            required
          />
          <p className="mt-1.5 text-xs text-slate-400">
            La necesitamos para crear la estructura correcta si aprobamos la solicitud.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="university-note" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Comentario <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <textarea
            id="university-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Podés contarnos qué materias te gustaría encontrar primero."
            maxLength={1000}
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
        <div className="flex items-start gap-2">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span>
            Esto es una solicitud para ampliar el catálogo de Evaluo. No implica representación,
            aprobación ni afiliación con la universidad mencionada.
          </span>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full sm:w-auto"
        disabled={isSubmitting || !universityName.trim() || !careerName.trim()}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Enviar solicitud
      </Button>
    </form>
  );
}
