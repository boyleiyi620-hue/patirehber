"use client";

import { useMemo, useState } from "react";
import { Search, X, Cat, ListChecks, BookOpen, Bell } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { guideCategories } from "@/lib/guide-data";

export function SearchView() {
  const { cats, tasks, reminders } = useApp();
  const [query, setQuery] = useState("");

  const q = query.trim().toLocaleLowerCase("tr-TR");

  const results = useMemo(() => {
    if (q.length < 2) return [];
    const out: { type: string; title: string; subtitle?: string; href: string; icon: React.ReactNode }[] = [];

    cats.forEach((cat) => {
      const hay = `${cat.name} ${cat.color ?? ""} ${cat.allergies ?? ""} ${cat.medications ?? ""}`.toLocaleLowerCase("tr-TR");
      if (hay.includes(q)) {
        out.push({ type: "Kedi", title: cat.name, subtitle: cat.color, href: `/cats/${cat.id}`, icon: <Cat className="h-4 w-4" /> });
      }
    });

    tasks.forEach((task) => {
      const hay = `${task.title} ${task.note ?? ""}`.toLocaleLowerCase("tr-TR");
      if (hay.includes(q)) {
        out.push({ type: "Görev", title: task.title, subtitle: task.note, href: "/tasks", icon: <ListChecks className="h-4 w-4" /> });
      }
    });

    reminders.forEach((rem) => {
      const hay = `${rem.title} ${rem.note ?? ""}`.toLocaleLowerCase("tr-TR");
      if (hay.includes(q)) {
        out.push({ type: "Hatırlatıcı", title: rem.title, subtitle: rem.note, href: "/reminders", icon: <Bell className="h-4 w-4" /> });
      }
    });

    guideCategories.forEach((cat) => {
      cat.sections.forEach((sec) => {
        const hay = `${sec.title} ${sec.summary}`.toLocaleLowerCase("tr-TR");
        if (hay.includes(q)) {
          out.push({ type: "Rehber", title: sec.title, subtitle: `${cat.emoji} ${cat.title}`, href: `/guide?kategori=${cat.id}`, icon: <BookOpen className="h-4 w-4" /> });
        }
      });
    });

    return out.slice(0, 40);
  }, [q, cats, tasks, reminders]);

  return (
    <div className="space-y-5">
      <PageHeader emoji="🔍" title="Arama" subtitle="Kediler, görevler, hatırlatıcılar ve rehberde ara." tourTarget="search-overview" />
      <div className="relative">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ara…"
          aria-label="Ara"
          className="ps-10 pe-10"
          autoFocus
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Temizle"
            className="absolute end-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {q.length < 2 ? (
        <EmptyState emoji="🔍" title="Aramaya başla" description="En az 2 karakter gir." />
      ) : results.length === 0 ? (
        <EmptyState emoji="😕" title="Sonuç bulunamadı" description="Farklı bir kelime deneyin." />
      ) : (
        <ul className="space-y-2">
          {results.map((r, i) => (
            <li key={i}>
              <Link href={r.href}>
                <Card className="transition hover:border-primary/40">
                  <CardContent className="flex items-center gap-3 p-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-strong">
                      {r.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{r.title}</p>
                      {r.subtitle ? (
                        <p className="truncate text-[11px] text-muted-foreground">{r.subtitle}</p>
                      ) : null}
                    </div>
                    <Badge variant="muted" className="text-[10px]">{r.type}</Badge>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
