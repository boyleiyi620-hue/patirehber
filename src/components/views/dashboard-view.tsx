"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  Circle,
  Flame,
  Gamepad2,
  Lightbulb,
  ListChecks,
  Minus,
  Plus,
  Search,
  Settings,
  Trash2,
  Utensils,
  Droplets,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { BrandMark } from "@/components/layout/app-shell";
import { CatAvatar } from "@/components/layout/cat-avatar";
import { InstallPrompt } from "@/components/install-prompt";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { tipOfTheDay } from "@/lib/guide-data";
import {
  REMINDER_META,
  breedName,
  computeStreak,
  dateKey,
  dayScore,
  formatDateWithWeekday,
  formatOccurrence,
  getCatAge,
  greetingForHour,
  nextReminderDate,
  scoreMessage,
  taskCompletedOn,
  taskProgressOn,
  todayKey,
} from "@/lib/utils";

export function DashboardView() {
  const {
    cats,
    activeCat,
    activeCatId,
    setActiveCat,
    logs,
    reminders,
    settings,
    todayLog,
    activeDate,
    addMeal,
    undoMeal,
    toggleWater,
    toggleLitter,
    addPlay,
    completeReminder,
    updateTodayLog,
    tasks,
    tapTask,
    t,
  } = useApp();

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const mealsTarget = settings.mealsPerDay;
  const meals = todayLog?.mealsGiven ?? 0;
  const water = todayLog?.waterChanged ?? false;
  const litter = todayLog?.litterCleaned ?? false;
  const play = todayLog?.playMinutes ?? 0;

  const score = dayScore(todayLog, mealsTarget);
  const streak = activeCat
    ? computeStreak(logs, activeCat.id, mealsTarget, activeDate)
    : 0;

  const upcoming = useMemo(() => {
    return reminders
      .filter((reminder) => reminder.enabled)
      .map((reminder) => ({
        reminder,
        next: nextReminderDate(reminder, now ?? new Date()),
      }))
      .filter(
        (item): item is { reminder: (typeof reminders)[number]; next: Date } =>
          item.next !== null,
      )
      .sort((a, b) => a.next.getTime() - b.next.getTime())
      .slice(0, 3);
  }, [reminders, now]);

  const router = useRouter();
  // Onboarding is optional; users can start from the empty state.

  if (!activeCat) {
    return (
      <div className="space-y-5">
        <DashboardTop />
        <EmptyState
          emoji="🐈"
          title="PatiRehber'e hoş geldin!"
          description="İlk kedi profilini oluştur; mama, su, kum ve aşı takibi otomatik olarak planlansın."
          action={
            <ButtonLink href="/onboarding">
              <Plus className="h-4 w-4" aria-hidden="true" />
              İlk kedini ekle
            </ButtonLink>
          }
        />
        <Card className="gradient-cream">
          <CardContent className="p-5">
            <p className="text-sm font-bold">Henüz veri yok, sorun değil 🐾</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Kedi eklemeden önce rehberdeki beslenme ve sağlık bölümlerine göz
              atabilirsin.
            </p>
            <ButtonLink href="/guide" variant="outline" size="sm" className="mt-3">
              Rehberi keşfet
            </ButtonLink>
          </CardContent>
        </Card>
      </div>
    );
  }

  const age = getCatAge(activeCat.birthDate);
  const mealsDone = meals >= mealsTarget;
  const activeTasks = tasks.filter((task) => {
    if (task.catId && task.catId !== activeCat.id) return false;
    const createdDate = dateKey(new Date(task.createdAt));
    const hasProgressOnDate = task.progressByDate?.some((entry) => entry.date === activeDate) ?? false;
    if (activeDate === todayKey()) {
      if (createdDate > activeDate) return false;
      const completedDate = task.completedAt ? dateKey(new Date(task.completedAt)) : undefined;
      if (completedDate && completedDate !== activeDate && !hasProgressOnDate && (!task.repeat || task.repeat === "none")) return false;
      return true;
    }
    const relevantOnDate = task.dueDate === activeDate ||
      createdDate === activeDate ||
      hasProgressOnDate ||
      (task.completedAt ? dateKey(new Date(task.completedAt)) === activeDate : false) ||
      (task.repeat !== "none" && task.repeat !== undefined && createdDate <= activeDate);
    return relevantOnDate && !taskCompletedOn(task, activeDate);
  });

  return (
    <div className="space-y-5">
      <DashboardTop />

      {/* Karşılama */}
      <section className="animate-fade-in-up" aria-labelledby="greeting-heading">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-strong">
          {formatDateWithWeekday(activeDate)}
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h1
            id="greeting-heading"
            className="font-display text-2xl font-extrabold leading-tight sm:text-3xl"
          >
            {now ? greetingForHour(now.getHours()) : t("dashboard.greeting")},{" "}
            <span className="text-primary-strong">{settings.userName}</span>!
          </h1>
          {streak > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-extrabold text-primary-strong">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              {streak} gün
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeDate === todayKey() ? "Bugünkü" : "Seçilen günün"} bakım puanı {score}/100 · {scoreMessage(score)}
        </p>
      </section>

      {/* Aktif kedi */}
      <section aria-label="Aktif kedi" className="animate-fade-in-up">
        <div className="relative overflow-hidden rounded-3xl gradient-primary p-5 text-white shadow-soft">
          <div className="hero-pattern absolute inset-0 opacity-25" aria-hidden="true" />
          <div className="relative flex items-start gap-4">
            <CatAvatar name={activeCat.name} photo={activeCat.photo} size="lg" ring />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/75">
                Aktif kedi
              </p>
              <h2 className="mt-0.5 truncate font-display text-2xl font-extrabold">
                {activeCat.name}
              </h2>
              <p className="truncate text-sm text-white/90">
                {breedName(activeCat.breedId)} · {age.label}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">
                  {activeCat.weight.toLocaleString("tr-TR")} kg
                </span>
                {activeCat.neutered ? (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">
                    Kısır
                  </span>
                ) : null}
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold capitalize backdrop-blur">
                  {activeCat.gender === "female" ? "Dişi" : "Erkek"}
                </span>
              </div>
            </div>
            <Link
              href={`/cats/${activeCat.id}`}
              className="shrink-0 rounded-xl bg-white/15 p-2 backdrop-blur transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={`${activeCat.name} profiline git`}
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="relative mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-white/90">
              <span>{activeDate === todayKey() ? "Bugünkü bakım" : "Seçilen günün bakımı"}</span>
              <span>{score}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {cats.length > 1 ? (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Kedi seç">
            {cats.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={cat.id === activeCatId}
                onClick={() => setActiveCat(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                  cat.id === activeCatId
                    ? "border-primary bg-primary/10 text-primary-strong"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                <CatAvatar name={cat.name} photo={cat.photo} size="sm" className="!h-5 !w-5 !rounded-full !text-[9px]" />
                {cat.name}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <InstallPrompt compact />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Bugünkü görevler */}
        <Card className="animate-fade-in-up">
          <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
            <div>
              <CardTitle>{activeDate === todayKey() ? t("dashboard.tasks") : "Seçilen günün görevleri"}</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {mealsDone && water && litter && play >= 15
                  ? "Tüm görevler tamam, harika! 🎉"
                  : "Tek tıkla işaretle, gerisini biz takip edelim."}
              </p>
            </div>
            <ScoreRing value={score} size={58} stroke={6} />
          </CardHeader>
          <CardContent className="space-y-2 pt-1">
            <TaskRow
              icon={<Utensils className="h-4 w-4" aria-hidden="true" />}
              label={t("tasks.meals")}
              detail={`Günde ${mealsTarget} öğün`}
              done={mealsDone}
              value={`${meals}/${mealsTarget}`}
              action={
                meals > 0 ? (
                  <button
                    type="button"
                    onClick={undoMeal}
                    aria-label="Son öğün kaydını geri al"
                    className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ) : null
              }
            />
            <TaskRow
              icon={<Droplets className="h-4 w-4" aria-hidden="true" />}
              label={t("tasks.water")}
              detail="Taze ve temiz su"
              done={water}
            />
            <TaskRow
              icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
              label={t("tasks.litter")}
              detail="Günde 2 kez ideal"
              done={litter}
            />
            <TaskRow
              icon={<Gamepad2 className="h-4 w-4" aria-hidden="true" />}
              label={t("tasks.play")}
              detail="En az 15 dakika"
              done={play >= 15}
              value={`${play} dk`}
            />
            <div className="pt-2">
              <Progress value={score} label={activeDate === todayKey() ? "Günlük bakım puanı" : "Seçilen günün bakım puanı"} />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Puan; mama, su, kum ve oyun kayıtlarından hesaplanır.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hızlı işlemler */}
        <Card className="animate-fade-in-up">
          <CardHeader className="pb-3">
            <CardTitle>{t("dashboard.quick")}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {activeCat.name} için {activeDate === todayKey() ? "bugüne" : "seçilen güne"} kayıt oluştur.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2.5">
              <QuickButton
                icon={<Utensils className="h-5 w-5" aria-hidden="true" />}
                label={mealsDone ? "Mama tamam" : t("actions.meal")}
                hint={`${meals}/${mealsTarget}`}
                done={mealsDone}
                disabled={mealsDone}
                onClick={addMeal}
              />
              <QuickButton
                icon={<Droplets className="h-5 w-5" aria-hidden="true" />}
                label={water ? "Su tazelendi" : t("actions.water")}
                hint={water ? "Tamam" : "Bekliyor"}
                done={water}
                onClick={toggleWater}
              />
              <QuickButton
                icon={<Trash2 className="h-5 w-5" aria-hidden="true" />}
                label={litter ? "Kum temiz" : t("actions.litter")}
                hint={litter ? "Tamam" : "Bekliyor"}
                done={litter}
                onClick={toggleLitter}
              />
              <QuickButton
                icon={<Gamepad2 className="h-5 w-5" aria-hidden="true" />}
                label={t("actions.play")}
                hint={`${play} dk`}
                done={play >= 15}
                onClick={() => addPlay(10)}
              />
            </div>
            <button
              type="button"
              onClick={() => updateTodayLog({ playMinutes: play + 15 })}
              className="mt-3 w-full rounded-xl border border-dashed border-border px-3 py-2 text-[11px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary-strong"
            >
              + 15 dakika daha oyun ekle
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Görevlerim */}
      <Card className="animate-fade-in-up">
        <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
          <div>
            <CardTitle>Görevlerim</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
                  {activeTasks.length} aktif görev
            </p>
          </div>
          <Link
            href="/tasks"
            className="rounded-lg text-xs font-bold text-primary-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Tümü
          </Link>
        </CardHeader>
        <CardContent className="space-y-2 pt-1">
          {activeTasks.length === 0 ? (
            <div className="rounded-xl bg-muted/50 px-3 py-4 text-center">
              <p className="text-xs text-muted-foreground">{tasks.length === 0 ? "Henüz görev yok." : "Seçilen gün için görev yok."}</p>
              <ButtonLink href="/tasks" variant="ghost" size="sm" className="mt-1">
                Görev ekle
              </ButtonLink>
            </div>
          ) : (
            activeTasks
              .slice(0, 4)
              .map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => tapTask(task.id)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-border/60 px-2.5 py-2 text-left transition hover:border-primary/40"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm">
                    {task.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">{task.title}</p>
                    {task.target > 1 ? (
                      <p className="text-[10px] text-muted-foreground">
                        {taskProgressOn(task, activeDate)}/{task.target}
                      </p>
                    ) : null}
                  </div>
                  {task.target > 1 ? (
                    <div className="flex gap-0.5">
                      {Array.from({ length: task.target }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 w-3 rounded-full ${
                            i < taskProgressOn(task, activeDate) ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
                  )}
                </button>
              ))
          )}
          <Link
            href="/tasks"
            className="mt-1 flex items-center justify-center gap-1 rounded-xl bg-muted/50 py-2 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
            Görevleri yönet / yeni ekle
          </Link>
        </CardContent>
      </Card>

      {/* Oyunlar */}
      <Link
        href="/games"
        className="group flex items-center gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-4 transition hover:border-primary/40"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-2xl">
          🎮
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-extrabold">Oyunlar</p>
          <p className="text-[11px] text-muted-foreground">
            Hafıza ve bilgi yarışması ile kedi bilginizi test edin.
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-primary-strong transition group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>

      {/* Haftalık grafik */}
      <div className="animate-fade-in-up">
        <WeeklyChart
          logs={logs}
          catId={activeCat.id}
          mealsTarget={mealsTarget}
          throughDate={activeDate}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Yaklaşan hatırlatıcılar */}
        <Card className="animate-fade-in-up">
          <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
            <CardTitle>{t("dashboard.upcoming")}</CardTitle>
            <Link
              href="/reminders"
              className="rounded-lg text-xs font-bold text-primary-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Tümü
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-1">
            {activeDate !== todayKey() ? (
              <div className="rounded-xl bg-muted/50 px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Yaklaşan bildirimler gerçek bugünün saatine göre çalışır. Seçilen günün hatırlatıcılarını görmek ve kaydetmek için Hatırlatıcılar bölümünü aç.
                </p>
                <ButtonLink href="/reminders" variant="ghost" size="sm" className="mt-1">
                  Seçilen günün hatırlatıcıları
                </ButtonLink>
              </div>
            ) : upcoming.length === 0 ? (
              <div className="rounded-xl bg-muted/50 px-3 py-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Yaklaşan hatırlatıcı yok.
                </p>
                <ButtonLink href="/reminders" variant="ghost" size="sm" className="mt-1">
                  Hatırlatıcı ekle
                </ButtonLink>
              </div>
            ) : (
              upcoming.map(({ reminder, next }) => {
                const meta = REMINDER_META[reminder.type];
                const cat = cats.find((item) => item.id === reminder.catId);
                return (
                  <div
                    key={reminder.id}
                    className="flex items-center gap-2.5 rounded-xl border border-border/60 px-2.5 py-2"
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm ${meta.tone}`}
                      aria-hidden="true"
                    >
                      {meta.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">{reminder.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {cat ? `${cat.name} · ` : ""}
                        {formatOccurrence(next)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => completeReminder(reminder.id)}
                      aria-label={`${reminder.title} görevini tamamlandı olarak işaretle`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-accent hover:bg-accent/15 hover:text-emerald-600"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                );
              })
            )}
            <Link
              href="/reminders"
              className="mt-1 flex items-center justify-center gap-1 rounded-xl bg-muted/50 py-2 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Bell className="h-3.5 w-3.5" aria-hidden="true" />
              Hatırlatıcıları yönet
            </Link>
          </CardContent>
        </Card>

        {/* Günün ipucu */}
        <div className="space-y-4">
          <Card className="animate-fade-in-up overflow-hidden border-accent/30 bg-accent/10">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/25 text-emerald-700 dark:text-emerald-200">
                  <Lightbulb className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
                  {t("dashboard.tip")}
                </p>
              </div>
              <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">
                {tipOfTheDay(now ?? new Date())}
              </p>
              <ButtonLink href="/guide" variant="ghost" size="sm" className="mt-2 -ms-2">
                Daha fazla bilgi
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </ButtonLink>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/emergency"
              className="group rounded-2xl border border-destructive/25 bg-destructive-soft p-3.5 transition hover:border-destructive/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <AlertTriangle
                className="h-5 w-5 text-danger"
                aria-hidden="true"
              />
              <p className="mt-2 text-xs font-extrabold text-danger">
                Acil durum
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-danger">
                Zehirlenme ve ilk adımlar
              </p>
            </Link>
            <Link
              href="/reports"
              className="group rounded-2xl border border-border bg-card p-3.5 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BarChart3 className="h-5 w-5 text-primary-strong" aria-hidden="true" />
              <p className="mt-2 text-xs font-extrabold">Raporlar</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                Haftalık özet ve rozetler
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Üst çubuk: marka + haftalık seri + ayarlar */
function DashboardTop() {
  const { settings, t } = useApp();
  return (
    <div className="flex items-center justify-between">
      <BrandMark />
      <div className="flex items-center gap-1.5">
        <span className="hidden rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 sm:inline-flex">
          {settings.language.toUpperCase()}
        </span>
        <Link
          href="/search"
          aria-label="Ara"
          className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/settings"
          aria-label={t("nav.settings")}
          className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/40 hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function TaskRow({
  icon,
  label,
  detail,
  done,
  value,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
  done: boolean;
  value?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-1 py-1">
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
          done
            ? "bg-accent/20 text-emerald-700 dark:text-emerald-300"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{label}</p>
        <p className="text-[11px] text-muted-foreground">{detail}</p>
      </div>
      {value ? (
        <span className="text-xs font-bold tabular-nums text-muted-foreground">
          {value}
        </span>
      ) : null}
      {action}
      {done ? (
        <CheckCircle2
          className="h-5 w-5 shrink-0 text-accent"
          aria-label="Tamamlandı"
        />
      ) : (
        <Circle
          className="h-5 w-5 shrink-0 text-muted-foreground/35"
          aria-label="Bekliyor"
        />
      )}
    </div>
  );
}

function QuickButton({
  icon,
  label,
  hint,
  done,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  done: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-auto flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-70 ${
        done
          ? "border-accent/40 bg-accent/15 text-emerald-800 dark:text-emerald-200"
          : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
      }`}
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl ${
          done ? "bg-accent/25" : "bg-primary/10 text-primary-strong"
        }`}
      >
        {icon}
      </span>
      <span className="text-xs font-bold leading-tight">{label}</span>
      <span className="text-[10px] font-medium text-muted-foreground">{hint}</span>
    </button>
  );
}
