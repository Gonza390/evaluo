import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  Bot,
  LayoutDashboard,
  Megaphone,
  Users,
  Waypoints,
} from 'lucide-react';
import { requireAdminAccess } from '@/lib/auth';
import { obtenerAdquisicionAdministrador, type AcquisitionSourceKey } from '../marketing-actions';
import { MarketingPanel } from '../marketing-panel';

const PANELS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
  { key: 'usuarios', label: 'Usuarios', icon: Users },
  { key: 'analiticas', label: 'Analiticas', icon: BarChart3 },
  { key: 'marketing', label: 'Marketing', icon: Megaphone },
  { key: 'logs', label: 'Logs', icon: Waypoints },
  { key: 'ia', label: 'IA', icon: Bot },
] as const;

const PERIOD_OPTIONS = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 60, label: '2 meses' },
] as const;

const SOURCE_KEYS: AcquisitionSourceKey[] = ['google', 'whatsapp', 'instagram', 'linkedin'];

export default async function MarketingAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string; source?: string }>;
}) {
  const [{ user }, rawSearchParams] = await Promise.all([
    requireAdminAccess(),
    searchParams ?? Promise.resolve({}),
  ]);

  const requestedPeriod = Number(rawSearchParams?.period ?? 30);
  const activePeriod = PERIOD_OPTIONS.find((option) => option.value === requestedPeriod)?.value ?? 30;
  const activePeriodLabel =
    PERIOD_OPTIONS.find((option) => option.value === activePeriod)?.label ?? '30 días';
  const requestedSource = String(rawSearchParams?.source ?? '').toLowerCase();
  const selectedSource = SOURCE_KEYS.includes(requestedSource as AcquisitionSourceKey)
    ? (requestedSource as AcquisitionSourceKey)
    : null;

  const result = await obtenerAdquisicionAdministrador(activePeriod);
  const adminName =
    String(user.user_metadata?.full_name ?? '').trim() || user.email?.split('@')[0] || 'Gonzalo';

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-[#1d2a44]">
      <header className="fixed left-[184px] right-0 top-0 z-40 border-b border-[#e7ebf4] bg-white/95 backdrop-blur">
        <div className="flex h-[64px] items-center justify-between px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#98a3bb]">Panel actual</p>
            <h1 className="mt-0.5 text-[1.1rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">Marketing</h1>
          </div>
          <div className="text-right">
            <p className="text-[14px] font-semibold text-[#1d2a44]">{adminName}</p>
            <p className="text-[12px] text-[#7f8aa3]">Administrador</p>
          </div>
        </div>
      </header>

      <aside className="fixed left-0 top-[64px] z-30 h-[calc(100vh-64px)] w-[184px] overflow-y-auto border-r border-[#e7ebf4] bg-white px-4 py-5">
        <div className="mb-6">
          <p className="text-[1.35rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">Evaluo</p>
        </div>
        <nav className="space-y-1">
          {PANELS.map((panel) => {
            const Icon = panel.icon;
            const isActive = panel.key === 'marketing';
            const href =
              panel.key === 'marketing'
                ? `/administrador?panel=marketing&period=${activePeriod}`
                : `/administrador?panel=${panel.key}&period=${activePeriod}`;

            return (
              <Link
                key={panel.key}
                href={href}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                  isActive
                    ? 'bg-[#eef3ff] text-[#315efb]'
                    : 'text-[#6f7c96] hover:bg-[#f5f7fb] hover:text-[#1d2a44]'
                }`}
              >
                <Icon className="h-[15px] w-[15px]" />
                <span>{panel.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="pl-[184px] pt-[64px]">
        <div className="px-6 py-6">
          {!result.success || !result.stats ? (
            <section className="rounded-[22px] border border-[#e8ebf3] bg-white p-8">
              <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-[#1d2a44]">No pudimos cargar adquisición</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#7f8aa3]">
                {result.message ?? 'Probá nuevamente en unos segundos.'}
              </p>
            </section>
          ) : (
            <MarketingPanel
              stats={result.stats}
              activePeriod={activePeriod}
              activePeriodLabel={activePeriodLabel}
              selectedSource={selectedSource}
            />
          )}
        </div>
      </div>
    </main>
  );
}
