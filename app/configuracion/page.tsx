'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Save, Search, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { logError } from '@/lib/observability';
import { resolveProfileSettingsState } from '@/lib/profile-settings';

type Universidad = {
  id: string;
  nombre: string;
};

type Carrera = {
  id: string;
  nombre: string;
  universidad_id: string | null;
};

export default function ConfiguracionPage() {
  const router = useRouter();
  const { user, loading, getUserName } = useUser();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingUniversidades, setLoadingUniversidades] = useState(false);
  const [loadingCarreras, setLoadingCarreras] = useState(false);
  const [nombre, setNombre] = useState('');
  const [pais, setPais] = useState('');
  const [universidadId, setUniversidadId] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [universidadSearch, setUniversidadSearch] = useState('');
  const [carreraSearch, setCarreraSearch] = useState('');
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [hasLoadedUniversidades, setHasLoadedUniversidades] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?next=%2Fconfiguracion');
    }
  }, [loading, router, user]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user) {
        if (active) {
          setLoadingProfile(false);
        }
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('nombre, universidad_id, carrera_id')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        const resolvedProfileState = resolveProfileSettingsState({
          profile,
          userMetadata: user.user_metadata,
          fallbackName: getUserName(),
        });

        if (!active) {
          return;
        }

        setNombre(resolvedProfileState.nombre);
        setPais(resolvedProfileState.pais);
        setUniversidadId(resolvedProfileState.universidadId);
        setCarreraId(resolvedProfileState.carreraId);

        if (resolvedProfileState.universidadId) {
          const { data: universidad } = await supabase
            .from('universidades')
            .select('nombre')
            .eq('id', resolvedProfileState.universidadId)
            .maybeSingle();

          if (active) {
            setUniversidadSearch(universidad?.nombre ?? '');
          }
        }

        if (resolvedProfileState.carreraId) {
          const { data: carrera } = await supabase
            .from('carreras')
            .select('nombre')
            .eq('id', resolvedProfileState.carreraId)
            .maybeSingle();

          if (active) {
            setCarreraSearch(carrera?.nombre ?? '');
          }
        }
      } catch (error) {
        logError('configuracion.loadProfile', error);
        toast({
          title: 'No pudimos cargar tu perfil',
          description: 'Intenta de nuevo en unos segundos.',
          variant: 'destructive',
        });
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [getUserName, toast, user]);

  useEffect(() => {
    let active = true;

    async function fetchUniversidades() {
      if (!user) return;

      setLoadingUniversidades(true);

      try {
        let query = supabase.from('universidades').select('id, nombre').order('nombre').limit(10);
        const normalizedSearch = universidadSearch.trim();

        if (normalizedSearch.length >= 2) {
          query = query.ilike('nombre', `%${normalizedSearch}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!active) return;

        setUniversidades(data ?? []);
        setHasLoadedUniversidades(true);
      } catch (error) {
        logError('configuracion.loadUniversidades', error, {
          search: universidadSearch.trim(),
          userId: user.id,
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
  }, [universidadSearch, user]);

  useEffect(() => {
    let active = true;

    async function fetchCarreras() {
      if (!user || !universidadId) {
        setCarreras([]);
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
          .limit(12);

        const normalizedSearch = carreraSearch.trim();
        if (normalizedSearch.length >= 2) {
          query = query.ilike('nombre', `%${normalizedSearch}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!active) return;

        setCarreras(data ?? []);
      } catch (error) {
        logError('configuracion.loadCarreras', error, {
          search: carreraSearch.trim(),
          universidadId,
          userId: user.id,
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
  }, [carreraSearch, universidadId, user]);

  const universidadSeleccionada = useMemo(
    () => universidades.find((universidad) => universidad.id === universidadId) ?? null,
    [universidadId, universidades]
  );

  const canSave =
    Boolean(user) &&
    nombre.trim().length >= 2 &&
    pais.trim().length >= 2 &&
    universidadId.trim() !== '' &&
    carreraId.trim() !== '';

  const handleSave = async () => {
    if (!user || !canSave) return;

    setSaving(true);

    try {
      const cleanNombre = nombre.trim();
      const cleanPais = pais.trim();

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        nombre: cleanNombre,
        universidad_id: universidadId,
        carrera_id: carreraId,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        throw profileError;
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: cleanNombre,
          name: cleanNombre,
          country: cleanPais,
          pais: cleanPais,
        },
      });

      if (authError) {
        throw authError;
      }

      toast({
        title: 'Perfil actualizado',
        description: 'Tus datos ya quedaron guardados en Evaluo.',
      });

      router.refresh();
    } catch (error) {
      logError('configuracion.saveProfile', error, {
        userId: user.id,
        universidadId,
        carreraId,
      });
      toast({
        title: 'No pudimos guardar los cambios',
        description: 'Revisá los datos e intentá de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-3 text-slate-600">
          <Spinner size="sm" />
          <span className="text-sm font-medium">Cargando tu configuración...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-4">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]">
                <Settings className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2563EB]">
                  Perfil
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-[-0.05em] text-slate-950 sm:text-4xl">
                  Configura tu cuenta
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                  Actualizá tu nombre, tu universidad, tu carrera y el país desde el que estudiás para
                  que Evaluo pueda personalizar mejor tu experiencia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_380px]">
        <div className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="font-medium text-slate-700">
                Nombre
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Tu nombre completo"
                className="h-12 rounded-2xl border-slate-200 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pais" className="font-medium text-slate-700">
                Pais
              </Label>
              <Input
                id="pais"
                value={pais}
                onChange={(event) => setPais(event.target.value)}
                placeholder="Ej: Argentina"
                className="h-12 rounded-2xl border-slate-200 bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium text-slate-700">
                Email registrado
              </Label>
              <Input
                id="email"
                value={user.email ?? ''}
                readOnly
                disabled
                className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-500 disabled:opacity-100"
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="universidad-search" className="font-medium text-slate-700">
                Universidad
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-4 h-4 w-4 text-slate-400" />
                <Input
                  id="universidad-search"
                  value={universidadSearch}
                  onChange={(event) => {
                    setUniversidadSearch(event.target.value);
                    setUniversidadId('');
                    setCarreraId('');
                    setCarreraSearch('');
                  }}
                  placeholder="Buscá tu universidad"
                  className="h-12 rounded-2xl border-slate-200 bg-white pl-10"
                />
              </div>
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                {loadingUniversidades ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                  </div>
                ) : universidades.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-slate-500">
                    {hasLoadedUniversidades
                      ? 'No encontramos esa universidad.'
                      : 'Escribí al menos 2 letras para buscar tu universidad.'}
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
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-indigo-50 ${
                        universidadId === universidad.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrera-search" className="font-medium text-slate-700">
                Carrera
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-4 h-4 w-4 text-slate-400" />
                <Input
                  id="carrera-search"
                  value={carreraSearch}
                  onChange={(event) => {
                    setCarreraSearch(event.target.value);
                    setCarreraId('');
                  }}
                  disabled={!universidadId}
                  placeholder={
                    universidadSeleccionada
                      ? `Buscá tu carrera en ${universidadSeleccionada.nombre}`
                      : 'Primero selecciona una universidad'
                  }
                  className="h-12 rounded-2xl border-slate-200 bg-white pl-10"
                />
              </div>
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                {loadingCarreras ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                  </div>
                ) : !universidadId ? (
                  <div className="px-4 py-4 text-sm text-slate-500">
                    Primero selecciona una universidad.
                  </div>
                ) : carreras.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-slate-500">
                    No encontramos carreras para esa busqueda.
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
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-indigo-50 ${
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
            </div>
          </div>
        </div>

        <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">Resumen de tu perfil</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Nombre
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">{nombre || 'Sin completar'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Pais
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">{pais || 'Sin completar'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Universidad
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {universidadSearch || 'Sin completar'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Carrera
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {carreraSearch || 'Sin completar'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="mt-6 h-12 w-full rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] hover:opacity-95"
          >
            {saving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Guardando cambios
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar perfil
              </>
            )}
          </Button>
        </aside>
      </section>
    </div>
  );
}
