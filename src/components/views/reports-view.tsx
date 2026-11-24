"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Flame,
  Medal,
  TrendingDown,
  TrendingUp,
  Trophy,
  Utensils,
  Weight,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/layout/page-header";
import { CatAvatar } from "@/components/layout/cat-avatar";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
  buildSeries,
  computeBadges,
  computeStreak,
  dayScore,
  formatDateShort,
  formatNumber,
  getCatAge,
} from "@/lib/utils";

const RANGES = [
  { value: "7", label: "7 gün" },
  { value: "14", label: "14 gün" },
  { value: "30", label: "30 gün" },
] as const;

export function ReportsView() {
  const { data, cats, activeCat, activeCatId, setActiveCat, logs, settings, reminders } =
    useApp();

  const [range, setRange] = useState<(typeof RANGES)[number]["value"]>("7");

  const days = Number(range);
  const mealsTarget = settings.mealsPerDay;

  const series = useMemo(
    () => (activeCat ? buildSeries(logs, activeCat.id, mealsTarget, days) : []),
    [activeCat, days, logs, mealsTarget],
  );

  const totals = useMemo(() => {
    const meals = series.reduce((sum, day) => sum + day.meals, 0);
    const potentialMeals = days * mealsTarget;
    const waterDays = series.filter((day) => day.water).length;
    const litterDays = series.filter((day) => day.litter).length;
    const play = series.reduce((sum, day) => sum + day.play, 0);
    const avgScore = series.length
      ? Math.round(series.reduce((sum, day) => sum + day.score, 0) / series.length)
      : 0;
    const loggedDays = series.filter((day) => day.hasLog).length;
    const estimatedGrams =
      mealsTarget > 0
        ? Math.round((meals / mealsTarget) * settings.dailyPortionGrams)
        : 0;
    return {
      meals,
      potentialMeals,
      waterDays,
      litterDays,
      play,
      avgScore,
      loggedDays,
      estimatedGrams,
    };
  }, [days, mealsTarget, series, settings.dailyPortionGrams]);

  const badges = useMemo(() => (data ? computeBadges(data) : []), [data]);
  const earned = badges.filter((badge) => badge.earned).length;
  const streak = activeCat
    ? computeStreak(logs, activeCat.id, mealsTarget)
    : 0;

  const weightChange = useMemo(() => {
    if (!activeCat || activeCat.weightHistory.length < 2) return null;
    const history = [...activeCat.weightHistory].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    return {
      from: history[0],
      to: history[history.length - 1],
      delta: history[history.length - 1].kg - history[0].kg,
    };
  }, [activeCat]);

  if (cats.length === 0) {
    return (
      <div>
        <PageHeader
          emoji="📊"
          title="Raporlar"
          tourTarget="reports-overview"
          subtitle="Haftalık ve aylık bakım özeti, rozetler ve kilo değişimi."
          backHref="/"
          backLabel="Ana sayfa"
        />
        <EmptyState
          emoji="🐾"
          title="Rapor için veri yok"
          description="İlk kedi profilini ekleyip günlük bakım kayıtlarını tutmaya başladığında burada haftalık ve aylık özetini göreceksin."
          action={<ButtonLink href="/cats/new">Kedi ekle</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        emoji="📊"
        title="Raporlar"
        tourTarget="reports-overview"
        subtitle="Bakım alışkanlıklarını gör, gelişimini takip et."
        backHref="/"
        backLabel="Ana sayfa"
      />

      {cats.length > 1 ? (
        <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {cats.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCat(cat.id)}
              aria-pressed={cat.id === activeCatId}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
                cat.id === activeCatId
                  ? "border-primary bg-primary/10 text-primary-strong"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              <CatAvatar
                name={cat.name}
                photo={cat.photo}
                size="sm"
                className="!h-5 !w-5 !rounded-full !text-[9px]"
              />
              {cat.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between gap-2">
        <div
          className="flex gap-1 rounded-xl border border-border/70 bg-card p-1"
          role="tablist"
          aria-label="Rapor dönemi"
        >
          {RANGES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={range === option.value}
              onClick={() => setRange(option.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                range === option.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {totals.loggedDays}/{days} gün kayıtlı
        </p>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Metric
          icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}
          label="Ortalama puan"
          value={`${totals.avgScore}`}
          suffix="/100"
          tone="bg-primary/10 text-primary-strong"
        />
        <Metric
          icon={<Flame className="h-4 w-4" aria-hidden="true" />}
          label="Aktif seri"
          value={`${streak}`}
          suffix=" gün"
          tone="bg-accent/20 text-emerald-700 dark:text-emerald-300"
        />
        <Metric
          icon={<Utensils className="h-4 w-4" aria-hidden="true" />}
          label="Toplam öğün"
          value={`${totals.meals}`}
          suffix={`/${totals.potentialMeals}`}
          tone="bg-amber-500/10 text-amber-700 dark:text-amber-300"
        />
        <Metric
          icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          label="Su / kum günü"
          value={`${totals.waterDays}/${totals.litterDays}`}
          tone="bg-sky-500/10 text-sky-600 dark:text-sky-300"
        />
      </div>

      {/* Günlük grafik */}
      <Card className="mt-3">
        <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
          <div>
            <CardTitle>Günlük bakım puanı</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {activeCat ? `${activeCat.name} · son ${days} gün` : ""}
            </p>
          </div>
          <Badge variant={totals.avgScore >= 80 ? "success" : "default"}>
            {totals.avgScore >= 80
              ? "Harika gidiyor"
              : totals.avgScore >= 50
                ? "İyi"
                : "Gelişebilir"}
          </Badge>
        </CardHeader>
        <CardContent className="pt-2">
          <div
            className="flex h-40 items-end gap-1"
            role="img"
            aria-label={`Son ${days} günlük bakım puanı grafiği`}
          >
            {series.map((day) => (
              <div
                key={day.date}
                className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                title={`${day.dayLong} ${formatDateShort(day.date)} · puan ${day.score}`}
              >
                <span className="text-[9px] font-bold tabular-nums text-muted-foreground opacity-0 transition group-hover:opacity-100">
                  {day.score}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      day.score >= 80
                        ? "bg-accent"
                        : day.score >= 40
                          ? "bg-primary"
                          : day.hasLog
                            ? "bg-primary/40"
                            : "bg-muted"
                    }`}
                    style={{ height: `${Math.max(4, day.score)}%` }}
                  />
                </div>
                <span className="w-full truncate text-center text-[8px] font-semibold text-muted-foreground">
                  {days > 14 ? day.date.slice(-2) : day.dayLabel}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              80+ mükemmel
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              40-79 iyi
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary/40" aria-hidden="true" />
              Kayıt var, eksik görev
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {/* Mama tüketimi */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5">
              <Utensils className="h-4 w-4 text-primary-strong" aria-hidden="true" />
              Mama tüketimi tahmini
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Öğün sayısı ve günlük porsiyon ayarına göre.
            </p>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="rounded-xl bg-primary/10 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary-strong">
                Tahmini tüketim
              </p>
              <p className="font-display text-2xl font-extrabold">
                {formatNumber(totals.estimatedGrams)} g
              </p>
              <p className="text-[11px] text-muted-foreground">
                {days} günde · günlük ortalama ~
                {formatNumber(
                  Math.round(totals.estimatedGrams / Math.max(1, days)),
                )}{" "}
                g
              </p>
            </div>
            <div className="space-y-1.5 text-xs">
              <Row label="Öğün hedefi" value={`${mealsTarget} / gün`} />
              <Row
                label="Günlük porsiyon ayarı"
                value={`${settings.dailyPortionGrams} g`}
              />
              <Row
                label="Tamamlanan öğün"
                value={`${totals.meals} / ${totals.potentialMeals}`}
              />
            </div>
            <Progress
              value={
                totals.potentialMeals > 0
                  ? (totals.meals / totals.potentialMeals) * 100
                  : 0
              }
              label="Öğün tamamlama oranı"
            />
            <ButtonLink
              href="/settings"
              variant="ghost"
              size="sm"
              className="-ms-2"
            >
              Porsiyon ayarını düzenle
            </ButtonLink>
          </CardContent>
        </Card>

        {/* Aktivite ve kilo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5">
              <Weight className="h-4 w-4 text-violet-500" aria-hidden="true" />
              Aktivite ve kilo
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Oyun süresi ve kilo değişimi.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-accent/15 p-2.5 text-center">
                <p className="font-display text-xl font-extrabold">
                  {totals.play}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  dakika oyun
                </p>
              </div>
              <div className="rounded-xl bg-muted/60 p-2.5 text-center">
                <p className="font-display text-xl font-extrabold">
                  {Math.round(totals.play / Math.max(1, days))}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  günlük ortalama dk
                </p>
              </div>
            </div>

            {activeCat && weightChange ? (
              <div className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold">Kilo değişimi</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDateShort(weightChange.from.date)} →{" "}
                      {formatDateShort(weightChange.to.date)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-extrabold ${
                      Math.abs(weightChange.delta) < 0.05
                        ? "text-muted-foreground"
                        : weightChange.delta > 0
                          ? "text-primary-strong"
                          : "text-sky-600 dark:text-sky-300"
                    }`}
                  >
                    {Math.abs(weightChange.delta) < 0.05 ? null : weightChange.delta >
                      0 ? (
                      <TrendingUp className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="h-4 w-4" aria-hidden="true" />
                    )}
                    {weightChange.delta > 0 ? "+" : ""}
                    {weightChange.delta.toLocaleString("tr-TR", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    kg
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Güncel: {activeCat.weight.toLocaleString("tr-TR")} kg ·{" "}
                  {getCatAge(activeCat.birthDate).label}
                </p>
              </div>
            ) : (
              <p className="rounded-xl bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
                Kilo değişimi için en az 2 ölçüm gerekir. Kedi profilindeki
                Kilo sekmesinden ölçüm ekleyebilirsin.
              </p>
            )}

            <div className="space-y-1 text-xs">
              <Row label="Su değişimi" value={`${totals.waterDays} gün`} />
              <Row label="Kum temizliği" value={`${totals.litterDays} gün`} />
              <Row
                label="Aktif hatırlatıcı"
                value={`${reminders.filter((item) => item.enabled).length} adet`}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rozetler */}
      <Card className="mt-3">
        <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
          <div>
            <CardTitle className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Rozetler
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {earned}/{badges.length} rozet kazanıldı
            </p>
          </div>
          <Badge variant={earned > 0 ? "success" : "outline"}>
            <Medal className="h-3 w-3" aria-hidden="true" />
            {earned > 0 ? "Devam et!" : "İlk rozeti kazan"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <Progress
              value={badges.length ? (earned / badges.length) * 100 : 0}
              label="Rozet ilerlemesi"
            />
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {badges.map((badge) => (
              <li
                key={badge.id}
                className={`rounded-xl border p-2.5 text-center transition ${
                  badge.earned
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-border bg-muted/30"
                }`}
              >
                <span className="text-xl" aria-hidden="true">
                  {badge.emoji}
                </span>
                <p className="mt-1 text-[11px] font-bold leading-tight">
                  {badge.title}
                </p>
                <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                  {badge.description}
                </p>
                {badge.progress ? (
                  <p className="mt-1 text-[10px] font-semibold text-muted-foreground">
                    {badge.progress.current}/{badge.progress.target}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Kediler karşılaştırma */}
      {cats.length > 1 ? (
        <Card className="mt-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-primary-strong" aria-hidden="true" />
              Kedi bazında bugün
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              {cats.map((cat) => {
                const log = logs.find(
                  (item) => item.catId === cat.id && item.date === series.at(-1)?.date,
                );
                const score = dayScore(log, mealsTarget);
                const catStreak = computeStreak(logs, cat.id, mealsTarget);
                return (
                  <li
                    key={cat.id}
                    className="flex items-center gap-2.5 py-2"
                  >
                    <CatAvatar name={cat.name} photo={cat.photo} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">{cat.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {log?.mealsGiven ?? 0}/{mealsTarget} öğün ·{" "}
                        {log?.playMinutes ?? 0} dk oyun
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-primary-strong">
                      <Flame className="h-3 w-3" aria-hidden="true" />
                      {catStreak}
                    </span>
                    <Badge variant={score >= 80 ? "success" : "outline"}>
                      {score}/100
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Tabs
        className="mt-4"
        ariaLabel="Rapor bilgi sekmeleri"
        value="bilgi"
        onValueChange={() => undefined}
        items={[
          { value: "bilgi", label: "Rapor nasıl hesaplanır?", icon: <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> },
        ]}
      />
      <TabPanel value="bilgi" activeValue="bilgi" label="Hesaplama bilgisi">
        <Card className="mt-2 bg-muted/30">
          <CardContent className="p-4 text-[11px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Bakım puanı:</strong> Mama
              hedefi %45, su %20, kum %20, 15+ dakika oyun %15 ağırlıkla
              hesaplanır ve 100 üzerinden gösterilir.
            </p>
            <p className="mt-1.5">
              <strong className="text-foreground">Mama tüketimi:</strong>{" "}
              Tamamlanan öğün sayısı, öğün hedefi ve günlük porsiyon ayarıyla
              oranlanarak tahmin edilir. Gerçek tüketim mamaya ve kedinin
              iştahına göre değişir.
            </p>
            <p className="mt-1.5">
              <strong className="text-foreground">Seri:</strong> Bir günün tam
              sayılması için mama hedefinin tamamlanması, su ve kum kaydının
              girilmesi (puan ≥ 80) gerekir.
            </p>
          </CardContent>
        </Card>
      </TabPanel>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  suffix,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}>
          {icon}
        </span>
        <p className="mt-1.5 truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="font-display text-lg font-extrabold leading-tight">
          {value}
          {suffix ? (
            <span className="text-[11px] font-semibold text-muted-foreground">
              {suffix}
            </span>
          ) : null}
        </p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
