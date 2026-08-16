'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import type { StudentMaterial } from '@/lib/data/student-materials';
import {
  Search,
  BookOpen,
  Clock,
  ChevronRight,
  ArrowLeft,
  Users,
  Zap,
  BarChart3,
  Globe,
  Play,
  Star,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { getMateriaRoute, getStudentMaterialRoute, getUniversityRoute } from '@/lib/routes';
import { buildShareReferralUrl } from '@/lib/attribution';
import { getOfficialCareerProfile } from '@/lib/career-profiles';
import { useUser } from '@/hooks/useUser';
import { logError } from '@/lib/observability';
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
  sharedStudentMaterials?: StudentMaterial[];
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
    'introduccion al derecho': 'Bases del sistema jurídico, sus fuentes y conceptos esenciales.',
    'derecho civil': 'Principios civiles clave sobre personas, bienes y relaciones privadas.',
    'derecho penal': 'Delitos, responsabilidad penal y estructura básica del sistema punitivo.',
    'derecho constitucional': 'Organización del Estado, derechos fundamentales y control constitucional.',
    'derecho romano': 'Orígenes y categorías clásicas que influyen en el derecho actual.',
    'filosofia del derecho': 'Ideas, fundamentos y debates centrales sobre justicia y norma.',
    'historia del derecho': 'Evolución histórica de las instituciones jurídicas principales.',
    'economia': 'Conceptos económicos base para analizar decisiones, mercados y contexto.',
    'contabilidad': 'Registro, lectura e interpretación de información contable esencial.',
    'administracion': 'Herramientas de gestión, organización y toma de decisiones.',
    'marketing': 'Estrategias de mercado, posicionamiento y comportamiento del consumidor.',
    'matematica': 'Nociones cuantitativas para resolver problemas y fortalecer análisis.',
    'estadistica': 'Análisis de datos, probabilidades e interpretación de resultados.',
    'metodologia de la investigacion': 'Técnicas para investigar, argumentar y estructurar trabajos académicos.',
    'psicologia': 'Procesos de conducta, pensamiento y comprensión del comportamiento humano.',
    'sociologia': 'Análisis de instituciones, vínculos sociales y dinámicas colectivas.',
    'ingles': 'Comprensión y uso de inglés aplicado al entorno académico y profesional.',
    'informatica': 'Herramientas digitales y nociones técnicas útiles para la cursada.',
  };

  if (exactDescriptions[normalized]) {
    return exactDescriptions[normalized];
  }

  const keywordDescriptions: Array<[string, string]> = [
    ['derecho civil', 'Principios civiles clave sobre personas, bienes y relaciones privadas.'],
    ['derecho penal', 'Delitos, responsabilidad penal y estructura básica del sistema punitivo.'],
    ['derecho constitucional', 'Organización del Estado, derechos fundamentales y control constitucional.'],
    ['derecho comercial', 'Sociedades, contratos mercantiles y actividad empresarial.'],
    ['derecho laboral', 'Relaciones de trabajo, derechos laborales y normativa vigente.'],
    ['derecho internacional', 'Normas, tratados y relaciones entre Estados y actores globales.'],
    ['derecho administrativo', 'Función del Estado, administración pública y actos administrativos.'],
    ['derecho procesal', 'Etapas del proceso, reglas del litigio y técnicas de actuación.'],
    ['derecho tributario', 'Impuestos, obligaciones fiscales y marco tributario general.'],
    ['derecho ambiental', 'Regulación del ambiente, sostenibilidad y responsabilidad jurídica.'],
    ['filosofia', 'Ideas y problemas centrales para pensar fundamentos y argumentos.'],
    ['historia', 'Contexto histórico y evolución de procesos e instituciones relevantes.'],
    ['econom', 'Conceptos económicos base para analizar decisiones, incentivos y contexto.'],
    ['contab', 'Registro, lectura e interpretación de información contable esencial.'],
    ['admin', 'Herramientas de gestión, organización y toma de decisiones.'],
    ['marketing', 'Estrategias de mercado, posicionamiento y comportamiento del consumidor.'],
    ['matemat', 'Nociones cuantitativas para resolver problemas y fortalecer análisis.'],
    ['estad', 'Análisis de datos, probabilidades e interpretación de resultados.'],
    ['investig', 'Métodos para investigar, argumentar y presentar trabajo académico sólido.'],
    ['psicolog', 'Procesos de conducta, pensamiento y comprensión del comportamiento humano.'],
    ['sociolog', 'Análisis de instituciones, vínculos sociales y dinámicas colectivas.'],
    ['informat', 'Herramientas digitales y nociones técnicas útiles para la cursada.'],
    ['program', 'Lógica, estructuras y resolución de problemas con enfoque práctico.'],
    ['ingles', 'Comprensión y uso de inglés aplicado al entorno académico y profesional.'],
    ['comunic', 'Expresión, argumentación y estrategias de comunicación efectiva.'],
    ['metodolog', 'Métodos de estudio, investigación y construcción de conocimiento.'],
    ['practica', 'Aplicación concreta de contenidos con foco en resolución y criterio.'],
    ['laboratorio', 'Trabajo aplicado, observación y experimentación sobre contenidos clave.'],
    ['introduccion', 'Panorama inicial de conceptos, lenguaje y ejes fundamentales de la materia.'],
  ];

  for (const [keyword, description] of keywordDescriptions) {
    if (normalized.includes(keyword)) {
      return description;
    }
  }

  return `Panorama breve de ${nombre} con sus ejes esenciales y aplicación en la cursada.`;
}

