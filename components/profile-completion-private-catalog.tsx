'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  FileUp,
  GraduationCap,
  LockKeyhole,
  Plus,
  School,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase-client';
import { updateProfile } from '@/lib/actions/perfil';
import { findCareerMatches } from '@/lib/career-matching';
import { getAcademicProfileActiveSubjectIds } from '@/lib/profile-completion';
import { findUniversityMatches } from '@/lib/university-matching';
import { getMateriasByCarrera } from '@/services/api';
import {
  createPrivatePendingCareerAction,
  createPrivatePendingSubjectAction,
  createPrivatePendingUniversityAction,
} from '@/app/completar-perfil/pending-academic-actions';

type Universidad = {
  id: string;
  nombre: string;
  approval_status?: 'approved' | 'pending' | null;
};
type Carrera = { id: string; nombre: string; universidad_id: string | null };
type Materia = { id: string; nombre: string };

type Props = {
  userId: string;
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
  allowSkip?: boolean;
};

type PersistedState = {
  step: number;
  universidadId: string;
  universidadNombre: string;
  carreraId: string;
  carreraNombre: string;
  selectedMateriaIds: string[];
  pendingUniversity: boolean;
  pendingCareer: boolean;
  pendingMateriaIds: string[];
};

const STORAGE_KEY = 'evaluo_onboarding_private_catalog';
const TOTAL_STEPS = 4;

function readState(userId: string): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${userId}`);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

function writeState(userId: string, state: PersistedState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(state));
  } catch {
    // Best effort only.
  }
}

function clearState(userId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${STORAGE_KEY}:${userId}`);
  } catch {
    // Best effort only.
  }
}

