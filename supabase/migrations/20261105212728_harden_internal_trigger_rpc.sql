-- These internal SECURITY DEFINER functions are invoked only by existing triggers.
-- Prevent direct RPC calls from public clients without disabling those triggers.
revoke execute on function public.enforce_private_pending_academic_material()
  from public, anon, authenticated;
revoke execute on function public.protect_profile_role()
  from public, anon, authenticated;
