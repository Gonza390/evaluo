import { supabase } from '@/lib/supabase';

export interface Carrera {
  id: string;
  nombre: string;
  universidad_id?: string | null;
}

export async function getCarrerasByUni(uniId: string): Promise<Carrera[]> {
  const { data, error } = await supabase
    .from('carreras')
    .select('id, nombre')
    .eq('universidad_id', uniId)
    .order('nombre');

  if (error) throw new Error(error.message);
  return data || [];
}

export interface Materia {
  id: string;
  nombre: string;
  carrera_id?: string | null;
}

export async function getMateriasByCarrera(carreraId: string): Promise<Materia[]> {
  const { data, error } = await supabase
    .from('materias')
    .select('*, carrera_materias!inner(prioridad)')
    .eq('carrera_materias.carrera_id', carreraId);

  if (error) {
    console.error('Error fetching materias:', error);
    return [];
  }

  if (!data) return [];

  const typedData = data as Array<
    Materia & { carrera_materias?: Array<{ prioridad: number | null }> }
  >;

  return typedData.sort((a, b) => {
    const prioA = a.carrera_materias?.[0]?.prioridad ?? 2;
    const prioB = b.carrera_materias?.[0]?.prioridad ?? 2;
    if (prioA !== prioB) return prioA - prioB;
    return a.nombre.localeCompare(b.nombre);
  });
}

export async function getMateriaById(materiaId: string): Promise<Materia> {
  const { data, error } = await supabase
    .from('materias')
    .select('id, nombre, carrera_id')
    .eq('id', materiaId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Materia no encontrada');
  return data;
}

export async function getCarreraById(carreraId: string): Promise<Carrera> {
  const { data, error } = await supabase
    .from('carreras')
    .select('id, nombre, universidad_id')
    .eq('id', carreraId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Carrera no encontrada');
  return data;
}

export interface Universidad {
  id: string;
  nombre: string;
}

export async function getUniversidadById(uniId: string): Promise<Universidad> {
  const { data, error } = await supabase
    .from('universidades')
    .select('id, nombre')
    .eq('id', uniId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Universidad no encontrada');
  return data;
}

export async function getUniversidades() {
  const { data, error } = await supabase.from('universidades').select('id, nombre').order('nombre');

  if (error) throw new Error(error.message);
  return data || [];
}
