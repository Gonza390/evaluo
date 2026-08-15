'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  HelpCircle, 
  Bot, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ChevronRight, 
  GraduationCap 
} from 'lucide-react';
import { TrackedLink } from './tracked-link';

interface UniversityData {
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  borderColor: string;
  badgeBg: string;
  carrera: string;
  materia: string;
  summary: {
    unit: string;
    points: string[];
    tip: string;
  };
  question: {
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

const DEMO_DATA: Record<string, UniversityData> = {
  UBA: {
    name: 'Universidad de Buenos Aires',
    shortName: 'UBA',
    color: 'from-blue-600 to-indigo-600',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    badgeBg: 'bg-blue-50',
    carrera: 'Ingeniería Informática / Exactas',
    materia: 'Análisis Matemático II',
    summary: {
      unit: 'Extremos Relativos y Absolutos',
      points: [
        'Para hallar los puntos críticos, calculamos el gradiente grad(f) = (0,0). Las soluciones del sistema son candidatos a extremos.',
        'Para clasificarlos, construimos el Determinante del Hessiano: H(x,y) = fxx · fyy - (fxy)².',
        'Si H > 0 y fxx > 0, tenemos un Mínimo Local.',
        'Si H > 0 y fxx < 0, tenemos un Máximo Local.',
        'Si H < 0, la función posee un Punto de Silla (el plano tangente corta a la gráfica).'
      ],
      tip: '¡Tip de parcial! Si H = 0, el criterio del Hessiano no decide. Tenés que recurrir a la definición de extremo o estudiar el comportamiento por curvas o rectas.'
    },
    question: {
      text: 'Dada la función f(x,y) = x² + y² - 4x + 6y, determiná las coordenadas y la naturaleza del único punto crítico encontrado:',
      options: [
        'El punto (2, -3) es un Punto de Silla.',
        'El punto (-2, 3) es un Mínimo Local.',
        'El punto (2, -3) es un Mínimo Local.',
        'El punto (-2, 3) es un Máximo Local.'
      ],
      correctIndex: 2,
      explanation: '1. Calculamos las derivadas parciales de primer orden: fx = 2x - 4 = 0 => x = 2; fy = 2y + 6 = 0 => y = -3. El único punto crítico es (2, -3).\n2. Obtenemos las derivadas de segundo orden para el Hessiano: fxx = 2, fyy = 2, fxy = 0.\n3. Evaluamos: H = (2)(2) - 0² = 4. Como H = 4 > 0 y fxx = 2 > 0, concluimos que el punto (2, -3) es un Mínimo Local. ¡Impecable!'
    }
  },
  UTN: {
    name: 'Universidad Tecnológica Nacional',
    shortName: 'UTN',
    color: 'from-sky-600 to-indigo-700',
    textColor: 'text-sky-600',
    borderColor: 'border-sky-200',
    badgeBg: 'bg-sky-50',
    carrera: 'Ingeniería en Sistemas / FRBA',
    materia: 'Álgebra y Geometría Analítica',
    summary: {
      unit: 'Ortogonalidad y Proyecciones',
      points: [
        'Dos vectores u y v son perpendiculares (ortogonales) si y solo si su producto escalar es nulo: u · v = 0.',
        'Un conjunto de vectores es Linealmente Independiente (LI) si el determinante de la matriz que forman es distinto de cero.',
        'La proyección ortogonal de un vector u sobre la dirección de v se calcula aplicando: proy_v(u) = [(u · v) / ||v||²] · v.'
      ],
      tip: '¡Tema recurrente de examen! Recordá que todo vector u puede descomponerse en la suma de su proyección sobre un subespacio S y su proyección sobre el complemento ortogonal S⊥: u = proy_S(u) + proy_S⊥(u).'
    },
    question: {
      text: 'Determiná para qué valor de k los vectores u = (1, 2, 3) y v = (k, -2, 1) resultan perpendiculares en ℝ³:',
      options: [
        'Para k = 1',
        'Para k = -1',
        'Para k = 3',
        'Para k = 0'
      ],
      correctIndex: 0,
      explanation: 'Para que dos vectores sean ortogonales, su producto escalar debe dar exactamente 0:\nu · v = (1)(k) + (2)(-2) + (3)(1) = 0\nk - 4 + 3 = 0\nk - 1 = 0  =>  k = 1.\nPor lo tanto, son perpendiculares únicamente si k = 1. ¡Excelente!'
    }
  },
  UADE: {
    name: 'Universidad de la Empresa',
    shortName: 'UADE',
    color: 'from-emerald-600 to-teal-700',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-50',
    carrera: 'Lic. en Administración / Economía',
    materia: 'Microeconomía I',
    summary: {
      unit: 'Elasticidades y Demanda',
      points: [
        'La Elasticidad Precio de la Demanda (Ep) mide la sensibilidad de la cantidad demandada ante variaciones del precio: Ep = %ΔQd / %ΔP.',
        'Si |Ep| > 1, la demanda es Elástica: un aumento en el precio reduce el Ingreso Total del productor.',
        'Si |Ep| < 1, la demanda es Inelástica: un aumento en el precio aumenta el Ingreso Total.',
        'Si |Ep| = 1, la demanda posee Elasticidad Unitaria: el Ingreso Total se mantiene al máximo.'
      ],
      tip: '¡Clave de parcial! Los bienes que tienen muchos sustitutos cercanos (como gaseosas de marca) siempre presentan una elasticidad mucho más alta que los bienes indispensables de primera necesidad.'
    },
    question: {
      text: 'Si la elasticidad precio de la demanda de un bien es de -1.5, ¿qué ocurre con la cantidad demandada si el precio aumenta un 10%?',
      options: [
        'Aumenta un 15%',
        'Disminuye un 15%',
        'Disminuye un 1.5%',
        'No sufre variaciones'
      ],
      correctIndex: 1,
      explanation: 'Usamos la definición formal de Elasticidad Precio de la Demanda:\nEp = %ΔQd / %ΔP\nReemplazando los datos conocidos: -1.5 = %ΔQd / 10%\nDespejando: %ΔQd = -1.5 · 10% = -15%.\nComo el resultado es negativo, representa una caída del 15% en la cantidad demandada. ¡Resuelto paso a paso!'
    }
  }
};

export function InteractiveDemo() {
  const [step, setStep] = useState<number>(0);
  const [selectedUniKey, setSelectedUniKey] = useState<string>('UBA');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);

  const currentUni = DEMO_DATA[selectedUniKey];

  const handleSelectUni = (key: string) => {
    setSelectedUniKey(key);
    setSelectedAnswer(null);
    setAnswered(false);
    setStep(1);
  };

  const handleAnswer = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);
  };

  const handleReset = () => {
    setSelectedAnswer(null);
    setAnswered(false);
    setStep(0);
  };

  return (
    <div className="w-full rounded-[32px] border border-slate-100 bg-white p-5 shadow-[0_24px_55px_rgba(15,27,61,0.06)] md:p-8">
      {/* Indicador de Pasos */}
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Sparkles className="h-4.5 w-4.5 animate-pulse" />
          </div>
          <span className="text-sm font-bold text-slate-800">Demo interactiva</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <span className={`rounded-full px-2 py-0.5 transition ${step === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>1. Universidad</span>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <span className={`rounded-full px-2 py-0.5 transition ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>2. Práctica</span>
        </div>
      </div>

      {step === 0 ? (
        <div className="py-4">
          <h3 className="text-xl font-bold tracking-tight text-[#0F1B3D] text-center md:text-2xl">
            ¿En qué universidad estudiás?
          </h3>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-slate-500">
            Seleccioná una universidad para ver cómo Evaluo estructura tus materias y prepara tus exámenes.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {Object.entries(DEMO_DATA).map(([key, uni]) => (
              <button
                key={key}
                onClick={() => handleSelectUni(key)}
                className={`group flex flex-col items-center justify-between rounded-2xl border bg-slate-50/50 p-6 text-center transition-all hover:border-indigo-400 hover:bg-white hover:shadow-lg hover:-translate-y-0.5`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F1B3D] to-[#2563EB] text-xl font-bold text-white shadow-md group-hover:scale-110 transition-transform">
                  {uni.shortName}
                </div>
                <div className="mt-5">
                  <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{uni.shortName}</h4>
                  <p className="mt-1 text-[11px] font-medium text-slate-500 leading-4">{uni.name}</p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Explorar cátedra
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-slate-50 p-4 border border-slate-100 flex items-center gap-3">
            <GraduationCap className="h-6 w-6 text-indigo-500 shrink-0" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>¿Tu universidad no está listada?</strong> No te preocupes. Evaluo está pensado para todas las facultades del país. Podés subir el programa de tu materia y la plataforma generará resúmenes y simuladores personalizados para vos.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          {/* Columna Izquierda: El Resumen Adaptado */}
          <div className="flex flex-col justify-between rounded-2xl border-b border-slate-200 bg-slate-50/60 p-5 md:p-6 lg:rounded-none lg:border-b-0 lg:border-r">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${currentUni.badgeBg} ${currentUni.textColor} border ${currentUni.borderColor}`}>
                  {currentUni.shortName}
                </span>
                <span className="text-[11px] font-medium text-slate-500">{currentUni.carrera}</span>
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#0F1B3D]">
                Materia: <span className="text-indigo-600">{currentUni.materia}</span>
              </h3>
              <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-100">
                <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                Unidad: {currentUni.summary.unit}
              </div>

              <div className="mt-5 space-y-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Resumen curado de la clase</p>
                <ul className="space-y-2.5">
                  {currentUni.summary.points.map((point, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-xs text-slate-600 leading-5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tip de parcial */}
            <div className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5">
              <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                {currentUni.summary.tip}
              </p>
            </div>
          </div>

          {/* Columna Derecha: El Simulador de Examen */}
          <div className="flex flex-col justify-between rounded-2xl bg-white p-5 md:p-6 lg:rounded-none">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  <Bot className="h-3.5 w-3.5" />
                  Simulador Cátedra
                </span>
                <span className="text-xs font-bold text-slate-500">Pregunta 1 de 1</span>
              </div>

              <div className="mt-4 flex gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-slate-800 leading-6">
                  {currentUni.question.text}
                </p>
              </div>

              {/* Opciones */}
              <div className="mt-5 space-y-2.5">
                {currentUni.question.options.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === currentUni.question.correctIndex;
                  
                  let optionStyle = 'border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20';
                  if (answered) {
                    if (isCorrect) {
                      optionStyle = 'border-emerald-200 bg-emerald-50/30 text-emerald-950 font-semibold';
                    } else if (isSelected) {
                      optionStyle = 'border-red-200 bg-red-50/30 text-red-950';
                    } else {
                      optionStyle = 'border-slate-100 opacity-60';
                    }
                  } else {
                    if (isSelected) {
                      optionStyle = 'border-indigo-600 bg-indigo-50/30';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={answered}
                      onClick={() => handleAnswer(idx)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-xs transition ${optionStyle}`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        answered && isCorrect 
                          ? 'border-emerald-500 bg-emerald-500 text-white' 
                          : answered && isSelected
                            ? 'border-red-500 bg-red-500 text-white'
                            : isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white text-slate-500'
                      }`}>
                        {answered && isCorrect ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : answered && isSelected ? (
                          <XCircle className="h-3 w-3" />
                        ) : (
                          String.fromCharCode(65 + idx)
                        )}
                      </span>
                      <span className="leading-relaxed">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explicación de la IA */}
              {answered && (
                <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 animate-tab-panel">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4.5 w-4.5 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950">Explicación Paso a Paso de Evaluo IA:</span>
                  </div>
                  <p className="text-[11px] leading-5 text-indigo-900 whitespace-pre-line">
                    {currentUni.question.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Acciones del final de la Demo */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-3 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Cambiar Universidad
              </button>
              
              <TrackedLink
                href="/explorar"
                eventName="cta_click"
                payload={{
                  location: 'demo_widget_success',
                  university: currentUni.shortName,
                  subject: currentUni.materia,
                  destination: '/explorar'
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 px-5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(79,93,255,0.22)] hover:bg-indigo-700 transition"
              >
                Buscar todo mi plan de {currentUni.shortName}
                <ArrowRight className="h-3.5 w-3.5" />
              </TrackedLink>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
