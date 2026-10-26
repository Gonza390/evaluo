import type { User } from '@supabase/supabase-js';

// Sólo una cuenta previamente marcada por el servidor en Auth app_metadata.
// El email, por sí solo, nunca otorga acceso a herramientas internas.
export const QA_ACCOUNT_EMAIL = 'gonza3900@gmail.com';
export const QA_ACCOUNT_FLAG = 'evaluo_qa_account';

export function isQaAccount(
  user: Pick<User, 'email' | 'app_metadata'> | null | undefined
): boolean {
  return (
    user?.email?.trim().toLowerCase() === QA_ACCOUNT_EMAIL &&
    user?.app_metadata?.[QA_ACCOUNT_FLAG] === true
  );
}
