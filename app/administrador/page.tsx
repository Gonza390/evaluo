import './admin-theme.css';
import Link from 'next/link';
import { BadgePercent, BookOpen, Bot, Megaphone, Search, Users } from 'lucide-react';
import {
  obtenerFeedbackExplicacionesAdmin,
  obtenerFeedbackRevisionAdmin,
  obtenerPromptSistema,
  obtenerRankingErroresIA,
} from './shared-actions';
import { obtenerConsumoPdfIAAdministrador } from './ai-cost-data';
import { obtenerBibliotecaFormularioAdministradorOptimizado } from './performance-actions';
import {
  obtenerBibliotecaResumenAdministradorCacheado,
  obtenerUsuariosAdministradorPaginadoCacheado,
} from './cached-performance-actions';
import { obtenerReferidosAdministrador } from './referrals-actions';
import { ReferralsPanel } from './referrals-panel';
import { obtenerAdquisicionAdministrador, type AcquisitionSourceKey } from './acquisition-actions';
import { AcquisitionPanel } from './acquisition-panel';
import { obtenerProductoDiarioAdministrador } from './product-actions';
import { ProductPanel } from './product-panel';
import {
  AICostPanel,
  BibliotecaPanel,
  IAPanel,
  UsersPanelV2,
} from './lazy-panels';

type PanelKey =
  | 'producto'
  | 'adquisicion'
  | 'referidos'
  | 'biblioteca'
  | 'usuarios'
  | 'ia';

const PANELS: Array<{
  key: PanelKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'producto', label: 'Producto', icon: Megaphone },
  { key: 'adquisicion', label: 'Adquisición', icon: Search },
  { key: 'referidos', label: 'Referidos', icon: BadgePercent },
  { key: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
  { key: 'usuarios', label: 'Usuarios', icon: Users },
  { key: 'ia', label: 'IA', icon: Bot },
];

const PERIOD_OPTIONS = [
  { value: 1, label: 'Hoy' },
  { value: 7, label: '7 días' },
  { value: 14, label: '14 días' },
  { value: 30, label: '30 días' },
] as const;

const ACQUISITION_SOURCE_KEYS: AcquisitionSourceKey[] = [
  'google',
  'whatsapp',
  'instagram',
  'linkedin',
  'reddit',
];

function ErrorPanel({ message }: { message: string }) {
  return (
    <section className="admin-panel-error">
      <h2>No pudimos cargar este panel</h2>
      <p>{message}</p>
    </section>
  );
}

