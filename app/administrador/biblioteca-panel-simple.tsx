'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Building2,
  ChevronRight,
  GraduationCap,
  Loader2,
  Plus,
  School,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  type BibliotecaCarreraOption,
  type BibliotecaCarreraSimuladorRow,
  type BibliotecaMateriaOption,
  type BibliotecaOverviewStats,
  type BibliotecaUniversidadOption,
} from './actions';
import {
  crearMateriaBibliotecaAdministrador,
  crearUniversidadBibliotecaAdministrador,
} from './biblioteca-actions';
import {
  crearCarreraEnFacultadAdministrador,
  crearFacultadAdministrador,
} from './estructura-actions';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/components/ui/use-toast';

type FacultadRow = {
  id: string;
  nombre: string;
  universidad_id: string;
};

type CarreraRow = {
  id: string;
  nombre: string;
  universidad_id: string | null;
  facultad_id: string | null;
};

const LEGACY_FACULTY_ID = '__sin_facultad__';

function AddForm({
  label,
  placeholder,
  value,
  onChange,
  onCancel,
  onSubmit,
  pending,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-[#dce3f0] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <p className="mb-3 text-[13px] font-semibold text-[#1d2a44]">{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit();
            if (event.key === 'Escape') onCancel();
          }}
          placeholder={placeholder}
          className="h-10 flex-1 rounded-xl border border-[#dce3f0] bg-white px-3 text-[14px] text-[#1d2a44] outline-none transition placeholder:text-[#a1abc0] focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/10"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending || !value.trim()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#315efb] px-4 text-[13px] font-semibold text-white transition hover:bg-[#254ee0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-[#dce3f0] px-3 text-[#6f7c96] transition hover:bg-[#f7f9fc]"
          aria-label="Cancelar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function NavigationRow({
  title,
  subtitle,
  icon,
  onClick,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-[#e4e9f2] bg-white px-4 py-4 text-left shadow-[0_5px_18px_rgba(15,23,42,0.035)] transition hover:-translate-y-[1px] hover:border-[#cdd8ed] hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#315efb]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-[#1d2a44]">{title}</p>
        {subtitle ? <p className="mt-0.5 truncate text-[12px] text-[#8a95ab]">{subtitle}</p> : null}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#a3adc0] transition group-hover:translate-x-0.5 group-hover:text-[#315efb]" />
    </button>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d7deeb] bg-white px-5 py-10 text-center">
      <p className="text-[14px] font-semibold text-[#1d2a44]">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-5 text-[#8a95ab]">{description}</p>
    </div>
  );
}

