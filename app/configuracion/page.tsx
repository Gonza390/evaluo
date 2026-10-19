'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useUser } from '@/hooks/useUser';
import { Spinner } from '@/components/ui/spinner';
import { ProfileSettingsForm } from '@/components/settings/profile-settings-form';
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
  const [initialProfileState, setInitialProfileState] = useState<ReturnType<
    typeof resolveProfileSettingsState
  > | null>(null);

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
          description: 'Intentá de nuevo en unos segundos.',
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
        ...(changedFields.carreraId ? { carrera_id: currentProfileState.carreraId || null } : {}),
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
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header className="space-y-1">
        <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
          Configuración
        </h1>
        <p className="text-muted-foreground text-[13px] leading-5">
          Actualizá tus datos personales y académicos.
        </p>
      </header>
      <ProfileSettingsForm
        nombre={nombre}
        pais={pais}
        telefono={telefono}
        anioCarrera={anioCarrera}
        universidadId={universidadId}
        carreraId={carreraId}
        universidadSearch={universidadSearch}
        carreraSearch={carreraSearch}
        setNombre={setNombre}
        setPais={setPais}
        setTelefono={setTelefono}
        setAnioCarrera={setAnioCarrera}
        setUniversidadId={setUniversidadId}
        setCarreraId={setCarreraId}
        setUniversidadSearch={setUniversidadSearch}
        setCarreraSearch={setCarreraSearch}
        email={user.email ?? ''}
        universidades={universidades}
        carrerasFiltradas={carrerasFiltradas}
        universidadSeleccionada={universidadSeleccionada}
        loadingUniversidades={loadingUniversidades}
        loadingCarreras={loadingCarreras}
        hasLoadedUniversidades={hasLoadedUniversidades}
        canSave={canSave}
        saving={saving}
        handleSave={handleSave}
      />
      <SubscriptionSettings />
    </div>
  );
}
