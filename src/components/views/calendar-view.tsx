"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, PencilLine } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { dateKey, formatDateLong, formatDateWithWeekday, parseDateKey, taskCompletedOn, taskProgressOn, todayKey, weekdayShort } from "@/lib/utils";

type CalendarActivity = { icon: string; title: string; detail?: string };
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export function CalendarView() {
  const { cats, logs, tasks, reminders, healthEntries, activeDate, setActiveDate } = useApp();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(activeDate);
  const [month, setMonth] = useState(() => {
    const today = parseDateKey(todayKey());
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [catFilter, setCatFilter] = useState("all");
  const today = todayKey();

  useEffect(() => {
    setSelectedDate(activeDate);
    const selected = parseDateKey(activeDate);
    setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [activeDate]);

  const activityByDate = useMemo(() => {
    const byDate = new Map<string, CalendarActivity[]>();
    const selectedCats = new Set(cats.filter((cat) => catFilter === "all" || cat.id === catFilter).map((cat) => cat.id));
    const catName = (id: string | null) => cats.find((cat) => cat.id === id)?.name ?? "Kedi";
    const add = (date: string, item: CalendarActivity) => {
      const items = byDate.get(date) ?? [];
      items.push(item);
      byDate.set(date, items);
    };

    for (const log of logs) {
      if (!selectedCats.has(log.catId)) continue;
      const name = catName(log.catId);
      if (log.mealsGiven) add(log.date, { icon: "🍽️", title: `${name}: ${log.mealsGiven} öğün mama` });
      if (log.waterChanged) add(log.date, { icon: "💧", title: `${name}: su tazelendi` });
      if (log.litterCleaned) add(log.date, { icon: "🧹", title: `${name}: kum temizlendi` });
      if (log.playMinutes) add(log.date, { icon: "🎾", title: `${name}: ${log.playMinutes} dk oyun` });
      if (log.note) add(log.date, { icon: "📝", title: `${name}: günlük not`, detail: log.note });
    }

    for (const task of tasks) {
      if (task.catId && !selectedCats.has(task.catId)) continue;
      const createdDate = dateKey(new Date(task.createdAt));
      for (const date of new Set([
        ...(task.progressByDate ?? []).map((entry) => entry.date),
        ...(task.completedAt ? [dateKey(new Date(task.completedAt))] : []),
        ...(task.dueDate ? [task.dueDate] : []),
        createdDate,
      ])) {
        if (date > today) continue;
        const progress = taskProgressOn(task, date);
        const done = taskCompletedOn(task, date);
        add(date, {
          icon: done ? "✅" : "📋",
          title: `${task.catId ? `${catName(task.catId)} · ` : ""}${task.title}`,
          detail: `${done ? "Tamamlandı" : "Görev"} · ${progress}/${task.target}`,
        });
      }
    }

    for (const reminder of reminders) {
      if (reminder.catId && !selectedCats.has(reminder.catId)) continue;
      for (const date of new Set([
        ...reminder.history,
        ...(reminder.lastCompleted ? [reminder.lastCompleted] : []),
      ])) {
        add(date, {
          icon: "⏰",
          title: `${reminder.catId ? `${catName(reminder.catId)} · ` : ""}${reminder.title}`,
          detail: `Hatırlatıcı tamamlandı · ${reminder.time}`,
        });
      }
    }

    for (const entry of healthEntries) {
      if (!selectedCats.has(entry.catId)) continue;
      add(entry.date, {
        icon: entry.type === "vet-visit" ? "🏥" : entry.type === "medication" ? "💊" : "🩺",
        title: `${catName(entry.catId)}: ${entry.title}`,
        detail: entry.note,
      });
    }

    for (const cat of cats) {
      if (!selectedCats.has(cat.id)) continue;
      for (const vaccine of cat.vaccinations) {
        add(vaccine.date, { icon: "💉", title: `${cat.name}: ${vaccine.name} aşısı`, detail: vaccine.nextDate ? `Sonraki doz: ${formatDateLong(vaccine.nextDate)}` : undefined });
      }
      for (const weight of cat.weightHistory) {
        add(weight.date, { icon: "⚖️", title: `${cat.name}: kilo ölçümü`, detail: `${weight.kg} kg` });
      }
    }

    for (const items of byDate.values()) items.sort((a, b) => a.title.localeCompare(b.title, "tr"));
    return byDate;
  }, [cats, catFilter, healthEntries, logs, reminders, tasks, today]);

  const monthCells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const mondayOffset = (firstWeekday + 6) % 7;
    const numberOfDays = new Date(year, monthIndex + 1, 0).getDate();
    const cells: Array<string | null> = Array(mondayOffset).fill(null);
    for (let day = 1; day <= numberOfDays; day += 1) {
      cells.push(dateKey(new Date(year, monthIndex, day)));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const selectedActivities = activityByDate.get(selectedDate) ?? [];
  const selectedDateObj = parseDateKey(selectedDate);
  const canGoNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= new Date(parseDateKey(today).getFullYear(), parseDateKey(today).getMonth(), 1);

  const openSelectedDay = () => {
    setActiveDate(selectedDate);
    router.push("/");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        emoji="🗓️"
        title="Takvim"
        tourTarget="calendar-overview"
        subtitle="Geçmiş günlerde neler yaptığınızı gör ve eksik kayıtları tamamla."
      />

      <Card data-tour-target="calendar-history">
        <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays className="h-5 w-5 shrink-0 text-primary-strong" aria-hidden="true" />
            <CardTitle>{MONTHS[month.getMonth()]} {month.getFullYear()}</CardTitle>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="outline" size="sm" aria-label="Önceki ay" onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="outline" size="sm" aria-label="Sonraki ay" disabled={!canGoNext} onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
          {cats.length > 1 ? (
            <div className="mb-3">
              <label htmlFor="calendar-cat-filter" className="mb-1 block text-xs font-semibold text-muted-foreground">Kedi</label>
              <Select id="calendar-cat-filter" value={catFilter} onChange={(event) => setCatFilter(event.target.value)}>
                <option value="all">Tüm kediler</option>
                {cats.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </Select>
            </div>
          ) : null}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((day) => (
              <span key={day} className="py-1 text-[10px] font-bold text-muted-foreground">{weekdayShort(day)}</span>
            ))}
            {monthCells.map((date, index) => {
              if (!date) return <span key={`blank-${index}`} aria-hidden="true" />;
              const isFuture = date > today;
              const isToday = date === today;
              const isSelected = date === selectedDate;
              const count = activityByDate.get(date)?.length ?? 0;
              return (
                <button
                  key={date}
                  type="button"
                  disabled={isFuture}
                  aria-label={`${formatDateWithWeekday(date)}${count ? `, ${count} etkinlik` : ", etkinlik yok"}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDate(date)}
                  className={`relative flex min-h-12 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${
                    isSelected ? "border-primary bg-primary text-primary-foreground shadow-sm" :
                    isToday ? "border-primary/40 bg-primary/5 text-primary-strong" :
                    "border-transparent hover:border-border hover:bg-muted/60"
                  }`}
                >
                  <span>{parseDateKey(date).getDate()}</span>
                  {count ? (
                    <span className="mt-0.5 flex gap-0.5" aria-hidden="true">
                      {Array.from({ length: Math.min(count, 4) }).map((_, dot) => (
                        <span key={dot} className={`h-1 w-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-accent"}`} />
                      ))}
                    </span>
                  ) : <span className="mt-0.5 h-1" />}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> Etkinlik kaydı olan gün</span>
            <button type="button" onClick={() => { const current = parseDateKey(today); setMonth(new Date(current.getFullYear(), current.getMonth(), 1)); setSelectedDate(today); }} className="font-bold text-primary-strong hover:underline">Bugüne git</button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{formatDateWithWeekday(selectedDate)}</CardTitle>
          <p className="text-xs text-muted-foreground">{selectedActivities.length ? `${selectedActivities.length} kayıt` : "Bu gün için kayıt yok."}</p>
        </CardHeader>
        <CardContent>
          {selectedActivities.length ? (
            <ul className="space-y-2">
              {selectedActivities.map((activity, index) => (
                <li key={`${activity.title}-${index}`} className="flex items-start gap-2.5 rounded-xl border border-border/60 p-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-base" aria-hidden="true">{activity.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{activity.title}</p>
                    {activity.detail ? <p className="mt-0.5 break-words text-xs text-muted-foreground">{activity.detail}</p> : null}
                  </div>
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-muted/50 px-3 py-4 text-center text-sm text-muted-foreground">Bu gün için bakım, görev veya sağlık kaydı görünmüyor. İstersen günü açıp geçmişini tamamlayabilirsin.</p>
          )}
          <Button className="mt-4 w-full" onClick={openSelectedDay}>
            <PencilLine className="h-4 w-4" aria-hidden="true" />
            {selectedDate === today ? "Bugünü uygulamada aç" : "O günü düzenle"}
          </Button>
          {selectedDateObj > parseDateKey(today) ? <p className="mt-2 text-center text-[11px] text-muted-foreground">Gelecek günler seçilemez.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
