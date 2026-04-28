'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/admin');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      setError('Error inesperado: ' + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="from-background/90 via-emerald/5 relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br to-emerald-50/10 px-4 py-24 md:py-36">
      <Card className="pc-gigante-card hover:shadow-3xl group relative w-full max-w-md overflow-hidden rounded-3xl border-0 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01]">
        <CardHeader className="relative z-10 space-y-4 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg transition-all group-hover:scale-110">
            <Lock className="h-10 w-10 text-white" strokeWidth={1.5} />
          </div>
          <CardTitle className="group-hover:text-emerald text-4xl leading-tight font-black tracking-tighter text-slate-950 md:text-5xl">
            Panel Admin
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 space-y-6">
          <Link
            href="/"
            className="mx-auto flex w-fit items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Home
          </Link>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  placeholder="uesedu21@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus-visible:ring-emerald h-12 rounded-xl border-slate-200 pl-10 transition-all focus-visible:ring-2"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Contraseña</label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus-visible:ring-emerald h-12 rounded-xl border-slate-200 pl-10 transition-all focus-visible:ring-2"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/5 border-destructive/30 text-destructive rounded-2xl border p-3 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="hover:shadow-3xl h-14 w-full rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-xl font-black tracking-tight text-white shadow-2xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-emerald-600 hover:to-emerald-700"
            >
              {loading ? 'Ingresando...' : 'Ingresar al Admin'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
