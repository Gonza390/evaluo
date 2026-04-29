import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
        <p className="text-sm font-semibold text-slate-700">Estamos preparando el panel de administración...</p>
        <p className="mt-1 text-xs text-slate-500">Validamos tu sesión y cargamos los datos iniciales.</p>
      </div>
    </div>
  );
}

interface AdminAccessDeniedStateProps {
  message: string;
}

export function AdminAccessDeniedState({ message }: AdminAccessDeniedStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <Card className="max-w-xl rounded-3xl">
        <CardHeader>
          <CardTitle>Acceso restringido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">{message}</p>
          <Button asChild>
            <Link href="/dashboard">Volver al dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminIAProcessingOverlay() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="flex max-w-md scale-100 flex-col items-center gap-6 rounded-[3rem] border border-slate-100 bg-white p-12 text-center shadow-2xl shadow-blue-500/10">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-4 border-slate-50 border-t-blue-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 animate-pulse">
              <span className="text-xl font-black text-white">IA</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Analizando material</h2>
          <p className="font-medium leading-relaxed text-slate-500">
            Nuestra inteligencia artificial está extrayendo preguntas del documento. Por favor, no cierres esta ventana.
          </p>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full origin-left animate-progress bg-blue-600"></div>
        </div>
        <span className="animate-pulse text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
          PROCESANDO CON GROQ Llama 3.3
        </span>
      </div>
    </div>
  );
}
