'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  GraduationCap,
  Share2,
  Star,
  UploadCloud,
  Users,
  Zap,
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase-client';
import { logError } from '@/lib/observability';
import { trackMateriaAnalyticsEvent } from '@/lib/materia-analytics';
import { pushRecentResource } from '@/lib/dashboard-client';
import {
  getCareerRoute,
  getMateriaRoute,
  getResourceRoute,
  getSimulatorRoute,
  getUniversityRoute,
} from '@/lib/routes';
import type { SharedStudentMaterial } from '@/lib/data/student-materials';
import type { Resumen } from './materia-content.helpers';
import { getMateriaHeroImage, isLongMateriaTitle } from './materia-content.helpers';
import { MateriaStudyResumeCard } from './materia-study-resume-card';
import { SharedStudentMaterialCard } from './shared-student-material-card';

type QuestionCounts = Record<1 | 2 | 3, number>;

interface MateriaStudyHomeProps {
  materiaId: string;
  materiaNombre: string;
  carreraId?: string;
  carreraNombre?: string;
  universidadId?: string;
  universidadNombre?: string;
  contextError?: string | null;
  initialResumenes?: Resumen[];
  initialResumenesError?: string | null;
  sharedStudentMaterials?: SharedStudentMaterial[];
  questionCounts: QuestionCounts;
}

const PRACTICE_OPTIONS = [
  { parcial: 1 as const, label: 'Parcial 1', shortLabel: 'P1' },
  { parcial: 2 as const, label: 'Parcial 2', shortLabel: 'P2' },
  { parcial: 3 as const, label: 'Integrador', shortLabel: 'INT' },
];

function getResumenHref(materiaId: string, materiaNombre: string, resumen: Resumen) {
  const resourceId = resumen.id.startsWith('recurso-')
    ? resumen.id.replace('recurso-', '')
    : undefined;
  const baseRoute = getResourceRoute(materiaId, 'resumen-modulo', materiaNombre, resourceId);
  const moduleId = Number(resumen.module_id);
  const separator = baseRoute.includes('?') ? '&' : '?';
  return `${baseRoute}${separator}modulo=${Number.isFinite(moduleId) && moduleId > 0 ? moduleId : 1}`;
}