function isLongMateriaTitle(nombre: string) {
  return nombre.trim().length > 28;
}

function getCareerMetaValue(value?: string | null) {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : null;
}

export default function MateriaList({
  initialMaterias,
  carreraId,
  carreraNombre,
  carreraData,
  universidadNombre,
  universidadId,
  sharedStudentMaterials = [],
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
        title: 'Iniciá sesión para guardar favoritos',
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
        title: 'Iniciá sesión para guardar favoritos',
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
      logError('materiaList.toggleCareerFavorite', error, { carreraId, userId: user.id });
      setIsCareerFavorite(!nextValue);
    } finally {
      setCareerFavoriteLoading(false);
    }
  };

  const shareCareer = async () => {
    const basePath = `/materias?carreraId=${encodeURIComponent(carreraId)}`;
    const shareUrl =
      user?.id
        ? buildShareReferralUrl(basePath, user.id).replace('resultado_simulador', 'carrera')
        : typeof window !== 'undefined'
          ? new URL(basePath, window.location.origin).toString()
          : basePath;

    const shareTitle = carreraNombre || carreraData?.nombre || 'Carrera';
    const shareText = `Mirá esta carrera en Evaluo: ${shareTitle}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copiado',
          description: 'Ya podés compartir esta carrera.',
          duration: 2200,
        });
      }
    } catch (error) {
      const isAbortError = error instanceof DOMException && error.name === 'AbortError';
      if (isAbortError) return;

      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: 'Link copiado',
            description: 'Ya podés compartir esta carrera.',
            duration: 2200,
          });
          return;
        }
      } catch {
        // ignore clipboard fallback error
      }

      toast({
        title: 'No pudimos compartir la carrera',
        description: 'Probá nuevamente en unos segundos.',
        duration: 2500,
      });
    }
  };

  const materiasFiltradas = materias.filter((materia) =>
    materia.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  const materiaNameById = new Map(materias.map((materia) => [materia.id, materia.nombre]));
  const officialCareerProfile = getOfficialCareerProfile({
    universidadNombre,
    carreraNombre: carreraNombre ?? carreraData?.nombre,
  });
  const careerDescription =
    getCareerMetaValue(carreraData?.descripcion) ??
    officialCareerProfile?.description ??
    `${carreraNombre || 'Esta carrera'} ofrece un recorrido académico orientado a construir bases sólidas, desarrollar criterio práctico y avanzar materia por materia dentro de un plan claro.`;
  const careerDuration =
    getCareerMetaValue(carreraData?.carga_horaria) ?? officialCareerProfile?.duration ?? null;
  const careerLevel =
    getCareerMetaValue(carreraData?.nivel) ?? officialCareerProfile?.level ?? null;
  const careerTitle = officialCareerProfile?.title ?? null;

  return (
    <div className="animate-page-enter min-h-screen bg-[#F5F7FB]">
      <div className="w-full border-b border-[#E8EDF5] bg-[#F8FAFC]">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center px-4 py-2.5 lg:px-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm leading-6">
            <Link
              href="/explorar"
              className="flex items-center gap-1 text-slate-500 transition-colors hover:text-[#0F172A]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="sm:hidden">Volver</span>
              <span className="hidden sm:inline">Universidades</span>
            </Link>
            <ChevronRight className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            <Link
              href={universidadId ? getUniversityRoute(universidadId) : '/explorar'}
              className="hidden max-w-[140px] truncate text-slate-500 transition-colors hover:text-[#0F172A] sm:block sm:max-w-none"
            >
              {universidadNombre || 'Universidad'}
            </Link>
            <ChevronRight className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            <span className="max-w-[190px] truncate font-medium text-slate-700 sm:max-w-none">
              {carreraNombre || 'Carrera'}
            </span>
          </nav>
        </div>
      </div>

      <section className="relative min-h-[240px] w-full overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] shadow-2xl sm:min-h-[280px]">
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,#0F172A_0%,#0F172A_28%,rgba(15,23,42,0.94)_42%,rgba(15,23,42,0.76)_56%,rgba(15,23,42,0.42)_70%,rgba(15,23,42,0.16)_84%,rgba(15,23,42,0.04)_100%)] lg:block" />
        <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_78%_36%,rgba(99,102,241,0.18),transparent_24%)] lg:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-t from-[#0F172A]/32 via-transparent to-[#0F172A]/10 lg:block" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/88 to-[#1E293B]/55 lg:hidden" />
        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 py-4 lg:px-8 lg:py-8">
          <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/5 sm:h-24 sm:w-24">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white sm:h-[80px] sm:w-[80px]">
                <Zap className="h-5 w-5 sm:h-9 sm:w-9" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-bold leading-tight tracking-[-0.05em] text-white drop-shadow-lg sm:text-[32px]">
                  {carreraNombre || 'Abogacía'}
                </h1>
              </div>
              <div className="mt-4 grid grid-cols-2 items-center gap-3 text-white xl:grid-cols-4">
                {careerDuration ? (
                  <div className="flex min-h-[48px] items-center gap-3">
                    <Clock className="h-4 w-4 shrink-0 text-white/90" />
                    <div>
                      <p className="text-sm font-semibold text-white drop-shadow">{careerDuration}</p>
                      <p className="mt-0.5 text-xs text-white/60">Duración</p>
                    </div>
                  </div>
                ) : null}
                <div className="flex min-h-[48px] items-center gap-3">
                  <BookOpen className="h-4 w-4 shrink-0 text-white/90" />
                  <div>
                    <p className="text-sm font-semibold text-white drop-shadow">{materias.length} materias</p>
                    <p className="mt-0.5 text-xs text-white/60">Plan de estudios</p>
                  </div>
                </div>
                {careerLevel ? (
                  <div className="flex min-h-[48px] items-center gap-3">
                    <Users className="h-4 w-4 shrink-0 text-white/90" />
                    <div>
                      <p className="text-sm font-semibold text-white drop-shadow">{careerLevel}</p>
                      <p className="mt-0.5 text-xs text-white/60">Tipo de programa</p>
                    </div>
                  </div>
                ) : null}
                {careerTitle ? (
                  <div className="flex min-h-[48px] items-center gap-3">
                    <Users className="h-4 w-4 shrink-0 text-white/90" />
                    <div>
                      <p className="text-sm font-semibold text-white drop-shadow">{careerTitle}</p>
                      <p className="mt-0.5 text-xs text-white/60">Título</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="grid w-full self-center grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={shareCareer}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15 sm:px-5 sm:py-3"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Compartir carrera</span>
                <span className="sm:hidden">Compartir</span>
              </button>
              <button
                type="button"
                onClick={toggleCareerFavorite}
                disabled={careerFavoriteLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15 disabled:opacity-60 sm:px-5 sm:py-3"
              >
                <Star className={`h-4 w-4 ${isCareerFavorite ? 'fill-current text-yellow-400' : ''}`} />
                <span className="hidden sm:inline">{isCareerFavorite ? 'Guardada' : 'Guardar carrera'}</span>
                <span className="sm:hidden">{isCareerFavorite ? 'Guardada' : 'Guardar'}</span>
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
                  ? 'bg-[#EEF2FF] text-[#2563EB] shadow-[0_12px_30px_rgba(37,99,235,0.12)] sm:bg-transparent sm:shadow-none sm:after:absolute sm:after:bottom-0 sm:after:left-0 sm:after:h-0.5 sm:after:w-full sm:after:bg-[#2563EB] sm:after:content-[""]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 sm:hover:bg-transparent'
              }`}
            >
              Plan de estudios
            </button>
            <button
              onClick={() => setActiveTab('informacion')}
              className={`relative rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 sm:rounded-none sm:px-0 sm:py-4 ${
                activeTab === 'informacion'
                  ? 'bg-[#EEF2FF] text-[#2563EB] shadow-[0_12px_30px_rgba(37,99,235,0.12)] sm:bg-transparent sm:shadow-none sm:after:absolute sm:after:bottom-0 sm:after:left-0 sm:after:h-0.5 sm:after:w-full sm:after:bg-[#2563EB] sm:after:content-[""]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 sm:hover:bg-transparent'
              }`}
            >
              Información
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
        {activeTab === 'plan' && (
          <div className="animate-tab-panel">
            <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="section-title text-[1.6rem] text-slate-900 sm:text-3xl">Plan de estudios</h2>
                <p className="section-copy mt-1 text-sm text-slate-600">Explorá todas las materias de la carrera</p>
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

            <div className="grid auto-rows-fr grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {materiasFiltradas.map((materia, index) => {
                const icono = getIconoMateria(index);
                const IconComponent = icono.icon;
                const isFavorite = favorites.has(materia.id);
                const isFavoriteLoading = favoritesLoading.has(materia.id);
                const isLongTitle = isLongMateriaTitle(materia.nombre);

                return (
                  <Card
                    key={materia.id}
                    className="surface-card animate-saas-lift-in min-h-[184px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#CBD5E1] hover:shadow-[var(--shadow-panel)]"
                  >
                    <CardContent className="flex h-full flex-col p-4 text-left">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 flex-col gap-3">
                          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${icono.bg}`}>
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
                            <p className="mt-1.5 line-clamp-2 max-w-full text-[12px] leading-5 text-[#7C879C]">
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
                                : 'border-slate-200 bg-white text-slate-500 hover:-translate-y-0.5 hover:border-slate-300 hover:text-amber-500 hover:shadow-md'
                          }`}
                          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          title={user ? (isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos') : 'Iniciá sesión para guardar favoritos'}
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
                      <div className="mt-auto pt-4">
                        <Link href={getMateriaRoute(materia.id, carreraId)}>
                          <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8EDF5] bg-white px-4 py-2.5 text-sm font-semibold text-[#2563EB] transition-colors duration-200 hover:border-[#93C5FD] hover:bg-[#F8FAFF]">
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
                  <p className="text-slate-500">Probá con otra búsqueda</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'informacion' && (
          <div className="hidden">
            <div className="mx-auto max-w-5xl rounded-3xl border border-[#E8EDF5] bg-white p-8 text-left shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-3xl">
                  <h2 className="section-title mb-3 text-slate-800 sm:text-[2rem]">Información de la carrera</h2>
                  <p className="text-sm leading-7 text-slate-600">{careerDescription}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {careerDuration ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="block text-xs uppercase tracking-wide text-slate-500">Duración</span>
                    <span className="mt-1 block font-semibold">{careerDuration}</span>
                  </div>
                ) : null}
                {careerTitle ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="block text-xs uppercase tracking-wide text-slate-500">Título otorgado</span>
                    <span className="mt-1 block font-semibold">{careerTitle}</span>
                  </div>
                ) : null}
                {careerLevel ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="block text-xs uppercase tracking-wide text-slate-500">Tipo de programa</span>
                    <span className="mt-1 block font-semibold">{careerLevel}</span>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span className="block text-xs uppercase tracking-wide text-slate-500">Materias visibles</span>
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
              Resúmenes, simuladores y materiales de apoyo para aprobar todas las materias.
            </p>
          </div>
        )}

        {activeTab === 'recursos' && (
          <div className="animate-tab-panel mx-auto max-w-6xl space-y-6 pb-12">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-900">
                    PDFs compartidos por estudiantes
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                    Materiales subidos desde el espacio personal de alumnos de esta carrera y
                    ordenados por materia para que puedas entrar directo al documento correcto.
                  </p>
                </div>

                <Link
                  href="/dashboard/materiales"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
                >
                  Subir mi PDF
                </Link>
              </div>
            </div>

            {sharedStudentMaterials.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                <BarChart3 className="mx-auto mb-6 h-16 w-16 text-slate-300" />
                <h3 className="text-2xl font-bold text-slate-800">Todavía no hay PDFs compartidos</h3>
                <p className="mx-auto mt-3 max-w-md text-slate-600">
                  Cuando los estudiantes de esta carrera suban apuntes a su espacio, los vas a ver
                  acá listos para abrir.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {sharedStudentMaterials.map((material) => (
                  <article
                    key={material.id}
                    className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#2563EB]">
                          <Globe className="h-3.5 w-3.5" />
                          Compartido
                        </div>
                        <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-slate-900">
                          {material.title}
                        </h3>
                      </div>
                      {material.page_count ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-semibold text-slate-600">
                          {material.page_count} páginas
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      {materiaNameById.get(material.materia_id) ?? 'Materia'} ·{' '}
                      {new Date(material.created_at).toLocaleDateString('es-AR')}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        href={getStudentMaterialRoute(material.id)}
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Abrir PDF
                      </Link>
                      <Link
                        href={getMateriaRoute(material.materia_id, carreraId)}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                      >
                        Ir a la materia
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'comunidad' && (
          <div className="animate-tab-panel py-20 text-center">
            <Users className="mx-auto mb-6 h-16 w-16 text-slate-300" />
            <h2 className="mb-4 text-2xl font-bold text-slate-800">Comunidad</h2>
            <p className="mx-auto max-w-md text-slate-600">
              Únete a estudiantes y profesores para compartir tips y dudas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
