"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Cat,
  Home,
  ListChecks,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";

const items: Array<{
  href: string;
  labelKey: string;
  icon: LucideIcon;
  exact?: boolean;
}> = [
  { href: "/", labelKey: "nav.home", icon: Home, exact: true },
  { href: "/cats", labelKey: "nav.cats", icon: Cat },
  { href: "/guide", labelKey: "nav.guide", icon: BookOpen },
  { href: "/tasks", labelKey: "nav.tasks", icon: ListChecks },
  { href: "/reminders", labelKey: "nav.reminders", icon: Bell },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

/**
 * Mobil öncelikli alt gezinme çubuğu.
 * Masaüstünde ortada yüzen bir "dock" olarak görünür.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { t, reminders, settings } = useApp();

  const pendingToday = reminders.filter(
    (reminder) =>
      reminder.enabled && reminder.type === "medication" && !reminder.lastCompleted,
  ).length;

  return (
    <nav
      aria-label="Ana gezinme"
      className="fixed inset-x-0 bottom-0 z-40 safe-bottom"
    >
      <div className="mx-auto w-full max-w-md px-3 pb-3 pt-1">
        <div className="flex items-center justify-between gap-0.5 rounded-3xl border border-border/70 bg-card/95 p-1.5 shadow-soft backdrop-blur-md dark:bg-card/90">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={t(item.labelKey)}
                className={cn(
                  "group relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary/10 text-primary-strong"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon
                    className={cn(
                      "h-[22px] w-[22px] transition-transform",
                      active && "scale-105",
                    )}
                    strokeWidth={active ? 2.4 : 2}
                    aria-hidden="true"
                  />
                  {item.href === "/reminders" &&
                  pendingToday > 0 &&
                  settings.notifications.enabled ? (
                    <span
                      className="absolute -end-1 -top-1 h-2 w-2 rounded-full bg-accent ring-2 ring-card"
                      aria-hidden="true"
                    />
                  ) : null}
                </span>
                <span className="w-full truncate text-center leading-tight">
                  {t(item.labelKey)}
                </span>
                {active ? (
                  <span
                    className="absolute -bottom-0.5 h-1 w-4 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
