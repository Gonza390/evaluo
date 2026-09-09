'use client';

import dynamic from 'next/dynamic';

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
export const UsersPanelV2 = dynamic(() =>
  import('./users-panel-v2').then((module) => module.UsersPanelV2)
);
