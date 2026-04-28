'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/hooks/use-toast';
import { getCareerRoute, getUniversityRoute } from '@/lib/routes';
import { getDashboardState, saveDashboardState } from '@/app/actions';
import { pushActivityHit, pushRecentResource } from '@/lib/dashboard-client';
import {
  ArrowLeft,
  FileText,
  Star,
  BookOpen,
  Clock,
  ChevronRight,
  Users,
  Search,
  GraduationCap,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Trophy,
  Zap,
  Eye,
  Download,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PdfViewer from '@/components/PdfViewer';

interface Resumen {
  id: string;
  title: string;
  author_name: string | null;
  file_url: string | null;
  module_id: string | number | null;
  score: number | null;
  created_at: string | null;
  pages?: number | null;
}

interface RecursoResumenRow {
  id: string;
  nombre: string;
  url_archivo: string | null;
  creado_at: string | null;
  etiqueta: string | null;
  paginas: number | null;
}

interface Unidad {
  id: number;
  nombre: string;
  descripcion: string;
  resumenesCount: number;
}

interface RecursoArchivo {
  id: string;
  nombre: string;
  tipo: string | null;
  url_archivo: string | null;
  creado_at: string | null;
  materia_id: string | null;
}

interface PreviewDocument {
  title: string;
  url: string;
}

interface MateriaContentProps {
  materiaId: string;
  materiaNombre?: string;
  carreraId?: string;
  carreraNombre?: string;
  universidadId?: string;
  universidadNombre?: string;
}

const unidades: Unidad[] = [
  { id: 1, nombre: 'Modulo 1', descripcion: 'Conceptos base y mapa general de la materia.', resumenesCount: 3 },
  { id: 2, nombre: 'Modulo 2', descripcion: 'Desarrollo teorico y criterios de resolucion.', resumenesCount: 2 },
  { id: 3, nombre: 'Modulo 3', descripcion: 'Aplicaciones practicas y casos tipicos.', resumenesCount: 4 },
  { id: 4, nombre: 'Modulo 4', descripcion: 'Integracion y ejercitacion de examen.', resumenesCount: 2 },
];

function getResumenRating(score: number | null | undefined) {
  const normalized = Math.max(0, Math.min(5, Math.round((score ?? 0) / 20)));
  return Array.from({ length: 5 }, (_, index) => index < normalized);
}

function isLongMateriaTitle(nombre: string) {
  return nombre.trim().length > 28;
}

function normalizeLabel(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getModuleNumber(value: string) {
  const normalized = normalizeLabel(value);
  const match = normalized.match(/modulo\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

function buildResumenKey(resumen: Resumen) {
  const fileKey = resumen.file_url?.trim().toLowerCase();
  if (fileKey) {
    return fileKey;
  }

  return `${normalizeLabel(resumen.title)}::${String(resumen.module_id ?? '')}`;
}

function scoreResumenCompleteness(resumen: Resumen) {
  let score = 0;

  if (resumen.pages) score += 2;
  if (resumen.author_name && resumen.author_name !== 'Biblioteca Evaluo') score += 2;
  if (resumen.score && resumen.score > 0) score += 1;
  if (resumen.created_at) score += 1;

  return score;
}

function normalizeMateriaName(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getMateriaHeroImage(nombre: string) {
  const normalized = normalizeMateriaName(nombre);

  const exactImages: Record<string, string> = {
    matematica: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80',
    estadistica: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    economia: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
    contabilidad: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80',
    administracion: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    marketing: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    psicologia: 'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=1200&q=80',
    sociologia: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    filosofia: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80',
    historia: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80',
    ingles: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    informatica: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80',
  };

  if (exactImages[normalized]) {
    return exactImages[normalized];
  }

  const keywordImages: Array<[string, string]> = [
    ['matemat', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80'],
    ['calculo', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80'],
    ['algebra', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80'],
    ['estad', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'],
    ['econom', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80'],
    ['contab', 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80'],
    ['admin', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80'],
    ['marketing', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'],
    ['derecho', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'],
    ['jurid', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'],
    ['penal', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'],
    ['constitucional', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'],
    ['civil', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80'],
    ['program', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80'],
    ['informat', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80'],
    ['sistemas', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80'],
    ['ingenier', 'https://images.unsplash.com/photo-1581092921461-eab10380f636?auto=format&fit=crop&w=1200&q=80'],
    ['fisica', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80'],
    ['quimica', 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=1200&q=80'],
    ['biologia', 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80'],
    ['medicina', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80'],
    ['anatom', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80'],
    ['psicolog', 'https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=1200&q=80'],
    ['sociolog', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'],
    ['filosof', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80'],
    ['historia', 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80'],
    ['ingles', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80'],
    ['idioma', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80'],
    ['investig', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80'],
    ['metodolog', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80'],
  ];

  const matchedImage = keywordImages.find(([keyword]) => normalized.includes(keyword));
  if (matchedImage) {
    return matchedImage[1];
  }

  return 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80';
}

export default function MateriaContent({
  materiaId,
  materiaNombre,
  carreraId,
  carreraNombre: initialCarreraNombre,
  universidadId,
  universidadNombre: initialUniversidadNombre,
}: MateriaContentProps) {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const syncedDashboardRef = useRef<string | null>(null);

  const [nombre, setNombre] = useState(materiaNombre || 'Cargando...');
  const [carreraNombre, setCarreraNombre] = useState(initialCarreraNombre || '');
  const [universidadNombre, setUniversidadNombre] = useState(initialUniversidadNombre || '');
  const [cargaHoraria] = useState(6);
  const [modalidad] = useState('Obligatoria');
  const [activeTab, setActiveTab] = useState<'resumenes' | 'trabajos' | 'pregunteros'>('resumenes');
  const [activeUnidad, setActiveUnidad] = useState('1');
  const [sortBy] = useState<'recientes' | 'favoritos'>('recientes');
  const [resumenes, setResumenes] = useState<Resumen[]>([]);
  const [resumenesLoading, setResumenesLoading] = useState(false);
  const [recursosPdf, setRecursosPdf] = useState<RecursoArchivo[]>([]);
  const [recursosLoading, setRecursosLoading] = useState(false);
  const [isUserLogged, setIsUserLogged] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [voteLoading, setVoteLoading] = useState<string>('');
  const [previewDocument, setPreviewDocument] = useState<PreviewDocument | null>(null);
  const isLongTitle = isLongMateriaTitle(nombre);
  const heroImage = getMateriaHeroImage(nombre);

  const loadResumenes = async () => {
    setResumenesLoading(true);
    try {
      let query = supabase
        .from('resumenes')
        .select('*')
        .eq('materia_id', materiaId)
        .eq('module_id', Number(activeUnidad));

      query =
        sortBy === 'favoritos'
          ? query.order('score', { ascending: false })
          : query.order('created_at', { ascending: false });

      const [{ data, error }, recursosResult] = await Promise.all([
        query.limit(12),
        supabase
          .from('recursos')
          .select('id, nombre, url_archivo, creado_at, etiqueta, paginas')
          .eq('materia_id', materiaId)
          .eq('tipo', 'resumen-modulo'),
      ]);

      if (error) {
        console.error('Load resumenes error:', error);
      }

      if (recursosResult.error) {
        console.error('Load recursos resumen error:', recursosResult.error);
      }

      const recursoResumenes = (recursosResult.data ?? [])
        .filter((recurso: RecursoResumenRow) => {
          const moduleNumber = recurso.etiqueta ? getModuleNumber(recurso.etiqueta) : null;
          return String(moduleNumber ?? '') === activeUnidad;
        })
        .map(
          (recurso: RecursoResumenRow): Resumen => ({
            id: `recurso-${recurso.id}`,
            title: recurso.nombre,
            author_name: 'Biblioteca Evaluo',
            file_url: recurso.url_archivo,
            module_id: activeUnidad,
            score: 100,
            created_at: recurso.creado_at,
            pages: recurso.paginas,
          })
        );

      const dedupedResumenes = new Map<string, Resumen>();

      for (const resumen of [...(data ?? []), ...recursoResumenes]) {
        const key = buildResumenKey(resumen);
        const existing = dedupedResumenes.get(key);

        if (!existing || scoreResumenCompleteness(resumen) > scoreResumenCompleteness(existing)) {
          dedupedResumenes.set(key, resumen);
        }
      }

      const mergedResumenes = Array.from(dedupedResumenes.values());
      const resumenesWithFile = mergedResumenes.filter((resumen) => Boolean(resumen.file_url));

      if (!authUser) {
        setResumenes(mergedResumenes);
        return;
      }

      const existingChecks = await Promise.all(
        resumenesWithFile.map(async (resumen) => ({
          resumen,
          exists: await checkResourceExists(resumen.file_url!),
        }))
      );

      const validResumenes = mergedResumenes.filter((resumen) => {
        if (!resumen.file_url) return true;
        const match = existingChecks.find((item) => item.resumen.id === resumen.id);
        return match?.exists ?? false;
      });

      setResumenes(validResumenes);
    } catch (error) {
      console.error('Load resumenes error:', error);
      setResumenes([]);
    } finally {
      setResumenesLoading(false);
    }
  };

  const loadFavoriteStatus = async () => {
    if (!authUser) return;
    try {
      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('materia_id', materiaId)
        .maybeSingle();
      setIsFavorite(Boolean(data));
    } catch (error) {
      console.error('Favorite status error:', error);
    }
  };

  const toggleFavorite = async () => {
    if (favoritesLoading) return;

    if (!authUser) {
      toast({
        title: 'Inicia sesion para guardar favoritos',
        description: 'Te llevamos al login para guardar esta materia.',
        duration: 2500,
      });
      router.push('/login');
      return;
    }

    const nextValue = !isFavorite;
    setIsFavorite(nextValue);
    setFavoritesLoading(true);

    try {
      if (nextValue) {
        await supabase.from('user_favorites').insert({ user_id: authUser.id, materia_id: materiaId });
        toast({
          title: 'Materia guardada',
          description: 'La agregamos a tus favoritos.',
          duration: 2500,
        });
      } else {
        await supabase.from('user_favorites').delete().eq('user_id', authUser.id).eq('materia_id', materiaId);
        toast({
          title: 'Materia removida',
          description: 'Ya no aparece en tus favoritos.',
          duration: 2500,
        });
      }
    } catch (error) {
      setIsFavorite(!nextValue);
      console.error('Favorite toggle error:', error);
      toast({
        variant: 'destructive',
        title: 'No pudimos guardar el favorito',
        description: 'Intentalo nuevamente en unos segundos.',
        duration: 3000,
      });
    } finally {
      setFavoritesLoading(false);
    }
  };

  const voteResumen = async (resumenId: string, voteType: 1 | -1) => {
    if (!authUser) return;

    setVoteLoading(resumenId);
    try {
      await supabase
        .from('resumen_votes')
        .upsert({ user_id: authUser.id, resumen_id: resumenId, vote_type: voteType });
      await loadResumenes();
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      setVoteLoading('');
    }
  };

  const loadRecursosPdf = async () => {
    setRecursosLoading(true);
    try {
      const { data, error } = await supabase
        .from('recursos')
        .select('id, nombre, tipo, url_archivo, creado_at, materia_id')
        .eq('materia_id', materiaId)
        .or('tipo.ilike.%pdf%,tipo.ilike.%preguntero%')
        .order('creado_at', { ascending: false });

      if (error) {
        console.error('Load recursos error:', error);
        setRecursosPdf([]);
      } else {
        const resources = data || [];
        if (!authUser) {
          setRecursosPdf(resources);
          return;
        }

        const checkedResources = await Promise.all(
          resources.map(async (resource) => ({
            resource,
            exists: resource.url_archivo ? await checkResourceExists(resource.url_archivo) : false,
          }))
        );

        setRecursosPdf(checkedResources.filter((item) => item.exists).map((item) => item.resource));
      }
    } catch (error) {
      console.error('Load recursos error:', error);
      setRecursosPdf([]);
    } finally {
      setRecursosLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      if (authUser) {
        setIsUserLogged(true);
        await loadFavoriteStatus();
      } else {
        setIsUserLogged(false);
        setIsFavorite(false);
      }

      if (!materiaNombre) {
        const { data } = await supabase
          .from('materias')
          .select('nombre, carrera_id')
          .eq('id', materiaId)
          .single();

        if (data) {
          setNombre(data.nombre || 'Materia');

          if (!initialCarreraNombre && data.carrera_id) {
            const { data: carreraData } = await supabase
              .from('carreras')
              .select('nombre, universidad_id')
              .eq('id', data.carrera_id)
              .single();

            if (carreraData) {
              setCarreraNombre(carreraData.nombre || '');

              if (!initialUniversidadNombre && carreraData.universidad_id) {
                const { data: universidadData } = await supabase
                  .from('universidades')
                  .select('nombre')
                  .eq('id', carreraData.universidad_id)
                  .single();

                if (universidadData?.nombre) {
                  setUniversidadNombre(universidadData.nombre);
                }
              }
            }
          }
        }
      }

      setLoading(false);
    };

    void initData();
  }, [authUser, initialCarreraNombre, initialUniversidadNombre, materiaId, materiaNombre]);

  useEffect(() => {
    const tabFromQuery = searchParams.get('tab');
    if (tabFromQuery === 'resumenes' || tabFromQuery === 'trabajos' || tabFromQuery === 'pregunteros') {
      setActiveTab(tabFromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'resumenes') {
      void loadResumenes();
    }
  }, [activeTab, activeUnidad, sortBy, authUser]);

  useEffect(() => {
    if (activeTab === 'pregunteros') {
      void loadRecursosPdf();
    }
  }, [activeTab, materiaId, authUser]);

  useEffect(() => {
    async function syncDashboardSubject() {
      if (!authUser || !materiaId || !nombre || nombre === 'Cargando...') {
        return;
      }

      const syncKey = `${authUser.id}:${materiaId}:${nombre}`;
      if (syncedDashboardRef.current === syncKey) {
        return;
      }

      syncedDashboardRef.current = syncKey;

      const currentSubject = { id: materiaId, name: nombre };
      const currentState = await getDashboardState();
      const nextState = {
        ...currentState,
        lastSubject: currentSubject,
        activeSubjects: [
          currentSubject,
          ...currentState.activeSubjects.filter((subject) => subject.id !== materiaId),
        ].slice(0, 6),
        analytics: {
          ...currentState.analytics,
          lastUpdatedAt: new Date().toISOString(),
        },
      };

      pushActivityHit(nextState.analytics.lastUpdatedAt ?? new Date().toISOString());
      await saveDashboardState(nextState);
    }

    void syncDashboardSubject();
  }, [authUser, materiaId, nombre]);

  const resumenesFiltrados = resumenes.filter((resumen) =>
    resumen.title.toLowerCase().includes(busqueda.toLowerCase())
  );
  const recursosFiltrados = recursosPdf.filter(
    (recurso) =>
      recurso.materia_id === materiaId &&
      Boolean(recurso.url_archivo) &&
      ((recurso.tipo ?? '').toLowerCase().includes('pdf') ||
        (recurso.tipo ?? '').toLowerCase().includes('preguntero'))
  );

  const getRecursoPublicUrl = (resourcePath: string) => {
    if (/^https?:\/\//i.test(resourcePath)) {
      return resourcePath;
    }

    const { data } = supabase.storage.from('biblioteca').getPublicUrl(resourcePath);
    return data.publicUrl;
  };

  const checkResourceExists = async (resourcePath: string) => {
    const response = await fetch('/api/pdf-view-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: resourcePath }),
    });

    return response.ok;
  };

  const requireDownloadSession = async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      toast({
        variant: 'destructive',
        title: 'No pudimos validar tu sesion',
        description: 'Intenta nuevamente en unos segundos.',
        duration: 3000,
      });
      return null;
    }

    if (!sessionData.session) {
      toast({
        variant: 'destructive',
        title: 'Debes iniciar sesion para descargar este material',
        description: 'Te redirigimos para continuar.',
        duration: 2800,
      });
      router.push('/login');
      return null;
    }

    return sessionData.session;
  };

  const getPdfViewerUrl = async (resourcePath: string) => {
    const response = await fetch('/api/pdf-view-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: resourcePath }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { url?: string };
    return payload.url ?? null;
  };

  const getStorageObjectPath = (resourcePath: string) => {
    if (!/^https?:\/\//i.test(resourcePath)) {
      return resourcePath.replace(/^\/+/, '');
    }

    try {
      const parsedUrl = new URL(resourcePath);
      const marker = '/storage/v1/object/';
      const markerIndex = parsedUrl.pathname.indexOf(marker);
      if (markerIndex < 0) return null;

      const objectPath = parsedUrl.pathname.slice(markerIndex + marker.length);
      const segments = objectPath.split('/').filter(Boolean);
      const bucketIndex = segments.findIndex((segment) => segment === 'biblioteca');
      if (bucketIndex < 0) return null;

      return decodeURIComponent(segments.slice(bucketIndex + 1).join('/'));
    } catch {
      return null;
    }
  };

  const handleSecureDownload = async (recurso: RecursoArchivo) => {
    if (!recurso.url_archivo) {
      toast({
        variant: 'destructive',
        title: 'No pudimos preparar la descarga',
        description: 'El recurso no tiene archivo asociado.',
        duration: 3000,
      });
      return;
    }

    const session = await requireDownloadSession();
    if (!session) {
      return;
    }

    const objectPath = getStorageObjectPath(recurso.url_archivo);
    if (!objectPath) {
      toast({
        variant: 'destructive',
        title: 'No pudimos preparar la descarga',
        description: 'El archivo no tiene una ruta valida en Storage.',
        duration: 3000,
      });
      return;
    }

    const downloadName = recurso.nombre.toLowerCase().endsWith('.pdf')
      ? recurso.nombre
      : `${recurso.nombre}.pdf`;

    const { data, error } = await supabase.storage
      .from('biblioteca')
      .createSignedUrl(objectPath, 60, { download: downloadName });

    if (error || !data?.signedUrl) {
      toast({
        variant: 'destructive',
        title: 'No pudimos generar la descarga segura',
        description: 'Intenta nuevamente en unos segundos.',
        duration: 3000,
      });
      return;
    }

    pushRecentResource({
      id: recurso.id,
      title: recurso.nombre,
      subjectId: materiaId,
      subjectName: nombre,
      type: 'Preguntero',
      href: data.signedUrl,
      openedAt: new Date().toISOString(),
    });
    pushActivityHit();

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB]">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-600">Preparando materia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
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
            {universidadNombre ? (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <Link
                  href={universidadId ? getUniversityRoute(universidadId) : '/explorar'}
                  className="max-w-[140px] truncate text-slate-500 transition-colors hover:text-[#0F172A] sm:max-w-none"
                >
                  {universidadNombre}
                </Link>
              </>
            ) : null}
            {carreraNombre ? (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <Link
                  href={carreraId ? getCareerRoute(carreraId) : '/materias'}
                  className="max-w-[160px] truncate text-slate-500 transition-colors hover:text-[#0F172A] sm:max-w-none"
                >
                  {carreraNombre}
                </Link>
              </>
            ) : null}
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="max-w-[190px] truncate font-medium text-slate-700 sm:max-w-none">
              {nombre}
            </span>
          </nav>
        </div>
      </div>

      <section className="relative min-h-[300px] w-full overflow-hidden bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] shadow-2xl sm:min-h-[280px]">
        <div
          className="absolute inset-0 hidden h-full w-full bg-cover bg-center lg:block"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,#0F172A_0%,#0F172A_28%,rgba(15,23,42,0.94)_42%,rgba(15,23,42,0.76)_56%,rgba(15,23,42,0.42)_70%,rgba(15,23,42,0.16)_84%,rgba(15,23,42,0.04)_100%)] lg:block" />
        <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_78%_36%,rgba(99,102,241,0.18),transparent_24%)] lg:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-t from-[#0F172A]/32 via-transparent to-[#0F172A]/10 lg:block" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/88 to-[#1E293B]/55 lg:hidden" />

        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 py-6 lg:px-8 lg:py-8">
          <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/5 sm:h-24 sm:w-24">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/20 text-white sm:h-[80px] sm:w-[80px]">
                  <GraduationCap className="h-8 w-8 sm:h-9 sm:w-9" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-white/70">Materia</p>
                <h1
                  className={`tracking-[-0.05em] text-white drop-shadow-lg ${
                    isLongTitle ? 'text-[24px] font-bold leading-tight sm:text-[34px]' : 'text-[28px] font-bold leading-tight sm:text-[42px]'
                  }`}
                >
                  {nombre}
                </h1>

                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/80 sm:gap-6">
                  {carreraNombre ? (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 shrink-0" />
                      <span>{carreraNombre}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{cargaHoraria} horas semanales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>{modalidad}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <button
                onClick={toggleFavorite}
                disabled={favoritesLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15 disabled:opacity-60 sm:w-auto"
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-current text-yellow-400' : ''}`} />
                {isFavorite ? 'Guardada' : 'Guardar'}
              </button>
              <Link
                href={`/explorar/materia/${materiaId}?tab=pregunteros${carreraId ? `&carreraId=${carreraId}` : ''}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4F5DFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4050f0] sm:w-auto"
              >
                <Sparkles className="h-4 w-4" />
                Ir a Pregunteros
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-3 gap-2 py-3 sm:flex sm:gap-6 sm:py-0">
            {[
              { id: 'resumenes', label: 'Resumenes' },
              { id: 'trabajos', label: 'Trabajos practicos' },
              { id: 'pregunteros', label: 'Pregunteros' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`relative rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:rounded-none sm:px-0 sm:py-4 sm:text-sm ${
                  activeTab === tab.id
                    ? 'bg-[#EEF2FF] text-[#4F5DFF] sm:bg-transparent sm:after:absolute sm:after:bottom-0 sm:after:left-0 sm:after:h-0.5 sm:after:w-full sm:after:bg-[#4F5DFF] sm:after:content-[""]'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {activeTab === 'resumenes' ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Biblioteca de resumenes</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Material curado por modulo para estudiar con mas claridad.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                    placeholder="Buscar resumen..."
                    className="h-10 w-full rounded-full border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#4F5DFF] focus:outline-none focus:ring-2 focus:ring-[#4F5DFF]/20 sm:w-72"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {unidades.map((unidad) => (
                <button
                  key={unidad.id}
                  onClick={() => setActiveUnidad(String(unidad.id))}
                  className={`rounded-2xl border p-4 text-left transition ${activeUnidad === String(unidad.id) ? 'border-[#4F5DFF] bg-[#EEF2FF]' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <p className="text-sm font-semibold text-slate-900">{unidad.nombre}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{unidad.descripcion}</p>
                  <p className="mt-3 text-xs font-medium text-[#4F5DFF]">
                    {unidad.resumenesCount} resumenes estimados
                  </p>
                </button>
              ))}
            </div>

            {resumenesLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                Cargando resumenes...
              </div>
            ) : resumenesFiltrados.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
                <FileText className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900">Estamos preparando este contenido</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Estamos procesando el material oficial de esta materia para que la IA te enseñe.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {resumenesFiltrados.map((resumen) => {
                  const resumenUrl = resumen.file_url ? getRecursoPublicUrl(resumen.file_url) : null;

                  return (
                    <article
                      key={resumen.id}
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
                    >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900">{resumen.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {resumen.author_name || 'Autor no especificado'}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {getResumenRating(resumen.score).map((filled, index) => (
                          <Star
                            key={index}
                            className={`h-4 w-4 ${filled ? 'fill-current text-yellow-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      {resumen.pages ? (
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4" />
                          <span>{resumen.pages} paginas</span>
                        </div>
                      ) : null}
                      {resumen.created_at ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(resumen.created_at).toLocaleDateString('es-AR')}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {resumenUrl ? (
                        <>
                          <button
                            type="button"
                            onClick={async () => {
                              const viewerUrl = await getPdfViewerUrl(resumen.file_url!);
                              if (!viewerUrl) {
                                toast({
                                  variant: 'destructive',
                                  title: 'No pudimos abrir el visor',
                                  description: 'Intenta nuevamente en unos segundos.',
                                  duration: 2800,
                                });
                                return;
                              }

                              setPreviewDocument({
                                title: resumen.title,
                                url: viewerUrl,
                              });
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const storagePath = resumen.file_url;
                              if (!storagePath) {
                                return;
                              }

                              await handleSecureDownload({
                                id: resumen.id,
                                nombre: resumen.title,
                                tipo: 'resumen',
                                url_archivo: storagePath,
                                creado_at: resumen.created_at,
                                materia_id: materiaId,
                              });
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl bg-[#4F5DFF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4050f0]"
                          >
                            <Download className="h-4 w-4" />
                            Descargar
                          </button>
                        </>
                      ) : null}

                      {isUserLogged ? (
                        <div className="ml-auto flex items-center gap-2">
                          <button
                            onClick={() => void voteResumen(resumen.id, 1)}
                            disabled={voteLoading === resumen.id}
                            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-60"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => void voteResumen(resumen.id, -1)}
                            disabled={voteLoading === resumen.id}
                            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-rose-300 hover:text-rose-600 disabled:opacity-60"
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'pregunteros' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[
                { parcial: 1, titulo: 'Parcial 1', icon: Zap },
                { parcial: 2, titulo: 'Parcial 2', icon: Trophy },
              ].map((simulador) => {
                const Icon = simulador.icon;
                return (
                  <article
                    key={simulador.parcial}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Simulador</p>
                        <h3 className="mt-1 text-2xl font-bold text-slate-900">{simulador.titulo}</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          30 preguntas al azar de la materia actual para entrenar examen real.
                        </p>
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <Link
                      href={`/simulador/${materiaId}/${simulador.parcial}`}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#4F5DFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4050f0]"
                    >
                      Iniciar Simulador Aleatorio
                    </Link>
                  </article>
                );
              })}
            </div>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Modelos de Examen y Pregunteros PDF</h2>

              {recursosLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                  Cargando archivos...
                </div>
              ) : recursosFiltrados.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <FileText className="mx-auto mb-3 h-9 w-9 text-slate-300" />
                  <p className="text-sm text-slate-600">
                    Estamos procesando modelos de examen para esta materia.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {recursosFiltrados.map((recurso) => {
                    return (
                      <article
                        key={recurso.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 shrink-0 text-rose-600" />
                            <p className="truncate text-sm font-semibold text-slate-900">{recurso.nombre}</p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!recurso.url_archivo) return;
                              const viewerUrl = await getPdfViewerUrl(recurso.url_archivo);
                              if (!viewerUrl) {
                                toast({
                                  variant: 'destructive',
                                  title: 'No pudimos abrir el visor',
                                  description: 'Intenta nuevamente en unos segundos.',
                                  duration: 2800,
                                });
                                return;
                              }

                              setPreviewDocument({
                                title: recurso.nombre,
                                url: viewerUrl,
                              });
                              pushRecentResource({
                                id: recurso.id,
                                title: recurso.nombre,
                                subjectId: materiaId,
                                subjectName: nombre,
                                type: 'Preguntero',
                                href: viewerUrl,
                                openedAt: new Date().toISOString(),
                              });
                              pushActivityHit();
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSecureDownload(recurso)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F5DFF] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4050f0]"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Descargar
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900">Seccion en construccion</h3>
            <p className="mt-2 text-sm text-slate-500">
              Estamos consolidando esta parte del producto para dejar un flujo mas limpio.
            </p>
          </div>
        )}
      </div>

      <Dialog open={Boolean(previewDocument)} onOpenChange={(open) => !open && setPreviewDocument(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden rounded-3xl p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-4">
            <DialogTitle className="truncate text-xl font-bold text-slate-900">
              {previewDocument?.title || 'Vista previa del PDF'}
            </DialogTitle>
          </DialogHeader>
          <div className="h-[75vh] bg-slate-100">
            {previewDocument?.url ? (
              <PdfViewer
                url={previewDocument.url}
                title={previewDocument.title}
                className="h-full rounded-none border-0"
                heightClassName="h-[75vh]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No pudimos cargar la vista previa del documento.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

