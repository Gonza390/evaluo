'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, Eye, EyeOff, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { consumeStoredPricingEmail } from '@/lib/pricing-intent';

type AuthMode = 'login' | 'signup';

function getSafeInternalPath(value: string | null | undefined, fallback = '/dashboard') {
  if (!value || !value.startsWith('/')) return fallback;

  try {
    const baseUrl = new URL('https://evaluo.local');
    const resolvedUrl = new URL(value, baseUrl);
    if (resolvedUrl.origin !== baseUrl.origin) return fallback;

    return `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
  } catch {
    return fallback;
  }
}

function getAuthContextCopy(nextPath: string, reason: string, isSignUp: boolean) {
  if (reason === 'save-subject') {
    return isSignUp
      ? 'Creá tu cuenta para guardar esta materia y volver a encontrarla desde tu espacio.'
      : 'Ingresá para guardar esta materia y volver al mismo punto.';
  }
  if (reason === 'save-career') {
    return isSignUp
      ? 'Creá tu cuenta para guardar esta carrera y organizar tus materias.'
      : 'Ingresá para guardar esta carrera y volver al plan de estudios.';
  }
  if (nextPath.startsWith('/dashboard/materiales')) {
    return isSignUp
      ? 'Creá tu cuenta para subir tu PDF y convertirlo en resumen, glosario, tarjetas y ejercicios.'
      : 'Ingresá para subir tu PDF o continuar trabajando con tus materiales.';
  }
  if (nextPath.startsWith('/simulador')) {
    return isSignUp
      ? 'Creá tu cuenta para continuar la práctica y guardar tus resultados.'
      : 'Ingresá para continuar la práctica desde donde la dejaste.';
  }
  if (nextPath === '/empezar') {
    return isSignUp
      ? 'Creá tu cuenta y te guiaremos para elegir una materia o preparar tu primer PDF.'
      : 'Ingresá y te mostraremos el próximo paso para empezar a estudiar.';
  }
  return isSignUp
    ? 'Empezá gratis y guardá tu progreso en Evaluo.'
    : 'Ingresá para continuar estudiando donde lo dejaste.';
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.3-.2-1.8H12v3.5h5.5a4.7 4.7 0 0 1-2 3.1v2.3h3.3c1.9-1.8 2.8-4.4 2.8-7.1Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.6-2.4l-3.3-2.3c-.9.6-2.1 1-3.3 1-2.6 0-4.8-1.8-5.6-4.2H3v2.4A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 14.1A6 6 0 0 1 6.1 12c0-.7.1-1.4.3-2.1V7.5H3A10 10 0 0 0 2 12c0 1.6.4 3.1 1 4.5l3.4-2.4Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.5l3.4 2.4c.8-2.4 3-4.1 5.6-4.1Z"
      />
    </svg>
  );
}

export default function LoginFormGoogleFirst() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptLegal, setAcceptLegal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [intent, setIntent] = useState('');
  const [reason, setReason] = useState('');
  const [nextPath, setNextPath] = useState('/dashboard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get('mode');
    const requestedNext = params.get('next') ?? params.get('redirectTo');

    if (requestedMode === 'signup' || requestedMode === 'login') setMode(requestedMode);
    setNextPath(getSafeInternalPath(requestedNext));
    if (params.get('reason') === 'inactive') {
      setNotice('Tu sesión se cerró por inactividad. Ingresá de nuevo para continuar.');
    }

    setIntent(params.get('intent') ?? '');
    setReason(params.get('reason') ?? '');

    const storedEmail = consumeStoredPricingEmail();
    if (storedEmail) {
      setEmail(storedEmail);
      setEmailExpanded(true);
    }
  }, []);

  const isSignUp = mode === 'signup';
  const location = intent === 'premium' ? 'login_premium_intent' : 'login';
  const contextCopy = getAuthContextCopy(nextPath, reason, isSignUp);

  const resolvePostLoginPath = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('universidad_id, carrera_id')
      .eq('id', userId)
      .maybeSingle();

    if (!String(data?.universidad_id ?? '').trim() || !String(data?.carrera_id ?? '').trim()) {
      return `/completar-perfil?next=${encodeURIComponent(nextPath)}`;
    }

    return nextPath;
  };

  const validateLegal = () => {
    if (!isSignUp || acceptLegal) return true;
    setMessage('Aceptá los Términos y la Política de privacidad para crear tu cuenta.');
    return false;
  };

  const handleGoogle = async () => {
    if (!validateLegal()) return;

    setLoading(true);
    setMessage('');
    trackMarketingEvent(isSignUp ? 'signup_started' : 'login_started', {
      location,
      provider: 'google',
    });

    try {
      const callback = new URL('/auth/callback', window.location.origin);
      callback.searchParams.set('next', nextPath);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callback.toString(),
          queryParams: { prompt: 'select_account' },
        },
      });

      if (error) setMessage(error.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos continuar con Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateLegal()) return;
    if (!email.includes('@')) return setMessage('Ingresá un correo electrónico válido.');
    if (password.length < 6) return setMessage('La contraseña debe tener al menos 6 caracteres.');

    setLoading(true);
    setMessage('');
    trackMarketingEvent(isSignUp ? 'signup_started' : 'login_started', {
      location,
      provider: 'email',
    });

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) return setMessage(error.message);
        trackMarketingEvent('signup_completed', { location, provider: 'email' });
        setMessage('Registro exitoso. Revisá tu correo para confirmar tu cuenta.');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setMessage(error.message);
      window.location.href = await resolvePostLoginPath(data.user.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos continuar con tu correo.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    const nextMode = isSignUp ? 'login' : 'signup';
    trackMarketingEvent('auth_mode_switch', {
      location,
      current_mode: mode,
      next_mode: nextMode,
    });
    setMode(nextMode);
    setEmailExpanded(false);
    setShowPassword(false);
    setMessage('');
    setNotice('');
  };

  const success = message.toLowerCase().includes('registro exitoso');

  return (
    <section className="px-1 py-1 sm:px-2 sm:py-2">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Inicio
        </Link>

        <div className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-950">
          <Image
            src="/icon.png"
            alt=""
            width={30}
            height={30}
            className="h-[30px] w-[30px] rounded-lg"
          />
          Evaluo
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-[390px] text-center sm:mt-10">
        {intent === 'premium' && isSignUp ? (
          <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            Evaluo Premium
          </span>
        ) : null}

        <h1 className="mt-3 text-[2rem] font-bold tracking-[-0.055em] text-slate-950 sm:text-[2.15rem]">
          {isSignUp ? 'Creá tu cuenta' : 'Bienvenido'}
        </h1>
        <p className="mx-auto mt-2 max-w-[330px] text-sm leading-6 text-slate-500">{contextCopy}</p>

        {notice ? (
          <div
            className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-left text-sm text-blue-700"
            role="status"
          >
            {notice}
          </div>
        ) : null}

        {isSignUp ? (
          <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-left text-xs leading-5 text-slate-600">
            <input
              type="checkbox"
              checked={acceptLegal}
              onChange={(event) => setAcceptLegal(event.target.checked)}
              className="mt-1"
            />
            <span>
              Acepto los{' '}
              <Link href="/terminos" className="font-semibold text-blue-600 hover:underline">
                Términos
              </Link>{' '}
              y la{' '}
              <Link href="/privacidad" className="font-semibold text-blue-600 hover:underline">
                Política de privacidad
              </Link>
              .
            </span>
          </label>
        ) : null}

        <div className="mt-6 space-y-4">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition hover:border-blue-300 hover:bg-blue-50/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            {isSignUp ? 'Registrarme con Google' : 'Continuar con Google'}
          </button>

          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
              o
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={() => setEmailExpanded((value) => !value)}
            aria-expanded={emailExpanded}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="flex items-center gap-2.5">
              <Mail className="h-4 w-4" />
              {isSignUp ? 'Registrarme con correo' : 'Usar correo y contraseña'}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${emailExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {emailExpanded ? (
            <form onSubmit={handleEmail} className="space-y-4 pt-1 text-left">
              <label className="block text-sm font-medium text-slate-700">
                Correo electrónico
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 transition outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Contraseña
                <span className="relative mt-1.5 block">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-950 transition outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              <button
                disabled={loading}
                className="from-brand to-brand-2 h-11 w-full rounded-xl bg-gradient-to-r text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSignUp ? 'Crear cuenta gratis' : 'Iniciar sesión'}
              </button>
            </form>
          ) : null}

          {message ? (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border px-4 py-3 text-left text-sm ${
                success
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>

        <p className="mt-7 text-sm text-slate-500">
          {isSignUp ? '¿Ya tenés cuenta?' : '¿Todavía no tenés cuenta?'}{' '}
          <button
            type="button"
            onClick={switchMode}
            disabled={loading}
            className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline disabled:opacity-60"
          >
            {isSignUp ? 'Iniciar sesión' : 'Crear cuenta gratis'}
          </button>
        </p>
      </div>
    </section>
  );
}