function PanelNavigation({ activePanel, activePeriod }: { activePanel: PanelKey; activePeriod: number }) {
  return (
    <nav className="admin-nav" aria-label="Secciones del administrador">
      {PANELS.map((panel) => {
        const Icon = panel.icon;
        const active = panel.key === activePanel;
        return (
          <Link
            key={panel.key}
            href={`/administrador?panel=${panel.key}&period=${activePeriod}`}
            prefetch={false}
            className={`admin-nav-link${active ? ' is-active' : ''}`}
          >
            <Icon className="h-4 w-4" />
            {panel.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default async function AdministradorPage({
  searchParams,
}: {
  searchParams?: Promise<{
    panel?: string;
    period?: string;
    usersPage?: string;
    source?: string;
  }>;
}) {
  const params = (await searchParams) ?? {};
  const requestedPanel = params.panel;
  const activePanel = PANELS.find((panel) => panel.key === requestedPanel)?.key ?? 'producto';
  const requestedPeriod = Number(params.period ?? 7);
  const activePeriod = PERIOD_OPTIONS.find((option) => option.value === requestedPeriod)?.value ?? 7;
  const usersPage = Math.max(1, Number(params.usersPage ?? 1) || 1);
  const requestedSource = String(params.source ?? '').trim().toLowerCase();
  const selectedAcquisitionSource = ACQUISITION_SOURCE_KEYS.includes(
    requestedSource as AcquisitionSourceKey
  )
    ? (requestedSource as AcquisitionSourceKey)
    : null;

  const needsProduct = activePanel === 'producto';
  const needsAcquisition = activePanel === 'adquisicion';
  const needsReferrals = activePanel === 'referidos';
  const needsBiblioteca = activePanel === 'biblioteca';
  const needsUsers = activePanel === 'usuarios';
  const needsIA = activePanel === 'ia';

  const [
    productResult,
    acquisitionResult,
    referralResult,
    bibliotecaResult,
    bibliotecaStatsResult,
    usersResult,
    iaPromptResult,
    iaRankingResult,
    iaFeedbackStatsResult,
    iaFeedbackReviewResult,
    iaCostResult,
  ] = await Promise.all([
    needsProduct ? obtenerProductoDiarioAdministrador() : Promise.resolve(null),
    needsAcquisition
      ? obtenerAdquisicionAdministrador(activePeriod, selectedAcquisitionSource)
      : Promise.resolve(null),
    needsReferrals ? obtenerReferidosAdministrador() : Promise.resolve(null),
    needsBiblioteca ? obtenerBibliotecaFormularioAdministradorOptimizado() : Promise.resolve(null),
    needsBiblioteca ? obtenerBibliotecaResumenAdministradorCacheado() : Promise.resolve(null),
    needsUsers ? obtenerUsuariosAdministradorPaginadoCacheado(usersPage, 25) : Promise.resolve(null),
    needsIA ? obtenerPromptSistema() : Promise.resolve(null),
    needsIA ? obtenerRankingErroresIA(30) : Promise.resolve(null),
    needsIA ? obtenerFeedbackExplicacionesAdmin() : Promise.resolve(null),
    needsIA ? obtenerFeedbackRevisionAdmin(40) : Promise.resolve(null),
    needsIA ? obtenerConsumoPdfIAAdministrador() : Promise.resolve(null),
  ]);

  let panelContent: React.ReactNode;

  if (activePanel === 'producto') {
    panelContent =
      productResult?.success && productResult.stats ? (
        <ProductPanel stats={productResult.stats} />
      ) : (
        <ErrorPanel message={productResult?.message ?? 'No pudimos cargar Producto.'} />
      );
  } else if (activePanel === 'adquisicion') {
    panelContent =
      acquisitionResult?.success && acquisitionResult.stats ? (
        <AcquisitionPanel
          stats={acquisitionResult.stats}
          activePeriod={activePeriod}
          selectedSource={selectedAcquisitionSource}
        />
      ) : (
        <ErrorPanel message={acquisitionResult?.message ?? 'No pudimos cargar Adquisición.'} />
      );
  } else if (activePanel === 'referidos') {
    panelContent =
      referralResult?.success && referralResult.data ? (
        <ReferralsPanel data={referralResult.data} />
      ) : (
        <ErrorPanel message={referralResult?.message ?? 'No pudimos cargar Referidos.'} />
      );
  } else if (activePanel === 'biblioteca') {
    if (
      !bibliotecaResult?.success ||
      !bibliotecaResult.universidades ||
      !bibliotecaResult.carreras ||
      !bibliotecaResult.materias ||
      !bibliotecaStatsResult?.success ||
      !bibliotecaStatsResult.stats
    ) {
      panelContent = (
        <ErrorPanel
          message={
            bibliotecaResult?.message ??
            bibliotecaStatsResult?.message ??
            'No pudimos cargar Biblioteca.'
          }
        />
      );
    } else {
      panelContent = (
        <BibliotecaPanel
          overview={bibliotecaStatsResult.stats}
          universidades={bibliotecaResult.universidades}
          carreras={bibliotecaResult.carreras}
          materias={bibliotecaResult.materias}
          carrerasSimuladores={bibliotecaResult.carrerasSimuladores ?? []}
        />
      );
    }
  } else if (activePanel === 'usuarios') {
    if (!usersResult?.success || !usersResult.stats || !usersResult.rows) {
      panelContent = <ErrorPanel message={usersResult?.message ?? 'No pudimos cargar Usuarios.'} />;
    } else {
      panelContent = (
        <UsersPanelV2
          stats={usersResult.stats}
          rows={usersResult.rows}
          page={usersResult.page ?? usersPage}
          totalPages={usersResult.totalPages ?? 1}
        />
      );
    }
  } else if (
    iaPromptResult?.success &&
    iaRankingResult?.success &&
    iaFeedbackStatsResult?.success &&
    iaFeedbackReviewResult?.success
  ) {
    panelContent = (
      <>
        <AICostPanel
          stats={iaCostResult?.success ? (iaCostResult.stats ?? null) : null}
          error={iaCostResult?.success ? null : iaCostResult?.message}
        />
        <IAPanel
          initialPrompt={iaPromptResult.data ?? ''}
          initialRankingRows={iaRankingResult.rows ?? []}
          initialFeedbackStats={
            (
              iaFeedbackStatsResult as {
                stats?: {
                  total: number;
                  positive: number;
                  negative: number;
                  generatedCount: number;
                };
              }
            ).stats ?? null
          }
          initialFeedbackReviewRows={iaFeedbackReviewResult.rows ?? []}
        />
      </>
    );
  } else {
    panelContent = (
      <ErrorPanel
        message={
          iaPromptResult?.message ??
          iaRankingResult?.message ??
          iaFeedbackReviewResult?.message ??
          'No pudimos cargar IA.'
        }
      />
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-inner">
            <div className="admin-brand">Evaluo</div>
            <PanelNavigation activePanel={activePanel} activePeriod={activePeriod} />
            <div className="admin-sidebar-links">
              <Link href="/administrador/feedback" prefetch={false}>Feedback</Link>
              <Link href="/administrador/solicitudes" prefetch={false}>Solicitudes</Link>
            </div>
          </div>
        </aside>

        <section className="admin-main">
          <div className="admin-main-inner">{panelContent}</div>
        </section>
      </div>
    </main>
  );
}
