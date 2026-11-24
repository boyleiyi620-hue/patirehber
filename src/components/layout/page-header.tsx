"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
  className?: string;
  tourTarget?: string;
}

export function PageHeader({
  title,
  subtitle,
  emoji,
  backHref,
  backLabel = "Geri",
  action,
  className,
  tourTarget,
}: PageHeaderProps) {
  return (
    <header data-tour-target={tourTarget} className={cn("mb-5 animate-fade-in-up", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-muted-foreground transition hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
            {emoji ? (
              <span aria-hidden="true" className="text-2xl sm:text-3xl">
                {emoji}
              </span>
            ) : null}
            <span className="truncate">{title}</span>
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
