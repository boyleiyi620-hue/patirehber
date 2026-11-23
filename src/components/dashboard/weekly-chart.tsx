import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildSeries, dayScore, todayKey } from "@/lib/utils";
import type { DailyLog } from "@/lib/types";

/** Son 7 günün mama/su/kum mini grafiği */
export function WeeklyChart({
  logs,
  catId,
  mealsTarget,
  days = 7,
  showHeader = true,
  throughDate = todayKey(),
}: {
  logs: DailyLog[];
  catId: string;
  mealsTarget: number;
  days?: number;
  showHeader?: boolean;
  throughDate?: string;
}) {
  const series = buildSeries(logs, catId, mealsTarget, days, throughDate);
  const today = throughDate;
  const totalMeals = series.reduce((sum, day) => sum + day.meals, 0);
  const waterDays = series.filter((day) => day.water).length;

  return (
    <Card>
      {showHeader ? (
        <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle>Haftalık takip</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {throughDate === todayKey() ? "Son 7 gün" : "Seçilen gün dâhil önceki 7 gün"} · mama, su ve kum
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Badge variant="default">{totalMeals} öğün</Badge>
            <Badge variant="success">{waterDays}/7 su</Badge>
          </div>
        </CardHeader>
      ) : null}
      <CardContent className={showHeader ? "pt-3" : "pt-5"}>
        <div
          className="flex items-end justify-between gap-1.5"
          role="img"
          aria-label={`${throughDate === todayKey() ? "Son" : "Seçilen gün dâhil önceki"} ${days} günlük mama ve su takibi grafiği`}
        >
          {series.map((day) => {
            const isToday = day.date === today;
            const score = dayScore(
              logs.find((log) => log.catId === catId && log.date === day.date),
              mealsTarget,
            );
            return (
              <div
                key={day.date}
                className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                aria-label={`${day.dayLong}: ${day.meals} öğün, su ${day.water ? "verildi" : "verilmedi"}, kum ${day.litter ? "temizlendi" : "temizlenmedi"}, ${day.play} dakika oyun, puan ${score}`}
                title={`${day.dayLong}: ${day.meals}/${mealsTarget} öğün · ${day.play} dk oyun`}
              >
                <div className="flex h-24 w-full max-w-8 items-end justify-center rounded-lg bg-muted/50 px-1 pb-0">
                  <div
                    className="relative w-full overflow-hidden rounded-t-md bg-primary/15"
                    style={{ height: "100%" }}
                  >
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t-md bg-primary transition-all duration-700"
                      style={{
                        height: `${Math.min(100, (day.meals / Math.max(1, mealsTarget)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span
                  className={
                    isToday
                      ? "text-[10px] font-extrabold text-primary-strong"
                      : "text-[10px] font-semibold text-muted-foreground"
                  }
                >
                  {day.dayLabel}
                </span>
                <div className="flex items-center gap-1" aria-hidden="true">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${day.water ? "bg-sky-400" : "bg-muted-foreground/25"}`}
                  />
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${day.litter ? "bg-amber-400" : "bg-muted-foreground/25"}`}
                  />
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${day.play >= 15 ? "bg-accent" : "bg-muted-foreground/25"}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            Mama ({mealsTarget} öğün hedefi)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-400" aria-hidden="true" />
            Su
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
            Kum
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            Oyun (15+ dk)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