function buildUploadHref(materiaId: string, carreraId?: string, universidadId?: string) {
  const params = new URLSearchParams({ openUpload: '1', materiaId });
  if (carreraId) params.set('carreraId', carreraId);
  if (universidadId) params.set('universidadId', universidadId);
  return `/dashboard/materiales?${params.toString()}`;
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function MateriaStudyHome({
  materiaId,
  materiaNombre,
  carreraId,
  carreraNombre = '',
  universidadId,
  universidadNombre = '',
  contextError = null,
  initialResumenes = [],
  initialResumenesError = null,
  sharedStudentMaterials = [],
  questionCounts,
}: MateriaStudyHomeProps) {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);

  const nombre = materiaNombre || 'Materia';
  const isLongTitle = isLongMateriaTitle(nombre);
  const heroImage = getMateriaHeroImage(nombre);
  const uploadHref = buildUploadHref(materiaId, carreraId, universidadId);

  const visibleStudentMaterials = useMemo(
    () => sharedStudentMaterials.slice(0, 3),
    [sharedStudentMaterials]
  );
  const visibleResumenes = useMemo(
    () =>
      initialResumenes
        .filter((resumen) => Boolean(resumen.file_url))
        .slice(0, Math.max(0, 6 - visibleStudentMaterials.length)),
    [initialResumenes, visibleStudentMaterials.length]
  );
  const hasContent = visibleResumenes.length > 0 || visibleStudentMaterials.length > 0;
  const totalQuestions = questionCounts[1] + questionCounts[2];
  const hasQuestions = totalQuestions > 0;

  useEffect(() => {
    let active = true;

    async function loadFavorite() {
      if (!user) {
        if (active) setIsFavorite(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('materia_id', materiaId)
          .maybeSingle();
        if (active) setIsFavorite(Boolean(data));
      } catch (error) {
        logError('materiaStudyHome.favoriteStatus', error, { materiaId });
      }
    }

    void loadFavorite();
    return () => {
      active = false;
    };
  }, [materiaId, user]);

  const toggleFavorite = async () => {
    if (favoritesLoading) return;

    if (!user) {
      const next = getMateriaRoute(materiaId, carreraId);
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    const nextValue = !isFavorite;
    setIsFavorite(nextValue);
    setFavoritesLoading(true);

    try {
      if (nextValue) {
        const { error } = await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, materia_id: materiaId });
        if (error) throw error;
        toast({ title: 'Materia guardada', description: 'La agregamos a tus favoritos.' });
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('materia_id', materiaId);
        if (error) throw error;
        toast({ title: 'Materia removida', description: 'Ya no aparece en tus favoritos.' });
      }
    } catch (error) {
      setIsFavorite(!nextValue);
      logError('materiaStudyHome.toggleFavorite', error, { materiaId, nextValue });
      toast({
        variant: 'destructive',
        title: 'No pudimos guardar el favorito',
        description: 'Intentá nuevamente en unos segundos.',
      });
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleShareMateria = async () => {
    const sharePath = getMateriaRoute(materiaId, carreraId);
    const shareUrl = new URL(sharePath, window.location.origin).toString();

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({
          title: nombre,
          text: `Te comparto esta materia en Evaluo: ${nombre}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link copiado', description: 'Ya podés compartir esta materia.' });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      logError('materiaStudyHome.share', error, { materiaId });
      toast({
        variant: 'destructive',
        title: 'No pudimos compartir la materia',
        description: 'Intentá nuevamente en unos segundos.',
      });
    }
  };

  const trackAction = (eventName: string, metadata: Record<string, unknown>) => {
    void trackMateriaAnalyticsEvent(eventName, {
      userId: user?.id ?? null,
      materiaId,
      carreraId,
      universidadId,
      metadata,
    });
  };

  return (
    <div className="animate-page-enter min-h-full bg-white">
      <div className="w-full border-b border-[#E8EDF5] bg-white">
        <div className="mx-auto flex min-h-14 max-w-7xl overflow-x-hidden px-4 py-2.5 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm leading-6">
            <Link
              href="/explorar"
              className="flex items-center gap-1 text-slate-500 transition-colors hover:text-[#0F172A]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="sm:hidden">Volver</span>
              <span className="hidden sm:inline">Universidades</span>
            </Link>
            {universidadNombre ? (
              <>
                <ChevronRight className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
                <Link
                  href={universidadId ? getUniversityRoute(universidadId) : '/explorar'}
                  className="hidden max-w-[140px] truncate text-slate-500 transition-colors hover:text-[#0F172A] sm:block sm:max-w-none"
                >
                  {universidadNombre}
                </Link>
              </>
            ) : null}
            {carreraNombre ? (
              <>
                <ChevronRight className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
                <Link
                  href={carreraId ? getCareerRoute(carreraId) : '/materias'}
                  className="hidden max-w-[160px] truncate text-slate-500 transition-colors hover:text-[#0F172A] sm:block sm:max-w-none"
                >
                  {carreraNombre}
                </Link>
              </>
            ) : null}
            <ChevronRight className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            <span className="max-w-[190px] truncate font-medium text-slate-700 sm:max-w-none">
              {nombre}
            </span>
          </nav>
        </div>
      </div>

      <section className="relative min-h-[238px] w-full overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] shadow-2xl sm:min-h-[280px]">
        <div
          className="absolute inset-0 hidden h-full w-full bg-cover bg-center lg:block"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,#0F172A_0%,#0F172A_28%,rgba(15,23,42,0.94)_42%,rgba(15,23,42,0.76)_56%,rgba(15,23,42,0.42)_70%,rgba(15,23,42,0.16)_84%,rgba(15,23,42,0.04)_100%)] lg:block" />
        <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_78%_36%,rgba(99,102,241,0.18),transparent_24%)] lg:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-t from-[#0F172A]/32 via-transparent to-[#0F172A]/10 lg:block" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/88 to-[#1E293B]/55 lg:hidden" />

        <div className="relative mx-auto flex h-full max-w-7xl overflow-x-hidden px-4 py-4 lg:px-8 lg:py-8">
          <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="mx-auto flex min-w-0 flex-1 items-center justify-center gap-3 sm:gap-6 lg:max-w-3xl">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/5 sm:flex sm:h-24 sm:w-24">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white sm:h-[80px] sm:w-[80px]">
                  <GraduationCap className="h-5 w-5 sm:h-9 sm:w-9" />
                </div>
              </div>

              <div className="min-w-0 flex-1 text-center lg:text-left">
                <p className="text-xs text-white/70 sm:text-sm">Materia</p>
                <h1
                  className={`tracking-[-0.05em] text-white drop-shadow-lg ${
                    isLongTitle
                      ? 'text-[20px] leading-tight font-bold sm:text-[34px]'
                      : 'text-[22px] leading-tight font-bold sm:text-[42px]'
                  }`}
                >
                  {nombre}
                </h1>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[12px] text-white/80 sm:mt-6 sm:gap-3 sm:text-sm lg:justify-start">
                  {carreraNombre ? (
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                      <BookOpen className="hidden h-4 w-4 shrink-0 sm:block" />
                      <span>{carreraNombre}</span>
                    </div>
                  ) : null}
                  {universidadNombre ? (
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                      <Users className="hidden h-4 w-4 shrink-0 sm:block" />
                      <span>{universidadNombre}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-end">
              <button
                type="button"
                onClick={() => void handleShareMateria()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15 sm:h-auto sm:w-auto sm:px-5 sm:py-3"
              >
                <Share2 className="h-4 w-4" />
                Compartir
              </button>
              <button
                type="button"
                onClick={() => void toggleFavorite()}
                disabled={favoritesLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15 disabled:opacity-60 sm:h-auto sm:w-auto sm:px-5 sm:py-3"
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-current text-yellow-400' : ''}`} />
                {isFavorite ? 'Guardada' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 lg:px-8 lg:py-9">
        {contextError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {contextError}
          </div>
        ) : null}

        <MateriaStudyResumeCard
          materiaId={materiaId}
          materiaNombre={nombre}
          carreraId={carreraId}
          universidadId={universidadId}
          uploadHref={uploadHref}
        />

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-5" aria-label="Acciones principales">
          <Link
            href={uploadHref}
            onClick={() =>
              trackAction('materia_upload_notes_clicked', { source: 'materia_action_card' })
            }
            className="group relative overflow-hidden rounded-[24px] border border-[#BFD3FF] bg-[linear-gradient(145deg,#F8FBFF_0%,#EAF2FF_100%)] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#8FB4FF] hover:shadow-[0_18px_44px_rgba(37,99,235,0.12)] sm:p-7"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-white text-[#2563EB] shadow-[0_10px_25px_rgba(37,99,235,0.10)]">
                <UploadCloud className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-[0.14em] text-[#2563EB] uppercase">
                  Estudiá con tu material
                </p>
                <h2 className="mt-1.5 text-xl font-bold tracking-[-0.035em] text-slate-950 sm:text-[1.7rem]">
                  Prepará {nombre} con tu propio PDF
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Subí lo que realmente entra en tu examen y Evaluo te guía para repasar, practicar
                  y reforzar lo que todavía te cuesta.
                </p>
              </div>
            </div>

            <div className="bg-primary hover:bg-primary/90 mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition sm:w-auto">
              <UploadCloud className="h-4 w-4" />
              Subir mi PDF
            </div>
          </Link>

          <div
            id="practicar-preguntero"
            className={`rounded-[24px] border p-5 transition duration-200 sm:p-6 ${
              practiceOpen
                ? 'border-emerald-300 bg-[linear-gradient(145deg,#F7FFFC_0%,#ECFDF7_100%)] shadow-[0_18px_44px_rgba(5,150,105,0.10)]'
                : 'border-slate-200 bg-white hover:border-emerald-200 hover:shadow-[0_16px_38px_rgba(15,23,42,0.07)]'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                const nextOpen = !practiceOpen;
                setPracticeOpen(nextOpen);
                if (nextOpen) {
                  trackAction('materia_practice_picker_opened', { source: 'materia_action_card' });
                }
              }}
              className="flex w-full items-start gap-4 text-left"
              aria-expanded={practiceOpen}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-emerald-50 text-emerald-700">
                <Zap className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-[-0.035em] text-slate-950 sm:text-2xl">
                      Practicar preguntas
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                      Respondé preguntas por parcial con corrección inmediata. El simulacro completo
                      aparece cuando estés listo.
                    </p>
                  </div>
                  <ChevronDown
                    className={`mt-1 h-5 w-5 shrink-0 text-slate-400 transition-transform ${practiceOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>
            </button>

            {!practiceOpen ? (
              <button
                type="button"
                onClick={() => {
                  setPracticeOpen(true);
                  trackAction('materia_practice_picker_opened', { source: 'materia_action_cta' });
                }}
                className="text-primary hover:border-primary/40 hover:bg-primary/5 mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-white px-5 text-sm font-semibold transition sm:w-auto"
              >
                <Zap className="h-4 w-4" />
                Ver prácticas disponibles
              </button>
            ) : (
              <div className="mt-5 space-y-3">
                {hasQuestions ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {PRACTICE_OPTIONS.filter(
                      (option) => (questionCounts[option.parcial] ?? 0) > 0
                    ).map((option) => {
                      const count = questionCounts[option.parcial] ?? 0;
                      const href = getSimulatorRoute(
                        materiaId,
                        option.parcial,
                        universidadId,
                        carreraId
                      );

                      return (
                        <Link
                          key={option.parcial}
                          href={href}
                          onClick={() =>
                            trackAction('materia_simulator_cta_clicked', {
                              source: 'materia_practice_picker',
                              parcial: option.parcial,
                              question_count: count,
                            })
                          }
                          className="group rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-left transition hover:border-emerald-400 hover:bg-emerald-50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900">{option.label}</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 opacity-0 transition group-hover:opacity-100" />
                          </div>
                          <p className="mt-1 text-[12px] text-slate-500">
                            {count.toLocaleString('es-AR')} preguntas disponibles
                          </p>
                          <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700">
                            Comenzar <ChevronRight className="h-3.5 w-3.5" />
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/80 p-4">
                    <h3 className="font-bold text-slate-900">
                      La práctica de esta materia está en preparación
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      No tenés que elegir entre opciones vacías. Podés crear ejercicios desde tus
                      apuntes o probar una guía completa de ejemplo.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Link
                        href={uploadHref}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
                      >
                        <UploadCloud className="h-4 w-4" />
                        Crear ejercicios con mi PDF
                      </Link>
                      <Link
                        href="/demo/material-estudio"
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                      >
                        Ver guía de ejemplo
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="contenido-materia-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
                Material público de referencia
              </p>
              <h2
                id="contenido-materia-title"
                className="mt-1 text-[1.55rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-[2rem]"
              >
                Recursos compartidos de {nombre}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Podés consultarlos como referencia. Para estudiar lo que realmente entra en tu
                examen, usá tu propio PDF.
              </p>
            </div>
            <Link
              href={uploadHref}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-[#AFC8FF] hover:text-[#2563EB]"
            >
              <UploadCloud className="h-4 w-4" />
              Estudiar con mi PDF
            </Link>
          </div>

          {initialResumenesError && visibleResumenes.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              {initialResumenesError}
            </div>
          ) : null}

          {hasContent ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleStudentMaterials.map((material) => (
                <SharedStudentMaterialCard
                  key={`student-${material.id}`}
                  material={material}
                  materiaId={materiaId}
                  materiaNombre={nombre}
                  onOpen={(materialId, artifactCount) =>
                    trackAction('materia_student_material_opened', {
                      source: 'materia_content_hub',
                      material_id: materialId,
                      artifact_count: artifactCount,
                    })
                  }
                />
              ))}

              {visibleResumenes.map((resumen) => {
                const moduleId = Number(resumen.module_id);
                const moduleLabel =
                  Number.isFinite(moduleId) && moduleId > 0 ? `Módulo ${moduleId}` : 'Resumen';
                const dateLabel = formatDate(resumen.created_at);
                const resumenHref = getResumenHref(materiaId, nombre, resumen);

                return (
                  <article
                    key={`resumen-${resumen.id}`}
                    className="flex min-h-[230px] flex-col rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.055)] sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#EEF4FF] text-[#2563EB]">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[10px] font-bold tracking-[0.08em] text-[#2563EB] uppercase">
                            {moduleLabel}
                          </span>
                          {resumen.pages ? (
                            <span className="text-[11px] font-medium text-slate-400">
                              {resumen.pages} páginas
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-2 line-clamp-2 text-[17px] font-bold tracking-[-0.025em] text-slate-950">
                          {resumen.title}
                        </h3>
                      </div>
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                      {resumen.author_name || 'Resumen compartido para estudiar esta materia.'}
                    </p>
                    {dateLabel ? (
                      <p className="mt-2 text-[12px] text-slate-400">Publicado {dateLabel}</p>
                    ) : null}

                    <Link
                      href={resumenHref}
                      onClick={() => {
                        pushRecentResource({
                          id: resumen.id,
                          title: resumen.title,
                          subjectId: materiaId,
                          subjectName: nombre,
                          type: 'Resumen',
                          href: resumenHref,
                          openedAt: new Date().toISOString(),
                        });
                        trackAction('materia_resumen_opened', {
                          source: 'materia_content_hub',
                          resumen_id: resumen.id,
                        });
                      }}
                      className="mt-auto inline-flex h-10 items-center justify-between rounded-xl border border-[#C7D2FE] px-3.5 text-sm font-semibold text-[#2563EB] transition hover:bg-[#EEF4FF]"
                    >
                      Ver resumen
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center sm:px-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2563EB] shadow-sm">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold tracking-[-0.03em] text-slate-950">
                Todavía no hay recursos públicos
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Podés empezar igual con tus propios apuntes y estudiar directamente sobre el
                material que te dieron para el examen.
              </p>
              <div className="mt-5 flex justify-center">
                <Link
                  href={uploadHref}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-5 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
                >
                  <UploadCloud className="h-4 w-4" />
                  Estudiar con mi PDF
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
