import * as React from "react";
import { cn } from "@/lib/utils";

/** Boş durum kartı: ikon/emoji + açıklama + isteğe bağlı aksiyon */
export function EmptyState({
  emoji = "🐾",
  title,
  description,
  action,
  className,
}: {
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center",
        className,
      )}
    >
      <div
        className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-2xl"
        aria-hidden="true"
      >
        {emoji}
      </div>
      <p className="font-display text-base font-bold">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** Yükleniyor iskeleti */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse-soft rounded-xl bg-muted", className)}
    />
  );
}
