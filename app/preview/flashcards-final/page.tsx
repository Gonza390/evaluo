import { Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const reviewTopics = [
  'Derechos y garantías',
  'Organización del Estado',
  'Procedimientos constitucionales',
];

export default function FlashcardsFinalPreviewPage() {
  const knownCount = 7;
  const unknownCount = 3;

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-[22px] border border-emerald-200 bg-[linear-gradient(145deg,#FFFFFF_0%,#F0FDF4_100%)] px-5 py-9 text-center sm:px-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.22)]">
            <Check className="h-5 w-5" />
          </div>

          <h1 className="mt-4 text-xl font-bold tracking-[-0.04em] text-slate-950">
            ¡Terminaste esta sesión!
          </h1>

          <p className="mt-2 text-sm font-semibold text-slate-700">
            {knownCount} lo sabías · {unknownCount} no lo sabías
          </p>

          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
            Podés cerrar la sesión o volver a practicar únicamente las {unknownCount} que no sabías.
          </p>

          <div className="mx-auto mt-5 w-full max-w-xl border-t border-emerald-100 pt-5 text-left">
            <h2 className="text-sm font-semibold text-slate-950">Temas para repasar</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Estos son los temas que te costaron en esta práctica.
            </p>

            <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
              {reviewTopics.map((topic) => (
                <li key={topic} className="py-2.5 text-sm font-semibold text-slate-700">
                  {topic}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button type="button" className="rounded-2xl px-6">
              <RotateCcw className="h-4 w-4" /> Repasar las que no sabía
            </Button>

            <Button type="button" variant="outline" className="rounded-2xl px-6">
              <Check className="h-4 w-4" /> Finalizar
            </Button>

            <Button type="button" variant="ghost" className="rounded-2xl px-6">
              Empezar de nuevo
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
