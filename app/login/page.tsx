'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isSignUp = mode === 'signup';

  const handleGoogleAuth = async () => {
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
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(`No pudimos continuar con Google: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        setError('Registro exitoso. Revisa tu correo para confirmar tu cuenta.');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      window.location.href = '/dashboard';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(`No pudimos continuar con tu correo: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const isSuccessMessage = error.toLowerCase().includes('registro exitoso');

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,#f7faff_0%,#eef4ff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1080px] items-center justify-center">
        <div className="grid w-full max-w-[980px] overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] lg:grid-cols-[0.88fr_1.12fr]">
          <section
            className={`flex items-center bg-white px-6 py-8 transition-transform duration-700 [transform-style:preserve-3d] sm:px-9 sm:py-9 lg:px-10 ${
              isSignUp ? '[transform:rotateY(360deg)]' : '[transform:rotateY(0deg)]'
            }`}
          >
            <div className="mx-auto w-full max-w-[320px]">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>

              <div className="mt-8 text-center lg:text-left">
                <h1 className="mt-2 text-[2rem] font-black tracking-[-0.06em] text-slate-950 sm:text-[2.15rem]">
                  {isSignUp ? 'Crea tu cuenta' : '¡Bienvenido!'}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {isSignUp
                    ? 'Regístrate con Google para empezar a estudiar con Evaluo y guardar tu progreso.'
                    : 'Entra a tus materias, retoma tus PDFs, sigue el simulador y mantén tu avance siempre a mano desde un mismo lugar.'}
                </p>
              </div>

              <form onSubmit={handleEmailAuth} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Correo electrónico</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tu@universidad.edu"
                    className="h-11 rounded-xl border-slate-200 bg-white px-4 text-sm"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Contraseña</label>
                  <div className="relative">
                    <Input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className="h-11 rounded-xl border-slate-200 bg-white px-4 pr-10 text-sm"
                      required
                      disabled={loading}
                    />
                    <Eye className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-[#3152ff] to-[#4f46e5] text-sm font-bold text-white shadow-[0_14px_30px_rgba(79,70,229,0.20)] transition hover:opacity-95"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Procesando...
                    </span>
                  ) : isSignUp ? (
                    'Crear cuenta'
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </form>

              <div className="mt-4">
                <div className="flex items-center gap-4 py-1">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    o continúa con
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="inline-flex items-center gap-3">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09c0-.73.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-4.3 0-7.99 2.47-9.8 6.17l3.13 2.44c.87-2.6 3.3-4.57 6.1-4.57z" />
                      </svg>
                      {isSignUp ? 'Registrarme con Google' : 'Iniciar sesión con Google'}
                    </span>
                  )}
                </Button>

                {error ? (
                  <div
                    className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                      isSuccessMessage
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-rose-200 bg-rose-50 text-rose-700'
                    }`}
                  >
                    {error}
                  </div>
                ) : null}
              </div>

              <div className="mt-8 text-center text-sm text-slate-500 lg:text-left">
                {isSignUp ? '¿Ya tienes cuenta?' : '¿Todavía no tienes cuenta?'}{' '}
                <button
                  type="button"
                  onClick={() => setMode(isSignUp ? 'login' : 'signup')}
                  disabled={loading}
                  className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline disabled:opacity-60"
                >
                  {isSignUp ? 'Iniciar sesión' : 'Registrarte'}
                </button>
              </div>
            </div>
          </section>

          <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.22),transparent_16%),radial-gradient(circle_at_78%_30%,rgba(129,140,248,0.22),transparent_20%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.12),transparent_22%),linear-gradient(160deg,#2743ff_0%,#3451ff_40%,#2d49f2_72%,#2a45e0_100%)] lg:block">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10)_0%,transparent_30%,transparent_68%,rgba(255,255,255,0.08)_100%)]" />
            <div className="absolute left-[14%] top-[18%] h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute right-[12%] top-[16%] h-16 w-16 rotate-12 rounded-2xl border border-white/12 bg-white/6 backdrop-blur-sm" />
            <div className="absolute right-[20%] top-[40%] h-10 w-10 -rotate-12 rounded-xl border border-white/12 bg-white/6 backdrop-blur-sm" />
            <div className="absolute left-[58%] top-[64%] h-3 w-3 rounded-full bg-white/30" />
            <div className="absolute inset-y-10 left-10 w-px bg-white/12" />
            <div className="absolute left-10 right-10 top-10 h-px bg-white/12" />
            <div className="absolute left-[36%] top-[30%] animate-[loginFloat_5.6s_ease-in-out_infinite] rounded-2xl border border-white/18 bg-white/14 px-4 py-3 text-white shadow-[0_20px_34px_rgba(15,23,42,0.16)] backdrop-blur-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">Simuladores</p>
            </div>
            <div className="absolute right-[12%] top-[16%] animate-[loginFloat_6.4s_ease-in-out_infinite] rounded-2xl border border-white/18 bg-white/14 px-4 py-3 text-white shadow-[0_20px_34px_rgba(15,23,42,0.16)] backdrop-blur-md [animation-delay:220ms]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">Resúmenes</p>
            </div>
            <div className="relative flex h-full min-h-[640px] items-end justify-center px-8 pb-0 pt-10">
              <Image
                src="/imagentarjetadashboard.png"
                alt="Estudiante usando Evaluo"
                width={980}
                height={980}
                priority
                className="h-auto w-[86%] max-w-[650px] object-contain object-bottom"
                sizes="(max-width: 1024px) 0px, 50vw"
              />
            </div>
          </section>
        </div>
      </div>

      <style jsx global>{`
        @keyframes loginFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -10px, 0);
          }
        }
      `}</style>
    </div>
  );
}
