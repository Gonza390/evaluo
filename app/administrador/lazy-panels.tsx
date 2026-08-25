'use client';

import dynamic from 'next/dynamic';

export const DashboardInsights = dynamic(() =>
  import('./dashboard-insights').then((module) => module.DashboardInsights)
);
export const AnalyticsPanel = dynamic(() =>
  import('./analytics-panel').then((module) => module.AnalyticsPanel)
);
export const ConversionPanel = dynamic(() =>
  import('./conversion-panel').then((module) => module.ConversionPanel)
);
export const BibliotecaPanel = dynamic(() =>
  import('./biblioteca-panel').then((module) => module.BibliotecaPanel)
);
export const AICostPanel = dynamic(() =>
  import('./ai-cost-panel').then((module) => module.AICostPanel)
);
export const IAPanel = dynamic(() => import('./ia-panel').then((module) => module.IAPanel));
export const LogsPanel = dynamic(() => import('./logs-panel').then((module) => module.LogsPanel));
export const UsersPanel = dynamic(() =>
  import('./users-panel').then((module) => module.UsersPanel)
);
