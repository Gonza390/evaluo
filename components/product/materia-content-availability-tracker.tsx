'use client';

import { useEffect } from 'react';
import { trackProductAnalyticsEvent } from '@/lib/product-analytics-client';

type MateriaContentAvailabilityTrackerProps = {
  materiaId: string;
  materiaName: string;
  hasContent: boolean;
  resumenCount: number;
  sharedMaterialCount: number;
};

export function MateriaContentAvailabilityTracker({
  materiaId,
  materiaName,
  hasContent,
  resumenCount,
  sharedMaterialCount,
}: MateriaContentAvailabilityTrackerProps) {
  useEffect(() => {
    void trackProductAnalyticsEvent(hasContent ? 'content_available' : 'content_empty', {
      materia_id: materiaId,
      materia_name: materiaName,
      resumen_count: resumenCount,
      shared_material_count: sharedMaterialCount,
    });
  }, [hasContent, materiaId, materiaName, resumenCount, sharedMaterialCount]);

  return null;
}
