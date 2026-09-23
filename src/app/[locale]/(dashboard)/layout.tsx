import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Defense in depth: the proxy (middleware) already redirects signed-out users away
  // from /dashboard, but every protected server render re-checks independently rather
  // than trusting the middleware alone.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, school_id, role, status")
    .eq("id", user.id)
    .single();

  // A suspended/deactivated account must actually lose access, not just show
  // a "Suspended" badge somewhere — sign them out immediately so the status
  // set by a super admin is functionally meaningful right away.
  if (profile && profile.status !== "active") {
    await supabase.auth.signOut();
    redirect(`/${locale}/login?suspended=1`);
  }

  if (!profile?.school_id) {
    redirect(`/${locale}/onboarding`);
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardSidebar isSuperAdmin={profile?.role === "super_admin"} />
      <div className="min-w-0 flex-1">
        <DashboardTopbar
          fullName={profile?.full_name || ""}
          email={profile?.email ?? user.email ?? ""}
        />
        <div className="mt-8">
          <DashboardMobileNav isSuperAdmin={profile?.role === "super_admin"} />
          {children}
        </div>
      </div>
    </div>
  );
}
