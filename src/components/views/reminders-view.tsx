"use client";

import { useMemo, useState } from "react";
import {
  AlarmClock,
  Bell,
  BellRing,
  Check,
  Clock,
  Flame,
  History,
  Pencil,
  Plus,
  Search,
  Settings2,
  Timer,
  Utensils,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/layout/page-header";
import { ReminderDialog } from "@/components/reminders/reminder-dialog";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { PortionCalculator } from "@/components/guide/calculators";
import { getNotificationPermission, requestNotificationPermission } from "@/lib/notifications";
import {
  REMINDER_META,
  describeDays,
  formatDateShort,
  formatTimeRange,
  isCompletedToday,
  isReminderDueOn,
  todayKey,
} from "@/lib/utils";
import type { Reminder, ReminderType } from "@/lib/types";

const TYPE_FILTERS: Array<{ value: "all" | ReminderType; label: string }> = [
  { value: "all", label: "Tümü" },
  ...Object.entries(REMINDER_META).map(([value, meta]) => ({
    value: value as ReminderType,
    label: `${meta.emoji} ${meta.label}`,
  })),
];

type Scope = "today" | "all" | "off";

export function RemindersView() {
  const {
    cats,
    reminders,
    settings,
    updateSettings,
    toggleReminder,
    completeReminder,
    snoozeReminder,
    notify,
  } = useApp();

  const [scope, setScope] = useState<Scope>("today");
  const [typeFilter, setTypeFilter] = useState<"all" | ReminderType>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  const now = useMemo(() => new Date(), []);
  const today = todayKey();
  const permission = getNotificationPermission();

  const dueToday = reminders.filter(
    (reminder) => reminder.enabled && isReminderDueOn(reminder, now),
  );
  const completedToday = reminders.filter(
    (reminder) => isCompletedToday(reminder) && isReminderDueOn(reminder, now),
  );
  const bestStreak = reminders.reduce(
    (max, reminder) => Math.max(max, reminder.streak),
    0,
  );

  const todayProgress = dueToday.length
    ? Math.round((completedToday.length / dueToday.length) * 100)
    : 0;

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return reminders
      .filter((reminder) => {
        if (scope === "today") {
          if (!reminder.enabled || !isReminderDueOn(reminder, now)) return false;
        } else if (scope === "off") {
          if (reminder.enabled) return false;
        }
        if (typeFilter !== "all" && reminder.type !== typeFilter) return false;
        if (catFilter !== "all" && (reminder.catId ?? "all") !== catFilter)
          return false;
        if (q) {
          const cat = cats.find((item) => item.id === reminder.catId);
          const haystack = `${reminder.title} ${reminder.note ?? ""} ${cat?.name ?? ""} ${REMINDER_META[reminder.type].label}`;
          if (!haystack.toLocaleLowerCase("tr-TR").includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return a.time.localeCompare(b.time);
      });
  }, [catFilter, cats, now, query, reminders, scope, typeFilter]);

  // Son 7 günde tamamlanan hatırlatıcı geçmişi
  const history = useMemo(() => {
    const entries: Array<{ reminder: Reminder; date: string }> = [];
    for (const reminder of reminders) {
      for (const date of reminder.history) {
        entries.push({ reminder, date });
      }
    }
    return entries
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 12);
  }, [reminders]);

  const askPermission = async () => {
    setPermissionBusy(true);
    const result = await requestNotificationPermission();
    setPermissionBusy(false);
    if (result === "granted") {
      updateSettings({ notifications: { ...settings.notifications, enabled: true } });
      notify("Bildirim izni verildi 🔔");
    } else if (result === "denied") {
      notify("Bildirim izni reddedildi. Tarayıcı ayarlarından açabilirsin.");
    } else if (result === "unsupported") {
      notify("Bu tarayıcı bildirimleri desteklemiyor.");
    }
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (reminder: Reminder) => {
    setEditing(reminder);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        emoji="⏰"
        title="Hatırlatıcılar"
        subtitle="Mama, su, kum, ilaç ve rutin bakım görevlerini planla; serini koru."
        action={
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ekle
          </Button>
        }
      />

      {/* Özet kartları */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <SummaryTile
          icon={<AlarmClock className="h-4 w-4" aria-hidden="true" />}
          label="Bugünkü görev"
          value={`${completedToday.length}/${dueToday.length}`}
          tone="bg-primary/10 text-primary-strong"
        />
        <SummaryTile
          icon={<BellRing className="h-4 w-4" aria-hidden="true" />}
          label="Aktif hatırlatıcı"
          value={String(reminders.filter((item) => item.enabled).length)}
          tone="bg-sky-500/10 text-sky-600 dark:text-sky-300"
        />
        <SummaryTile
          icon={<Flame className="h-4 w-4" aria-hidden="true" />}
          label="En iyi seri"
          value={`${bestStreak} gün`}
          tone="bg-accent/20 text-emerald-700 dark:text-emerald-300"
        />
        <SummaryTile
          icon={<Timer className="h-4 w-4" aria-hidden="true" />}
          label="Ertelenen"
          value={String(
            reminders.filter(
              (item) => item.snoozedUntil && item.snoozedUntil > Date.now(),
            ).length,
          )}
          tone="bg-violet-500/10 text-violet-600 dark:text-violet-300"
        />
      </div>

      {/* Günlük ilerleme */}
      <Card className="mt-3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Bugünkü tamamlama</p>
              <p className="text-[11px] text-muted-foreground">
                {dueToday.length === 0
                  ? "Bugün için planlanmış görev yok."
                  : completedToday.length === dueToday.length
                    ? "Bugünün tüm görevleri tamamlandı, harika! 🎉"
                    : `${dueToday.length - completedToday.length} görev bekliyor.`}
              </p>
            </div>
            <span className="font-display text-2xl font-extrabold text-primary-strong">
              {todayProgress}%
            </span>
          </div>
          <Progress
            className="mt-2.5"
            value={todayProgress}
            label="Bugünkü hatırlatıcı tamamlama oranı"
          />
        </CardContent>
      </Card>

      {/* Bildirim izni / tercih bandı */}
      {permission !== "granted" || !settings.notifications.enabled ? (
        <Card className="mt-3 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary-strong">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                {permission === "granted"
                  ? "Bildirimler kapalı"
                  : "Bildirimleri aç"}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                {permission === "denied"
                  ? "İzin reddedilmiş. Tarayıcı ayarlarından PatiRehber için bildirim iznini açabilirsin."
                  : "Saatinde hatırlatma almak için bildirim izni ver. Tarayıcı kısıtları nedeniyle uygulama tamamen kapalıyken alarm çalması garanti değildir; PWA olarak kurmak ve izin vermek en iyi sonucu verir."}
              </p>
            </div>
            {permission === "granted" ? (
              <Button
                size="sm"
                onClick={() =>
                  updateSettings({
                    notifications: {
                      ...settings.notifications,
                      enabled: true,
                    },
                  })
                }
              >
                Aç
              </Button>
            ) : permission === "default" ? (
              <Button size="sm" onClick={askPermission} disabled={permissionBusy}>
                İzin ver
              </Button>
            ) : (
              <ButtonLink href="/settings" size="sm" variant="outline">
                Ayarlar
              </ButtonLink>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Kapsam sekmeleri */}
      <div
        className="mt-4 flex gap-1 rounded-2xl border border-border/70 bg-card p-1 shadow-card"
        role="tablist"
        aria-label="Hatırlatıcı kapsamı"
      >
        {(
          [
            { value: "today", label: "Bugün", count: dueToday.length },
            { value: "all", label: "Tümü", count: reminders.length },
            {
              value: "off",
              label: "Kapalı",
              count: reminders.filter((item) => !item.enabled).length,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={scope === tab.value}
            onClick={() => setScope(tab.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition ${
              scope === tab.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                scope === tab.value
                  ? "bg-white/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Arama */}
      <div className="mt-3 space-y-2.5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Hatırlatıcı ara…"
            aria-label="Hatırlatıcı ara"
            className="ps-10"
          />
        </div>

        {/* Filtreler (katlanabilir) */}
        <details className="rounded-2xl border border-border/70 bg-card p-3">
          <summary className="cursor-pointer text-xs font-bold text-foreground">
            Filtreler
          </summary>
          <div className="mt-2.5 space-y-2.5">
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
              {TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setTypeFilter(filter.value)}
                  aria-pressed={typeFilter === filter.value}
                  className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    typeFilter === filter.value
                      ? "border-primary bg-primary/10 text-primary-strong"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            {cats.length > 1 ? (
              <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setCatFilter("all")}
                  aria-pressed={catFilter === "all"}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                    catFilter === "all"
                      ? "border-primary bg-primary/10 text-primary-strong"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  Tüm kediler
                </button>
                {cats.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCatFilter(cat.id)}
                    aria-pressed={catFilter === cat.id}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      catFilter === cat.id
                        ? "border-primary bg-primary/10 text-primary-strong"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </details>
      </div>

      {/* Hatırlatıcı listesi (butonla açılır) */}
      <div className="mt-3">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => setListOpen((v) => !v)}
        >
          {listOpen ? "Hatırlatıcıları gizle" : "Hatırlatıcıları göster ve düzenle"}
        </Button>
      </div>
      {listOpen ? (
      <div className="mt-3 space-y-2.5">
        {filtered.length === 0 ? (
          <EmptyState
            emoji={scope === "off" ? "🔕" : "🗓️"}
            title={
              reminders.length === 0
                ? "Henüz hatırlatıcı yok"
                : "Bu filtrede hatırlatıcı yok"
            }
            description={
              reminders.length === 0
                ? "Mama, su, kum, ilaç ve özel günler için hatırlatıcı oluştur; PatiRehber zamanı geldiğinde hatırlatsın."
                : "Farklı bir kapsam veya tür seçmeyi dene."
            }
            action={
              <Button size="sm" onClick={openNew}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Hatırlatıcı ekle
              </Button>
            }
          />
        ) : (
          filtered.map((reminder) => {
            const meta = REMINDER_META[reminder.type];
            const cat = cats.find((item) => item.id === reminder.catId);
            const done = isCompletedToday(reminder);
            const snoozed =
              reminder.snoozedUntil && reminder.snoozedUntil > Date.now();

            return (
              <Card
                key={reminder.id}
                className={`animate-fade-in-up transition ${
                  reminder.enabled ? "" : "opacity-70"
                } ${done ? "border-accent/40 bg-accent/5" : ""}`}
              >
                <CardContent className="p-3.5">
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg ${meta.tone}`}
                      aria-hidden="true"
                    >
                      {meta.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-bold">
                          {reminder.title}
                        </p>
                        {done ? (
                          <Badge variant="success">
                            <Check className="h-3 w-3" aria-hidden="true" />
                            Bugün tamam
                          </Badge>
                        ) : snoozed ? (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            Ertelendi
                          </Badge>
                        ) : null}
                        {reminder.streak > 0 ? (
                          <Badge variant="default">
                            <Flame className="h-3 w-3" aria-hidden="true" />
                            {reminder.streak}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatTimeRange(reminder.time)} ·{" "}
                        {describeDays(reminder.days)}
                        {cat ? ` · ${cat.name}` : " · Tüm kediler"}
                      </p>
                      {reminder.note ? (
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {reminder.note}
                        </p>
                      ) : null}

                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <Button
                          size="sm"
                          variant={done ? "secondary" : "success"}
                          onClick={() => completeReminder(reminder.id)}
                          disabled={done}
                          aria-label={`${reminder.title} görevini tamamla`}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          {done ? "Tamamlandı" : "Tamamla"}
                        </Button>
                        {!done ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => snoozeReminder(reminder.id, 30)}
                            aria-label={`${reminder.title} hatırlatıcısını 30 dakika ertele`}
                          >
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            30 dk ertele
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(reminder)}
                          aria-label={`${reminder.title} hatırlatıcısını düzenle`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Düzenle
                        </Button>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Switch
                        checked={reminder.enabled}
                        onCheckedChange={() => toggleReminder(reminder.id)}
                        label={`${reminder.title} hatırlatıcısı açık`}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {reminder.enabled ? "Açık" : "Kapalı"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      ) : null}
      <details className="mt-4 rounded-2xl border border-border/70 bg-card p-3">
        <summary className="cursor-pointer text-xs font-bold text-foreground">
          Gecmis, tur rehberi ve hesaplayici
        </summary>
        <div className="mt-3 space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5">
            <History className="h-4 w-4 text-primary-strong" aria-hidden="true" />
            Tamamlama geçmişi
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Son tamamlanan görevler ve kazanılan seriler.
          </p>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-2 text-xs text-muted-foreground">
              Henüz tamamlanmış görev kaydı yok. Görevleri tamamladıkça burada
              listelenir.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {history.map(({ reminder, date }) => {
                const meta = REMINDER_META[reminder.type];
                const cat = cats.find((item) => item.id === reminder.catId);
                return (
                  <li
                    key={`${reminder.id}-${date}`}
                    className="flex items-center gap-2.5 py-2"
                  >
                    <span aria-hidden="true" className="text-sm">
                      {meta.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">
                        {reminder.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {cat ? `${cat.name} · ` : ""}
                        {reminder.time}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {date === today ? "Bugün" : formatDateShort(date)}
                    </span>
                    <Check
                      className="h-3.5 w-3.5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Tür rehberi */}
      <Card className="mt-4 bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5">
            <Settings2 className="h-4 w-4 text-primary-strong" aria-hidden="true" />
            Hatırlatıcı türleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(REMINDER_META) as ReminderType[]).map((type) => {
              const meta = REMINDER_META[type];
              return (
                <li key={type} className="flex items-start gap-2 text-xs">
                  <span aria-hidden="true">{meta.emoji}</span>
                  <div>
                    <p className="font-semibold">{meta.label}</p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      {meta.hint}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
            <Bell className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            Bildirimler uygulama açıkken kontrol edilir. Arka plan push
            bildirimleri için service worker hazırdır.
          </p>
        </CardContent>
      </Card>

      {/* Mama porsiyon hesaplayıcı */}
      <section className="mt-4" aria-label="Mama porsiyon hesaplayıcı">
        <div className="mb-2 flex items-center gap-1.5">
          <Utensils className="h-4 w-4 text-primary-strong" aria-hidden="true" />
          <h2 className="font-display text-base font-bold">
            Mama miktarı hesaplayıcı
          </h2>
        </div>
        <PortionCalculator />
      </section>

        </div>
      </details>

      <ReminderDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        reminder={editing}
      />
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2.5 p-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-base font-extrabold leading-tight">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
