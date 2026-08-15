'use client';

interface GraphPoint {
  label: string;
  [key: string]: string | number;
}

interface GraphsPanelProps {
  activePeriodLabel: string;
  series: {
    dailyPerformance: Array<{
      label: string;
      usuariosActivos: number;
      preguntasRespondidas: number;
      simuladoresRealizados: number;
    }>;
    dailyUsage: Array<{ label: string; sesiones: number; usuarios: number }>;
    visitorLoginSeries: Array<{ label: string; visitantes: number; logins: number }>;
  };
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

function buildLinePath(points: Array<{ x: number; y: number }>) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function buildAreaPath(points: Array<{ x: number; y: number }>, bottom: number) {
  if (points.length === 0) return '';
  const linePath = buildLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
}

function LineChartCard({
  title,
  description,
  data,
  lines,
}: {
  title: string;
  description: string;
  data: GraphPoint[];
  lines: Array<{ key: string; label: string; color: string }>;
}) {
  const width = 760;
  const height = 320;
  const padding = { top: 24, right: 18, bottom: 42, left: 18 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(
    1,
    ...data.flatMap((item) =>
      lines.map((line) => {
        const raw = item[line.key];
        return typeof raw === 'number' ? raw : 0;
      })
    )
  );
  const safeStep = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  const plotted = lines.map((line) => {
    const points = data.map((item, index) => {
      const raw = item[line.key];
      const value = typeof raw === 'number' ? raw : 0;
      const x = padding.left + safeStep * index;
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
      return { x, y, value, label: item.label };
    });

    return {
      ...line,
      points,
      path: buildLinePath(points),
      areaPath: buildAreaPath(points, padding.top + chartHeight),
      latest: points[points.length - 1] ?? null,
    };
  });

  const guideValues = [0, 0.33, 0.66, 1].map((ratio) => Math.round(maxValue * ratio));

  return (
    <SectionCard title={title} description={description}>
      <div className="overflow-hidden rounded-[24px] border border-[#e7edf8] bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#f8fbff_48%,#f2f6ff_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <div className="mb-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {plotted.map((line) => (
            <div
              key={line.key}
              className="rounded-[18px] border border-white/80 bg-white/90 px-3.5 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center gap-2 text-[12px] text-[#6b7895]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                <span className="font-semibold">{line.label}</span>
              </div>
              <p className="mt-2 text-[1.15rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
                {line.latest?.value ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-[#92a0ba]">Último día visible</p>
            </div>
          ))}
        </div>

        <div className="relative h-[320px] w-full">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
            {guideValues.map((value, index) => {
              const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
              return (
                <g key={`${title}-guide-${index}`}>
                  <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e6ebf5" strokeDasharray="4 4" />
                  <text x={width - padding.right} y={y - 4} textAnchor="end" fontSize="11" fill="#93a0b8">
                    {value}
                  </text>
                </g>
              );
            })}

            {data.map((item, index) => {
              const x = padding.left + safeStep * index;
              return (
                <text
                  key={`${title}-label-${item.label}-${index}`}
                  x={x}
                  y={height - 10}
                  textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'}
                  fontSize="11"
                  fill="#93a0b8"
                >
                  {item.label}
                </text>
              );
            })}

            {plotted.map((line) => (
              <g key={line.key}>
                <path d={line.areaPath} fill={line.color} opacity="0.08" />
                <path d={line.path} fill="none" stroke={line.color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                {line.points.map((point, index) => (
                  <g key={`${line.key}-${point.label}-${index}`}>
                    <circle cx={point.x} cy={point.y} r="5" fill="white" stroke={line.color} strokeWidth="3" />
                    {index === line.points.length - 1 ? (
                      <>
                        <circle cx={point.x} cy={point.y} r="10" fill={line.color} opacity="0.12" />
                        <text x={point.x + 10} y={point.y - 10} fontSize="11" fill={line.color} fontWeight="700">
                          {point.value}
                        </text>
                      </>
                    ) : null}
                    <title>{`${line.label}: ${point.value} (${point.label})`}</title>
                  </g>
                ))}
              </g>
            ))}
          </svg>
        </div>
      </div>
    </SectionCard>
  );
}

export function GraphsPanel({ activePeriodLabel: _activePeriodLabel, series }: GraphsPanelProps) {
  const recentPerformance = series.dailyPerformance.slice(-7);

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-[#e8ebf3] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-[#98a3bb]">Gráficas</p>
        <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">
          Evolución diaria del producto
        </h2>
        <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#7f8aa3]">
                            Aquí podés ver la evolución reciente del producto, enfocada en los últimos 7 días para que la lectura sea más clara.
        </p>
      </div>

      <LineChartCard
        title="Actividad principal"
        description={`Preguntas respondidas, simuladores realizados y usuarios activos en los últimos 7 días.`}
        data={recentPerformance}
        lines={[
          { key: 'preguntasRespondidas', label: 'Preguntas respondidas', color: '#315efb' },
          { key: 'simuladoresRealizados', label: 'Simuladores realizados', color: '#f59e0b' },
          { key: 'usuariosActivos', label: 'Usuarios activos', color: '#16c6b7' },
        ]}
      />

    </div>
  );
}
