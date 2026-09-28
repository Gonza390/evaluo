'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  MessageCircle,
  Shuffle,
} from 'lucide-react';
import {
  WHATSAPP_SHARE_VARIANTS,
  buildWhatsAppCampaignName,
  buildWhatsAppOpenUrl,
  buildWhatsAppShareCopy,
  buildWhatsAppTrackedUrl,
  type WhatsAppShareVariantId,
} from '@/lib/whatsapp-share';

type CopyState = 'message' | 'url' | null;

export default function WhatsAppShareClient({ baseOrigin }: { baseOrigin: string }) {
  const [materiaNombre, setMateriaNombre] = useState('');
  const [parcial, setParcial] = useState(1);
  const [destination, setDestination] = useState('');
  const [variantId, setVariantId] = useState<WhatsAppShareVariantId>('riesgo_preguntero');
  const [copyState, setCopyState] = useState<CopyState>(null);

  const campaignName = useMemo(
    () => buildWhatsAppCampaignName(materiaNombre || 'materia', parcial),
    [materiaNombre, parcial]
  );

  const trackedUrl = useMemo(() => {
    if (!destination.trim()) return '';

    try {
      return buildWhatsAppTrackedUrl({
        destination,
        materiaNombre: materiaNombre || 'materia',
        parcial,
        variantId,
        origin: baseOrigin,
      });
    } catch {
      return '';
    }
  }, [baseOrigin, destination, materiaNombre, parcial, variantId]);

  const message = useMemo(() => {
    if (!trackedUrl) return '';

    return buildWhatsAppShareCopy({
      materiaNombre,
      parcial,
      variantId,
      trackedUrl,
    });
  }, [materiaNombre, parcial, trackedUrl, variantId]);

  const selectedVariant = WHATSAPP_SHARE_VARIANTS.find((variant) => variant.id === variantId);
  const ready = Boolean(materiaNombre.trim() && trackedUrl);

  const copyText = async (value: string, type: Exclude<CopyState, null>) => {
    if (!value || !navigator.clipboard) return;

    await navigator.clipboard.writeText(value);
    setCopyState(type);
    window.setTimeout(() => setCopyState(null), 1800);
  };

  const rotateVariant = () => {
    const currentIndex = WHATSAPP_SHARE_VARIANTS.findIndex((variant) => variant.id === variantId);
    const next = WHATSAPP_SHARE_VARIANTS[(currentIndex + 1) % WHATSAPP_SHARE_VARIANTS.length];
    setVariantId(next.id);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.06)] sm:p-7">
        <div className="grid gap-5 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Materia</span>
            <input
              value={materiaNombre}
              onChange={(event) => setMateriaNombre(event.target.value)}
              placeholder="Ej: Marketing I"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Parcial</span>
            <select
              value={parcial}
              onChange={(event) => setParcial(Number(event.target.value))}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            >
              <option value={1}>Parcial 1</option>
              <option value={2}>Parcial 2</option>
              <option value={3}>Integrador</option>
            </select>
          </label>

          <label className="space-y-2 lg:col-span-1">
            <span className="text-sm font-semibold text-slate-700">Link del simulador</span>
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder={`${baseOrigin}/simulador/.../1`}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-900">
          Pegá el link limpio de Evaluo. La herramienta agrega los UTM automáticamente sin borrar parámetros existentes del simulador.
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.06)] sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">Variable de mensaje</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-slate-950">
              Elegí qué ángulo probar
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Cada variante queda identificada en <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">utm_content</code>.
            </p>
          </div>

          <button
            type="button"
            onClick={rotateVariant}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            <Shuffle className="h-4 w-4" />
            Siguiente variante
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {WHATSAPP_SHARE_VARIANTS.map((variant) => {
            const active = variant.id === variantId;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => setVariantId(variant.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? 'border-indigo-400 bg-indigo-50 shadow-[0_10px_30px_rgba(99,102,241,0.10)]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-[0.14em] ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {variant.angle}
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">{variant.name}</p>
                  </div>
                  {active ? <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-600" /> : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">{variant.description}</p>
                <p className="mt-3 text-xs font-mono text-slate-400">{variant.id}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Mensaje final</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
              {selectedVariant?.name ?? 'Vista previa'}
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {campaignName}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="min-h-[190px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 text-[15px] leading-7 text-slate-800">
            {ready
              ? message
              : 'Completá materia y link del simulador para generar el mensaje con tracking.'}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              disabled={!ready}
              onClick={() => void copyText(message, 'message')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copyState === 'message' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copyState === 'message' ? 'Copiado' : 'Copiar mensaje'}
            </button>

            <button
              type="button"
              disabled={!ready}
              onClick={() => window.open(buildWhatsAppOpenUrl(message), '_blank', 'noopener,noreferrer')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MessageCircle className="h-4 w-4" />
              Abrir WhatsApp
            </button>

            <button
              type="button"
              disabled={!trackedUrl}
              onClick={() => void copyText(trackedUrl, 'url')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copyState === 'url' ? <CheckCircle2 className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              {copyState === 'url' ? 'Link copiado' : 'Copiar link'}
            </button>
          </div>

          {trackedUrl ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ExternalLink className="h-4 w-4" />
                Tracking aplicado
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                <span><strong className="text-slate-700">source:</strong> whatsapp</span>
                <span><strong className="text-slate-700">medium:</strong> community</span>
                <span><strong className="text-slate-700">campaign:</strong> {campaignName}</span>
                <span><strong className="text-slate-700">content:</strong> {variantId}</span>
              </div>
              <p className="mt-3 break-all text-xs leading-5 text-slate-400">{trackedUrl}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
        <strong>Regla de prueba:</strong> usá una sola variante por grupo/envío y no cambies el texto después de copiarlo. Así podemos comparar qué <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">utm_content</code> trae más simuladores iniciados, terminados y registros.
      </section>
    </div>
  );
}