export function ProfileCompletionPrivateCatalog({
  userId,
  isOpen,
  onComplete,
  onClose,
  allowSkip = false,
}: Props) {
  const { toast } = useToast();
  const [initialized, setInitialized] = useState(false);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [universidadId, setUniversidadId] = useState('');
  const [universidadNombre, setUniversidadNombre] = useState('');
  const [universidadSearch, setUniversidadSearch] = useState('');
  const [showMissingUniversity, setShowMissingUniversity] = useState(false);
  const [missingUniversityName, setMissingUniversityName] = useState('');
  const [missingUniversityCity, setMissingUniversityCity] = useState('');
  const [pendingUniversity, setPendingUniversity] = useState(false);

  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [carreraId, setCarreraId] = useState('');
  const [carreraNombre, setCarreraNombre] = useState('');
  const [carreraSearch, setCarreraSearch] = useState('');
  const [loadingCarreras, setLoadingCarreras] = useState(false);
  const [showMissingCareer, setShowMissingCareer] = useState(false);
  const [missingFacultyName, setMissingFacultyName] = useState('');
  const [missingCareerName, setMissingCareerName] = useState('');
  const [pendingCareer, setPendingCareer] = useState(false);

  const [materias, setMaterias] = useState<Materia[]>([]);
  const [selectedMateriaIds, setSelectedMateriaIds] = useState<string[]>([]);
  const [pendingMateriaIds, setPendingMateriaIds] = useState<string[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  const [showMissingSubject, setShowMissingSubject] = useState(false);
  const [missingSubjectName, setMissingSubjectName] = useState('');

  const universityMatches = useMemo(
    () => findUniversityMatches(universidadSearch, universidades, { limit: 3, minScore: 0.7 }),
    [universidadSearch, universidades]
  );

  const universityChoices = useMemo(() => {
    if (universidadSearch.trim().length >= 2) return universityMatches.map((match) => match.university);
    return universidades.slice(0, 8);
  }, [universidadSearch, universityMatches, universidades]);

  const careerMatches = useMemo(
    () => findCareerMatches(carreraSearch, carreras, { limit: 3, minScore: 0.66 }),
    [carreraSearch, carreras]
  );

  const careerChoices = useMemo(() => {
    if (carreraSearch.trim().length >= 3) return careerMatches.map((match) => match.career);
    return carreras.slice(0, 8);
  }, [carreraSearch, careerMatches, carreras]);

  useEffect(() => {
    if (!isOpen || initialized) return;
    let active = true;

    void (async () => {
      try {
        const persisted = readState(userId);
        const [profileResult, universityResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('universidad_id, carrera_id, active_subjects')
            .eq('id', userId)
            .maybeSingle(),
          supabase.from('universidades').select('id, nombre, approval_status').order('nombre'),
        ]);

        if (!active) return;
        if (profileResult.error) throw profileResult.error;
        if (universityResult.error) throw universityResult.error;

        const availableUniversities = (universityResult.data ?? []) as Universidad[];
        setUniversidades(availableUniversities);
        const profile = profileResult.data;
        const dbUniversidadId = String(profile?.universidad_id ?? '').trim();
        const dbCarreraId = String(profile?.carrera_id ?? '').trim();
        const dbMateriaIds = getAcademicProfileActiveSubjectIds(profile?.active_subjects);

        const effectiveUniversidadId = dbUniversidadId || persisted?.universidadId || '';
        const effectiveCarreraId = dbCarreraId || persisted?.carreraId || '';
        const effectiveMateriaIds = dbMateriaIds.length ? dbMateriaIds : persisted?.selectedMateriaIds ?? [];

        if (effectiveUniversidadId) {
          const uni = availableUniversities.find((item) => item.id === effectiveUniversidadId);
          setUniversidadId(effectiveUniversidadId);
          setUniversidadNombre(uni?.nombre ?? persisted?.universidadNombre ?? '');
          setUniversidadSearch(uni?.nombre ?? persisted?.universidadNombre ?? '');
          setPendingUniversity(
            uni?.approval_status === 'pending' || Boolean(persisted?.pendingUniversity)
          );
        } else {
          setPendingUniversity(Boolean(persisted?.pendingUniversity));
        }

        if (effectiveCarreraId) {
          const { data: career } = await supabase
            .from('carreras')
            .select('id, nombre, universidad_id, approval_status')
            .eq('id', effectiveCarreraId)
            .maybeSingle();
          if (!active) return;
          if (career) {
            setCarreraId(career.id);
            setCarreraNombre(career.nombre);
            setCarreraSearch(career.nombre);
            setPendingCareer(career.approval_status === 'pending');
          } else if (persisted?.carreraNombre) {
            setCarreraId(effectiveCarreraId);
            setCarreraNombre(persisted.carreraNombre);
            setCarreraSearch(persisted.carreraNombre);
            setPendingCareer(Boolean(persisted.pendingCareer));
          }
        } else {
          setPendingCareer(Boolean(persisted?.pendingCareer));
        }

        setSelectedMateriaIds(effectiveMateriaIds);
        setPendingMateriaIds(persisted?.pendingMateriaIds ?? []);

        if (persisted?.step && persisted.step >= 1 && persisted.step <= TOTAL_STEPS) {
          setStep(persisted.step);
        } else if (effectiveUniversidadId && effectiveCarreraId) {
          setStep(3);
        } else if (effectiveUniversidadId) {
          setStep(2);
        }
      } catch {
        toast({
          variant: 'destructive',
          title: 'No pudimos preparar el onboarding',
          description: 'Podés volver a intentarlo sin perder tu cuenta.',
        });
      } finally {
        if (active) setInitialized(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [initialized, isOpen, toast, userId]);

  useEffect(() => {
    if (!initialized) return;
    writeState(userId, {
      step,
      universidadId,
      universidadNombre,
      carreraId,
      carreraNombre,
      selectedMateriaIds,
      pendingUniversity,
      pendingCareer,
      pendingMateriaIds,
    });
  }, [
    carreraId,
    carreraNombre,
    initialized,
    pendingCareer,
    pendingMateriaIds,
    pendingUniversity,
    selectedMateriaIds,
    step,
    universidadId,
    universidadNombre,
    userId,
  ]);

  useEffect(() => {
    if (!initialized || !universidadId || step !== 2) return;
    let active = true;
    setLoadingCarreras(true);

    void (async () => {
      try {
        const { data, error } = await supabase
          .from('carreras')
          .select('id, nombre, universidad_id')
          .eq('universidad_id', universidadId)
          .order('nombre');

        if (!active) return;
        if (error) {
          toast({ variant: 'destructive', title: 'No pudimos cargar las carreras' });
          return;
        }
        setCarreras(data ?? []);
      } finally {
        if (active) setLoadingCarreras(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [initialized, step, toast, universidadId]);

  useEffect(() => {
    if (!initialized || !carreraId || step !== 3) return;
    let active = true;
    setLoadingMaterias(true);

    void getMateriasByCarrera(carreraId)
      .then((rows) => {
        if (!active) return;
        setMaterias(rows.map((row) => ({ id: row.id, nombre: row.nombre })));
      })
      .catch(() => {
        if (active) toast({ variant: 'destructive', title: 'No pudimos cargar las materias' });
      })
      .finally(() => active && setLoadingMaterias(false));

    return () => {
      active = false;
    };
  }, [carreraId, initialized, step, toast]);

  const resetAcademicSelection = useCallback(() => {
    setCarreraId('');
    setCarreraNombre('');
    setCarreraSearch('');
    setPendingCareer(false);
    setMaterias([]);
    setSelectedMateriaIds([]);
    setPendingMateriaIds([]);
    setShowMissingCareer(false);
  }, []);

  const selectUniversity = useCallback(
    (uni: Universidad) => {
      setUniversidadId(uni.id);
      setUniversidadNombre(uni.nombre);
      setUniversidadSearch(uni.nombre);
      setPendingUniversity(uni.approval_status === 'pending');
      setShowMissingUniversity(false);
      resetAcademicSelection();
      window.setTimeout(() => setStep(2), 140);
    },
    [resetAcademicSelection]
  );

  const addMissingUniversity = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await createPrivatePendingUniversityAction({
        universidadNombre: missingUniversityName || universidadSearch,
        ciudad: missingUniversityCity,
      });
      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'No pudimos agregar la universidad',
          description: result.message,
        });
        return;
      }

      const university: Universidad = {
        id: result.universidad.id,
        nombre: result.universidad.nombre,
        approval_status: result.universidad.approval_status,
      };
      setUniversidades((prev) => [
        university,
        ...prev.filter((item) => item.id !== university.id),
      ]);
      setUniversidadId(university.id);
      setUniversidadNombre(university.nombre);
      setUniversidadSearch(university.nombre);
      setPendingUniversity(university.approval_status === 'pending');
      setShowMissingUniversity(false);
      resetAcademicSelection();
      setStep(2);
    } finally {
      setBusy(false);
    }
  };

  const selectCareer = useCallback((career: Carrera) => {
    setCarreraId(career.id);
    setCarreraNombre(career.nombre);
    setCarreraSearch(career.nombre);
    setPendingCareer(false);
    setMaterias([]);
    setSelectedMateriaIds([]);
    setPendingMateriaIds([]);
    setShowMissingCareer(false);
    window.setTimeout(() => setStep(3), 140);
  }, []);

  const addMissingCareer = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await createPrivatePendingCareerAction({
        universidadId,
        facultadNombre: missingFacultyName,
        carreraNombre: missingCareerName || carreraSearch,
      });
      if (!result.success) {
        toast({ variant: 'destructive', title: 'No pudimos agregar la carrera', description: result.message });
        return;
      }

      setCarreraId(result.carrera.id);
      setCarreraNombre(result.carrera.nombre);
      setCarreraSearch(result.carrera.nombre);
      setPendingCareer(result.carrera.approval_status === 'pending');
      setCarreras((prev) => [
        { id: result.carrera.id, nombre: result.carrera.nombre, universidad_id: result.carrera.universidad_id },
        ...prev.filter((item) => item.id !== result.carrera.id),
      ]);
      setSelectedMateriaIds([]);
      setPendingMateriaIds([]);
      setMaterias([]);
      setShowMissingCareer(false);
      setStep(3);
    } finally {
      setBusy(false);
    }
  };

  const toggleSubject = (id: string) => {
    setSelectedMateriaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const addMissingSubject = async () => {
    if (busy || !carreraId) return;
    setBusy(true);
    try {
      const result = await createPrivatePendingSubjectAction({
        carreraId,
        materiaNombre: missingSubjectName,
      });
      if (!result.success) {
        toast({ variant: 'destructive', title: 'No pudimos agregar la materia', description: result.message });
        return;
      }

      setMaterias((prev) => [
        ...prev.filter((item) => item.id !== result.materia.id),
        { id: result.materia.id, nombre: result.materia.nombre },
      ].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
      setSelectedMateriaIds((prev) =>
        prev.includes(result.materia.id) ? prev : [...prev, result.materia.id]
      );
      if (result.materia.approval_status === 'pending') {
        setPendingMateriaIds((prev) =>
          prev.includes(result.materia.id) ? prev : [...prev, result.materia.id]
        );
      }
      setMissingSubjectName('');
      setShowMissingSubject(false);
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async () => {
    if (!universidadId || !carreraId || selectedMateriaIds.length === 0 || busy) return;
    setBusy(true);
    try {
      const result = await updateProfile(userId, {
        universidad_id: universidadId,
        carrera_id: carreraId,
        materia_ids: selectedMateriaIds,
      });
      if (!result.success) {
        toast({ variant: 'destructive', title: 'No pudimos guardar tu perfil', description: result.message });
        return;
      }
      clearState(userId);
      setStep(4);
    } finally {
      setBusy(false);
    }
  };

  const hasPending =
    pendingUniversity || pendingCareer || selectedMateriaIds.some((id) => pendingMateriaIds.includes(id));
  const hasMissingCatalog = pendingUniversity || pendingCareer;

  if (!initialized) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <DialogContent className="border-none bg-white p-0 sm:max-w-[560px]" overlayClassName="bg-white/20 backdrop-blur-[10px]">
          <div className="flex flex-col items-center justify-center px-6 py-16">
            <Spinner size="lg" />
            <p className="mt-4 text-sm font-medium text-slate-500">Preparando tu experiencia...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && allowSkip && onClose?.()}>
      <DialogContent
        overlayClassName="bg-white/20 backdrop-blur-[10px]"
        className={`max-h-[calc(100svh-1rem)] overflow-hidden border-none bg-white p-0 shadow-[0_30px_100px_rgba(15,23,42,0.20)] sm:max-w-[600px] ${allowSkip ? '' : '[&>button]:hidden'}`}
      >
        <div className="px-5 pt-5 sm:px-8 sm:pt-6">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
            <span>Paso {step} de {TOTAL_STEPS}</span>
            {hasPending ? (
              <span className="inline-flex items-center gap-1 text-indigo-600"><LockKeyhole className="h-3 w-3" /> Privado</span>
            ) : null}
          </div>
          <div className="mt-2 flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <div key={index} className={`h-1 flex-1 rounded-full ${index < step ? 'bg-indigo-600' : 'bg-slate-100'}`} />
            ))}
          </div>
        </div>

        {step === 1 ? (
          <div className="px-5 py-5 sm:px-8 sm:py-6">
            <DialogHeader className="text-left">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><School className="h-5 w-5" /></span>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-[-0.04em] text-slate-950">¿Dónde estudiás?</DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">Buscá tu universidad. También reconocemos siglas y nombres parecidos.</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {!showMissingUniversity ? (
              <>
                <div className="mt-5">
                  <Label htmlFor="onboarding-university">Universidad</Label>
                  <Input
                    id="onboarding-university"
                    className="mt-2 h-11"
                    value={universidadSearch}
                    onChange={(e) => setUniversidadSearch(e.target.value)}
                    placeholder="Ej. Universidad de Buenos Aires"
                  />

                  {universidadSearch.trim().length >= 2 ? (
                    universityChoices.length ? (
                      <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">¿Buscabas alguna de estas?</p>
                        <div className="mt-2 space-y-2">
                          {universityChoices.map((uni) => (
                            <button
                              key={uni.id}
                              type="button"
                              onClick={() => selectUniversity(uni)}
                              className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-300"
                            >
                              <span className="min-w-0 text-sm font-bold text-slate-950">{uni.nombre}</span>
                              <span className="shrink-0 text-xs font-bold text-indigo-600">Usar esta universidad</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-500">No encontramos una universidad suficientemente parecida.</p>
                    )
                  ) : (
                    <div className="mt-2 max-h-40 overflow-y-auto border-y border-slate-200">
                      {universityChoices.map((uni) => (
                        <button key={uni.id} type="button" onClick={() => selectUniversity(uni)} className="flex w-full items-center justify-between border-b border-slate-100 px-2 py-2.5 text-left text-sm font-medium text-slate-700 last:border-0 hover:text-indigo-700">
                          {uni.nombre}<ArrowRight className="h-4 w-4 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={universidadSearch.trim().length < 3}
                  onClick={() => {
                    setMissingUniversityName(universidadSearch);
                    setMissingUniversityCity('');
                    setShowMissingUniversity(true);
                  }}
                  className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Mi universidad no aparece
                </button>
              </>
            ) : (
              <div className="mt-5 space-y-4 border-y border-slate-200 py-5">
                <div>
                  <Label htmlFor="missing-university">Nombre de tu universidad</Label>
                  <Input
                    id="missing-university"
                    className="mt-2 h-11"
                    value={missingUniversityName}
                    onChange={(e) => setMissingUniversityName(e.target.value)}
                    placeholder="Ej. Universidad Nacional del Delta"
                  />
                </div>
                <div>
                  <Label htmlFor="missing-university-city">Ciudad <span className="font-normal text-slate-400">(opcional)</span></Label>
                  <Input
                    id="missing-university-city"
                    className="mt-2 h-11"
                    value={missingUniversityCity}
                    onChange={(e) => setMissingUniversityCity(e.target.value)}
                    placeholder="Ej. Buenos Aires"
                  />
                </div>
                <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <p>La universidad queda visible sólo para vos hasta que Evaluo la revise. Podés seguir con tu carrera ahora.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={() => setShowMissingUniversity(false)}>Cancelar</Button>
                  <Button type="button" disabled={busy || missingUniversityName.trim().length < 3} onClick={() => void addMissingUniversity()} className="bg-indigo-600 hover:bg-indigo-700">
                    {busy ? 'Guardando...' : 'Continuar'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="px-5 py-5 sm:px-8 sm:py-6">
            <DialogHeader className="text-left">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><GraduationCap className="h-5 w-5" /></span>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-[-0.04em] text-slate-950">¿Qué carrera estudiás?</DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">{universidadNombre}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {!showMissingCareer ? (
              <>
                <div className="mt-5">
                  <Label htmlFor="onboarding-career">Carrera</Label>
                  <Input id="onboarding-career" className="mt-2 h-11" value={carreraSearch} onChange={(e) => setCarreraSearch(e.target.value)} placeholder="Ej. Martillero" />

                  {loadingCarreras ? (
                    <div className="flex justify-center py-6"><Spinner size="sm" /></div>
                  ) : carreraSearch.trim().length >= 3 ? (
                    careerChoices.length ? (
                      <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-600">¿Buscabas alguna de estas?</p>
                        <div className="mt-2 space-y-2">
                          {careerChoices.map((career) => (
                            <button
                              key={career.id}
                              type="button"
                              onClick={() => selectCareer(career)}
                              className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-300"
                            >
                              <span className="min-w-0 text-sm font-bold text-slate-950">{career.nombre}</span>
                              <span className="shrink-0 text-xs font-bold text-indigo-600">Usar esta carrera</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-500">No encontramos una carrera suficientemente parecida.</p>
                    )
                  ) : (
                    <div className="mt-2 max-h-40 overflow-y-auto border-y border-slate-200">
                      {careerChoices.map((career) => (
                        <button key={career.id} type="button" onClick={() => selectCareer(career)} className="flex w-full items-center justify-between border-b border-slate-100 px-2 py-2.5 text-left text-sm font-medium text-slate-700 last:border-0 hover:text-indigo-700">
                          {career.nombre}<ArrowRight className="h-4 w-4 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={carreraSearch.trim().length < 3}
                  onClick={() => {
                    setMissingCareerName(carreraSearch);
                    setShowMissingCareer(true);
                  }}
                  className="mt-3 flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  No es ninguna de estas · Solicitar nueva carrera
                </button>
              </>
            ) : (
              <div className="mt-5 space-y-4 border-y border-slate-200 py-5">
                <div>
                  <Label htmlFor="missing-career">Nombre de tu carrera</Label>
                  <Input id="missing-career" className="mt-2 h-11" value={missingCareerName} onChange={(e) => setMissingCareerName(e.target.value)} placeholder="Ej. Licenciatura en Psicología" />
                </div>
                <div>
                  <Label htmlFor="missing-faculty">Facultad o unidad académica <span className="font-normal text-slate-400">(opcional)</span></Label>
                  <Input id="missing-faculty" className="mt-2 h-11" value={missingFacultyName} onChange={(e) => setMissingFacultyName(e.target.value)} placeholder="Ej. Facultad de Psicología" />
                </div>
                <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <p>La carrera queda asignada sólo a tu perfil. No aparecerá para otros estudiantes hasta que Evaluo la revise y apruebe.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={() => setShowMissingCareer(false)}>Cancelar</Button>
                  <Button type="button" disabled={busy || missingCareerName.trim().length < 3} onClick={() => void addMissingCareer()} className="bg-indigo-600 hover:bg-indigo-700">
                    {busy ? 'Guardando...' : 'Enviar solicitud y seguir'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="px-5 py-5 sm:px-8 sm:py-6">
            <DialogHeader className="text-left">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><Sparkles className="h-5 w-5" /></span>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-[-0.04em] text-slate-950">¿Qué materias cursás?</DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">Seleccioná al menos una. Si falta una materia, también podés agregarla para tu uso privado.</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {pendingUniversity || pendingCareer ? (
              <div className="mt-4 flex items-start gap-2 border-y border-indigo-100 bg-indigo-50/60 px-1 py-3 text-xs leading-5 text-indigo-800">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
                <p>Tu universidad o carrera está pendiente de aprobación. Sólo vos podés verla y cualquier PDF asociado quedará privado mientras tanto.</p>
              </div>
            ) : null}

            <div className="mt-4 max-h-48 overflow-y-auto border-y border-slate-200">
              {loadingMaterias ? (
                <div className="flex justify-center py-8"><Spinner size="sm" /></div>
              ) : materias.length ? (
                materias.map((materia) => {
                  const selected = selectedMateriaIds.includes(materia.id);
                  const pending = pendingMateriaIds.includes(materia.id);
                  return (
                    <button key={materia.id} type="button" onClick={() => toggleSubject(materia.id)} className="flex w-full items-center gap-3 border-b border-slate-100 px-2 py-2.5 text-left last:border-0">
                      <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>{selected ? <Check className="h-3 w-3" /> : null}</span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{materia.nombre}</span>
                      {pending ? <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-indigo-600">Privada</span> : null}
                    </button>
                  );
                })
              ) : (
                <p className="py-6 text-center text-sm text-slate-500">Todavía no tenemos materias cargadas para esta carrera.</p>
              )}
            </div>

            {!showMissingSubject ? (
              <button type="button" onClick={() => setShowMissingSubject(true)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700"><Plus className="h-4 w-4" /> Agregar una materia que falta</button>
            ) : (
              <div className="mt-3 border-y border-slate-200 py-3">
                <Label htmlFor="missing-subject">Nombre de la materia</Label>
                <div className="mt-2 flex gap-2">
                  <Input id="missing-subject" className="h-11" value={missingSubjectName} onChange={(e) => setMissingSubjectName(e.target.value)} placeholder="Ej. Biología" />
                  <Button type="button" disabled={busy || missingSubjectName.trim().length < 2} onClick={() => void addMissingSubject()} className="bg-indigo-600 hover:bg-indigo-700">{busy ? <Spinner size="sm" /> : 'Agregar'}</Button>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">Quedará visible sólo para vos hasta que sea aprobada.</p>
              </div>
            )}
          </div>
        ) : null}

        {step === 4 ? (
          hasMissingCatalog ? (
            <div className="px-5 py-6 sm:px-8 sm:py-7">
              <div className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Check className="h-6 w-6" /></span>
                <DialogTitle className="mt-4 text-2xl font-bold tracking-[-0.04em] text-slate-950">Empezá con tu primer material</DialogTitle>
                <DialogDescription className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Tu solicitud quedó registrada. Podés subir un PDF propio o ver un ejemplo para conocer cómo lo transforma Evaluo.</DialogDescription>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
                <a
                  href="/dashboard/materiales/subir?source=onboarding_missing_catalog"
                  className="group relative rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 p-5 text-left shadow-[0_10px_28px_rgba(79,70,229,0.08)] transition hover:border-indigo-300 hover:shadow-[0_14px_32px_rgba(79,70,229,0.12)]"
                >
                  <span className="absolute right-3 top-3 rounded-full border border-indigo-100 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-600">Recomendado</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"><FileUp className="h-5 w-5" /></span>
                  <h2 className="mt-3 text-lg font-bold text-slate-950">Subir mi PDF</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">Usá tu propio material y empezá a prepararlo para estudiar.</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600">Elegir PDF <ArrowRight className="h-4 w-4" /></span>
                </a>

                <a
                  href="/demo/material-estudio?source=onboarding_missing_catalog"
                  className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/20"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600"><FileText className="h-5 w-5" /></span>
                  <h2 className="mt-3 text-base font-bold text-slate-950">Ver un PDF de ejemplo</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">Mirá cómo queda un material dentro de Evaluo.</p>
                </a>
              </div>

              <button type="button" onClick={onComplete} className="mt-4 w-full text-center text-sm font-semibold text-slate-500 transition hover:text-slate-800">Ir al inicio</button>
            </div>
          ) : (
            <div className="px-5 py-9 text-center sm:px-8 sm:py-10">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-7 w-7" /></span>
              <DialogTitle className="mt-5 text-2xl font-bold tracking-[-0.04em] text-slate-950">Tu espacio está listo</DialogTitle>
              <DialogDescription className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{hasPending ? 'Podés empezar a estudiar ahora. Las materias nuevas quedan sólo en tu cuenta hasta que sean aprobadas.' : 'Ya configuramos tu universidad, carrera y materias activas.'}</DialogDescription>
              <Button type="button" onClick={onComplete} className="mt-6 h-11 w-full bg-indigo-600 font-semibold hover:bg-indigo-700">Empezar a estudiar <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          )
        ) : null}

        {step > 1 && step < 4 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 sm:px-8">
            <Button type="button" variant="outline" onClick={() => setStep((current) => Math.max(1, current - 1))}><ArrowLeft className="mr-2 h-4 w-4" /> Atrás</Button>
            {step === 3 ? <Button type="button" disabled={busy || selectedMateriaIds.length === 0} onClick={() => void saveProfile()} className="bg-indigo-600 hover:bg-indigo-700">{busy ? 'Guardando...' : 'Continuar'} <ArrowRight className="ml-2 h-4 w-4" /></Button> : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
