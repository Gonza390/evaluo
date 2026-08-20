'use client';

import { CheckCircle2, Share2, Target, TrendingUp, UserPlus } from 'lucide-react';

interface FocusSubject {
  id: string;
  name: string;
  parcial: number;
  ready: number;
  started: number;
  answered1: number;
  answered5: number;
  activated: number;
  registered: number;
  finished: number;
}

interface ConversionStats {
  premium: {
    pricingViews: number;
    intentClicks: number;
    checkoutClicks: number;
    checkoutUsers: number;
    activatedUsers: number;
    activeSubscriptions: number;
    pricingToCheckoutPct: number;
    checkoutToPaidPct: number;
    sources: Array<{ source: string; clicks: number }>;
  };
  gate: { reached: number; converted: number; conversionRatePct: number };
  retention: {
    day7Cohort: number;
    activeDay7: number;
    day7RetentionPct: number;
    usersWith2PlusSimulators: number;
    twoPlusPct: number;
  };
  signupSources: Array<{ label: string; value: number }>;
  focusSubjects: FocusSubject[];
  acquisitionChannels: Array<{
    channel: string;
    ready: number;
    activated: number;
    activationPct: number;
  }>;
  needsFeedback: Array<{ reason: string; value: number }>;
  sharing: {
    shares: number;
    authenticatedShares: number;
    anonymousShares: number;
    referredVisits: number;
    started: number;
    finished: number;
    registered: number;
    topSharers: Array<{
      userId: string;
      email: string;
      shares: number;
      referredVisits: number;
      started: number;
      finished: number;
      registered: number;
    }>;
    links: Array<{
      shareId: string;
      email: string;
      materia: string;
      parcial: number;
      kind: string;
      method: string;
      createdAt: string;
      visits: number;
      started: number;
      finished: number;
      registered: number;
    }>;
  };
}

function percentage(value: number, base: number) {
  return base > 0 ? (value / base) * 100 : 0;
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`;
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="border-border bg-card rounded-2xl border p-5 shadow-sm">
      <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
        {label}
      </p>
      <p className="text-foreground mt-3 text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-muted-foreground mt-2 text-sm">{detail}</p>
    </article>
  );
}

function FunnelRow({ label, value, base }: { label: string; value: number; base: number }) {
  const pct = percentage(value, base);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-foreground font-medium">{label}</span>
          <span className="text-muted-foreground">{formatPercentage(pct)}</span>
        </div>
        <div className="bg-white mt-2 h-2 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full"
            style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%` }}
          />
        </div>
      </div>
      <span className="text-foreground min-w-10 text-right text-sm font-bold">{value}</span>
    </div>
  );
}

function SubjectFunnel({ subject }: { subject: FocusSubject }) {
  const stages = [
    ['Simulador listo', subject.ready],
    ['Comenzaron', subject.started],
    ['Respondieron 1', subject.answered1],
    ['Respondieron 5', subject.answered5],
    ['Activados (10)', subject.activated],
    ['Se registraron', subject.registered],
    ['Terminaron', subject.finished],
  ] as const;
  const base = Math.max(subject.ready, subject.started, 1);

  return (
    <article className="border-border bg-card rounded-3xl border p-5 shadow-sm sm:p-6">
      <div className="border-border flex flex-col gap-2 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-primary text-xs font-semibold tracking-[0.16em] uppercase">
            Materia prioritaria
          </p>
          <h3 className="text-foreground mt-2 text-xl font-bold tracking-tight">{subject.name}</h3>
          <p className="text-muted-foreground mt-1 text-sm">Parcial {subject.parcial}</p>
        </div>
        <div className="bg-primary/10 text-primary rounded-xl px-3 py-2 text-sm font-bold">
          {formatPercentage(percentage(subject.activated, base))} activación
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {stages.map(([label, value]) => (
          <FunnelRow key={label} label={label} value={value} base={base} />
        ))}
      </div>
    </article>
  );
}

