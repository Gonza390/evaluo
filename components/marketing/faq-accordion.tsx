import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Qué universidades están disponibles en Evaluo?',
    answer:
      'Actualmente contamos con soporte completo y guías de cátedra de las principales universidades públicas y privadas de Argentina: UBA, UTN, UNC, UNLP, UADE, UCA, Universidad de San Andrés y Universidad Torcuato Di Tella. Si tu universidad no figura en la lista destacada, puedes registrarte, subir tus propios apuntes o programas de estudio, y la plataforma organizará el contenido y la simulación a tu medida.',
  },
  {
    question: '¿El contenido de la plataforma es realmente gratuito?',
    answer:
      'Sí. Evaluo ofrece un plan gratuito para explorar materias, consultar resúmenes esenciales y realizar prácticas iniciales. Si quieres una preparación más profunda, el plan premium suma simulaciones ilimitadas, más explicación paso a paso, más analítica y más seguimiento.',
  },
  {
    question: '¿Es obligatorio registrarse para ver los resúmenes y preguntas?',
    answer:
      'No para la navegación inicial. Puedes buscar tu universidad y recorrer carreras libremente. Para guardar progreso, usar simuladores completos, registrar respuestas y mantener tus materias favoritas, sí necesitas una cuenta.',
  },
  {
    question: '¿Cómo funciona el plan premium y qué métodos de pago acepta?',
    answer:
      'El plan premium desbloquea simulacros ilimitados, explicaciones más completas de cada error, métricas de avance y herramientas extra de estudio. Los pagos se procesan en pesos argentinos a través de Mercado Pago y admiten dinero en cuenta, transferencia y tarjetas.',
  },
  {
    question: '¿Los simuladores de examen son parecidos a los parciales reales?',
    answer:
      'Sí, esa es una de las propuestas centrales de Evaluo. Los simuladores se apoyan en parciales anteriores, modelos de cátedra, apuntes y material compartido por estudiantes, para reflejar mejor la estructura y el nivel de dificultad que encuentras en la práctica.',
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
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 transition-all group-open:rotate-180 group-open:bg-indigo-50 group-open:text-indigo-600">
              <ChevronDown className="h-4 w-4" />
            </span>
          </summary>

          <div className="border-t border-slate-50 bg-slate-50/30 p-5 text-xs leading-6 text-slate-500 sm:text-sm">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
