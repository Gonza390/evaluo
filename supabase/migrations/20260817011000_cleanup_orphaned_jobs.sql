-- JOBS-01: Limpiar jobs huérfanos y stale processing.
--
-- Tablas de job queue identificadas:
--   1. student_material_jobs — cola de procesamiento de documentos subidos
--      por estudiantes (status: queued/processing/completed/failed).
--   2. rag_generation_logs — logs de generación de explicaciones RAG
--      (status: pending/running/completed/failed).
--
-- Estrategia:
--   - Marca como 'failed' los jobs con status 'processing' o 'queued'
--     con created_at > 24h (stuck jobs).
--   - Limpia rag_generation_logs antiguos (> 30 días) con status
--     'completed' o 'failed' (logs históricos que no se consultan).
--   - Se ejecuta como migración idempótica (seguro correr múltiples veces).
--   - Los conteos de registros afectados se documentan en comentarios
--     al final del script.

BEGIN;

-- ============================================================
-- 1) STUDENT_MATERIAL_JOBS: marcar stuck jobs como failed
-- ============================================================
-- Jobs en status 'processing' o 'queued' con más de 24h sin avanzar
-- son stuck. Se marca como failed para que el usuario pueda reintentar.

UPDATE public.student_material_jobs
SET
  status = 'failed',
  last_error = coalesce(last_error, 'Job marked as orphaned/stale by system cleanup (>24h stuck)')
WHERE status IN ('queued', 'processing')
  AND created_at < now() - interval '24 hours';

-- ============================================================
-- 2) STUDENT_MATERIAL_JOBS: limpiar jobs completados/fallidos antiguos
-- ============================================================
-- Conservar 90 días de historial de jobs para diagnóstico.

DELETE FROM public.student_material_jobs
WHERE status IN ('completed', 'failed')
  AND created_at < now() - interval '90 days';

-- ============================================================
-- 3) RAG_GENERATION_LOGS: limpiar logs antiguos completados/fallidos
-- ============================================================
-- Estos logs solo son útiles para debugging reciente.
-- Conservar 30 días.

DELETE FROM public.rag_generation_logs
WHERE status IN ('completed', 'failed')
  AND created_at < now() - interval '30 days';

-- ============================================================
-- CONTEO DE REGISTROS AFECTADOS:
--   Ejecutar esta migración y revisar el output de PostgreSQL para
--   ver cuántos registros se actualizaron/eliminaron en cada paso.
--   Los contadores aparecen en el log de la migración de Supabase.
--
-- Para inspección manual posterior:
--   SELECT count(*) FROM student_material_jobs
--     WHERE status IN ('queued', 'processing')
--       AND created_at < now() - interval '24 hours';
--   SELECT count(*) FROM student_material_jobs
--     WHERE status IN ('completed', 'failed')
--       AND created_at < now() - interval '90 days';
--   SELECT count(*) FROM rag_generation_logs
--     WHERE status IN ('completed', 'failed')
--       AND created_at < now() - interval '30 days';
-- ============================================================

COMMIT;
