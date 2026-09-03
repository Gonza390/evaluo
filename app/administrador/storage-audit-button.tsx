'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DatabaseZap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { auditarStorageBibliotecaAdministrador } from './logs-performance-actions';

export function StorageAuditButton({ scannedAt }: { scannedAt?: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">Auditoría de Storage</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {scannedAt
            ? `Última pasada: ${new Date(scannedAt).toLocaleString('es-AR')}. La vista usa este snapshot y no recorre Storage al abrir.`
            : 'Todavía no hay una auditoría guardada. La vista de Logs carga sin recorrer Storage.'}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        className="min-h-11 shrink-0 rounded-xl bg-white"
        onClick={() =>
          startTransition(async () => {
            const result = await auditarStorageBibliotecaAdministrador();
            toast({
              description: result.message,
              variant: result.success ? 'default' : 'destructive',
            });
            if (result.success) router.refresh();
          })
        }
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseZap className="h-4 w-4" />}
        {isPending ? 'Auditando…' : 'Auditar Storage'}
      </Button>
    </div>
  );
}
