import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Qué universidades están disponibles en Evaluo?',
    answer:
      'El catálogo actual comienza con Universidad Siglo 21 y estamos preparando la incorporación de más universidades. Los nombres de instituciones se usan únicamente para organizar el catálogo académico. Evaluo es una plataforma independiente y no está afiliada, patrocinada ni aprobada por las universidades listadas.',
  },
  {
    question: '¿El contenido de la plataforma es realmente gratuito?',
    answer:
      'Sí. Evaluo tiene un plan gratuito para explorar el catálogo y usar funciones iniciales de estudio. Premium amplía las herramientas de práctica, explicación y seguimiento según las condiciones vigentes del plan.',
  },
  {
    question: '¿Es obligatorio registrarse para ver los resúmenes y preguntas?',
    answer:
      'No para la navegación inicial. Podés explorar el catálogo, las carreras y las materias disponibles sin crear una cuenta. Para guardar progreso, personalizar tu espacio de estudio, solicitar una universidad y usar funciones que necesitan identificarte, sí necesitás registrarte.',
  },
  {
    question: '¿Cómo funciona el plan Premium y cómo se paga?',
    answer:
      'Premium amplía las herramientas de estudio y seguimiento disponibles en Evaluo. La suscripción se gestiona en pesos argentinos mediante Mercado Pago; al abrir el checkout, Mercado Pago te muestra los medios de pago disponibles para tu cuenta. Podés cancelar la renovación desde Mercado Pago.',
  },
  {
    question: '¿Los simuladores reproducen los parciales reales?',
    answer:
      'No. Los simuladores son prácticas originales construidas a partir de los materiales y temas disponibles en Evaluo. Sirven para practicar preguntas, administrar el tiempo y revisar errores, pero no reproducen exámenes oficiales ni garantizan el formato, la dificultad o los contenidos de un parcial real.',
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
