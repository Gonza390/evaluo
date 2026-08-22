import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export function isAdminClientConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Faltan variables de entorno de Supabase admin.');
  }

  const client = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // SupabaseClient.rpc usa estado interno del cliente. Algunos consumidores
  // conservan una referencia tipada al método; dejarlo pre-bindeado evita que
  // una llamada indirecta pierda `this` y falle intentando leer `this.rest`.
  client.rpc = client.rpc.bind(client) as typeof client.rpc;

  return client;
}
