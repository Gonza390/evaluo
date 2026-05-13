'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { isAdminRole, isAdminUserSession } from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trash2,
  Plus,
  ArrowLeft,
  Upload,
  Loader2,
  Zap,
  Brain,
  RefreshCcw,
  BarChart3,
  Users,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useToast } from '@/components/ui/use-toast';
import {
  analizarMaterialConIA,
  importarSimuladorPremiumDesdeArchivo,
  importarMateriasDesdeExcelAdmin,
  limpiarPreguntasBanco,
  actualizarPromptSistema,
  obtenerPromptSistema,
  obtenerRankingErroresIA,
  regenerarExplicacionIA,
  type IARankingRow,
  obtenerEstadisticasAdmin,
  type AdminAnalyticsStats,
  obtenerDuplicadosPdfAdmin,
  obtenerPreguntasEditorAdmin,
  actualizarPreguntaEditorAdmin,
  recalcularDificultadPreguntasAdmin,
  obtenerSaludSistemaAdmin,
  ejecutarMantenimientoArchivosAdmin,
  eliminarArchivosHuerfanosAdmin,
  obtenerFeedbackExplicacionesAdmin,
  obtenerFeedbackRevisionAdmin,
  type QuestionEditorRow,
  type FeedbackReviewItem,
  obtenerUsuariosAdmin,
  actualizarRolUsuarioAdmin,
  crearMateriaCompartidaAdmin,
  desasignarMateriaDeCarreraAdmin,
  obtenerMonetizacionAdmin,
  obtenerRankingGlobalPreguntasAdmin,
  type AdminUserItem,
  type MonetizacionStats,
  type GlobalQuestionRankingRow,
  type DuplicateCandidate,
  type SystemHealthStats,
  type FileMaintenanceResult,
  type MateriaImportResult,
} from './actions';
import {
  filterAdminResources,
  getAdminUserBadgeLabel,
  getAdminUserDisplayName,
  getMateriasUsoChartData,
  parseMateriasWorkbook,
  getPlatformUsageData,
  getRetentionChartData,
  getUploadActionLabel,
  getUploadModeLabel,
  sortFilterEntries,
} from './admin-page.helpers';
import {
  AdminAccessDeniedState,
  AdminIAProcessingOverlay,
  AdminLoadingState,
} from './admin-page-states';
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 as Trash2Icon } from 'lucide-react';

interface Universidad {
  id: string;
  nombre: string;
}

interface Carrera {
  id: string;
  nombre: string;
  universidad_id: string | null;
}

interface AdminResource {
  id: string;
  nombre: string;
  tipo: string | null;
  url_archivo: string | null;
  materia_id: string | null;
  carrera_id: string | null;
  universidad_id: string | null;
  etiqueta: string | null;
  creado_at: string | null;
}

interface Materia {
  id: string;
  nombre: string;
  carrera_id: string | null;
  slug?: string | null;
  sharedCareerCount?: number;
}

type ResourceType = 'Preguntero' | 'Resumen' | 'Trabajo Práctico';
type PregunteroDestino = 'ambas' | 'solo_simulador' | 'solo_visualizacion';

const ADMIN_PANEL_CARD_CLASS =
  'surface-panel rounded-[1.75rem] border border-white/80 bg-white/92 shadow-[var(--shadow-card)]';

const ADMIN_PANEL_SUBCARD_CLASS =
  'surface-card rounded-[1.35rem] border border-slate-200/80 bg-white/96 shadow-[var(--shadow-soft)]';

