'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { updateProfile } from '@/lib/actions/perfil';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  GraduationCap,
  School,
  Sparkles,
} from 'lucide-react';
import { logError } from '@/lib/observability';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { getMateriasByCarrera } from '@/services/api';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Universidad {
  id: string;
  nombre: string;
}

interface Carrera {
  id: string;
  nombre: string;
  universidad_id: string | null;
}

interface MateriaOption {
  id: string;
  nombre: string;
}

interface ProfileModalProps {
  userId: string;
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
  allowSkip?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Persistence helpers                                                */
/* ------------------------------------------------------------------ */

const ONBOARDING_STORAGE_KEY = 'evaluo_onboarding_state';

type OnboardingPersistedState = {
  step: number;
  universidadId: string;
  universidadNombre: string;
  universidadSearch: string;
  carreraId: string;
  carreraNombre: string;
  carreraSearch: string;
  selectedMateriaIds: string[];
};

function readPersistedState(userId: string): OnboardingPersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${ONBOARDING_STORAGE_KEY}:${userId}`);
    return raw ? (JSON.parse(raw) as OnboardingPersistedState) : null;
  } catch {
    return null;
  }
}

function writePersistedState(userId: string, state: OnboardingPersistedState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${ONBOARDING_STORAGE_KEY}:${userId}`, JSON.stringify(state));
  } catch {
    // ignore write failures
  }
}

