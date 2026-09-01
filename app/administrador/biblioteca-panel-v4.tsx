'use client';

import { type ReactNode, useMemo, useState, useTransition } from 'react';
import { ArrowLeft, BookOpen, Building2, ChevronRight, GraduationCap, Link2, Loader2, Plus, School, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { BibliotecaCarreraOption, BibliotecaCarreraSimuladorRow, BibliotecaMateriaOption, BibliotecaOverviewStats, BibliotecaUniversidadOption } from './actions';
import { crearUniversidadBibliotecaAdministrador } from './biblioteca-actions';
import { crearCarreraDirectaUniversidadAdministrador, crearCarreraEnFacultadAdministrador, crearFacultadAdministrador, obtenerEstructuraUniversidadAdministrador } from './estructura-actions';
import { crearMateriaEnCarreraAdministrador, vincularMateriaExistenteAdministrador } from './materia-hierarchy-actions';
import { useToast } from '@/components/ui/use-toast';

type FacultadRow = { id: string; nombre: string; universidadId: string };
type CarreraRow = { id: string; nombre: string; universidadId: string | null; facultadId: string | null };
type CreateMode = 'universidad' | 'facultad' | 'carrera-directa' | 'carrera-facultad' | 'materia' | null;

function NavRow({ title, subtitle, icon, onClick }: { title: string; subtitle: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex w-full items-center gap-3 rounded-2xl border border-[#e4e9f2] bg-white px-4 py-4 text-left shadow-[0_5px_18px_rgba(15,23,42,0.035)] transition hover:-translate-y-[1px] hover:border-[#cdd8ed] hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#315efb]">{icon}</span>
      <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-[#1d2a44]">{title}</span><span className="mt-0.5 block truncate text-[12px] text-[#8a95ab]">{subtitle}</span></span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#a3adc0] group-hover:text-[#315efb]" />
    </button>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-dashed border-[#d7deeb] bg-white px-5 py-9 text-center"><p className="text-[14px] font-semibold text-[#1d2a44]">{title}</p><p className="mx-auto mt-1.5 max-w-md text-[13px] leading-5 text-[#8a95ab]">{description}</p></div>;
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return <div className="mb-3"><h3 className="text-[14px] font-semibold text-[#25324b]">{title}</h3><p className="mt-0.5 text-[12px] text-[#8a95ab]">{description}</p></div>;
}

function TextForm({ title, placeholder, value, pending, onChange, onSubmit, onCancel }: { title: string; placeholder: string; value: string; pending: boolean; onChange: (value: string) => void; onSubmit: () => void; onCancel: () => void }) {
  return (
    <div className="mb-5 rounded-2xl border border-[#dce3f0] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <p className="mb-3 text-[13px] font-semibold text-[#1d2a44]">{title}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input autoFocus value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onSubmit(); if (event.key === 'Escape') onCancel(); }} className="h-10 flex-1 rounded-xl border border-[#dce3f0] bg-white px-3 text-[14px] text-[#1d2a44] outline-none focus:border-[#315efb] focus:ring-2 focus:ring-[#315efb]/10" />
        <button type="button" disabled={pending || !value.trim()} onClick={onSubmit} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#315efb] px-4 text-[13px] font-semibold text-white disabled:opacity-50">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Crear</button>
        <button type="button" onClick={onCancel} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#dce3f0] px-3 text-[#6f7c96]"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function LinkForm({ options, value, pending, onChange, onSubmit, onCancel }: { options: BibliotecaMateriaOption[]; value: string; pending: boolean; onChange: (value: string) => void; onSubmit: () => void; onCancel: () => void }) {
  return (
    <div className="mb-5 rounded-2xl border border-[#dce3f0] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-3 flex items-start justify-between gap-3"><div><p className="text-[13px] font-semibold text-[#1d2a44]">Vincular materia existente</p><p className="mt-1 text-[12px] text-[#8a95ab]">Solo aparecen materias de esta universidad.</p></div><button type="button" onClick={onCancel}><X className="h-4 w-4 text-[#8994a9]" /></button></div>
      {options.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row"><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 flex-1 rounded-xl border border-[#dce3f0] bg-white px-3 text-[14px] text-[#1d2a44]"><option value="">Seleccionar materia</option>{options.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select><button type="button" disabled={pending || !value} onClick={onSubmit} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#315efb] px-4 text-[13px] font-semibold text-white disabled:opacity-50">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Vincular</button></div>
      ) : <p className="rounded-xl bg-[#f7f9fc] px-3 py-3 text-[12px] text-[#7d899f]">No hay otras materias disponibles para vincular.</p>}
    </div>
  );
}

export function BibliotecaPanel({ universidades, materias }: { overview: BibliotecaOverviewStats; universidades: BibliotecaUniversidadOption[]; carreras: BibliotecaCarreraOption[]; materias: BibliotecaMateriaOption[]; carrerasSimuladores: BibliotecaCarreraSimuladorRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [universidadId, setUniversidadId] = useState('');
  const [facultadId, setFacultadId] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [facultades, setFacultades] = useState<FacultadRow[]>([]);
  const [carrerasUniversidad, setCarrerasUniversidad] = useState<CarreraRow[]>([]);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [newName, setNewName] = useState('');
  const [linking, setLinking] = useState(false);
  const [materiaToLink, setMateriaToLink] = useState('');

  const universidad = universidades.find((item) => item.id === universidadId) ?? null;
  const facultad = facultades.find((item) => item.id === facultadId) ?? null;
  const carrera = carrerasUniversidad.find((item) => item.id === carreraId) ?? null;
  const level = carreraId ? 'materias' : facultadId ? 'facultad' : universidadId ? 'universidad' : 'universidades';
  const carrerasDirectas = useMemo(() => carrerasUniversidad.filter((item) => !item.facultadId), [carrerasUniversidad]);
  const carrerasFacultad = useMemo(() => carrerasUniversidad.filter((item) => item.facultadId === facultadId), [carrerasUniversidad, facultadId]);
  const materiasVisibles = useMemo(() => carreraId ? materias.filter((item) => item.carreraIds.includes(carreraId)) : [], [carreraId, materias]);
  const materiasVinculables = useMemo(() => {
    if (!carreraId) return [];
    const careerIds = new Set(carrerasUniversidad.map((item) => item.id));
    const actuales = new Set(materiasVisibles.map((item) => item.id));
    return materias.filter((item) => !actuales.has(item.id) && item.carreraIds.some((id) => careerIds.has(id))).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [carreraId, carrerasUniversidad, materias, materiasVisibles]);

  const closeInputs = () => { setCreateMode(null); setNewName(''); setLinking(false); setMateriaToLink(''); };
  const beginCreate = (mode: Exclude<CreateMode, null>) => { setLinking(false); setMateriaToLink(''); setNewName(''); setCreateMode(mode); };
  const loadUniversity = async (id: string) => { setLoading(true); const result = await obtenerEstructuraUniversidadAdministrador(id); setLoading(false); if (!result.success) { toast({ description: result.message ?? 'No pudimos cargar la universidad.', variant: 'destructive' }); return; } setFacultades(result.facultades ?? []); setCarrerasUniversidad(result.carreras ?? []); };
  const openUniversity = async (id: string) => { closeInputs(); setUniversidadId(id); setFacultadId(''); setCarreraId(''); await loadUniversity(id); };
  const openFaculty = (id: string) => { closeInputs(); setFacultadId(id); setCarreraId(''); };
  const openCareer = (id: string) => { closeInputs(); setCarreraId(id); };
  const goRoot = () => { closeInputs(); setUniversidadId(''); setFacultadId(''); setCarreraId(''); setFacultades([]); setCarrerasUniversidad([]); };
  const goUniversity = () => { closeInputs(); setFacultadId(''); setCarreraId(''); };
  const goFaculty = () => { closeInputs(); setCarreraId(''); };

  const submitCreate = () => {
    const nombre = newName.trim();
    if (!nombre || !createMode) return;
    startTransition(async () => {
      let result: { success: boolean; message: string } | null = null;
      if (createMode === 'universidad') result = await crearUniversidadBibliotecaAdministrador(nombre);
      if (createMode === 'facultad' && universidadId) result = await crearFacultadAdministrador({ nombre, universidadId });
      if (createMode === 'carrera-directa' && universidadId) result = await crearCarreraDirectaUniversidadAdministrador({ nombre, universidadId });
      if (createMode === 'carrera-facultad' && universidadId && facultadId) result = await crearCarreraEnFacultadAdministrador({ nombre, universidadId, facultadId });
      if (createMode === 'materia' && carreraId) result = await crearMateriaEnCarreraAdministrador({ nombre, carreraId });
      if (!result) return;
      toast({ description: result.message, variant: result.success ? 'default' : 'destructive' });
      if (!result.success) return;
      const mode = createMode;
      closeInputs();
      if (universidadId && mode !== 'materia') await loadUniversity(universidadId);
      router.refresh();
    });
  };

  const submitLink = () => {
    if (!materiaToLink || !carreraId) return;
    startTransition(async () => {
      const result = await vincularMateriaExistenteAdministrador({ materiaId: materiaToLink, carreraId });
      toast({ description: result.message, variant: result.success ? 'default' : 'destructive' });
      if (result.success) { closeInputs(); router.refresh(); }
    });
  };

  const createCopy = createMode === 'universidad'
    ? { title: 'Nueva universidad', placeholder: 'Nombre de la universidad' }
    : createMode === 'facultad'
      ? { title: 'Nueva facultad', placeholder: 'Nombre de la facultad' }
      : createMode === 'carrera-directa'
        ? { title: 'Nueva carrera', placeholder: 'Nombre de la carrera' }
        : createMode === 'carrera-facultad'
          ? { title: `Nueva carrera en ${facultad?.nombre ?? 'la facultad'}`, placeholder: 'Nombre de la carrera' }
          : { title: `Nueva materia en ${carrera?.nombre ?? 'la carrera'}`, placeholder: 'Nombre de la materia' };

  let content: ReactNode;
  if (loading) {
    content = <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-[#e4e9f2] bg-white"><span className="flex items-center gap-2 text-[13px] text-[#7f8aa3]"><Loader2 className="h-4 w-4 animate-spin" />Cargando estructura...</span></div>;
  } else if (level === 'universidades') {
    content = universidades.length > 0 ? <div className="grid gap-2.5">{universidades.map((item) => <NavRow key={item.id} title={item.nombre} subtitle="Abrir universidad" icon={<School className="h-5 w-5" />} onClick={() => void openUniversity(item.id)} />)}</div> : <EmptyState title="No hay universidades" description="Añadí la primera universidad para comenzar." />;
  } else if (level === 'universidad') {
    content = <div className="space-y-8">
      {facultades.length > 0 && <div><SectionHeader title="Facultades" description="Entrá a una facultad para ver sus carreras." /><div className="grid gap-2.5">{facultades.map((item) => <NavRow key={item.id} title={item.nombre} subtitle="Ver carreras" icon={<Building2 className="h-5 w-5" />} onClick={() => openFaculty(item.id)} />)}</div></div>}
      {carrerasDirectas.length > 0 && <div><SectionHeader title="Carreras directas" description="Carreras que dependen directamente de la universidad." /><div className="grid gap-2.5">{carrerasDirectas.map((item) => <NavRow key={item.id} title={item.nombre} subtitle="Ver materias" icon={<GraduationCap className="h-5 w-5" />} onClick={() => openCareer(item.id)} />)}</div></div>}
      {facultades.length === 0 && carrerasDirectas.length === 0 && <EmptyState title="Todavía no hay estructura cargada" description="Podés añadir una facultad o una carrera directa." />}
    </div>;
  } else if (level === 'facultad') {
    content = carrerasFacultad.length > 0 ? <div className="grid gap-2.5">{carrerasFacultad.map((item) => <NavRow key={item.id} title={item.nombre} subtitle="Ver materias" icon={<GraduationCap className="h-5 w-5" />} onClick={() => openCareer(item.id)} />)}</div> : <EmptyState title="Todavía no hay carreras" description={`Añadí la primera carrera dentro de ${facultad?.nombre ?? 'esta facultad'}.`} />;
  } else {
    content = materiasVisibles.length > 0 ? <div className="grid gap-2.5">{materiasVisibles.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-[#e4e9f2] bg-white px-4 py-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3ff] text-[#315efb]"><BookOpen className="h-5 w-5" /></span><span><span className="block text-[14px] font-semibold text-[#1d2a44]">{item.nombre}</span><span className="text-[12px] text-[#8a95ab]">Materia</span></span></div>)}</div> : <EmptyState title="Todavía no hay materias" description={`Creá la primera materia dentro de ${carrera?.nombre ?? 'esta carrera'} o vinculá una existente.`} />;
  }

  const backAction = level === 'universidad' ? goRoot : level === 'facultad' ? goUniversity : facultadId ? goFaculty : goUniversity;

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9aa5ba]">Biblioteca</p><h2 className="mt-1 text-[1.55rem] font-semibold tracking-[-0.045em] text-[#1d2a44]">Estructura académica</h2><p className="mt-1 text-[13px] text-[#7f8aa3]">Entrá nivel por nivel para administrar la estructura.</p></div>
        <div className="flex flex-wrap gap-2">
          {level === 'universidades' && <button type="button" onClick={() => beginCreate('universidad')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#315efb] px-4 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" />Añadir universidad</button>}
          {level === 'universidad' && <><button type="button" onClick={() => beginCreate('facultad')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#315efb] px-4 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" />Añadir facultad</button><button type="button" onClick={() => beginCreate('carrera-directa')} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#cfd8e9] bg-white px-4 text-[13px] font-semibold text-[#315efb]"><Plus className="h-4 w-4" />Añadir carrera directa</button></>}
          {level === 'facultad' && <button type="button" onClick={() => beginCreate('carrera-facultad')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#315efb] px-4 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" />Añadir carrera</button>}
          {level === 'materias' && <><button type="button" onClick={() => beginCreate('materia')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#315efb] px-4 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" />Crear materia</button><button type="button" onClick={() => { setCreateMode(null); setLinking(true); setMateriaToLink(''); }} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#cfd8e9] bg-white px-4 text-[13px] font-semibold text-[#315efb]"><Link2 className="h-4 w-4" />Vincular existente</button></>}
        </div>
      </div>

      <div className="mb-4 flex min-h-7 flex-wrap items-center gap-1.5 text-[12px]"><button type="button" onClick={goRoot} className="font-medium text-[#315efb] hover:underline">Universidades</button>{universidad && <><ChevronRight className="h-3.5 w-3.5 text-[#a5afc1]" /><button type="button" onClick={goUniversity} className="font-medium text-[#315efb] hover:underline">{universidad.nombre}</button></>}{facultad && <><ChevronRight className="h-3.5 w-3.5 text-[#a5afc1]" /><button type="button" onClick={goFaculty} className="font-medium text-[#315efb] hover:underline">{facultad.nombre}</button></>}{carrera && <><ChevronRight className="h-3.5 w-3.5 text-[#a5afc1]" /><span className="font-medium text-[#65718a]">{carrera.nombre}</span></>}</div>
      {level !== 'universidades' && <button type="button" onClick={backAction} className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#6f7c96]"><ArrowLeft className="h-3.5 w-3.5" />Volver</button>}
      {createMode && <TextForm title={createCopy.title} placeholder={createCopy.placeholder} value={newName} pending={pending} onChange={setNewName} onSubmit={submitCreate} onCancel={closeInputs} />}
      {linking && <LinkForm options={materiasVinculables} value={materiaToLink} pending={pending} onChange={setMateriaToLink} onSubmit={submitLink} onCancel={closeInputs} />}
      {content}
    </section>
  );
}
