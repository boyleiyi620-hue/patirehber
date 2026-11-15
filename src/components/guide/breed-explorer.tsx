"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ChevronRight,
  HeartPulse,
  Home,
  Ruler,
  Scissors,
  Search,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { breeds } from "@/lib/breeds";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BreedDetailDialog } from "./breed-detail";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import type { Breed } from "@/lib/types";

const ACTIVITY_FILTERS = ["Tümü", "Düşük", "Orta", "Yüksek"] as const;

/** 51 ırk için aranabilir, filtrelenebilir rehber */
export function BreedExplorer() {
  const [query, setQuery] = useState("");
  const [activity, setActivity] = useState<(typeof ACTIVITY_FILTERS)[number]>("Tümü");
  const [selected, setSelected] = useState<Breed | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return breeds.filter((breed) => {
      const matchesQuery =
        !q ||
        `${breed.name} ${breed.origin} ${breed.traits.join(" ")} ${breed.description}`
          .toLocaleLowerCase("tr-TR")
          .includes(q);
      const matchesActivity =
        activity === "Tümü" || breed.activity.includes(activity);
      return matchesQuery && matchesActivity;
    });
  }, [activity, query]);

  return (
    <div>
      <div className="mb-4 space-y-2.5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Irk ara: Van, British, Siyam…"
            aria-label="Irk ara"
            className="ps-10"
          />
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto" role="group" aria-label="Aktivite filtresi">
          {ACTIVITY_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActivity(filter)}
              aria-pressed={activity === filter}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                activity === filter
                  ? "border-primary bg-primary/10 text-primary-strong"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground" role="status">
          {filtered.length} ırk listeleniyor
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="Eşleşen ırk yok"
          description="Farklı bir arama yapmayı veya aktivite filtresini kaldırmayı dene."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((breed) => (
            <Card key={breed.id} className="card-hover overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-extrabold">
                      {breed.name}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Home className="h-3 w-3" aria-hidden="true" />
                      {breed.origin}
                    </p>
                  </div>
                  <Badge
                    variant={
                      breed.activity === "Yüksek"
                        ? "success"
                        : breed.activity === "Düşük"
                          ? "muted"
                          : "secondary"
                    }
                  >
                    {breed.activity}
                  </Badge>
                </div>

                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {breed.description}
                </p>

                <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Timer className="h-3 w-3" aria-hidden="true" />
                    {breed.lifespan}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Ruler className="h-3 w-3" aria-hidden="true" />
                    {breed.weight}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {breed.traits.slice(0, 3).map((trait) => (
                    <span
                      key={trait}
                      className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      {trait}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSelected(breed)}
                  className="mt-3 flex w-full items-center justify-between rounded-xl bg-primary/5 px-3 py-2 text-xs font-bold text-primary-strong transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${breed.name} ırk detaylarını aç`}
                >
                  Bakım detayları
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

            <BreedDetailDialog
        breed={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