function clearPersistedState(userId: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(`${ONBOARDING_STORAGE_KEY}:${userId}`);
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TOTAL_STEPS = 4;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProfileCompletionModal({
  userId,
  isOpen,
  onComplete,
  onClose,
  allowSkip = true,
}: ProfileModalProps) {
  const { toast } = useToast();
  const router = useRouter();

  /* ---- Step state ---- */
  const [step, setStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  /* ---- Step 1-2: University & career ---- */
  const [universidadId, setUniversidadId] = useState('');
  const [universidadNombre, setUniversidadNombre] = useState('');
  const [universidadSearch, setUniversidadSearch] = useState('');
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [hasLoadedUniversidades, setHasLoadedUniversidades] = useState(false);
  const [loadingUniversidades, setLoadingUniversidades] = useState(false);

  const [carreraId, setCarreraId] = useState('');
  const [carreraNombre, setCarreraNombre] = useState('');
  const [carreraSearch, setCarreraSearch] = useState('');
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loadingCarreras, setLoadingCarreras] = useState(false);

  /* ---- Step 3: Materias ---- */
  const [materias, setMaterias] = useState<MateriaOption[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  const [selectedMateriaIds, setSelectedMateriaIds] = useState<string[]>([]);
  const [materiasHydrated, setMateriasHydrated] = useState(false);

  /* ---- Hydration & loading ---- */
  const [hydratingProfile, setHydratingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const universidadSeleccionada = useMemo(
    () => universidades.find((u) => u.id === universidadId) ?? null,
    [universidadId, universidades]
  );

  /* ================================================================ */
  /*  Hydrate persisted state + profile data on open                  */
  /* ================================================================ */

  useEffect(() => {
    let active = true;

    async function hydrate() {
      if (!isOpen || initialized) return;

      setHydratingProfile(true);

      try {
        // 1. Check persisted state first
        const persisted = readPersistedState(userId);

        // 2. Also fetch profile from DB
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('universidad_id, carrera_id')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!active) return;

        const dbUniId = String(profile?.universidad_id ?? '').trim();
        const dbCarreraId = String(profile?.carrera_id ?? '').trim();

        // Use DB as source of truth, fallback to persisted
        const effectiveUniId = dbUniId || persisted?.universidadId || '';
        const effectiveCarreraId = dbCarreraId || persisted?.carreraId || '';

        if (effectiveUniId) {
          setUniversidadId(effectiveUniId);

          const { data: uni } = await supabase
            .from('universidades')
            .select('id, nombre')
            .eq('id', effectiveUniId)
            .maybeSingle();

          if (uni && active) {
            setUniversidadNombre(uni.nombre);
            setUniversidadSearch(uni.nombre);
            setUniversidades((prev) => {
              const rest = prev.filter((u) => u.id !== uni.id);
              return [uni, ...rest].slice(0, 12);
            });
          }

          // Load carreras for the university
          const { data: uniCarreras } = await supabase
            .from('carreras')
            .select('id, nombre, universidad_id')
            .eq('universidad_id', effectiveUniId)
            .order('nombre')
            .limit(14);

          if (active && uniCarreras) {
            setCarreras(uniCarreras);
          }
        }

        if (effectiveCarreraId) {
          setCarreraId(effectiveCarreraId);

          const { data: carrera } = await supabase
            .from('carreras')
            .select('id, nombre, universidad_id')
            .eq('id', effectiveCarreraId)
            .maybeSingle();

          if (carrera && active) {
            setCarreraNombre(carrera.nombre);
            setCarreraSearch(carrera.nombre);
            setCarreras((prev) => {
              const rest = prev.filter((c) => c.id !== carrera.id);
              return [carrera as Carrera, ...rest].slice(0, 14);
            });
          }
        }

        // Determine starting step
        if (active) {
          if (persisted && persisted.step >= 1 && persisted.step <= TOTAL_STEPS) {
            // Restore from persisted state
            setStep(persisted.step);
            if (persisted.selectedMateriaIds.length > 0) {
              setSelectedMateriaIds(persisted.selectedMateriaIds);
            }
            if (persisted.universidadNombre) setUniversidadNombre(persisted.universidadNombre);
            if (persisted.universidadSearch) setUniversidadSearch(persisted.universidadSearch);
            if (persisted.carreraNombre) setCarreraNombre(persisted.carreraNombre);
            if (persisted.carreraSearch) setCarreraSearch(persisted.carreraSearch);
          } else if (effectiveUniId && effectiveCarreraId) {
            // Already has profile — jump to step 3 or 4
            setStep(3);
          } else if (effectiveUniId) {
            setStep(2);
          }
          setInitialized(true);
        }
      } catch (error) {
        logError('profileCompletionModal.hydrate', error, { userId });
        if (active) setInitialized(true);
      } finally {
        if (active) setHydratingProfile(false);
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, [initialized, isOpen, userId]);

  /* Reset when dialog closes */
  useEffect(() => {
    if (!isOpen) {
      setInitialized(false);
    }
  }, [isOpen]);

  /* ================================================================ */
  /*  Fetch universidades                                              */
  /* ================================================================ */

  useEffect(() => {
    let active = true;

    async function fetchUniversidades() {
      if (!isOpen || hydratingProfile || !initialized) return;

      setLoadingUniversidades(true);

      try {
        let query = supabase
          .from('universidades')
          .select('id, nombre')
          .order('nombre')
          .limit(12);

        const search = universidadSearch.trim();
        if (search.length >= 2) {
          query = query.ilike('nombre', `%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!active) return;

        setUniversidades(data || []);
        setHasLoadedUniversidades(true);
      } catch (err) {
        logError('profileCompletionModal.fetchUniversidades', err, {
          userId,
          search: universidadSearch.trim(),
        });
      } finally {
        if (active) setLoadingUniversidades(false);
      }
    }

    void fetchUniversidades();
    return () => {
      active = false;
    };
  }, [hydratingProfile, initialized, isOpen, universidadSearch, userId]);

  /* ================================================================ */
  /*  Fetch carreras                                                   */
  /* ================================================================ */

  useEffect(() => {
    let active = true;

    async function fetchCarreras() {
      if (!isOpen || !universidadId || hydratingProfile || !initialized) {
        if (!universidadId) setCarreras([]);
        setLoadingCarreras(false);
        return;
      }

      setLoadingCarreras(true);

      try {
        let query = supabase
          .from('carreras')
          .select('id, nombre, universidad_id')
          .eq('universidad_id', universidadId)
          .order('nombre')
          .limit(14);

        const search = carreraSearch.trim();
        if (search.length >= 2) {
          query = query.ilike('nombre', `%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!active) return;

        setCarreras(data || []);
      } catch (err) {
        logError('profileCompletionModal.fetchCarreras', err, {
          userId,
          universidadId,
          search: carreraSearch.trim(),
        });
      } finally {
        if (active) setLoadingCarreras(false);
      }
    }

    void fetchCarreras();
    return () => {
      active = false;
    };
  }, [carreraSearch, hydratingProfile, initialized, isOpen, universidadId, userId]);

  /* ================================================================ */
  /*  Fetch materias for step 3                                         */
  /* ================================================================ */

  useEffect(() => {
    let active = true;

    async function fetchMaterias() {
      if (!isOpen || !carreraId || step !== 3 || materiasHydrated) return;

      setLoadingMaterias(true);

      try {
        const data = await getMateriasByCarrera(carreraId);
        if (!active) return;

        setMaterias(data.map((m) => ({ id: m.id, nombre: m.nombre })));
        setMateriasHydrated(true);
      } catch (err) {
        logError('profileCompletionModal.fetchMaterias', err, { userId, carreraId });
      } finally {
        if (active) setLoadingMaterias(false);
      }
    }

    void fetchMaterias();
    return () => {
      active = false;
    };
  }, [carreraId, isOpen, materiasHydrated, step, userId]);

  /* ================================================================ */
  /*  Persist state on change                                          */
  /* ================================================================ */

  useEffect(() => {
    if (!initialized) return;
    writePersistedState(userId, {
      step,
      universidadId,
      universidadNombre,
      universidadSearch,
      carreraId,
      carreraNombre,
      carreraSearch,
      selectedMateriaIds,
    });
  }, [
    step,
    universidadId,
    universidadNombre,
    universidadSearch,
    carreraId,
    carreraNombre,
    carreraSearch,
    initialized,
    selectedMateriaIds,
    userId,
  ]);

  /* ================================================================ */
  /*  Navigation helpers                                               */
  /* ================================================================ */

  const goToStep = useCallback(
    (target: number) => {
      setSlideDirection(target > step ? 'right' : 'left');
      setStep(target);
    },
    [step]
  );

  const goNext = useCallback(() => {
    setStep((prev) => {
      if (prev < TOTAL_STEPS) {
        setSlideDirection('right');
        return prev + 1;
      }
      return prev;
    });
  }, []);

  const goBack = useCallback(() => {
    setStep((prev) => {
      if (prev > 1) {
        setSlideDirection('left');
        return prev - 1;
      }
      return prev;
    });
  }, []);

  /* ================================================================ */
  /*  Step 1 actions                                                   */
  /* ================================================================ */

  const selectUniversidad = useCallback(
    (uni: Universidad) => {
      setUniversidadId(uni.id);
      setUniversidadNombre(uni.nombre);
      setUniversidadSearch(uni.nombre);
      setCarreraId('');
      setCarreraNombre('');
      setCarreraSearch('');
      setCarreras([]);
      setMaterias([]);
      setSelectedMateriaIds([]);
      setMateriasHydrated(false);
      // Auto advance to step 2
      setTimeout(() => goNext(), 300);
    },
    [goNext]
  );

  /* ================================================================ */
  /*  Step 2 actions                                                   */
  /* ================================================================ */

  const selectCarrera = useCallback(
    (car: Carrera) => {
      setCarreraId(car.id);
      setCarreraNombre(car.nombre);
      setCarreraSearch(car.nombre);
      setMaterias([]);
      setSelectedMateriaIds([]);
      setMateriasHydrated(false);
      // Auto advance to step 3
      setTimeout(() => goNext(), 300);
    },
    [goNext]
  );

  /* ================================================================ */
  /*  Step 3 actions                                                   */
  /* ================================================================ */

  const toggleMateria = useCallback((materiaId: string) => {
    setSelectedMateriaIds((prev) =>
      prev.includes(materiaId)
        ? prev.filter((id) => id !== materiaId)
        : [...prev, materiaId]
    );
  }, []);

  /* ================================================================ */
  /*  Final submit (step 3 → step 4)                                   */
  /* ================================================================ */

  const handleSaveAndFinish = useCallback(async () => {
    if (!universidadId || !carreraId) return;

    setSaving(true);
    try {
      const result = await updateProfile(userId, {
        universidad_id: universidadId,
        carrera_id: carreraId,
      });

      if (!result.success) {
        throw new Error('Error al actualizar el perfil');
      }

      clearPersistedState(userId);
      goNext(); // → step 4
    } catch (error) {
      logError('profileCompletionModal.saveProfile', error, {
        userId,
        universidadId,
        carreraId,
      });
      toast({
        title: 'Error',
        description: 'No pudimos guardar tus datos. Por favor intentá de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [carreraId, goNext, toast, universidadId, userId]);

  const handleGoToDashboard = useCallback(() => {
    router.refresh();
    onComplete();
  }, [onComplete, router]);

  /* ================================================================ */
  /*  Step validity                                                    */
  /* ================================================================ */

  const canSubmitStep3 = Boolean(universidadId && carreraId);

  /* ================================================================ */
  /*  Show skeleton while hydrating                                    */
  /* ================================================================ */

  if (!initialized || hydratingProfile) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <DialogContent
          overlayClassName="bg-white/18 backdrop-blur-[10px]"
          className="overflow-hidden border-none bg-white/98 p-0 shadow-[0_34px_120px_rgba(15,23,42,0.22)] backdrop-blur-md sm:max-w-[540px]"
        >
          <div className="flex flex-col items-center justify-center px-6 py-16">
            <Spinner size="lg" />
            <p className="mt-4 text-sm font-medium text-slate-500">
              Preparando tu experiencia...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      <DialogContent
        overlayClassName="bg-white/18 backdrop-blur-[10px]"
        className={`overflow-hidden border-none bg-white/98 p-0 shadow-[0_34px_120px_rgba(15,23,42,0.22)] backdrop-blur-md sm:max-w-[580px] ${
          allowSkip ? '' : '[&>button]:hidden'
        }`}
      >
        {/* ---- Progress bar ---- */}
        <div className="px-5 pt-5 sm:px-8 sm:pt-6">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Paso {step} de {TOTAL_STEPS}
            </p>
            {step < TOTAL_STEPS && allowSkip ? (
              <button
                type="button"
                onClick={() => onClose?.()}
                className="text-[12px] font-semibold text-slate-400 transition hover:text-slate-600"
              >
                Saltar
              </button>
            ) : null}
          </div>
          <div className="mt-2.5 flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-500',
                  i < step ? 'bg-gradient-to-r from-[#2563EB] to-[#6366F1]' : 'bg-slate-100'
                )}
              />
            ))}
          </div>
        </div>

        {/* ---- Step content with slide animation ---- */}
        <div className="relative overflow-hidden">
          <div
            key={step}
            className={cn(
              'animate-in fade-in-0 duration-300',
              slideDirection === 'right'
                ? 'slide-in-from-right-8'
                : 'slide-in-from-left-8'
            )}
          >
            {/* ====== STEP 1: University ====== */}
            {step === 1 && (
              <div className="px-5 py-5 sm:px-8 sm:py-7">
                <DialogHeader className="mb-5 space-y-2 text-left">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]">
                      <School className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-[1.5rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-[1.75rem]">
                        ¿Dónde estudiás?
                      </DialogTitle>
                      <DialogDescription className="mt-1 text-sm leading-5 text-slate-500">
                        Buscá y seleccioná tu universidad para personalizar tu contenido.
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-3">
                  <Label htmlFor="uni-search-step1" className="font-medium text-slate-700">
                    Tu universidad
                  </Label>
                  <Command className="rounded-2xl border border-slate-200 bg-white">
                    <CommandInput
                      id="uni-search-step1"
                      placeholder="Escribí el nombre de tu universidad"
                      value={universidadSearch}
                      onValueChange={(value) => {
                        setUniversidadSearch(value);
                        if (universidadId) {
                          setUniversidadId('');
                          setUniversidadNombre('');
                        }
                      }}
                    />
                    <CommandList>
                      {loadingUniversidades ? (
                        <div className="flex items-center justify-center p-4">
                          <Spinner size="sm" />
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>
                            {hasLoadedUniversidades
                              ? 'No encontramos esa universidad.'
                              : 'Escribí al menos 2 letras para buscar.'}
                          </CommandEmpty>
                          <CommandGroup>
                            {universidades.map((uni) => (
                              <CommandItem
                                key={uni.id}
                                value={uni.nombre}
                                onSelect={() => selectUniversidad(uni)}
                                className={cn(
                                  'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-indigo-50',
                                  universidadId === uni.id
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-700'
                                )}
                              >
                                <span className="font-medium">{uni.nombre}</span>
                                {universidadId === uni.id && (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </div>
              </div>
            )}

            {/* ====== STEP 2: Career ====== */}
            {step === 2 && (
              <div className="px-5 py-5 sm:px-8 sm:py-7">
                <DialogHeader className="mb-5 space-y-2 text-left">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-[1.5rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-[1.75rem]">
                        ¿Qué carrera?
                      </DialogTitle>
                      <DialogDescription className="mt-1 text-sm leading-5 text-slate-500">
                        Seleccioná tu carrera dentro de {universidadNombre || 'tu universidad'}.
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {universidadSeleccionada && (
                  <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <School className="h-4 w-4 shrink-0 text-[#2563EB]" />
                    <span className="truncate font-medium">{universidadSeleccionada.nombre}</span>
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="ml-auto shrink-0 text-[11px] font-semibold text-[#2563EB] hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="carrera-search-step2" className="font-medium text-slate-700">
                    Tu carrera
                  </Label>
                  <Command className="rounded-2xl border border-slate-200 bg-white">
                    <CommandInput
                      id="carrera-search-step2"
                      placeholder="Escribí el nombre de tu carrera"
                      value={carreraSearch}
                      onValueChange={(value) => {
                        setCarreraSearch(value);
                        if (carreraId) {
                          setCarreraId('');
                          setCarreraNombre('');
                        }
                      }}
                    />
                    <CommandList>
                      {loadingCarreras ? (
                        <div className="flex items-center justify-center p-4">
                          <Spinner size="sm" />
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>
                            {universidadId
                              ? 'No encontramos carreras para esa búsqueda.'
                              : 'Primero seleccioná una universidad.'}
                          </CommandEmpty>
                          <CommandGroup>
                            {carreras.map((car) => (
                              <CommandItem
                                key={car.id}
                                value={car.nombre}
                                onSelect={() => selectCarrera(car)}
                                className={cn(
                                  'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-indigo-50',
                                  carreraId === car.id
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-700'
                                )}
                              >
                                <span className="font-medium">{car.nombre}</span>
                                {carreraId === car.id && (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </div>
              </div>
            )}

            {/* ====== STEP 3: Materias ====== */}
            {step === 3 && (
              <div className="px-5 py-5 sm:px-8 sm:py-7">
                <DialogHeader className="mb-5 space-y-2 text-left">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-[1.5rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-[1.75rem]">
                        ¿Qué materias cursás?
                      </DialogTitle>
                      <DialogDescription className="mt-1 text-sm leading-5 text-slate-500">
                        Seleccioná al menos 1 materia para empezar, o saltá este paso.
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {/* Summary chips */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    <School className="h-3 w-3 text-[#2563EB]" />
                    {universidadNombre}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    <GraduationCap className="h-3 w-3 text-[#2563EB]" />
                    {carreraNombre}
                  </span>
                </div>

                {loadingMaterias ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Spinner size="lg" />
                    <p className="mt-3 text-sm text-slate-500">Cargando materias...</p>
                  </div>
                ) : materias.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center">
                    <p className="text-sm font-medium text-slate-600">
                      No encontramos materias para esta carrera.
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Podés agregar materias más tarde desde el dashboard.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
                    {materias.map((materia) => {
                      const isSelected = selectedMateriaIds.includes(materia.id);
                      return (
                        <button
                          key={materia.id}
                          type="button"
                          onClick={() => toggleMateria(materia.id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition',
                            isSelected
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-[#2563EB]'
                              : 'hover:bg-slate-50 text-slate-700'
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleMateria(materia.id)}
                            className="shrink-0 border-slate-300 data-[state=checked]:border-[#2563EB] data-[state=checked]:bg-[#2563EB]"
                          />
                          <span className="font-medium">{materia.nombre}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedMateriaIds.length > 0 && (
                  <p className="mt-2 text-center text-[12px] font-semibold text-[#2563EB]">
                    {selectedMateriaIds.length}{' '}
                    {selectedMateriaIds.length === 1 ? 'materia seleccionada' : 'materias seleccionadas'}
                  </p>
                )}
              </div>
            )}

            {/* ====== STEP 4: Done ====== */}
            {step === 4 && (
              <div className="px-5 py-8 sm:px-8 sm:py-10">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-[0_12px_30px_rgba(16,185,129,0.3)]">
                    <Check className="h-8 w-8 text-white" strokeWidth={3} />
                  </div>
                  <DialogTitle className="mt-5 text-[1.6rem] font-bold tracking-[-0.04em] text-slate-950 sm:text-[1.85rem]">
                    ¡Listo!
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-sm leading-5 text-slate-500">
                    Ya tenés todo configurado para empezar.
                  </DialogDescription>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 text-center shadow-sm">
                  <p className="text-sm text-slate-600">
                    Vas a estudiar{' '}
                    <span className="font-bold text-slate-900">
                      {selectedMateriaIds.length > 0
                        ? `${selectedMateriaIds.length} ${selectedMateriaIds.length === 1 ? 'materia' : 'materias'}`
                        : 'materias que agregues después'}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600">
                    en{' '}
                    <span className="font-bold text-[#2563EB]">{universidadNombre}</span>
                  </p>
                  {carreraNombre && (
                    <p className="mt-1 text-xs text-slate-400">
                      Carrera: {carreraNombre}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleGoToDashboard}
                  className="mt-6 h-12 w-full rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] hover:opacity-95"
                >
                  Ir al dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ---- Footer buttons (steps 1-3) ---- */}
        {step < TOTAL_STEPS && (
          <div className="border-t border-slate-100 px-5 py-4 sm:px-8 sm:py-5">
            <div className="flex items-center justify-between gap-3">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="h-11 rounded-2xl border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Atrás
                </Button>
              ) : (
                <div />
              )}

              {step === 3 ? (
                <div className="flex gap-2">
                  {allowSkip && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoToDashboard}
                      className="h-11 rounded-2xl border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600"
                    >
                      Saltar por ahora
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleSaveAndFinish}
                    disabled={!canSubmitStep3 || saving}
                    className="h-11 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] hover:opacity-95"
                  >
                    {saving ? 'Guardando...' : 'Continuar'}
                    {saving ? null : <ArrowRight className="ml-1.5 h-4 w-4" />}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
