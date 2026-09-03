'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { trackMarketingEvent } from '@/lib/marketing-analytics';
import { consumeStoredPricingEmail } from '@/lib/pricing-intent';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Ingresá tu correo electrónico')
    .email('Ingresá un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  acceptLegal: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

type AuthMode = 'login' | 'signup';

export default function LoginForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [intent, setIntent] = useState('');
  const [nextPath, setNextPath] = useState('/dashboard');

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      acceptLegal: false,
    },
  });

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
      form.setValue('email', storedEmail);
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

    const universidadIdValue = String(profile?.universidad_id ?? '').trim();
    const carreraIdValue = String(profile?.carrera_id ?? '').trim();

    if (!universidadIdValue || !carreraIdValue) {
      return `/completar-perfil?next=${encodeURIComponent(nextPath)}`;
    }

    return nextPath;
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    if (isSignUp && !form.getValues('acceptLegal')) {
      form.setError('acceptLegal', {
        message: 'Debes aceptar los Términos y la Política de privacidad para crear tu cuenta.',
      });
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

  const handleEmailAuth = form.handleSubmit(async (values) => {
    if (isSignUp && !values.acceptLegal) {
      form.setError('acceptLegal', {
        message: 'Debes aceptar los Términos y la Política de privacidad para crear tu cuenta.',
      });
      return;
    }

    setLoading(true);
    setError('');

    trackMarketingEvent(isSignUp ? 'signup_started' : 'login_started', {
      location,
      provider: 'email',
    });

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
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

        trackMarketingEvent('signup_completed', {
          location,
          provider: 'email',
        });
        setError('Registro exitoso. Revisá tu correo para confirmar tu cuenta.');
        return;
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
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
  });

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
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <div className="mt-8 text-center lg:text-left">
          {intent === 'premium' && isSignUp ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[12px] font-bold tracking-[0.18em] text-indigo-700 uppercase">
              Evaluo Premium
            </div>
          ) : null}
          <h1 className="mt-2 text-[2rem] font-bold tracking-[-0.06em] text-slate-950 sm:text-[2.15rem]">
            {isSignUp ? 'Creá tu cuenta' : 'Bienvenido'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {isSignUp
              ? intent === 'premium'
                ? 'Creá tu cuenta para continuar con Evaluo Premium y volver al paso que estabas haciendo.'
                : 'Creá tu espacio y prepará tu primer parcial.'
              : 'Volvé a tu materia y continuá donde dejaste.'}
          </p>
          {nextPath !== '/dashboard' ? (
            <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              Iniciá sesión para continuar a {loginContextLabel}.
            </p>
          ) : null}
        </div>

        <Form {...form}>
          <form onSubmit={handleEmailAuth} className="mt-8 space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-600">
                    Correo electrónico
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="tu@universidad.edu"
                      className="h-11 rounded-xl border-slate-200 bg-white px-4 text-sm"
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-600">Contraseña</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="h-11 rounded-xl border-slate-200 bg-white px-4 pr-10 text-sm"
                        disabled={loading}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute top-1/2 right-3 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center text-slate-500 transition hover:text-slate-600"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isSignUp ? (
              <FormField
                control={form.control}
                name="acceptLegal"
                render={({ field }) => (
                  <FormItem className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex items-start gap-3">
                      <FormControl>
                        <Checkbox
                          id="accept-legal"
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="space-y-2">
                        <FormLabel
                          htmlFor="accept-legal"
                          className="cursor-pointer items-start text-sm leading-6 text-slate-700"
                        >
                          Acepto los{' '}
                          <Link
                            href="/terminos"
                            className="font-semibold text-indigo-600 hover:underline"
                          >
                            Términos
                          </Link>{' '}
                          y la{' '}
                          <Link
                            href="/privacidad"
                            className="font-semibold text-indigo-600 hover:underline"
                          >
                            Política de privacidad
                          </Link>
                          .
                        </FormLabel>
                        <p className="text-xs leading-5 text-slate-500">
                          Necesitamos tu aceptación para crear tu cuenta y guardar tu progreso.
                        </p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <Button
              type="submit"
              loading={loading}
              className="from-brand to-brand-2 h-11 w-full rounded-xl bg-gradient-to-r text-sm font-bold text-white shadow-[0_10px_30px_rgba(37,99,235,0.20)] transition hover:opacity-95"
            >
              {isSignUp
                ? intent === 'premium'
                  ? 'Crear cuenta y continuar'
                  : 'Crear cuenta gratis'
                : 'Iniciar sesión'}
            </Button>
          </form>
        </Form>

        <div className="mt-4">
          <div className="flex items-center gap-4 py-1">
            <div className="h-px flex-1 bg-white" />
            <span className="text-[12px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              o continúa con
            </span>
            <div className="h-px flex-1 bg-white" />
          </div>

          <Button
            type="button"
            onClick={handleGoogleAuth}
            loading={loading}
            className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-white"
          >
            <span className="inline-flex items-center gap-3">
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
              Continuar con Google
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
            className="text-brand hover:text-brand-2 font-semibold transition hover:underline disabled:opacity-60"
          >
            {isSignUp ? 'Iniciar sesión' : 'Crear cuenta gratis'}
          </button>
        </div>
      </div>
    </section>
  );
}
