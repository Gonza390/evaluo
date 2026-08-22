-- Restrict the destructive test-user reset RPC to trusted server-side callers only.
-- The normal authentication flow no longer invokes this function.

REVOKE ALL ON FUNCTION public.reset_test_user_data(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_test_user_data(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.reset_test_user_data(uuid) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.reset_test_user_data(uuid) TO service_role;
