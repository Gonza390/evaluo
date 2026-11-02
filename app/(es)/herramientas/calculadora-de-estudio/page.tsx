import { StudentArticleLayout, studyMetadata } from '@/components/marketing/student-seo-layout';
import { StudyLoadCalculator } from '@/components/marketing/study-load-calculator';
export const metadata=studyMetadata('/herramientas/calculadora-de-estudio','Calculadora de estudio: temas y días hasta el examen','Calculá de forma gratuita cuántos temas estudiar por día y el tiempo disponible para cada uno.');
export default function Page(){
 return <StudentArticleLayout kicker="Herramienta gratuita" title="Calculadora de carga de estudio"
 description="Estimá cuántos temas necesitás preparar cada día y cuánto tiempo tenés disponible. Después ajustá la planificación según la dificultad de cada unidad." source="seo-calculadora">
 <StudyLoadCalculator/>
 <section className="mt-9 space-y-4"><h2 className="text-2xl font-bold">Cómo interpretar la estimación</h2>
 <p className="text-sm leading-7 text-slate-700">No todos los temas demandan la misma cantidad de minutos. Tomá la cifra como punto de partida; destiná más tiempo a contenidos difíciles, práctica de recuperación y análisis de errores.</p>
 <p className="text-sm leading-7 text-slate-700">Si te quedan pocos días, priorizá los objetivos más importantes de la materia y evitá planificar jornadas incompatibles con el descanso.</p></section>
 </StudentArticleLayout>;
}
