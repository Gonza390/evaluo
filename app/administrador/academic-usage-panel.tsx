'use client';

import type { AcademicUsageStats } from './academic-usage-actions';

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-AR').format(value);
}

function formatMinutes(value: number) {
  if (!value) return '—';
  if (value < 60) return `${value.toFixed(value < 10 ? 1 : 0)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

function formatLastActivity(value: string | null) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value));
}

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="admin-kpi">
      <div className="admin-kpi-label">{label}</div>
      <div className="admin-kpi-value">{value}</div>
      <div className="admin-kpi-sub">{sub}</div>
    </div>
  );
}

export function AcademicUsagePanel({ stats }: { stats: AcademicUsageStats }) {
  return (
    <section>
      <div className="admin-page-header">
        <div>
          <h1>Uso académico</h1>
          <p>
            Cómo usan Evaluo los estudiantes de cada universidad a partir de sus propios PDFs.
          </p>
        </div>
      </div>

      <div className="admin-kpi-grid">
        <Kpi
          label="Usuarios con universidad"
          value={formatNumber(stats.users)}
          sub={`${formatNumber(stats.activeUsers7d)} activos en los últimos 7 días`}
        />
        <Kpi
          label="PDFs cargados"
          value={formatNumber(stats.pdfs)}
          sub="Materiales subidos por estudiantes"
        />
        <Kpi
          label="Tiempo promedio"
          value={formatMinutes(stats.avgMinutes7d)}
          sub="Por usuario activo · últimos 7 días"
        />
        <Kpi
          label="Material generado"
          value={formatNumber(stats.flashcards + stats.pdfSimulators)}
          sub={`${formatNumber(stats.flashcards)} flashcards · ${formatNumber(stats.pdfSimulators)} simuladores PDF`}
        />
      </div>

      <div className="admin-stage-label">Por universidad</div>

      <div className="admin-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Universidad</th>
                <th className="px-4 py-3 text-right">Usuarios</th>
                <th className="px-4 py-3 text-right">Activos 7d</th>
                <th className="px-4 py-3 text-right">Tiempo prom.</th>
                <th className="px-4 py-3 text-right">PDFs</th>
                <th className="px-4 py-3 text-right">Flashcards</th>
                <th className="px-4 py-3 text-right">Simuladores PDF</th>
                <th className="px-4 py-3 text-right">Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {stats.universities.length > 0 ? (
                stats.universities.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.name}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(row.users)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(row.activeUsers7d)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMinutes(row.avgMinutes7d)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(row.pdfs)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(row.flashcards)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(row.pdfSimulators)}
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] tabular-nums">
                      {formatLastActivity(row.lastActivityAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[13px]">
                    Todavía no hay uso asociado a universidades.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="admin-footnote">
        El tiempo promedio usa engagement registrado por Analytics durante los últimos 7 días y
        limita cada tramo individual a 30 minutos para evitar inflar el dato por pestañas abiertas.
      </p>
    </section>
  );
}
