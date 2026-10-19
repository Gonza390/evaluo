'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface VisitorLoginPoint {
  label: string;
  visitantes: number;
  logins: number;
}

interface RecentActivityItem {
  action: string;
  details: string;
  actor: string;
  date: string | null;
  tone: 'green' | 'blue' | 'orange' | 'violet';
}

function InsightCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-[#e8ebf3] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <h3 className="text-[15px] font-semibold tracking-[-0.03em] text-[#1d2a44]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function DashboardInsights({
  visitorLoginSeries,
  recentActivity,
}: {
  visitorLoginSeries: VisitorLoginPoint[];
  recentActivity: RecentActivityItem[];
}) {
  const toneClasses = {
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    violet: 'bg-violet-50 text-violet-700',
  } as const;

  return (
    <div className="mt-6 space-y-4">
      <InsightCard title="Ingresos y logins">
        {visitorLoginSeries.length === 0 ? (
          <p className="text-[13px] text-[#7f8aa3]">Todavía no hay datos suficientes para este período.</p>
        ) : (
          <div className="h-[320px] rounded-[18px] border border-[#edf1f7] bg-white px-3 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitorLoginSeries}>
                <CartesianGrid vertical={false} stroke="#e9edf5" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8b95aa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8b95aa' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: '1px solid #e6ebf5',
                    boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line
                  type="natural"
                  dataKey="visitantes"
                  stroke="#2f66ea"
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 0, fill: '#2f66ea' }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#2f66ea' }}
                  name="Ingresaron"
                />
                <Line
                  type="natural"
                  dataKey="logins"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 0, fill: '#7c3aed' }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#7c3aed' }}
                  name="Se loguearon"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </InsightCard>

      <InsightCard title="Actividad reciente">
        {recentActivity.length === 0 ? (
          <p className="text-[13px] text-[#7f8aa3]">Todavía no hay actividad reciente para mostrar.</p>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-[#edf1f7]">
            <div className="grid grid-cols-[140px_minmax(0,1fr)_140px_140px] border-b border-[#edf1f7] bg-white px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8c97ad]">
              <span>Acción</span>
              <span>Detalles</span>
              <span>Administrador</span>
              <span>Fecha</span>
            </div>
            <div className="divide-y divide-[#edf1f7]">
              {recentActivity.map((item, index) => (
                <div
                  key={`${item.action}-${item.details}-${item.date ?? index}`}
                  className="grid grid-cols-[140px_minmax(0,1fr)_140px_140px] items-center px-4 py-2.5 text-[12px]"
                >
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${toneClasses[item.tone]}`}>
                      {item.action}
                    </span>
                  </div>
                  <p className="truncate text-[#4b5874]">{item.details}</p>
                  <p className="text-[#6f7c96]">{item.actor}</p>
                  <p className="text-[#6f7c96]">
                    {item.date ? new Date(item.date).toLocaleString('es-AR') : '-'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </InsightCard>
    </div>
  );
}
