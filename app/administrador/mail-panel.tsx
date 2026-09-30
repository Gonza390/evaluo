import Link from 'next/link';
import type { AdminMailData, AdminMailRow, AdminUpcomingMailRow, MailFilterType } from './mail-actions';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value));
}

function formatUpcoming(value: string) {
  const date = new Date(value);
  const now = new Date();

  const todayKey = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(now);
  const dateKey = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date);

  const time = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date);

  if (dateKey === todayKey) return `Hoy, ${time}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(tomorrow);

  if (dateKey === tomorrowKey) return `Mañana, ${time}`;

  const day = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date);
  return `${day}, ${time}`;
}

function tagClass(row: Pick<AdminMailRow | AdminUpcomingMailRow, 'kind'>) {
  if (row.kind === 'ready') return 'admin-mail-type-tag ready';
  if (row.kind === 'campaign' || row.kind === 'study_return') return 'admin-mail-type-tag campaign';
  return 'admin-mail-type-tag reminder';
}

function statusLabel(status: string) {
  if (status === 'sent') return 'Enviado';
  if (status === 'failed') return 'Falló';
  if (status === 'sending' || status === 'triggered') return 'En proceso';
  return status;
}

function statusClass(status: string) {
  if (status === 'sent') return 'admin-mail-status is-good';
  if (status === 'failed') return 'admin-mail-status is-bad';
  return 'admin-mail-status';
}

function mailHref(type: MailFilterType, days: 7 | 30) {
  const params = new URLSearchParams({
    panel: 'mails',
    mailType: type,
    mailPeriod: String(days),
  });
  return `/administrador?${params.toString()}`;
}

export function MailPanel({
  data,
  activeType,
  activePeriod,
}: {
  data: AdminMailData;
  activeType: MailFilterType;
  activePeriod: 7 | 30;
}) {
  const typeOptions: Array<{ value: MailFilterType; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'exam', label: 'Recordatorio de examen' },
    { value: 'ready', label: 'Material listo' },
    { value: 'campaign', label: 'Campaña' },
  ];

  return (
    <section className="admin-mail-page">
      <header className="admin-mail-page-header">
        <h1>Mails enviados</h1>
        <p>
          Registro simple: qué se mandó, a quién y cuándo. Sin métricas de apertura por ahora —
          hoy no se están trackeando.
        </p>
      </header>

      <div className="admin-mail-filters" aria-label="Filtros de mails">
        {typeOptions.map((option) => (
          <Link
            key={option.value}
            href={mailHref(option.value, activePeriod)}
            prefetch={false}
            className={`admin-mail-chip${activeType === option.value ? ' active' : ''}`}
          >
            {option.label}
          </Link>
        ))}

        <Link
          href={mailHref(activeType, 7)}
          prefetch={false}
          className={`admin-mail-chip admin-mail-period-first${activePeriod === 7 ? ' active' : ''}`}
        >
          📅 Últimos 7 días
        </Link>
        <Link
          href={mailHref(activeType, 30)}
          prefetch={false}
          className={`admin-mail-chip${activePeriod === 30 ? ' active' : ''}`}
        >
          Últimos 30 días
        </Link>
        <span className="admin-mail-chip is-disabled" aria-disabled="true" title="Próximamente">
          Rango personalizado
        </span>
      </div>

      <div className="admin-mail-card">
        <div className="admin-mail-overflow-x">
          <table className="admin-mail-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Usuario</th>
                <th>Detalle</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.length ? (
                data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDateTime(row.sentAt)}</td>
                    <td>
                      <span className={tagClass(row)}>{row.label}</span>
                    </td>
                    <td className="admin-mail-user">
                      {row.userName}
                      <span className="admin-mail-email">{row.userEmail}</span>
                    </td>
                    <td className="admin-mail-detail">{row.detail}</td>
                    <td className={statusClass(row.status)}>{statusLabel(row.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="admin-mail-empty">
                    No hay mails registrados para este filtro y período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="admin-mail-note">
        Esta tabla usa únicamente envíos registrados en la base de Evaluo. Por ahora no mostramos
        abierto, clickeado o rebotado porque esos estados no están instrumentados de forma
        consistente.
      </p>

      <h2 className="admin-mail-upcoming-title">Próximos a enviarse</h2>

      <div className="admin-mail-card">
        <div className="admin-mail-overflow-x">
          <table className="admin-mail-table">
            <thead>
              <tr>
                <th>Se envía</th>
                <th>Tipo</th>
                <th>Usuario</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {data.upcoming.length ? (
                data.upcoming.map((row) => (
                  <tr key={row.id}>
                    <td>{formatUpcoming(row.scheduledFor)}</td>
                    <td>
                      <span className={tagClass(row)}>{row.label}</span>
                    </td>
                    <td className="admin-mail-user">
                      {row.userName}
                      <span className="admin-mail-email">{row.userEmail}</span>
                    </td>
                    <td className="admin-mail-detail">{row.detail}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="admin-mail-empty">
                    No hay recordatorios programados en este momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="admin-mail-note">
        “Próximos a enviarse” muestra únicamente envíos que Evaluo puede determinar hoy: los
        recordatorios de examen de 7/3/1 día y recordatorios de flashcards ya programados. Los mails
        de “Material listo” son reactivos y aparecen recién cuando el procesamiento termina.
      </p>
    </section>
  );
}
