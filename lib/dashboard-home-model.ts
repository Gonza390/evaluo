/**
 * Modelo de la home del alumno (/dashboard) cuando tiene al menos un PDF listo.
 * Funciones puras: reciben los datos ya consultados y devuelven qué mostrar.
 * Diseño: https://claude.ai/artifact/3foCSoUHmkAksymwNQzHeG (pantallas 1–5).
 */

export type HomeTopic = { title: string; minutes: number };

export type HomePlanTopic = {
  materialId: string;
  topicIndex: number;
  title: string;
  estimatedMinutes: number;
};

export type HomePlan = {
  examDate: string;
  days: Array<{ date: string; topics: HomePlanTopic[] }>;
};

export type HomeExam = { materialId: string; title: string; examDate: string };

export type HomeInput = {
  firstName?: string;
  /** Fecha de hoy en Argentina, YYYY-MM-DD. */
  today: string;
  material: { id: string; title: string; examDate: string | null };
  topics: HomeTopic[];
  /** Índices de temas con la lectura terminada. */
  readTopics: number[];
  /** Índices de temas con alguna actividad (lectura, preguntas, tarjetas o glosario). */
  touchedTopics: number[];
  /** Temas con errores pendientes de repasar en este apunte. */
  weakTopicCount: number;
  /** Plan guardado que incluye este apunte (si lo hay). */
  plan: HomePlan | null;
  /** Exámenes futuros de todos los apuntes, ordenados por fecha. */
  exams: HomeExam[];
};

export type HomeMode = 'sin-fecha' | 'con-fecha' | 'con-plan';
export type HomePersonaje = 'contento' | 'feliz' | 'concentrado' | 'birrete';

export type HomeTask = {
  id: string;
  title: string;
  meta: string;
  href: string;
  /** null = sugerencia sin tilde; true/false = tarea del plan. */
  done: boolean | null;
};

export type HomeCard =
  | {
      kind: 'empezar';
      text: string;
      segments: number;
      done: number;
      progressLabel: string;
      primary: { label: string; href: string };
      secondary: { label: string; href: string };
    }
  | {
      kind: 'retomar';
      text: string;
      segments: number;
      done: number;
      progressLabel: string;
      primary: { label: string; href: string };
    }
  | {
      kind: 'preparacion';
      text: string;
      percent: number;
      good: number;
      weak: number;
      unseen: number;
      primary: { label: string; href: string };
      secondary: { label: string; href: string };
    }
  | {
      kind: 'plan';
      text: string;
      dayNumber: number;
      totalDays: number;
      behind: number;
      primary: { label: string; href: string };
      secondary: { label: string; href: string };
    };

export type HomeView = {
  mode: HomeMode;
  personaje: HomePersonaje;
  greeting: string;
  card: HomeCard;
  agenda: {
    tasks: HomeTask[];
    /** Pide la fecha del examen del apunte principal. */
    askDate: { materialId: string; materialTitle: string } | null;
    exam: { daysLeft: number; date: string; materialTitle: string } | null;
    planCta: { href: string } | null;
    exams: Array<HomeExam & { daysLeft: number }>;
  };
};

/** Meta de preparación para rendir tranquilo (marca "Listo"). */
export const READY_TARGET = 85;

