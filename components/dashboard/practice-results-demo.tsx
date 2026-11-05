'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PracticeSession } from '@/components/dashboard/practice-session';
import { StudentMaterialFlashcards } from '@/components/student-material-flashcards';
import type { PracticePair, PracticeQuestion } from '@/lib/student-materials/practice-modes';
import type { StudyFlashcard } from '@/lib/student-materials/pedagogy';

type PreviewType = 'opciones' | 'unir' | 'casos' | 'completar' | 'mixto' | 'simulacro' | 'flashcards' | 'flashcards_tema';
const PREVIEWS: { type: PreviewType; label: string }[] = [
  { type: 'opciones', label: 'Verdadero o falso' },
  { type: 'unir', label: 'Unir conceptos' },
  { type: 'casos', label: 'Casos prácticos' },
  { type: 'completar', label: 'Completar' },
  { type: 'mixto', label: 'Práctica mixta' },
  { type: 'simulacro', label: 'Simulacro' },
  { type: 'flashcards', label: 'Flashcards general' },
  { type: 'flashcards_tema', label: 'Flashcards por tema' },
];

const MATERIAL_ID = '00000000-0000-4000-8000-000000000000';
const MATERIAL_TITLE = 'Apuntes de Economía · Unidad 3';
const DEMO_SCORE = { correct: 4 };

// Contenido didáctico de muestra. Nunca se guarda ni se envía al backend.
const PAIRS: PracticePair[] = [
  { term: 'Demanda', definition: 'Cantidad de productos que las personas desean comprar a diferentes precios.', chapterTitle: 'Oferta y demanda' },
  { term: 'Oferta', definition: 'Cantidad de bienes que los productores están dispuestos a vender según su precio.', chapterTitle: 'Oferta y demanda' },
  { term: 'Equilibrio de mercado', definition: 'Situación en que la cantidad que se ofrece coincide con la cantidad solicitada.', chapterTitle: 'Oferta y demanda' },
  { term: 'Elasticidad', definition: 'Indicador que expresa cómo responde una cantidad a cambios en otra variable.', chapterTitle: 'Elasticidad' },
  { term: 'Costo fijo', definition: 'Gasto que se mantiene estable aunque varíe la cantidad producida a corto plazo.', chapterTitle: 'Costos de producción' },
  { term: 'Costo variable', definition: 'Gasto que aumenta o disminuye al cambiar el volumen producido por la empresa.', chapterTitle: 'Costos de producción' },
  { term: 'Bien sustituto', definition: 'Producto que puede utilizarse como alternativa a otro para satisfacer una necesidad.', chapterTitle: 'Elasticidad' },
  { term: 'Ingreso marginal', definition: 'Incremento del ingreso total que recibe la empresa al vender una unidad adicional.', chapterTitle: 'Costos de producción' },
];
const QUESTIONS: PracticeQuestion[] = [
  {
    id: 'demo-1', prompt: 'Cuando el precio de un bien aumenta, ¿qué sucede normalmente con su cantidad demandada?',
    options: ['Disminuye', 'Aumenta', 'No cambia nunca'], answer: 'Disminuye',
    explanation: 'Con los demás factores constantes, la ley de la demanda describe una relación inversa entre precio y cantidad demandada.',
    level: 'comprender', pageStart: null, chapterTitle: 'Oferta y demanda',
  },
  {
    id: 'demo-2', prompt: '¿Qué indica un mercado en equilibrio?',
    options: ['La oferta iguala la demanda', 'No existen productores', 'El precio siempre es cero'], answer: 'La oferta iguala la demanda',
    explanation: 'En el equilibrio, la cantidad ofrecida y demandada coinciden para un precio dado.',
    level: 'comprender', pageStart: null, chapterTitle: 'Oferta y demanda',
  },
  {
    id: 'demo-3', prompt: '¿Qué refleja la elasticidad precio de la demanda?',
    options: ['La respuesta de las compras ante cambios de precio', 'El costo total', 'El número de productores'], answer: 'La respuesta de las compras ante cambios de precio',
    explanation: 'La elasticidad mide cuánto varía la cantidad demandada cuando cambia el precio.',
    level: 'comprender', pageStart: null, chapterTitle: 'Elasticidad',
  },
  {
    id: 'demo-4', prompt: '¿Cuál de los siguientes ejemplos corresponde a un costo fijo?',
    options: ['El alquiler mensual del local', 'La materia prima por unidad', 'El embalaje de cada producto'], answer: 'El alquiler mensual del local',
    explanation: 'El alquiler suele mantenerse constante dentro de un rango de producción.',
    level: 'aplicar', pageStart: null, chapterTitle: 'Costos de producción',
  },
  {
    id: 'demo-5', prompt: 'Si hay más sustitutos cercanos, ¿cómo suele ser la demanda?',
    options: ['Más elástica', 'Perfectamente rígida en todos los casos', 'Independiente del precio'], answer: 'Más elástica',
    explanation: 'Los consumidores pueden cambiar a otros productos cuando uno se encarece.',
    level: 'aplicar', pageStart: null, chapterTitle: 'Elasticidad',
  },
  {
    id: 'demo-6', prompt: 'Si una empresa produce más unidades, ¿qué costo suele aumentar?',
    options: ['El costo variable total', 'El costo fijo total de inmediato', 'Ningún costo'], answer: 'El costo variable total',
    explanation: 'Los costos variables totales aumentan al fabricar una cantidad mayor.',
    level: 'aplicar', pageStart: null, chapterTitle: 'Costos de producción',
  },
];

