'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { AdministradorMarketingStats } from './actions';

function MetricCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-[16px] border border-[#edf1f7] bg-[#fbfcff] px-4 py-4">
      <p className="text-[12px] font-medium text-[#7f8aa3]">{label}</p>
      <p className="mt-2 text-[1.4rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
        {value}
      </p>
      <p className="mt-2 text-[12px] text-[#95a0b8]">{caption}</p>
    </div>
  );
}

function conversion(registrations: number, visits: number) {
  if (visits === 0) return '0%';
  return `${((registrations / visits) * 100).toFixed(1)}%`;
}

export function MarketingPanel({
  activePeriodLabel,
  stats,
}: {
  activePeriodLabel: string;
  stats: AdministradorMarketingStats;
}) {
  const [redditLinkCopied, setRedditLinkCopied] = useState(false);
  const overallConversion = conversion(stats.totalRegistrations, stats.totalVisits);

  const redditRows = stats.rows.filter(
    (row) => row.source.trim().toLowerCase() === 'reddit'
  );
  const redditStats = redditRows.reduce(
    (acc, row) => ({
      visits: acc.visits + row.visits,
      logins: acc.logins + row.logins,
      registrations: acc.registrations + row.registrations,
    }),
    { visits: 0, logins: 0, registrations: 0 }
  );
  const redditConversion = conversion(redditStats.registrations, redditStats.visits);

  const copyRedditLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/reddit`);
      setRedditLinkCopied(true);
      window.setTimeout(() => setRedditLinkCopied(false), 1800);
    } catch {
      setRedditLinkCopied(false);
    }
  };

  return (
    <section>
      <div className="mb-5">
        <p className="text-[1.35rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">
          Marketing
        </p>
        <p className="mt-1 text-[14px] text-[#7f8aa3]">
          Rendimiento de campañas y variantes UTM durante {activePeriodLabel.toLowerCase()}.
        </p>
      </div>

      <div className="rounded-[22px] border border-[#e8ebf3] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <MetricCard
            label="Visitas atribuidas"
            value={stats.totalVisits.toLocaleString('es-AR')}
            caption="Sesiones con una fuente UTM identificada"
          />
          <MetricCard
            label="Logins atribuidos"
            value={stats.totalLogins.toLocaleString('es-AR')}
            caption="Usuarios identificados después de una campaña"
          />
          <MetricCard
            label="Registros atribuidos"
            value={stats.totalRegistrations.toLocaleString('es-AR')}
            caption="Perfiles nuevos con login atribuible"
          />
          <MetricCard
            label="Conversión a registro"
            value={overallConversion}
            caption="Registros atribuidos / visitas atribuidas"
          />
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-[#dce7ff] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#2563eb]">
                Reddit
              </span>
              <span className="text-[12px] text-[#95a0b8]">Link permanente</span>
            </div>
            <h2 className="mt-3 text-[17px] font-semibold tracking-[-0.03em] text-[#1d2a44]">
              evaluo.com.ar/reddit
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[#7f8aa3]">
              Usá este mismo enlace en cualquier publicación de Reddit. El acceso se atribuye
              automáticamente al canal Reddit y queda consolidado acá.
            </p>
          </div>

          <button
            type="button"
            onClick={copyRedditLink}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] border border-[#dbe4f4] bg-[#f8faff] px-4 text-[12px] font-semibold text-[#31507e] transition hover:border-[#bfd0f0] hover:bg-[#f1f6ff]"
          >
            {redditLinkCopied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar link
              </>
            )}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Visitas desde Reddit"
            value={redditStats.visits.toLocaleString('es-AR')}
            caption={activePeriodLabel}
          />
          <MetricCard
            label="Logins desde Reddit"
            value={redditStats.logins.toLocaleString('es-AR')}
            caption={activePeriodLabel}
          />
          <MetricCard
            label="Registros desde Reddit"
            value={redditStats.registrations.toLocaleString('es-AR')}
            caption={activePeriodLabel}
          />
          <MetricCard
            label="Conversión Reddit"
            value={redditConversion}
            caption="Registros / visitas"
          />
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-[#e8ebf3] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.03em] text-[#1d2a44]">
            Variantes de campaña
          </h2>
          <p className="mt-1 text-[13px] text-[#7f8aa3]">
            La variante se toma de <code className="rounded bg-[#f3f5fa] px-1 py-0.5">utm_content</code>.
            Para tests A/B, mantené source, medium y campaign iguales y cambiá solamente ese valor.
          </p>
        </div>

        {stats.rows.length === 0 ? (
          <div className="mt-5 rounded-[16px] border border-dashed border-[#d8deea] bg-[#fbfcff] px-5 py-8 text-center">
            <p className="text-[14px] font-medium text-[#4b5874]">
              Todavía no hay tráfico con UTMs en este período.
            </p>
            <p className="mt-2 text-[12px] text-[#8b95aa]">
              Cuando alguien entre con utm_source, utm_campaign o utm_content, aparecerá acá.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 hidden overflow-hidden rounded-[16px] border border-[#edf1f7] md:block">
              <table className="w-full border-collapse text-left">
                <thead className="bg-[#f8faff]">
                  <tr className="text-[11px] uppercase tracking-[0.12em] text-[#8b95aa]">
                    <th className="px-4 py-3 font-semibold">Fuente</th>
                    <th className="px-4 py-3 font-semibold">Campaña</th>
                    <th className="px-4 py-3 font-semibold">Variante</th>
                    <th className="px-4 py-3 text-right font-semibold">Visitas</th>
                    <th className="px-4 py-3 text-right font-semibold">Logins</th>
                    <th className="px-4 py-3 text-right font-semibold">Registros</th>
                    <th className="px-4 py-3 text-right font-semibold">Conversión</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.rows.map((row, index) => (
                    <tr
                      key={`${row.source}-${row.medium}-${row.campaign}-${row.content}-${index}`}
                      className="border-t border-[#edf1f7] text-[12px]"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1d2a44]">{row.source}</p>
                        <p className="mt-0.5 text-[11px] text-[#95a0b8]">{row.medium}</p>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-[#4b5874]">
                        {row.campaign}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 font-medium text-[#2f66ea]">
                        {row.content}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#1d2a44]">
                        {row.visits.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#1d2a44]">
                        {row.logins.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#1d2a44]">
                        {row.registrations.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        {row.conversionPct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-3 md:hidden">
              {stats.rows.map((row, index) => (
                <article
                  key={`${row.source}-${row.medium}-${row.campaign}-${row.content}-mobile-${index}`}
                  className="rounded-[16px] border border-[#edf1f7] bg-[#fbfcff] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#2f66ea]">
                        {row.content}
                      </p>
                      <p className="mt-1 truncate text-[12px] text-[#4b5874]">
                        {row.source} · {row.medium}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-[#95a0b8]">
                        {row.campaign}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      {row.conversionPct.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.1em] text-[#95a0b8]">Visitas</p>
                      <p className="mt-1 text-[13px] font-semibold text-[#1d2a44]">{row.visits}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.1em] text-[#95a0b8]">Logins</p>
                      <p className="mt-1 text-[13px] font-semibold text-[#1d2a44]">{row.logins}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.1em] text-[#95a0b8]">Registros</p>
                      <p className="mt-1 text-[13px] font-semibold text-[#1d2a44]">{row.registrations}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <div className="mt-4 rounded-[14px] bg-[#f8faff] px-4 py-3 text-[11px] leading-5 text-[#7f8aa3]">
          <strong className="font-semibold text-[#4b5874]">Cómo se calcula:</strong>{' '}
          visitas = sesiones únicas con UTM; logins = usuarios únicos con evento de login;
          registros = usuarios con perfil creado en el período y login atribuible. Se prioriza la
          atribución UTM más reciente para comparar variantes de mensajes.
        </div>
      </div>
    </section>
  );
}
