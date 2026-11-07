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

const TRUE_FALSE_QUESTIONS: PracticeQuestion[] = [
  { id: 'tf-1', prompt: 'La cantidad demandada de un bien suele disminuir cuando su precio aumenta, si lo demás permanece constante.',
    options: ['Verdadero', 'Falso'], answer: 'Verdadero',
    explanation: 'La ley de la demanda describe una relación inversa entre precio y cantidad demandada.',
    level: 'comprender', pageStart: null, chapterTitle: 'Oferta y demanda' },
  { id: 'tf-2', prompt: 'El equilibrio de mercado se alcanza cuando la cantidad ofrecida coincide con la demandada.',
    options: ['Verdadero', 'Falso'], answer: 'Verdadero',
    explanation: 'En equilibrio, compradores y vendedores coinciden en la cantidad transada a un precio dado.',
    level: 'comprender', pageStart: null, chapterTitle: 'Oferta y demanda' },
  { id: 'tf-3', prompt: 'Los costos fijos totales varían obligatoriamente con cada unidad adicional producida.',
    options: ['Verdadero', 'Falso'], answer: 'Falso',
    explanation: 'Los costos fijos totales se mantienen constantes dentro de un rango relevante de producción.',
    level: 'comprender', pageStart: null, chapterTitle: 'Costos de producción' },
  { id: 'tf-4', prompt: 'Una mayor disponibilidad de productos sustitutos puede volver más elástica la demanda.',
    options: ['Verdadero', 'Falso'], answer: 'Verdadero',
    explanation: 'Con más sustitutos, es más sencillo cambiar de producto ante un aumento de precio.',
    level: 'aplicar', pageStart: null, chapterTitle: 'Elasticidad' },
  { id: 'tf-5', prompt: 'Una demanda inelástica implica que la cantidad demandada cambia más que proporcionalmente ante una suba del precio.',
    options: ['Verdadero', 'Falso'], answer: 'Falso',
    explanation: 'La demanda inelástica responde menos que proporcionalmente a variaciones porcentuales del precio.',
    level: 'comprender', pageStart: null, chapterTitle: 'Elasticidad' },
  { id: 'tf-6', prompt: 'El costo variable total se mantiene fijo aunque la empresa produzca el doble de unidades.',
    options: ['Verdadero', 'Falso'], answer: 'Falso',
    explanation: 'El costo variable total depende del volumen producido y normalmente aumenta cuando crece la producción.',
    level: 'aplicar', pageStart: null, chapterTitle: 'Costos de producción' },
];

const CASE_QUESTIONS: PracticeQuestion[] = [
  { id: 'case-1', prompt: 'Un comercio sube el precio de un producto y observa una fuerte caída en las ventas. ¿Qué describe mejor la situación?',
    options: ['Demanda elástica', 'Costo fijo', 'Oferta constante'], answer: 'Demanda elástica',
    explanation: 'Una caída proporcionalmente importante en la cantidad comprada es compatible con una demanda elástica.',
    level: 'aplicar', pageStart: null, chapterTitle: 'Elasticidad' },
  { id: 'case-2', prompt: 'En una feria, los vendedores ofrecen exactamente la cantidad que los compradores desean adquirir. ¿Qué ocurre?',
    options: ['Equilibrio', 'Escasez obligatoria', 'Exceso de oferta'], answer: 'Equilibrio',
    explanation: 'El equilibrio se produce cuando la cantidad ofrecida y demandada coincide.',
    level: 'aplicar', pageStart: null, chapterTitle: 'Oferta y demanda' },
  { id: 'case-3', prompt: 'Una panadería produce más unidades y compra más harina. ¿Qué tipo de costo aumentó?',
    options: ['Costo variable', 'Costo fijo', 'Costo hundido'], answer: 'Costo variable',
    explanation: 'La harina es un insumo ligado a la cantidad que produce la panadería.',
    level: 'aplicar', pageStart: null, chapterTitle: 'Costos de producción' },
  { id: 'case-4', prompt: 'Un comprador deja una marca de café por otra más económica. ¿Qué relación existe entre ambas?',
    options: ['Bienes sustitutos', 'Bienes sin relación', 'Costos marginales'], answer: 'Bienes sustitutos',
    explanation: 'Dos marcas que satisfacen la misma necesidad pueden actuar como sustitutos.',
    level: 'aplicar', pageStart: null, chapterTitle: 'Elasticidad' },
  { id: 'case-5', prompt: 'Una empresa vende una unidad más y obtiene un ingreso adicional de $2.000. ¿Qué indicador mide ese cambio?',
    options: ['Ingreso marginal', 'Costo fijo', 'Equilibrio'], answer: 'Ingreso marginal',
    explanation: 'El ingreso marginal es el incremento del ingreso total por vender una unidad adicional.',
    level: 'aplicar', pageStart: null, chapterTitle: 'Costos de producción' },
  { id: 'case-6', prompt: 'A un precio dado, los compradores desean más unidades de las que las empresas ofrecen. ¿Qué situación representa?',
    options: ['Escasez', 'Equilibrio', 'Exceso de oferta'], answer: 'Escasez',
    explanation: 'Si la cantidad demandada supera a la ofrecida, aparece un exceso de demanda o escasez.',
    level: 'aplicar', pageStart: null, chapterTitle: 'Oferta y demanda' },
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
    <div className="min-h-full bg-white px-3 py-4 sm:px-5 sm:py-5">
      <div className="mx-auto max-w-[920px]">
        <div className="mb-3 px-1 pb-3 sm:mb-4 sm:pb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#456DBD]">Vista previa local · Evaluo</p>
          <h1 className="mt-1 text-[21px] font-semibold tracking-[-0.035em] text-[#0F1B3D] sm:text-[24px]">Pantallas al finalizar una práctica</h1>
          <p className="mt-1 text-[12px] leading-5 text-[#42506A] sm:text-[13px]">Elegí una pantalla. Los resultados son ficticios; no se realizan actividades, llamadas a IA ni consumo de cupos Free.</p>
          <nav aria-label="Pantallas de resultados" className="mt-4 flex flex-wrap gap-2">
            {PREVIEWS.map((item) => (
              <Link
                key={item.type}
                href={`/dashboard/practicar/resultados-demo?tipo=${item.type}`}
                aria-current={item.type === current ? 'page' : undefined}
                className={`inline-flex min-h-9 items-center rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition-colors ${item.type === current ? 'border-[#456DBD] bg-[#EEF2FF] text-[#032269]' : 'border-[#E7EBF4] bg-white text-[#42506A] hover:border-[#456DBD]'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        {flashcards ? (
          <div className="mx-auto max-w-[860px]">
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
            questions={current === 'opciones' ? TRUE_FALSE_QUESTIONS : current === 'casos' ? CASE_QUESTIONS : QUESTIONS}
            cases={CASE_QUESTIONS}
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
