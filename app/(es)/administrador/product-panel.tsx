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
  const onboarding = stats.onboarding;
  const onboardingLabels: Record<string, string> = {
    summary: 'Entender',
    practice: 'Practicar',
    topic: 'Estudiar por tema',
    errors: 'Progreso',
  };
  const pctOfStarted = (count: number) =>
    onboarding.started ? formatPct((count / onboarding.started) * 100) : '—';

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

      <div className="admin-stage-label">④ Onboarding — primer PDF · 4 pasos</div>
      <div className="admin-card">
        <h3>¿Los estudiantes entienden qué hace Evaluo?</h3>
        <p className="admin-note">
          Cohorte de estudiantes que iniciaron el recorrido en la fecha seleccionada.
          Entender → Practicar → Estudiar por tema → Progreso.
          La demo y las mediciones de versiones anteriores están excluidas.
        </p>
        <span className="admin-event">first_pdf_guide_* · {onboarding.version}</span>
        <div className="admin-kpi-grid">
          <Metric label="Iniciaron" value={onboarding.started.toLocaleString('es-AR')}
            sub="Estudiantes únicos con inicio registrado" />
          <Metric label="Completaron" value={onboarding.completed.toLocaleString('es-AR')}
            sub={`${formatPct(onboarding.completionPct)} de quienes empezaron`}
            tone={onboarding.started > 0 && onboarding.completionPct >= 80 ? 'good' : 'neutral'} />
          <Metric label="Saltaron" value={onboarding.skipped.toLocaleString('es-AR')}
            sub={`${formatPct(onboarding.skipPct)} de quienes empezaron`}
            tone={onboarding.skipped > 0 ? 'bad' : 'neutral'} />
          <Metric label="Sin cierre registrado" value={onboarding.incomplete.toLocaleString('es-AR')}
            sub="Puede incluir sesiones interrumpidas o eventos pendientes" />
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3>Embudo de los cuatro pasos</h3>
          <span className="admin-event">first_pdf_guide_step_viewed</span>
          {onboarding.steps.map((step, index) => (
            <div key={step.id} className="mb-3">
              <MiniRow
                label={`${index + 1}. ${onboardingLabels[step.id]}`}
                value={`${step.reached.toLocaleString('es-AR')} · ${pctOfStarted(step.reached)}`}
              />
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-500"
                  style={{ width: `${onboarding.started ? Math.min(100, (step.reached / onboarding.started) * 100) : 0}%` }} />
              </div>
            </div>
          ))}
          <div className="admin-note">
            Porcentaje sobre quienes iniciaron. Cada persona se cuenta una vez por paso,
            incluso si vuelve atrás.
          </div>
        </div>
        <div className="admin-card">
          <h3>¿En qué paso se van?</h3>
          <span className="admin-event">first_pdf_guide_skipped · sesiones sin cierre</span>
          {onboarding.steps.map((step) => (
            <MiniRow key={step.id}
              label={onboardingLabels[step.id]}
              value={step.dropoffs.toLocaleString('es-AR')}
              tone={step.dropoffs > 0 ? 'bad' : 'neutral'}
            />
          ))}
          <div className="admin-note">
            Último paso visto entre quienes saltearon o no registraron un cierre.
            Es una señal de abandono, no una prueba de que ese paso causó la salida.
          </div>
        </div>
      </div>

      <div className="admin-grid-3">
        <div className="admin-card">
          <h3>Tiempo hasta completar</h3>
          <Metric label="Mediana" value={formatDuration(onboarding.medianDurationSeconds)}
            sub="Solo recorridos completos de hasta 30 minutos" />
        </div>
        <div className="admin-card">
          <h3>¿Qué hacen después?</h3>
          <Metric label="Primera acción tras completar"
            value={`${onboarding.firstActions} · ${onboarding.completed ? formatPct(onboarding.firstActionPct) : '—'}`}
            sub="Clic real posterior al tutorial, en el mismo material" />
          {Object.entries(onboarding.actions).sort((a, b) => b[1] - a[1]).slice(0, 5)
            .map(([action, count]) => (
              <MiniRow key={action} label={onboardingLabels[action] ?? ({
                practica: 'Práctica', tarjetas: 'Flashcards', resumen: 'Resumen',
                glosario: 'Glosario', mapa: 'Mapa mental', progreso: 'Progreso',
              } as Record<string, string>)[action] ?? action}
                value={count.toLocaleString('es-AR')} />
            ))}
        </div>
        <div className="admin-card">
          <h3>Dispositivo al comenzar</h3>
          <MiniRow label="Teléfono" value={onboarding.mobileStarts.toLocaleString('es-AR')} />
          <MiniRow label="Escritorio u otros" value={onboarding.desktopStarts.toLocaleString('es-AR')} />
          <div className="admin-note">
            Los eventos del nuevo recorrido se contabilizan desde su versión actual;
            no sumamos historiales del onboarding anterior.
          </div>
        </div>
      </div>

      <p className="admin-footnote">
        El costo de IA es equivalente estimado según el uso registrado y la tarifa configurada en
        el panel de IA; no representa necesariamente un cargo efectivo si aplica free tier.
      </p>
    </section>
  );
}
