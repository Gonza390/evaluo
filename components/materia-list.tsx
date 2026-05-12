'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import {
  Search,
  BookOpen,
  Clock,
  ChevronRight,
  ArrowLeft,
  Users,
  Zap,
  BarChart3,
  Play,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { getMateriaRoute, getUniversityRoute } from '@/lib/routes';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/components/ui/use-toast';

interface Materia {
  id: string;
  nombre: string;
  slug?: string;
  descripcion?: string;
}

interface Carrera {
  id: string;
  nombre: string;
  descripcion?: string;
  universidad_id?: string | null;
  nivel?: string;
  carga_horaria?: string;
  modalidad?: string;
  director?: string;
}

interface MateriaListProps {
  initialMaterias: Materia[];
  carreraId: string;
  carreraNombre?: string;
  carreraData?: Carrera;
  universidadNombre?: string;
  universidadId?: string;
}

const ICONOS_MATERIAS = [
  { bg: 'bg-blue-100', color: 'text-blue-600', icon: BookOpen },
  { bg: 'bg-green-100', color: 'text-green-600', icon: BookOpen },
  { bg: 'bg-purple-100', color: 'text-purple-600', icon: BookOpen },
  { bg: 'bg-orange-100', color: 'text-orange-600', icon: BookOpen },
  { bg: 'bg-pink-100', color: 'text-pink-600', icon: BookOpen },
  { bg: 'bg-cyan-100', color: 'text-cyan-600', icon: BookOpen },
  { bg: 'bg-amber-100', color: 'text-amber-600', icon: BookOpen },
  { bg: 'bg-emerald-100', color: 'text-emerald-600', icon: BookOpen },
];

function getIconoMateria(index: number) {
  return ICONOS_MATERIAS[index % ICONOS_MATERIAS.length];
}

