'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, ShieldAlert, Trash2 } from 'lucide-react';
import {
  eliminarArchivosHuerfanosAdministrador,
  type AdministradorLogsData,
} from './actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

function formatEngagementTime(ms: number) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'red' | 'blue' | 'amber' | 'slate';
}) {
  const tones = {
    red: 'text-[#d44848]',
    blue: 'text-[#2563EB]',
    amber: 'text-[#b7791f]',
    slate: 'text-[#1d2a44]',
  } as const;

  return (
    <div className="rounded-[18px] border border-[#e7ebf4] bg-white px-4 py-4">
      <p className="text-[12px] font-medium text-[#7f8aa3]">{label}</p>
      <p className={`mt-2 text-[1.9rem] font-semibold leading-none tracking-[-0.05em] ${tones[tone]}`}>
        {value}
      </p>
    </div>
  );
}

export function LogsPanel({ data }: { data: AdministradorLogsData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [lastCleanupCount, setLastCleanupCount] = useState<number | null>(null);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[1.35rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">Logs</p>
        <p className="mt-1 text-[14px] text-[#7f8aa3]">
          Vista operativa del sistema para detectar errores, revisar eventos sensibles y limpiar problemas reales.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
        <StatCard label="Errores cliente" value={data.totalErrors.toLocaleString('es-AR')} tone="red" />
        <StatCard label="Engagement promedio" value={formatEngagementTime(data.avgLatencyMs)} tone="blue" />
        <StatCard label="PDFs duplicados" value={data.duplicateGroups.toLocaleString('es-AR')} tone="amber" />
        <StatCard label="Archivos huérfanos" value={data.orphanFiles.toLocaleString('es-AR')} tone="slate" />
      </div>

      <section className="rounded-[20px] border border-[#e7ebf4] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[#2563EB]" />
          <p className="text-[14px] font-semibold text-[#1d2a44]">Alertas del sistema</p>
        </div>

        {data.alerts.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-[#dbe2f0] px-4 py-4 text-[13px] text-[#7f8aa3]">
            No detectamos alertas activas en esta pasada.
          </p>
        ) : (
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div
                key={alert.key}
                className={`rounded-[14px] border px-4 py-3 ${
                  alert.severity === 'high'
                    ? 'border-[#f2caca] bg-[#fff7f7]'
                    : 'border-[#f1e0b4] bg-[#fffaf0]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className={`mt-0.5 h-4 w-4 ${
                      alert.severity === 'high' ? 'text-[#d44848]' : 'text-[#b7791f]'
                    }`}
                  />
                  <p className="text-[13px] leading-6 text-[#42506a]">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <section className="rounded-[20px] border border-[#e7ebf4] bg-white">
          <div className="border-b border-[#eef1f6] px-5 py-4">
            <p className="text-[14px] font-semibold text-[#1d2a44]">Eventos recientes</p>
          </div>
          <div className="max-h-[360px] overflow-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="sticky top-0 border-b border-[#eef1f6] bg-white text-[12px] uppercase tracking-[0.16em] text-[#667085]">
                  <th className="px-5 py-3 font-semibold">Evento</th>
                  <th className="px-5 py-3 font-semibold">Detalle</th>
                  <th className="px-5 py-3 font-semibold">Actor</th>
                  <th className="px-5 py-3 font-semibold">Ruta</th>
                  <th className="px-5 py-3 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-[13px] text-[#7f8aa3]">
                      No hay eventos recientes para mostrar.
                    </td>
                  </tr>
                ) : (
                  data.recentEvents.map((event) => (
                    <tr key={event.id} className="border-b border-[#f3f5fa] text-[12px] text-[#42506a]">
                      <td className="px-5 py-2.5 font-medium text-[#1d2a44]">{event.eventName}</td>
                      <td className="max-w-[260px] px-5 py-2.5">{event.detail}</td>
                      <td className="px-5 py-2.5">{event.actor}</td>
                      <td className="max-w-[180px] px-5 py-2.5 text-[#7f8aa3]">{event.path}</td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-[#7f8aa3]">
                        {event.createdAt ? new Date(event.createdAt).toLocaleString('es-AR') : 'Sin fecha'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[20px] border border-[#e7ebf4] bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-[#1d2a44]">Archivos huérfanos</p>
              <p className="mt-1 text-[12px] text-[#7f8aa3]">
                Objetos que siguen en storage pero ya no tienen registro asociado en base.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              className="rounded-[12px]"
              onClick={() =>
                startTransition(async () => {
                  const result = await eliminarArchivosHuerfanosAdministrador();
                  if (!result.success) {
                    toast({ description: result.message, variant: 'destructive' });
                    return;
                  }

                  setLastCleanupCount(result.deletedCount ?? 0);
                  toast({ description: result.message });
                  router.refresh();
                })
              }
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Limpiar
            </Button>
          </div>

          {lastCleanupCount !== null ? (
            <div className="mb-3 rounded-[12px] border border-[#e7ebf4] bg-[#fbfcff] px-3 py-2 text-[12px] text-[#5f6d86]">
              Última limpieza ejecutada desde este panel: {lastCleanupCount.toLocaleString('es-AR')} archivos.
            </div>
          ) : null}

          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {data.orphanSample.length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-[#dbe2f0] px-4 py-4 text-[13px] text-[#7f8aa3]">
                No encontramos archivos huérfanos en esta pasada.
              </p>
            ) : (
              data.orphanSample.map((path) => (
                <div key={path} className="rounded-[12px] border border-[#e7ebf4] bg-[#fbfcff] px-3 py-2 text-[12px] text-[#42506a]">
                  {path}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-[20px] border border-[#e7ebf4] bg-white p-5">
          <div className="mb-4">
            <p className="text-[14px] font-semibold text-[#1d2a44]">Rutas con más fallos</p>
            <p className="mt-1 text-[12px] text-[#7f8aa3]">Concentración de errores cliente por página.</p>
          </div>
          <div className="space-y-3">
            {data.failuresByPath.length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-[#dbe2f0] px-4 py-4 text-[13px] text-[#7f8aa3]">
                No hay fallos por ruta para mostrar.
              </p>
            ) : (
              data.failuresByPath.map((row) => (
                <div key={row.path} className="rounded-[14px] border border-[#e7ebf4] bg-[#fbfcff] px-4 py-3">
                  <div className="mb-2 flex items-center justify-between gap-3 text-[12px] text-[#7f8aa3]">
                    <span className="truncate">{row.path}</span>
                    <span className="font-semibold text-[#1d2a44]">{row.count.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#e8edf7]">
                    <div
                      className="h-full rounded-full bg-[#2563EB]"
                      style={{
                        width: `${Math.min(100, (row.count / Math.max(data.failuresByPath[0]?.count ?? 1, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[20px] border border-[#e7ebf4] bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-[#1d2a44]">PDFs duplicados</p>
              <p className="mt-1 text-[12px] text-[#7f8aa3]">
                Grupos sospechosos para revisar antes de seguir cargando material.
              </p>
            </div>
          </div>

          <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
            {data.duplicateRows.length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-[#dbe2f0] px-4 py-4 text-[13px] text-[#7f8aa3]">
                No detectamos duplicados fuertes en esta pasada.
              </p>
            ) : (
              data.duplicateRows.map((group, index) => (
                <div key={`${group.normalized_name}-${index}`} className="rounded-[14px] border border-[#e7ebf4] bg-[#fbfcff] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-[#1d2a44]">
                      Grupo #{index + 1}
                    </p>
                    <span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#5f6d86]">
                      {group.count.toLocaleString('es-AR')} archivos
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {group.recursos.slice(0, 4).map((resource) => (
                      <div key={resource.id} className="rounded-[12px] border border-[#edf1f8] bg-white px-3 py-2 text-[12px] text-[#42506a]">
                        <p className="font-medium text-[#1d2a44]">{resource.nombre}</p>
                        <p className="mt-1 text-[#7f8aa3]">{resource.url_archivo ?? 'Sin archivo asociado'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[20px] border border-[#e7ebf4] bg-white p-5">
        <div className="mb-4">
          <p className="text-[14px] font-semibold text-[#1d2a44]">Trazas recientes de error</p>
          <p className="mt-1 text-[12px] text-[#7f8aa3]">Últimos errores cliente con el mensaje más útil disponible.</p>
        </div>
        <div className="space-y-3">
          {data.recentErrors.length === 0 ? (
            <p className="rounded-[14px] border border-dashed border-[#dbe2f0] px-4 py-4 text-[13px] text-[#7f8aa3]">
              No hay trazas recientes para mostrar.
            </p>
          ) : (
            data.recentErrors.map((row, index) => (
              <div key={`${row.path}-${row.created_at ?? index}`} className="rounded-[14px] border border-[#e7ebf4] bg-[#fbfcff] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold text-[#1d2a44]">{row.path}</p>
                  <p className="text-[12px] text-[#7f8aa3]">
                    {row.created_at ? new Date(row.created_at).toLocaleString('es-AR') : 'Sin fecha'}
                  </p>
                </div>
                <p className="mt-2 text-[13px] leading-6 text-[#42506a]">{row.message}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}


