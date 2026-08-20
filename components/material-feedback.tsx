'use client';

import { useEffect, useState } from 'react';
import { Flag, Loader2, ThumbsDown, ThumbsUp } from 'lucide-react';
import {
  getMyMaterialFeedbackAction,
  submitMaterialFeedbackAction,
} from '@/app/dashboard/materiales/feedback';
import type { StudentMaterialFeedbackSummary } from '@/lib/student-material-feedback';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const REPORT_REASONS = [
  { value: 'resumen incorrecto', label: 'El resumen es incorrecto' },
  { value: 'informacion inventada', label: 'Inventá información' },
  { value: 'falta contenido', label: 'Le falta contenido' },
  { value: 'glosario erroneo', label: 'El glosario es erróneo' },
  { value: 'error de extraccion', label: 'El PDF no se leyó bien' },
  { value: 'otro', label: 'Otro' },
];

export function MaterialFeedback({ materialId }: { materialId: string }) {
  const { toast } = useToast();
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [counts, setCounts] = useState<StudentMaterialFeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportNote, setReportNote] = useState('');

  useEffect(() => {
    void (async () => {
      const result = await getMyMaterialFeedbackAction(materialId);
      setRating(result.feedback?.rating ?? null);
      setCounts(result.counts);
      setLoading(false);
    })();
  }, [materialId]);

  const save = async (nextRating: 'up' | 'down') => {
    if (saving) {
      return;
    }
    setSaving(true);
    const result = await submitMaterialFeedbackAction({
      materialId,
      rating: nextRating,
      reportReason: reportOpen ? reportReason || null : null,
      reportNote: reportOpen ? reportNote || null : null,
    });
    setSaving(false);

    toast({
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });

    if (result.success) {
      setRating(result.rating ?? nextRating);
      if (result.counts) {
        setCounts(result.counts);
      }
      setReportOpen(false);
      setReportReason('');
      setReportNote('');
    }
  };

  const submitReport = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    const result = await submitMaterialFeedbackAction({
      materialId,
      rating: rating ?? 'down',
      reportReason: reportReason || 'otro',
      reportNote: reportNote || null,
    });
    setSaving(false);

    toast({
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });

    if (result.success) {
      setRating(result.rating ?? 'down');
      if (result.counts) {
        setCounts(result.counts);
      }
      setReportOpen(false);
      setReportReason('');
      setReportNote('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[13px] font-semibold text-slate-950">¿Te fue útil este material?</p>
          <p className="text-[12px] leading-5 text-slate-500">
            Tu opinión nos ayuda a mejorar los resúmenes y glosarios generados.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void save('up')}
            disabled={saving || loading}
            className={cn(
              'h-8 rounded-[13px] border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 shadow-none hover:bg-white',
              rating === 'up' && 'border-[#A7F3D0] bg-[#ECFDF5] text-emerald-700 hover:bg-[#ECFDF5]'
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            Util
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void save('down')}
            disabled={saving || loading}
            className={cn(
              'h-8 rounded-[13px] border-slate-200 bg-white px-2.5 text-[12px] text-slate-700 shadow-none hover:bg-white',
              rating === 'down' && 'border-[#FECACA] bg-[#FEF2F2] text-rose-700 hover:bg-[#FEF2F2]'
            )}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            No útil
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {counts && (counts.up > 0 || counts.down > 0) ? (
          <p className="text-[11.5px] text-slate-500">
            {counts.up} útil · {counts.down} no útil
            {counts.reports > 0 ? ` · ${counts.reports} reportado${counts.reports > 1 ? 's' : ''}` : ''}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setReportOpen((current) => !current)}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2563EB] transition hover:text-[#1D4ED8]"
        >
          <Flag className="h-3 w-3" />
          {reportOpen ? 'Cerrar reporte' : 'Reportar un error en el resumen'}
        </button>
      </div>

      {reportOpen ? (
        <div className="space-y-3 rounded-[16px] border border-slate-200 bg-white px-3.5 py-3.5">
          <p className="text-[12.5px] font-semibold text-slate-800">¿Que salio mal?</p>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger className="w-full rounded-[12px] border-slate-200 bg-white text-[12.5px]">
                <SelectValue placeholder="Elegi un motivo" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={reportNote}
              onChange={(event) => setReportNote(event.target.value)}
              maxLength={500}
              placeholder="Contanos con más detalle (opcional)"
              className="min-h-[64px] rounded-[12px] border-slate-200 bg-white text-[12.5px]"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void submitReport()}
              disabled={saving}
              className="h-8 rounded-[13px] border-rose-200 bg-white px-2.5 text-[12px] text-rose-700 shadow-none hover:bg-rose-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Enviar reporte
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
