'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, GraduationCap, LockKeyhole, Plus, School, Sparkles } from 'lucide-react';
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
import { getAcademicProfileActiveSubjectIds } from '@/lib/profile-completion';
import { getMateriasByCarrera } from '@/services/api';
import {
  createPrivatePendingCareerAction,
  createPrivatePendingSubjectAction,
} from '@/app/completar-perfil/pending-academic-actions';

type Universidad = { id: string; nombre: string };
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

  const filteredUniversidades = useMemo(() => {
    const needle = universidadSearch.trim().toLocaleLowerCase('es');
    if (!needle) return universidades.slice(0, 12);
    return universidades
      .filter((item) => item.nombre.toLocaleLowerCase('es').includes(needle))
      .slice(0, 12);
  }, [universidadSearch, universidades]);

  const filteredCarreras = useMemo(() => {
    const needle = carreraSearch.trim().toLocaleLowerCase('es');
    if (!needle) return carreras.slice(0, 14);
    return carreras
      .filter((item) => item.nombre.toLocaleLowerCase('es').includes(needle))
      .slice(0, 14);
  }, [carreraSearch, carreras]);

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
          supabase.from('universidades').select('id, nombre').order('nombre'),
        ]);

        if (!active) return;
        if (profileResult.error) throw profileResult.error;
        if (universityResult.error) throw universityResult.error;

        setUniversidades(universityResult.data ?? []);
        const profile = profileResult.data;
        const dbUniversidadId = String(profile?.universidad_id ?? '').trim();
        const dbCarreraId = String(profile?.carrera_id ?? '').trim();
        const dbMateriaIds = getAcademicProfileActiveSubjectIds(profile?.active_subjects);

        const effectiveUniversidadId = dbUniversidadId || persisted?.universidadId || '';
        const effectiveCarreraId = dbCarreraId || persisted?.carreraId || '';
        const effectiveMateriaIds = dbMateriaIds.length ? dbMateriaIds : persisted?.selectedMateriaIds ?? [];

        if (effectiveUniversidadId) {
          const uni = (universityResult.data ?? []).find((item) => item.id === effectiveUniversidadId);
          setUniversidadId(effectiveUniversidadId);
          setUniversidadNombre(uni?.nombre ?? persisted?.universidadNombre ?? '');
          setUniversidadSearch(uni?.nombre ?? persisted?.universidadNombre ?? '');
        }

        if (effectiveCarreraId) {
          const { data: career } = await supabase
            .from('carreras')
            .select('id, nombre, universidad_id')
            .eq('id', effectiveCarreraId)
            .maybeSingle();
          if (!active) return;
          if (career) {
            setCarreraId(career.id);
            setCarreraNombre(career.nombre);
            setCarreraSearch(career.nombre);
          } else if (persisted?.carreraNombre) {
            setCarreraId(effectiveCarreraId);
            setCarreraNombre(persisted.carreraNombre);
            setCarreraSearch(persisted.carreraNombre);
          }
        }

        setSelectedMateriaIds(effectiveMateriaIds);
        setPendingCareer(Boolean(persisted?.pendingCareer));
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
      pendingCareer,
      pendingMateriaIds,
    });
  }, [
    carreraId,
    carreraNombre,
    initialized,
    pendingCareer,
    pendingMateriaIds,
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

  const selectUniversity = useCallback((uni: Universidad) => {
    setUniversidadId(uni.id);
    setUniversidadNombre(uni.nombre);
    setUniversidadSearch(uni.nombre);
    setCarreraId('');
    setCarreraNombre('');
    setCarreraSearch('');
    setPendingCareer(false);
    setMaterias([]);
    setSelectedMateriaIds([]);
    setPendingMateriaIds([]);
    setShowMissingCareer(false);
    window.setTimeout(() => setStep(2), 180);
  }, []);

  const selectCareer = useCallback((career: Carrera) => {
    setCarreraId(career.id);
    setCarreraNombre(career.nombre);
    setCarreraSearch(career.nombre);
    setPendingCareer(false);
    setMaterias([]);
    setSelectedMateriaIds([]);
    setPendingMateriaIds([]);
    setShowMissingCareer(false);
    window.setTimeout(() => setStep(3), 180);
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

  const hasPending = pendingCareer || selectedMateriaIds.some((id) => pendingMateriaIds.includes(id));

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
        className={`overflow-hidden border-none bg-white p-0 shadow-[0_30px_100px_rgba(15,23,42,0.20)] sm:max-w-[600px] ${allowSkip ? '' : '[&>button]:hidden'}`}
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
          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <DialogHeader className="text-left">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><School className="h-5 w-5" /></span>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-[-0.04em] text-slate-950">¿Dónde estudiás?</DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">Elegí tu universidad para adaptar Evaluo a tu contexto académico.</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-6">
              <Label htmlFor="onboarding-university">Universidad</Label>
              <Input id="onboarding-university" className="mt-2 h-11" value={universidadSearch} onChange={(e) => setUniversidadSearch(e.target.value)} placeholder="Ej. Universidad de Buenos Aires" />
              <div className="mt-2 max-h-56 overflow-y-auto border-y border-slate-200">
                {filteredUniversidades.map((uni) => (
                  <button key={uni.id} type="button" onClick={() => selectUniversity(uni)} className="flex w-full items-center justify-between border-b border-slate-100 px-2 py-3 text-left text-sm font-medium text-slate-700 last:border-0 hover:text-indigo-700">
                    {uni.nombre}<ArrowRight className="h-4 w-4 text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <DialogHeader className="text-left">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><GraduationCap className="h-5 w-5" /></span>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-[-0.04em] text-slate-950">¿Qué carrera estudiás?</DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">{universidadNombre}. Si todavía no la tenemos, podés agregarla sin quedar bloqueado.</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {!showMissingCareer ? (
              <>
                <div className="mt-6">
                  <Label htmlFor="onboarding-career">Carrera</Label>
                  <Input id="onboarding-career" className="mt-2 h-11" value={carreraSearch} onChange={(e) => setCarreraSearch(e.target.value)} placeholder="Ej. Ciencias de la Computación" />
                  <div className="mt-2 max-h-52 overflow-y-auto border-y border-slate-200">
                    {loadingCarreras ? <div className="flex justify-center py-6"><Spinner size="sm" /></div> : filteredCarreras.map((career) => (
                      <button key={career.id} type="button" onClick={() => selectCareer(career)} className="flex w-full items-center justify-between border-b border-slate-100 px-2 py-3 text-left text-sm font-medium text-slate-700 last:border-0 hover:text-indigo-700">
                        {career.nombre}<ArrowRight className="h-4 w-4 text-slate-300" />
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => { setMissingCareerName(carreraSearch); setShowMissingCareer(true); }} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">
                  <Plus className="h-4 w-4" /> Mi carrera no aparece
                </button>
              </>
            ) : (
              <div className="mt-6 space-y-4 border-y border-slate-200 py-5">
                <div>
                  <Label htmlFor="missing-faculty">Facultad o unidad académica <span className="font-normal text-slate-400">(opcional)</span></Label>
                  <Input id="missing-faculty" className="mt-2 h-11" value={missingFacultyName} onChange={(e) => setMissingFacultyName(e.target.value)} placeholder="Ej. Facultad de Ciencias Exactas y Naturales" />
                </div>
                <div>
                  <Label htmlFor="missing-career">Nombre de tu carrera</Label>
                  <Input id="missing-career" className="mt-2 h-11" value={missingCareerName} onChange={(e) => setMissingCareerName(e.target.value)} placeholder="Ej. Licenciatura en Ciencias de la Computación" />
                </div>
                <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <p>La carrera queda asignada sólo a tu perfil. No aparecerá para otros estudiantes hasta que Evaluo la revise y apruebe.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={() => setShowMissingCareer(false)}>Cancelar</Button>
                  <Button type="button" disabled={busy || (missingCareerName || carreraSearch).trim().length < 3} onClick={() => void addMissingCareer()} className="bg-indigo-600 hover:bg-indigo-700">{busy ? 'Guardando...' : 'Usar esta carrera'}</Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <DialogHeader className="text-left">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><Sparkles className="h-5 w-5" /></span>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-[-0.04em] text-slate-950">¿Qué materias cursás?</DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-6 text-slate-500">Seleccioná al menos una. Si falta una materia, también podés agregarla para tu uso privado.</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {pendingCareer ? (
              <div className="mt-5 flex items-start gap-2 border-y border-indigo-100 bg-indigo-50/60 px-1 py-3 text-xs leading-5 text-indigo-800">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
                <p><strong>{carreraNombre}</strong> está pendiente de aprobación. Sólo vos podés verla y cualquier PDF asociado quedará privado mientras tanto.</p>
              </div>
            ) : null}

            <div className="mt-5 max-h-56 overflow-y-auto border-y border-slate-200">
              {loadingMaterias ? (
                <div className="flex justify-center py-8"><Spinner size="sm" /></div>
              ) : materias.length ? (
                materias.map((materia) => {
                  const selected = selectedMateriaIds.includes(materia.id);
                  const pending = pendingMateriaIds.includes(materia.id);
                  return (
                    <button key={materia.id} type="button" onClick={() => toggleSubject(materia.id)} className="flex w-full items-center gap-3 border-b border-slate-100 px-2 py-3 text-left last:border-0">
                      <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>{selected ? <Check className="h-3 w-3" /> : null}</span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{materia.nombre}</span>
                      {pending ? <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-indigo-600">Privada</span> : null}
                    </button>
                  );
                })
              ) : (
                <p className="py-7 text-center text-sm text-slate-500">Todavía no tenemos materias cargadas para esta carrera.</p>
              )}
            </div>

            {!showMissingSubject ? (
              <button type="button" onClick={() => setShowMissingSubject(true)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700"><Plus className="h-4 w-4" /> Agregar una materia que falta</button>
            ) : (
              <div className="mt-4 border-y border-slate-200 py-4">
                <Label htmlFor="missing-subject">Nombre de la materia</Label>
                <div className="mt-2 flex gap-2">
                  <Input id="missing-subject" className="h-11" value={missingSubjectName} onChange={(e) => setMissingSubjectName(e.target.value)} placeholder="Ej. Álgebra I" />
                  <Button type="button" disabled={busy || missingSubjectName.trim().length < 2} onClick={() => void addMissingSubject()} className="bg-indigo-600 hover:bg-indigo-700">{busy ? <Spinner size="sm" /> : 'Agregar'}</Button>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">Quedará visible sólo para vos hasta que sea aprobada.</p>
              </div>
            )}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="px-5 py-9 text-center sm:px-8 sm:py-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-7 w-7" /></span>
            <DialogTitle className="mt-5 text-2xl font-bold tracking-[-0.04em] text-slate-950">Tu espacio está listo</DialogTitle>
            <DialogDescription className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{hasPending ? 'Podés empezar a estudiar ahora. Las carreras o materias nuevas quedan sólo en tu cuenta hasta que sean aprobadas.' : 'Ya configuramos tu universidad, carrera y materias activas.'}</DialogDescription>
            <Button type="button" onClick={onComplete} className="mt-6 h-11 w-full bg-indigo-600 font-semibold hover:bg-indigo-700">Empezar a estudiar <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        ) : null}

        {step > 1 && step < 4 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-8">
            <Button type="button" variant="outline" onClick={() => setStep((current) => Math.max(1, current - 1))}><ArrowLeft className="mr-2 h-4 w-4" /> Atrás</Button>
            {step === 3 ? <Button type="button" disabled={busy || selectedMateriaIds.length === 0} onClick={() => void saveProfile()} className="bg-indigo-600 hover:bg-indigo-700">{busy ? 'Guardando...' : 'Continuar'} <ArrowRight className="ml-2 h-4 w-4" /></Button> : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
