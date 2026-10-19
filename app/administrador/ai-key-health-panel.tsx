'use client';

import { useState } from 'react';
import { Loader2, RefreshCcw } from 'lucide-react';
import { comprobarClavesIAAhora } from './ai-key-health-actions';
import type { AIKeyHealthReport, AIKeyHealthItem } from '@/lib/ai/key-health';

const STATUS_LABELS: Record<AIKeyHealthItem['status'], string> = {
  ok: 'Operativa',
  missing: 'Sin configurar',
  unauthorized: 'Credencial rechazada',
  rate_limited: 'Límite de uso / cuota',
  provider_unavailable: 'Proveedor no disponible',
  bad_request: 'Modelo o solicitud inválidos',
  timeout: 'Tiempo agotado',
  network_error: 'Error de conexión',
};

const GROUP_LABELS = {
  gemini_pdf: 'Gemini · Procesamiento de PDF',
  gemini_app: 'Gemini · Aplicación',
  groq: 'Groq',
  nvidia: 'NVIDIA',
} as const;

export function AIKeyHealthPanel({ initialReport }: { initialReport: AIKeyHealthReport | null }) {
  const [report, setReport] = useState(initialReport);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const lastCheckedMs = report ? Date.parse(report.checkedAt) : 0;
  const stale = !Number.isFinite(lastCheckedMs) || Date.now() - lastCheckedMs > 26 * 60 * 60 * 1000;

  async function refresh() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await comprobarClavesIAAhora();
      if (result.success) setReport(result.report);
      setMessage(result.message ?? (result.success ? 'Comprobación finalizada.' : 'No pudimos comprobar las claves.'));
    } catch {
      setMessage('No pudimos comprobar las claves. Reintentá más tarde.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[20px] border border-[#e7ebf4] bg-white p-5" aria-label="Estado de las claves de IA">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-[#1d2a44]">Salud de las claves de IA</h2>
          <p className="mt-1 text-[13px] text-[#7f8aa3]">Chequeo diario de las 10 claves, con prueba manual y sin exponer credenciales.</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void refresh()}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#2563eb] px-3 text-[13px] font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          {busy ? 'Comprobando...' : 'Comprobar ahora'}
        </button>
      </div>

      {!report ? (
        <p className="mt-4 text-[13px] text-[#42506a]">Todavía no hay una comprobación registrada. Usá «Comprobar ahora» o esperá al próximo chequeo programado.</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
            <span className={`font-semibold ${stale ? 'text-amber-700' : report.healthy === report.total ? 'text-emerald-700' : 'text-red-700'}`}>
              {stale ? 'Información desactualizada' : report.healthy === report.total ? 'Claves operativas' : 'Requiere atención'}
            </span>
            <span className="text-[#42506a]">{report.healthy} / {report.total} respuestas correctas</span>
            <time className="text-[#7f8aa3]" dateTime={report.checkedAt}>
              Última comprobación: {new Date(report.checkedAt).toLocaleString('es-AR')}
            </time>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(GROUP_LABELS).map(([provider, label]) => (
              <div key={provider} className="rounded-xl border border-[#e7ebf4] p-3">
                <h3 className="mb-2 text-[12px] font-semibold text-[#1d2a44]">{label}</h3>
                {report.checks.filter((item) => item.provider === provider).map((item) => (
                  <div key={item.name} className="flex flex-wrap items-center justify-between gap-1 border-t border-[#f0f2f7] py-2 text-[12px]">
                    <span className="font-mono text-[#42506a]">{item.name}</span>
                    <span className={item.status === 'ok' ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
                      {STATUS_LABELS[item.status] ?? 'Desconocido'}
                      {item.httpStatus ? ` · ${item.httpStatus}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-[#7f8aa3]">
            Un 429 puede señalar cuota o límite de velocidad. Un 503 señala indisponibilidad temporal del proveedor, no necesariamente una clave inválida.
            Las comprobaciones prueban el acceso al modelo; no garantizan que una generación larga de PDF vaya a finalizar.
          </p>
        </>
      )}
      {message ? <p role="status" className="mt-3 text-[12px] text-[#42506a]">{message}</p> : null}
    </section>
  );
}
