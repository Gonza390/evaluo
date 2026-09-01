'use client';

import { type ReactNode, useMemo, useState, useTransition } from 'react';
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
  obtenerEstructuraUniversidadAdministrador,
} from './estructura-actions';
import { useToast } from '@/components/ui/use-toast';

type FacultadRow = {
  id: string;
  nombre: string;
  universidadId: string;
};

type CarreraRow = {
  id: string;
  nombre: string;
  universidadId: string | null;
  facultadId: string | null;
};

const LEGACY_FACULTY_ID = '__sin_facultad__';

function AddForm({
  title,
  placeholder,
  value,
  pending,
  onChange,
  onSubmit,
  onCancel,
}: {
  title: string;
  placeholder: string;
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-[#dce3f0] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <p className="mb-3 text-[13px] font-semibold text-[#1d2a44]">{title}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          autoFocus
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit();
            if (event.key === 'Escape') onCancel();
          }}
          className="h-10 flex-1 rounded-xl border border-[#dce3f0] bg-white px-3 text-[14px] text-[#1d2a44] outline-none placeholder:text-[#a1abc0] focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/10"
        />
        <button
          type="button"
          disabled={pending || !value.trim()}
          onClick={onSubmit}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#315efb] px-4 text-[13px] font-semibold text-white transition hover:bg-[#254ee0] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear
        </button>
        <button
          type="button"
          aria-label="Cancelar"
          disabled={pending}
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-[#dce3f0] px-3 text-[#6f7c96] hover:bg-[#f7f9fc]"
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
  subtitle: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-[#e4e9f2] bg-white px-4 py-4 text-left shadow-[0_5px_18px_rgba(15,23,42,0.035)] transition hover:-translate-y-[1px] hover:border-[#cdd8ed] hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#315efb]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold text-[#1d2a44]">{title}</span>
        <span className="mt-0.5 block truncate text-[12px] text-[#8a95ab]">{subtitle}</span>
      </span>
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

export function BibliotecaPanel({
  universidades,
  materias,
}: {
  overview: BibliotecaOverviewStats;
  universidades: BibliotecaUniversidadOption[];
  carreras: BibliotecaCarreraOption[];
  materias: BibliotecaMateriaOption[];
  carrerasSimuladores: BibliotecaCarreraSimuladorRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [universidadId, setUniversidadId] = useState('');
  const [facultadId, setFacultadId] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [facultades, setFacultades] = useState<FacultadRow[]>([]);
  const [carreras, setCarreras] = useState<CarreraRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const universidad = universidades.find((item) => item.id === universidadId) ?? null;
  const facultad = facultades.find((item) => item.id === facultadId) ?? null;
  const carrera = carreras.find((item) => item.id === carreraId) ?? null;

  const level = carreraId
    ? 'materias'
    : facultadId
      ? 'carreras'
      : universidadId
        ? 'facultades'
        : 'universidades';

  const carrerasVisibles = useMemo(() => {
    if (!facultadId) return [];
    if (facultadId === LEGACY_FACULTY_ID) return carreras.filter((item) => !item.facultadId);
    return carreras.filter((item) => item.facultadId === facultadId);
  }, [carreras, facultadId]);

  const materiasVisibles = useMemo(
    () => (carreraId ? materias.filter((item) => item.carreraIds.includes(carreraId)) : []),
    [carreraId, materias]
  );

  const hasLegacyCareers = carreras.some((item) => !item.facultadId);

  const closeCreate = () => {
    setCreating(false);
    setNewName('');
  };

  const loadUniversity = async (id: string) => {
    setLoading(true);
    const result = await obtenerEstructuraUniversidadAdministrador(id);
    setLoading(false);

    if (!result.success) {
      toast({ description: result.message ?? 'No pudimos cargar la universidad.', variant: 'destructive' });
      return false;
    }

    setFacultades(result.facultades ?? []);
    setCarreras(result.carreras ?? []);
    return true;
  };

  const openUniversity = async (id: string) => {
    closeCreate();
    setUniversidadId(id);
    setFacultadId('');
    setCarreraId('');
    await loadUniversity(id);
  };

  const openFaculty = (id: string) => {
    closeCreate();
    setFacultadId(id);
    setCarreraId('');
  };

  const openCareer = (id: string) => {
    closeCreate();
    setCarreraId(id);
  };

  const goRoot = () => {
    closeCreate();
    setUniversidadId('');
    setFacultadId('');
    setCarreraId('');
    setFacultades([]);
    setCarreras([]);
  };

  const goUniversity = () => {
    closeCreate();
    setFacultadId('');
    setCarreraId('');
  };

  const goFaculty = () => {
    closeCreate();
    setCarreraId('');
  };

  const submitCreate = () => {
    const nombre = newName.trim();
    if (!nombre) return;

    startTransition(async () => {
      let result: { success: boolean; message: string } | null = null;

      if (level === 'universidades') {
        result = await crearUniversidadBibliotecaAdministrador(nombre);
      } else if (level === 'facultades' && universidadId) {
        result = await crearFacultadAdministrador({ nombre, universidadId });
      } else if (level === 'carreras' && universidadId && facultadId && facultadId !== LEGACY_FACULTY_ID) {
        result = await crearCarreraEnFacultadAdministrador({ nombre, universidadId, facultadId });
      } else if (level === 'materias' && carreraId) {
        result = await crearMateriaBibliotecaAdministrador({ nombre, carreraIds: [carreraId] });
      }

      if (!result) return;
      toast({ description: result.message, variant: result.success ? 'default' : 'destructive' });
      if (!result.success) return;

      closeCreate();
      if (universidadId && (level === 'facultades' || level === 'carreras')) {
        await loadUniversity(universidadId);
      }
      router.refresh();
    });
  };

  const createCopy =
    level === 'universidades'
      ? { button: 'Añadir universidad', title: 'Nueva universidad', placeholder: 'Nombre de la universidad' }
      : level === 'facultades'
        ? { button: 'Añadir facultad', title: 'Nueva facultad', placeholder: 'Nombre de la facultad' }
        : level === 'carreras'
          ? { button: 'Añadir carrera', title: 'Nueva carrera', placeholder: 'Nombre de la carrera' }
          : { button: 'Añadir materia', title: 'Nueva materia', placeholder: 'Nombre de la materia' };

  const canCreate = !(level === 'carreras' && facultadId === LEGACY_FACULTY_ID);
  const backAction = level === 'facultades' ? goRoot : level === 'carreras' ? goUniversity : goFaculty;

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9aa5ba]">Biblioteca</p>
          <h2 className="mt-1 text-[1.55rem] font-semibold tracking-[-0.045em] text-[#1d2a44]">Estructura académica</h2>
          <p className="mt-1 text-[13px] text-[#7f8aa3]">Universidad → Facultad → Carrera → Materia</p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#315efb] px-4 text-[13px] font-semibold text-white transition hover:bg-[#254ee0]"
          >
            <Plus className="h-4 w-4" />
            {createCopy.button}
          </button>
        ) : null}
      </div>

      <div className="mb-4 flex min-h-7 flex-wrap items-center gap-1.5 text-[12px]">
        <button type="button" onClick={goRoot} className="font-medium text-[#315efb] hover:underline">Universidades</button>
        {universidad ? (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-[#a5afc1]" />
            <button type="button" onClick={goUniversity} className="font-medium text-[#315efb] hover:underline">{universidad.nombre}</button>
          </>
        ) : null}
        {facultadId ? (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-[#a5afc1]" />
            <button type="button" onClick={goFaculty} className="font-medium text-[#315efb] hover:underline">
              {facultadId === LEGACY_FACULTY_ID ? 'Sin facultad asignada' : facultad?.nombre ?? 'Facultad'}
            </button>
          </>
        ) : null}
        {carrera ? (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-[#a5afc1]" />
            <span className="font-medium text-[#65718a]">{carrera.nombre}</span>
          </>
        ) : null}
      </div>

      {level !== 'universidades' ? (
        <button type="button" onClick={backAction} className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6f7c96] hover:text-[#315efb]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </button>
      ) : null}

      {creating ? (
        <AddForm
          title={createCopy.title}
          placeholder={createCopy.placeholder}
          value={newName}
          pending={pending}
          onChange={setNewName}
          onSubmit={submitCreate}
          onCancel={closeCreate}
        />
      ) : null}

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-[#e4e9f2] bg-white">
          <span className="flex items-center gap-2 text-[13px] text-[#7f8aa3]"><Loader2 className="h-4 w-4 animate-spin" /> Cargando estructura...</span>
        </div>
      ) : level === 'universidades' ? (
        universidades.length ? (
          <div className="grid gap-2.5">
            {universidades.map((item) => (
              <NavigationRow key={item.id} title={item.nombre} subtitle="Ver facultades" icon={<School className="h-5 w-5" />} onClick={() => void openUniversity(item.id)} />
            ))}
          </div>
        ) : <EmptyState title="No hay universidades" description="Añadí la primera universidad para comenzar." />
      ) : level === 'facultades' ? (
        facultades.length || hasLegacyCareers ? (
          <div className="grid gap-2.5">
            {facultades.map((item) => (
              <NavigationRow key={item.id} title={item.nombre} subtitle="Ver carreras" icon={<Building2 className="h-5 w-5" />} onClick={() => openFaculty(item.id)} />
            ))}
            {hasLegacyCareers ? (
              <NavigationRow title="Carreras sin facultad asignada" subtitle="Estructura anterior" icon={<Building2 className="h-5 w-5" />} onClick={() => openFaculty(LEGACY_FACULTY_ID)} />
            ) : null}
          </div>
        ) : <EmptyState title="Todavía no hay facultades" description={`Añadí la primera facultad dentro de ${universidad?.nombre ?? 'esta universidad'}.`} />
      ) : level === 'carreras' ? (
        carrerasVisibles.length ? (
          <div className="grid gap-2.5">
            {carrerasVisibles.map((item) => (
              <NavigationRow key={item.id} title={item.nombre} subtitle="Ver materias" icon={<GraduationCap className="h-5 w-5" />} onClick={() => openCareer(item.id)} />
            ))}
          </div>
        ) : <EmptyState title="Todavía no hay carreras" description={facultadId === LEGACY_FACULTY_ID ? 'No hay carreras pendientes de asignación.' : `Añadí la primera carrera dentro de ${facultad?.nombre ?? 'esta facultad'}.`} />
      ) : materiasVisibles.length ? (
        <div className="grid gap-2.5">
          {materiasVisibles.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-[#e4e9f2] bg-white px-4 py-4 shadow-[0_5px_18px_rgba(15,23,42,0.035)]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#315efb]"><BookOpen className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-[#1d2a44]">{item.nombre}</span>
                <span className="mt-0.5 block text-[12px] text-[#8a95ab]">Materia</span>
              </span>
            </div>
          ))}
        </div>
      ) : <EmptyState title="Todavía no hay materias" description={`Añadí la primera materia dentro de ${carrera?.nombre ?? 'esta carrera'}.`} />}
    </section>
  );
}
