'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Phone,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const benefits = [
  'Los mejores materiales',
  'Simuladores y practica guiada',
  'Tu progreso siempre guardado',
];

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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(`No pudimos iniciar sesión con Google: ${message}`);
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

        setError('Registro exitoso. Revisá tu email para confirmar la cuenta y volver a entrar.');
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
      setError(`Ocurrió un problema inesperado: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const isSuccessMessage = error.toLowerCase().includes('registro exitoso');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.22),transparent_30%),linear-gradient(180deg,#eef4ff_0%,#f7fbff_48%,#eef3ff_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[8%] top-[10%] h-44 w-44 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute bottom-[8%] right-[8%] h-56 w-56 rounded-full bg-indigo-300/30 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 lg:px-8">
        <div className="grid w-full max-w-[980px] overflow-hidden rounded-[30px] border border-white/70 bg-white/72 shadow-[0_24px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl lg:grid-cols-[0.96fr_0.9fr]">
          <section className="relative overflow-hidden bg-[linear-gradient(160deg,#1d4ed8_0%,#2563eb_28%,#4f46e5_100%)] p-5 text-white sm:p-7 lg:min-h-[620px] lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.22),transparent_30%)]" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/15"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/90">
                  <Sparkles className="h-3.5 w-3.5" />
                  Evaluo
                </div>
              </div>

              <div className="mt-8 max-w-[380px]">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
                  Plataforma de estudio
                </p>
                <h1 className="mt-4 text-3xl font-black leading-[1.02] tracking-[-0.05em] sm:text-4xl">
                  Continuá tu camino al éxito con una experiencia más clara y rápida.
                </h1>
                <p className="mt-4 max-w-[340px] text-sm leading-6 text-white/78 sm:text-base">
                  Entrá, estudiá y retomá tus materiales sin perder el contexto de la materia ni tu avance.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="rounded-[20px] border border-white/20 bg-white/10 px-3 py-3 text-xs font-semibold leading-5 text-white/92 backdrop-blur sm:text-sm"
                  >
                    {benefit}
                  </div>
                ))}
              </div>

              <div className="relative mt-auto pt-6">
                <div className="pointer-events-none absolute -bottom-10 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-3xl" />
                <div className="relative mx-auto max-w-[320px]">
                  <Image
                    src="/hero-student-right-v2.png"
                    alt="Estudiante usando Evaluo"
                    width={916}
                    height={1024}
                    priority
                    className="h-auto w-full object-contain drop-shadow-[0_24px_50px_rgba(15,23,42,0.35)]"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-full items-center bg-white/88 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[390px]">
              <div className="mb-6 text-center lg:text-left">
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      !isSignUp ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    disabled={loading}
                  >
                    Iniciar sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isSignUp ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    disabled={loading}
                  >
                    Registrarme
                  </button>
                </div>

                <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950 sm:text-[30px]">
                  {isSignUp ? 'Creá tu cuenta' : 'Bienvenido de nuevo'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isSignUp
                    ? 'Guardá tu progreso, sumá tus materias y empezá a estudiar en minutos.'
                    : 'Retomá tus materias, simuladores y PDFs exactamente donde los dejaste.'}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 sm:text-base"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    o seguí con tu correo
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-12 rounded-2xl border-slate-200 bg-white pl-11 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 sm:text-base"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-semibold text-slate-700">Contraseña</label>
                    {!isSignUp ? (
                      <span className="text-xs font-medium text-indigo-600">Recordala para volver rápido</span>
                    ) : null}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="password"
                      placeholder="********"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 rounded-2xl border-slate-200 bg-white pl-11 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 sm:text-base"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {isSignUp ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="tel"
                        placeholder="+54 9 11 ..."
                        value={whatsapp}
                        onChange={(event) => setWhatsapp(event.target.value)}
                        className="h-12 rounded-2xl border-slate-200 bg-white pl-11 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 sm:text-base"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                      isSuccessMessage
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-rose-200 bg-rose-50 text-rose-700'
                    }`}
                  >
                    {error}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#2563eb] via-[#4f46e5] to-[#7c3aed] text-sm font-bold text-white shadow-[0_14px_34px_rgba(79,70,229,0.28)] transition hover:translate-y-[-1px] hover:opacity-95 sm:text-base"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Procesando...
                    </span>
                  ) : isSignUp ? (
                    'Crear cuenta'
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </form>

              <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {isSignUp ? 'Tu perfil se termina de completar dentro de la app' : 'Entrás y retomás al instante'}
                    </p>
                    <p className="mt-1 leading-6 text-slate-500">
                      {isSignUp
                        ? 'Después del registro te guiamos para elegir carrera, completar datos y empezar con tus materias.'
                        : 'Tus resúmenes, simuladores y documentos abiertos quedan más a mano desde el dashboard.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center text-sm text-slate-500 lg:text-left">
                {isSignUp ? '¿Ya tenés cuenta?' : '¿Todavía no tenés cuenta?'}{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp((prev) => !prev)}
                  disabled={loading}
                  className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline disabled:opacity-60"
                >
                  {isSignUp ? 'Iniciá sesión' : 'Registrate acá'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
