'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { processStudentMaterialAction } from '@/app/dashboard/materiales/actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export function StudentMaterialProcessingRetry({ materialId }: { materialId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await processStudentMaterialAction(materialId);

          toast({
            description: result.success
              ? 'Reintentamos el procesamiento. El estado se actualizará automáticamente.'
              : result.message,
            variant: result.success ? 'default' : 'destructive',
          });

          router.refresh();
        });
      }}
      className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:from-[#1D4ED8] hover:to-[#4F46E5]"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {isPending ? 'Reintentando…' : 'Reintentar procesamiento'}
    </Button>
  );
}
