/**
 * Los registros con contraseña pueden abrir sesión inmediatamente si Supabase
 * no exige confirmación de email. Sin sesión no se concede acceso ni se redirige.
 */
export function getEmailSignupDestination(
  session: { user?: { id?: string | null } | null } | null,
  requestedNextPath: string
): string | null {
  if (!session?.user?.id) return null;

  // Destino interno únicamente: no permitir open redirects desde el parámetro next.
  const origin = 'https://evaluo.local';
  let path = '/dashboard';
  try {
    if (requestedNextPath.startsWith('/') && !requestedNextPath.startsWith('//')) {
      const url = new URL(requestedNextPath, origin);
      if (url.origin === origin) path = `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // La ruta inválida no debe bloquear el registro completado.
  }

  // El registro termina en Mi espacio, sin abrir un popup de primer PDF.
  return path;
}
