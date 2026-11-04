import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClientServer } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { ensureStudentMaterialStudyArtifacts } from '@/lib/student-material-summary';
import { loadOrBuildPedagogicalArtifacts } from '@/lib/data/student-material-pedagogical-cache';
import { tagGlossaryChapters } from '@/lib/student-materials/topic-study-resources';
import { PracticeSession } from '@/components/dashboard/practice-session';
import { PracticeFlashcardSession } from '@/components/dashboard/practice-flashcard-session';
import { buildSourceBackedCases } from '@/lib/student-materials/practice-modes';
import { appliesFreeStudyV2, FREE_STUDY_V2 } from '@/lib/free-study-v2';
import { hasPremiumAccess } from '@/lib/premium';
import { claimFreeStudyUnlock, type FreeStudyUnlockKind } from '@/lib/free-study-v2-server';

import {
  PRACTICE_BANK_VERSION, safePracticeBank, sourceFingerprint,
} from '@/lib/student-materials/practice-on-demand';
import type { CanonicalPedagogicalModel } from '@/lib/student-materials/types';

/**
 * Server-only source-backed unlock. Only verified material items become reusable.
 * All limits belong to the account and persist after deleting a material.
 */
async function firstFreeItems<T>(args: {
  userId: string; materialId: string; kind: FreeStudyUnlockKind;
  items: T[]; limit: number; keyPrefix: string;
}): Promise<T[]> {
  const selected: T[] = [];
  for (const [index, item] of args.items.entries()) {
    if (selected.length >= args.limit) break;
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

export default async function PracticeModePage({ params, searchParams }: { params: Promise<{ id: string; mode: string }>; searchParams: Promise<{ repaso?: string; planTopic?: string }> }) {
  const { id, mode } = await params;
  const { repaso, planTopic } = await searchParams;
  const planTopicIndex = planTopic !== undefined && /^\\d{1,3}$/.test(planTopic) ? Number(planTopic) : undefined;
  const reviewLength = repaso === 'rapido' ? 'rapido' : 'completo';
  const supported = ['unir', 'completar', 'casos', 'mixto', 'simulacro', 'opciones', 'flashcards'];
  if (!supported.includes(mode) || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=' + encodeURIComponent('/dashboard/practicar/' + id + '/' + mode));
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
    return <main className="mx-auto max-w-3xl p-6"><p>El material todavía se está preparando.</p><Link className="text-blue-600 underline" href="/dashboard/practicar">Volver a Practicar</Link></main>;
  }
  const glossary = tagGlossaryChapters(studyGlossary, studySummary.sections);
  const freeV2 = appliesFreeStudyV2(await hasPremiumAccess(user.id));
  if (freeV2 && (mode === 'completar' || mode === 'mixto')) {
    return <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold">Esta modalidad no está incluida en Free</h1>
      <p className="mt-2 text-sm text-slate-600">Podés usar las actividades disponibles con tu material.</p>
      <Link href="/dashboard/practicar" className="mt-4 inline-block text-blue-600 underline">Volver a Practicar</Link>
    </main>;
  }
  const artifacts = await loadOrBuildPedagogicalArtifacts({
    admin, materialId: material.id, summary: studySummary, glossary,
  });
  // No consumir flashcards al abrir Casos, Simulacro, Opciones o Unir.
  // El estudiante gasta el cupo sólo si entra efectivamente a Flashcards.
  if (mode === 'flashcards') {
    const freeFlashcards = freeV2
      ? await firstFreeItems({
        userId: user.id, materialId: material.id, kind: 'flashcard',
        items: artifacts.flashcards, limit: FREE_STUDY_V2.flashcards, keyPrefix: 'flashcard',
      })
      : artifacts.flashcards;
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
  const sourceQuestions = artifacts.questions.filter(q =>
    q.type === 'multiple_choice' && q.options.length >= 2
  ).map(q => ({
    id: q.id, prompt: q.prompt, options: q.options, answer: q.answer,
    explanation: q.explanation, level: q.level, pageStart: q.reference.pageStart,
    chapterTitle: q.chapterTitle ?? null, kind: q.kind ?? undefined,
  }));
  const freeQuestions = freeV2 && mode === 'mixto'
    ? await firstFreeItems({
      userId:user.id, materialId:material.id, kind:'multiple_choice',
      items:sourceQuestions, limit:FREE_STUDY_V2.multipleChoice, keyPrefix:'question',
    }) : sourceQuestions;
  if (freeV2 && mode === 'unir') {
    const matching = await claimFreeStudyUnlock({
      userId:user.id,materialId:material.id,kind:'matching_round',
      itemKey:material.id + ':matching:first',premium:false,
    });
    if (!matching.allowed) {
      return <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">Completaste la ronda gratuita de unir conceptos</h1>
        <p className="mt-2 text-sm text-slate-600">Ya completaste tu ronda gratuita. Podés volver a repasar los conceptos guardados.</p>
        <Link href="/dashboard/practicar" className="mt-4 inline-block text-blue-600 underline">Volver a Practicar</Link>
      </main>;
    }
  }
  if (freeV2 && mode === 'simulacro') {
    const simulator = await claimFreeStudyUnlock({
      userId:user.id,materialId:material.id,kind:'simulator',
      itemKey:material.id + ':simulator:first',premium:false,
    });
    if (!simulator.allowed) {
      return <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">Ya utilizaste tu simulacro gratuito</h1>
        <Link href="/dashboard/practicar" className="mt-4 inline-block text-blue-600 underline">Volver a Practicar</Link>
      </main>;
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
    materialId={material.id} materialTitle={material.title} reviewLength={reviewLength} planTopicIndex={planTopicIndex} cases={freeV2 ? cases : savedBank?.cases.length ? savedBank.cases : cases}
    aiAvailable={true}
    isWord={material.file_name.toLowerCase().endsWith('.docx')}
    glossary={(freeV2 ? glossary.slice(0, FREE_STUDY_V2.matchingPairs) : glossary)
      .map(item => ({ term: item.term, definition: item.definition,
        chapterTitle: item.chapterTitle ?? null, englishTerm: item.englishTerm ?? null }))}
    questions={freeV2 && mode !== 'simulacro'
      ? (mode === 'mixto' ? freeQuestions : []) : savedBank?.questions.length ? savedBank.questions : sourceQuestions} />;
}
