"use client";

import { useTranslations } from "next-intl";
import { LayoutDashboard, Users2, School, FileSpreadsheet, ScrollText } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", key: "overview", icon: LayoutDashboard },
  { href: "/admin/users", key: "users", icon: Users2 },
  { href: "/admin/schools", key: "schools", icon: School },
  { href: "/admin/exams", key: "exams", icon: FileSpreadsheet },
  { href: "/admin/audit-logs", key: "auditLogs", icon: ScrollText },
] as const;

export function AdminMobileNav() {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <nav className="no-print -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 lg:hidden">
      {items.map(({ href, key, icon: Icon }) => {
        const active =
          pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
