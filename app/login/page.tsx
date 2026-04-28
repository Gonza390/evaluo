'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Lock, Mail, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const redirectTo = new URL('/auth/callback', window.location.origin).toString();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Supabase performs redirect automatically when skipBrowserRedirect is omitted.
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al iniciar sesion con Google: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              whatsapp,
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            whatsapp,
            updated_at: new Date().toISOString(),
          });

          if (profileError) {
            console.error('Error saving profile:', profileError);
          }
        }

        setError('Registro exitoso. Por favor revisa tu email para confirmar tu cuenta.');
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          setError(loginError.message);
          return;
        }

        await router.refresh();
        window.location.href = '/dashboard';
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error inesperado: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="from-background/90 via-emerald/5 relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br to-emerald-50/10 px-4 py-24 md:py-36">
      <Card className="pc-gigante-card hover:shadow-3xl group relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border-0 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01]">
        <div className="pointer-events-none absolute inset-0 opacity-3">
          <svg
            className="absolute -top-20 -left-20 h-40 w-40 text-emerald-100"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <svg
            className="absolute top-10 right-10 h-24 w-24 text-slate-100"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
          </svg>
          <svg
            className="absolute bottom-20 left-1/4 h-20 w-20 rotate-12 text-emerald-100"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>

        <CardHeader className="relative z-10 space-y-4 text-center">
          <CardTitle className="group-hover:text-emerald text-4xl leading-tight font-black tracking-tighter text-slate-950 md:text-5xl">
            {isSignUp ? 'Crea tu cuenta' : 'Tu exito academico empieza aqui'}
          </CardTitle>
          <div className="space-y-3">
            <p className="mx-auto max-w-[280px] text-lg leading-relaxed text-slate-600">
              {isSignUp
                ? 'Registrate para acceder a pregunteros y resumenes unicos.'
                : 'Inicia sesion para acceder a pregunteros y resumenes unicos.'}
            </p>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 flex flex-1 flex-col justify-center space-y-6">
          <Link
            href="/"
            className="mx-auto flex w-fit items-center gap-2 text-sm text-slate-500 hover:text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al home
          </Link>

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            onTouchEnd={(event) => {
              event.preventDefault();
              if (!loading) {
                void handleGoogleSignIn();
              }
            }}
            disabled={loading}
            className="hover:shadow-3xl hover:border-emerald/30 group relative flex h-14 w-full touch-manipulation items-center gap-3 overflow-hidden rounded-3xl border border-slate-200/50 bg-white/80 text-lg font-black tracking-tight text-slate-900 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-white"
          >
            {loading && <Loader2 className="absolute left-4 h-5 w-5 animate-spin" />}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09c0-.73.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-4.3 0-7.99 2.47-9.8 6.17l3.13 2.44c.87-2.6 3.3-4.57 6.1-4.57z"
              />
            </svg>
            {loading ? 'Procesando...' : 'Continuar con Google'}
          </Button>

          <div className="py-2 text-center text-sm text-slate-500">o</div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 pl-10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Contrasena</label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 pl-10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="tel"
                    placeholder="+54 9 11 ..."
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="h-12 rounded-xl border-slate-200 pl-10 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    required={isSignUp}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {error && (
              <div
                className={`rounded-xl border p-3 text-sm ${error.includes('exitoso') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="hover:shadow-3xl relative h-14 w-full overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-xl font-black tracking-tight text-white shadow-2xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-emerald-600 hover:to-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="absolute left-4 h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : isSignUp ? (
                'Crear cuenta'
              ) : (
                'Iniciar sesion'
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              onTouchEnd={(event) => {
                event.preventDefault();
                setIsSignUp((prev) => !prev);
              }}
              disabled={loading}
              className="touch-manipulation text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline disabled:opacity-60"
            >
              {isSignUp ? 'Ya tienes cuenta? Inicia sesion' : 'No tienes cuenta? Registrate'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
