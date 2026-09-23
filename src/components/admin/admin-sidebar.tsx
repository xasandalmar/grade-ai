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

export function AdminSidebar() {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <nav className="no-print hidden w-56 shrink-0 lg:block">
      <div className="sticky top-24 space-y-1">
        {items.map(({ href, key, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
