-- Supabase grants EXECUTE to anon/authenticated by default on new functions;
-- explicitly revoke from anon so only signed-in users can call this RPC.
revoke execute on function public.create_my_school(text, text, text) from anon, public;