const CARDS: StudyFlashcard[] = PAIRS.slice(0, 6).map((pair) => ({
  front: `¿Qué significa ${pair.term}?`,
  back: pair.definition,
  level: 'recordar',
  reference: { pageStart: null, pageEnd: null, sectionTitle: pair.chapterTitle, excerpt: '' },
}));

export function PracticeResultsDemo({ type }: { type: string }) {
  const router = useRouter();
  const current = PREVIEWS.find((item) => item.type === type)?.type ?? 'opciones';
  const flashcards = current === 'flashcards' || current === 'flashcards_tema';

  return (
    <div className="min-h-screen bg-[#F5F7FB] px-3 py-6 sm:px-6">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-5 rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2563EB]">Vista previa local · Evaluo</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-[#0F1B3D] sm:text-2xl">Pantallas al finalizar una práctica</h1>
          <p className="mt-1 text-sm text-[#42506A]">Elegí una pantalla. Los resultados son ficticios; no se realizan actividades, llamadas a IA ni consumo de cupos Free.</p>
          <nav aria-label="Pantallas de resultados" className="mt-4 flex flex-wrap gap-2">
            {PREVIEWS.map((item) => (
              <Link
                key={item.type}
                href={`/dashboard/practicar/resultados-demo?tipo=${item.type}`}
                aria-current={item.type === current ? 'page' : undefined}
                className={`inline-flex min-h-10 items-center rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors ${item.type === current ? 'border-[#2563EB] bg-[#EEF2FF] text-[#032269]' : 'border-[#E7EBF4] bg-white text-[#42506A] hover:border-[#2563EB]'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        {flashcards ? (
          <div className="mx-auto max-w-[760px] rounded-2xl border border-[#E7EBF4] bg-white p-4 sm:p-6">
            <StudentMaterialFlashcards
              key={current}
              cards={CARDS}
              materialId={MATERIAL_ID}
              demoMode
              previewFinished
              {...(current === 'flashcards_tema'
                ? {
                    allowedCardIndices: CARDS.map((_, index) => index),
                    topicTitle: 'Oferta y demanda',
                    onPracticeTopic: () => router.push('/dashboard/practicar/resultados-demo?tipo=opciones'),
                  }
                : {})}
            />
          </div>
        ) : (
          <PracticeSession
            key={current}
            mode={current}
            materialId={MATERIAL_ID}
            materialTitle={MATERIAL_TITLE}
            glossary={PAIRS}
            questions={QUESTIONS}
            cases={QUESTIONS}
            reviewLength="rapido"
            aiAvailable={false}
            freeV2={false}
            previewResult={DEMO_SCORE}
          />
        )}
      </div>
    </div>
  );
}
