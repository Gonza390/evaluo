import { StudentMaterialUploadErrorScreen } from '@/components/dashboard/student-material-upload-error';

export default function MaterialUploadErrorDemoPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-6">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
            Vista de prueba · Error de carga
          </p>
        </div>
        <StudentMaterialUploadErrorScreen
          constraint={{
            kind: 'pages',
            fileName: 'Apuntes Derecho Constitucional.pdf',
            pageCount: 142,
            maxPages: 100,
          }}
        />
      </div>
    </main>
  );
}
