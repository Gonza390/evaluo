'use client';

import Link from 'next/link';
import { Download } from 'lucide-react';
import type {
  AdministradorSegmentacionRow,
  AdministradorSegmentacionStats,
  AdministradorUsuarioRow,
  AdministradorUsuariosStats,
} from './actions';

function formatDateTime(value: string | null) {
  if (!value) return '-';

  return new Date(value).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SEGMENTO_LABEL: Record<string, string> = {
  B_activo: 'Activos (usaron el simulador)',
  C_probo_una_vez: 'Probaron una vez',
  D_solo_cuenta: 'Solo crearon cuenta',
};

function downloadCsv(rows: AdministradorSegmentacionRow[]) {
  const header = [
    'email',
    'segmento',
    'perfil',
    'intentos',
    'preguntas',
    'correctas',
    'suscripcion',
    'material',
    'registro',
    'ultimo_login',
  ];
  const lines = rows.map((r) =>
    [
      r.email,
      r.segmento,
      r.perfil,
      r.intentos,
      r.preguntas,
      r.correctas,
      r.suscripcion ?? '',
      r.material ?? '',
      r.registro?.slice(0, 10) ?? '',
      r.ultimo_login?.slice(0, 10) ?? '',
    ].join(',')
  );
  const csv = [header.join(','), ...lines].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'evaluo_usuarios_dormidos.csv';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'blue' | 'green' | 'violet';
}) {
  const tones = {
    blue: 'text-[#2148d8]',
    green: 'text-[#10936f]',
    violet: 'text-[#6f42ff]',
  } as const;

  return (
    <section className="rounded-[18px] border border-[#e7ebf4] bg-white px-5 py-5">
      <p className="text-[12px] font-medium text-[#7f8aa3]">{label}</p>
      <p className={`mt-2 text-[2rem] font-semibold leading-none tracking-[-0.05em] ${tones[tone]}`}>
        {value.toLocaleString('es-AR')}
      </p>
    </section>
  );
}

export function UsersPanel({
  stats,
  rows,
  showAll,
  segmentacionStats,
  segmentacionRows,
}: {
  stats: AdministradorUsuariosStats;
  rows: AdministradorUsuarioRow[];
  showAll: boolean;
  segmentacionStats: AdministradorSegmentacionStats | null;
  segmentacionRows: AdministradorSegmentacionRow[];
}) {
  const visibleRows = showAll ? rows : rows.slice(0, 5);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[1.35rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">Usuarios</p>
        <p className="mt-1 text-[14px] text-[#7f8aa3]">
          Vista general de cuentas registradas, actividad del día y altas recientes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <SummaryTile label="Usuarios totales" value={stats.totalUsers} tone="blue" />
        <SummaryTile label="Usuarios conectados hoy" value={stats.activeToday} tone="green" />
        <SummaryTile label="Últimos registros" value={stats.newRegistrationsToday} tone="violet" />
      </div>

      {segmentacionStats ? (
        <section className="rounded-[20px] border border-[#e7ebf4] bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-[#1d2a44]">
                Usuarios dormidos (sin login en 14 días)
              </h2>
              <p className="mt-1 text-[13px] text-[#7f8aa3]">
                Segmentación para campaña de reactivación. {segmentacionStats.activosConPerfil} de
                los activos tienen perfil académico completo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadCsv(segmentacionRows)}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#d9e1f1] px-3.5 py-2 text-[12px] font-medium text-[#2563EB] transition hover:bg-white"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar CSV
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[14px] border border-[#eef1f6] bg-[#f8fafc] px-4 py-3">
              <p className="text-[12px] font-medium text-[#7f8aa3]">Total dormidos</p>
              <p className="mt-1 text-[1.6rem] font-semibold leading-none tracking-[-0.04em] text-[#1d2a44]">
                {segmentacionStats.totalDormidos}
              </p>
            </div>
            {segmentacionStats.porSegmento.map(({ segmento, cantidad }) => (
              <div key={segmento} className="rounded-[14px] border border-[#eef1f6] bg-[#f8fafc] px-4 py-3">
                <p className="text-[12px] font-medium text-[#7f8aa3]">
                  {SEGMENTO_LABEL[segmento] ?? segmento}
                </p>
                <p className="mt-1 text-[1.6rem] font-semibold leading-none tracking-[-0.04em] text-[#1d2a44]">
                  {cantidad}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-[13px]">
              <thead className="bg-white text-[#73819b]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Segmento</th>
                  <th className="px-3 py-2 font-semibold">Perfil</th>
                  <th className="px-3 py-2 font-semibold">Intentos</th>
                  <th className="px-3 py-2 font-semibold">Preguntas</th>
                  <th className="px-3 py-2 font-semibold">Correctas</th>
                  <th className="px-3 py-2 font-semibold">Último login</th>
                </tr>
              </thead>
              <tbody>
                {segmentacionRows.slice(0, 8).map((user) => (
                  <tr key={user.email} className="border-t border-[#eef1f6] text-[#1d2a44]">
                    <td className="px-3 py-2.5">{user.email}</td>
                    <td className="px-3 py-2.5">{SEGMENTO_LABEL[user.segmento] ?? user.segmento}</td>
                    <td className="px-3 py-2.5">{user.perfil}</td>
                    <td className="px-3 py-2.5">{user.intentos}</td>
                    <td className="px-3 py-2.5">{user.preguntas}</td>
                    <td className="px-3 py-2.5">{user.correctas}</td>
                    <td className="px-3 py-2.5 text-[#607089]">
                      {formatDateTime(user.ultimo_login)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {segmentacionRows.length === 0 ? (
              <p className="px-3 py-4 text-[13px] text-[#7f8aa3]">No hay usuarios dormidos.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[20px] border border-[#e7ebf4] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#eef1f6] px-5 py-4">
          <h2 className="text-[14px] font-semibold text-[#1d2a44]">Lista completa</h2>
          {rows.length > 5 ? (
            <Link
              href={showAll ? '/administrador?panel=usuarios' : '/administrador?panel=usuarios&users=all'}
              className="rounded-full border border-[#d9e1f1] px-3 py-1.5 text-[12px] font-medium text-[#2563EB] transition hover:bg-white"
            >
              {showAll ? 'Ver menos' : 'Ver más'}
            </Link>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead className="bg-white text-[#73819b]">
              <tr>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Último ingreso</th>
                <th className="px-4 py-3 font-semibold">Alta</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((user) => (
                <tr key={user.id} className="border-t border-[#eef1f6] text-[#1d2a44]">
                  <td className="px-5 py-3.5">{user.email}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[12px] font-medium ${
                        user.estado === 'activo'
                          ? 'bg-[#eaf9f1] text-[#10936f]'
                          : 'bg-white text-[#75829a]'
                      }`}
                    >
                      {user.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[12px] font-medium ${
                        user.role === 'admin'
                          ? 'bg-[#fff2df] text-[#c87511]'
                          : 'bg-white text-[#75829a]'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[12px] font-medium ${
                        user.plan === 'premium'
                          ? 'bg-white text-[#2563EB]'
                          : 'bg-white text-[#75829a]'
                      }`}
                    >
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-[#607089]">{formatDateTime(user.last_sign_in_at)}</td>
                  <td className="px-4 py-3.5 text-[#607089]">{formatDateTime(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 ? (
            <p className="px-5 py-6 text-[14px] text-[#7f8aa3]">No hay usuarios para mostrar.</p>
          ) : null}
        </div>
      </section>
    </section>
  );
}
