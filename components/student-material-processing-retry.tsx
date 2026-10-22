'use client';

import { useCallback, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { processStudentMaterialAction } from '@/app/dashboard/materiales/actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

/**
 * Cuando el watchdog recupera un timeout, relanzamos automáticamente el trabajo
 * al volver a abrir el PDF (mientras queden intentos). Otros errores conservan
 * el botón manual para no generar bucles de consumos IA.
 */
export function StudentMaterialProcessingRetry({
  materialId,
  autoRetry = false,
}: {
  materialId: string;
  autoRetry?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const startedRef = useRef(false);
  const autoTriggeredRef = useRef(false);

  const retry = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    startTransition(async () => {
      try {
        const result = await processStudentMaterialAction(materialId);

        if (!autoRetry || !result.success) {
          toast({
            description: result.success
              ? 'Reintentamos el procesamiento. El estado se actualizará automáticamente.'
              : result.message,
            variant: result.success ? 'default' : 'destructive',
          });
        }
      } catch {
        toast({
          description: 'No pudimos reanudar este PDF. Podés volver a intentarlo.',
          variant: 'destructive',
        });
      } finally {
        startedRef.current = false;
        router.refresh();
      }
    });
  }, [autoRetry, materialId, router, startTransition, toast]);

  useEffect(() => {
    if (autoRetry && !autoTriggeredRef.current) {
      autoTriggeredRef.current = true;
      retry();
    }
  }, [autoRetry, retry]);

  return (
    <Button
      type="button"
      disabled={isPending || startedRef.current}
      onClick={retry}
      className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:from-[#1D4ED8] hover:to-[#4F46E5]"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {isPending ? 'Reanudando…' : 'Reintentar procesamiento'}
    </Button>
  );
}
