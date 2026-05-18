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
import { GraduationCap, School, Search } from 'lucide-react';
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
}

export function ProfileCompletionModal({
  userId,
  isOpen,
  onComplete,
  onClose,
}: ProfileModalProps) {
  const [universidadId, setUniversidadId] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [universidadSearch, setUniversidadSearch] = useState('');
  const [carreraSearch, setCarreraSearch] = useState('');
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchAcademicData() {
      try {
        const [
          { data: universidadesData, error: universidadesError },
          { data: carrerasData, error: carrerasError },
        ] = await Promise.all([
          supabase.from('universidades').select('id, nombre').order('nombre'),
          supabase.from('carreras').select('id, nombre, universidad_id').order('nombre'),
        ]);

        if (universidadesError) throw universidadesError;
        if (carrerasError) throw carrerasError;

        setUniversidades(universidadesData || []);
        setCarreras(carrerasData || []);
      } catch (err) {
        console.error('Error fetching academic data:', err);
      } finally {
        setLoadingData(false);
      }
    }

    if (isOpen) {
      void fetchAcademicData();
    }
  }, [isOpen]);

  const filteredUniversidades = useMemo(() => {
    const query = universidadSearch.trim().toLowerCase();
    if (!query) return universidades;
    return universidades.filter((universidad) =>
      universidad.nombre.toLowerCase().includes(query)
    );
  }, [universidadSearch, universidades]);

  const carrerasDisponibles = useMemo(() => {
    if (!universidadId) return [];
    return carreras.filter((carrera) => carrera.universidad_id === universidadId);
  }, [carreras, universidadId]);

  const carrerasFiltradas = useMemo(() => {
    const query = carreraSearch.trim().toLowerCase();
    if (!query) return carrerasDisponibles;
    return carrerasDisponibles.filter((carrera) =>
      carrera.nombre.toLowerCase().includes(query)
    );
  }, [carreraSearch, carrerasDisponibles]);

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
      console.error('Error saving profile:', error);
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
      <DialogContent className="border-none bg-white/95 shadow-2xl backdrop-blur-md sm:max-w-[480px]">
        <DialogHeader className="space-y-3">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-slate-900">
            Contanos dónde estudias
          </DialogTitle>
          <DialogDescription className="text-center text-base text-slate-600">
            Danos esta información breve para personalizar mejor tu experiencia dentro de la
            plataforma.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="universidad-search" className="font-medium text-slate-700">
              Tu universidad
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="universidad-search"
                placeholder="Buscá tu universidad"
                className="h-11 rounded-xl border-slate-200 pl-10 focus:border-emerald-500 focus:ring-emerald-500"
                value={universidadSearch}
                onChange={(e) => setUniversidadSearch(e.target.value)}
              />
            </div>
            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white">
              {loadingData ? (
                <div className="flex items-center justify-center p-3">
                  <Spinner size="sm" />
                </div>
              ) : filteredUniversidades.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-500">
                  No encontramos esa universidad.
                </div>
              ) : (
                filteredUniversidades.slice(0, 8).map((universidad) => (
                  <button
                    key={universidad.id}
                    type="button"
                    onClick={() => {
                      setUniversidadId(universidad.id);
                      setUniversidadSearch(universidad.nombre);
                      setCarreraId('');
                      setCarreraSearch('');
                    }}
                    className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition hover:bg-emerald-50 ${
                      universidadId === universidad.id
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-700'
                    }`}
                  >
                    <span>{universidad.nombre}</span>
                    {universidadId === universidad.id ? (
                      <span className="text-xs font-semibold">Seleccionada</span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
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
                    ? `Buscá tu carrera en ${universidadSeleccionada.nombre}`
                    : 'Primero elegí una universidad'
                }
                className="h-11 rounded-xl border-slate-200 pl-10 focus:border-emerald-500 focus:ring-emerald-500"
                value={carreraSearch}
                onChange={(e) => setCarreraSearch(e.target.value)}
                disabled={!universidadId}
              />
            </div>
            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white">
              {loadingData ? (
                <div className="flex items-center justify-center p-3">
                  <Spinner size="sm" />
                </div>
              ) : !universidadId ? (
                <div className="px-3 py-3 text-sm text-slate-500">
                  Primero seleccioná una universidad.
                </div>
              ) : carrerasFiltradas.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-500">
                  No encontramos esa carrera dentro de la universidad seleccionada.
                </div>
              ) : (
                carrerasFiltradas.slice(0, 10).map((carrera) => (
                  <button
                    key={carrera.id}
                    type="button"
                    onClick={() => {
                      setCarreraId(carrera.id);
                      setCarreraSearch(carrera.nombre);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition hover:bg-emerald-50 ${
                      carreraId === carrera.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    <span>{carrera.nombre}</span>
                    {carreraId === carrera.id ? (
                      <span className="text-xs font-semibold">Seleccionada</span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
            {universidadSeleccionada ? (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <School className="h-4 w-4 text-emerald-600" />
                {universidadSeleccionada.nombre}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              className="h-11 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {loading ? 'Guardando...' : 'Guardar y continuar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
