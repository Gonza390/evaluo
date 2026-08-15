'use client';

import Link from 'next/link';
import { BookOpen, LogIn, PlayCircle, Target, TrendingUp, UserPlus, Users } from 'lucide-react';

interface ConversionStats {
  rangeDays: 1 | 7 | 30;
  funnel: Array<{ step: string; value: number; conversionPct: number | null }>;
  gate: { reached: number; converted: number; abandoned: number; conversionRatePct: number };
  postSignup: {
    landed: number;
    continued: number;
    dismissed: number;
    resumed: number;
    finished: number;
    resumeRatePct: number;
  };
  demoToSignup: {
    demoReached: number;
    signedUp: number;
    convertedPct: number;
  };
  retention: {
    newUsers: number;
    day2Cohort: number;
    activeDay2: number;
    day2RetentionPct: number;
    day7Cohort: number;
    activeDay7: number;
    day7RetentionPct: number;
    usersWithSimulator: number;
    usersWith2PlusSimulators: number;
    twoPlusPct: number;
  };
  signupSources: Array<{ label: string; value: number }>;
  dailyConversion: Array<{ label: string; registros: number; landings: number; retomas: number }>;
}

interface ConversionPanelProps {
  stats: ConversionStats;
  activePeriodLabel: string;
  activePeriod: 1 | 7 | 30;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[#e8ebf3] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div>
        <h3 className="text-[15px] font-semibold tracking-[-0.03em] text-[#1d2a44]">{title}</h3>
        {description ? <p className="mt-1 text-[13px] text-[#7f8aa3]">{description}</p> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PeriodSwitch({ activePeriod }: { activePeriod: 1 | 7 | 30 }) {
  const options = [
    { value: 1 as const, label: 'Hoy' },
    { value: 7 as const, label: '7d' },
    { value: 30 as const, label: '30d' },
  ];
  return (
    <div className="flex items-center gap-1 rounded-full border border-[#e5ebf8] bg-white p-0.5">
      {options.map((option) => (
        <Link
          key={option.value}
          href={`/administrador?panel=marketing&period=${option.value}`}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
            activePeriod === option.value
              ? 'bg-[#eef3ff] text-[#315efb]'
              : 'text-[#7f8aa3] hover:bg-[#f5f7fb] hover:text-[#1d2a44]'
          }`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

function BarRow({
  step,
  value,
  conversionPct,
  maxValue,
  color,
}: {
  step: string;
  value: number;
  conversionPct: number | null;
  maxValue: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-[12px]">
        <span className="font-medium text-[#4b5874]">{step}</span>
        <span className="shrink-0 text-[#7f8aa3]">
          {value.toLocaleString('es-AR')}
          {conversionPct !== null ? (
            <span className="ml-2 font-semibold text-[#1d2a44]">{conversionPct.toFixed(1)}%</span>
          ) : null}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-[#edf1f7]">
        <div
          className="h-2.5 rounded-full"
          style={{
            width: `${maxValue > 0 ? Math.max((value / maxValue) * 100, 3) : 0}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

export function ConversionPanel({
  stats,
  activePeriodLabel,
  activePeriod,
}: ConversionPanelProps) {
  const funnelBase = stats.funnel[0]?.value ?? 0;
  const funnelColors = ['#2f66ea', '#5b8def', '#9b5de5', '#16a34a', '#f59e0b', '#0ea5e9', '#dc2626'];

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-[#e8ebf3] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-[#98a3bb]">
            Resumen de conversión · {activePeriodLabel.toLowerCase()}
          </p>
          <PeriodSwitch activePeriod={activePeriod} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-4">
          <div className="rounded-[16px] border border-[#edf1f7] bg-[#fbfcff] px-4 py-4">
            <div className="flex items-center gap-2">
              <LogIn className="h-3.5 w-3.5 text-[#315efb]" />
              <p className="text-[12px] font-medium text-[#7f8aa3]">Tasa de conversión del gate</p>
            </div>
            <p className="mt-2 text-[1.4rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
              {formatPct(stats.gate.conversionRatePct)}
            </p>
            <p className="mt-1 text-[11px] text-[#95a0b8]">
              {stats.gate.converted.toLocaleString('es-AR')} de {stats.gate.reached.toLocaleString('es-AR')} sesiones
            </p>
          </div>
          <div className="rounded-[16px] border border-[#edf1f7] bg-[#fbfcff] px-4 py-4">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-[#9b5de5]" />
              <p className="text-[12px] font-medium text-[#7f8aa3]">Demo → registro</p>
            </div>
            <p className="mt-2 text-[1.4rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
              {formatPct(stats.demoToSignup.convertedPct)}
            </p>
            <p className="mt-1 text-[11px] text-[#95a0b8]">
              {stats.demoToSignup.signedUp.toLocaleString('es-AR')} de {stats.demoToSignup.demoReached.toLocaleString('es-AR')} que llegaron al checkpoint
            </p>
          </div>
          <div className="rounded-[16px] border border-[#edf1f7] bg-[#fbfcff] px-4 py-4">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-3.5 w-3.5 text-[#16a34a]" />
              <p className="text-[12px] font-medium text-[#7f8aa3]">Retoma del examen post-registro</p>
            </div>
            <p className="mt-2 text-[1.4rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
              {formatPct(stats.postSignup.resumeRatePct)}
            </p>
            <p className="mt-1 text-[11px] text-[#95a0b8]">
              {stats.postSignup.resumed.toLocaleString('es-AR')} de {stats.postSignup.landed.toLocaleString('es-AR')} que aterrizaron en el dashboard
            </p>
          </div>
          <div className="rounded-[16px] border border-[#edf1f7] bg-[#fbfcff] px-4 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[#f59e0b]" />
              <p className="text-[12px] font-medium text-[#7f8aa3]">Retención día 7</p>
            </div>
            <p className="mt-2 text-[1.4rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
              {formatPct(stats.retention.day7RetentionPct)}
            </p>
            <p className="mt-1 text-[11px] text-[#95a0b8]">
              {stats.retention.activeDay7.toLocaleString('es-AR')} de {stats.retention.day7Cohort.toLocaleString('es-AR')} usuarios de la cohorte
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Funnel de conversión"
          description="Del simulador de muestra al registro, la retoma y la finalización. Cada paso muestra su tasa de conversión respecto del anterior."
        >
          <div className="space-y-3">
            {stats.funnel.map((item, index) => (
              <BarRow
                key={item.step}
                step={item.step}
                value={item.value}
                conversionPct={item.conversionPct}
                maxValue={funnelBase}
                color={funnelColors[index % funnelColors.length]}
              />
            ))}
            <p className="pt-1 text-[11px] text-[#95a0b8]">
              Los pasos previos al registro se cuentan por sesión anónima; los posteriores, por usuario registrado.
            </p>
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Gate de login" description="Personas que vieron el gate y completaron el login en esa misma sesión.">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-[12px] border border-[#edf1f7] bg-[#fbfcff] px-3 py-2.5 text-[12px]">
                <span className="text-[#4b5874]">Vieron el gate</span>
                <span className="font-semibold text-[#1d2a44]">{stats.gate.reached.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-[#edf1f7] bg-[#fbfcff] px-3 py-2.5 text-[12px]">
                <span className="text-[#4b5874]">Se loguearon</span>
                <span className="font-semibold text-emerald-600">{stats.gate.converted.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-[#edf1f7] bg-[#fbfcff] px-3 py-2.5 text-[12px]">
                <span className="text-[#4b5874]">Abandonaron</span>
                <span className="font-semibold text-amber-600">{stats.gate.abandoned.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Post-registro" description="Qué hicieron quienes aterrizaron en el dashboard tras registrarse desde el simulador.">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-[12px] border border-[#edf1f7] bg-[#fbfcff] px-3 py-2.5 text-[12px]">
                <span className="text-[#4b5874]">Aterrizaron en el dashboard</span>
                <span className="font-semibold text-[#1d2a44]">{stats.postSignup.landed.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-[#edf1f7] bg-[#fbfcff] px-3 py-2.5 text-[12px]">
                <span className="text-[#4b5874]">Clickearon "Continuar"</span>
                <span className="font-semibold text-[#1d2a44]">{stats.postSignup.continued.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-[#edf1f7] bg-[#fbfcff] px-3 py-2.5 text-[12px]">
                <span className="text-[#4b5874]">Retomaron el simulador</span>
                <span className="font-semibold text-[#1d2a44]">{stats.postSignup.resumed.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-[#edf1f7] bg-[#fbfcff] px-3 py-2.5 text-[12px]">
                <span className="text-[#4b5874]">Terminaron el simulador</span>
                <span className="font-semibold text-[#1d2a44]">{stats.postSignup.finished.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-[#edf1f7] bg-[#fbfcff] px-3 py-2.5 text-[12px]">
                <span className="text-[#4b5874]">Descartaron el modal</span>
                <span className="font-semibold text-[#1d2a44]">{stats.postSignup.dismissed.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard title="Retención temprana" description="Nuevos usuarios del período y su vuelta al producto.">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[12px] border border-[#edf1f7] bg-[#fbfcff] px-3 py-3">
                <div className="flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5 text-[#315efb]" />
                  <p className="text-[11px] font-medium text-[#7f8aa3]">Nuevos usuarios</p>
                </div>
                <p className="mt-1 text-[1.15rem] font-semibold text-[#1d2a44]">
                  {stats.retention.newUsers.toLocaleString('es-AR')}
                </p>
              </div>
              <div className="rounded-[12px] border border-[#edf1f7] bg-[#fbfcff] px-3 py-3">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#9b5de5]" />
                  <p className="text-[11px] font-medium text-[#7f8aa3]">Hicieron 2+ simuladores</p>
                </div>
                <p className="mt-1 text-[1.15rem] font-semibold text-[#1d2a44]">
                  {stats.retention.usersWith2PlusSimulators.toLocaleString('es-AR')}
                  <span className="ml-1.5 text-[11px] font-medium text-[#7f8aa3]">
                    {formatPct(stats.retention.twoPlusPct)}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#4b5874]">Activos al día 2</span>
                <span className="font-semibold text-[#1d2a44]">
                  {formatPct(stats.retention.day2RetentionPct)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#edf1f7]">
                <div
                  className="h-2.5 rounded-full bg-[#16a34a]"
                  style={{ width: `${Math.max(stats.retention.day2RetentionPct, 3)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-[#95a0b8]">
                {stats.retention.activeDay2.toLocaleString('es-AR')} de {stats.retention.day2Cohort.toLocaleString('es-AR')} usuarios con 2+ días de antigüedad
              </p>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#4b5874]">Activos al día 7</span>
                <span className="font-semibold text-[#1d2a44]">
                  {formatPct(stats.retention.day7RetentionPct)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#edf1f7]">
                <div
                  className="h-2.5 rounded-full bg-[#f59e0b]"
                  style={{ width: `${Math.max(stats.retention.day7RetentionPct, 3)}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-[#95a0b8]">
                {stats.retention.activeDay7.toLocaleString('es-AR')} de {stats.retention.day7Cohort.toLocaleString('es-AR')} usuarios con 7+ días de antigüedad
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Origen del registro" description="Desde qué superficie se completó el registro.">
          {stats.signupSources.length === 0 ? (
            <p className="text-[12px] text-[#95a0b8]">Sin registros en el período.</p>
          ) : (
            <div className="space-y-2">
              {stats.signupSources.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="truncate text-[#4b5874]">{item.label}</span>
                    <span className="font-semibold text-[#1d2a44]">{item.value.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#edf1f7]">
                    <div
                      className="h-2 rounded-full bg-[#5b8def]"
                      style={{ width: `${Math.max((item.value / stats.signupSources[0].value) * 100, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Conversión diaria" description="Registros, aterrizajes en dashboard y retomas de nuevos usuarios por día.">
          {stats.dailyConversion.length === 0 ? (
            <p className="text-[12px] text-[#95a0b8]">Sin datos para el período.</p>
          ) : (
            <div className="overflow-hidden rounded-[12px] border border-[#edf1f7]">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[#fbfcff] text-left text-[11px] text-[#7f8aa3]">
                    <th className="px-3 py-2 font-medium">Día</th>
                    <th className="px-3 py-2 text-right font-medium">Registros</th>
                    <th className="px-3 py-2 text-right font-medium">Aterrizajes</th>
                    <th className="px-3 py-2 text-right font-medium">Retomas</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.dailyConversion.map((day) => (
                    <tr key={day.label} className="border-t border-[#edf1f7]">
                      <td className="px-3 py-2 font-medium text-[#4b5874]">{day.label}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[#1d2a44]">{day.registros}</td>
                      <td className="px-3 py-2 text-right text-[#4b5874]">{day.landings}</td>
                      <td className="px-3 py-2 text-right text-[#4b5874]">{day.retomas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="rounded-[22px] border border-[#e8ebf3] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#315efb]" />
          <p className="text-[13px] font-medium text-[#1d2a44]">Cómo leer este panel</p>
        </div>
        <p className="mt-2 text-[12px] leading-5 text-[#7f8aa3]">
          El objetivo del funel es medir el recorrido nuevo: simulador de muestra → registro → dashboard → retoma del examen.
          Si la retención a 7 días o la tasa de retoma son bajas, el problema está después del registro; si la conversión del
          gate es baja, el problema está en el momento de pedir la cuenta. Los datos de pago todavía no existen en la base,
          así que este panel mide hasta la activación, no el ingreso.
        </p>
      </div>
    </div>
  );
}
