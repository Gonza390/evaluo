'use client';

import dynamic from 'next/dynamic';

export const AICostPanel = dynamic(() =>
  import('./ai-cost-panel').then((module) => module.AICostPanel)
);
export const IAPanel = dynamic(() => import('./ia-panel').then((module) => module.IAPanel));
