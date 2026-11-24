"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn, guideChecklistItemId } from "@/lib/utils";

/**
 * Native <details> tabanlı akordeon.
 * Klavye ve ekran okuyucu desteği tarayıcıdan gelir; JS gerektirmez.
 */
export function Accordion({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-2.5", className)}>{children}</div>;
}

export function AccordionItem({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = false,
  tone = "default",
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  tone?: "default" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "border-destructive/20 bg-destructive-soft/60"
      : tone === "success"
        ? "border-accent/30 bg-accent/5"
        : "border-border/70 bg-card";

  return (
    <details
      open={defaultOpen}
      className={cn(
        "group overflow-hidden rounded-2xl border shadow-card transition-colors",
        toneClass,
      )}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        {icon ? <span className="shrink-0 text-lg">{icon}</span> : null}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold leading-snug">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
              {subtitle}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-border/50 px-4 pb-4 pt-3.5 text-sm leading-relaxed">
        {children}
      </div>
    </details>
  );
}

/** Rehber içerik bloklarını (paragraf, liste, ipucu, uyarı, tablo) render eder */
export function GuideBlocks({
  blocks,
  checklist,
}: {
  blocks: import("@/lib/types").GuideBlock[];
  checklist?: {
    checkedItemIds: ReadonlySet<string>;
    onToggleItem: (itemId: string) => void;
  };
}) {
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === "p") {
          return (
            <p key={index} className="text-sm leading-relaxed text-foreground/90">
              {block.text}
            </p>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="space-y-1.5">
              {block.items.map((item, itemIndex) => {
                const itemId = guideChecklistItemId(item, itemIndex, index);
                return (
                  <li key={itemIndex} className="text-sm leading-relaxed">
                    {checklist ? (
                      <label className="flex cursor-pointer items-start gap-2 rounded-lg p-1 -m-1">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 shrink-0 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          checked={checklist.checkedItemIds.has(itemId)}
                          onChange={() => checklist.onToggleItem(itemId)}
                        />
                        <span>{item}</span>
                      </label>
                    ) : (
                      <span className="flex gap-2">
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        />
                        <span>{item}</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          );
        }
        if (block.type === "tip") {
          return (
            <div
              key={index}
              className="rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-2.5 text-sm text-emerald-900 dark:text-emerald-100"
            >
              <span className="me-1 font-bold">💡 İpucu:</span> {block.text}
            </div>
          );
        }
        if (block.type === "warn") {
          return (
            <div
              key={index}
              className="rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-danger"
            >
              <span className="me-1 font-bold">⚠️ Dikkat:</span> {block.text}
            </div>
          );
        }
        return (
          <div key={index} className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[420px] text-left text-xs">
              <thead className="bg-muted/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  {block.headers.map((header) => (
                    <th key={header} className="px-3 py-2 font-bold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-t border-border/60 align-top"
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={cn(
                          "px-3 py-2 leading-relaxed",
                          cellIndex === 0 && "font-semibold text-foreground",
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
