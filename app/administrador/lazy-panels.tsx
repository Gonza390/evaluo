'use client';

import dynamic from 'next/dynamic';

export const AcademicUsagePanel = dynamic(() =>
  import('./academic-usage-panel').then((module) => module.AcademicUsagePanel)
);
export const AICostPanel = dynamic(() =>
  import('./ai-cost-panel').then((module) => module.AICostPanel)
);
export const IAPanel = dynamic(() => import('./ia-panel').then((module) => module.IAPanel));
export const UsersPanelV2 = dynamic(() =>
  import('./users-panel-v2').then((module) => module.UsersPanelV2)
);
