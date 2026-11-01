'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { StudentMaterialFlashcards } from '@/components/student-material-flashcards';
import { MIN_CASES_PER_PRACTICE, normalizedAnswer, type PracticePair } from '@/lib/student-materials/practice-modes';
import type { StudyFlashcard } from '@/lib/student-materials/pedagogy';

export function PracticeFlashcardSession({ materialId, cards }: {
  materialId: string; cards: StudyFlashcard[];
}) {
  const [supplement, setSupplement] = useState<StudyFlashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const tries = useRef(0);
  const combined = useMemo(() => {
    const seen = new Set<string>();
    const seenAnswers = new Set<string>();
    return [...cards, ...supplement].filter(card => {
      if (card.front.trim().length < 8 || card.back.trim().length < 20) return false;
      const key = normalizedAnswer(card.front);
      const answer = normalizedAnswer(card.back);
      if (seen.has(key) || seenAnswers.has(answer)) return false;
      seen.add(key); seenAnswers.add(answer);
      return true;
    });
  }, [cards, supplement]);
  const fetchMore = useCallback(async () => {
    if (busy.current || tries.current >= 6) return;
    busy.current = true; tries.current++;
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/practice/supplement', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          materialId,mode:'flashcards',round:tries.current-1,
          excludedTerms: combined.map(card => card.front.match(/“([^”]+)”/)?.[1] ?? '').filter(Boolean),
        }), signal:AbortSignal.timeout(65000),
      });
      const body: unknown = await response.json();
      if (!response.ok || !body || typeof body !== 'object' ||
          !('pairs' in body) || !Array.isArray(body.pairs)) throw new Error('unavailable');
      const newCards: StudyFlashcard[] = (body.pairs as PracticePair[]).map(pair => ({
        front:'¿Qué significa “'+pair.term+'”?', back:pair.definition,level:'recordar',
        kind:'concept',reference:{
          pageStart:pair.pageStart ?? null,pageEnd:pair.pageStart ?? null,
          sectionTitle:pair.chapterTitle ?? null,
          excerpt:pair.definition,
        },
      }));
      const known = new Set(combined.map(card=>normalizedAnswer(card.front)));
      const fresh = newCards.filter(card=>!known.has(normalizedAnswer(card.front)));
      if (!fresh.length) {
        setError('El documento no aporta suficientes tarjetas nuevas y verificables para completar seis.');
      } else setSupplement(old=>[...old,...fresh]);
    } catch {
      setError('No pudimos completar las flashcards con evidencia suficiente. Podés reintentar.');
    } finally {
      busy.current=false;setLoading(false);
    }
  },[materialId,combined]);
  useEffect(()=>{
    if (combined.length >= MIN_CASES_PER_PRACTICE || error || loading ||
        busy.current || tries.current >= 6) return;
    void fetchMore();
  },[combined.length,error,loading,fetchMore]);

  if (combined.length < MIN_CASES_PER_PRACTICE) return (
    <main className="mx-auto max-w-[780px] px-4 py-7">
      <Link href="/dashboard/practicar" className="text-sm text-slate-500">← Volver a Practicar</Link>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-lg font-medium text-slate-900">Preparando tus flashcards</h1>
        <p className="mt-2 text-sm text-slate-600">{combined.length} de {MIN_CASES_PER_PRACTICE} tarjetas verificadas.</p>
        {loading ? <p className="mt-2 text-sm text-slate-500" role="status">Buscando conceptos del material…</p> : null}
        {error ? <p role="status" className="mt-2 text-sm text-amber-800">{error}</p> : null}
        {!loading ? <button onClick={() => {tries.current=0;void fetchMore();}}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white">Reintentar</button> : null}
      </section>
    </main>
  );
  return <main className="mx-auto max-w-[960px] px-4 py-7">
    <Link href="/dashboard/practicar" className="text-sm text-slate-500">← Volver a Practicar</Link>
    <StudentMaterialFlashcards key={combined.length} cards={combined} materialId={materialId}/>
  </main>;
}
