'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { premiumDashboardHref } from '@/lib/premium-flow';

const SOURCE = 'material_mapa_mental';

type Props = {
  /** Nodo central: título del apunte. */
  centerTitle: string;
  /** Temas reales del PDF; se muestran desenfocados como adelanto. */
  topics: string[];
  materiaId?: string | null;
  english?: boolean;
};

/**
 * Bloqueo del mapa mental dentro de su pestaña (no pantalla completa):
 * mismo lenguaje visual que las pantallas de límite con Evi, pero compacto,
 * porque las pestañas del visor siguen visibles y no hace falta "Volver".
 */
export function MindMapPremiumGate({ centerTitle, topics, materiaId, english = false }: Props) {
  const router = useRouter();
  const t = (es: string, en: string) => (english ? en : es);

  const fallback = english
    ? ['Key concepts', 'Definitions', 'Examples', 'Relationships']
    : ['Conceptos clave', 'Definiciones', 'Ejemplos', 'Relaciones'];
  const nodes = (topics.filter(Boolean).length > 0 ? topics.filter(Boolean) : fallback).slice(0, 6);
  const left = nodes.filter((_, index) => index % 2 === 0);
  const right = nodes.filter((_, index) => index % 2 === 1);

  useEffect(() => {
    trackMarketingEvent('premium_gate_viewed', {
      source: SOURCE,
      materia_id: materiaId ?? undefined,
    });
  }, [materiaId]);

  const handleUpgrade = () => {
    trackMarketingEvent('premium_cta_clicked', {
      source: SOURCE,
      materia_id: materiaId ?? undefined,
    });
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'mapa');
    router.push(
      premiumDashboardHref({
        source: SOURCE,
        materiaId,
        returnTo: `${url.pathname}${url.search}${url.hash}`,
      })
    );
  };

  const node = (label: string) => (
    <span
      key={label}
      className="block truncate rounded-xl border-2 border-[#cfdcf5] bg-white px-3 py-2 text-center text-[13px] font-semibold text-[#2a5193]"
    >
      {label}
    </span>
  );

  return (
    <section
      data-premium-gate="mind-map"
      className="flex flex-col items-center gap-3 rounded-[18px] border border-[#e3e8f1] bg-white px-4 py-[22px] text-center sm:px-8 sm:pt-7 sm:pb-[30px]"
    >
      <Image
        src="/evi-practica-limite.svg"
        alt=""
        width={72}
        height={72}
        className="size-16 object-contain sm:size-[72px]"
      />
      <h2 className="max-w-[420px] text-xl leading-tight font-extrabold tracking-[-0.01em] text-[#14213d] sm:text-[22px]">
        {t('El mapa mental se desbloquea con Premium', 'Mind maps unlock with Premium')}
      </h2>
      <p className="max-w-[400px] text-sm leading-normal text-[#4f5b6e] sm:text-[15px]">
        {t(
          'Mirá todos los temas de tu apunte conectados en un solo vistazo.',
          'See every topic in your notes connected at a glance.'
        )}
      </p>

      <div className="relative mt-1 w-full max-w-[560px] overflow-hidden rounded-[14px] border border-[#e3e8f1] bg-[#f5f8fd]">
        <div
          aria-hidden="true"
          className="pointer-events-none grid grid-cols-2 items-center gap-2.5 p-4 opacity-85 blur-[3px] select-none sm:grid-cols-[1fr_auto_1fr] sm:gap-4 sm:px-6 sm:py-5"
        >
          <div className="col-span-2 mx-auto max-w-[220px] truncate rounded-[14px] bg-[#3c6cba] px-4 py-3 text-sm font-bold text-white sm:order-2 sm:col-span-1">
            {centerTitle}
          </div>
          <div className="flex min-w-0 flex-col gap-2.5 sm:order-1">{left.map(node)}</div>
          <div className="flex min-w-0 flex-col gap-2.5 sm:order-3">{right.map(node)}</div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-[7px] rounded-full border border-[#cfdcf5] bg-white px-3.5 py-2 text-[13px] font-bold text-[#2a5193] shadow-[0_4px_14px_rgba(42,81,147,0.14)]">
            <LockKeyhole className="size-[13px]" aria-hidden="true" />
            {t('Se desbloquea con Premium', 'Unlocks with Premium')}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleUpgrade}
        className="mt-1 flex min-h-12 w-full max-w-[300px] items-center justify-center rounded-xl bg-[#3c6cba] text-[15px] font-bold text-white transition hover:bg-[#2a5193] focus-visible:ring-2 focus-visible:ring-[#3c6cba] focus-visible:ring-offset-2 focus-visible:outline-none sm:min-h-11 sm:max-w-[280px]"
      >
        {t('Pasar a Premium', 'Go Premium')}
      </button>
    </section>
  );
}
