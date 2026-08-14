import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <h1 className="text-3xl font-bold text-slate-950">No encontramos esa página</h1>
        <p className="mt-3 text-sm text-slate-600">
          Puede que la ruta haya cambiado durante la consolidación del producto.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/explorar">Explorar universidades</Link>
          </Button>
          <Button asChild className="rounded-2xl bg-emerald-600 hover:bg-emerald-700">
            <Link href="/dashboard">Ir al dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
