import { notFound, redirect } from 'next/navigation';
import { requestAppLocale } from '@/lib/i18n/request-app-locale';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { ensureStudentMaterialStudyArtifacts } from '@/lib/student-material-summary';
import { loadOrBuildPedagogicalArtifacts } from '@/lib/data/student-material-pedagogical-cache';
import { tagGlossaryChapters } from '@/lib/student-materials/topic-study-resources';
import { PracticeSession } from '@/components/dashboard/practice-session';
import { PracticeFlashcardSession } from '@/components/dashboard/practice-flashcard-session';
import { buildSourceBackedCases, normalizedAnswer } from '@/lib/student-materials/practice-modes';
import { auditPracticeFlashcard } from '@/lib/student-materials/practice-card-quality';
import { appliesFreeStudyV2, FREE_STUDY_V2 } from '@/lib/free-study-v2';
import { hasPremiumAccess } from '@/lib/premium';
import { claimFreeStudyUnlock, listFreeStudyUnlockedKeys, type FreeStudyUnlockKind } from '@/lib/free-study-v2-server';
import { premiumUpgradeForLimit, safePremiumReturnTo } from '@/lib/premium-flow';
import { FreePracticeLimitScreen, type FreePracticeLimitKind } from '@/components/dashboard/free-practice-limit-screen';

import {
  PRACTICE_BANK_VERSION, safePracticeBank, sourceFingerprint,
} from '@/lib/student-materials/practice-on-demand';
import type { CanonicalPedagogicalModel } from '@/lib/student-materials/types';
import { getSessionUser } from '@/lib/auth-session';

/**
 * Server-only source-backed unlock. Only verified material items become reusable.
 * All limits belong to the account and persist after deleting a material.
 */
/** Rondas Free que se reclaman como sesión (una por cuenta). */
const FREE_SESSION_ROUNDS = {
  unir: { kind: 'matching_round', itemKey: 'matching:first', reason: 'matching_round' },
  simulacro: { kind: 'simulator', itemKey: 'simulator:first', reason: 'simulator' },
  completar: { kind: 'complete_round', itemKey: 'complete:first', reason: 'complete' },
  mixto: { kind: 'mixed_round', itemKey: 'mixed:first', reason: 'mixed' },
} as const satisfies Record<string, { kind: FreeStudyUnlockKind; itemKey: string; reason: FreePracticeLimitKind }>;
/** Preguntas de opción múltiple que entran en la ronda gratis de Mixto. */
const FREE_MIXED_QUESTIONS = 8;

async function firstFreeItems<T>(args: {
  userId: string; materialId: string; kind: FreeStudyUnlockKind;
  items: T[]; limit: number; keyPrefix: string;
  valid?: (item: T, originalIndex: number) => boolean;
}): Promise<T[]> {
  const selected: T[] = [];
  for (const [index, item] of args.items.entries()) {
    if (selected.length >= args.limit) break;
    // Rechazar contenido no estudiable antes del claim irreversible.
    if (args.valid && !args.valid(item, index)) continue;
    const claim = await claimFreeStudyUnlock({
      userId: args.userId,
      materialId: args.materialId,
      kind: args.kind,
      itemKey: args.materialId + ':' + (
        args.kind === 'flashcard' ? 'flashcard:' + index
        : args.kind === 'multiple_choice' || args.kind === 'case'
          ? String((item as { id?: string }).id ?? args.keyPrefix + ':' + index)
          : args.keyPrefix + ':' + index
      ),
      premium: false,
    });
    if (claim.allowed) selected.push(item);
  }
  return selected;
}

