"use client";

import { useTranslations } from "next-intl";
import { LayoutDashboard, School, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/school", key: "school", icon: School },
  { href: "/exams", key: "exams", icon: FileSpreadsheet },
] as const;

export function DashboardSidebar({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const t = useTranslations("nav_sections");
  const pathname = usePathname();
  const allItems = isSuperAdmin
    ? [...items, { href: "/admin" as const, key: "admin" as const, icon: ShieldCheck }]
    : items;

  return (
    <nav className="no-print hidden w-56 shrink-0 lg:block">
      <div className="sticky top-24 space-y-1">
        {allItems.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
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
