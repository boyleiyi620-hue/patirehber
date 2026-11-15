"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchOption {
  value: string;
  label: string;
  meta?: string;
  keywords?: string;
}

interface SearchSelectProps {
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

/**
 * Aranabilir açılır liste (combobox).
 * Klavye: ↑/↓ gezinti, Enter seçim, Esc kapatma.
 */
export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Seçin",
  searchPlaceholder = "Ara…",
  emptyMessage = "Sonuç bulunamadı",
  id,
  className,
  "aria-label": ariaLabel,
}: SearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlight, setHighlight] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listId = React.useId();

  const selected = options.find((option) => option.value === value);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    if (!q) return options;
    return options.filter((option) =>
      `${option.label} ${option.meta ?? ""} ${option.keywords ?? ""}`
        .toLocaleLowerCase("tr-TR")
        .includes(q),
    );
  }, [options, query]);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.clearTimeout(timer);
    };
  }, [open]);

  React.useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  const choose = (option: SearchOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery("");
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((prev) => Math.min(filtered.length - 1, prev + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((prev) => Math.max(0, prev - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (filtered[highlight]) choose(filtered[highlight]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel ?? placeholder}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-3.5 text-start text-sm shadow-sm transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
      >
        <span className={cn("truncate", !selected && "text-muted-foreground/70")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full animate-pop-in overflow-hidden rounded-xl border border-border bg-popover shadow-soft">
          <div className="relative border-b border-border/70 p-2">
            <Search
              className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listId}
              aria-autocomplete="list"
              role="combobox"
              aria-expanded="true"
              className="h-9 w-full rounded-lg border border-input bg-background ps-8 pe-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Aramayı temizle"
                className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-label={ariaLabel ?? placeholder}
            className="max-h-64 overflow-y-auto p-1.5"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => choose(option)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors",
                        index === highlight && "bg-muted",
                        isSelected && "font-semibold text-primary-strong",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{option.label}</span>
                        {option.meta ? (
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {option.meta}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? (
                        <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
