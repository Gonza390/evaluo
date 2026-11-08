'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, ClipboardCheck, History, Target, Upload } from 'lucide-react';
import { Personaje } from '@/components/brand/personaje';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { READY_TARGET, type HomeView } from '@/lib/dashboard-home-model';

const primaryButton =
  'inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#4070be] px-4 text-ui font-semibold text-white transition-colors hover:bg-[#3361ac]';
const secondaryButton =
  'inline-flex h-10 items-center rounded-xl px-3 text-ui font-semibold text-blue-700 transition-colors hover:bg-blue-50';

function Segments({ total, done, today }: { total: number; done: number; today?: number }) {
  if (total < 1) return null;
  return (
    <div
      className="mt-4 grid gap-1 sm:mt-5 sm:gap-1.5"
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
      role="img"
      aria-label={`${done} de ${total}`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-1.5 rounded-full ${index < done ? 'bg-blue-500' : index === today ? 'bg-blue-200' : 'bg-slate-200'}`}
        />
      ))}
    </div>
  );
}

function CardIcon({ kind }: { kind: HomeView['card']['kind'] }) {
  const Icon = kind === 'empezar' ? BookOpen : kind === 'preparacion' ? Target : kind === 'plan' ? ClipboardCheck : History;
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:size-[52px] sm:rounded-[14px]">
      <Icon className="size-5 sm:size-[22px]" aria-hidden="true" />
    </span>
  );
}

export function HomeHero({ view, onUploadClick }: { view: HomeView; onUploadClick: () => void }) {
  const { card } = view;
  const track = (cta: string, destination: string) => () =>
    trackMarketingEvent('cta_click', { location: 'dashboard_home_card', cta_name: cta, destination });

  return (
    <section className="flex flex-col items-center lg:pt-7" aria-labelledby="home-greeting">
      <div className="size-[72px] lg:size-[104px]">
        <Personaje estado={view.personaje} className="h-full w-full" />
      </div>
      <h1
        id="home-greeting"
        className="mt-2.5 max-w-[620px] text-center text-destacado font-bold tracking-saludo text-balance text-[#0b0c1e] lg:mt-3.5 lg:text-saludo"
      >
        {view.greeting}
      </h1>

      <div className="mt-5 w-full max-w-[620px] rounded-[20px] border border-slate-200/80 bg-slate-50/50 p-4 text-slate-950 sm:rounded-3xl sm:px-6 sm:py-[22px] lg:mt-7">
        <div className="flex items-start gap-3 sm:gap-4">
          <CardIcon kind={card.kind} />
          <p className="min-w-0 flex-1 text-subtitulo leading-[1.35] font-medium tracking-[-0.02em] text-slate-950 sm:text-titulo-sm">{card.text}</p>
        </div>

        {card.kind === 'empezar' || card.kind === 'retomar' ? <Segments total={card.segments} done={card.done} /> : null}
        {card.kind === 'plan' ? <Segments total={card.totalDays} done={card.dayNumber - 1} today={card.dayNumber - 1} /> : null}

        {card.kind === 'preparacion' ? (
          <>
            <div className="relative mt-5 h-2.5 rounded-full bg-slate-200/80" role="img" aria-label={`${card.percent}% listo. La meta es ${READY_TARGET}%.`}>
              <div className="absolute inset-y-0 left-0 rounded-full bg-blue-500" style={{ width: `${Math.min(100, card.percent)}%` }} />
              <div className="absolute -inset-y-1.5 w-0.5 rounded-sm bg-slate-700" style={{ left: `${READY_TARGET}%` }} />
            </div>
            <div className="relative mt-2 h-4 text-chico text-slate-500" aria-hidden="true">
              <span className="absolute left-0">{card.percent}% hoy</span>
              <span className="absolute -translate-x-1/2 font-semibold text-slate-700" style={{ left: `${READY_TARGET}%` }}>Listo</span>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-chico font-medium text-emerald-800">
                <span className="size-[7px] rounded-full bg-emerald-500" aria-hidden="true" />
                {card.good} {card.good === 1 ? 'tema bien' : 'temas bien'}
              </span>
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 text-chico font-medium text-amber-800">
                <span className="size-[7px] rounded-full bg-amber-500" aria-hidden="true" />
                {card.weak} {card.weak === 1 ? 'flojo' : 'flojos'}
              </span>
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-chico font-medium text-slate-600">
                <span className="size-[7px] rounded-full bg-slate-400" aria-hidden="true" />
                {card.unseen} sin ver
              </span>
            </div>
          </>
        ) : null}

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-chico text-slate-500 sm:text-ui">
            {card.kind === 'empezar' || card.kind === 'retomar' ? card.progressLabel : null}
            {card.kind === 'plan' ? (
              <>
                Día {card.dayNumber} de {card.totalDays} del plan ·{' '}
                {card.behind > 0 ? (
                  <b className="font-semibold text-amber-800">{card.behind === 1 ? 'te atrasaste 1 tema' : `te atrasaste ${card.behind} temas`}</b>
                ) : (
                  <b className="font-semibold text-emerald-800">vas al día</b>
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
        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-ui font-semibold text-slate-500 transition-colors hover:text-slate-900"
      >
        <Upload className="size-4" aria-hidden="true" />
        Subir otro PDF
      </button>
    </section>
  );
}