export default async function PracticeModePage({ params, searchParams }: { params: Promise<{ id: string; mode: string }>; searchParams: Promise<{ repaso?: string; planTopic?: string; returnTo?: string }> }) {
  const { id, mode } = await params;
  const { repaso, planTopic, returnTo } = await searchParams;
  const planTopicIndex = planTopic !== undefined && /^\d{1,3}$/.test(planTopic) ? Number(planTopic) : undefined;
  const reviewLength = repaso === 'rapido' ? 'rapido' : 'completo';
  const supported = ['unir', 'completar', 'casos', 'mixto', 'simulacro', 'opciones', 'flashcards'];
  if (!supported.includes(mode) || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClientServer();
  const user = await getSessionUser();
  if (!user) {
    const entryLocale = (await cookies()).get('evaluo_ui_locale')?.value;
    redirect((entryLocale === 'en' ? '/en/login' : '/login') + '?next=' + encodeURIComponent('/dashboard/practicar/' + id + '/' + mode));
  }
  const english = (await requestAppLocale(user.user_metadata)) === 'en';
  const { data: material } = await supabase.from('student_materials')
    .select('id,title,file_name,file_path,processing_status,content_fingerprint,pedagogical_artifacts_version')
    .eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!material || material.processing_status !== 'ready') notFound();

  const admin = createAdminClient();
  const { studySummary, studyGlossary } = await ensureStudentMaterialStudyArtifacts({
    admin, studentMaterialId: material.id, filePath: material.file_path,
    title: material.title, allowOnDemandRegeneration: false,
  });
  if (studySummary.status !== 'ready') {
    return <main className="mx-auto max-w-3xl p-6"><p>{english ? 'Your study material is still being prepared.' : 'El material todavía se está preparando.'}</p><Link className="text-blue-600 underline" href="/dashboard/practicar">{english ? 'Back to practice' : 'Volver a Practicar'}</Link></main>;
  }
  const glossary = tagGlossaryChapters(studyGlossary, studySummary.sections);
  const requestedBack = safePremiumReturnTo(returnTo);
  // Do not send a student back to the blocked exercise or an external origin.
  const backHref = requestedBack && !requestedBack.startsWith('/dashboard/premium') &&
    !requestedBack.startsWith('/dashboard/practicar/' + id + '/')
    ? requestedBack
    : planTopicIndex !== undefined
      ? '/materiales/' + id + '?tab=resumen&studyTopic=' + planTopicIndex
      : '/dashboard/practicar?materialId=' + id;
  const backLabel = english
    ? backHref.startsWith('/dashboard/plan-de-estudio') ? 'Back to study plan'
      : backHref.includes('tab=tarjetas') ? 'Back to flashcards'
      : backHref.includes('tab=ejercicios') ? 'Back to exercises'
      : backHref.startsWith('/materiales/') ? 'Back to topic'
      : backHref.startsWith('/dashboard') && !backHref.startsWith('/dashboard/practicar')
        ? 'Back to my study space' : 'Back to practice'
    : backHref.startsWith('/dashboard/plan-de-estudio') ? 'Volver al plan'
      : backHref.includes('tab=tarjetas') ? 'Volver a flashcards'
      : backHref.includes('tab=ejercicios') ? 'Volver a la práctica'
      : backHref.startsWith('/materiales/') ? 'Volver al tema'
      : backHref.startsWith('/dashboard') && !backHref.startsWith('/dashboard/practicar')
        ? 'Volver a Mi espacio' : 'Volver a Practicar';
  // Premium must take the student BACK TO THE INTENDED ACTIVITY after checkout.
  // The secondary button returns to the source screen instead.
  const practiceHref = '/dashboard/practicar/' + id + '/' + mode +
    '?repaso=' + reviewLength + (planTopicIndex !== undefined ? '&planTopic=' + planTopicIndex : '');
  const topicLabel = planTopicIndex !== undefined
    ? studySummary.sections[planTopicIndex]?.title : undefined;
  const exhausted = (kind: FreePracticeLimitKind) =>
    <FreePracticeLimitScreen kind={kind} materialTitle={material.title}
      topicLabel={topicLabel} backHref={backHref} backLabel={backLabel}
      premiumHref={premiumUpgradeForLimit(kind, {materialId:material.id, returnTo:practiceHref}).href}/>;

  const freeV2 = appliesFreeStudyV2(await hasPremiumAccess(user.id));
  const artifacts = await loadOrBuildPedagogicalArtifacts({
    admin, materialId: material.id, summary: studySummary, glossary,
  });
  // No consumir flashcards al abrir Casos, Simulacro, Opciones o Unir.
  // El estudiante gasta el cupo sólo si entra efectivamente a Flashcards.
  if (mode === 'flashcards') {
    // La cuota es por cuenta: no intentar generar tarjetas nuevas ni gastar IA
    // si las 25 están usadas en otros materiales.
    if (freeV2) {
      const keys = await listFreeStudyUnlockedKeys({
        userId:user.id, kind:'flashcard', premium:false,
      });
      if (keys && keys.size >= FREE_STUDY_V2.flashcards &&
          !Array.from(keys).some(key => key.startsWith(material.id + ':')))
        return exhausted('flashcard');
    }
    const seenPrompts = new Set<string>(), seenAnswers = new Set<string>();
    const freeFlashcards = freeV2
      ? await firstFreeItems({
        userId: user.id, materialId: material.id, kind: 'flashcard',
        items: artifacts.flashcards, limit: FREE_STUDY_V2.flashcards, keyPrefix: 'flashcard',
        valid: card => {
          if (!auditPracticeFlashcard(card).approved) return false;
          const prompt = normalizedAnswer(card.front), answer = normalizedAnswer(card.back);
          if (seenPrompts.has(prompt) || seenAnswers.has(answer)) return false;
          seenPrompts.add(prompt);
          seenAnswers.add(answer);
          return true;
        },
      })
      : artifacts.flashcards;
    if (freeV2 && artifacts.flashcards.length > 0 && freeFlashcards.length === 0)
      return exhausted('flashcard');
    return <PracticeFlashcardSession
      materialId={material.id} cards={freeFlashcards} reviewLength={reviewLength}
      freeV2={freeV2} planTopicIndex={planTopicIndex} />;
  }

  const { data: modelRow } = mode === 'casos' || mode === 'mixto'
    ? await admin.from('student_materials').select('pedagogical_model').eq('id', material.id).maybeSingle()
    : { data: null };
  const sourceCases = buildSourceBackedCases((modelRow?.pedagogical_model ?? null) as CanonicalPedagogicalModel | null);
  const cases = freeV2 && (mode === 'casos' || mode === 'mixto')
    ? await firstFreeItems({
      userId:user.id, materialId:material.id, kind:'case',
      items:sourceCases, limit:FREE_STUDY_V2.cases, keyPrefix:'case',
    }) : sourceCases;
  if (freeV2 && mode === 'casos' && sourceCases.length > 0 && cases.length === 0)
    return exhausted('case');

  // A fully consumed Free account may still repeat cards previously unlocked
  // for THIS material; do not show the upgrade screen in that case.
  if (freeV2 && mode === 'opciones') {
    const keys = await listFreeStudyUnlockedKeys({
      userId:user.id,kind:'true_false',premium:false,
    });
    if (keys && keys.size >= FREE_STUDY_V2.trueFalse &&
        !Array.from(keys).some(key => key.startsWith(material.id + ':')))
      return exhausted('true_false');
  }
  const sourceQuestions = artifacts.questions.filter(q =>
    q.type === 'multiple_choice' && q.options.length >= 2
  ).map(q => ({
    id: q.id, prompt: q.prompt, options: q.options, answer: q.answer,
    explanation: q.explanation, level: q.level, pageStart: q.reference.pageStart,
    chapterTitle: q.chapterTitle ?? null, kind: q.kind ?? undefined,
  }));
  // La ronda gratis de Mixto es independiente: usa preguntas verificadas de
  // este material sin descontar el cupo de opción múltiple. La protege el
  // claim 'mixed_round' (uno por cuenta), comprobado abajo antes de enviarlas.
  const freeQuestions = freeV2 && mode === 'mixto'
    ? sourceQuestions.slice(0, FREE_MIXED_QUESTIONS) : sourceQuestions;
  // Al abrir una ruta no se gasta una ronda ni un simulacro. Primero
  // comprobamos si el cupo está agotado en otro material. La ronda se reclama
  // al estar lista y el simulacro cuando el estudiante pulsa «Comenzar».
  if (freeV2 && (mode === 'unir' || mode === 'simulacro' || mode === 'completar' || mode === 'mixto')) {
    const session = FREE_SESSION_ROUNDS[mode];
    const keys = await listFreeStudyUnlockedKeys({
      userId:user.id,kind:session.kind,premium:false,
    });
    const ownedKey = material.id + ':' + session.itemKey;
    if (keys && keys.size >= 1 && !keys.has(ownedKey)) {
      return exhausted(session.reason);
    }
  }
  // A missing bank table during rollout is safe: keep the original source-backed practice.
  // Never modify the source model or the existing study artifacts.
  let savedBank = null as ReturnType<typeof safePracticeBank>;
  if (process.env.PRACTICE_BANK_ENABLED === '1') {
    const practiceDb = admin as unknown as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- optional additive practice table, not yet in generated Supabase types
      from: (table: string) => any;
    };
    const { data: bankRow, error: bankError } = await practiceDb
      .from('student_material_practice_banks')
      .select('payload,source_fingerprint')
      .eq('material_id', material.id)
      .eq('user_id', user.id)
      .eq('mode', mode)
      .eq('version', PRACTICE_BANK_VERSION)
      .maybeSingle();
    if (!bankError && bankRow && 'source_fingerprint' in bankRow && 'payload' in bankRow &&
        bankRow.source_fingerprint === sourceFingerprint(material.content_fingerprint, material.id, material.pedagogical_artifacts_version) + ':editorial:2:ai:' + String(process.env.PRACTICE_PEDAGOGICAL_AI_ENABLED === '1')) {
      savedBank = safePracticeBank(bankRow.payload);
    }
  }
  return <PracticeSession key={mode + ':' + id} mode={mode as 'unir' | 'completar' | 'casos' | 'mixto' | 'simulacro' | 'opciones'}
    freeV2={freeV2}
    quotaBackHref={backHref} quotaBackLabel={backLabel}
    quotaPremiumHref={freeV2 && ['unir','simulacro','casos','opciones','completar','mixto'].includes(mode)
      ? premiumUpgradeForLimit(mode === 'unir' ? 'matching_round'
        : mode === 'simulacro' ? 'simulator' : mode === 'casos' ? 'case'
        : mode === 'completar' ? 'complete' : mode === 'mixto' ? 'mixed' : 'true_false',
          {materialId:material.id, returnTo:practiceHref}).href : undefined}
    materialId={material.id} materialTitle={material.title} reviewLength={reviewLength} planTopicIndex={planTopicIndex} cases={freeV2 ? cases : savedBank?.cases.length ? savedBank.cases : cases}
    aiAvailable={true}
    isWord={material.file_name.toLowerCase().endsWith('.docx')}
    glossary={(freeV2 ? glossary.slice(0, FREE_STUDY_V2.matchingPairs) : glossary)
      .map(item => ({ term: item.term, definition: item.definition,
        chapterTitle: item.chapterTitle ?? null, englishTerm: item.englishTerm ?? null }))}
    questions={freeV2 && mode !== 'simulacro'
      ? (mode === 'mixto' ? freeQuestions : []) : savedBank?.questions.length ? savedBank.questions : sourceQuestions} />;
}
