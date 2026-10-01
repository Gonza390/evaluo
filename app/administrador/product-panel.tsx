import type { ProductDailyStats } from './product-actions';
import { ProductDatePicker } from './product-date-picker';

function formatPct(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}

function formatSignupToPdf(seconds: number | null) {
  if (seconds === null) return '—';
  if (seconds < 60 * 60) return formatDuration(seconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function formatUsd(value: number | null) {
  if (value === null) return '—';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value < 0.01 ? 4 : 2,
    maximumFractionDigits: value < 0.01 ? 4 : 2,
  }).format(value);
}

function Metric({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'neutral' | 'good' | 'bad';
}) {
  return (
    <div className="admin-kpi">
      <div className="admin-kpi-label">{label}</div>
      <div className="admin-kpi-value">{value}</div>
      {sub ? (
        <div
          className={
            tone === 'good'
              ? 'admin-kpi-sub admin-good'
              : tone === 'bad'
                ? 'admin-kpi-sub admin-bad'
                : 'admin-kpi-sub'
          }
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function MiniRow({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'good' | 'bad';
}) {
  return (
    <div className="admin-mini-row">
      <span className="admin-mini-name">{label}</span>
      <span
        className={
          tone === 'good'
            ? 'admin-mini-value admin-good'
            : tone === 'bad'
              ? 'admin-mini-value admin-bad'
              : 'admin-mini-value'
        }
      >
        {value}
      </span>
    </div>
  );
}

export function ProductPanel({ stats }: { stats: ProductDailyStats }) {
  const registrationTrend =
    stats.entry.registrationsTrendPct === null
      ? stats.entry.registrations > 0
        ? 'Nuevo vs. ayer'
        : 'Sin variación'
      : `${stats.entry.registrationsTrendPct >= 0 ? '↑' : '↓'} ${Math.abs(
          stats.entry.registrationsTrendPct
        ).toFixed(1).replace('.', ',')}% vs. ayer`;

  const gateClickPct =
    stats.entry.gateViewed > 0 ? (stats.entry.gateClicked / stats.entry.gateViewed) * 100 : 0;
  const gateRegisterPct =
    stats.entry.gateViewed > 0 ? (stats.entry.gateRegistered / stats.entry.gateViewed) * 100 : 0;
  const failedPct =
    stats.activation.uploads > 0 ? (stats.activation.failed / stats.activation.uploads) * 100 : 0;

  return (
    <section className="admin-product">
      <header className="admin-page-header">
        <div>
          <h1>Resumen diario</h1>
          <p>
            Qué pasa una vez que el usuario está en Evaluo: entra, activa con un PDF y usa el
            material generado.
          </p>
        </div>
        <ProductDatePicker
          value={stats.dateKey}
          max={stats.todayKey}
          label={stats.dateLabel}
          isToday={stats.isToday}
        />
      </header>

      <div className="admin-funnel-mini" aria-label={`Actividad del ${stats.dateLabel}`}>
        <b>{stats.funnel.sessions.toLocaleString('es-AR')}</b> sesiones
        <span>→</span>
        <b>{stats.funnel.registrations.toLocaleString('es-AR')}</b> registros
        <span>→</span>
        <b>{stats.funnel.pdfUploads.toLocaleString('es-AR')}</b> subieron PDF
        <span>→</span>
        <b>{stats.funnel.openedResults.toLocaleString('es-AR')}</b> abrieron el resultado
      </div>

      <div className="admin-stage-label">① Entra — cuentas, login y gate</div>
      <div className="admin-grid-2">
        <div className="admin-kpi-grid">
          <Metric
            label="Registros nuevos"
            value={stats.entry.registrations.toLocaleString('es-AR')}
            sub={registrationTrend}
            tone={
              stats.entry.registrationsTrendPct !== null && stats.entry.registrationsTrendPct < 0
                ? 'bad'
                : 'good'
            }
          />
          <Metric
            label="Usuarios autenticados activos"
            value={stats.entry.loggedUsers.toLocaleString('es-AR')}
            sub={`${stats.entry.newLoggedUsers} nuevos · ${stats.entry.recurrentLoggedUsers} recurrentes`}
          />
          <Metric
            label="Sesiones anónimas / logueadas"
            value={`${formatPct(stats.entry.anonymousSessionPct)} / ${formatPct(
              stats.entry.loggedSessionPct
            )}`}
            sub="Sobre sesiones con actividad real del día"
          />
          <Metric
            label="Logins fallidos"
            value={stats.entry.failedLogins.toLocaleString('es-AR')}
            sub={stats.entry.failedLogins === 0 ? 'Sin errores detectados' : 'Revisar si aumenta'}
            tone={stats.entry.failedLogins === 0 ? 'good' : 'bad'}
          />
        </div>

        <div className="admin-card">
          <h3>Efectividad del gate</h3>
          <span className="admin-event">
            pdf_gate_viewed · simulator_login_gate_viewed · signup_completed
          </span>
          <MiniRow label="Vio algún gate" value={stats.entry.gateViewed.toLocaleString('es-AR')} />
          <MiniRow
            label={'Clickeó "crear cuenta"'}
            value={`${stats.entry.gateClicked} · ${formatPct(gateClickPct)}`}
          />
          <MiniRow
            label="Completó el registro"
            value={`${stats.entry.gateRegistered} · ${formatPct(gateRegisterPct)}`}
            tone={stats.entry.gateViewed > 0 && gateRegisterPct < 10 ? 'bad' : 'neutral'}
          />
          <div className="admin-note">
            Mide si los gates que ya existen terminan convirtiendo en una cuenta real.
          </div>
        </div>
      </div>

      <div className="admin-stage-label">② Activa — subida y procesamiento de PDF</div>
      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>PDFs subidos: {stats.activation.uploads}</h3>
          <span className="admin-event">student_materials · student_material_jobs</span>
          <MiniRow
            label="Procesados OK"
            value={stats.activation.ready.toLocaleString('es-AR')}
            tone="good"
          />
          <MiniRow
            label="Con error"
            value={`${stats.activation.failed} · ${formatPct(failedPct)}`}
            tone={stats.activation.failed > 0 ? 'bad' : 'good'}
          />
          <MiniRow
            label="Trabados +15 min"
            value={stats.activation.stuckOver15m.toLocaleString('es-AR')}
            tone={stats.activation.stuckOver15m > 0 ? 'bad' : 'good'}
          />
          <MiniRow
            label="Tiempo prom. de procesamiento"
            value={formatDuration(stats.activation.averageProcessingSeconds)}
          />
        </div>

        <div className="admin-card">
          <h3>Quién sube</h3>
          <span className="admin-event">auth.users + student_materials</span>
          <MiniRow
            label="Primera vez"
            value={stats.activation.firstTimeUploaders.toLocaleString('es-AR')}
            tone="good"
          />
          <MiniRow
            label="Ya había subido antes"
            value={stats.activation.repeatUploaders.toLocaleString('es-AR')}
          />
          <MiniRow
            label="Tiempo prom. registro → 1er PDF"
            value={formatSignupToPdf(stats.activation.averageSignupToFirstPdfSeconds)}
          />
          <MiniRow
            label="Costo IA prom. por PDF"
            value={formatUsd(stats.activation.averageAiCostUsd)}
          />
        </div>
      </div>

      <div className="admin-stage-label">③ Usa — contenido generado</div>
      <div className="admin-grid-3">
        <div className="admin-card">
          <span className="admin-event">student_material_study_opened</span>
          <MiniRow
            label="Abrieron el material"
            value={`${stats.usage.openedMaterials} / ${stats.activation.ready}`}
            tone={stats.usage.openedMaterials > 0 ? 'good' : 'neutral'}
          />
        </div>

        <div className="admin-card">
          <span className="admin-event">student_material_feedback</span>
          <MiniRow
            label="Feedback 👍"
            value={stats.usage.positiveFeedback.toLocaleString('es-AR')}
            tone="good"
          />
          <MiniRow
            label="Feedback 👎 / reportes"
            value={stats.usage.negativeFeedbackOrReports.toLocaleString('es-AR')}
            tone={stats.usage.negativeFeedbackOrReports > 0 ? 'bad' : 'neutral'}
          />
        </div>

        <div className="admin-card">
          <span className="admin-event">auth.users + student_materials</span>
          <MiniRow
            label="Registró pero no subió PDF"
            value={stats.usage.registeredWithoutPdf.toLocaleString('es-AR')}
            tone={stats.usage.registeredWithoutPdf > 0 ? 'bad' : 'neutral'}
          />
          <MiniRow
            label="Subió PDF, no volvió a abrirlo"
            value={stats.usage.uploadedWithoutOpen.toLocaleString('es-AR')}
            tone={stats.usage.uploadedWithoutOpen > 0 ? 'bad' : 'neutral'}
          />
        </div>
      </div>

      <p className="admin-footnote">
        El costo de IA es equivalente estimado según el uso registrado y la tarifa configurada en
        el panel de IA; no representa necesariamente un cargo efectivo si aplica free tier.
      </p>
    </section>
  );
}