export function BibliotecaPanel(props: {
  overview: BibliotecaOverviewStats;
  universidades: BibliotecaUniversidadOption[];
  carreras: BibliotecaCarreraOption[];
  materias: BibliotecaMateriaOption[];
  carrerasSimuladores: BibliotecaCarreraSimuladorRow[];
}) {
  const { universidades, materias } = props;
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [universidadId, setUniversidadId] = useState('');
  const [facultadId, setFacultadId] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [facultades, setFacultades] = useState<FacultadRow[]>([]);
  const [carrerasUniversidad, setCarrerasUniversidad] = useState<CarreraRow[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const universidadActiva = universidades.find((item) => item.id === universidadId) ?? null;
  const facultadActiva =
    facultadId === LEGACY_FACULTY_ID
      ? null
      : facultades.find((item) => item.id === facultadId) ?? null;
  const carreraActiva = carrerasUniversidad.find((item) => item.id === carreraId) ?? null;

  const carrerasVisibles = useMemo(() => {
    if (!facultadId) return [];
    if (facultadId === LEGACY_FACULTY_ID) {
      return carrerasUniversidad.filter((item) => !item.facultad_id);
    }
    return carrerasUniversidad.filter((item) => item.facultad_id === facultadId);
  }, [carrerasUniversidad, facultadId]);

  const materiasVisibles = useMemo(
    () => (carreraId ? materias.filter((materia) => materia.carreraIds.includes(carreraId)) : []),
    [carreraId, materias]
  );

  const hasLegacyCareers = carrerasUniversidad.some((item) => !item.facultad_id);
  const level = carreraId
    ? 'materias'
    : facultadId
      ? 'carreras'
      : universidadId
        ? 'facultades'
        : 'universidades';

  const resetCreate = () => {
    setShowCreate(false);
    setNewName('');
  };

  const loadUniversityChildren = async (selectedUniversidadId: string) => {
    setLoadingChildren(true);
    try {
      const [facultadesResult, carrerasResult] = await Promise.all([
        supabase
          .from('facultades')
          .select('id, nombre, universidad_id')
          .eq('universidad_id', selectedUniversidadId)
          .order('nombre'),
        supabase
          .from('carreras')
          .select('id, nombre, universidad_id, facultad_id')
          .eq('universidad_id', selectedUniversidadId)
          .order('nombre'),
      ]);

      if (facultadesResult.error) throw facultadesResult.error;
      if (carrerasResult.error) throw carrerasResult.error;

      setFacultades((facultadesResult.data ?? []) as FacultadRow[]);
      setCarrerasUniversidad((carrerasResult.data ?? []) as CarreraRow[]);
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : 'No pudimos cargar la estructura académica.',
        variant: 'destructive',
      });
    } finally {
      setLoadingChildren(false);
    }
  };

  const openUniversity = async (id: string) => {
    resetCreate();
    setUniversidadId(id);
    setFacultadId('');
    setCarreraId('');
    await loadUniversityChildren(id);
  };

  const openFaculty = (id: string) => {
    resetCreate();
    setFacultadId(id);
    setCarreraId('');
  };

  const openCareer = (id: string) => {
    resetCreate();
    setCarreraId(id);
  };

  const goToRoot = () => {
    resetCreate();
    setUniversidadId('');
    setFacultadId('');
    setCarreraId('');
    setFacultades([]);
    setCarrerasUniversidad([]);
  };

  const goToUniversity = () => {
    resetCreate();
    setFacultadId('');
    setCarreraId('');
  };

  const goToFaculty = () => {
    resetCreate();
    setCarreraId('');
  };

  const createCurrentLevel = () => {
    const nombre = newName.trim();
    if (!nombre) return;

    startTransition(async () => {
      let result: { success: boolean; message: string };

      if (level === 'universidades') {
        result = await crearUniversidadBibliotecaAdministrador(nombre);
      } else if (level === 'facultades' && universidadId) {
        result = await crearFacultadAdministrador({ nombre, universidadId });
      } else if (
        level === 'carreras' &&
        universidadId &&
        facultadId &&
        facultadId !== LEGACY_FACULTY_ID
      ) {
        result = await crearCarreraEnFacultadAdministrador({ nombre, universidadId, facultadId });
      } else if (level === 'materias' && carreraId) {
        result = await crearMateriaBibliotecaAdministrador({ nombre, carreraIds: [carreraId] });
      } else {
        return;
      }

      toast({ description: result.message, variant: result.success ? 'default' : 'destructive' });
      if (!result.success) return;

      resetCreate();
      router.refresh();
      if (universidadId && (level === 'facultades' || level === 'carreras')) {
        await loadUniversityChildren(universidadId);
      }
    });
  };

  const createConfig =
    level === 'universidades'
      ? { label: 'Nueva universidad', placeholder: 'Nombre de la universidad', button: 'Añadir universidad' }
      : level === 'facultades'
        ? { label: 'Nueva facultad', placeholder: 'Nombre de la facultad', button: 'Añadir facultad' }
        : level === 'carreras'
          ? { label: 'Nueva carrera', placeholder: 'Nombre de la carrera', button: 'Añadir carrera' }
          : { label: 'Nueva materia', placeholder: 'Nombre de la materia', button: 'Añadir materia' };

  const canCreate = level !== 'carreras' || facultadId !== LEGACY_FACULTY_ID;

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9aa5ba]">Biblioteca</p>
          <h2 className="mt-1 text-[1.55rem] font-semibold tracking-[-0.045em] text-[#1d2a44]">Estructura académica</h2>
          <p className="mt-1 text-[13px] text-[#7f8aa3]">Navegá de universidad a facultad, carrera y materia sin mezclar niveles.</p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => {
              setNewName('');
              setShowCreate(true);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#315efb] px-4 text-[13px] font-semibold text-white transition hover:bg-[#254ee0]"
          >
            <Plus className="h-4 w-4" />
            {createConfig.button}
          </button>
        ) : null}
      </div>

      <div className="mb-5 flex min-h-8 flex-wrap items-center gap-1.5 text-[12px]">
        <button type="button" onClick={goToRoot} className="font-medium text-[#315efb] hover:underline">Universidades</button>
        {universidadActiva ? (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-[#a5afc1]" />
            <button type="button" onClick={goToUniversity} className="font-medium text-[#315efb] hover:underline">{universidadActiva.nombre}</button>
          </>
        ) : null}
        {facultadId ? (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-[#a5afc1]" />
            <button type="button" onClick={goToFaculty} className="font-medium text-[#315efb] hover:underline">
              {facultadId === LEGACY_FACULTY_ID ? 'Sin facultad asignada' : facultadActiva?.nombre ?? 'Facultad'}
            </button>
          </>
        ) : null}
        {carreraActiva ? (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-[#a5afc1]" />
            <span className="font-medium text-[#65718a]">{carreraActiva.nombre}</span>
          </>
        ) : null}
      </div>

      {level !== 'universidades' ? (
        <button
          type="button"
          onClick={level === 'facultades' ? goToRoot : level === 'carreras' ? goToUniversity : goToFaculty}
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6f7c96] transition hover:text-[#315efb]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </button>
      ) : null}

      {showCreate ? (
        <AddForm
          label={createConfig.label}
          placeholder={createConfig.placeholder}
          value={newName}
          onChange={setNewName}
          onCancel={resetCreate}
          onSubmit={createCurrentLevel}
          pending={isPending}
        />
      ) : null}

      {loadingChildren ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-[#e4e9f2] bg-white">
          <div className="flex items-center gap-2 text-[13px] text-[#7f8aa3]"><Loader2 className="h-4 w-4 animate-spin" />Cargando estructura...</div>
        </div>
      ) : level === 'universidades' ? (
        universidades.length > 0 ? (
          <div className="grid gap-2.5">
            {universidades.map((universidad) => (
              <NavigationRow key={universidad.id} title={universidad.nombre} subtitle="Ver facultades" icon={<School className="h-5 w-5" />} onClick={() => void openUniversity(universidad.id)} />
            ))}
          </div>
        ) : (
          <EmptyState title="No hay universidades" description="Creá la primera universidad para comenzar la estructura académica." />
        )
      ) : level === 'facultades' ? (
        facultades.length > 0 || hasLegacyCareers ? (
          <div className="grid gap-2.5">
            {facultades.map((facultad) => (
              <NavigationRow key={facultad.id} title={facultad.nombre} subtitle="Ver carreras" icon={<Building2 className="h-5 w-5" />} onClick={() => openFaculty(facultad.id)} />
            ))}
            {hasLegacyCareers ? (
              <NavigationRow title="Carreras sin facultad asignada" subtitle="Datos existentes anteriores a la nueva estructura" icon={<Building2 className="h-5 w-5" />} onClick={() => openFaculty(LEGACY_FACULTY_ID)} />
            ) : null}
          </div>
        ) : (
          <EmptyState title="Todavía no hay facultades" description={`Añadí la primera facultad dentro de ${universidadActiva?.nombre ?? 'esta universidad'}.`} />
        )
      ) : level === 'carreras' ? (
        carrerasVisibles.length > 0 ? (
          <div className="grid gap-2.5">
            {carrerasVisibles.map((carrera) => (
              <NavigationRow key={carrera.id} title={carrera.nombre} subtitle="Ver materias" icon={<GraduationCap className="h-5 w-5" />} onClick={() => openCareer(carrera.id)} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Todavía no hay carreras"
            description={facultadId === LEGACY_FACULTY_ID ? 'No hay carreras pendientes de asignar a una facultad.' : `Añadí la primera carrera dentro de ${facultadActiva?.nombre ?? 'esta facultad'}.`}
          />
        )
      ) : materiasVisibles.length > 0 ? (
        <div className="grid gap-2.5">
          {materiasVisibles.map((materia) => (
            <div key={materia.id} className="flex items-center gap-3 rounded-2xl border border-[#e4e9f2] bg-white px-4 py-4 shadow-[0_5px_18px_rgba(15,23,42,0.035)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#315efb]"><BookOpen className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[#1d2a44]">{materia.nombre}</p>
                <p className="mt-0.5 text-[12px] text-[#8a95ab]">Materia</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Todavía no hay materias" description={`Añadí la primera materia dentro de ${carreraActiva?.nombre ?? 'esta carrera'}.`} />
      )}
    </section>
  );
}
