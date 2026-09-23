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

export function DashboardMobileNav({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const t = useTranslations("nav_sections");
  const pathname = usePathname();
  const allItems = isSuperAdmin
    ? [...items, { href: "/admin" as const, key: "admin" as const, icon: ShieldCheck }]
    : items;

  return (
    <nav className="no-print -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 lg:hidden">
      {allItems.map(({ href, key, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
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