export function ConversionPanel({
  stats,
  periodLabel,
}: {
  stats: ConversionStats;
  periodLabel: string;
}) {
  const totalReady = stats.focusSubjects.reduce((sum, item) => sum + item.ready, 0);
  const totalStarted = stats.focusSubjects.reduce((sum, item) => sum + item.started, 0);
  const totalActivated = stats.focusSubjects.reduce((sum, item) => sum + item.activated, 0);
  const totalFinished = stats.focusSubjects.reduce((sum, item) => sum + item.finished, 0);
  const activationRate = percentage(totalActivated, Math.max(totalReady, totalStarted));
  const startRate = percentage(totalStarted, totalReady);
  const hasNewFunnelData = totalReady > 0 || totalStarted > 0;

  return (
    <div className="space-y-5">
      <section className="border-primary/20 bg-card rounded-3xl border p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
              Monetización
            </p>
            <h2 className="text-foreground mt-2 text-2xl font-bold tracking-tight">
              Embudo Premium
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Sesiones y usuarios únicos durante {periodLabel.toLowerCase()}.
            </p>
          </div>
          <div className="bg-primary/10 text-primary rounded-2xl px-4 py-3 text-sm font-bold">
            {stats.premium.activeSubscriptions} suscripciones activas
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Visitas a precios"
            value={String(stats.premium.pricingViews)}
            detail={`${stats.premium.intentClicks} llegaron desde un upsell`}
          />
          <MetricCard
            label="Checkout iniciado"
            value={String(stats.premium.checkoutUsers)}
            detail={`${stats.premium.pricingToCheckoutPct.toFixed(1)}% desde pricing`}
          />
          <MetricCard
            label="Nuevos Premium"
            value={String(stats.premium.activatedUsers)}
            detail={`${stats.premium.checkoutToPaidPct.toFixed(1)}% de los checkouts`}
          />
          <MetricCard
            label="Intención de pago"
            value={String(stats.premium.checkoutClicks)}
            detail="Clics únicos en Suscribirme"
          />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="border-border rounded-2xl border p-5">
            <h3 className="text-foreground font-bold">Conversión paso a paso</h3>
            <div className="mt-5 space-y-4">
              <FunnelRow
                label="Vieron precios"
                value={stats.premium.pricingViews}
                base={Math.max(stats.premium.pricingViews, 1)}
              />
              <FunnelRow
                label="Hicieron clic en suscribirse"
                value={stats.premium.checkoutClicks}
                base={Math.max(stats.premium.pricingViews, 1)}
              />
              <FunnelRow
                label="Mercado Pago creado"
                value={stats.premium.checkoutUsers}
                base={Math.max(stats.premium.pricingViews, 1)}
              />
              <FunnelRow
                label="Suscripción activada"
                value={stats.premium.activatedUsers}
                base={Math.max(stats.premium.pricingViews, 1)}
              />
            </div>
          </article>

          <article className="border-border rounded-2xl border p-5">
            <h3 className="text-foreground font-bold">Origen de la intención Premium</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Qué límite o herramienta llevó al estudiante a conocer el plan.
            </p>
            <div className="mt-4 space-y-2">
              {stats.premium.sources.length > 0 ? (
                stats.premium.sources.slice(0, 8).map((item) => (
                  <div
                    key={item.source}
                    className="bg-white flex items-center justify-between rounded-xl px-3 py-3 text-sm"
                  >
                    <span className="text-foreground font-medium">{item.source}</span>
                    <strong className="text-primary">{item.clicks}</strong>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Los orígenes aparecerán cuando se publiquen los nuevos eventos.
                </p>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="border-border bg-card rounded-3xl border p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
              Resumen ejecutivo
            </p>
            <h2 className="text-foreground mt-2 text-2xl font-bold tracking-tight">
              ¿Los estudiantes encuentran valor?
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Activación significa alcanzar 10 preguntas corregidas. Período:{' '}
              {periodLabel.toLowerCase()}.
            </p>
          </div>
          <div className="bg-white text-muted-foreground flex items-center gap-2 rounded-2xl px-4 py-3 text-sm">
            <Target className="text-primary h-5 w-5" /> Foco: Universidad Siglo 21
          </div>
        </div>
        {!hasNewFunnelData ? (
          <div className="border-border bg-white mt-6 rounded-2xl border border-dashed p-5">
            <p className="text-foreground font-semibold">Todavía no hay datos del nuevo funnel</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Los eventos empiezan a acumularse después de publicar esta versión.
            </p>
          </div>
        ) : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Simuladores listos"
            value={String(totalReady)}
            detail="Sesiones con preguntas cargadas"
          />
          <MetricCard
            label="Tasa de inicio"
            value={formatPercentage(startRate)}
            detail={`${totalStarted} comenzaron`}
          />
          <MetricCard
            label="Activación"
            value={formatPercentage(activationRate)}
            detail={`${totalActivated} llegaron a 10`}
          />
          <MetricCard
            label="Finalizados"
            value={String(totalFinished)}
            detail="Completaron el simulador"
          />
        </div>
      </section>

      <section aria-labelledby="materias-prioritarias-title">
        <h2 id="materias-prioritarias-title" className="text-foreground mb-3 text-lg font-bold">
          Dónde se pierde el estudiante
        </h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {stats.focusSubjects.map((subject) => (
            <SubjectFunnel key={`${subject.id}-${subject.parcial}`} subject={subject} />
          ))}
        </div>
      </section>

      <section className="border-border bg-card rounded-3xl border p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary rounded-2xl p-3">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-foreground text-lg font-bold">Crecimiento por links compartidos</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Cada link se sigue desde que se comparte hasta registro. Los datos comienzan con esta
              versión.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Links compartidos"
            value={String(stats.sharing.shares)}
            detail={`${stats.sharing.authenticatedShares} con usuario · ${stats.sharing.anonymousShares} anónimos`}
          />
          <MetricCard
            label="Ingresos por link"
            value={String(stats.sharing.referredVisits)}
            detail="Sesiones atribuidas"
          />
          <MetricCard
            label="Comenzaron"
            value={String(stats.sharing.started)}
            detail={`${formatPercentage(percentage(stats.sharing.started, stats.sharing.referredVisits))} de los ingresos`}
          />
          <MetricCard
            label="Finalizaron"
            value={String(stats.sharing.finished)}
            detail="Simuladores terminados"
          />
          <MetricCard
            label="Se registraron"
            value={String(stats.sharing.registered)}
            detail="Registros atribuidos"
          />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <article className="border-border rounded-2xl border p-4">
            <h3 className="text-foreground font-bold">Usuarios que más crecimiento generan</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Ordenados por registros, inicios, ingresos y cantidad compartida.
            </p>
            <div className="mt-4 space-y-2">
              {stats.sharing.topSharers.length > 0 ? (
                stats.sharing.topSharers.map((user) => (
                  <div
                    key={user.userId}
                    className="bg-white grid gap-1 rounded-xl px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <span className="text-foreground truncate font-medium">{user.email}</span>
                    <span className="text-muted-foreground">
                      {user.shares} links · {user.referredVisits} ingresos · {user.started} inicios
                      · {user.registered} registros
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Todavía no hay usuarios registrados que hayan compartido.
                </p>
              )}
            </div>
          </article>

          <article className="border-border rounded-2xl border p-4">
            <h3 className="text-foreground font-bold">Rendimiento de los últimos links</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Permite detectar qué materia, parcial y usuario generan visitas útiles.
            </p>
            <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {stats.sharing.links.length > 0 ? (
                stats.sharing.links.map((link) => (
                  <div key={link.shareId} className="bg-white rounded-xl px-3 py-3 text-sm">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-foreground truncate font-medium">{link.email}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {link.materia} · Parcial {link.parcial} ·{' '}
                          {link.kind === 'resultado' ? 'Resultado' : 'Preguntero'}
                        </p>
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {new Date(link.createdAt).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">
                      {link.visits} ingresos · {link.started} inicios · {link.finished} finalizados
                      · {link.registered} registros ·{' '}
                      {link.method === 'copy_link' ? 'Copiado' : 'Compartir del dispositivo'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Todavía no se compartieron links medibles.
                </p>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="border-border bg-card rounded-3xl border p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <UserPlus className="text-primary h-5 w-5" />
            <h2 className="text-foreground font-bold">Conversión del gate</h2>
          </div>
          <p className="text-foreground mt-4 text-3xl font-bold">
            {formatPercentage(stats.gate.conversionRatePct)}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {stats.gate.converted} de {stats.gate.reached} sesiones completaron el acceso.
          </p>
        </article>
        <article className="border-border bg-card rounded-3xl border p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-primary h-5 w-5" />
            <h2 className="text-foreground font-bold">Retención día 7</h2>
          </div>
          <p className="text-foreground mt-4 text-3xl font-bold">
            {stats.retention.day7Cohort >= 10
              ? formatPercentage(stats.retention.day7RetentionPct)
              : 'Muestra insuficiente'}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {stats.retention.activeDay7} de {stats.retention.day7Cohort} estudiantes volvieron.
          </p>
        </article>
        <article className="border-border bg-card rounded-3xl border p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary h-5 w-5" />
            <h2 className="text-foreground font-bold">Uso repetido</h2>
          </div>
          <p className="text-foreground mt-4 text-3xl font-bold">
            {formatPercentage(stats.retention.twoPlusPct)}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {stats.retention.usersWith2PlusSimulators} hicieron dos o más simuladores.
          </p>
        </article>
      </section>

      <section className="border-border bg-card rounded-3xl border p-5 shadow-sm">
        <h2 className="text-foreground font-bold">Origen de los registros</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Solo fuentes con registros reales en el período.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {stats.signupSources.length > 0 ? (
            stats.signupSources.map((source) => (
              <div
                key={source.label}
                className="bg-white flex items-center justify-between rounded-xl px-4 py-3 text-sm"
              >
                <span className="text-muted-foreground">{source.label}</span>
                <strong className="text-foreground">{source.value}</strong>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">Sin registros en este período.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="border-border bg-card rounded-3xl border p-5 shadow-sm">
          <h2 className="text-foreground font-bold">Canales que traen estudiantes activados</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Compara simuladores listos con sesiones que alcanzaron 10 respuestas.
          </p>
          <div className="mt-4 space-y-3">
            {stats.acquisitionChannels.length > 0 ? (
              stats.acquisitionChannels.map((item) => (
                <div
                  key={item.channel}
                  className="bg-white grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl px-4 py-3 text-sm"
                >
                  <span className="text-foreground font-medium">{item.channel}</span>
                  <span className="text-muted-foreground">
                    {item.activated}/{item.ready}
                  </span>
                  <strong className="text-primary">{formatPercentage(item.activationPct)}</strong>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Todavía no hay campañas etiquetadas.</p>
            )}
          </div>
        </article>
        <article className="border-border bg-card rounded-3xl border p-5 shadow-sm">
          <h2 className="text-foreground font-bold">Qué necesitan los estudiantes</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Respuestas recibidas en el gate y al terminar.
          </p>
          <div className="mt-4 space-y-3">
            {stats.needsFeedback.length > 0 ? (
              stats.needsFeedback.map((item) => (
                <div
                  key={item.reason}
                  className="bg-white flex items-center justify-between rounded-xl px-4 py-3 text-sm"
                >
                  <span className="text-foreground">
                    {{
                      more_questions: 'Más preguntas',
                      better_explanations: 'Mejores explicaciones',
                      summaries: 'Resúmenes',
                      exam_similarity: 'Preguntas más parecidas al parcial',
                      confusing_experience: 'Una experiencia más clara',
                    }[item.reason] ?? item.reason}
                  </span>
                  <strong className="text-foreground">{item.value}</strong>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Todavía no recibimos respuestas.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