export function daysBetween(fromKey: string, toKey: string) {
  const from = Date.UTC(+fromKey.slice(0, 4), +fromKey.slice(5, 7) - 1, +fromKey.slice(8, 10));
  const to = Date.UTC(+toKey.slice(0, 4), +toKey.slice(5, 7) - 1, +toKey.slice(8, 10));
  return Math.round((to - from) / 86_400_000);
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function joinTitles(titles: string[]) {
  if (titles.length <= 1) return titles[0] ?? '';
  return `${titles.slice(0, -1).join(', ')} y ${titles[titles.length - 1]}`;
}

const readHref = (materialId: string, index: number) =>
  `/materiales/${materialId}?tab=resumen&studyTopic=${index}`;
const practiceHref = (materialId: string, index?: number) =>
  `/materiales/${materialId}?tab=ejercicios${index === undefined ? '' : `&studyTopic=${index}`}`;

export function buildHomeView(input: HomeInput): HomeView {
  const { material, topics, today } = input;
  const total = topics.length;
  const read = new Set(input.readTopics.filter((i) => i >= 0 && i < total));
  const touched = new Set(input.touchedTopics.filter((i) => i >= 0 && i < total));
  const name = input.firstName?.trim();
  const withName = (text: string) => (name ? `${text}, ${name}.` : `${text}.`);
  const title = material.title.trim() || 'tu apunte';

  const nextIndex = topics.findIndex((_, i) => !read.has(i));
  const next = nextIndex >= 0 ? topics[nextIndex] : null;

  const examDate = input.plan?.examDate ?? material.examDate;
  const daysLeft = examDate ? daysBetween(today, examDate) : null;
  const hasFutureExam = daysLeft !== null && daysLeft >= 0;
  const mode: HomeMode = input.plan && hasFutureExam ? 'con-plan' : hasFutureExam ? 'con-fecha' : 'sin-fecha';
  const started = read.size > 0 || touched.size > 0;

  // Agenda: exámenes futuros (todas las materias).
  const exams = input.exams
    .map((exam) => ({ ...exam, daysLeft: daysBetween(today, exam.examDate) }))
    .filter((exam) => exam.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const examRow = hasFutureExam ? { daysLeft: daysLeft!, date: examDate!, materialTitle: title } : null;

  if (mode === 'con-plan' && input.plan) {
    const days = input.plan.days;
    const todayIndex = days.findIndex((day) => day.date === today);
    const pastDays = days.filter((day) => day.date < today);
    const todayTopics = todayIndex >= 0 ? days[todayIndex].topics : [];
    const isRead = (topic: HomePlanTopic) => topic.materialId === material.id && read.has(topic.topicIndex);
    const behind = pastDays.flatMap((day) => day.topics).filter((topic) => topic.materialId === material.id && !read.has(topic.topicIndex)).length;
    const tasks: HomeTask[] = todayTopics.map((topic) => ({
      id: `${topic.materialId}:${topic.topicIndex}`,
      title: `Leé ${topic.title}`,
      meta: `Resumen · ${topic.estimatedMinutes} min`,
      href: readHref(topic.materialId, topic.topicIndex),
      done: isRead(topic),
    }));
    const pending = tasks.filter((task) => !task.done);
    const firstPending = todayTopics.find((topic) => !isRead(topic)) ?? null;
    const dayNumber = todayIndex >= 0 ? todayIndex + 1 : Math.min(days.length, pastDays.length + 1);
    const text = firstPending
      ? `Ahora sigue ${firstPending.title}: leelo y hacé las preguntas. Unos ${firstPending.estimatedMinutes} minutos.`
      : behind > 0
        ? `Terminaste lo de hoy. Te ${plural(behind, 'quedó 1 tema', `quedaron ${behind} temas`)} de días anteriores.`
        : 'Terminaste lo de hoy. Mañana seguís con el plan.';
    const nextHref = firstPending
      ? readHref(firstPending.materialId, firstPending.topicIndex)
      : next
        ? readHref(material.id, nextIndex)
        : practiceHref(material.id);
    return {
      mode,
      personaje: daysLeft! <= 2 ? 'birrete' : pending.length === 0 ? 'feliz' : 'concentrado',
      greeting: pending.length > 0
        ? withName(`Hoy te ${plural(pending.length, 'queda 1 tarea', `quedan ${pending.length} tareas`)}`)
        : withName('Terminaste lo de hoy'),
      card: {
        kind: 'plan',
        text,
        dayNumber,
        totalDays: days.length,
        behind,
        primary: { label: firstPending ? 'Empezar' : 'Seguir estudiando', href: nextHref },
        secondary: { label: 'Ver plan', href: '/dashboard/plan-de-estudio' },
      },
      agenda: { tasks, askDate: null, exam: examRow, planCta: null, exams },
    };
  }

  if (mode === 'con-fecha') {
    const weak = Math.min(input.weakTopicCount, read.size);
    const good = Math.max(0, read.size - weak);
    const unseen = Math.max(0, total - read.size);
    const percent = total ? Math.round((good / total) * 100) : 0;
    const missing = topics
      .map((topic, i) => ({ topic, i }))
      .filter(({ i }) => !read.has(i))
      .slice(0, 3)
      .map(({ topic }) => topic.title);
    const text = percent >= READY_TARGET
      ? `Estás ${percent}% listo. Repasá con un simulacro para llegar tranquilo.`
      : missing.length
        ? `Estás ${percent}% listo. Para rendir tranquilo te ${plural(missing.length, 'falta', 'faltan')} ${joinTitles(missing)}.`
        : `Estás ${percent}% listo. Repasá los temas flojos para rendir tranquilo.`;
    const tasks: HomeTask[] = next
      ? [{ id: `next:${nextIndex}`, title: `Leé ${next.title}`, meta: `Resumen · ${next.minutes} min`, href: readHref(material.id, nextIndex), done: null }]
      : [{ id: 'practice', title: `Practicá ${title}`, meta: '10 preguntas · 10 min', href: practiceHref(material.id), done: null }];
    return {
      mode,
      personaje: daysLeft! <= 2 ? 'birrete' : 'concentrado',
      greeting: daysLeft === 0
        ? withName(`Hoy rendís ${title}`)
        : withName(`${daysLeft === 1 ? 'Falta 1 día' : `Faltan ${daysLeft} días`} para ${title}`),
      card: {
        kind: 'preparacion',
        text,
        percent,
        good,
        weak,
        unseen,
        primary: { label: 'Practicar lo que falta', href: next ? readHref(material.id, nextIndex) : practiceHref(material.id) },
        secondary: { label: 'Ver mis temas', href: `/materiales/${material.id}?tab=resumen` },
      },
      agenda: { tasks, askDate: null, exam: examRow, planCta: { href: `/dashboard/plan-de-estudio?material=${material.id}` }, exams },
    };
  }

  // Sin fecha de examen.
  const askDate = { materialId: material.id, materialTitle: title };
  if (total === 0) {
    return {
      mode,
      personaje: 'contento',
      greeting: withName(`Tu apunte de ${title} está listo`),
      card: {
        kind: 'retomar',
        text: `Abrí ${title} para leer el resumen y practicar.`,
        segments: 0,
        done: 0,
        progressLabel: '',
        primary: { label: 'Abrir apunte', href: `/materiales/${material.id}` },
      },
      agenda: { tasks: [], askDate, exam: null, planCta: null, exams },
    };
  }
  if (!started || !next) {
    const first = topics[0];
    if (!started && first) {
      return {
        mode,
        personaje: 'contento',
        greeting: withName(`Tu apunte de ${title} está listo`),
        card: {
          kind: 'empezar',
          text: `Empezá por ${first.title}. Es el tema 1 de ${total} y te lleva unos ${first.minutes} minutos.`,
          segments: total,
          done: 0,
          progressLabel: `0 de ${total} temas leídos`,
          primary: { label: 'Empezar', href: readHref(material.id, 0) },
          secondary: { label: 'Ver qué ya sé', href: practiceHref(material.id) },
        },
        agenda: {
          tasks: [{ id: 'next:0', title: `Leé el tema 1 de ${title}`, meta: `${first.title} · ${first.minutes} min`, href: readHref(material.id, 0), done: null }],
          askDate,
          exam: null,
          planCta: null,
          exams,
        },
      };
    }
  }

  const remaining = total - read.size;
  const half = next && touched.has(nextIndex) && !read.has(nextIndex);
  const text = !next
    ? `Leíste los ${total} temas de ${title}. Ahora practicá para fijarlos.`
    : half
      ? `Te quedó a mitad ${next.title}. Terminalo en unos ${next.minutes} minutos.`
      : `Ahora sigue ${next.title}. Te lleva unos ${next.minutes} minutos.`;
  return {
    mode,
    personaje: next ? 'concentrado' : 'feliz',
    greeting: next
      ? `${name ? `${name}, te` : 'Te'} ${plural(remaining, 'falta 1 tema', `faltan ${remaining} temas`)} de ${title}.`
      : withName(`Leíste todo ${title}`),
    card: {
      kind: 'retomar',
      text,
      segments: total,
      done: read.size,
      progressLabel: `${read.size} de ${total} temas leídos`,
      primary: next
        ? { label: 'Continuar', href: readHref(material.id, nextIndex) }
        : { label: 'Practicar', href: practiceHref(material.id) },
    },
    agenda: {
      tasks: next
        ? [{ id: `next:${nextIndex}`, title: half ? `Terminá ${next.title}` : `Leé ${next.title}`, meta: `Resumen · ${next.minutes} min`, href: readHref(material.id, nextIndex), done: null }]
        : [{ id: 'practice', title: `Practicá ${title}`, meta: '10 preguntas · 10 min', href: practiceHref(material.id), done: null }],
      askDate,
      exam: null,
      planCta: null,
      exams,
    },
  };
}