function normalizeMateriaName(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getDescripcionMateria(nombre: string) {
  const normalized = normalizeMateriaName(nombre);

  const exactDescriptions: Record<string, string> = {
    'introduccion al derecho': 'Bases del sistema juridico, sus fuentes y conceptos esenciales.',
    'derecho civil': 'Principios civiles clave sobre personas, bienes y relaciones privadas.',
    'derecho penal': 'Delitos, responsabilidad penal y estructura basica del sistema punitivo.',
    'derecho constitucional': 'Organizacion del Estado, derechos fundamentales y control constitucional.',
    'derecho romano': 'Origenes y categorias clasicas que influyen en el derecho actual.',
    'filosofia del derecho': 'Ideas, fundamentos y debates centrales sobre justicia y norma.',
    'historia del derecho': 'Evolucion historica de las instituciones juridicas principales.',
    'economia': 'Conceptos economicos base para analizar decisiones, mercados y contexto.',
    'contabilidad': 'Registro, lectura e interpretacion de informacion contable esencial.',
    'administracion': 'Herramientas de gestion, organizacion y toma de decisiones.',
    'marketing': 'Estrategias de mercado, posicionamiento y comportamiento del consumidor.',
    'matematica': 'Nociones cuantitativas para resolver problemas y fortalecer analisis.',
    'estadistica': 'Analisis de datos, probabilidades e interpretacion de resultados.',
    'metodologia de la investigacion': 'Tecnicas para investigar, argumentar y estructurar trabajos academicos.',
    'psicologia': 'Procesos de conducta, pensamiento y comprension del comportamiento humano.',
    'sociologia': 'Analisis de instituciones, vinculos sociales y dinamicas colectivas.',
    'ingles': 'Comprension y uso de ingles aplicado al entorno academico y profesional.',
    'informatica': 'Herramientas digitales y nociones tecnicas utiles para la cursada.',
  };

  if (exactDescriptions[normalized]) {
    return exactDescriptions[normalized];
  }

  const keywordDescriptions: Array<[string, string]> = [
    ['derecho civil', 'Principios civiles clave sobre personas, bienes y relaciones privadas.'],
    ['derecho penal', 'Delitos, responsabilidad penal y estructura basica del sistema punitivo.'],
    ['derecho constitucional', 'Organizacion del Estado, derechos fundamentales y control constitucional.'],
    ['derecho comercial', 'Sociedades, contratos mercantiles y actividad empresarial.'],
    ['derecho laboral', 'Relaciones de trabajo, derechos laborales y normativa vigente.'],
    ['derecho internacional', 'Normas, tratados y relaciones entre Estados y actores globales.'],
    ['derecho administrativo', 'Funcion del Estado, administracion publica y actos administrativos.'],
    ['derecho procesal', 'Etapas del proceso, reglas del litigio y tecnicas de actuacion.'],
    ['derecho tributario', 'Impuestos, obligaciones fiscales y marco tributario general.'],
    ['derecho ambiental', 'Regulacion del ambiente, sostenibilidad y responsabilidad juridica.'],
    ['filosofia', 'Ideas y problemas centrales para pensar fundamentos y argumentos.'],
    ['historia', 'Contexto historico y evolucion de procesos e instituciones relevantes.'],
    ['econom', 'Conceptos economicos base para analizar decisiones, incentivos y contexto.'],
    ['contab', 'Registro, lectura e interpretacion de informacion contable esencial.'],
    ['admin', 'Herramientas de gestion, organizacion y toma de decisiones.'],
    ['marketing', 'Estrategias de mercado, posicionamiento y comportamiento del consumidor.'],
    ['matemat', 'Nociones cuantitativas para resolver problemas y fortalecer analisis.'],
    ['estad', 'Analisis de datos, probabilidades e interpretacion de resultados.'],
    ['investig', 'Metodos para investigar, argumentar y presentar trabajo academico solido.'],
    ['psicolog', 'Procesos de conducta, pensamiento y comprension del comportamiento humano.'],
    ['sociolog', 'Analisis de instituciones, vinculos sociales y dinamicas colectivas.'],
    ['informat', 'Herramientas digitales y nociones tecnicas utiles para la cursada.'],
    ['program', 'Logica, estructuras y resolucion de problemas con enfoque practico.'],
    ['ingles', 'Comprension y uso de ingles aplicado al entorno academico y profesional.'],
    ['comunic', 'Expresion, argumentacion y estrategias de comunicacion efectiva.'],
    ['metodolog', 'Metodos de estudio, investigacion y construccion de conocimiento.'],
    ['practica', 'Aplicacion concreta de contenidos con foco en resolucion y criterio.'],
    ['laboratorio', 'Trabajo aplicado, observacion y experimentacion sobre contenidos clave.'],
    ['introduccion', 'Panorama inicial de conceptos, lenguaje y ejes fundamentales de la materia.'],
  ];

  for (const [keyword, description] of keywordDescriptions) {
    if (normalized.includes(keyword)) {
      return description;
    }
  }

  return `Panorama breve de ${nombre} con sus ejes esenciales y aplicacion en la cursada.`;
}

function isLongMateriaTitle(nombre: string) {
  return nombre.trim().length > 28;
}

export default function MateriaList({
  initialMaterias,
  carreraId,
  carreraNombre,
  carreraData,
  universidadNombre,
  universidadId,
}: MateriaListProps) {
  const [materias] = useState<Materia[]>(initialMaterias);
  const [busqueda, setBusqueda] = useState('');
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState<Set<string>>(new Set());
  const [isCareerFavorite, setIsCareerFavorite] = useState(false);
  const [careerFavoriteLoading, setCareerFavoriteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'informacion' | 'plan' | 'recursos' | 'comunidad'>('plan');

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user || materias.length === 0) {
        setFavorites(new Set());
        return;
      }

      const materiaIds = materias.map((materia) => materia.id);
      const { data, error } = await supabase
        .from('user_favorites')
        .select('materia_id')
        .eq('user_id', user.id)
        .in('materia_id', materiaIds);

      if (error) return;

      const favoriteIds = (data ?? [])
        .map((favorite) => favorite.materia_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);
      setFavorites(new Set(favoriteIds));
    };

    loadFavorites();
  }, [user, materias]);

  useEffect(() => {
    const loadCareerFavorite = async () => {
      if (!user || !carreraId) {
        setIsCareerFavorite(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('carrera_id', carreraId)
        .maybeSingle();

      if (error) return;
      setIsCareerFavorite(Boolean(data));
    };

    void loadCareerFavorite();
  }, [carreraId, user]);

  const toggleFavorite = async (materiaId: string) => {
    if (!user) {
      toast({
        title: 'Inicia sesion para guardar favoritos',
        description: 'Te llevamos al login para guardar esta materia.',
        duration: 2500,
      });
      router.push('/login');
      return;
    }
    if (favoritesLoading.has(materiaId)) return;

    setFavoritesLoading((prev) => new Set(prev).add(materiaId));
    const wasFavorite = favorites.has(materiaId);

    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (wasFavorite) {
        newFavorites.delete(materiaId);
      } else {
        newFavorites.add(materiaId);
      }
      return newFavorites;
    });

    try {
      if (wasFavorite) {
        await supabase.from('user_favorites').delete().eq('user_id', user.id).eq('materia_id', materiaId);
      } else {
        await supabase.from('user_favorites').insert({ user_id: user.id, materia_id: materiaId });
      }
    } catch {
      setFavorites((prev) => {
        const newFavorites = new Set(prev);
        if (wasFavorite) {
          newFavorites.add(materiaId);
        } else {
          newFavorites.delete(materiaId);
        }
        return newFavorites;
      });
    } finally {
      setFavoritesLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(materiaId);
        return newSet;
      });
    }
  };

  const toggleCareerFavorite = async () => {
    if (!carreraId || careerFavoriteLoading) return;

    if (!user) {
      toast({
        title: 'Inicia sesion para guardar favoritos',
        description: 'Te llevamos al login para guardar esta carrera.',
        duration: 2500,
      });
      router.push('/login');
      return;
    }

    const nextValue = !isCareerFavorite;
    setIsCareerFavorite(nextValue);
    setCareerFavoriteLoading(true);

    try {
      if (nextValue) {
        await supabase.from('user_favorites').insert({ user_id: user.id, carrera_id: carreraId });
      } else {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('carrera_id', carreraId);
      }
    } catch (error) {
      console.error('Career favorite toggle error:', error);
      setIsCareerFavorite(!nextValue);
    } finally {
      setCareerFavoriteLoading(false);
    }
  };

  const materiasFiltradas = materias.filter((materia) =>
    materia.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="animate-page-enter min-h-screen bg-[#F5F7FB]">
      <div className="w-full border-b border-[#E8EDF5] bg-[#F8FAFC]">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center px-4 py-3 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm leading-6">
            <Link
              href="/explorar"
              className="flex items-center gap-1 text-slate-500 transition-colors hover:text-[#0F172A]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Universidades</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link
              href={universidadId ? getUniversityRoute(universidadId) : '/explorar'}
              className="max-w-[140px] truncate text-slate-500 transition-colors hover:text-[#0F172A] sm:max-w-none"
            >
              {universidadNombre || 'Universidad'}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="max-w-[190px] truncate font-medium text-slate-700 sm:max-w-none">
              {carreraNombre || 'Carrera'}
            </span>
          </nav>
        </div>
      </div>

      <section className="relative min-h-[280px] w-full overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] shadow-2xl sm:min-h-[280px]">
        <div
          className="absolute inset-0 hidden h-full w-full bg-cover bg-center lg:block"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80)' }}
        />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,#0F172A_0%,#0F172A_28%,rgba(15,23,42,0.94)_42%,rgba(15,23,42,0.76)_56%,rgba(15,23,42,0.42)_70%,rgba(15,23,42,0.16)_84%,rgba(15,23,42,0.04)_100%)] lg:block" />
        <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_78%_36%,rgba(99,102,241,0.18),transparent_24%)] lg:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-t from-[#0F172A]/32 via-transparent to-[#0F172A]/10 lg:block" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/88 to-[#1E293B]/55 lg:hidden" />
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 py-5 lg:px-8 lg:py-8">
          <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/5 sm:h-24 sm:w-24">
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/20 text-white sm:h-[80px] sm:w-[80px]">
                <Zap className="h-8 w-8 sm:h-9 sm:w-9" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-bold leading-tight tracking-[-0.05em] text-white drop-shadow-lg sm:text-[32px]">
                  {carreraNombre || 'Abogacia'}
                </h1>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 text-white sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-white/90" />
                  <div>
                    <p className="text-sm font-semibold text-white drop-shadow">{carreraData?.carga_horaria || '5 anos'}</p>
                    <p className="mt-0.5 text-xs text-white/60">Duracion</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-white/90" />
                  <div>
                    <p className="text-sm font-semibold text-white drop-shadow">{materias.length} materias</p>
                    <p className="mt-0.5 text-xs text-white/60">Plan de estudios</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-white/90" />
                  <div>
                    <p className="text-sm font-semibold text-white drop-shadow">{carreraData?.modalidad || 'Presencial'}</p>
                    <p className="mt-0.5 text-xs text-white/60">Modalidad</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-white/90" />
                  <div>
                    <p className="text-sm font-semibold text-white drop-shadow">{carreraData?.nivel || 'Grado'}</p>
                    <p className="mt-0.5 text-xs text-white/60">Nivel</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={toggleCareerFavorite}
                disabled={careerFavoriteLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15 disabled:opacity-60"
              >
                <Star className={`h-4 w-4 ${isCareerFavorite ? 'fill-current text-yellow-400' : ''}`} />
                {isCareerFavorite ? 'Guardada' : 'Guardar carrera'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-2 gap-2 py-3 sm:flex sm:gap-6 sm:py-0">
            <button
              onClick={() => setActiveTab('plan')}
              className={`relative rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 sm:rounded-none sm:px-0 sm:py-4 ${
                activeTab === 'plan'
                  ? 'bg-[#EEF2FF] text-[#4F5DFF] shadow-[0_12px_30px_rgba(79,93,255,0.12)] sm:bg-transparent sm:shadow-none sm:after:absolute sm:after:bottom-0 sm:after:left-0 sm:after:h-0.5 sm:after:w-full sm:after:bg-[#4F5DFF] sm:after:content-[""]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 sm:hover:bg-transparent'
              }`}
            >
              Plan de estudios
            </button>
            <button
              onClick={() => setActiveTab('informacion')}
              className={`relative rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 sm:rounded-none sm:px-0 sm:py-4 ${
                activeTab === 'informacion'
                  ? 'bg-[#EEF2FF] text-[#4F5DFF] shadow-[0_12px_30px_rgba(79,93,255,0.12)] sm:bg-transparent sm:shadow-none sm:after:absolute sm:after:bottom-0 sm:after:left-0 sm:after:h-0.5 sm:after:w-full sm:after:bg-[#4F5DFF] sm:after:content-[""]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 sm:hover:bg-transparent'
              }`}
            >
              Informacion
            </button>
            <button
              onClick={() => setActiveTab('recursos')}
              className={`relative rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 sm:rounded-none sm:px-0 sm:py-4 ${
                activeTab === 'recursos'
                  ? 'bg-[#EEF2FF] text-[#4F5DFF] shadow-[0_12px_30px_rgba(79,93,255,0.12)] sm:bg-transparent sm:shadow-none sm:after:absolute sm:after:bottom-0 sm:after:left-0 sm:after:h-0.5 sm:after:w-full sm:after:bg-[#4F5DFF] sm:after:content-[""]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 sm:hover:bg-transparent'
              }`}
            >
              Recursos
            </button>
            <button
              onClick={() => setActiveTab('comunidad')}
              className={`relative rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 sm:rounded-none sm:px-0 sm:py-4 ${
                activeTab === 'comunidad'
                  ? 'bg-[#EEF2FF] text-[#4F5DFF] shadow-[0_12px_30px_rgba(79,93,255,0.12)] sm:bg-transparent sm:shadow-none sm:after:absolute sm:after:bottom-0 sm:after:left-0 sm:after:h-0.5 sm:after:w-full sm:after:bg-[#4F5DFF] sm:after:content-[""]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 sm:hover:bg-transparent'
              }`}
            >
              Comunidad
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {activeTab === 'plan' && (
          <div className="animate-tab-panel">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="section-title text-slate-900 sm:text-3xl">Plan de estudios</h2>
                <p className="section-copy mt-1 text-slate-600">Explora todas las materias de la carrera</p>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar materia..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm ring-blue-500 focus:border-blue-500 focus:outline-none focus:ring-1 sm:w-72"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>

            <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {materiasFiltradas.map((materia, index) => {
                const icono = getIconoMateria(index);
                const IconComponent = icono.icon;
                const isFavorite = favorites.has(materia.id);
                const isFavoriteLoading = favoritesLoading.has(materia.id);
                const isLongTitle = isLongMateriaTitle(materia.nombre);

                return (
                  <Card
                    key={materia.id}
                    className="surface-card animate-saas-lift-in min-h-[220px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#CBD5E1] hover:shadow-[var(--shadow-panel)]"
                  >
                    <CardContent className="flex h-full flex-col p-5 text-left">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 flex-col gap-4">
                          <div className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${icono.bg}`}>
                            <IconComponent className={`h-5 w-5 ${icono.color}`} />
                          </div>
                          <div className="min-w-0">
                            <h3
                              className={`text-[#152A63] ${
                                isLongTitle
                                  ? 'line-clamp-3 text-[15px] font-semibold leading-5 tracking-[-0.02em]'
                                  : 'line-clamp-2 text-[17px] font-semibold leading-6 tracking-[-0.03em]'
                              }`}
                            >
                              {materia.nombre}
                            </h3>
                            <p className="mt-2 line-clamp-3 max-w-full text-[13px] leading-5 text-[#7C879C]">
                              {materia.descripcion || getDescripcionMateria(materia.nombre)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(materia.id)}
                          className={`shrink-0 rounded-xl border p-2 shadow-sm transition-all duration-300 ${
                            isFavorite
                                ? 'border-amber-300 bg-gradient-to-br from-amber-100 via-white to-amber-50 text-amber-500 shadow-amber-100 hover:-translate-y-0.5 hover:shadow-md'
                                : 'border-slate-200 bg-white text-slate-400 hover:-translate-y-0.5 hover:border-slate-300 hover:text-amber-500 hover:shadow-md'
                          }`}
                          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          title={user ? (isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos') : 'Inicia sesion para guardar favoritos'}
                          disabled={isFavoriteLoading}
                        >
                          {isFavoriteLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                          ) : (
                            <Star
                              className={`h-4 w-4 transition-transform duration-300 ${
                                isFavorite ? 'fill-current text-amber-500' : ''
                              }`}
                            />
                          )}
                        </button>
                      </div>
                      <div className="mt-auto pt-5">
                        <Link href={getMateriaRoute(materia.id, carreraId)}>
                          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8EDF5] bg-white px-4 py-3 text-sm font-semibold text-[#4F5DFF] transition-colors duration-200 hover:border-[#C7D2FE] hover:bg-[#F8FAFF]">
                            <Play className="h-3.5 w-3.5" />
                            Ver materia
                          </button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {materiasFiltradas.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <Search className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                  <h3 className="mb-2 text-xl font-semibold text-slate-800">No se encontraron materias</h3>
                  <p className="text-slate-500">Prueba con otra busqueda</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'informacion' && (
          <div className="animate-tab-panel py-20 text-center">
            <div className="mx-auto max-w-3xl rounded-3xl border border-[#E8EDF5] bg-white p-8 text-left shadow-sm">
              <h2 className="section-title mb-4 text-slate-800 sm:text-[2rem]">Informacion de la carrera</h2>
              <p className="text-sm leading-7 text-slate-600">
                {carreraData?.descripcion ||
                  `${carreraNombre || 'Esta carrera'} ofrece un recorrido academico orientado a construir bases solidas, desarrollar criterio practico y avanzar materia por materia dentro de un plan claro.`}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span className="block text-xs uppercase tracking-wide text-slate-400">Duracion</span>
                  <span className="mt-1 block font-semibold">{carreraData?.carga_horaria || '5 anos'}</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span className="block text-xs uppercase tracking-wide text-slate-400">Modalidad</span>
                  <span className="mt-1 block font-semibold">{carreraData?.modalidad || 'Presencial'}</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span className="block text-xs uppercase tracking-wide text-slate-400">Nivel</span>
                  <span className="mt-1 block font-semibold">{carreraData?.nivel || 'Grado'}</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span className="block text-xs uppercase tracking-wide text-slate-400">Materias visibles</span>
                  <span className="mt-1 block font-semibold">{materias.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recursos' && (
          <div className="animate-tab-panel py-20 text-center">
            <BarChart3 className="mx-auto mb-6 h-16 w-16 text-slate-300" />
            <h2 className="mb-4 text-2xl font-bold text-slate-800">Recursos disponibles</h2>
            <p className="mx-auto max-w-md text-slate-600">
              Resumenes, simuladores y materiales de apoyo para aprobar todas las materias.
            </p>
          </div>
        )}

        {activeTab === 'comunidad' && (
          <div className="animate-tab-panel py-20 text-center">
            <Users className="mx-auto mb-6 h-16 w-16 text-slate-300" />
            <h2 className="mb-4 text-2xl font-bold text-slate-800">Comunidad</h2>
            <p className="mx-auto max-w-md text-slate-600">
              Unete a estudiantes y profesores para compartir tips y dudas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
