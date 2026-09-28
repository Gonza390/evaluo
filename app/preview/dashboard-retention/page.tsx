'use client';

import { ArrowRight, BrainCircuit } from 'lucide-react';
import { MaeveStudyHero } from '@/components/dashboard/maeve-study-hero';
import { StudentMaterialsWorkspace } from '@/components/dashboard/student-materials-workspace';
import type { StudentMaterial } from '@/lib/data/student-materials';

const universidades = [
  { id: '11111111-1111-1111-1111-111111111111', nombre: 'Universidad de Buenos Aires' },
];

const carreras = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'CBC / UBA XXI',
    universidad_id: '11111111-1111-1111-1111-111111111111',
  },
];

const materias = [
  {
    id: '33333333-3333-3333-3333-333333333331',
    nombre: 'Introducción al Pensamiento Científico',
    carrera_id: '22222222-2222-2222-2222-222222222222',
  },
  {
    id: '33333333-3333-3333-3333-333333333332',
    nombre: 'Sociedad y Estado',
    carrera_id: '22222222-2222-2222-2222-222222222222',
  },
];

const materials = [
  {
    id: '44444444-4444-4444-4444-444444444441',
    user_id: '55555555-5555-5555-5555-555555555555',
    universidad_id: universidades[0].id,
    carrera_id: carreras[0].id,
    materia_id: materias[0].id,
    title: 'Resumen IPC · Primer parcial',
    file_name: 'resumen-ipc-primer-parcial.pdf',
    file_path: 'preview/resumen-ipc-primer-parcial.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 1842000,
    page_count: 42,
    visibility: 'private',
    processing_status: 'ready',
    created_at: '2026-09-26T18:20:00.000Z',
    updated_at: '2026-09-27T10:00:00.000Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444442',
    user_id: '55555555-5555-5555-5555-555555555555',
    universidad_id: universidades[0].id,
    carrera_id: carreras[0].id,
    materia_id: materias[0].id,
    title: 'Unidad 2 · Método científico',
    file_name: 'ipc-unidad-2-metodo-cientifico.pdf',
    file_path: 'preview/ipc-unidad-2-metodo-cientifico.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 1120000,
    page_count: 28,
    visibility: 'private',
    processing_status: 'ready',
    created_at: '2026-09-22T15:10:00.000Z',
    updated_at: '2026-09-27T09:20:00.000Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444443',
    user_id: '55555555-5555-5555-5555-555555555555',
    universidad_id: universidades[0].id,
    carrera_id: carreras[0].id,
    materia_id: materias[1].id,
    title: 'Sociedad y Estado · Apuntes',
    file_name: 'sociedad-y-estado-apuntes.pdf',
    file_path: 'preview/sociedad-y-estado-apuntes.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 2530000,
    page_count: 61,
    visibility: 'private',
    processing_status: 'ready',
    created_at: '2026-09-18T12:00:00.000Z',
    updated_at: '2026-09-25T17:30:00.000Z',
  },
] as StudentMaterial[];

export default function DashboardRetentionPreviewPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="min-w-0 space-y-4 overflow-x-clip">
          <div className="pointer-events-none">
            <MaeveStudyHero
              materialsCount={materials.length}
              primaryMaterialHref="/materiales/44444444-4444-4444-4444-444444444441"
              primaryMaterialReady
              onUploadClick={() => undefined}
            />
          </div>

          <section className="rounded-[1.35rem] border border-indigo-100 bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFF_100%)] px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <BrainCircuit className="h-5 w-5" aria-hidden="true" />
                </span>

                <div className="min-w-0">
                  <p className="text-[10px] font-black tracking-[0.13em] text-indigo-600 uppercase">
                    Para repasar
                  </p>
                  <h2 className="mt-1 text-[15px] font-bold tracking-[-0.03em] text-slate-950 sm:text-base">
                    Tenés 5 conceptos pendientes
                  </h2>
                  <p className="mt-1 text-[13px] leading-5 text-slate-500">
                    Son conceptos que marcaste como difíciles en tus últimas sesiones.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-none"
              >
                Repasar ahora
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </section>

          <div className="pointer-events-none [&_button]:shadow-none">
            <StudentMaterialsWorkspace
              initialMaterials={materials}
              universidades={universidades}
              carreras={carreras}
              materias={materias}
              carreraMaterias={[]}
              initialOpenUpload={false}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
