'use client';

import { useState } from 'react';
import { Brain, Loader2, RefreshCcw, Save } from 'lucide-react';
import {
  actualizarPromptSistema,
  ejecutarWarmupExplicacionesIA,
  obtenerFeedbackExplicacionesAdmin,
  obtenerFeedbackRevisionAdmin,
  obtenerRankingErroresIA,
  regenerarExplicacionIA,
  type FeedbackReviewItem,
  type IAWarmupAdminResult,
  type IARankingRow,
} from './shared-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'green' | 'red' | 'slate';
}) {
  const tones = {
    green: 'text-[#10936f]',
    red: 'text-[#d44848]',
    slate: 'text-[#1d2a44]',
  } as const;

  return (
    <div className="rounded-[18px] border border-[#e7ebf4] bg-white px-4 py-4">
      <p className="text-[12px] font-medium text-[#7f8aa3]">{label}</p>
      <p className={`mt-2 text-[1.85rem] font-semibold leading-none tracking-[-0.05em] ${tones[tone]}`}>
        {value.toLocaleString('es-AR')}
      </p>
    </div>
  );
}

export function IAPanel({
  initialPrompt,
  initialRankingRows,
  initialFeedbackStats,
  initialFeedbackReviewRows,
}: {
  initialPrompt: string;
  initialRankingRows: IARankingRow[];
  initialFeedbackStats: { total: number; positive: number; negative: number; generatedCount: number } | null;
  initialFeedbackReviewRows: FeedbackReviewItem[];
}) {
  const { toast } = useToast();
  const [promptSistema, setPromptSistema] = useState(initialPrompt);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [refreshingPreguntaId, setRefreshingPreguntaId] = useState<string | null>(null);
  const [showAllRanking, setShowAllRanking] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [rankingRows, setRankingRows] = useState(initialRankingRows);
  const [feedbackStats, setFeedbackStats] = useState(initialFeedbackStats);
  const [feedbackReviewRows, setFeedbackReviewRows] = useState(initialFeedbackReviewRows);
  const [warmupLoading, setWarmupLoading] = useState(false);
  const [warmupBatchSize, setWarmupBatchSize] = useState('30');
  const [warmupTokenBudget, setWarmupTokenBudget] = useState('65000');
  const [warmupLookbackDays, setWarmupLookbackDays] = useState('120');
  const [warmupResult, setWarmupResult] = useState<IAWarmupAdminResult['result'] | null>(null);

  const refreshIAData = async () => {
    setLoadingRanking(true);
    const [rankingResult, feedbackStatsResult, feedbackReviewResult] = await Promise.all([
      obtenerRankingErroresIA(30),
      obtenerFeedbackExplicacionesAdmin(),
      obtenerFeedbackRevisionAdmin(40),
    ]);
    setLoadingRanking(false);

    if (rankingResult.success) {
      setRankingRows(rankingResult.rows ?? []);
    } else {
      toast({ description: rankingResult.message ?? 'No pudimos cargar el ranking de IA.', variant: 'destructive' });
    }

    if (feedbackStatsResult.success) {
      setFeedbackStats(
        (feedbackStatsResult as {
          stats?: { total: number; positive: number; negative: number; generatedCount: number };
        }).stats ?? null
      );
    }

    if (feedbackReviewResult.success) {
      setFeedbackReviewRows(feedbackReviewResult.rows ?? []);
    }
  };

  const savePrompt = async () => {
    setLoadingPrompt(true);
    const result = await actualizarPromptSistema(promptSistema);
    setLoadingPrompt(false);

    if (result.success) {
      toast({ description: 'La configuración de IA ya quedó guardada.' });
    } else {
      toast({ description: result.message, variant: 'destructive' });
    }
  };

  const regenerateExplanation = async (preguntaId: string) => {
    setRefreshingPreguntaId(preguntaId);
    const result = await regenerarExplicacionIA(preguntaId);
    setRefreshingPreguntaId(null);

    if (result.success) {
      toast({ description: result.message });
      await refreshIAData();
    } else {
      toast({ description: result.message, variant: 'destructive' });
    }
  };

  const negativeFeedbackRows = feedbackReviewRows.filter((row) => row.voto === -1);
  const visibleRankingRows = showAllRanking ? rankingRows : rankingRows.slice(0, 3);

  const runWarmup = async (dryRun: boolean) => {
    setWarmupLoading(true);
    const result = await ejecutarWarmupExplicacionesIA({
      dryRun,
      batchSize: Number(warmupBatchSize) || 30,
      maxEstimatedTokens: Number(warmupTokenBudget) || 65000,
      lookbackDays: Number(warmupLookbackDays) || 120,
      candidatePoolSize: 4000,
    });
    setWarmupLoading(false);

    if (result.success) {
      setWarmupResult(result.result ?? null);
      toast({ description: result.message });
      if (!dryRun) {
        await refreshIAData();
      }
    } else {
      toast({ description: result.message, variant: 'destructive' });
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[1.35rem] font-semibold tracking-[-0.05em] text-[#1d2a44]">IA</p>
        <p className="mt-1 text-[14px] text-[#7f8aa3]">
          Configuración del sistema, revisión de explicaciones y seguimiento del feedback.
        </p>
      </div>

      <section className="rounded-[20px] border border-[#e7ebf4] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#eef1f6] px-5 py-4">
          <div>
            <p className="text-[14px] font-semibold text-[#1d2a44]">Configuración de IA</p>
            <p className="mt-1 text-[13px] text-[#7f8aa3]">Prompt base usado para la extracción y configuración del sistema.</p>
          </div>
          <Button onClick={() => void savePrompt()} disabled={loadingPrompt} className="h-9 rounded-[12px] bg-[#2563EB] px-4 hover:bg-[#2649c7]">
            {loadingPrompt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </Button>
        </div>
        <div className="p-5">
          <Textarea
            value={promptSistema}
            onChange={(event) => setPromptSistema(event.target.value)}
            className="min-h-[220px] rounded-[16px] border-[#dbe2f0] bg-white px-4 py-3 text-[14px] leading-6 text-[#1d2a44] shadow-none"
            placeholder="Escribí aquí la configuración del sistema de IA..."
          />
        </div>
      </section>

      <section className="rounded-[20px] border border-[#e7ebf4] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#eef1f6] px-5 py-4">
          <div>
            <p className="text-[14px] font-semibold text-[#1d2a44]">Warmup de explicaciones</p>
            <p className="mt-1 text-[13px] text-[#7f8aa3]">
              Genera explicaciones cacheadas priorizando materias más usadas, parciales más rendidos y errores más frecuentes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void runWarmup(true)} disabled={warmupLoading} className="rounded-[12px]">
              {warmupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Simular costo
            </Button>
            <Button onClick={() => void runWarmup(false)} disabled={warmupLoading} className="rounded-[12px] bg-[#2563EB] hover:bg-[#2649c7]">
              {warmupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Generar ahora
            </Button>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <p className="mb-2 text-[12px] font-medium text-[#7f8aa3]">Preguntas por corrida</p>
              <Input value={warmupBatchSize} onChange={(event) => setWarmupBatchSize(event.target.value)} inputMode="numeric" />
            </div>
            <div>
              <p className="mb-2 text-[12px] font-medium text-[#7f8aa3]">Presupuesto máximo de tokens</p>
              <Input value={warmupTokenBudget} onChange={(event) => setWarmupTokenBudget(event.target.value)} inputMode="numeric" />
            </div>
            <div>
              <p className="mb-2 text-[12px] font-medium text-[#7f8aa3]">Ventana de análisis en días</p>
              <Input value={warmupLookbackDays} onChange={(event) => setWarmupLookbackDays(event.target.value)} inputMode="numeric" />
            </div>
          </div>

          <div className="rounded-[16px] border border-[#e8edf5] bg-white px-4 py-4 text-[13px] text-[#5f6d86]">
            Recomendacion inicial: 30 preguntas por dia con un tope de 65.000 tokens estimados. Si el costo queda comodo,
            luego podés subir a 40-50 por corrida.
          </div>

          {warmupResult ? (
            <div className="space-y-3 rounded-[16px] border border-[#e8edf5] bg-white p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <MiniStat label="Candidatas" value={warmupResult.selectedCount} tone="slate" />
                <MiniStat label="Generadas" value={warmupResult.generatedCount} tone="green" />
                <MiniStat label="Omitidas" value={warmupResult.skippedCount} tone="red" />
                <MiniStat label="Tokens estimados" value={warmupResult.totalEstimatedTokens} tone="slate" />
              </div>

              <div className="rounded-[14px] border border-[#e8edf5] bg-white p-3">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#667085]">
                  {warmupResult.dryRun ? 'Cobertura prevista' : 'Última corrida generada'}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="rounded-[12px] border border-[#e8edf5] bg-white p-3">
                    <p className="text-[12px] font-medium text-[#7f8aa3]">Por materia</p>
                    <div className="mt-2 space-y-2">
                      {warmupResult.summary.coveredMaterias.length === 0 ? (
                        <p className="text-[13px] text-[#7f8aa3]">Sin datos.</p>
                      ) : (
                        warmupResult.summary.coveredMaterias.slice(0, 8).map((item) => (
                          <div key={item.materiaId} className="flex items-center justify-between gap-3 text-[13px]">
                            <span className="truncate text-[#42506a]">{item.materiaNombre}</span>
                            <span className="font-semibold text-[#1d2a44]">{item.questions}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="rounded-[12px] border border-[#e8edf5] bg-white p-3">
                    <p className="text-[12px] font-medium text-[#7f8aa3]">Por parcial</p>
                    <div className="mt-2 space-y-2">
                      {warmupResult.summary.coveredParciales.length === 0 ? (
                        <p className="text-[13px] text-[#7f8aa3]">Sin datos.</p>
                      ) : (
                        warmupResult.summary.coveredParciales.slice(0, 8).map((item) => (
                          <div
                            key={`${item.materiaId}-${item.parcial}`}
                            className="flex items-center justify-between gap-3 text-[13px]"
                          >
                            <span className="truncate text-[#42506a]">
                              {item.materiaNombre} - Parcial {item.parcial}
                            </span>
                            <span className="font-semibold text-[#1d2a44]">{item.questions}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <MiniStat label="Feedback total" value={feedbackStats?.total ?? 0} tone="slate" />
        <MiniStat label="Me ayudó" value={feedbackStats?.positive ?? 0} tone="green" />
        <MiniStat label="No me ayudó" value={feedbackStats?.negative ?? 0} tone="red" />
      </div>

      <section className="rounded-[20px] border border-[#e7ebf4] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#eef1f6] px-5 py-4">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#2563EB]" />
            <p className="text-[14px] font-semibold text-[#1d2a44]">Ranking de errores explicados por IA</p>
            <span className="rounded-full border border-[#dbe2f0] bg-white px-2 py-0.5 text-[12px] font-medium text-[#5f6d86]">
              {feedbackStats?.generatedCount?.toLocaleString('es-AR') ?? 0} generadas
            </span>
          </div>
          <div className="flex items-center gap-2">
            {rankingRows.length > 3 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllRanking((current) => !current)}
                className="rounded-[12px]"
              >
                {showAllRanking ? 'Ver menos' : 'Ver más'}
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => void refreshIAData()} disabled={loadingRanking} className="rounded-[12px]">
              {loadingRanking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Actualizar
            </Button>
          </div>
        </div>
        <div className="space-y-3 p-5">
          {rankingRows.length === 0 ? (
            <p className="text-[14px] text-[#7f8aa3]">Todavía no hay errores de IA para mostrar.</p>
          ) : (
            visibleRankingRows.map((row) => (
              <article key={row.pregunta_id} className="rounded-[16px] border border-[#e8edf5] bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[14px] font-semibold text-[#1d2a44]">{row.enunciado}</p>
                    <p className="mt-1 text-[12px] text-[#5f6d86]">
                      {row.materia_nombre ?? 'Materia sin nombre'}
                      {row.parcial ? ` - Parcial ${row.parcial}` : ''}
                    </p>
                    <p className="mt-1 text-[12px] text-[#7f8aa3]">
                      Fallos: <span className="font-semibold text-[#1d2a44]">{row.veces_fallada}</span> - IA: {row.provider ?? 'sin proveedor'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => void regenerateExplanation(row.pregunta_id)}
                    disabled={refreshingPreguntaId === row.pregunta_id}
                    className="h-9 rounded-[12px] bg-[#2563EB] px-4 hover:bg-[#2649c7]"
                  >
                    {refreshingPreguntaId === row.pregunta_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}
                    Regenerar
                  </Button>
                </div>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setExpandedQuestions((current) => ({
                        ...current,
                        [row.pregunta_id]: !current[row.pregunta_id],
                      }))
                    }
                    className="rounded-[12px]"
                  >
                    {expandedQuestions[row.pregunta_id] ? 'Ocultar explicación' : 'Ver explicación'}
                  </Button>
                </div>
                {expandedQuestions[row.pregunta_id] ? (
                  <div className="mt-3 rounded-[14px] border border-[#e8edf5] bg-white p-3">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#667085]">Explicación guardada</p>
                    <p className="mt-2 text-[13px] leading-6 text-[#42506a]">
                      {row.explicacion ?? 'Esta pregunta todavía no tiene una explicación cacheada.'}
                    </p>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[20px] border border-[#e7ebf4] bg-white">
        <div className="border-b border-[#eef1f6] px-5 py-4">
          <p className="text-[14px] font-semibold text-[#1d2a44]">Revision de feedback negativo</p>
        </div>
        <div className="space-y-3 p-5">
          {negativeFeedbackRows.length === 0 ? (
            <p className="text-[14px] text-[#7f8aa3]">Todavía no hay feedback negativo para revisar.</p>
          ) : (
            negativeFeedbackRows.slice(0, 20).map((row) => (
              <article key={`${row.pregunta_id}-${row.created_at}`} className="rounded-[16px] border border-[#f1d6d6] bg-[#fff8f8] p-4">
                <p className="text-[12px] font-medium text-[#c95f5f]">
                  No me ayudó - {new Date(row.created_at).toLocaleString('es-AR')}
                </p>
                <p className="mt-2 text-[14px] font-semibold text-[#1d2a44]">{row.enunciado}</p>
                <p className="mt-2 text-[12px] text-[#7f8aa3]">IA: {row.provider ?? 'sin proveedor'}</p>
                <p className="mt-2 text-[13px] leading-6 text-[#42506a]">
                  {row.explicacion ?? 'Esta pregunta no tiene explicación cacheada actualmente.'}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </section>
  );
}


