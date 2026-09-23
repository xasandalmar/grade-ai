import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Defense in depth: the proxy (middleware) already redirects signed-out
  // users away from /admin, but every protected server render re-checks
  // independently. Crucially, the ROLE check below only ever happens here —
  // there is no middleware-level role check, since the middleware can't
  // safely query the database on every request. A normal user who somehow
  // reaches this layout is redirected to their own dashboard, never shown
  // even a flash of admin content or data.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin" || profile.status !== "active") {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminTopbar fullName={profile.full_name} email={profile.email} />
        <div className="mt-8">
          <AdminMobileNav />
          {children}
        </div>
      </div>
    </div>
  );
}
