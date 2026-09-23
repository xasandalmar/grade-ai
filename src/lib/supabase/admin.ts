import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. Bypasses RLS entirely.
 *
 * ONLY use this for:
 *  - the new-user profile bootstrap (if ever needed outside the DB trigger)
 *  - super-admin actions that must legitimately cross tenant boundaries
 *    (activate/suspend/deactivate a user, platform-wide stats)
 *  - scheduled/cron-style jobs
 *
 * Never use this to serve a normal user's own request for their own data —
 * use lib/supabase/server.ts (RLS-bound) for that so a bug here can't leak
 * another school's data. Every call site using this client must independently
 * verify the caller is authorized (e.g. re-check profiles.role = 'super_admin')
 * before doing anything with it.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Server-only admin operations are unavailable.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
