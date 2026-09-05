'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Globe2,
  GraduationCap,
  MapPin,
  Phone,
  Save,
  School,
  Settings,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { logError } from '@/lib/observability';
import { resolveProfileSettingsState } from '@/lib/profile-settings';
import { SubscriptionSettings } from '@/components/pricing/SubscriptionSettings';
import { findCareerMatches, normalizeCareerName } from '@/lib/career-matching';

type Universidad = {
  id: string;
  nombre: string;
};

type Carrera = {
  id: string;
  nombre: string;
  universidad_id: string | null;
};

const ANIOS_CARRERA = ['1', '2', '3', '4', '5', '6'] as const;

function anioCarreraLabel(value: string) {
  return value === '6' ? '6to o más' : `${value}° año`;
}

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
  const [telefono, setTelefono] = useState('');
  const [anioCarrera, setAnioCarrera] = useState('');
  const [universidadId, setUniversidadId] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [universidadSearch, setUniversidadSearch] = useState('');
  const [carreraSearch, setCarreraSearch] = useState('');
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [hasLoadedUniversidades, setHasLoadedUniversidades] = useState(false);
  const [initialProfileState, setInitialProfileState] = useState<
    ReturnType<typeof resolveProfileSettingsState> | null
  >(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?next=%2Fconfiguracion');
    }
  }, [loading, router, user]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user) {
        if (active) setLoadingProfile(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('nombre, pais, telefono, anio_carrera, universidad_id, carrera_id')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        const resolvedProfileState = resolveProfileSettingsState({
          profile,
          userMetadata: user.user_metadata,
          fallbackName: getUserName(),
        });

        if (!active) return;

        setNombre(resolvedProfileState.nombre);
        setPais(resolvedProfileState.pais);
        setTelefono(resolvedProfileState.telefono);
        setAnioCarrera(resolvedProfileState.anioCarrera);
        setUniversidadId(resolvedProfileState.universidadId);
        setCarreraId(resolvedProfileState.carreraId);
        setInitialProfileState(resolvedProfileState);

        if (resolvedProfileState.universidadId) {
          const { data: universidad } = await supabase
            .from('universidades')
            .select('nombre')
            .eq('id', resolvedProfileState.universidadId)
            .maybeSingle();

          if (active) setUniversidadSearch(universidad?.nombre ?? '');
        }

        if (resolvedProfileState.carreraId) {
          const { data: carrera } = await supabase
            .from('carreras')
            .select('nombre')
            .eq('id', resolvedProfileState.carreraId)
            .maybeSingle();

          if (active) setCarreraSearch(carrera?.nombre ?? '');
        }
      } catch (error) {
        logError('configuracion.loadProfile', error);
        toast({
          title: 'No pudimos cargar tu perfil',
          description: 'Intenta de nuevo en unos segundos.',
          variant: 'destructive',
        });
      } finally {
        if (active) setLoadingProfile(false);
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
        if (active) setLoadingUniversidades(false);
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
        const { data, error } = await supabase
          .from('carreras')
          .select('id, nombre, universidad_id')
          .eq('universidad_id', universidadId)
          .order('nombre');

        if (error) throw error;
        if (!active) return;

        setCarreras(data ?? []);
      } catch (error) {
        logError('configuracion.loadCarreras', error, {
          universidadId,
          userId: user.id,
        });
      } finally {
        if (active) setLoadingCarreras(false);
      }
    }

    void fetchCarreras();

    return () => {
      active = false;
    };
  }, [universidadId, user]);

  const universidadSeleccionada = useMemo(
    () => universidades.find((universidad) => universidad.id === universidadId) ?? null,
    [universidadId, universidades]
  );

  const carrerasFiltradas = useMemo(() => {
    const normalizedSearch = normalizeCareerName(carreraSearch);

    if (!normalizedSearch) {
      return carreras.slice(0, 12);
    }

    if (normalizedSearch.length < 3) {
      return carreras
        .filter((carrera) => normalizeCareerName(carrera.nombre).includes(normalizedSearch))
        .slice(0, 12);
    }

    return findCareerMatches(carreraSearch, carreras, {
      limit: 12,
      minScore: 0.58,
    }).map((match) => match.career);
  }, [carreraSearch, carreras]);

  const currentProfileState = {
    nombre: nombre.trim(),
    pais: pais.trim(),
    telefono: telefono.trim(),
    anioCarrera: anioCarrera.trim(),
    universidadId: universidadId.trim(),
    carreraId: carreraId.trim(),
  };

  const changedFields = initialProfileState
    ? {
        nombre: currentProfileState.nombre !== initialProfileState.nombre.trim(),
        pais: currentProfileState.pais !== initialProfileState.pais.trim(),
        telefono: currentProfileState.telefono !== initialProfileState.telefono.trim(),
        anioCarrera: currentProfileState.anioCarrera !== initialProfileState.anioCarrera.trim(),
        universidadId:
          currentProfileState.universidadId !== initialProfileState.universidadId.trim(),
        carreraId: currentProfileState.carreraId !== initialProfileState.carreraId.trim(),
      }
    : null;

  const hasChanges = Boolean(changedFields && Object.values(changedFields).some(Boolean));
  const changedValuesAreValid =
    Boolean(changedFields) &&
    (!changedFields?.nombre || currentProfileState.nombre.length >= 2) &&
    (!changedFields?.pais || currentProfileState.pais.length >= 2) &&
    (!changedFields?.universidadId ||
      universidadSearch.trim() === '' ||
      currentProfileState.universidadId !== '') &&
    (!changedFields?.carreraId ||
      carreraSearch.trim() === '' ||
      currentProfileState.carreraId !== '') &&
    (!currentProfileState.carreraId || Boolean(currentProfileState.universidadId));

  const canSave = Boolean(user) && hasChanges && changedValuesAreValid;

  const handleSave = async () => {
    if (!user || !canSave || !changedFields) return;

    setSaving(true);

    try {
      const cleanNombre = currentProfileState.nombre;
      const cleanPais = currentProfileState.pais;
      const cleanTelefono = currentProfileState.telefono;
      const cleanAnioCarrera = currentProfileState.anioCarrera;

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        updated_at: new Date().toISOString(),
        ...(changedFields.nombre ? { nombre: cleanNombre } : {}),
        ...(changedFields.pais ? { pais: cleanPais } : {}),
        ...(changedFields.telefono ? { telefono: cleanTelefono || null } : {}),
        ...(changedFields.anioCarrera ? { anio_carrera: cleanAnioCarrera || null } : {}),
        ...(changedFields.universidadId
          ? { universidad_id: currentProfileState.universidadId || null }
          : {}),
        ...(changedFields.carreraId
          ? { carrera_id: currentProfileState.carreraId || null }
          : {}),
      });

      if (profileError) throw profileError;

      const authData: Record<string, string> = {};
      if (changedFields.nombre) {
        authData.full_name = cleanNombre;
        authData.name = cleanNombre;
      }
      if (changedFields.pais) {
        authData.country = cleanPais;
        authData.pais = cleanPais;
      }
      if (changedFields.telefono) authData.telefono = cleanTelefono;
      if (changedFields.anioCarrera) authData.anio_carrera = cleanAnioCarrera;

      if (Object.keys(authData).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({ data: authData });
        if (authError) throw authError;
      }

      setInitialProfileState({ ...currentProfileState });

      toast({
        title: 'Perfil actualizado',
        description: 'Guardamos únicamente los datos que modificaste.',
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
        description: 'Revisá los datos que modificaste e intentá de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-[var(--radius-panel)] border border-slate-200/85 bg-white shadow-[var(--shadow-panel)]">
        <div className="flex items-center gap-3 text-slate-600">
          <Spinner size="sm" />
          <span className="text-sm font-medium">Cargando tu configuración...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="animate-page-enter mx-auto w-full max-w-6xl space-y-6">
      <section className="surface-panel relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-brand-2/10 blur-3xl" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)]">
              <Settings className="h-7 w-7" />
            </div>
            <div>
              <p className="eyebrow-label text-brand">Perfil</p>
              <h1 className="text-heading mt-1 text-3xl font-bold tracking-[-0.05em] sm:text-4xl">
                Configura tu cuenta
              </h1>
              <p className="section-copy mt-3 max-w-2xl">
                Actualizá tus datos de contacto y tu recorrido académico para que Evaluo pueda
                personalizar mejor tu experiencia.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SubscriptionSettings />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_380px]">
        <div className="surface-panel space-y-8 p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="font-medium text-foreground">
                Nombre
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                placeholder="Tu nombre completo"
                className="h-12 rounded-xl border-input bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium text-foreground">
                Email registrado
              </Label>
              <Input
                id="email"
                value={user.email ?? ''}
                readOnly
                disabled
                className="h-12 rounded-xl border-input bg-card text-muted-foreground disabled:opacity-100"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-brand" />
              <h2 className="text-sm font-bold text-foreground">De dónde sos</h2>
            </div>
            <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
              Contanos tu país de residencia y un teléfono de contacto.
            </p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pais" className="font-medium text-foreground">
                  País
                </Label>
                <div className="relative">
                  <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pais"
                    value={pais}
                    onChange={(event) => setPais(event.target.value)}
                    placeholder="Ej: Argentina"
                    className="h-12 rounded-xl border-input bg-card pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono" className="font-medium text-foreground">
                  Teléfono <span className="font-normal text-muted-foreground">(opcional)</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(event) => setTelefono(event.target.value)}
                    placeholder="Ej: +54 9 11 1234 5678"
                    className="h-12 rounded-xl border-input bg-card pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="universidad-search" className="font-medium text-foreground">
                Universidad
              </Label>
              <div className="relative">
                <School className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                  className="h-12 rounded-xl border-input bg-card pl-10"
                />
              </div>
              <div className="border-border max-h-72 overflow-y-auto rounded-2xl border bg-card">
                {loadingUniversidades ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                  </div>
                ) : universidades.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-muted-foreground">
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
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-primary/5 ${
                        universidadId === universidad.id
                          ? 'bg-primary/5 text-primary'
                          : 'text-foreground'
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
              <Label htmlFor="carrera-search" className="font-medium text-foreground">
                Carrera
              </Label>
              <div className="relative">
                <GraduationCap className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                      : 'Primero seleccioná una universidad'
                  }
                  className="h-12 rounded-xl border-input bg-card pl-10 disabled:opacity-60"
                />
              </div>
              <div className="border-border max-h-72 overflow-y-auto rounded-2xl border bg-card">
                {loadingCarreras ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                  </div>
                ) : !universidadId ? (
                  <div className="px-4 py-4 text-sm text-muted-foreground">
                    Primero seleccioná una universidad.
                  </div>
                ) : carrerasFiltradas.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-muted-foreground">
                    No encontramos carreras para esa búsqueda.
                  </div>
                ) : (
                  carrerasFiltradas.map((carrera) => (
                    <button
                      key={carrera.id}
                      type="button"
                      onClick={() => {
                        setCarreraId(carrera.id);
                        setCarreraSearch(carrera.nombre);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-primary/5 ${
                        carreraId === carrera.id ? 'bg-primary/5 text-primary' : 'text-foreground'
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

          <div className="space-y-2">
            <Label htmlFor="anio-carrera" className="font-medium text-foreground">
              Año de carrera que cursás{' '}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Select value={anioCarrera || undefined} onValueChange={setAnioCarrera}>
              <SelectTrigger id="anio-carrera" className="h-12 w-full rounded-xl border-input bg-card">
                <SelectValue placeholder="Seleccioná tu año" />
              </SelectTrigger>
              <SelectContent>
                {ANIOS_CARRERA.map((value) => (
                  <SelectItem key={value} value={value}>
                    {anioCarreraLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <aside className="surface-panel h-fit p-6 sm:p-8">
          <h2 className="text-lg font-bold text-foreground">Resumen de tu perfil</h2>
          <div className="mt-5 space-y-4">
            <div className="border-border rounded-2xl border bg-card px-4 py-3">
              <p className="eyebrow-label">Nombre</p>
              <p className="mt-1 text-sm font-medium text-foreground">{nombre || 'Sin completar'}</p>
            </div>
            <div className="border-border rounded-2xl border bg-card px-4 py-3">
              <p className="eyebrow-label">País</p>
              <p className="mt-1 text-sm font-medium text-foreground">{pais || 'Sin completar'}</p>
            </div>
            <div className="border-border rounded-2xl border bg-card px-4 py-3">
              <p className="eyebrow-label">Teléfono</p>
              <p className="mt-1 text-sm font-medium text-foreground">{telefono || 'Sin completar'}</p>
            </div>
            <div className="border-border rounded-2xl border bg-card px-4 py-3">
              <p className="eyebrow-label">Universidad</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {universidadSearch || 'Sin completar'}
              </p>
            </div>
            <div className="border-border rounded-2xl border bg-card px-4 py-3">
              <p className="eyebrow-label">Carrera</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {carreraSearch || 'Sin completar'}
              </p>
            </div>
            <div className="border-border rounded-2xl border bg-card px-4 py-3">
              <p className="eyebrow-label">Año de carrera</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {anioCarrera ? anioCarreraLabel(anioCarrera) : 'Sin completar'}
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 h-12 w-full rounded-xl text-sm font-semibold shadow-[0_14px_30px_rgba(37,99,235,0.24)]"
          >
            {saving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Guardando cambios
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </>
            )}
          </Button>
          <p className="mt-2 text-center text-[12px] leading-5 text-muted-foreground">
            Podés guardar un solo cambio sin completar el resto del perfil.
          </p>
        </aside>
      </section>
    </div>
  );
}
