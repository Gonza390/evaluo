'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { consumeStoredPricingEmail } from '@/lib/pricing-intent';

type AuthMode = 'login' | 'signup';

export default function LoginForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptLegal, setAcceptLegal] = useState(false);
  const [intent, setIntent] = useState('');
  const [nextPath, setNextPath] = useState('/dashboard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get('mode');
    const requestedIntent = params.get('intent') ?? '';
    const requestedNext = params.get('next') ?? params.get('redirectTo');

    if (requestedMode === 'signup' || requestedMode === 'login') {
      setMode(requestedMode);
    }

    if (requestedIntent) {
      setIntent(requestedIntent);
    }

    if (requestedNext?.startsWith('/')) {
      setNextPath(requestedNext);
    }

    const storedEmail = consumeStoredPricingEmail();
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const isSignUp = mode === 'signup';
  const location = intent === 'premium' ? 'login_premium_intent' : 'login';
  const loginContextLabel =
    nextPath === '/dashboard'
      ? 'tu dashboard'
      : nextPath === '/calendario'
        ? 'tu calendario'
        : 'la sección que querías abrir';

  const resolvePostLoginPath = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('universidad_id, carrera_id')
      .eq('id', userId)
      .maybeSingle();

    const universidadId = String(profile?.universidad_id ?? '').trim();
    const carreraId = String(profile?.carrera_id ?? '').trim();

    if (!universidadId || !carreraId) {
      return `/completar-perfil?next=${encodeURIComponent(nextPath)}`;
    }

    return nextPath;
  };

  const ensureLegalAcceptance = () => {
    if (isSignUp && !acceptLegal) {
      setError('Debes aceptar los Términos y la Política de privacidad para crear tu cuenta.');
      return false;
    }
    return true;
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    if (!ensureLegalAcceptance()) {
      setLoading(false);
      return;
    }

    trackMarketingEvent(isSignUp ? 'signup_started' : 'login_started', {
      location,
      provider: 'google',
    });

    try {
      const redirectUrl = new URL('/auth/callback', window.location.origin);
      redirectUrl.searchParams.set('next', nextPath);
      const redirectTo = redirectUrl.toString();
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
        trackMarketingEvent(isSignUp ? 'signup_error' : 'login_error', {
          location,
          provider: 'google',
          error_code: signInError.message,
        });
        setError(signInError.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      trackMarketingEvent(isSignUp ? 'signup_error' : 'login_error', {
        location,
        provider: 'google',
        error_code: message,
      });
      setError(`No pudimos continuar con Google: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!ensureLegalAcceptance()) {
      setLoading(false);
      return;
    }

    trackMarketingEvent(isSignUp ? 'signup_started' : 'login_started', {
      location,
      provider: 'email',
    });

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          trackMarketingEvent('signup_error', {
            location,
            provider: 'email',
            error_code: signUpError.message,
          });
          setError(signUpError.message);
          return;
        }

        setError('Registro exitoso. Revisá tu correo para confirmar tu cuenta.');
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        trackMarketingEvent('login_error', {
          location,
          provider: 'email',
          error_code: signInError.message,
        });
        setError(signInError.message);
        return;
      }

      const redirectPath = await resolvePostLoginPath(signInData.user.id);
      window.location.href = redirectPath;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      trackMarketingEvent(isSignUp ? 'signup_error' : 'login_error', {
        location,
        provider: 'email',
        error_code: message,
      });
      setError(`No pudimos continuar con tu correo: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const isSuccessMessage = error.toLowerCase().includes('registro exitoso');

  return (
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
          {intent === 'premium' && isSignUp ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-700">
              Acceso premium
            </div>
          ) : null}
          <h1 className="mt-2 text-[2rem] font-bold tracking-[-0.06em] text-slate-950 sm:text-[2.15rem]">
            {isSignUp ? 'Creá tu cuenta' : 'Bienvenido'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {isSignUp
              ? intent === 'premium'
                ? 'Creá tu cuenta para reservar tu acceso premium, guardar tu prioridad y entrar antes a la beta.'
                : 'Registrate con Google para empezar a estudiar con Evaluo y guardar tu progreso.'
              : 'Entrá a tus materias, retomá tus PDFs, seguí el simulador y mantené tu avance siempre a mano desde un mismo lugar.'}
          </p>
          {nextPath !== '/dashboard' ? (
            <p className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Iniciá sesión para continuar a {loginContextLabel}.
            </p>
          ) : null}
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl border-slate-200 bg-white px-4 pr-10 text-sm"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center text-slate-500 transition hover:text-slate-600"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isSignUp ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-legal"
                  checked={acceptLegal}
                  onCheckedChange={(checked) => setAcceptLegal(Boolean(checked))}
                  className="mt-0.5"
                />
                <div className="space-y-2">
                  <Label
                    htmlFor="accept-legal"
                    className="cursor-pointer items-start text-sm leading-6 text-slate-700"
                  >
                    Acepto los{' '}
                    <Link href="/terminos" className="font-semibold text-indigo-600 hover:underline">
                      Términos
                    </Link>{' '}
                    y la{' '}
                    <Link href="/privacidad" className="font-semibold text-indigo-600 hover:underline">
                      Política de privacidad
                    </Link>
                    .
                  </Label>
                  <p className="text-xs leading-5 text-slate-500">
                    Necesitamos tu aceptación para crear tu cuenta y guardar tu progreso.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <Button
            type="submit"
            loading={loading}
            className="h-11 w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] text-sm font-bold text-white shadow-[0_10px_30px_rgba(37,99,235,0.20)] transition hover:opacity-95"
          >
            {isSignUp ? (
              intent === 'premium'
                ? 'Reservar mi acceso premium'
                : 'Crear cuenta'
            ) : (
              'Iniciar sesión'
            )}
          </Button>
        </form>

        <div className="mt-4">
          <div className="flex items-center gap-4 py-1">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              o continúa con
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <Button
            type="button"
            onClick={handleGoogleAuth}
            loading={loading}
            className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09c0-.73.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-4.3 0-7.99 2.47-9.8 6.17l3.13 2.44c.87-2.6 3.3-4.57 6.1-4.57z" />
              </svg>
              {isSignUp
                ? intent === 'premium'
                  ? 'Reservarme con Google'
                  : 'Registrarme con Google'
                : 'Iniciar sesión con Google'}
            </span>
          </Button>

          {error ? (
            <div
              role="status"
              aria-live="polite"
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
          {isSignUp ? '¿Ya tenés cuenta?' : '¿Todavía no tenés cuenta?'}{' '}
          <button
            type="button"
            onClick={() => {
              const nextMode = isSignUp ? 'login' : 'signup';
              trackMarketingEvent('auth_mode_switch', {
                location,
                current_mode: mode,
                next_mode: nextMode,
              });
              setMode(nextMode);
            }}
            disabled={loading}
            className="font-semibold text-[#2563EB] transition hover:text-[#6366F1] hover:underline disabled:opacity-60"
          >
            {isSignUp ? 'Iniciar sesión' : 'Registrarte'}
          </button>
        </div>
      </div>
    </section>
  );
}
