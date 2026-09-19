'use client';

import { useRef } from 'react';
import { ArrowRight, CheckCircle2, PlayCircle, UploadCloud } from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const milestones = [25, 50, 75] as const;

const videoSteps = [
  'Subí el PDF que tenés que estudiar.',
  'Convertílo en distintas formas de repaso.',
  'Practicá y detectá qué conviene reforzar.',
] as const;

export function HomeProductVideo({ primaryHref }: { primaryHref: string }) {
  const sentMilestones = useRef(new Set<number>());

  function trackProgress(video: HTMLVideoElement) {
    if (!video.duration || !Number.isFinite(video.duration)) return;
    const progress = (video.currentTime / video.duration) * 100;

    for (const milestone of milestones) {
      if (progress >= milestone && !sentMilestones.current.has(milestone)) {
        sentMilestones.current.add(milestone);
        trackMarketingEvent('home_product_video_progress', {
          location: 'home_product_video',
          progress_percent: milestone,
        });
      }
    }
  }

  return (
    <section
      id="video"
      className="scroll-mt-24 border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-14 lg:px-10">
        <div className="min-w-0">
          <div className="flex items-center gap-3 text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
            </span>
            Ver cómo funciona
          </div>

          <h2 className="mt-5 max-w-[520px] text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-[46px] lg:leading-[1.04]">
            Mirá cómo estudiarías tu PDF.
          </h2>

          <p className="mt-5 max-w-[520px] text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            Ves cómo el mismo material pasa de tus apuntes al repaso y la práctica, sin dejar de ser la fuente.
          </p>

          <div className="mt-7 border-y border-slate-200 py-2">
            {videoSteps.map((step) => (
              <div key={step} className="flex items-start gap-3 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                <p className="text-xs leading-5 font-semibold text-slate-700 sm:text-[13px]">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col items-start gap-3">
            <TrackedLink
              href={primaryHref}
              eventName="cta_click"
              payload={{
                location: 'home_product_video',
                cta_name: 'probar_con_mi_pdf_video',
                destination: primaryHref,
              }}
              className="from-brand to-brand-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-auto"
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              Probar con mi PDF
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedLink>
            <p className="text-[11px] font-semibold text-slate-500">Empezá gratis · Sin tarjeta</p>
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="pointer-events-none absolute -inset-8 rounded-[42px] bg-[radial-gradient(circle_at_55%_35%,rgba(99,102,241,0.16),transparent_60%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 shadow-[0_30px_84px_rgba(15,23,42,0.18)] sm:rounded-[30px]">
            <div className="flex items-center gap-2 border-b border-white/10 bg-slate-950 px-4 py-3 sm:px-5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold tracking-[0.12em] text-white/70 uppercase">
                Recorrido real
              </span>
            </div>

            <video
              className="aspect-video w-full bg-slate-950 object-contain"
              controls
              playsInline
              preload="metadata"
              poster="https://d2ol7oe51mr4n9.cloudfront.net/user_3IRt4tXV383V8Ui3tAw27Nrw3e2/ed16bd28-41f8-41cf-bf34-d40adc339efa.jpg"
              aria-label="Recorrido de 30 segundos por el estudio de un PDF en Evaluo"
              onPlay={() =>
                trackMarketingEvent('home_product_video_play', {
                  location: 'home_product_video',
                })
              }
              onTimeUpdate={(event) => trackProgress(event.currentTarget)}
              onEnded={() =>
                trackMarketingEvent('home_product_video_complete', {
                  location: 'home_product_video',
                })
              }
            >
              <source
                src="https://d2ol7oe51mr4n9.cloudfront.net/user_3IRt4tXV383V8Ui3tAw27Nrw3e2/f50741ae-354a-4e53-a5b9-0bce46b4a9e0.mp4"
                type="video/mp4"
              />
              Tu navegador no puede reproducir este video.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
