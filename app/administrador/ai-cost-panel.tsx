import { CircleDollarSign, FileText, Gauge, Sparkles } from 'lucide-react';
import type { AdminPdfAiUsageStats, AdminPdfAiUsageWindow } from './ai-cost-data';

function formatNumber(value: number) {
  return value.toLocaleString('es-AR');
}

function formatUsd(value: number, minimumFractionDigits = 4) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits: 4,
  }).format(value);
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4 text-card-foreground">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function WindowRow({ label, window }: { label: string; window: AdminPdfAiUsageWindow }) {
  return (
    <tr className="border-t border-border text-sm">
      <td className="px-3 py-3 font-medium">{label}</td>
      <td className="px-3 py-3 text-right">{formatNumber(window.materials)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(window.pages)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(window.calls)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(window.totalTokens)}</td>
      <td className="px-3 py-3 text-right font-medium">
        {formatUsd(window.paidEquivalentCostUsd)}
      </td>
    </tr>
  );
}

export function AICostPanel({
  stats,
  error,
}: {
  stats: AdminPdfAiUsageStats | null;
  error?: string | null;
}) {
  if (!stats) {
    return (
      <section className="mb-5 rounded-2xl border border-border bg-card p-5">
        <p className="text-base font-semibold">Consumo de PDFs</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? 'Todavía no tenemos telemetría suficiente para calcular el consumo.'}
        </p>
      </section>
    );
  }

  return (
    <section className="mb-5 space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">PDFs · consumo y costo IA</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Telemetría real de procesamiento. El costo equivalente usa la tarifa paga de Gemini 2.5
            Flash-Lite para dimensionar cuánto costaría el mismo consumo fuera del Free Tier.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs">
          <p className="font-semibold text-foreground">Modelo fijado</p>
          <p className="mt-1 font-mono text-primary">{stats.model}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="PDFs medidos"
          value={formatNumber(stats.allTime.materials)}
          detail={`${formatNumber(stats.allTime.pages)} páginas con telemetría`}
        />
        <StatCard
          label="Llamadas IA"
          value={formatNumber(stats.allTime.calls)}
          detail={`${formatNumber(stats.otherProviderCalls)} llamadas fuera de Gemini`}
        />
        <StatCard
          label="Tokens totales"
          value={formatNumber(stats.allTime.totalTokens)}
          detail={`${formatNumber(stats.allTime.promptTokens)} entrada · ${formatNumber(stats.allTime.completionTokens)} salida`}
        />
        <StatCard
          label="Tokens / página"
          value={
            stats.allTime.tokensPerPage === null ? '—' : formatNumber(stats.allTime.tokensPerPage)
          }
          detail="Promedio observado sobre páginas procesadas"
        />
        <StatCard
          label="Costo tokens Free Tier"
          value={formatUsd(stats.freeTierTokenCostUsd, 2)}
          detail="Mientras las claves/proyecto permanezcan dentro de la cuota gratuita"
        />
        <StatCard
          label="Equivalente pago total"
          value={formatUsd(stats.allTime.paidEquivalentCostUsd)}
          detail={`Referencia: USD ${stats.inputUsdPerMillion}/M entrada + USD ${stats.outputUsdPerMillion}/M salida`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Gauge className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Consumo por período</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Período</th>
                  <th className="px-3 py-2 text-right font-medium">PDFs</th>
                  <th className="px-3 py-2 text-right font-medium">Páginas</th>
                  <th className="px-3 py-2 text-right font-medium">Llamadas</th>
                  <th className="px-3 py-2 text-right font-medium">Tokens</th>
                  <th className="px-3 py-2 text-right font-medium">Equiv. pago</th>
                </tr>
              </thead>
              <tbody>
                <WindowRow label="Hoy (UTC)" window={stats.today} />
                <WindowRow label="Últimos 7 días" window={stats.last7Days} />
                <WindowRow label="Histórico" window={stats.allTime} />
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Modelos observados</p>
          </div>
          <div className="mt-3 space-y-2">
            {stats.historicalModels.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay llamadas registradas.</p>
            ) : (
              stats.historicalModels.slice(0, 6).map((item) => (
                <div key={`${item.provider}-${item.model}`} className="rounded-xl bg-muted/40 px-3 py-2">
                  <p className="truncate font-mono text-xs font-medium">{item.model}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.provider} · {formatNumber(item.calls)} llamadas ·{' '}
                    {formatNumber(item.totalTokens)} tokens
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-muted/40 px-3 py-3 text-xs leading-5 text-muted-foreground">
        <FileText className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          El cálculo cubre tokens registrados por el pipeline de materiales. No incluye Vercel,
          Supabase, almacenamiento ni red. Si el Free Tier se agota, el panel sigue mostrando el
          equivalente de tokens para que podamos decidir cuándo conviene pasar a pago.
          {stats.truncated ? ' La lectura alcanzó el límite interno de 10.000 llamadas.' : ''}
        </p>
      </div>
    </section>
  );
}
