import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Qué puedo hacer con mi PDF?',
    answer:
      'Podés convertir tu material en resúmenes, glosario, mapas mentales, flashcards y preguntas de práctica. También podés revisar qué temas te cuestan y volver a trabajarlos sobre la misma fuente.',
  },
  {
    question: '¿Las respuestas se basan en mi material?',
    answer:
      'Las herramientas de estudio de un material parten del contenido extraído de ese PDF para mantener la misma fuente durante el recorrido. Como con cualquier herramienta de IA, si un detalle es importante para tu examen, conviene contrastarlo con el documento original.',
  },
  {
    question: '¿Puedo usar Evaluo si mi universidad no aparece?',
    answer:
      'Sí. Podés estudiar con tu propio PDF sin depender del catálogo de universidades o materias. Solo necesitás subir el material que estés usando para preparar esa materia.',
  },
  {
    question: '¿Cuántos PDFs puedo subir gratis?',
    answer:
      'El plan gratuito permite hasta 2 PDFs dentro de una ventana móvil de 15 días, con un máximo de 100 páginas y 20 MB por archivo. Cada carga deja de contar para el cupo cuando transcurren 15 días desde que la subiste.',
  },
  {
    question: '¿Qué cambia con Premium?',
    answer:
      'Premium permite subir hasta 3 PDFs por día, sin límite de páginas por documento y con un máximo de 20 MB por archivo. También amplía las herramientas de práctica, explicación y seguimiento disponibles en Evaluo.',
  },
  {
    question: '¿Necesito crear una cuenta?',
    answer:
      'Podés probar la demostración de la portada sin registrarte. Para subir tu PDF y acceder a tu espacio de estudio necesitás una cuenta.',
  },
  {
    question: '¿Las preguntas son las del examen real?',
    answer:
      'No necesariamente. Las preguntas sirven para practicar sobre el material de estudio y no reproducen un examen oficial ni garantizan sus contenidos, formato o dificultad.',
  },
  {
    question: '¿Cómo se paga Premium?',
    answer:
      'Pagás en pesos argentinos mediante Mercado Pago. El plan mensual tiene renovación automática hasta que lo canceles; el acceso por 6 meses se paga una sola vez y no se renueva automáticamente.',
  },
];

export function FaqAccordion() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {FAQ_ITEMS.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 open:border-indigo-200 open:shadow-md open:ring-1 open:ring-indigo-50/50"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-open:text-indigo-600" />
              <span className="text-[14px] font-bold tracking-tight text-slate-800 sm:text-[15px]">
                {item.question}
              </span>
            </div>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 transition-all group-open:rotate-180 group-open:bg-indigo-50 group-open:text-indigo-600">
              <ChevronDown className="h-4 w-4" />
            </span>
          </summary>

          <div className="border-t border-slate-50 bg-white p-5 text-xs leading-6 text-slate-500 sm:text-sm">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
