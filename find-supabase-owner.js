import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const { data, error } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (error) {
  console.error("Error al listar usuarios:", error.message);
  process.exit(1);
}

const users = data.users.sort(
  (a, b) => new Date(a.created_at) - new Date(b.created_at)
);

if (users.length === 0) {
  console.log("No hay usuarios registrados.");
} else {
  const oldest = users[0];
  console.log("Primer usuario creado:");
  console.log("  email:", oldest.email);
  console.log("  created_at:", oldest.created_at);
}
