'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, School } from 'lucide-react';
import { loadDashboardAcademicOptionsAction } from '@/app/dashboard/materiales/academic-options-actions';
import {
  createPrivatePendingCareerAction,
  createPrivatePendingUniversityAction,
} from '@/app/completar-perfil/pending-academic-actions';
import { saveSimpleAcademicProfileAction } from '@/app/completar-perfil/academic-profile-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type University = { id: string; nombre: string };
type Career = { id: string; nombre: string; universidad_id: string | null };

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function AcademicProfileSimpleForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [universityId, setUniversityId] = useState('');
  const [careerId, setCareerId] = useState('');
  const [universitySearch, setUniversitySearch] = useState('');
  const [careerSearch, setCareerSearch] = useState('');
  const [universitySuggestions, setUniversitySuggestions] = useState(false);
  const [careerSuggestions, setCareerSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void loadDashboardAcademicOptionsAction().then((result) => {
      if (!active) return;
      if (!result.success) {
        setError(result.message);
        return;
      }
      setUniversities(result.universidades);
      setCareers(result.carreras);
      const university = result.universidades.find((item) => item.id === result.profile.universidadId);
      const career = result.carreras.find((item) => item.id === result.profile.carreraId &&
        item.universidad_id === result.profile.universidadId);
      if (university) {
        setUniversityId(university.id);
        setUniversitySearch(university.nombre);
      }
      if (career) {
        setCareerId(career.id);
        setCareerSearch(career.nombre);
      }
    }).catch(() => {
      if (active) setError('No pudimos cargar las opciones académicas. Recargá la página.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const universityMatches = useMemo(
    () => universities.filter((item) => normalize(item.nombre).includes(normalize(universitySearch))).slice(0, 6),
    [universities, universitySearch]
  );
  const availableCareers = useMemo(
    () => careers.filter((item) => item.universidad_id === universityId),
    [careers, universityId]
  );
  const careerMatches = useMemo(
    () => availableCareers.filter((item) => normalize(item.nombre).includes(normalize(careerSearch))).slice(0, 6),
    [availableCareers, careerSearch]
  );

  async function createUniversity() {
    if (busy || universitySearch.trim().length < 3) return;
    setBusy(true);
    setError('');
    try {
      const result = await createPrivatePendingUniversityAction({ universidadNombre: universitySearch.trim() });
      if (!result.success) {
        setError(result.message);
        return;
      }
      const university = { id: result.universidad.id, nombre: result.universidad.nombre };
      setUniversities((current) => [university, ...current.filter((item) => item.id !== university.id)]);
      selectUniversity(university);
    } catch {
      setError('No pudimos agregar la universidad. Intentá nuevamente.');
    } finally {
      setBusy(false);
    }
  }

  function selectUniversity(university: University) {
    setUniversityId(university.id);
    setUniversitySearch(university.nombre);
    setCareerId('');
    setCareerSearch('');
    setUniversitySuggestions(false);
    setError('');
  }

  async function createCareer() {
    if (busy || !universityId || careerSearch.trim().length < 3) return;
    setBusy(true);
    setError('');
    try {
      const result = await createPrivatePendingCareerAction({
        universidadId: universityId,
        carreraNombre: careerSearch.trim(),
      });
      if (!result.success) {
        setError(result.message);
        return;
      }
      const career = {
        id: result.carrera.id,
        nombre: result.carrera.nombre,
        universidad_id: result.carrera.universidad_id,
      };
      setCareers((current) => [career, ...current.filter((item) => item.id !== career.id)]);
      setCareerId(career.id);
      setCareerSearch(career.nombre);
      setCareerSuggestions(false);
    } catch {
      setError('No pudimos agregar la carrera. Intentá nuevamente.');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (busy || !universityId || !careerId) return;
    setBusy(true);
    setError('');
    try {
      const result = await saveSimpleAcademicProfileAction({ universidadId: universityId, carreraId: careerId });
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError('No pudimos guardar tus datos. Intentá nuevamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-950">¿Dónde estudiás?</h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Contanos tu universidad y carrera. Son dos datos, y podés completarlos más adelante.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="academic-university" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <School className="h-4 w-4 text-slate-500" /> Universidad
          </label>
          <Input
            id="academic-university"
            autoComplete="off"
            placeholder="Ej. Universidad Nacional de Córdoba"
            value={universitySearch}
            disabled={loading || busy}
            onFocus={() => setUniversitySuggestions(true)}
            onChange={(event) => {
              setUniversitySearch(event.target.value);
              setUniversityId('');
              setCareerId('');
              setCareerSearch('');
              setUniversitySuggestions(true);
            }}
          />
          {universitySuggestions && !universityId && !loading ? (
            <div className="mt-2 max-h-44 overflow-auto rounded-xl border border-slate-200 bg-white p-1">
              {universityMatches.map((item) => (
                <button type="button" key={item.id} onClick={() => selectUniversity(item)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50">
                  {item.nombre}
                </button>
              ))}
              {universitySearch.trim().length >= 3 ? (
                <button type="button" onClick={() => void createUniversity()} disabled={busy}
                  className="block w-full rounded-lg border-t border-slate-100 px-3 py-2 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50">
                  Mi universidad no aparece · Agregarla
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {universityId ? (
          <div>
            <label htmlFor="academic-career" className="mb-2 block text-sm font-semibold text-slate-800">Carrera</label>
            <Input
              id="academic-career"
              autoComplete="off"
              placeholder="Ej. Contador Público"
              value={careerSearch}
              disabled={loading || busy}
              onFocus={() => setCareerSuggestions(true)}
              onChange={(event) => {
                setCareerSearch(event.target.value);
                setCareerId('');
                setCareerSuggestions(true);
              }}
            />
            {careerSuggestions && !careerId && !loading ? (
              <div className="mt-2 max-h-44 overflow-auto rounded-xl border border-slate-200 bg-white p-1">
                {careerMatches.map((item) => (
                  <button type="button" key={item.id} onClick={() => {
                    setCareerId(item.id);
                    setCareerSearch(item.nombre);
                    setCareerSuggestions(false);
                    setError('');
                  }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50">
                    {item.nombre}
                  </button>
                ))}
                {careerSearch.trim().length >= 3 ? (
                  <button type="button" onClick={() => void createCareer()} disabled={busy}
                    className="block w-full rounded-lg border-t border-slate-100 px-3 py-2 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50">
                    Mi carrera no aparece · Agregarla
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-500">Cargando universidades y carreras…</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-7 flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => router.replace(nextPath)} disabled={busy}>
          Ahora no
        </Button>
        <Button type="button" onClick={() => void save()} disabled={loading || busy || !universityId || !careerId}>
          {busy ? 'Guardando…' : 'Guardar y continuar'}
        </Button>
      </div>
    </div>
  );
}
