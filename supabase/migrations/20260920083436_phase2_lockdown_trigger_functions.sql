-- These are trigger functions only; nothing should call them directly via PostgREST RPC.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.handle_user_email_update() from anon, authenticated;
revoke execute on function public.prevent_role_status_self_escalation() from anon, authenticated;
