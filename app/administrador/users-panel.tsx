import Link from 'next/link';
import type { AdministradorUsuarioRow, AdministradorUsuariosStats } from './actions';

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
}: {
  stats: AdministradorUsuariosStats;
  rows: AdministradorUsuarioRow[];
  showAll: boolean;
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

      <section className="overflow-hidden rounded-[20px] border border-[#e7ebf4] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#eef1f6] px-5 py-4">
          <h2 className="text-[14px] font-semibold text-[#1d2a44]">Lista completa</h2>
          {rows.length > 5 ? (
            <Link
              href={showAll ? '/administrador?panel=usuarios' : '/administrador?panel=usuarios&users=all'}
              className="rounded-full border border-[#d9e1f1] px-3 py-1.5 text-[12px] font-medium text-[#2563EB] transition hover:bg-[#f5f8ff]"
            >
              {showAll ? 'Ver menos' : 'Ver más'}
            </Link>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead className="bg-[#f8faff] text-[#73819b]">
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
                          : 'bg-[#f1f4f9] text-[#75829a]'
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
                          : 'bg-[#f1f4f9] text-[#75829a]'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[12px] font-medium ${
                        user.plan === 'premium'
                          ? 'bg-[#eef3ff] text-[#2563EB]'
                          : 'bg-[#f1f4f9] text-[#75829a]'
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
