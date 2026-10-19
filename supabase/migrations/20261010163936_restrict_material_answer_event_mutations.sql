-- Supabase puede otorgar privilegios por defecto también a service_role.
-- Los intentos son inmutables: la acción agrega eventos y deduplica; nunca los edita.
revoke all on public.student_material_answer_events from service_role;
grant select, insert on public.student_material_answer_events to service_role;
