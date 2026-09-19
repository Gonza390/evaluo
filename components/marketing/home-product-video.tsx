'use client';

import { useRef } from 'react';
import { PlayCircle, UploadCloud } from 'lucide-react';
import { TrackedLink } from '@/components/marketing/tracked-link';
import { trackMarketingEvent } from '@/lib/marketing-analytics';

const milestones = [25, 50, 75] as const;

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
      className="scroll-mt-24 border-b border-slate-100 bg-white py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.16em] text-indigo-700 uppercase">
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
            Ver cómo funciona
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-slate-950 sm:text-4xl lg:text-[46px] lg:leading-[1.05]">
            Mirá cómo estudiarías tu PDF.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
            De tus apuntes al repaso y la práctica, en 30 segundos.
          </p>
        </div>

        <div className="relative mx-auto mt-10 max-w-[1000px]">
          <div className="pointer-events-none absolute -inset-8 rounded-[42px] bg-[radial-gradient(circle_at_50%_30%,rgba(99,102,241,0.13),transparent_62%)] blur-2xl" />
          <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 shadow-[0_28px_80px_rgba(15,23,42,0.16)] sm:rounded-[30px]">
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

        <div className="mt-8 flex flex-col items-center gap-3">
          <TrackedLink
            href={primaryHref}
            eventName="cta_click"
            payload={{
              location: 'home_product_video',
              cta_name: 'probar_con_mi_pdf_video',
              destination: primaryHref,
            }}
            className="from-brand to-brand-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <UploadCloud className="h-4 w-4" aria-hidden="true" />
            Probar con mi PDF
          </TrackedLink>
          <p className="text-[11px] font-semibold text-slate-500">Empezá gratis · Sin tarjeta</p>
        </div>
      </div>
    </section>
  );
}
