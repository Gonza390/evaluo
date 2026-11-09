'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, ClipboardCheck, History, Target, Upload } from 'lucide-react';
import { Personaje } from '@/components/brand/personaje';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { READY_TARGET, type HomeView } from '@/lib/dashboard-home-model';

const primaryButton =
  'inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#4070be] px-3.5 text-ui font-semibold text-white transition-colors hover:bg-[#3361ac]';
const secondaryButton =
  'inline-flex h-9 items-center rounded-[10px] px-2.5 text-ui font-semibold text-blue-700 transition-colors hover:bg-blue-50';

function Segments({ total, done, today, en }: { total: number; done: number; today?: number; en: boolean }) {
  if (total < 1) return null;
  return (
    <div
      className="mt-3.5 grid gap-1"
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      role="img"
      aria-label={en ? `${done} of ${total}` : `${done} de ${total}`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-1 rounded-full ${index < done ? 'bg-blue-500' : index === today ? 'bg-blue-200' : 'bg-slate-200'}`}
        />
      ))}
    </div>
  );
}

function CardIcon({ kind }: { kind: HomeView['card']['kind'] }) {
  const Icon = kind === 'empezar' ? BookOpen : kind === 'preparacion' ? Target : kind === 'plan' ? ClipboardCheck : History;
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-blue-50 text-blue-700 sm:size-10 sm:rounded-xl">
      <Icon className="size-[18px]" aria-hidden="true" />
    </span>
  );
}

export function HomeHero({ view, onUploadClick }: { view: HomeView; onUploadClick: () => void }) {
  const { card } = view;
  const en = view.locale === 'en';
  const track = (cta: string, destination: string) => () =>
    trackMarketingEvent('cta_click', { location: 'dashboard_home_card', cta_name: cta, destination });

  return (
    <section className="flex flex-col items-center lg:pt-3" aria-labelledby="home-greeting">
      <div className="size-14 lg:size-[72px]">
        <Personaje estado={view.personaje} className="h-full w-full" />
      </div>
      <h1
        id="home-greeting"
        className="mt-2 max-w-[560px] text-center text-titulo font-bold tracking-titulo text-balance text-[#0b0c1e] lg:mt-3 lg:text-destacado"
      >
        {view.greeting}
      </h1>

      <div className="mt-4 w-full max-w-[560px] rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 text-slate-950 sm:rounded-[20px] sm:px-5 lg:mt-5">
        <div className="flex items-start gap-3">
          <CardIcon kind={card.kind} />
          <div className="min-w-0 flex-1 self-center text-cuerpo leading-[1.4] font-medium tracking-[-0.01em] text-slate-950 sm:text-subtitulo">{card.text}</div>
        </div>

        {card.kind === 'empezar' || card.kind === 'retomar' ? <Segments total={card.segments} done={card.done} en={en} /> : null}
        {card.kind === 'plan' ? (
          <Segments
            total={card.totalDays}
            done={card.finished ? card.totalDays : card.dayNumber - 1}
            today={card.finished ? undefined : card.dayNumber - 1}
            en={en}
          />
        ) : null}

        {card.kind === 'preparacion' ? (
          <>
            <div className="relative mt-4 h-2 rounded-full bg-slate-200/80" role="img" aria-label={en ? `${card.percent}% ready. The goal is ${READY_TARGET}%.` : `${card.percent}% listo. La meta es ${READY_TARGET}%.`}>
              <div className="absolute inset-y-0 left-0 rounded-full bg-blue-500" style={{ width: `${Math.min(100, card.percent)}%` }} />
              <div className="absolute -inset-y-1 w-0.5 rounded-sm bg-slate-700" style={{ left: `${READY_TARGET}%` }} />
            </div>
            <div className="relative mt-2 h-4 text-chico text-slate-500" aria-hidden="true">
              <span className="absolute left-0">{card.percent}% {en ? 'today' : 'hoy'}</span>
              <span className="absolute -translate-x-1/2 font-semibold text-slate-700" style={{ left: `${READY_TARGET}%` }}>{en ? 'Ready' : 'Listo'}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-chico font-medium text-emerald-800">
                <span className="size-[7px] rounded-full bg-emerald-500" aria-hidden="true" />
                {card.good} {en ? (card.good === 1 ? 'topic solid' : 'topics solid') : card.good === 1 ? 'tema bien' : 'temas bien'}
              </span>
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 text-chico font-medium text-amber-800">
                <span className="size-[7px] rounded-full bg-amber-500" aria-hidden="true" />
                {card.weak} {en ? 'weak' : card.weak === 1 ? 'flojo' : 'flojos'}
              </span>
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-chico font-medium text-slate-600">
                <span className="size-[7px] rounded-full bg-slate-400" aria-hidden="true" />
                {card.unseen} {en ? 'not started' : 'sin ver'}
              </span>
            </div>
          </>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
          <span className="text-chico text-slate-500">
            {card.kind === 'empezar' || card.kind === 'retomar' ? card.progressLabel : null}
            {card.kind === 'plan' ? (
              <>
                {card.finished
                  ? en ? 'Plan finished' : 'Terminó el plan'
                  : en ? `Day ${card.dayNumber} of ${card.totalDays}` : `Día ${card.dayNumber} de ${card.totalDays} del plan`} ·{' '}
                {card.behind > 0 ? (
                  <b className="font-semibold text-amber-800">{en ? `${card.behind} ${card.behind === 1 ? 'topic' : 'topics'} behind` : card.behind === 1 ? 'te atrasaste 1 tema' : `te atrasaste ${card.behind} temas`}</b>
                ) : (
                  <b className="font-semibold text-emerald-800">{en ? 'on track' : 'vas al día'}</b>
                )}
              </>
            ) : null}
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            {'secondary' in card ? (
              <Link href={card.secondary.href} onClick={track(card.secondary.label, card.secondary.href)} className={secondaryButton}>
                {card.secondary.label}
              </Link>
            ) : null}
            <Link href={card.primary.href} onClick={track(card.primary.label, card.primary.href)} className={primaryButton}>
              {card.primary.label}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onUploadClick}
        className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-chico font-semibold text-slate-500 transition-colors hover:text-slate-900"
      >
        <Upload className="size-3.5" aria-hidden="true" />
        {en ? 'Upload another PDF' : 'Subir otro PDF'}
      </button>
    </section>
  );
}
