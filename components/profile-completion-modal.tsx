'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { updateProfile } from '@/app/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  School,
  Search,
} from 'lucide-react';
import { logError } from '@/lib/observability';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';

interface Universidad {
  id: string;
  nombre: string;
}

interface Carrera {
  id: string;
  nombre: string;
  universidad_id: string | null;
}

interface ProfileModalProps {
  userId: string;
  isOpen: boolean;
  onComplete: () => void;
  onClose?: () => void;
  allowSkip?: boolean;
}

export function ProfileCompletionModal({
  userId,
  isOpen,
  onComplete,
  onClose,
  allowSkip = true,
}: ProfileModalProps) {
  const [universidadId, setUniversidadId] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [universidadSearch, setUniversidadSearch] = useState('');
  const [carreraSearch, setCarreraSearch] = useState('');
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [hasLoadedUniversidades, setHasLoadedUniversidades] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUniversidades, setLoadingUniversidades] = useState(false);
  const [loadingCarreras, setLoadingCarreras] = useState(false);
  const [hydratingProfile, setHydratingProfile] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function hydrateProfileSelection() {
      if (!isOpen) return;

      setHydratingProfile(true);

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('universidad_id, carrera_id')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!active || !profile) return;

        const currentUniversidadId = String(profile.universidad_id ?? '').trim();
        const currentCarreraId = String(profile.carrera_id ?? '').trim();

        if (currentUniversidadId) {
          setUniversidadId(currentUniversidadId);

          const { data: selectedUniversity } = await supabase
            .from('universidades')
            .select('id, nombre')
            .eq('id', currentUniversidadId)
            .maybeSingle();

          if (selectedUniversity && active) {
            setUniversidadSearch(selectedUniversity.nombre);
            setUniversidades((currentUniversities) => {
              const remaining = currentUniversities.filter(
                (universidad) => universidad.id !== selectedUniversity.id
              );
              return [selectedUniversity, ...remaining].slice(0, 12);
            });
          }

          const { data: currentCarreras, error: carrerasError } = await supabase
            .from('carreras')
            .select('id, nombre, universidad_id')
            .eq('universidad_id', currentUniversidadId)
            .order('nombre')
            .limit(14);

          if (carrerasError) throw carrerasError;
          if (active) {
            setCarreras(currentCarreras ?? []);
          }
        }

        if (currentCarreraId) {
          setCarreraId(currentCarreraId);

          const { data: selectedCareer } = await supabase
            .from('carreras')
            .select('id, nombre, universidad_id')
            .eq('id', currentCarreraId)
            .maybeSingle();

          if (selectedCareer && active) {
            setCarreraSearch(selectedCareer.nombre);
            setCarreras((currentCareers) => {
              const remaining = currentCareers.filter((carrera) => carrera.id !== selectedCareer.id);
              return [selectedCareer, ...remaining].slice(0, 14);
            });
          }
        }
      } catch (error) {
        logError('profileCompletionModal.hydrateSelection', error, { userId });
      } finally {
        if (active) {
          setHydratingProfile(false);
        }
      }
    }

    void hydrateProfileSelection();

    return () => {
      active = false;
    };
  }, [isOpen, userId]);

  useEffect(() => {
    let active = true;

    async function fetchUniversidades() {
      if (!isOpen) return;

      if (!hydratingProfile) {
        setLoadingUniversidades(true);
      }

      try {
        let query = supabase.from('universidades').select('id, nombre').order('nombre').limit(12);
        const normalizedSearch = universidadSearch.trim();

        if (normalizedSearch.length >= 2) {
          query = query.ilike('nombre', `%${normalizedSearch}%`);
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
        if (active) {
          setLoadingUniversidades(false);
        }
      }
    }

    void fetchUniversidades();

    return () => {
      active = false;
    };
  }, [hydratingProfile, isOpen, universidadSearch]);

  useEffect(() => {
    let active = true;

    async function fetchCarreras() {
      if (!isOpen || !universidadId) {
        setCarreras([]);
        setLoadingCarreras(false);
        return;
      }

      if (!hydratingProfile) {
        setLoadingCarreras(true);
      }

      try {
        let query = supabase
          .from('carreras')
          .select('id, nombre, universidad_id')
          .eq('universidad_id', universidadId)
          .order('nombre')
          .limit(14);

        const normalizedSearch = carreraSearch.trim();
        if (normalizedSearch.length >= 2) {
          query = query.ilike('nombre', `%${normalizedSearch}%`);
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
        if (active) {
          setLoadingCarreras(false);
        }
      }
    }

    void fetchCarreras();

    return () => {
      active = false;
    };
  }, [carreraSearch, hydratingProfile, isOpen, universidadId]);

  const universidadSeleccionada = useMemo(
    () => universidades.find((universidad) => universidad.id === universidadId) ?? null,
    [universidadId, universidades]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!universidadId || !carreraId) return;

    setLoading(true);
    try {
      const result = await updateProfile(userId, {
        universidad_id: universidadId,
        carrera_id: carreraId,
      });

      if (!result.success) {
        throw new Error('Error al actualizar el perfil');
      }

      toast({
        title: 'Perfil actualizado',
        description: 'Ya podemos personalizar mejor tu experiencia en Evaluo.',
      });

      router.refresh();
      onComplete();
    } catch (error) {
      logError('profileCompletionModal.saveProfile', error, {
        userId,
        universidadId,
        carreraId,
      });
      toast({
        title: 'Error',
        description: 'No pudimos guardar tus datos. Por favor intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = universidadId !== '' && carreraId !== '';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose?.();
        }
      }}
    >
      <DialogContent
        overlayClassName="bg-white/18 backdrop-blur-[10px]"
        className={`overflow-hidden border-none bg-white/98 p-0 shadow-[0_34px_120px_rgba(15,23,42,0.22)] backdrop-blur-md sm:max-w-[780px] ${
          allowSkip ? '' : '[&>button]:hidden'
        }`}
      >
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.14),transparent_22%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-5 sm:px-8 sm:py-7">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]">
                <GraduationCap className="h-7 w-7" />
              </div>

              <div className="min-w-0">
                <DialogTitle className="text-[1.95rem] font-bold tracking-[-0.05em] text-slate-950 sm:text-[2.25rem]">
                  Contanos dónde estudias
                </DialogTitle>
                <DialogDescription className="mt-2 max-w-[560px] text-sm leading-6 text-slate-600 sm:text-[15px]">
                  Necesitamos estos datos para mostrarte solo el contenido correcto desde el primer ingreso: materias, resúmenes y simuladores acordes a tu universidad y tu carrera.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-5 py-5 sm:px-8 sm:py-7">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="universidad-search" className="font-medium text-slate-700">
                Tu universidad
              </Label>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="universidad-search"
                  placeholder="Busca tu universidad"
                  className="h-11 rounded-2xl border-slate-200 bg-white pl-10 focus:border-[#2563EB] focus:ring-[#2563EB]"
                  value={universidadSearch}
                  onChange={(e) => setUniversidadSearch(e.target.value)}
                />
              </div>

              <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                {loadingUniversidades ? (
                  <div className="flex items-center justify-center p-3">
                    <Spinner size="sm" />
                  </div>
                ) : universidades.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-slate-500">
                    {hasLoadedUniversidades
                      ? 'No encontramos esa universidad.'
                      : 'Escribe al menos 2 letras para buscar tu universidad.'}
                  </div>
                ) : (
                  universidades.map((universidad) => (
                    <button
                      key={universidad.id}
                      type="button"
                      onClick={() => {
                        setUniversidadId(universidad.id);
                        setUniversidadSearch(universidad.nombre);
                        setCarreraId('');
                        setCarreraSearch('');
                      }}
                      className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition hover:bg-indigo-50 ${
                        universidadId === universidad.id
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-700'
                      }`}
                    >
                      <span>{universidad.nombre}</span>
                      {universidadId === universidad.id ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Seleccionada
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>

              {allowSkip ? (
                <p className="text-xs text-slate-500">
                  Puedes omitir este paso por ahora y completarlo luego.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrera" className="font-medium text-slate-700">
                Tu carrera
              </Label>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="carrera"
                  placeholder={
                    universidadSeleccionada
                      ? `Busca tu carrera en ${universidadSeleccionada.nombre}`
                      : 'Primero selecciona tu universidad'
                  }
                  className="h-11 rounded-2xl border-slate-200 bg-white pl-10 focus:border-[#2563EB] focus:ring-[#2563EB]"
                  value={carreraSearch}
                  onChange={(e) => setCarreraSearch(e.target.value)}
                  disabled={!universidadId}
                />
              </div>

              <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                {loadingCarreras ? (
                  <div className="flex items-center justify-center p-3">
                    <Spinner size="sm" />
                  </div>
                ) : !universidadId ? (
                  <div className="px-3 py-3 text-sm text-slate-500">
                    Elige tu universidad para ver solo las carreras correctas.
                  </div>
                ) : carreras.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-slate-500">
                    No encontramos esa carrera dentro de la universidad seleccionada.
                  </div>
                ) : (
                  carreras.map((carrera) => (
                    <button
                      key={carrera.id}
                      type="button"
                      onClick={() => {
                        setCarreraId(carrera.id);
                        setCarreraSearch(carrera.nombre);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition hover:bg-indigo-50 ${
                        carreraId === carrera.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                      }`}
                    >
                      <span>{carrera.nombre}</span>
                      {carreraId === carrera.id ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Seleccionada
                        </span>
                      ) : null}
                    </button>
                  ))
                )}
              </div>

              {universidadSeleccionada ? (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <School className="h-4 w-4 text-[#2563EB]" />
                  {universidadSeleccionada.nombre}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="h-11 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] hover:opacity-95"
            >
              <span className="inline-flex items-center gap-2">
                {loading ? 'Guardando...' : 'Guardar y continuar'}
                {loading ? null : <ArrowRight className="h-4 w-4" />}
              </span>
            </Button>

            {allowSkip ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose?.()}
                className="h-11 rounded-2xl border-slate-200 bg-white text-sm font-semibold text-slate-700"
              >
                Ahora no
              </Button>
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
