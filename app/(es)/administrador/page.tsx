// The redesigned administrator consists of exactly the ten supplied HTML panels.
// Legacy referrals, prompt tools and the old sidebar are deliberately not routed here.
const panelKeys = [
  'resumen', 'usuarios', 'adquisicion', 'producto', 'biblioteca',
  'planes', 'monetizacion', 'mails', 'ia', 'gestion',
] as const;
type PanelKey = (typeof panelKeys)[number];

export default async function AdministradorPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const activePanel: PanelKey = panelKeys.includes(params.panel as PanelKey)
    ? (params.panel as PanelKey) : 'resumen';
  switch (activePanel) {
    case 'resumen': {
      const [{obtenerTableroGeneral}, {AdminHome}] = await Promise.all([
        import('./admin-home-actions'), import('./admin-home'),
      ]);
      const result = await obtenerTableroGeneral(params.date);
      return <AdminHome data={result.snapshot} minDay={result.minDay} />;
    }
    case 'usuarios': {
      const [{obtenerUsuariosRetencion}, {UsersRetentionDashboard}] = await Promise.all([
        import('./users-retention-actions'), import('./users-retention-dashboard'),
      ]);
      const period = Number(params.period ?? 7);
      const result = await obtenerUsuariosRetencion({
        period: [1, 7, 14, 30].includes(period) ? period : 7,
        from: params.from ?? null, to: params.to ?? null,
        page: Math.max(1, Number(params.usersPage ?? 1) || 1),
        search: params.usersSearch ?? '', plan: params.usersPlan ?? 'all',
        materials: params.usersMaterials ?? 'all',
        country: params.usersCountry ?? 'all',
        university: params.usersUniversity ?? 'all',
        selectedUserId: params.userId ?? null,
      });
      return <UsersRetentionDashboard
        stats={result.stats} segments={result.segments} list={result.list}
        detail={result.detail} filters={result.filters}
        today={result.today} minDay={result.minDay}
      />;
    }
    case 'adquisicion': {
      const [{obtenerDashboardAdquisicion}, {PackedAcquisitionDashboard}] = await Promise.all([
        import('./acquisition-dashboard-actions'), import('./packed-acquisition-dashboard'),
      ]);
      const snapshot = await obtenerDashboardAdquisicion();
      return <PackedAcquisitionDashboard data={snapshot} />;
    }
    case 'producto': {
      const [{obtenerActivacionRecorrido}, {PackedActivationDashboard}] = await Promise.all([
        import('./activation-dashboard-actions'), import('./packed-activation-dashboard'),
      ]);
      const snapshot = await obtenerActivacionRecorrido();
      return <PackedActivationDashboard data={snapshot} />;
    }
    case 'biblioteca': {
      const [{obtenerAprendizajePracticas}, {LearningDashboard}] = await Promise.all([
        import('./learning-dashboard-actions'), import('./learning-dashboard'),
      ]);
      const result = await obtenerAprendizajePracticas(params);
      return <LearningDashboard data={result.data} filters={result.filters}
        earliest={result.earliest} today={result.today} />;
    }
    case 'planes': {
      const [{obtenerDashboardPlanesEstudio}, {StudyPlansDashboard}] = await Promise.all([
        import('./study-plans-dashboard-actions'), import('./study-plans-dashboard'),
      ]);
      const result = await obtenerDashboardPlanesEstudio(params);
      return <StudyPlansDashboard snapshot={result.snapshot} filters={result.filters}
        today={result.today} earliest={result.earliest} />;
    }
    case 'monetizacion': {
      const [{obtenerDashboardMonetizacion}, {MonetizationDashboard}] = await Promise.all([
        import('./monetization-dashboard-actions'), import('./monetization-dashboard'),
      ]);
      const result = await obtenerDashboardMonetizacion(params);
      return <MonetizationDashboard snapshot={result.snapshot} filters={result.filters}
        today={result.today} earliest={result.earliest} />;
    }
    case 'mails': {
      const [{obtenerDashboardComunicaciones}, {CommunicationsDashboard}] = await Promise.all([
        import('./communications-dashboard-actions'), import('./communications-dashboard'),
      ]);
      const result = await obtenerDashboardComunicaciones(params);
      return <CommunicationsDashboard snapshot={result.snapshot} filters={result.filters}
        today={result.today} earliest={result.earliest} />;
    }
    case 'ia': {
      const [{obtenerDashboardSistemaIA}, {SystemAiDashboard}] = await Promise.all([
        import('./system-ai-dashboard-actions'), import('./system-ai-dashboard'),
      ]);
      const result = await obtenerDashboardSistemaIA(params);
      return <SystemAiDashboard data={result.snapshot} days={result.days} />;
    }
    case 'gestion': {
      const [{obtenerDashboardGestion}, {GestionDashboard}] = await Promise.all([
        import('./gestion-dashboard-actions'), import('./gestion-dashboard'),
      ]);
      const result = await obtenerDashboardGestion();
      return <GestionDashboard snapshot={result.snapshot}
        actor={result.actor} limits={result.limits} />;
    }
  }
}
