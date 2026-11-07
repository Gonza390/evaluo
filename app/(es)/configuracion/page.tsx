'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, LogOut, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { useUser } from '@/hooks/useUser';
import { useAppLocale } from '@/components/i18n/app-locale-provider';
import { LanguagePicker } from '@/components/i18n/language-picker';
import { settingsMessages } from '@/lib/i18n/settings-messages';
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
  const { locale } = useAppLocale();
  const english = locale === 'en';
  const tr = (es: string,en: string) => english ? en : es;
  const settingsCopy = settingsMessages[locale];
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
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
      router.replace(english ? '/en/login?next=%2Fconfiguracion' : '/login?next=%2Fconfiguracion');
    }
  }, [loading, router, user, english]);

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
          title: tr("No pudimos cargar tu perfil","Could not load your profile"),
          description: tr("Intentá de nuevo en unos segundos.","Please try again in a few seconds."),
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
        title: tr("Perfil actualizado","Profile updated"),
        description: tr("Guardamos únicamente los datos que modificaste.","Only the changed fields were saved."),
      });

      router.refresh();
    } catch (error) {
      logError('configuracion.saveProfile', error, {
        userId: user.id,
        universidadId,
        carreraId,
      });
      toast({
        title: tr("No pudimos guardar los cambios","Could not save changes"),
        description: tr("Revisá los datos que modificaste e intentá de nuevo.","Review the updated fields and try again."),
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
          <span className="text-sm font-medium">{tr("Cargando tu configuración...","Loading settings...")}</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const settingRow = (label: string, value: string) => (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-slate-100 py-3 text-[13px] last:border-b-0">
      <span className="font-medium text-slate-800">{label}</span>
      <span className="max-w-[55%] truncate text-right text-slate-500">{value || tr("Sin especificar","Not specified")}</span>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-1">
        <h1 className="text-[20px] font-semibold tracking-[-0.035em] text-slate-950 sm:text-[22px] lg:text-[24px]">{settingsCopy.title}</h1>
        <p className="text-[13px] text-slate-500">{settingsCopy.subtitle}</p>
      </header>

      <section aria-labelledby="settings-general" className="space-y-1">
        <h2 id="settings-general" className="text-xs font-normal text-slate-500">{settingsCopy.general}</h2>
        <LanguagePicker />
        {settingRow(settingsCopy.appearance, settingsCopy.light)}
        <p className="pt-1 text-xs text-slate-400">{settingsCopy.themeUnavailable}</p>
        <p className="pt-1 text-xs text-slate-400">{settingsCopy.languageHelp}</p>
      </section>

      <section aria-labelledby="settings-account" className="space-y-1">
        <h2 id="settings-account" className="text-xs font-normal text-slate-500">{tr("Cuenta","Account")}</h2>
        {settingRow(tr("Correo electrónico","Email address"), user.email ?? '')}
        <details className="group border-b border-slate-100">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-[13px] font-medium text-slate-800 [&::-webkit-details-marker]:hidden">
            {tr("Mi plan y suscripción","My plan and subscription")} <ChevronDown className="size-4 text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="pb-4"><SubscriptionSettings /></div>
        </details>
      </section>

      <section aria-labelledby="settings-personal" className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h2 id="settings-personal" className="text-xs font-normal text-slate-500">{tr("Información personal","Personal information")}</h2>
          <button type="button" onClick={() => setEditingProfile((value) => !value)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600">
            <Pencil className="size-3.5" /> {editingProfile ? tr("Cerrar edición","Close editor") : tr("Editar datos","Edit details")}
          </button>
        </div>
        {settingRow(tr("Nombre","Name"), nombre)}
        {settingRow(tr("País","Country"), pais)}
        {settingRow(tr("Teléfono","Phone"), telefono)}
      </section>

      <section aria-labelledby="settings-academic" className="space-y-1">
        <h2 id="settings-academic" className="text-xs font-normal text-slate-500">{tr("Información académica","Academic information")}</h2>
        {settingRow(tr("Universidad","University"), universidadSearch)}
        {settingRow(tr("Carrera","Degree program"), carreraSearch)}
        {settingRow(tr("Año de cursado","Year of study"), anioCarrera ? (english ? `Year ${anioCarrera}` : anioCarrera + '° año') : '')}
      </section>

      {editingProfile ? (
        <section className="space-y-2" aria-label={tr("Editar información personal y académica","Edit personal and academic details")}>
          <p className="text-xs text-slate-500">{tr("Modificá los campos necesarios y guardá los cambios.","Edit the fields you need and save your changes.")}</p>
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
        </section>
      ) : null}

      <section aria-labelledby="settings-session" className="space-y-1">
        <h2 id="settings-session" className="text-xs font-normal text-slate-500">{tr("Sesión y privacidad","Session and privacy")}</h2>
        <button type="button" disabled={signingOut} onClick={async () => {
          setSigningOut(true);
          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            window.location.assign(english ? '/en/login' : '/login');
          } catch (error) {
            logError('configuracion.signOut', error);
            toast({ title: tr("No pudimos cerrar tu sesión","Could not sign you out"), variant: 'destructive' });
            setSigningOut(false);
          }
        }} className="flex min-h-12 w-full items-center gap-2 border-b border-slate-100 py-3 text-left text-[13px] font-medium text-slate-700 hover:text-blue-600 disabled:opacity-50">
          <LogOut className="size-4 text-slate-400" />
          {signingOut ? tr("Cerrando sesión…","Signing out…") : tr("Cerrar sesión","Sign out")}
        </button>
      </section>
    </div>
  );
}