export default function AdminPanel() {
  // ... existing states
  const [adminResources, setAdminResources] = useState<AdminResource[]>([]);
  const [loadingMateriales, setLoadingMateriales] = useState(false);
  const router = useRouter();

  // Auth states
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  // Universidades states
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [nuevaUni, setNuevaUni] = useState('');
  const [loadingUni, setLoadingUni] = useState(false);

  // Carreras states
  const [selectedUniId, setSelectedUniId] = useState<string | null>(null);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [nuevaCarrera, setNuevaCarrera] = useState('');
  const [loadingCarrera, setLoadingCarrera] = useState(false);

  // Materias states
  const [selectedCarreraId, setSelectedCarreraId] = useState<string | null>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [allMateriasCatalog, setAllMateriasCatalog] = useState<Materia[]>([]);
  const [nuevaMateria, setNuevaMateria] = useState('');
  const [materiaCarreraIds, setMateriaCarreraIds] = useState<string[]>([]);
  const [loadingMateria, setLoadingMateria] = useState(false);
  const [materiasImportFile, setMateriasImportFile] = useState<File | null>(null);
  const [loadingMateriasImport, setLoadingMateriasImport] = useState(false);
  const [materiasImportPreviewCount, setMateriasImportPreviewCount] = useState<number | null>(null);
  const [materiasImportResult, setMateriasImportResult] = useState<MateriaImportResult | null>(null);

  // Prompt config
  const [promptSistema, setPromptSistema] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [iaRankingRows, setIaRankingRows] = useState<IARankingRow[]>([]);
  const [loadingIARanking, setLoadingIARanking] = useState(false);
  const [refreshingPreguntaId, setRefreshingPreguntaId] = useState<string | null>(null);

  const [uploadUniId, setUploadUniId] = useState<string>('');
  const [uploadCarreraId, setUploadCarreraId] = useState('');
  const [uploadMateriaId, setUploadMateriaId] = useState('');
  const [uploadCarreras, setUploadCarreras] = useState<Carrera[]>([]);
  const [uploadMaterias, setUploadMaterias] = useState<Materia[]>([]);
  const [esMateriaGeneral, setEsMateriaGeneral] = useState(false);
  
  // New conditional logic states
  const [recursoType, setRecursoType] = useState<ResourceType>('Preguntero');
  const [pregunteroDestino, setPregunteroDestino] = useState<PregunteroDestino>('ambas');
  const [isPremiumSimulatorUpload, setIsPremiumSimulatorUpload] = useState(false);
  const [premiumSourceExamDate, setPremiumSourceExamDate] = useState('');
  const [subTipo, setSubTipo] = useState('');
  const [resumenModules, setResumenModules] = useState<string[]>([]);
  const [resumenParcial, setResumenParcial] = useState('');

  const [filterUniId, setFilterUniId] = useState<string>('all');
  const [filterCarreraId, setFilterCarreraId] = useState<string>('all');
  const [filterMateriaId, setFilterMateriaId] = useState<string>('all');
  const [resourceUniNames, setResourceUniNames] = useState<Record<string, string>>({});
  const [resourceCarreraNames, setResourceCarreraNames] = useState<Record<string, string>>({});
  const [resourceMateriaNames, setResourceMateriaNames] = useState<Record<string, string>>({});
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [usarIAEnCarga, setUsarIAEnCarga] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isIAProcessing, setIsIAProcessing] = useState(false);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'materiales' | 'operaciones' | 'config' | 'estadisticas' | 'ia' | 'usuarios' | 'monetizacion'
  >('dashboard');
  const [stats, setStats] = useState<AdminAnalyticsStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [questionEditorRows, setQuestionEditorRows] = useState<QuestionEditorRow[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<{ total: number; positive: number; negative: number } | null>(null);
  const [feedbackReviewRows, setFeedbackReviewRows] = useState<FeedbackReviewItem[]>([]);
  const [duplicatePdfRows, setDuplicatePdfRows] = useState<DuplicateCandidate[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthStats | null>(null);
  const [fileMaintenance, setFileMaintenance] = useState<FileMaintenanceResult | null>(null);
  const [cleaningOrphans, setCleaningOrphans] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [monetizacion, setMonetizacion] = useState<MonetizacionStats | null>(null);
  const [loadingMonetizacion, setLoadingMonetizacion] = useState(false);
  const [showAllSharedMaterias, setShowAllSharedMaterias] = useState(false);
  const [rankingMateriaId, setRankingMateriaId] = useState<string>('all');
  const [rankingParcial, setRankingParcial] = useState<string>('all');
  const [rankingFailed, setRankingFailed] = useState<GlobalQuestionRankingRow[]>([]);
  const [rankingCorrect, setRankingCorrect] = useState<GlobalQuestionRankingRow[]>([]);
  const [loadingRankingGlobal, setLoadingRankingGlobal] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [uploadMateriaSearch, setUploadMateriaSearch] = useState('');
  const [isQuestionBankDialogOpen, setIsQuestionBankDialogOpen] = useState(false);
  const [cleaningQuestionBank, setCleaningQuestionBank] = useState(false);

  const showAdminError = (title: string, description: string) => {
    toast({
      title,
      description,
      variant: 'destructive',
    });
  };

  const showAdminSuccess = (title: string, description: string) => {
    toast({
      title,
      description,
    });
  };

  const fetchMateriales = async () => {
    setLoadingMateriales(true);
    const { data, error } = await supabase
      .from('recursos')
      .select('id, nombre, tipo, url_archivo, materia_id, carrera_id, universidad_id, etiqueta, creado_at')
      .order('creado_at', { ascending: false });
    setLoadingMateriales(false);

    if (!data) {
      console.error('Error recursos admin:', error);
      setAdminResources([]);
      setResourceUniNames({});
      setResourceCarreraNames({});
      setResourceMateriaNames({});
      return;
    }

    setAdminResources(data);

    const uniIds = Array.from(new Set(data.map((item) => item.universidad_id).filter(Boolean))) as string[];
    const carreraIds = Array.from(new Set(data.map((item) => item.carrera_id).filter(Boolean))) as string[];
    const materiaIds = Array.from(new Set(data.map((item) => item.materia_id).filter(Boolean))) as string[];

    const [uniRows, carreraRows, materiaRows] = await Promise.all([
      uniIds.length > 0
        ? supabase.from('universidades').select('id, nombre').in('id', uniIds)
        : Promise.resolve({ data: [], error: null }),
      carreraIds.length > 0
        ? supabase.from('carreras').select('id, nombre').in('id', carreraIds)
        : Promise.resolve({ data: [], error: null }),
      materiaIds.length > 0
        ? supabase.from('materias').select('id, nombre').in('id', materiaIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    setResourceUniNames(
      Object.fromEntries((uniRows.data ?? []).map((row) => [row.id, row.nombre]))
    );
    setResourceCarreraNames(
      Object.fromEntries((carreraRows.data ?? []).map((row) => [row.id, row.nombre]))
    );
    setResourceMateriaNames(
      Object.fromEntries((materiaRows.data ?? []).map((row) => [row.id, row.nombre]))
    );
  };

  const handleDeleteResource = async (resource: AdminResource) => {
    if (!resource.url_archivo) return;
    if (!confirm('Eliminar archivo y registros asociados?')) return;

    const { error: storageError } = await supabase.storage
      .from('biblioteca')
      .remove([resource.url_archivo]);

    if (storageError) {
      showAdminError('No pudimos borrar el archivo del storage', 'Vamos a intentar limpiar igualmente los registros de base de datos.');
    }

    const [materialDelete, recursosDelete, resumenesDelete] = await Promise.all([
      supabase.from('materiales').delete().eq('archivo_url', resource.url_archivo),
      supabase.from('recursos').delete().eq('url_archivo', resource.url_archivo),
      supabase.from('resumenes').delete().eq('file_url', resource.url_archivo),
    ]);

    if (materialDelete.error || recursosDelete.error || resumenesDelete.error) {
      showAdminError('No pudimos limpiar todos los registros', 'Revisá el archivo otra vez desde el panel antes de seguir.');
    } else {
      showAdminSuccess('Archivo eliminado', 'También limpiamos sus registros relacionados.');
      void fetchMateriales();
    }
  };

  // Auth check
  useEffect(() => {
    let isMounted = true;

    const resolveAdminAccess = async (sessionUser: User | null) => {
      if (!sessionUser) {
        if (isMounted) {
          setUser(null);
          setAccessDenied('Necesitás iniciar sesión para acceder al panel.');
        }
        return;
      }

      if (isAdminUserSession(sessionUser)) {
        if (isMounted) {
          setUser(sessionUser);
          setAccessDenied(null);
        }
        return;
      }

      const { data } = await supabase.from('profiles').select('role').eq('id', sessionUser.id).maybeSingle();
      const hasAdminRole = isAdminRole(data?.role);

      if (isMounted) {
        if (hasAdminRole) {
          setUser(sessionUser);
          setAccessDenied(null);
        } else {
          setUser(null);
          setAccessDenied('Tu usuario no tiene permisos de administrador.');
        }
      }
    };

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        await resolveAdminAccess(session?.user ?? null);
        if (isMounted) {
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccessDenied('No pudimos validar tu sesión de administrador.');
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setAccessDenied('Tu sesión se cerró.');
        router.push('/');
        return;
      }

      await resolveAdminAccess(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const fetchPromptSistema = async () => {
    setLoadingPrompt(true);
    const result = await obtenerPromptSistema();
    setLoadingPrompt(false);
    
    if (result.success) {
      setPromptSistema(result.data || '');
    } else {
      console.error('Error fetching prompt:', result.message);
      showAdminError('No pudimos cargar la configuración de IA', result.message ?? 'Probá nuevamente en unos segundos.');
    }
  };

  const fetchIARanking = async () => {
    setLoadingIARanking(true);
    const result = await obtenerRankingErroresIA(30);
    setLoadingIARanking(false);

    if (result.success) {
      setIaRankingRows(result.rows ?? []);
    } else {
      showAdminError('No pudimos cargar el ranking de IA', result.message ?? 'Probá nuevamente en unos segundos.');
    }
  };

  const fetchAdminStats = async () => {
    setLoadingStats(true);
    const result = await obtenerEstadisticasAdmin();
    setLoadingStats(false);
    if (result.success) {
      setStats(result.stats ?? null);
    } else {
      setStats((prev) => prev ?? null);
      showAdminError('No pudimos cargar las estadísticas', result.message ?? 'Probá nuevamente en unos segundos.');
    }
  };

  const fetchOpsData = async () => {
    const [dupRes, qRes, hRes, fRes, maintenanceRes] = await Promise.all([
      obtenerDuplicadosPdfAdmin(),
      obtenerPreguntasEditorAdmin(),
      obtenerSaludSistemaAdmin(),
      obtenerFeedbackExplicacionesAdmin(),
      ejecutarMantenimientoArchivosAdmin(),
    ]);
    const opsErrors: string[] = [];

    if (dupRes.success) {
      setDuplicatePdfRows(dupRes.rows ?? []);
    } else {
      setDuplicatePdfRows([]);
      opsErrors.push('duplicados PDF');
    }
    if (qRes.success) setQuestionEditorRows(qRes.rows ?? []);
    else {
      setQuestionEditorRows([]);
      opsErrors.push('editor de preguntas');
    }
    if (hRes.success) {
      setSystemHealth((hRes as { stats?: SystemHealthStats }).stats ?? null);
    } else {
      setSystemHealth(null);
      opsErrors.push('salud del sistema');
    }
    if (fRes.success) setFeedbackStats((fRes as { stats?: { total: number; positive: number; negative: number } }).stats ?? null);
    else {
      setFeedbackStats(null);
      opsErrors.push('feedback de IA');
    }
    if (maintenanceRes.success) {
      setFileMaintenance((maintenanceRes as { result?: FileMaintenanceResult }).result ?? null);
    } else {
      setFileMaintenance(null);
      opsErrors.push('mantenimiento de archivos');
    }

    const reviewRes = await obtenerFeedbackRevisionAdmin(40);
    if (reviewRes.success) {
      setFeedbackReviewRows(reviewRes.rows ?? []);
    } else {
      setFeedbackReviewRows([]);
      opsErrors.push('revisión de feedback');
    }

    if (opsErrors.length > 0) {
      showAdminError(
        'Algunos bloques de Operaciones no se pudieron actualizar',
        `Revisá: ${opsErrors.join(', ')}.`
      );
    }
  };

  const handleDeleteOrphans = async () => {
    if (!confirm('Esto va a eliminar del bucket los archivos huérfanos detectados. ¿Querés continuar?')) return;

    setCleaningOrphans(true);
    const result = await eliminarArchivosHuerfanosAdmin();
    setCleaningOrphans(false);

    if (result.success) {
      showAdminSuccess(
        'Archivos huérfanos eliminados',
        `Se borraron ${result.result?.deleted_count?.toLocaleString('es-AR') ?? 0} archivos del storage.`
      );
      await fetchOpsData();
    } else {
      showAdminError('No pudimos eliminar los huérfanos', result.message ?? 'Probá nuevamente en unos segundos.');
    }
  };

  const fetchUsuariosAdmin = async () => {
    setLoadingUsers(true);
    const result = await obtenerUsuariosAdmin(250);
    setLoadingUsers(false);
    if (result.success) {
      setAdminUsers(result.rows ?? []);
    } else {
      showAdminError('No pudimos cargar la lista de usuarios', result.message ?? 'Probá nuevamente en unos segundos.');
    }
  };

  const fetchMonetizacionAdmin = async () => {
    setLoadingMonetizacion(true);
    const result = await obtenerMonetizacionAdmin();
    setLoadingMonetizacion(false);
    if (result.success) {
      setMonetizacion(result.data ?? null);
    } else {
      showAdminError('No pudimos cargar la monetización', result.message ?? 'Probá nuevamente en unos segundos.');
    }
  };

  const fetchRankingGlobal = async () => {
    setLoadingRankingGlobal(true);
    const result = await obtenerRankingGlobalPreguntasAdmin({
      materiaId: rankingMateriaId === 'all' ? null : rankingMateriaId,
      parcial: rankingParcial === 'all' ? null : Number(rankingParcial),
      limit: 12,
    });
    setLoadingRankingGlobal(false);
    if (result.success) {
      setRankingFailed(result.mostFailed ?? []);
      setRankingCorrect(result.mostCorrect ?? []);
    } else {
      showAdminError('No pudimos cargar el ranking global', result.message ?? 'Probá nuevamente en unos segundos.');
    }
  };

  const savePromptSistema = async () => {
    setLoadingPrompt(true);
    try {
      const result = await actualizarPromptSistema(promptSistema);
      
      setLoadingPrompt(false);
      if (result.success) {
        showAdminSuccess('Configuración guardada', 'El prompt de IA ya quedó actualizado.');
      } else {
        showAdminError('No pudimos guardar el prompt', result.message ?? 'Probá nuevamente en unos segundos.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setLoadingPrompt(false);
      showAdminError('Ocurrió un error inesperado', message);
    }
  };

  const handleCleanQuestionBank = async () => {
    setCleaningQuestionBank(true);
    try {
      const result = await limpiarPreguntasBanco();
      if (result.success) {
        setQuestionEditorRows([]);
        setIaRankingRows([]);
        setRankingFailed([]);
        setRankingCorrect([]);
        showAdminSuccess('Banco limpiado', result.message);
        setIsQuestionBankDialogOpen(false);
        await Promise.all([fetchOpsData(), fetchIARanking(), fetchRankingGlobal()]);
      } else {
        showAdminError('No pudimos borrar el banco', result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      showAdminError('No pudimos borrar el banco', message);
    } finally {
      setCleaningQuestionBank(false);
    }
  };

  // Load universidades
  useEffect(() => {
    if (user) {
      fetchUniversidades();
      fetchAllMateriasCatalog();
      fetchPromptSistema();
      fetchMateriales();
      fetchIARanking();
      fetchAdminStats();
      fetchOpsData();
      fetchUsuariosAdmin();
      fetchMonetizacionAdmin();
    } else {
      setRankingFailed([]);
      setRankingCorrect([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) void fetchRankingGlobal();
  }, [rankingMateriaId, rankingParcial, user]);

  const fetchUniversidades = async () => {
    const { data, error } = await supabase
      .from('universidades')
      .select('id, nombre')
      .order('nombre');
    if (error) console.error('Error universidades:', error);
    else setUniversidades(data || []);
  };

  const fetchAllMateriasCatalog = async () => {
    const { data, error } = await supabase.from('materias').select('id, nombre, carrera_id').order('nombre');
    if (error) console.error('Error catalogo materias:', error);
    else setAllMateriasCatalog(data || []);
  };

  const agregarUniversidad = async () => {
    if (!nuevaUni.trim()) return;
    setLoadingUni(true);
    const { error } = await supabase.from('universidades').insert({ nombre: nuevaUni.trim() });
    if (error) console.error('Error agregar uni:', error);
    else {
      setNuevaUni('');
      fetchUniversidades();
    }
    setLoadingUni(false);
  };

  const eliminarUniversidad = async (id: string) => {
    if (!confirm('Eliminar universidad?')) return;
    const { error } = await supabase.from('universidades').delete().eq('id', id);
    if (error) console.error('Error eliminar uni:', error);
    else {
      fetchUniversidades();
      if (selectedUniId === id) {
        setSelectedUniId(null);
        setCarreras([]);
        setSelectedCarreraId(null);
        setMaterias([]);
      }
    }
  };

  // Load carreras
  useEffect(() => {
    if (selectedUniId && user) {
      fetchCarreras();
    } else {
      setCarreras([]);
      setSelectedCarreraId(null);
      setMaterias([]);
    }
  }, [selectedUniId, user]);

  const fetchCarreras = async () => {
    const { data, error } = await supabase
      .from('carreras')
      .select('id, nombre, universidad_id')
      .eq('universidad_id', selectedUniId!)
      .order('nombre');
    if (error) console.error('Error carreras:', error);
    else setCarreras(data || []);
  };

  const agregarCarrera = async () => {
    if (!nuevaCarrera.trim() || !selectedUniId) return;
    setLoadingCarrera(true);
    const { error } = await supabase
      .from('carreras')
      .insert({ nombre: nuevaCarrera.trim(), universidad_id: selectedUniId });
    if (error) console.error('Error agregar carrera:', error);
    else {
      setNuevaCarrera('');
      fetchCarreras();
    }
    setLoadingCarrera(false);
  };

  const eliminarCarrera = async (id: string) => {
    if (!confirm('Eliminar carrera?')) return;
    const { error } = await supabase.from('carreras').delete().eq('id', id);
    if (error) console.error('Error eliminar carrera:', error);
    else {
      fetchCarreras();
      if (selectedCarreraId === id) {
        setSelectedCarreraId(null);
        setMaterias([]);
      }
    }
  };

  // Load materias
  useEffect(() => {
    if (selectedCarreraId && user) {
      fetchMaterias(selectedCarreraId);
    } else {
      setMaterias([]);
    }
  }, [selectedCarreraId, user]);

  useEffect(() => {
    if (selectedCarreraId) {
      setMateriaCarreraIds((prev) =>
        prev.includes(selectedCarreraId) ? prev : [selectedCarreraId]
      );
    } else {
      setMateriaCarreraIds([]);
    }
  }, [selectedCarreraId]);

  // Load carreras for upload modal
  useEffect(() => {
    if (uploadUniId) {
      const fetchCarrerasForUpload = async () => {
        const { data } = await supabase
          .from('carreras')
          .select('id, nombre, universidad_id')
          .eq('universidad_id', uploadUniId)
          .order('nombre');
        setUploadCarreras(data || []);
      };
      fetchCarrerasForUpload();
    } else {
      setUploadCarreras([]);
      setUploadCarreraId('');
      setUploadMateriaId('');
      setUploadMaterias([]);
    }
  }, [uploadUniId]);

  // Dynamic materias load for upload modal
  useEffect(() => {
    if (uploadCarreraId) {
      fetchUploadMaterias(uploadCarreraId);
    } else {
      setUploadMateriaId('');
      setUploadMaterias([]);
    }
  }, [uploadCarreraId]);

  useEffect(() => {
    if (selectedFile && /\.(xlsx|xls)$/i.test(selectedFile.name)) {
      setUsarIAEnCarga(false);
    }
  }, [selectedFile]);

  const loadMateriasForCarrera = async (carreraId: string): Promise<Materia[]> => {
    const globalSlugs = ['aprender-21', 'tecnologia-humanidades'];

    const [{ data: relationRows, error: relationError }, { data: globalRows, error: globalError }] =
      await Promise.all([
        supabase.from('carrera_materias').select('materia_id').eq('carrera_id', carreraId),
        supabase.from('materias').select('*').in('slug', globalSlugs),
      ]);

    if (relationError || globalError) {
      console.error('Error materias:', relationError ?? globalError);
      return [];
    }

    const relationMateriaIds = Array.from(
      new Set((relationRows ?? []).map((row) => row.materia_id).filter(Boolean))
    ) as string[];

    const [{ data: linkedMaterias, error: linkedMateriasError }, { data: allRelations, error: allRelationsError }] =
      relationMateriaIds.length > 0
        ? await Promise.all([
            supabase.from('materias').select('*').in('id', relationMateriaIds),
            supabase.from('carrera_materias').select('materia_id').in('materia_id', relationMateriaIds),
          ])
        : [{ data: [], error: null }, { data: [], error: null }];

    if (linkedMateriasError || allRelationsError) {
      console.error('Error linked materias:', linkedMateriasError ?? allRelationsError);
      return [];
    }

    const allRows = [...(globalRows ?? []), ...(linkedMaterias ?? [])];
    const uniqueMaterias = Array.from(
      new Map(allRows.map((materia) => [materia.id, materia])).values()
    );

    const relationCountMap = (allRelations ?? []).reduce<Record<string, number>>((acc, relation) => {
      const materiaId = relation.materia_id;
      if (!materiaId) return acc;
      acc[materiaId] = (acc[materiaId] ?? 0) + 1;
      return acc;
    }, {});

    const globals = uniqueMaterias.filter((m) => (m.slug ? globalSlugs.includes(m.slug) : false));
    const others = uniqueMaterias
      .filter((m) => (m.slug ? !globalSlugs.includes(m.slug) : true))
      .map((materia) => ({
        ...materia,
        sharedCareerCount: relationCountMap[materia.id] ?? 0,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return [
      ...globals.map((materia) => ({ ...materia, sharedCareerCount: 0 })),
      ...others,
    ];
  };

  const fetchMaterias = async (carreraId: string) => {
    const nextMaterias = await loadMateriasForCarrera(carreraId);
    setMaterias(nextMaterias);
  };

  const fetchUploadMaterias = async (carreraId: string) => {
    const nextMaterias = await loadMateriasForCarrera(carreraId);
    setUploadMaterias(nextMaterias);
  };

  const toggleMateriaCarrera = (carreraId: string) => {
    setMateriaCarreraIds((prev) =>
      prev.includes(carreraId) ? prev.filter((id) => id !== carreraId) : [...prev, carreraId]
    );
  };

  const handleMateriaImportFile = async (file: File | null) => {
    setMateriasImportFile(file);
    setMateriasImportResult(null);
    setMateriasImportPreviewCount(null);

    if (!file) return;

    try {
      const parsed = await parseMateriasWorkbook(file);
      setMateriasImportPreviewCount(parsed.length);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos leer el archivo.';
      setMateriasImportFile(null);
      showAdminError('No pudimos analizar el Excel', message);
    }
  };

  const importarMateriasDesdeExcel = async () => {
    if (!materiasImportFile) return;
    if (!selectedUniId) {
      showAdminError(
        'Selecciona una universidad',
        'El importador va a crear las carreras faltantes dentro de la universidad activa.'
      );
      return;
    }

    setLoadingMateriasImport(true);
    setMateriasImportResult(null);

    try {
      const parsedEntries = await parseMateriasWorkbook(materiasImportFile);
      if (parsedEntries.length === 0) {
        showAdminError(
          'El archivo no tiene materias validas',
          'Revisá que venga con carreras en la primera fila y materias debajo de cada columna.'
        );
        setLoadingMateriasImport(false);
        return;
      }

      const result = await importarMateriasDesdeExcelAdmin({
        universidadId: selectedUniId,
        entries: parsedEntries,
      });
      setMateriasImportResult(result);

      if (!result.success) {
        showAdminError('No pudimos importar la malla', result.message);
      } else {
        showAdminSuccess('Importacion completada', result.message);
        setMateriasImportFile(null);
        await fetchCarreras();
        if (selectedCarreraId) {
          await fetchMaterias(selectedCarreraId);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos importar el archivo.';
      showAdminError('Fallo la importacion masiva', message);
    }

    setLoadingMateriasImport(false);
  };

  const agregarMateria = async () => {
    if (!nuevaMateria.trim() || materiaCarreraIds.length === 0) return;
    setLoadingMateria(true);
    const result = await crearMateriaCompartidaAdmin({
      nombre: nuevaMateria.trim(),
      carreraIds: materiaCarreraIds,
    });
    if (!result.success) {
      showAdminError('No pudimos crear la materia', result.message);
    } else {
      setNuevaMateria('');
      showAdminSuccess('Materia guardada', result.message);
      if (selectedCarreraId) {
        await fetchMaterias(selectedCarreraId);
      }
    }
    setLoadingMateria(false);
  };

  const eliminarMateria = async (id: string) => {
    if (!selectedCarreraId || !confirm('Quitar esta materia de la carrera seleccionada?')) return;
    const result = await desasignarMateriaDeCarreraAdmin({
      materiaId: id,
      carreraId: selectedCarreraId,
    });
    if (!result.success) {
      showAdminError('No pudimos quitar la materia', result.message);
    } else {
      showAdminSuccess('Materia desasignada', result.message);
      await fetchMaterias(selectedCarreraId);
    }
  };

  const uploadMaterial = async () => {
    const isResumen = recursoType === 'Resumen';
    const hasResumenSelection = resumenModules.length > 0 || Boolean(resumenParcial);

    if (!uploadMateriaId || !selectedFile || !uploadUniId || (!isResumen && !subTipo) || (isResumen && !hasResumenSelection)) {
      showAdminError('Faltan datos para subir el material', 'Completá la materia, el archivo y la clasificación antes de continuar.');
      return;
    }

    setUploading(true);

    try {
      const isPreguntero = recursoType === 'Preguntero';
      const shouldExtractQuestions = !isPreguntero || pregunteroDestino !== 'solo_visualizacion';
      const shouldPublishAsResource = !isPreguntero || pregunteroDestino !== 'solo_simulador';

      const materiaSeleccionada = uploadMaterias.find((m) => m.id === uploadMateriaId);
      const isGeneral =
        materiaSeleccionada?.slug?.includes('aprender-21') ||
        materiaSeleccionada?.slug?.includes('tecnologia-humanidades') ||
        materiaSeleccionada?.nombre.toLowerCase().includes('aprender en el siglo 21');

      const finalCarreraId = isGeneral ? null : uploadCarreraId || null;
      let parcialNum = 1;
      if (subTipo.includes('2') || subTipo.includes('4') || resumenParcial.includes('2')) parcialNum = 2;

      const safeName = selectedFile.name
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_');
      const fileName = `${Date.now()}-${safeName}`;
      const filePath = `${finalCarreraId || 'general'}/${uploadMateriaId}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('biblioteca').upload(filePath, selectedFile);

      if (uploadError) {
        showAdminError('No pudimos subir el archivo', uploadError.message);
        return;
      }

      if (isPreguntero && isPremiumSimulatorUpload) {
        const premiumResult = await importarSimuladorPremiumDesdeArchivo({
          filePath,
          materiaId: uploadMateriaId,
          parcial: parcialNum,
          titulo: `Simulador Premium - ${subTipo || `Parcial ${parcialNum}`}`,
          sourceExamDate: premiumSourceExamDate || null,
        });

        if (!premiumResult.success) {
          showAdminError('No pudimos importar el simulador premium', premiumResult.message);
          return;
        }

        showAdminSuccess('Simulador premium importado', premiumResult.message);

        setUploadUniId('');
        setUploadCarreraId('');
        setUploadMateriaId('');
        setSelectedFile(null);
        setUsarIAEnCarga(false);
        setSubTipo('');
        setPregunteroDestino('ambas');
        setResumenModules([]);
        setResumenParcial('');
        setEsMateriaGeneral(false);
        setIsPremiumSimulatorUpload(false);
        setPremiumSourceExamDate('');
        void fetchMateriales();
        return;
      }

      const materialTitle = isResumen
        ? `Resumen - ${[
            ...resumenModules.map((module) => `Modulo ${module}`),
            ...(resumenParcial ? [resumenParcial] : []),
          ].join(', ')}`
        : `${recursoType} - ${subTipo}`;

      const { error: insertError } = await supabase.from('materiales').insert({
        materia_id: uploadMateriaId,
        titulo: materialTitle,
        tipo: recursoType,
        parcial: parcialNum,
        archivo_url: filePath,
      });

      if (insertError) {
        showAdminError('No pudimos guardar el material', insertError.message);
        return;
      }

      if (isResumen) {
        const resumenRecursos = resumenModules.map((module) => ({
          nombre: `Resumen - Modulo ${module}`,
          tipo: 'resumen-modulo',
          url_archivo: filePath,
          materia_id: uploadMateriaId,
          carrera_id: finalCarreraId,
          universidad_id: uploadUniId,
          etiqueta: `Modulo ${module}`,
        }));

        if (resumenParcial) {
          resumenRecursos.push({
            nombre: `Resumen - ${resumenParcial}`,
            tipo: resumenParcial.includes('1') ? 'primer-parcial' : 'segundo-parcial',
            url_archivo: filePath,
            materia_id: uploadMateriaId,
            carrera_id: finalCarreraId,
            universidad_id: uploadUniId,
            etiqueta: resumenParcial,
          });
        }

        if (resumenRecursos.length > 0) {
          const { error: recursoError } = await supabase.from('recursos').insert(resumenRecursos);
          if (recursoError) {
            console.error('Error al insertar recursos resumen:', recursoError);
          }
        }

        if (resumenModules.length > 0) {
          const resumenRows = resumenModules.map((module) => ({
            materia_id: uploadMateriaId,
            module_id: Number(module),
            title: `Resumen - Modulo ${module}`,
            file_url: filePath,
            created_at: new Date().toISOString(),
          }));

          const { error: resumenError } = await supabase.from('resumenes').insert(resumenRows);
          if (resumenError) {
            console.error('Error al insertar en resumenes:', resumenError);
            showAdminError(
              'El archivo se subió, pero quedó incompleto',
              'No pudimos vincularlo a todos los módulos. Revisalo desde la biblioteca antes de seguir.'
            );
          }
        }
      } else if (shouldPublishAsResource) {
        let tipoRecurso = 'otro';
        if (recursoType === 'Preguntero') {
          tipoRecurso = subTipo.includes('1') ? 'preguntero-p1' : 'preguntero-p2';
        } else if (recursoType === 'Trabajo Práctico') {
          tipoRecurso = subTipo.includes('1') || subTipo.includes('2') ? 'tp-p1' : 'tp-p2';
        }

        const { error: recursoError } = await supabase.from('recursos').insert({
          nombre: `${recursoType} - ${subTipo}`,
          tipo: tipoRecurso,
          url_archivo: filePath,
          materia_id: uploadMateriaId,
          carrera_id: finalCarreraId,
          universidad_id: uploadUniId,
          etiqueta: subTipo,
        });

        if (recursoError) {
          console.error('Error al insertar en recursos:', recursoError);
        }
      }

      if (isPreguntero && shouldExtractQuestions) {
        setIsIAProcessing(true);
        try {
          const isExcelFile = /\.(xlsx|xls)$/i.test(selectedFile.name);
          const result = await analizarMaterialConIA(
            filePath,
            uploadMateriaId,
            recursoType,
            parcialNum,
            uploadUniId,
            finalCarreraId,
            `${recursoType} - ${subTipo}`,
            !isExcelFile && usarIAEnCarga
          );
          if (result.success) {
            showAdminSuccess('Procesamiento completado', result.message);
          } else {
            showAdminError('La IA no pudo terminar el procesamiento', result.message);
          }
        } finally {
          setIsIAProcessing(false);
        }
      } else {
        if (isPreguntero && !shouldPublishAsResource && shouldExtractQuestions) {
          showAdminSuccess('Archivo cargado', 'Se usará solo para el simulador y no aparecerá en la biblioteca pública.');
        } else if (isPreguntero && shouldPublishAsResource && !shouldExtractQuestions) {
          showAdminSuccess('Archivo cargado', 'Se mostrará en la biblioteca, pero no se extraerán preguntas.');
        } else {
          showAdminSuccess('Material cargado', 'El archivo ya está disponible en el sistema.');
        }
      }

      setUploadUniId('');
      setUploadCarreraId('');
      setUploadMateriaId('');
      setSelectedFile(null);
      setUsarIAEnCarga(false);
      setSubTipo('');
      setPregunteroDestino('ambas');
      setIsPremiumSimulatorUpload(false);
      setPremiumSourceExamDate('');
      setResumenModules([]);
      setResumenParcial('');
      setEsMateriaGeneral(false);
      void fetchMateriales();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      showAdminError('Falló la carga del material', message);
    } finally {
      setUploading(false);
    }
  };

  const filteredResources = useMemo(
    () => filterAdminResources(adminResources, filterUniId, filterCarreraId, filterMateriaId),
    [adminResources, filterUniId, filterCarreraId, filterMateriaId]
  );
  const visibleResources = useMemo(() => {
    const search = materialSearch.trim().toLowerCase();
    if (!search) return filteredResources;

    return filteredResources.filter((resource) => {
      const materiaName = resourceMateriaNames[resource.materia_id ?? ''] ?? '';
      const carreraName = resourceCarreraNames[resource.carrera_id ?? ''] ?? '';
      const uniName = resourceUniNames[resource.universidad_id ?? ''] ?? '';
      return [resource.nombre, resource.tipo ?? '', materiaName, carreraName, uniName]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [filteredResources, materialSearch, resourceCarreraNames, resourceMateriaNames, resourceUniNames]);
  const filterCarreras = useMemo(() => sortFilterEntries(resourceCarreraNames), [resourceCarreraNames]);
  const filterMaterias = useMemo(() => sortFilterEntries(resourceMateriaNames), [resourceMateriaNames]);
  const uploadMateriaOptions = useMemo(() => {
    const search = uploadMateriaSearch.trim().toLowerCase();
    if (!search) return uploadMaterias;
    return uploadMaterias.filter((materia) => materia.nombre.toLowerCase().includes(search));
  }, [uploadMaterias, uploadMateriaSearch]);
  const isExcelSelected = Boolean(selectedFile?.name && /\.(xlsx|xls)$/i.test(selectedFile.name));
  const filterUniversidades = useMemo(() => sortFilterEntries(resourceUniNames), [resourceUniNames]);
  const platformUsageData = useMemo(() => getPlatformUsageData(stats), [stats]);
  const materiasUsoChartData = useMemo(() => getMateriasUsoChartData(stats), [stats]);
  const sharedMateriasTop = useMemo(
    () => (stats?.shared_materias_by_careers ?? []).slice(0, 10),
    [stats]
  );
  const retentionChartData = useMemo(() => getRetentionChartData(stats), [stats]);
  const deviceDistributionData = useMemo(
    () =>
      stats
        ? [
            { name: 'Móvil', value: stats.devices.mobile, color: '#4f46e5' },
            { name: 'Escritorio', value: stats.devices.desktop, color: '#60a5fa' },
            { name: 'Tablet', value: stats.devices.tablet, color: '#dbeafe' },
          ].filter((item) => item.value > 0)
        : [],
    [stats]
  );
  const adminBadgeLabel = useMemo(() => getAdminUserBadgeLabel(user), [user]);
  const adminDisplayName = useMemo(() => getAdminUserDisplayName(user), [user]);
  const uploadActionLabel = useMemo(
    () =>
      getUploadActionLabel({
        recursoType,
        isPremiumSimulatorUpload,
        usarIAEnCarga,
        isExcelSelected,
        uploading,
      }),
    [isExcelSelected, isPremiumSimulatorUpload, recursoType, uploading, usarIAEnCarga]
  );
  const uploadModeLabel = useMemo(
    () =>
      getUploadModeLabel({
        recursoType,
        isPremiumSimulatorUpload,
        usarIAEnCarga,
        isExcelSelected,
      }),
    [isExcelSelected, isPremiumSimulatorUpload, recursoType, usarIAEnCarga]
  );

  const adminTabs = useMemo(
    () => [
      {
        key: 'dashboard' as const,
        label: 'Cargas',
        description: 'Subidas y procesamiento',
        icon: Upload,
        activeClass: 'bg-slate-900 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]',
        idleClass: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      },
      {
        key: 'materiales' as const,
        label: 'Biblioteca',
        description: 'Archivos y limpieza',
        icon: Plus,
        activeClass: 'bg-blue-600 text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)]',
        idleClass: 'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
      },
      {
        key: 'operaciones' as const,
        label: 'Operaciones',
        description: 'Salud y mantenimiento',
        icon: Zap,
        activeClass: 'bg-amber-500 text-white shadow-[0_14px_30px_rgba(245,158,11,0.24)]',
        idleClass: 'text-slate-600 hover:bg-amber-50 hover:text-amber-700',
      },
      {
        key: 'config' as const,
        label: 'Estructura',
        description: 'Universidades y materias',
        icon: RefreshCcw,
        activeClass: 'bg-cyan-600 text-white shadow-[0_14px_30px_rgba(8,145,178,0.24)]',
        idleClass: 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-700',
      },
      {
        key: 'estadisticas' as const,
        label: 'Analítica',
        description: 'Uso y rendimiento',
        icon: BarChart3,
        activeClass: 'bg-violet-600 text-white shadow-[0_14px_30px_rgba(124,58,237,0.24)]',
        idleClass: 'text-slate-600 hover:bg-violet-50 hover:text-violet-700',
      },
      {
        key: 'ia' as const,
        label: 'IA',
        description: 'Banco y feedback',
        icon: Brain,
        activeClass: 'bg-indigo-600 text-white shadow-[0_14px_30px_rgba(79,70,229,0.24)]',
        idleClass: 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700',
      },
      {
        key: 'usuarios' as const,
        label: 'Usuarios',
        description: 'Roles y accesos',
        icon: Users,
        activeClass: 'bg-emerald-600 text-white shadow-[0_14px_30px_rgba(5,150,105,0.24)]',
        idleClass: 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700',
      },
      {
        key: 'monetizacion' as const,
        label: 'Monetización',
        description: 'Ingresos y premium',
        icon: DollarSign,
        activeClass: 'bg-fuchsia-600 text-white shadow-[0_14px_30px_rgba(192,38,211,0.22)]',
        idleClass: 'text-slate-600 hover:bg-fuchsia-50 hover:text-fuchsia-700',
      },
    ],
    []
  );

  const activeTabMeta = useMemo(
    () => adminTabs.find((tab) => tab.key === activeTab) ?? adminTabs[0],
    [activeTab, adminTabs]
  );

  const adminQuickStats = useMemo(
    () => [
      { label: 'Recursos activos', value: adminResources.length.toLocaleString('es-AR') },
      { label: 'Usuarios auditados', value: adminUsers.length.toLocaleString('es-AR') },
      { label: 'Universidades cargadas', value: universidades.length.toLocaleString('es-AR') },
    ],
    [adminResources.length, adminUsers.length, universidades.length]
  );
  const visibleUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    if (!search) return adminUsers;

    return adminUsers.filter((userRow) =>
      [userRow.email, userRow.estado, userRow.role, userRow.plan].join(' ').toLowerCase().includes(search)
    );
  }, [adminUsers, userSearch]);

  const adminActivityFeed = useMemo(
    () =>
      [
        selectedFile
          ? {
              title: 'Archivo listo para carga',
              detail: selectedFile.name,
              accent: 'text-blue-700 bg-blue-50',
            }
          : null,
        materiasImportResult
          ? {
              title: 'Importación académica reciente',
              detail: materiasImportResult.message,
              accent: 'text-cyan-700 bg-cyan-50',
            }
          : null,
        duplicatePdfRows[0]
          ? {
              title: 'Duplicado detectado',
              detail: `${duplicatePdfRows[0].recursos[0]?.nombre ?? 'Archivo'} · ${duplicatePdfRows[0].count} coincidencias`,
              accent: 'text-amber-700 bg-amber-50',
            }
          : null,
        feedbackReviewRows[0]
          ? {
              title: 'Feedback IA pendiente',
              detail: feedbackReviewRows[0].enunciado,
              accent: 'text-rose-700 bg-rose-50',
            }
          : null,
        adminUsers[0]
          ? {
              title: 'Último usuario visible',
              detail: `${adminUsers[0].email} · ${adminUsers[0].plan}`,
              accent: 'text-emerald-700 bg-emerald-50',
            }
          : null,
      ].filter(Boolean) as { title: string; detail: string; accent: string }[],
    [adminUsers, duplicatePdfRows, feedbackReviewRows, materiasImportResult, selectedFile]
  );

  // Único retorno condicional - Rules of Hooks cumplidas
  if (loading) {
    return <AdminLoadingState />;
  }

  if (accessDenied) {
    return <AdminAccessDeniedState message={accessDenied} />;
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.1),transparent_26%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_24%),linear-gradient(180deg,#f5f8fd_0%,#f8fbff_100%)]">
      {/* Overlay de Procesamiento IA */}
      {isIAProcessing ? <AdminIAProcessingOverlay /> : null}

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(246,249,252,0.94)_100%)] px-4 py-5 backdrop-blur-xl 2xl:block">
        <div className={`${ADMIN_PANEL_CARD_CLASS} flex h-full flex-col overflow-hidden rounded-[2rem] px-4 py-4`}>
          <div className="border-b border-slate-200/80 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-500">Evaluo</span>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <span className="block text-xl font-black tracking-[-0.05em] text-slate-950">Admin Studio</span>
                <span className="mt-1 block text-xs text-slate-500">Backoffice editorial y operativo</span>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-slate-900 text-sm font-black text-white shadow-[0_14px_24px_rgba(15,23,42,0.2)]">
                {adminBadgeLabel}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-slate-200/80 bg-slate-50/90 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Sesión activa</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{adminDisplayName}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{user?.email ?? 'Administrador'}</p>
          </div>

          <div className="mt-5 flex-1 overflow-y-auto pr-1">
            <div className="mb-3 px-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Áreas</p>
            </div>
            <nav className="space-y-2">
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex w-full items-center gap-3 rounded-[1.2rem] px-3 py-3 text-left transition-all duration-200 ${
                      isActive ? tab.activeClass : tab.idleClass
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border text-current ${
                        isActive ? 'border-white/15 bg-white/10' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{tab.label}</span>
                      <span className={`block text-[11px] ${isActive ? 'text-white/72' : 'text-slate-400'}`}>
                        {tab.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-slate-200/80 bg-white p-3 shadow-[var(--shadow-soft)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Estado</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {adminQuickStats.map((stat) => (
                <div key={stat.label} className="rounded-[1rem] bg-slate-50 px-2 py-2">
                  <p className="text-[11px] font-bold text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-[10px] leading-tight text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200/80 pt-4">
            <Button
              variant="ghost"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/');
              }}
              className="h-11 w-full justify-start gap-2 rounded-[1rem] text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-2 sm:p-3 xl:p-4 2xl:ml-72 2xl:p-5">
        <div className="mx-auto min-h-[calc(100vh-1rem)] max-w-[1500px] px-1 text-[12px] leading-tight sm:min-h-[calc(100vh-1.5rem)] sm:px-3 xl:px-4 2xl:min-h-[calc(100vh-2.5rem)]">
          <div className="mb-5 flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <div>
              <p className="eyebrow-label text-indigo-500">Operación interna</p>
              <h1 className="mt-2 text-[1.8rem] font-black tracking-[-0.06em] text-slate-950 sm:text-[2rem]">
                Panel de administración de Evaluo
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Gestioná cargas, biblioteca, IA, usuarios y métricas desde un backoffice más limpio, consistente y preparado para escalar.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 2xl:flex 2xl:flex-wrap">
              {adminQuickStats.map((stat) => (
                <div key={stat.label} className={`${ADMIN_PANEL_SUBCARD_CLASS} min-w-0 px-4 py-3 2xl:min-w-[150px]`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                  <p className="mt-2 text-lg font-black tracking-[-0.04em] text-slate-950">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-5 overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(30,64,175,0.95)_45%,rgba(79,70,229,0.9)_100%)] px-5 py-5 text-white shadow-[0_24px_48px_rgba(15,23,42,0.12)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200/90">{activeTabMeta.label}</p>
                <h2 className="mt-2 text-xl font-black tracking-[-0.05em] text-white sm:text-2xl">
                  {activeTabMeta.description}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/74">
                  Trabajá sobre esta sección con el mismo criterio visual y operativo del resto del panel.
                </p>
              </div>
              <div className="hidden items-center gap-3 self-start rounded-[1.2rem] border border-white/15 bg-white/10 px-4 py-3 lg:inline-flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/14 text-sm font-black text-white">
                  {adminBadgeLabel}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">{adminDisplayName}</p>
                  <p className="text-[11px] text-white/68">Administrador activo</p>
                </div>
                <ChevronDown className="h-4 w-4 text-white/68" />
              </div>
            </div>
          </div>
          <div className="mb-5 grid grid-cols-1 gap-4 2xl:grid-cols-[1.45fr_0.95fr]">
            <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/88 p-4 shadow-[var(--shadow-soft)] backdrop-blur-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="eyebrow-label">Quick actions</p>
                  <h3 className="mt-2 text-lg font-black tracking-[-0.04em] text-slate-950">Centro de operaciones</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Atajos para las acciones que más vas a repetir en el día a día del backoffice.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void Promise.all([fetchAdminStats(), fetchOpsData(), fetchUsuariosAdmin(), fetchMonetizacionAdmin()])}
                  className="rounded-[1rem] border-slate-200"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refrescar panel
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[var(--shadow-soft)]"
                >
                  <p className="text-sm font-semibold text-slate-900">Nueva carga</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Subir un PDF o una importación masiva.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('config')}
                  className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[var(--shadow-soft)]"
                >
                  <p className="text-sm font-semibold text-slate-900">Importar malla</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Universidades, carreras y materias compartidas.</p>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const result = await recalcularDificultadPreguntasAdmin();
                    if (result.success) {
                      toast({ description: result.message });
                      await fetchOpsData();
                    } else {
                      toast({ description: result.message, variant: 'destructive' });
                    }
                  }}
                  className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[var(--shadow-soft)]"
                >
                  <p className="text-sm font-semibold text-slate-900">Recalcular dificultad</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Actualiza métricas del banco de preguntas.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ia')}
                  className="rounded-[1.2rem] border border-slate-200 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[var(--shadow-soft)]"
                >
                  <p className="text-sm font-semibold text-slate-900">Revisar feedback IA</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Entrar directo al banco y los pulgares abajo.</p>
                </button>
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/88 p-4 shadow-[var(--shadow-soft)] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow-label">Activity feed</p>
                  <h3 className="mt-2 text-lg font-black tracking-[-0.04em] text-slate-950">Señales recientes</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {adminActivityFeed.length} items
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {adminActivityFeed.length === 0 ? (
                  <div className="rounded-[1.2rem] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
                    Todavía no hay eventos recientes en esta sesión.
                  </div>
                ) : (
                  adminActivityFeed.map((item) => (
                    <div key={`${item.title}-${item.detail}`} className="rounded-[1.15rem] border border-slate-200/80 bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${item.accent}`}>
                          Nuevo
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="mb-5 2xl:hidden">
            <div className="rounded-[1.45rem] border border-slate-200/80 bg-white/88 px-2 py-2 shadow-[var(--shadow-soft)] backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {adminTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 rounded-[1rem] px-3 py-2 text-left transition-all duration-200 ${
                        isActive ? tab.activeClass : tab.idleClass
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] border text-current ${
                          isActive ? 'border-white/15 bg-white/10' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="truncate text-xs font-semibold">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <p className="eyebrow-label">Control center</p>
                <h3 className="section-title mt-2">Tablero editorial y operativo</h3>
                <p className="section-copy mt-2">Una vista rápida del estado del producto y, debajo, el flujo para subir contenido nuevo.</p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] px-5 py-5 text-white shadow-[0_24px_40px_rgba(29,78,216,0.18)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/80">Usuarios activos</p>
                  <p className="mt-3 text-3xl font-black tracking-[-0.06em]">{stats?.dau?.toLocaleString('es-AR') ?? adminUsers.length.toLocaleString('es-AR')}</p>
                  <p className="mt-2 text-xs text-white/72">Base activa que está usando la plataforma hoy.</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[var(--shadow-soft)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Biblioteca total</p>
                  <p className="mt-3 text-3xl font-black tracking-[-0.06em] text-slate-950">{adminResources.length.toLocaleString('es-AR')}</p>
                  <p className="mt-2 text-xs text-slate-500">Recursos ya cargados entre PDFs, resúmenes y modelos.</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[var(--shadow-soft)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Activas premium</p>
                  <p className="mt-3 text-3xl font-black tracking-[-0.06em] text-emerald-700">{(monetizacion?.activas ?? 0).toLocaleString('es-AR')}</p>
                  <p className="mt-2 text-xs text-slate-500">Suscripciones activas visibles en la operación actual.</p>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white px-5 py-5 shadow-[var(--shadow-soft)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Alertas técnicas</p>
                  <p className="mt-3 text-3xl font-black tracking-[-0.06em] text-amber-600">
                    {(duplicatePdfRows.length + (fileMaintenance?.orphan_count ?? 0)).toLocaleString('es-AR')}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Duplicados u objetos huérfanos que merecen revisión.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.85fr]">
                <div className="rounded-[1.6rem] border border-slate-200/80 bg-white px-4 py-4 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="eyebrow-label">Tendencia</p>
                      <h4 className="mt-2 text-base font-black tracking-[-0.04em] text-slate-950">Uso de la plataforma</h4>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">8 días</span>
                  </div>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={platformUsageData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Line type="monotone" dataKey="sesiones" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Sesiones" />
                        <Line type="monotone" dataKey="usuarios" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="Usuarios" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-[1.6rem] border border-slate-200/80 bg-white px-4 py-4 shadow-[var(--shadow-soft)]">
                  <div>
                    <p className="eyebrow-label">Retención</p>
                    <h4 className="mt-2 text-base font-black tracking-[-0.04em] text-slate-950">Salud de continuidad</h4>
                  </div>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={retentionChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#7c3aed" fill="#ede9fe" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div>
                <p className="eyebrow-label">Carga editorial</p>
                <h4 className="mt-2 text-xl font-black tracking-[-0.05em] text-slate-950">Nueva carga de material</h4>
                <p className="mt-2 text-sm text-slate-500">Definí ubicación, tipo y archivo antes de enviarlo al pipeline.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1.05fr_0.9fr]">
                {/* 1. Ubicación */}
                <section className="overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white/92 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-panel)]">
                  <div className="border-b border-slate-100 bg-white px-6 py-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-3 text-slate-800">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-black shadow-lg shadow-blue-200">1</span>
                      UBICACIÓN
                    </CardTitle>
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400 ml-1">UNIVERSIDAD</Label>
                      <Select value={uploadUniId} onValueChange={setUploadUniId}>
                        <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 focus:ring-blue-500 transition-all">
                          <SelectValue placeholder="Seleccionar Uni" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {universidades.map((uni) => (
                            <SelectItem key={uni.id} value={uni.id}>{uni.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400 ml-1">CARRERA</Label>
                      <Select 
                        value={uploadCarreraId} 
                        onValueChange={setUploadCarreraId}
                        disabled={esMateriaGeneral}
                      >
                        <SelectTrigger className={`rounded-xl border-slate-200 bg-white h-11 focus:ring-blue-500 transition-all ${esMateriaGeneral ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}>
                          <SelectValue placeholder={esMateriaGeneral ? "No aplica (General)" : "Seleccionar Carrera"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {uploadCarreras.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400 ml-1">MATERIA</Label>
                      <Input
                        value={uploadMateriaSearch}
                        onChange={(event) => setUploadMateriaSearch(event.target.value)}
                        placeholder="Buscar materia para seleccionar"
                        className="h-11 rounded-xl border-slate-200 bg-white"
                      />
                      <div className="max-h-64 overflow-y-auto rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-2">
                        <div className="space-y-1.5">
                          {uploadMateriaOptions.length === 0 ? (
                            <div className="rounded-xl px-3 py-4 text-xs text-slate-500">
                              No encontramos materias para esa búsqueda.
                            </div>
                          ) : (
                            uploadMateriaOptions.map((m) => {
                              const isSelected = uploadMateriaId === m.id;
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setUploadMateriaId(m.id);
                                    const isGeneral =
                                      m.slug?.includes('aprender-21') ||
                                      m.slug?.includes('tecnologia-humanidades') ||
                                      m.nombre.toLowerCase().includes('aprender en el siglo 21');
                                    setEsMateriaGeneral(!!isGeneral);
                                    if (isGeneral) setUploadCarreraId('');
                                  }}
                                  className={`flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                    isSelected
                                      ? 'bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]'
                                      : 'bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                                  }`}
                                >
                                  <span className="text-sm font-semibold leading-5">{m.nombre}</span>
                                  {m.sharedCareerCount ? (
                                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${isSelected ? 'bg-white/15 text-white/85' : 'bg-slate-100 text-slate-500'}`}>
                                      {m.sharedCareerCount} carreras
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                      {esMateriaGeneral && (
                        <p className="text-[10px] text-amber-600 font-bold ml-1 animate-pulse">
                          âœ¨ MATERIA GENERAL DETECTADA
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* 2. Tipo de Material */}
                <section className="overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white/92 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-panel)]">
                  <div className="border-b border-slate-100 bg-white px-6 py-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-3 text-slate-800">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-black shadow-lg shadow-blue-200">2</span>
                      TIPO DE MATERIAL
                    </CardTitle>
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400 ml-1">TIPO DE RECURSO</Label>
                      <Select value={recursoType} onValueChange={(value: ResourceType) => {
                        setRecursoType(value);
                        setSubTipo('');
                        setResumenModules([]);
                        setResumenParcial('');
                      }}>
                        <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 focus:ring-blue-500 transition-all">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Preguntero">Preguntero</SelectItem>
                          <SelectItem value="Resumen">Resumen</SelectItem>
                          <SelectItem value="Trabajo Práctico">Trabajo Práctico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {recursoType === 'Resumen' ? (
                      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                        <div>
                          <Label className="text-xs font-bold text-slate-400 ml-1">MODULOS (MULTI-SELECCION)</Label>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {['1', '2', '3', '4'].map((module) => (
                              <label
                                key={module}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                              >
                                <input
                                  type="checkbox"
                                  checked={resumenModules.includes(module)}
                                  onChange={(event) => {
                                    setResumenModules((prev) =>
                                      event.target.checked
                                        ? [...prev, module]
                                        : prev.filter((value) => value !== module)
                                    );
                                  }}
                                />
                                Modulo {module}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-400 ml-1">PARCIAL (OPCIONAL)</Label>
                          <Select value={resumenParcial} onValueChange={(value) => setResumenParcial(value === 'none' ? '' : value)}>
                            <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 focus:ring-blue-500 transition-all">
                              <SelectValue placeholder="Sin parcial" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="none">Sin parcial</SelectItem>
                              <SelectItem value="Parcial 1">Parcial 1</SelectItem>
                              <SelectItem value="Parcial 2">Parcial 2</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 ml-1">
                          {recursoType === 'Preguntero' ? 'SELECCIONAR PARCIAL' : 'SELECCIONAR TRABAJO PRACTICO'}
                        </Label>
                        <Select value={subTipo} onValueChange={setSubTipo}>
                          <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 focus:ring-blue-500 transition-all">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {recursoType === 'Preguntero' && (
                              <>
                                <SelectItem value="Parcial 1">Parcial 1</SelectItem>
                                <SelectItem value="Parcial 2">Parcial 2</SelectItem>
                              </>
                            )}
                            {recursoType === 'Trabajo Práctico' && (
                              <>
                                <SelectItem value="TP 1">TP 1</SelectItem>
                                <SelectItem value="TP 2">TP 2</SelectItem>
                                <SelectItem value="TP 3">TP 3</SelectItem>
                                <SelectItem value="TP 4">TP 4</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {recursoType === 'Preguntero' && (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 ml-1">MODO PREGUNTERO</Label>
                        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={isPremiumSimulatorUpload}
                            onChange={(event) => setIsPremiumSimulatorUpload(event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          Importar como Simulador Premium (50 preguntas, solo usuarios premium)
                        </label>
                      </div>
                    )}

                    {recursoType === 'Preguntero' && isPremiumSimulatorUpload && (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 ml-1">FECHA DE EXAMEN (REFERENCIA)</Label>
                        <Input
                          type="date"
                          value={premiumSourceExamDate}
                          onChange={(event) => setPremiumSourceExamDate(event.target.value)}
                          className="rounded-xl border-slate-200 bg-white h-11"
                        />
                      </div>
                    )}

                    {recursoType === 'Preguntero' && !isPremiumSimulatorUpload && (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-400 ml-1">DESTINO DEL PREGUNTERO</Label>
                        <Select value={pregunteroDestino} onValueChange={(value) => setPregunteroDestino(value as PregunteroDestino)}>
                          <SelectTrigger className="rounded-xl border-slate-200 bg-white h-11 focus:ring-blue-500 transition-all">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="ambas">Simulador + visualizacion</SelectItem>
                            <SelectItem value="solo_simulador">Solo simulador (extraer preguntas)</SelectItem>
                            <SelectItem value="solo_visualizacion">Solo visualizacion en modelos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {recursoType === 'Preguntero' && !isPremiumSimulatorUpload && (
                      <div className="rounded-2xl bg-blue-50/50 p-4 flex items-start gap-3 border border-blue-100/50 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <Brain className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="w-full space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                              Procesamiento opcional con IA (solo PDF).
                            </p>
                            <label className="inline-flex items-center gap-2 text-[11px] font-bold text-blue-700">
                              <input
                                type="checkbox"
                                checked={usarIAEnCarga}
                                disabled={isExcelSelected}
                                onChange={(event) => setUsarIAEnCarga(event.target.checked)}
                                className="h-4 w-4 rounded border-blue-300"
                              />
                              Usar IA
                            </label>
                          </div>
                          {isExcelSelected ? (
                            <p className="text-[10px] text-blue-600">
                              Archivo Excel detectado: se procesa en modo local automático (sin IA).
                            </p>
                          ) : null}
                          <p className="text-[10px] text-blue-600">
                            {pregunteroDestino === 'solo_simulador'
                              ? 'Este archivo se usará solo para generar preguntas del simulador.'
                              : pregunteroDestino === 'solo_visualizacion'
                              ? 'Este archivo solo se mostrará en modelos de examen, sin extraer preguntas.'
                              : 'Este archivo se usará en el simulador y también se mostrará en modelos de examen.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* 3. Carga de Archivo */}
                <section className="overflow-hidden rounded-[1.65rem] border border-slate-200/80 bg-white/92 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-panel)]">
                  <div className="border-b border-slate-100 bg-white px-6 py-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-3 text-slate-800">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-black shadow-lg shadow-blue-200">3</span>
                      CARGA DE ARCHIVO
                    </CardTitle>
                  </div>
                  <div className="space-y-6 p-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-400 ml-1">ARCHIVO (PDF o EXCEL)</Label>
                      <div className={`relative border-2 border-dashed rounded-[1.5rem] p-8 transition-all duration-300 group ${
                        selectedFile ? 'border-green-200 bg-green-50/50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'
                      }`}>
                        <input
                          type="file"
                          accept=".pdf,.xlsx,.xls"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center justify-center gap-3 text-center">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                            selectedFile ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'
                          }`}>
                            <Upload className="h-6 w-6" />
                          </div>
                          <div>
                            <span className={`text-xs font-bold block ${selectedFile ? 'text-green-700' : 'text-slate-600 group-hover:text-blue-700'}`}>
                              {selectedFile ? selectedFile.name : 'Seleccionar archivo'}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Máximo 10MB'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={uploadMaterial}
                      disabled={uploading || !selectedFile}
                      className={`w-full h-12 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg ${
                        uploading 
                          ? 'bg-slate-100 text-slate-400' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:scale-[0.98]'
                      }`}
                    >
                      {uploading ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{uploadActionLabel}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Upload className="h-4 w-4" />
                          <span>{uploadActionLabel}</span>
                        </div>
                      )}
                    </Button>

                    {uploading && (
                      <div className="space-y-3 pt-2">
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 animate-progress origin-left"></div>
                        </div>
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                            {uploadModeLabel}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {recursoType === 'Preguntero'
                              ? isPremiumSimulatorUpload
                                ? 'Preparando set premium...'
                                : usarIAEnCarga && !isExcelSelected
                                ? 'Analizando contenido...'
                                : 'Extrayendo preguntas...'
                              : 'Subiendo archivo...'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'materiales' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Materiales</h1>
                  <p className="text-slate-500 mt-1">Filtra y elimina archivos por universidad, carrera o materia.</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchMateriales} className="rounded-xl font-bold text-xs h-10 px-4 border-slate-200 hover:bg-slate-50">
                  ACTUALIZAR
                </Button>
              </div>

              <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
                  <Input
                    value={materialSearch}
                    onChange={(event) => setMaterialSearch(event.target.value)}
                    placeholder="Buscar por archivo, materia o carrera"
                    className="h-10 rounded-xl border-slate-200 bg-white"
                  />
                  <Select
                    value={filterUniId}
                    onValueChange={(value) => {
                      setFilterUniId(value);
                      setFilterCarreraId('all');
                      setFilterMateriaId('all');
                    }}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 bg-white h-10">
                      <SelectValue placeholder="Universidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las universidades</SelectItem>
                      {filterUniversidades.map(([id, name]) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterCarreraId}
                    onValueChange={(value) => {
                      setFilterCarreraId(value);
                      setFilterMateriaId('all');
                    }}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 bg-white h-10">
                      <SelectValue placeholder="Carrera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las carreras</SelectItem>
                      {filterCarreras.map(([id, name]) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterMateriaId} onValueChange={setFilterMateriaId}>
                    <SelectTrigger className="rounded-xl border-slate-200 bg-white h-10">
                      <SelectValue placeholder="Materia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las materias</SelectItem>
                      {filterMaterias.map(([id, name]) => (
                        <SelectItem key={id} value={id}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className={`${ADMIN_PANEL_SUBCARD_CLASS} overflow-hidden`}>
                <CardContent className="p-0">
                  {loadingMateriales ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
                      </div>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando biblioteca...</span>
                    </div>
                  ) : visibleResources.length === 0 ? (
                    <div className="py-24 text-center">
                      <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Upload className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">No hay archivos para el filtro actual</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {visibleResources.map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors group"
                        >
                          <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <Upload className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">{resource.nombre}</div>
                              <div className="text-[11px] text-slate-400 font-bold mt-0.5 flex items-center gap-2">
                                <span className="uppercase tracking-wider">{resourceMateriaNames[resource.materia_id ?? ''] ?? 'Materia sin nombre'}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                <span className="text-blue-500">{resource.tipo ?? 'sin tipo'}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                <span>{resourceCarreraNames[resource.carrera_id ?? ''] ?? 'Carrera general'}</span>
                                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                <span>{resourceUniNames[resource.universidad_id ?? ''] ?? 'Universidad no definida'}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleDeleteResource(resource)}
                            className="text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl h-10 w-10 p-0 transition-all"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* LIMPIEZA TOTAL SECTION */}
              <Card className="mt-8 overflow-hidden rounded-[1.5rem] border border-red-100 bg-red-50/25 shadow-[var(--shadow-soft)]">
                <CardHeader className="py-4">
                  <CardTitle className="text-sm font-black text-red-800 flex items-center gap-3 uppercase tracking-wider">
                    <Trash2Icon className="h-5 w-5" />
                    Limpieza crítica
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-xs font-bold text-red-600/70 uppercase tracking-tight">
                    Borra todas las preguntas extraídas por la IA. Esta acción no se puede deshacer.
                  </p>
                  <AlertDialog open={isQuestionBankDialogOpen} onOpenChange={setIsQuestionBankDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="h-10 rounded-xl px-6 text-xs font-bold shadow-lg shadow-red-200" disabled={cleaningQuestionBank}>
                        BORRAR TODO EL BANCO
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-black text-xl">¿Confirmar limpieza?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium">
                          Se eliminarán permanentemente todas las preguntas del banco. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(event) => {
                            event.preventDefault();
                            void handleCleanQuestionBank();
                          }}
                          disabled={cleaningQuestionBank}
                          className="bg-red-600 rounded-xl font-bold"
                        >
                          {cleaningQuestionBank ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Borrando...
                            </span>
                          ) : (
                            'Sí, borrar todo'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'operaciones' && (
            <div className="space-y-5">
              <div>
                <p className="eyebrow-label">Supervisión técnica</p>
                <h3 className="section-title mt-2">Operaciones y mantenimiento</h3>
                <p className="section-copy mt-2">Seguimiento de salud, duplicados y objetos huérfanos con una vista mucho más clara.</p>
              </div>
              <div className={`${ADMIN_PANEL_SUBCARD_CLASS} p-3`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800">Operaciones</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Salud del sistema, archivos huérfanos y contenido duplicado.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleDeleteOrphans()}
                      disabled={cleaningOrphans || (fileMaintenance?.orphan_count ?? 0) === 0}
                    >
                      {cleaningOrphans ? 'Borrando huérfanos...' : 'Borrar huérfanos'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void fetchOpsData()}>
                      Actualizar operaciones
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-slate-500">PDFs duplicados</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {duplicatePdfRows.length.toLocaleString('es-AR')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Grupos detectados por materia, nombre y páginas.</p>
                  </CardContent>
                </Card>
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-slate-500">Errores cliente 7d</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {(systemHealth?.total_errors ?? 0).toLocaleString('es-AR')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Latencia media: {(systemHealth?.avg_latency_ms ?? 0).toLocaleString('es-AR')} ms
                    </p>
                  </CardContent>
                </Card>
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-slate-500">Archivos huérfanos</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {(fileMaintenance?.orphan_count ?? 0).toLocaleString('es-AR')}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Objetos en storage sin registro asociado.</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Duplicados detectados</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[440px] space-y-3 overflow-y-auto">
                    {duplicatePdfRows.length === 0 ? (
                      <p className="text-sm text-slate-500">No encontramos duplicados en la biblioteca actual.</p>
                    ) : (
                      duplicatePdfRows.slice(0, 20).map((row) => (
                        <div key={`${row.materia_id ?? 'sin-materia'}-${row.normalized_name}`} className="rounded-xl border border-slate-200 p-3">
                          <p className="text-sm font-semibold text-slate-800">{row.recursos[0]?.nombre ?? 'Archivo sin nombre'}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {row.count} coincidencias · materia {row.materia_id ?? 'sin asignar'}
                          </p>
                          <div className="mt-2 space-y-1">
                            {row.recursos.slice(0, 4).map((resource) => (
                              <div key={resource.id} className="rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-600">
                                {resource.nombre}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Salud y mantenimiento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rutas con más errores</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Acá ves los endpoints o pantallas donde más se repitieron errores cliente en los últimos 7 días.
                      </p>
                      <div className="mt-2 space-y-2">
                        {(systemHealth?.failures_by_path ?? []).length === 0 ? (
                          <p className="text-sm text-slate-500">Sin errores recientes registrados.</p>
                        ) : (
                          (systemHealth?.failures_by_path ?? []).map((row) => (
                            <div key={row.path} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                              <span className="truncate text-slate-700">{row.path}</span>
                              <span className="font-semibold text-rose-600">{row.count}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detalle de errores recientes</p>
                      <div className="mt-2 space-y-2">
                        {(systemHealth?.recent_errors ?? []).length === 0 ? (
                          <p className="text-sm text-slate-500">No hay trazas recientes para mostrar.</p>
                        ) : (
                          (systemHealth?.recent_errors ?? []).map((row, index) => (
                            <div key={`${row.path}-${row.created_at ?? index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-800">{row.path}</span>
                                <span className="text-[11px] text-slate-500">
                                  {row.created_at ? new Date(row.created_at).toLocaleString('es-AR') : 'Fecha no disponible'}
                                </span>
                              </div>
                              <p className="mt-2 text-xs leading-5 text-slate-600">{row.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Muestra de archivos huérfanos</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Son archivos que siguen existiendo en Storage pero ya no tienen registro asociado en la base. Suelen aparecer cuando un upload quedó incompleto o cuando se borró el registro pero no el archivo.
                      </p>
                      <div className="mt-2 space-y-2">
                        {(fileMaintenance?.orphan_sample ?? []).length === 0 ? (
                          <p className="text-sm text-slate-500">No hay archivos huérfanos detectados.</p>
                        ) : (
                          (fileMaintenance?.orphan_sample ?? []).slice(0, 8).map((filePath) => (
                            <div key={filePath} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                              {filePath}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Cómo resolverlo</p>
                        <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900">
                          <li>1. Si el archivo sí debería existir, recreá su registro en `recursos`, `materiales` o `resumenes`.</li>
                          <li>2. Si quedó de una carga rota o ya no se usa, eliminá el objeto del bucket `biblioteca`.</li>
                          <li>3. Si ves muchos casos del mismo prefijo, revisá el flujo de carga de esa materia o carrera.</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-10">
              <div>
                <p className="eyebrow-label">Estructura académica</p>
                <h3 className="section-title mt-2">Configuración del catálogo</h3>
                <p className="section-copy mt-2">Gestioná universidades, carreras, materias compartidas e importaciones masivas desde una sola sección.</p>
              </div>

              {/* Prompt Section */}
              <Card className={`${ADMIN_PANEL_SUBCARD_CLASS} overflow-hidden`}>
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                  <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">Prompt de extracción IA</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Textarea
                    value={promptSistema}
                    onChange={(e) => setPromptSistema(e.target.value)}
                    className="min-h-[200px] rounded-2xl font-mono text-sm border-slate-200 focus:ring-blue-500 p-5 bg-slate-50/30"
                    placeholder="Escribí acá el prompt del sistema..."
                  />
                  <Button onClick={savePromptSistema} disabled={loadingPrompt} className="rounded-xl h-11 px-6 font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
                    {loadingPrompt ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    GUARDAR CAMBIOS EN IA
                  </Button>
                </CardContent>
              </Card>

              {/* Universidades, Carreras, Materias */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                {/* Universidades */}
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Universidades</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nueva Uni"
                        value={nuevaUni}
                        onChange={(e) => setNuevaUni(e.target.value)}
                        className="rounded-xl h-11 border-slate-200 bg-white"
                      />
                      <Button size="icon" onClick={agregarUniversidad} disabled={loadingUni} className="rounded-xl h-11 w-11 shrink-0 bg-blue-600">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                      {universidades.map((uni) => (
                        <div key={uni.id} className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          selectedUniId === uni.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-300 hover:bg-blue-50/50'
                        }`} onClick={() => setSelectedUniId(uni.id)}>
                          <span className="truncate flex-1 uppercase tracking-tight">{uni.nombre}</span>
                          <button onClick={(e) => { e.stopPropagation(); eliminarUniversidad(uni.id); }} className={`${selectedUniId === uni.id ? 'text-blue-200 hover:text-white' : 'text-slate-300 hover:text-red-500'}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Carreras */}
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Carreras</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nueva Carrera"
                        value={nuevaCarrera}
                        onChange={(e) => setNuevaCarrera(e.target.value)}
                        disabled={!selectedUniId}
                        className="rounded-xl h-11 border-slate-200 bg-white"
                      />
                      <Button size="icon" onClick={agregarCarrera} disabled={loadingCarrera || !selectedUniId} className="rounded-xl h-11 w-11 shrink-0 bg-blue-600">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                      {carreras.map((c) => (
                        <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          selectedCarreraId === c.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-300 hover:bg-blue-50/50'
                        }`} onClick={() => setSelectedCarreraId(c.id)}>
                          <span className="truncate flex-1 uppercase tracking-tight">{c.nombre}</span>
                          <button onClick={(e) => { e.stopPropagation(); eliminarCarrera(c.id); }} className={`${selectedCarreraId === c.id ? 'text-blue-200 hover:text-white' : 'text-slate-300 hover:text-red-500'}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {!selectedUniId && (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-300">
                          <Plus className="h-8 w-8 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Selecciona una universidad</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Materias */}
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider">Materias</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          Asignar a carreras
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {carreras.map((carrera) => {
                            const active = materiaCarreraIds.includes(carrera.id);
                            return (
                              <button
                                key={carrera.id}
                                type="button"
                                onClick={() => toggleMateriaCarrera(carrera.id)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                  active
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'
                                }`}
                              >
                                {carrera.nombre}
                              </button>
                            );
                          })}
                        </div>
                        {!selectedCarreraId ? (
                          <p className="text-xs text-slate-400">
                            Selecciona una carrera y luego marca todas las que deban compartir la materia.
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          Importacion masiva Excel
                        </p>
                        <p className="text-xs text-slate-500">
                          Sube la malla con carreras en la primera fila y las materias debajo de cada columna.
                          Las carreras faltantes se van a crear dentro de la universidad seleccionada.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(event) => void handleMateriaImportFile(event.target.files?.[0] ?? null)}
                          className="h-11 rounded-xl border-slate-200 bg-white"
                        />
                        <Button
                          onClick={importarMateriasDesdeExcel}
                          disabled={!materiasImportFile || loadingMateriasImport}
                          className="h-11 rounded-xl bg-slate-900 px-5 text-white hover:bg-slate-800"
                        >
                          {loadingMateriasImport ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Importar malla
                        </Button>
                      </div>
                      {!selectedUniId ? (
                        <p className="text-xs text-amber-700">
                          Primero selecciona la universidad donde quieras crear las carreras nuevas.
                        </p>
                      ) : null}
                      {materiasImportFile ? (
                        <p className="text-xs text-slate-500">
                          Archivo listo: <span className="font-semibold text-slate-700">{materiasImportFile.name}</span>
                          {materiasImportPreviewCount !== null
                            ? ` · ${materiasImportPreviewCount} materias detectadas`
                            : ''}
                        </p>
                      ) : null}
                      {materiasImportResult ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                          <p className="font-semibold text-slate-800">{materiasImportResult.message}</p>
                          <div className="mt-2 flex flex-wrap gap-3">
                            <span>Carreras nuevas: <strong>{materiasImportResult.carrerasCreated ?? 0}</strong></span>
                            <span>Filas validas: <strong>{materiasImportResult.filasProcesadas ?? 0}</strong></span>
                            <span>Materias nuevas: <strong>{materiasImportResult.materiasCreated ?? 0}</strong></span>
                            <span>Materias reutilizadas: <strong>{materiasImportResult.materiasReused ?? 0}</strong></span>
                            <span>Asignaciones nuevas: <strong>{materiasImportResult.relacionesCreated ?? 0}</strong></span>
                          </div>
                          {materiasImportResult.carrerasNoEncontradas && materiasImportResult.carrerasNoEncontradas.length > 0 ? (
                            <p className="mt-2 text-amber-700">
                              Carreras no encontradas: {materiasImportResult.carrerasNoEncontradas.join(', ')}
                            </p>
                          ) : null}
                          {materiasImportResult.materiasSinCarrerasValidas && materiasImportResult.materiasSinCarrerasValidas.length > 0 ? (
                            <p className="mt-2 text-rose-700">
                              Materias sin carreras validas: {materiasImportResult.materiasSinCarrerasValidas.join(', ')}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nueva Materia"
                        value={nuevaMateria}
                        onChange={(e) => setNuevaMateria(e.target.value)}
                        disabled={materiaCarreraIds.length === 0}
                        className="rounded-xl h-11 border-slate-200 bg-white"
                      />
                      <Button size="icon" onClick={agregarMateria} disabled={loadingMateria || materiaCarreraIds.length === 0} className="rounded-xl h-11 w-11 shrink-0 bg-blue-600">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                      {materias.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white text-xs font-bold text-slate-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all">
                          <div className="min-w-0 flex-1">
                            <span className="truncate block uppercase tracking-tight">{m.nombre}</span>
                            <span className="mt-1 block text-[10px] font-medium normal-case tracking-normal text-slate-400">
                              {m.sharedCareerCount && m.sharedCareerCount > 1
                                ? `Compartida con ${m.sharedCareerCount} carreras`
                                : m.slug === 'aprender-21' || m.slug === 'tecnologia-humanidades'
                                  ? 'Materia global'
                                  : 'Asignada a esta carrera'}
                            </span>
                          </div>
                          <button onClick={() => eliminarMateria(m.id)} className="text-slate-300 hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {!selectedCarreraId && (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-300">
                          <Plus className="h-8 w-8 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Selecciona una carrera</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'estadisticas' && (
            <div className="space-y-5">
              <div>
                <p className="eyebrow-label">Analítica del producto</p>
                <h3 className="section-title mt-2">Estadísticas y comportamiento</h3>
                <p className="section-copy mt-2">Métricas clave, tendencias y ranking de preguntas bajo una presentación más propia de una SaaS.</p>
              </div>
              <div className={`${ADMIN_PANEL_SUBCARD_CLASS} p-3`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-slate-800">Resumen general</h2>
                  <div className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">
                    Últimos 30 días
                  </div>
                </div>
              </div>

              {!stats ? (
                <Card className="rounded-2xl border-slate-100">
                  <CardContent className="p-6 text-sm text-slate-500">
                    {loadingStats ? 'Estamos preparando las estadísticas...' : 'Todavía no hay datos para mostrar.'}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                      <CardContent className="p-4">
                        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 w-fit">
                          <Users className="h-4 w-4" />
                        </div>
                        <p className="mt-3 text-[11px] font-medium text-slate-500">Usuarios activos</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{stats.dau.toLocaleString('es-AR')}</p>
                        <p className="mt-1 text-xs text-emerald-600">
                          {stats.users.total.toLocaleString('es-AR')} totales
                        </p>
                      </CardContent>
                    </Card>
                    <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                      <CardContent className="p-4">
                        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 w-fit">
                          <BarChart3 className="h-4 w-4" />
                        </div>
                        <p className="mt-3 text-[11px] font-medium text-slate-500">Nuevos usuarios</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{stats.users.new_last_7d.toLocaleString('es-AR')}</p>
                        <p className={`mt-1 text-xs ${stats.users.growth_pct_vs_previous_7d >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {stats.users.growth_pct_vs_previous_7d >= 0 ? '+' : ''}
                          {stats.users.growth_pct_vs_previous_7d}% vs 7d previos
                        </p>
                      </CardContent>
                    </Card>
                    <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                      <CardContent className="p-4">
                        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 w-fit">
                          <Zap className="h-4 w-4" />
                        </div>
                        <p className="mt-3 text-[11px] font-medium text-slate-500">Simuladores realizados</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{stats.activity.simulator_attempts_total.toLocaleString('es-AR')}</p>
                        <p className="mt-1 text-xs text-slate-500">Intentos guardados en la plataforma</p>
                      </CardContent>
                    </Card>
                    <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                      <CardContent className="p-4">
                        <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 w-fit">
                          <Brain className="h-4 w-4" />
                        </div>
                        <p className="mt-3 text-[11px] font-medium text-slate-500">Preguntas respondidas</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{stats.activity.answers_total.toLocaleString('es-AR')}</p>
                        <p className="mt-1 text-xs text-slate-500">Respuestas registradas en historial</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                    <Card className={`${ADMIN_PANEL_SUBCARD_CLASS} xl:col-span-1`}>
                      <CardHeader className="pb-1 pt-3">
                        <CardTitle className="text-sm">Uso de la plataforma</CardTitle>
                      </CardHeader>
                      <CardContent className="h-64 px-3 pb-3">
                        {stats ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={platformUsageData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Legend wrapperStyle={{ fontSize: '11px' }} />
                              <Line type="monotone" dataKey="sesiones" stroke="#2563eb" strokeWidth={2.3} dot={false} name="Sesiones" />
                              <Line type="monotone" dataKey="usuarios" stroke="#a78bfa" strokeWidth={2.3} dot={false} name="Usuarios" />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
                            <p>No hay estadísticas cargadas todavía.</p>
                            <p className="mt-2 text-xs text-slate-400">Refresca el panel o revisa la conexión con analytics.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                      <CardHeader className="pb-1 pt-3">
                        <CardTitle className="text-sm">Materias mas utilizadas</CardTitle>
                      </CardHeader>
                      <CardContent className="h-64 px-3 pb-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={materiasUsoChartData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={48}
                              outerRadius={80}
                              paddingAngle={2}
                            >
                              {materiasUsoChartData.map((_, index) => (
                                <Cell
                                  key={`m-${index}`}
                                  fill={['#2563eb', '#8b5cf6', '#f59e0b', '#14b8a6', '#94a3b8'][index % 5]}
                                />
                              ))}
                            </Pie>
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                      <CardHeader className="pb-1 pt-3">
                        <CardTitle className="text-sm">Retención de usuarios</CardTitle>
                      </CardHeader>
                      <CardContent className="h-64 px-3 pb-3">
                        {stats ? (
                          <>
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={retentionChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                                <Tooltip />
                                <Area type="monotone" dataKey="value" stroke="#7c3aed" fill="#ede9fe" strokeWidth={2.3} />
                              </AreaChart>
                            </ResponsiveContainer>
                            <p className="mt-2 text-right text-xs text-slate-500">
                              Retención a 30 días: <span className="font-bold text-violet-700">{retentionChartData[retentionChartData.length - 1]?.value ?? 0}%</span>
                            </p>
                          </>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-500">
                            <p>La retención aparecerá cuando tengamos datos procesados.</p>
                            <p className="mt-2 text-xs text-slate-400">Por ahora no pudimos cargar esa serie.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                    <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2 pt-3">
                      <div>
                        <CardTitle className="text-sm">Top 10 materias más compartidas por carreras</CardTitle>
                        <p className="mt-1 text-xs text-slate-500">
                          Materias asociadas a más carreras dentro de la plataforma.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => setShowAllSharedMaterias(true)}
                        disabled={!stats || (stats.shared_materias_by_careers?.length ?? 0) === 0}
                      >
                        Ver más
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-2 p-4">
                      {sharedMateriasTop.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          Todavía no hay materias compartidas entre carreras para mostrar.
                        </p>
                      ) : (
                        sharedMateriasTop.map((item, index) => (
                          <div
                            key={item.materia_id}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                #{index + 1}
                              </p>
                              <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                            </div>
                            <span className="ml-3 shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {item.career_count} carreras
                            </span>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm">Embudo de conversión</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 p-4">
                        {[
                          { label: 'Sesiones', value: stats.conversion.sessions_total },
                          { label: 'Explorar', value: stats.conversion.reached_explorar },
                          { label: 'Carrera', value: stats.conversion.reached_carrera },
                          { label: 'Materia', value: stats.conversion.reached_materia },
                          { label: 'Simulador', value: stats.conversion.reached_simulador },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                              <span>{item.label}</span>
                              <span className="font-semibold text-slate-700">{item.value.toLocaleString('es-AR')}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    stats.conversion.sessions_total > 0
                                      ? (item.value / stats.conversion.sessions_total) * 100
                                      : 0
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                          Mayor abandono detectado en: <span className="font-semibold text-slate-900">{stats.conversion.top_abandon_stage}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm">Distribución por dispositivo</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                          <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={deviceDistributionData}
                                  dataKey="value"
                                  nameKey="name"
                                  innerRadius={42}
                                  outerRadius={64}
                                  stroke="none"
                                  paddingAngle={2}
                                >
                                  {deviceDistributionData.map((item) => (
                                    <Cell key={item.name} fill={item.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-3">
                            {deviceDistributionData.length === 0 ? (
                              <p className="text-sm text-slate-500">Todavía no hay eventos de dispositivos para mostrar.</p>
                            ) : (
                              deviceDistributionData.map((item) => {
                                const total =
                                  stats.devices.desktop + stats.devices.mobile + stats.devices.tablet;
                                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
                                return (
                                  <div key={item.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                    <div className="flex items-center gap-3">
                                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                      <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-slate-900">{pct}%</p>
                                      <p className="text-xs text-slate-500">{item.value.toLocaleString('es-AR')}</p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm">Top páginas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 p-4">
                      {stats.top_pages.length === 0 ? (
                        <p className="text-sm text-slate-500">Todavía no hay páginas destacadas para mostrar.</p>
                      ) : (
                        stats.top_pages.slice(0, 6).map((page) => (
                          <div key={page.path} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <p className="truncate pr-3 text-sm text-slate-700">{page.path}</p>
                            <span className="shrink-0 text-xs font-semibold text-slate-500">{page.views} vistas</span>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm">Errores y señales técnicas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4">
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Total de errores detectados: <span className="font-bold">{stats.errors.total.toLocaleString('es-AR')}</span>
                      </div>
                      {stats.errors.top_paths.length === 0 ? (
                        <p className="text-sm text-slate-500">No hay rutas con errores para mostrar.</p>
                      ) : (
                        stats.errors.top_paths.map((item) => (
                          <div key={item.path} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                            <p className="truncate pr-3 text-sm text-slate-700">{item.path}</p>
                            <span className="shrink-0 text-xs font-semibold text-rose-600">{item.count} errores</span>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                    <CardHeader className="pb-2 pt-3">
                      <CardTitle className="text-sm">Ranking global de preguntas (materia/parcial)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <Select value={rankingMateriaId} onValueChange={setRankingMateriaId}>
                          <SelectTrigger className="h-10 rounded-xl border-slate-200">
                            <SelectValue placeholder="Materia" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas las materias</SelectItem>
                            {allMateriasCatalog.map((m) => (
                              <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={rankingParcial} onValueChange={setRankingParcial}>
                          <SelectTrigger className="h-10 rounded-xl border-slate-200">
                            <SelectValue placeholder="Parcial" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los parciales</SelectItem>
                            <SelectItem value="1">Parcial 1</SelectItem>
                            <SelectItem value="2">Parcial 2</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="md:col-span-2 flex justify-end">
                          <Button variant="outline" onClick={() => void fetchRankingGlobal()} disabled={loadingRankingGlobal} className="rounded-xl">
                            {loadingRankingGlobal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Actualizar ranking global
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Mas falladas</p>
                          <div className="mt-2 space-y-2">
                            {rankingFailed.length === 0 ? (
                              <p className="text-xs text-slate-500">Sin datos para este filtro.</p>
                            ) : rankingFailed.map((row) => (
                              <div key={`f-${row.pregunta_id}`} className="rounded-lg border border-rose-100 bg-white p-2">
                                <p className="text-xs font-semibold text-slate-800 line-clamp-2">{row.enunciado}</p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                  Incorrectas: <span className="font-bold text-rose-700">{row.respuestas_incorrectas}</span> ·
                                  Totales: <span className="font-bold">{row.respuestas_totales}</span> ·
                                  Acierto: <span className="font-bold">{row.tasa_acierto}%</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Mas acertadas</p>
                          <div className="mt-2 space-y-2">
                            {rankingCorrect.length === 0 ? (
                              <p className="text-xs text-slate-500">Sin datos para este filtro.</p>
                            ) : rankingCorrect.map((row) => (
                              <div key={`c-${row.pregunta_id}`} className="rounded-lg border border-emerald-100 bg-white p-2">
                                <p className="text-xs font-semibold text-slate-800 line-clamp-2">{row.enunciado}</p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                  Correctas: <span className="font-bold text-emerald-700">{row.respuestas_correctas}</span> ·
                                  Totales: <span className="font-bold">{row.respuestas_totales}</span> ·
                                  Acierto: <span className="font-bold">{row.tasa_acierto}%</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {activeTab === 'ia' && (
            <div className="space-y-5">
              <div>
                <p className="eyebrow-label">Inteligencia aplicada</p>
                <h3 className="section-title mt-2">Panel de IA</h3>
                <p className="section-copy mt-2">Rendimiento de explicaciones, edición del banco y revisión de feedback desde un workspace más ordenado.</p>
              </div>

              <Card className={`${ADMIN_PANEL_SUBCARD_CLASS} overflow-hidden`}>
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider">
                    <Brain className="h-4 w-4 text-blue-600" />
                    Ranking de errores explicados por IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => void fetchIARanking()} disabled={loadingIARanking} className="rounded-xl">
                      {loadingIARanking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Actualizar ranking IA
                    </Button>
                  </div>
                  {iaRankingRows.map((row) => (
                    <div key={row.pregunta_id} className="rounded-[1rem] border border-slate-200/80 bg-white p-3 shadow-[var(--shadow-soft)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-800">{row.enunciado}</p>
                          <p className="text-xs text-slate-500">Fallos: <span className="font-bold">{row.veces_fallada}</span> · IA: {row.provider ?? 'sin proveedor'}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={async () => {
                            setRefreshingPreguntaId(row.pregunta_id);
                            const result = await regenerarExplicacionIA(row.pregunta_id);
                            setRefreshingPreguntaId(null);
                            if (result.success) {
                              toast({ description: result.message });
                              await fetchIARanking();
                            } else {
                              toast({ description: result.message, variant: 'destructive' });
                            }
                          }}
                          disabled={refreshingPreguntaId === row.pregunta_id}
                          className="rounded-xl bg-blue-600 hover:bg-blue-700"
                        >
                          {refreshingPreguntaId === row.pregunta_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                          Regenerar
                        </Button>
                      </div>
                      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Explicacion guardada</p>
                        <p className="mt-1 text-sm text-slate-700">{row.explicacion ?? 'Esta pregunta todavia no tiene explicacion cacheada.'}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardHeader className="pb-1 pt-4"><CardTitle className="text-sm">Feedback de explicaciones IA</CardTitle></CardHeader>
                  <CardContent className="h-48 px-2.5 pb-2.5">
                    {feedbackStats ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[{ name: 'Me ayudo', value: feedbackStats.positive }, { name: 'No me ayudo', value: feedbackStats.negative }]} dataKey="value" nameKey="name" outerRadius={70} label>
                            <Cell fill="#16a34a" />
                            <Cell fill="#dc2626" />
                          </Pie>
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-slate-500">Sin feedback todavia.</p>
                    )}
                  </CardContent>
                </Card>
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Editor de preguntas IA + dificultad</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const result = await recalcularDificultadPreguntasAdmin();
                        if (result.success) {
                          toast({ description: result.message });
                          await fetchOpsData();
                        } else {
                          toast({ description: result.message, variant: 'destructive' });
                        }
                      }}
                    >
                      Recalcular dificultad
                    </Button>
                  </CardHeader>
                  <CardContent className="max-h-[480px] space-y-3 overflow-y-auto">
                    {questionEditorRows.slice(0, 25).map((question) => (
                      <div key={question.id} className="rounded-xl border border-slate-200 p-3">
                        <Input
                          defaultValue={question.enunciado}
                          onBlur={async (e) => {
                            const result = await actualizarPreguntaEditorAdmin({
                              id: question.id,
                              enunciado: e.target.value,
                              opciones: question.opciones,
                              respuesta_correcta: question.respuesta_correcta,
                            });
                            if (!result.success) toast({ description: result.message, variant: 'destructive' });
                          }}
                          className="mb-2"
                        />
                        <p className="text-xs text-slate-500">Dificultad: <span className="font-semibold">{question.dificultad ?? 'sin calcular'}</span> · Tasa: <span className="font-semibold">{question.tasa_acierto ?? 0}%</span></p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                <CardHeader className="pb-1 pt-4">
                  <CardTitle className="text-sm">Revision de feedback de IA (pulgar abajo)</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[420px] space-y-3 overflow-y-auto">
                  {feedbackReviewRows.filter((row) => row.voto === -1).length === 0 ? (
                    <p className="text-sm text-slate-500">Todavia no hay feedback negativo para revisar.</p>
                  ) : (
                    feedbackReviewRows
                      .filter((row) => row.voto === -1)
                      .slice(0, 20)
                      .map((row) => (
                        <div key={`${row.pregunta_id}-${row.created_at}`} className="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
                          <p className="text-xs font-semibold text-rose-700">Feedback: No me ayudo · {new Date(row.created_at).toLocaleString('es-AR')}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{row.enunciado}</p>
                          <p className="mt-2 text-xs text-slate-600">
                            IA: {row.provider ?? 'sin provider'}
                          </p>
                          <p className="mt-1 text-sm text-slate-700">
                            {row.explicacion ?? 'Esta pregunta no tiene explicacion cacheada actualmente.'}
                          </p>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'usuarios' && (
            <div className="space-y-5">
              <div>
                <p className="eyebrow-label">Gestión de acceso</p>
                <h3 className="section-title mt-2">Usuarios y roles</h3>
                <p className="section-copy mt-2">Controlá altas, actividad, planes y permisos desde una tabla mucho más consistente con el resto del backoffice.</p>
              </div>
              <div className={`${ADMIN_PANEL_SUBCARD_CLASS} p-3`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-slate-800">Usuarios</h2>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Buscar email, rol o plan"
                      className="h-9 w-full rounded-xl border-slate-200 bg-white sm:w-[220px]"
                    />
                    <Button variant="outline" size="sm" onClick={() => void fetchUsuariosAdmin()} disabled={loadingUsers}>
                      {loadingUsers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Actualizar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-slate-500">Usuarios totales</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{visibleUsers.length.toLocaleString('es-AR')}</p>
                  </CardContent>
                </Card>
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-slate-500">Activos</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">
                      {adminUsers.filter((u) => u.estado === 'activo').length.toLocaleString('es-AR')}
                    </p>
                  </CardContent>
                </Card>
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-slate-500">Administradores</p>
                    <p className="mt-1 text-2xl font-bold text-indigo-700">
                      {adminUsers.filter((u) => u.role === 'admin').length.toLocaleString('es-AR')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className={`${ADMIN_PANEL_SUBCARD_CLASS} overflow-hidden`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Lista completa</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[520px] overflow-y-auto p-0">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="px-4 py-2 font-semibold">Email</th>
                        <th className="px-4 py-2 font-semibold">Estado</th>
                        <th className="px-4 py-2 font-semibold">Rol</th>
                        <th className="px-4 py-2 font-semibold">Plan</th>
                        <th className="px-4 py-2 font-semibold">Ultimo ingreso</th>
                        <th className="px-4 py-2 font-semibold">Alta</th>
                        <th className="px-4 py-2 font-semibold">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleUsers.map((u) => (
                        <tr key={u.id} className="border-b border-slate-100">
                          <td className="px-4 py-2 text-slate-700">{u.email}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                u.estado === 'activo'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {u.estado}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                u.role === 'admin'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                u.plan === 'premium'
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {u.plan}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('es-AR') : '-'}
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '-'}
                          </td>
                          <td className="px-4 py-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const nextRole = u.role === 'admin' ? 'student' : 'admin';
                                const result = await actualizarRolUsuarioAdmin(u.id, nextRole);
                                if (result.success) {
                                  toast({ description: result.message });
                                  await fetchUsuariosAdmin();
                                } else {
                                  toast({ description: result.message, variant: 'destructive' });
                                }
                              }}
                              className="h-8 rounded-lg text-[11px]"
                            >
                              {u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!loadingUsers && visibleUsers.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">No hay usuarios para mostrar.</p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'monetizacion' && (
            <div className="space-y-5">
              <div>
                <p className="eyebrow-label">Negocio y premium</p>
                <h3 className="section-title mt-2">Monetización</h3>
                <p className="section-copy mt-2">Visualizá suscripciones, estado de planes e ingresos estimados con una lectura más ejecutiva.</p>
              </div>
              <div className={`${ADMIN_PANEL_SUBCARD_CLASS} p-3`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-slate-800">Monetizacion</h2>
                  <Button variant="outline" size="sm" onClick={() => void fetchMonetizacionAdmin()} disabled={loadingMonetizacion}>
                    {loadingMonetizacion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Actualizar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-slate-500">Suscripciones</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {(monetizacion?.totalSuscripciones ?? 0).toLocaleString('es-AR')}
                    </p>
                  </CardContent>
                </Card>
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-slate-500">Activas</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">
                      {(monetizacion?.activas ?? 0).toLocaleString('es-AR')}
                    </p>
                  </CardContent>
                </Card>
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-slate-500">Canceladas</p>
                    <p className="mt-1 text-2xl font-bold text-rose-700">
                      {(monetizacion?.canceladas ?? 0).toLocaleString('es-AR')}
                    </p>
                  </CardContent>
                </Card>
                <Card className={ADMIN_PANEL_SUBCARD_CLASS}>
                  <CardContent className="p-4">
                    <p className="text-[11px] text-slate-500">Ingreso mensual estimado (ARS)</p>
                    <p className="mt-1 text-2xl font-bold text-indigo-700">
                      ${(monetizacion?.ingresoMensualEstimadoArs ?? 0).toLocaleString('es-AR')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className={`${ADMIN_PANEL_SUBCARD_CLASS} overflow-hidden`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Planes / Pagos / Precios / Estado</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="px-4 py-2 font-semibold">Plan</th>
                        <th className="px-4 py-2 font-semibold">Codigo</th>
                        <th className="px-4 py-2 font-semibold">Precio</th>
                        <th className="px-4 py-2 font-semibold">Periodicidad</th>
                        <th className="px-4 py-2 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(monetizacion?.planes ?? []).map((plan) => (
                        <tr key={plan.id} className="border-b border-slate-100">
                          <td className="px-4 py-2 text-slate-800">{plan.name}</td>
                          <td className="px-4 py-2 text-slate-600">{plan.code}</td>
                          <td className="px-4 py-2 text-slate-700">${plan.price_ars.toLocaleString('es-AR')}</td>
                          <td className="px-4 py-2 text-slate-600">{plan.interval}</td>
                          <td className="px-4 py-2">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                                plan.is_active
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {plan.is_active ? 'activo' : 'inactivo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!loadingMonetizacion && (monetizacion?.planes?.length ?? 0) === 0 ? (
                    <p className="p-4 text-sm text-slate-500">No hay planes cargados todavia.</p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Dialog open={showAllSharedMaterias} onOpenChange={setShowAllSharedMaterias}>
          <DialogContent className="max-w-3xl rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl">
            <DialogHeader className="border-b border-slate-100 px-6 py-5">
              <DialogTitle className="text-lg font-bold text-slate-950">
                Materias compartidas por carreras
              </DialogTitle>
              <p className="mt-1 text-sm text-slate-500">
                Listado completo de materias y la cantidad de carreras a las que pertenecen.
              </p>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {stats?.shared_materias_by_careers?.length ? (
                <div className="space-y-2">
                  {stats.shared_materias_by_careers.map((item, index) => (
                    <div
                      key={item.materia_id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          #{index + 1}
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        {item.career_count} carreras
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No hay materias compartidas para mostrar todavía.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <style jsx global>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}







