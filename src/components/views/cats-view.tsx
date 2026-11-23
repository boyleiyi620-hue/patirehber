"use client";

import Link from "next/link";
import { ArrowRight, Cat as CatIcon, Check, Flame, Plus, Sparkles, Weight } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/layout/page-header";
import { CatAvatar } from "@/components/layout/cat-avatar";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  breedName,
  computeStreak,
  dayScore,
  findLog,
  getCatAge,
} from "@/lib/utils";

export function CatsView() {
  const {
    cats,
    activeCatId,
    setActiveCat,
    logs,
    settings,
    reminders,
    t,
  } = useApp();

  return (
    <div>
      <PageHeader
        emoji="🐈"
        title={t("cats.title")}
        subtitle={
          cats.length
            ? `${cats.length} kedi profili · aktif kedi ${cats.find((cat) => cat.id === activeCatId)?.name ?? ""}`
            : "Kedilerini ekle, bakım planları otomatik oluşsun."
        }
        action={
          <ButtonLink href="/cats/new" size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("cats.add")}
          </ButtonLink>
        }
      />

      {cats.length === 0 ? (
        <EmptyState
          emoji="🐾"
          title={t("cats.empty")}
          description="İlk kedini ekleyerek mama, su, kum, aşı ve kilo takibine başla. Kayıtların hesabınla eşitlenir."
          action={
            <ButtonLink href="/cats/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Kedi ekle
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cats.map((cat) => {
            const age = getCatAge(cat.birthDate);
            const isActive = cat.id === activeCatId;
            const log = findLog(logs, cat.id);
            const score = dayScore(log, settings.mealsPerDay);
            const streak = computeStreak(logs, cat.id, settings.mealsPerDay);
            const catReminders = reminders.filter(
              (reminder) => reminder.catId === cat.id && reminder.enabled,
            ).length;

            return (
              <Card
                key={cat.id}
                className={`card-hover animate-fade-in-up overflow-hidden ${
                  isActive ? "border-primary/40 ring-1 ring-primary/20" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CatAvatar name={cat.name} photo={cat.photo} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h2 className="truncate font-display text-lg font-extrabold">
                          {cat.name}
                        </h2>
                        {isActive ? (
                          <Badge className="shrink-0" variant="default">
                            Aktif
                          </Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {breedName(cat.breedId)} · {age.label}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Weight className="h-3 w-3" aria-hidden="true" />
                          {cat.weight.toLocaleString("tr-TR")} kg
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{cat.gender === "female" ? "Dişi" : "Erkek"}</span>
                        <span aria-hidden="true">·</span>
                        <span>{cat.neutered ? "Kısır" : "Kısırlaştırılmadı"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-2 text-center">
                    <div>
                      <p className="text-sm font-extrabold text-primary-strong">{score}</p>
                      <p className="text-[10px] text-muted-foreground">Bugün</p>
                    </div>
                    <div>
                      <p className="inline-flex items-center gap-0.5 text-sm font-extrabold">
                        <Flame className="h-3 w-3 text-primary-strong" aria-hidden="true" />
                        {streak}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Seri</p>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold">{catReminders}</p>
                      <p className="text-[10px] text-muted-foreground">Hatırlatıcı</p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <ButtonLink
                      href={`/cats/${cat.id}`}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Profili gör
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </ButtonLink>
                    <ButtonLink
                      href={`/guide?cat=${cat.id}`}
                      variant="soft"
                      size="sm"
                      className="flex-1"
                    >
                      🐾 Özel rehber
                    </ButtonLink>
                    {!isActive ? (
                      <Button
                        variant="soft"
                        size="sm"
                        onClick={() => setActiveCat(cat.id)}
                        aria-label={`${cat.name} kedisini aktif kedi yap`}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Aktif yap
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-5 border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary-strong">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="text-xs leading-relaxed text-muted-foreground">
            <p className="font-bold text-foreground">Çoklu kedi desteği</p>
            <p className="mt-0.5">
              Birden fazla kedi ekleyebilir, ana sayfadan aktif kediyi
              değiştirebilirsin. Hatırlatıcılar kedi bazında ayrı takip edilir.
            </p>
            <Link
              href="/guide?kategori=breeds"
              className="mt-1.5 inline-flex items-center gap-1 font-bold text-primary-strong hover:underline"
            >
              <CatIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Irk rehberine göz at
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
