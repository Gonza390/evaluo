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

export type HomeLocale = 'es' | 'en';

export type HomeInput = {
  /** Idioma de la app (por defecto español). */
  locale?: HomeLocale;
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
      /** El último día del plan ya pasó (el examen todavía no). */
      finished: boolean;
      primary: { label: string; href: string };
      secondary: { label: string; href: string };
    };

export type HomeView = {
  locale: HomeLocale;
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

function joinTitles(titles: string[], and: string) {
  if (titles.length <= 1) return titles[0] ?? '';
  return `${titles.slice(0, -1).join(', ')} ${and} ${titles[titles.length - 1]}`;
}

/** Textos de la home por idioma. `n` = nombre (puede faltar). */
const COPY = {
  es: {
    fallbackTitle: 'tu apunte',
    and: 'y',
    withName: (text: string, n?: string) => (n ? `${text}, ${n}.` : `${text}.`),
    // Plan
    planGreeting: (pending: number, n?: string) =>
      pending > 0
        ? COPY.es.withName(`Hoy te ${plural(pending, 'queda 1 tarea', `quedan ${pending} tareas`)}`, n)
        : COPY.es.withName('Terminaste lo de hoy', n),
    planNext: (t: string, m: number) => `Ahora sigue ${t}: leelo y hacé las preguntas. Unos ${m} minutos.`,
    planDoneBehind: (b: number) => `Terminaste lo de hoy. Te ${plural(b, 'quedó 1 tema', `quedaron ${b} temas`)} de días anteriores.`,
    planDone: 'Terminaste lo de hoy. Mañana seguís con el plan.',
    catchUpGreeting: (n: number, name?: string) =>
      COPY.es.withName(`Te ${plural(n, 'queda 1 tema atrasado', `quedan ${n} temas atrasados`)}`, name),
    planOverDone: 'Terminaste el plan. Repasá con un simulacro antes del examen.',
    start: 'Empezar',
    keepStudying: 'Seguir estudiando',
    seePlan: 'Ver plan',
    readTask: (t: string) => `Leé ${t}`,
    finishTask: (t: string) => `Terminá ${t}`,
    summaryMeta: (m: number) => `Resumen · ${m} min`,
    // Con fecha
    examGreeting: (days: number, title: string, n?: string) =>
      days === 0
        ? COPY.es.withName(`Hoy rendís ${title}`, n)
        : COPY.es.withName(`${days === 1 ? 'Falta 1 día' : `Faltan ${days} días`} para ${title}`, n),
    readyDone: (p: number) => `Estás ${p}% listo. Repasá con un simulacro para llegar tranquilo.`,
    readyMissing: (p: number, missing: string[]) =>
      `Estás ${p}% listo. Para rendir tranquilo te ${plural(missing.length, 'falta', 'faltan')} ${joinTitles(missing, 'y')}.`,
    readyWeak: (p: number) => `Estás ${p}% listo. Repasá los temas flojos para rendir tranquilo.`,
    practiceMissing: 'Practicar lo que falta',
    seeTopics: 'Ver mis temas',
    practiceTask: (title: string) => `Practicá ${title}`,
    practiceMeta: '10 preguntas · 10 min',
    // Sin fecha
    readyNotes: (title: string, n?: string) => COPY.es.withName(`Tu apunte de ${title} está listo`, n),
    openNotesText: (title: string) => `Abrí ${title} para leer el resumen y practicar.`,
    openNotes: 'Abrir apunte',
    startText: (t: string, total: number, m: number) => `Empezá por ${t}. Es el tema 1 de ${total} y te lleva unos ${m} minutos.`,
    progress: (done: number, total: number) => `${done} de ${total} temas leídos`,
    seeWhatIKnow: 'Ver qué ya sé',
    firstTask: (title: string) => `Leé el tema 1 de ${title}`,
    topicMeta: (t: string, m: number) => `${t} · ${m} min`,
    leftGreeting: (remaining: number, title: string, n?: string) =>
      `${n ? `${n}, te` : 'Te'} ${plural(remaining, 'falta 1 tema', `faltan ${remaining} temas`)} de ${title}.`,
    allReadGreeting: (title: string, n?: string) => COPY.es.withName(`Leíste todo ${title}`, n),
    allReadText: (total: number, title: string) => `Leíste los ${total} temas de ${title}. Ahora practicá para fijarlos.`,
    halfText: (t: string, m: number) => `Te quedó a mitad ${t}. Terminalo en unos ${m} minutos.`,
    nextText: (t: string, m: number) => `Ahora sigue ${t}. Te lleva unos ${m} minutos.`,
    continue: 'Continuar',
    practice: 'Practicar',
  },
  en: {
    fallbackTitle: 'your notes',
    and: 'and',
    withName: (text: string, n?: string) => (n ? `${text}, ${n}.` : `${text}.`),
    planGreeting: (pending: number, n?: string) =>
      pending > 0
        ? COPY.en.withName(`You have ${plural(pending, '1 task', `${pending} tasks`)} left today`, n)
        : COPY.en.withName('You’re done for today', n),
    planNext: (t: string, m: number) => `Next up: ${t}. Read it and answer the questions. About ${m} minutes.`,
    planDoneBehind: (b: number) => `You’re done for today. ${plural(b, '1 topic', `${b} topics`)} from earlier days ${b === 1 ? 'is' : 'are'} still pending.`,
    planDone: 'You’re done for today. Pick up the plan tomorrow.',
    catchUpGreeting: (n: number, name?: string) =>
      COPY.en.withName(`You have ${plural(n, '1 topic', `${n} topics`)} to catch up on`, name),
    planOverDone: 'You finished the plan. Take a practice exam before the real one.',
    start: 'Start',
    keepStudying: 'Keep studying',
    seePlan: 'See plan',
    readTask: (t: string) => `Read ${t}`,
    finishTask: (t: string) => `Finish ${t}`,
    summaryMeta: (m: number) => `Summary · ${m} min`,
    examGreeting: (days: number, title: string, n?: string) =>
      days === 0
        ? COPY.en.withName(`Your ${title} exam is today`, n)
        : COPY.en.withName(`${days === 1 ? '1 day' : `${days} days`} until ${title}`, n),
    readyDone: (p: number) => `You’re ${p}% ready. Take a practice exam to walk in confident.`,
    readyMissing: (p: number, missing: string[]) =>
      `You’re ${p}% ready. To feel confident, you still need ${joinTitles(missing, 'and')}.`,
    readyWeak: (p: number) => `You’re ${p}% ready. Review your weak topics to feel confident.`,
    practiceMissing: 'Practice what’s left',
    seeTopics: 'See my topics',
    practiceTask: (title: string) => `Practice ${title}`,
    practiceMeta: '10 questions · 10 min',
    readyNotes: (title: string, n?: string) => COPY.en.withName(`Your ${title} notes are ready`, n),
    openNotesText: (title: string) => `Open ${title} to read the summary and practice.`,
    openNotes: 'Open notes',
    startText: (t: string, total: number, m: number) => `Start with ${t}. It’s topic 1 of ${total} and takes about ${m} minutes.`,
    progress: (done: number, total: number) => `${done} of ${total} topics read`,
    seeWhatIKnow: 'See what I know',
    firstTask: (title: string) => `Read topic 1 of ${title}`,
    topicMeta: (t: string, m: number) => `${t} · ${m} min`,
    leftGreeting: (remaining: number, title: string, n?: string) =>
      `${n ? `${n}, you` : 'You'} have ${plural(remaining, '1 topic', `${remaining} topics`)} left in ${title}.`,
    allReadGreeting: (title: string, n?: string) => COPY.en.withName(`You’ve read all of ${title}`, n),
    allReadText: (total: number, title: string) => `You’ve read all ${total} topics of ${title}. Now practice to lock them in.`,
    halfText: (t: string, m: number) => `You’re halfway through ${t}. Finish it in about ${m} minutes.`,
    nextText: (t: string, m: number) => `Next up: ${t}. It takes about ${m} minutes.`,
    continue: 'Continue',
    practice: 'Practice',
  },
};

const readHref = (materialId: string, index: number) =>
  `/materiales/${materialId}?tab=resumen&studyTopic=${index}`;
const practiceHref = (materialId: string, index?: number) =>
  `/materiales/${materialId}?tab=ejercicios${index === undefined ? '' : `&studyTopic=${index}`}`;

export function buildHomeView(input: HomeInput): HomeView {
  const locale: HomeLocale = input.locale === 'en' ? 'en' : 'es';
  const c = COPY[locale];
  const { material, topics, today } = input;
  const total = topics.length;
  const read = new Set(input.readTopics.filter((i) => i >= 0 && i < total));
  const touched = new Set(input.touchedTopics.filter((i) => i >= 0 && i < total));
  const name = input.firstName?.trim() || undefined;
  const title = material.title.trim() || c.fallbackTitle;

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
  // El examen del plan cuenta aunque el apunte no tenga exam_date guardada.
  if (hasFutureExam && !exams.some((exam) => exam.materialId === material.id)) {
    exams.push({ materialId: material.id, title, examDate: examDate!, daysLeft: daysLeft! });
    exams.sort((a, b) => a.daysLeft - b.daysLeft);
  }
  const practiceTask = (): HomeTask => ({ id: 'practice', title: c.practiceTask(title), meta: c.practiceMeta, href: practiceHref(material.id), done: null });

  if (mode === 'con-plan' && input.plan) {
    const days = input.plan.days;
    const todayIndex = days.findIndex((day) => day.date === today);
    const pastDays = days.filter((day) => day.date < today);
    const finished = days.length > 0 && days[days.length - 1].date < today;
    const isRead = (topic: HomePlanTopic) => topic.materialId === material.id && read.has(topic.topicIndex);
    const overdue = pastDays.flatMap((day) => day.topics).filter((topic) => topic.materialId === material.id && !read.has(topic.topicIndex));
    const behind = overdue.length;
    const todayTopics = todayIndex >= 0 ? days[todayIndex].topics : [];
    // Sin tareas para hoy (día libre o plan terminado): hoy toca ponerse al día con lo atrasado.
    const catchUp = todayTopics.length === 0 && behind > 0;
    const agendaTopics = catchUp ? overdue.slice(0, 3) : todayTopics;
    const tasks: HomeTask[] = agendaTopics.map((topic) => ({
      id: `${topic.materialId}:${topic.topicIndex}`,
      title: c.readTask(topic.title),
      meta: c.summaryMeta(topic.estimatedMinutes),
      href: readHref(topic.materialId, topic.topicIndex),
      done: isRead(topic),
    }));
    const pending = tasks.filter((task) => !task.done);
    const firstPending = agendaTopics.find((topic) => !isRead(topic)) ?? null;
    const dayNumber = todayIndex >= 0 ? todayIndex + 1 : Math.min(days.length, pastDays.length + 1);
    const text = firstPending
      ? c.planNext(firstPending.title, firstPending.estimatedMinutes)
      : behind > 0
        ? c.planDoneBehind(behind)
        : finished
          ? c.planOverDone
          : c.planDone;
    const nextHref = firstPending
      ? readHref(firstPending.materialId, firstPending.topicIndex)
      : next
        ? readHref(material.id, nextIndex)
        : practiceHref(material.id);
    return {
      locale,
      mode,
      personaje: daysLeft! <= 2 ? 'birrete' : pending.length === 0 ? 'feliz' : 'concentrado',
      greeting: catchUp ? c.catchUpGreeting(behind, name) : c.planGreeting(pending.length, name),
      card: {
        kind: 'plan',
        text,
        dayNumber,
        totalDays: days.length,
        behind,
        finished,
        primary: { label: firstPending ? c.start : c.keepStudying, href: nextHref },
        secondary: { label: c.seePlan, href: '/dashboard/plan-de-estudio' },
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
      ? c.readyDone(percent)
      : missing.length
        ? c.readyMissing(percent, missing)
        : c.readyWeak(percent);
    const tasks: HomeTask[] = next
      ? [{ id: `next:${nextIndex}`, title: c.readTask(next.title), meta: c.summaryMeta(next.minutes), href: readHref(material.id, nextIndex), done: null }]
      : [practiceTask()];
    return {
      locale,
      mode,
      personaje: daysLeft! <= 2 ? 'birrete' : 'concentrado',
      greeting: c.examGreeting(daysLeft!, title, name),
      card: {
        kind: 'preparacion',
        text,
        percent,
        good,
        weak,
        unseen,
        primary: { label: c.practiceMissing, href: next ? readHref(material.id, nextIndex) : practiceHref(material.id) },
        secondary: { label: c.seeTopics, href: `/materiales/${material.id}?tab=resumen` },
      },
      agenda: { tasks, askDate: null, exam: examRow, planCta: { href: `/dashboard/plan-de-estudio?material=${material.id}` }, exams },
    };
  }

  // Sin fecha de examen.
  const askDate = { materialId: material.id, materialTitle: title };
  if (total === 0) {
    return {
      locale,
      mode,
      personaje: 'contento',
      greeting: c.readyNotes(title, name),
      card: {
        kind: 'retomar',
        text: c.openNotesText(title),
        segments: 0,
        done: 0,
        progressLabel: '',
        primary: { label: c.openNotes, href: `/materiales/${material.id}` },
      },
      agenda: { tasks: [], askDate, exam: null, planCta: null, exams },
    };
  }

  if (!started) {
    const first = topics[0];
    return {
      locale,
      mode,
      personaje: 'contento',
      greeting: c.readyNotes(title, name),
      card: {
        kind: 'empezar',
        text: c.startText(first.title, total, first.minutes),
        segments: total,
        done: 0,
        progressLabel: c.progress(0, total),
        primary: { label: c.start, href: readHref(material.id, 0) },
        secondary: { label: c.seeWhatIKnow, href: practiceHref(material.id) },
      },
      agenda: {
        tasks: [{ id: 'next:0', title: c.firstTask(title), meta: c.topicMeta(first.title, first.minutes), href: readHref(material.id, 0), done: null }],
        askDate,
        exam: null,
        planCta: null,
        exams,
      },
    };
  }

  const remaining = total - read.size;
  const half = Boolean(next && touched.has(nextIndex) && !read.has(nextIndex));
  const text = !next
    ? c.allReadText(total, title)
    : half
      ? c.halfText(next.title, next.minutes)
      : c.nextText(next.title, next.minutes);
  return {
    locale,
    mode,
    personaje: next ? 'concentrado' : 'feliz',
    greeting: next ? c.leftGreeting(remaining, title, name) : c.allReadGreeting(title, name),
    card: {
      kind: 'retomar',
      text,
      segments: total,
      done: read.size,
      progressLabel: c.progress(read.size, total),
      primary: next
        ? { label: c.continue, href: readHref(material.id, nextIndex) }
        : { label: c.practice, href: practiceHref(material.id) },
    },
    agenda: {
      tasks: next
        ? [{ id: `next:${nextIndex}`, title: half ? c.finishTask(next.title) : c.readTask(next.title), meta: c.summaryMeta(next.minutes), href: readHref(material.id, nextIndex), done: null }]
        : [practiceTask()],
      askDate,
      exam: null,
      planCta: null,
      exams,
    },
  };
}
