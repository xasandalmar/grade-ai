import "server-only";
import { headers } from "next/headers";

/** The request's own origin, for building absolute links (email CTAs, OAuth
 * redirects) from a Server Action or Server Component. */
export async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
