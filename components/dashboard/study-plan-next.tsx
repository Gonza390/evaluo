'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, ListChecks, Layers3, BookText, CheckCircle2 } from 'lucide-react';
import { getProgress, type TopicActivities } from '@/lib/study-plan-progress';

type Activity = { id: string; label: string; subtitle: string; href: string; done: boolean; icon: typeof BookOpen };
export function StudyPlanNext({ materialId, topicCount, topicActivities }: { materialId: string; topicCount: number; topicActivities: TopicActivities[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [read, setRead] = useState(0);
  useEffect(() => {
    const update = () => {
      try {
        setDone(getProgress(materialId, topicActivities).record);
        setRead(getProgress(materialId, topicActivities).read);
      } catch { setDone({}); setRead(0); }
    };
    update();
    window.addEventListener('focus', update);
    window.addEventListener('pageshow', update);
    return () => { window.removeEventListener('focus', update); window.removeEventListener('pageshow', update); };
  }, [materialId, topicCount, topicActivities]);
  if (!topicCount) return <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">Todavía no hay temas disponibles para planificar.</div>;
  let topic = 0;
  for (; topic < topicCount; topic++) {
    if (topic >= read || (topicActivities[topic]?.questions && !done[`${topic}:questions`]) || (topicActivities[topic]?.flashcards && !done[`${topic}:flashcards`]) || (topicActivities[topic]?.glossary && !done[`${topic}:glossary`])) break;
  }
  if (topic >= topicCount) return <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[13px] font-semibold text-emerald-800"><CheckCircle2 className="size-5" /> ¡Completaste las actividades del PDF!</div>;
  const tasks: Activity[] = [
    {id:'read',label:`Leer el tema ${topic + 1}`,subtitle:'Empezá por el contenido del tema',href:`/materiales/${materialId}?tab=resumen`,done:topic<read,icon:BookOpen},
    {id:'questions',label:`Practicar el tema ${topic + 1}`,subtitle:'Respondé las preguntas del tema',href:`/materiales/${materialId}?tab=ejercicios&studyTopic=${topic}`,done:!!done[`${topic}:questions`],icon:ListChecks},
    {id:'flashcards',label:`Repasar flashcards del tema ${topic + 1}`,subtitle:'Revisá las tarjetas de memoria',href:`/materiales/${materialId}?tab=tarjetas&studyTopic=${topic}`,done:!!done[`${topic}:flashcards`],icon:Layers3},
    {id:'glossary',label:`Revisar glosario del tema ${topic + 1}`,subtitle:'Repasá los conceptos importantes',href:`/materiales/${materialId}?tab=glosario&studyTopic=${topic}`,done:!!done[`${topic}:glossary`],icon:BookText},
  ];
  const available = tasks.filter(task => task.id === 'read' || topicActivities[topic]?.[task.id as keyof TopicActivities]);
  const next = available.findIndex(t=>!t.done);
  return <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white">
    <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-500">Tema {topic + 1} de {topicCount}</div>
    {available.map((task,i) => {
      const Icon=task.icon;
      return <Link key={task.id} href={task.href} className={`flex items-center gap-3 border-b border-slate-100 px-3 py-3 transition last:border-0 hover:bg-slate-50 ${i===next?'bg-blue-50/70':''}`}>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${task.done?'bg-emerald-50 text-emerald-700':i===next?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-500'}`}><Icon className="size-[17px]"/></span>
        <span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold">{task.label}</span><span className="mt-0.5 block text-[11px] text-slate-500">{task.done?'Completado':task.subtitle}</span></span>
        {task.done?<CheckCircle2 className="size-4 text-emerald-600"/>:<ArrowRight className={`size-4 ${i===next?'text-blue-700':'text-slate-400'}`}/>}
      </Link>;
    })}
  </div>;
}
