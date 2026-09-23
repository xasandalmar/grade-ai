import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/** Paths (after the locale segment is stripped) that require a signed-in user. */
const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  // segments[0] is "" because pathname starts with "/"; segments[1] is the locale.
  return "/" + segments.slice(2).join("/");
}

/**
 * Refreshes the Supabase auth session on every request and redirects signed-out
 * users away from protected routes. Must run on every response the outer
 * next-intl middleware produces so the locale prefix + auth cookies both apply.
 */
export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathWithoutLocale = stripLocale(request.nextUrl.pathname);
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathWithoutLocale === prefix || pathWithoutLocale.startsWith(`${prefix}/`),
  );

  if (isProtected && !user) {
    const locale = request.nextUrl.pathname.split("/")[1];
    const redirectUrl = new URL(`/${locale}/login`, request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
