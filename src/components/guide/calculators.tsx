"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Calculator,
  Droplets,
  Info,
  Scale,
  Utensils,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Label, FieldHint } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  BCS_LEVELS,
  calculatePortion,
  idealWeightEstimate,
  waterNeed,
} from "@/lib/calculators";
import { catToHumanAge, formatNumber } from "@/lib/utils";
import type { ActivityLevel, AgeGroup, FoodType } from "@/lib/types";

const AGE_OPTIONS: Array<{ value: AgeGroup; label: string }> = [
  { value: "kitten", label: "Yavru (0-12 ay)" },
  { value: "adult", label: "Yetişkin (1-7 yaş)" },
  { value: "senior", label: "Yaşlı (7+ yaş)" },
];

const ACTIVITY_OPTIONS: Array<{ value: ActivityLevel; label: string }> = [
  { value: "low", label: "Sakin / az hareket" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Çok aktif" },
];

/** Tüm hesaplayıcıları tek bölümde toplar */
export function Calculators() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PortionCalculator />
      <WaterCalculator />
      <AgeConverter />
      <BcsCalculator />
    </div>
  );
}

function ResultRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-extrabold tabular-nums">{value}</span>
      {hint ? <span className="sr-only">{hint}</span> : null}
    </div>
  );
}

/** Mama porsiyonu: RER/DER tabanlı günlük gram hesabı */
function PortionCalculator() {
  const [weight, setWeight] = useState("4.5");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("adult");
  const [activity, setActivity] = useState<ActivityLevel>("medium");
  const [neutered, setNeutered] = useState(true);
  const [foodType, setFoodType] = useState<FoodType>("dry");
  const [meals, setMeals] = useState("3");

  const weightValue = Number(weight.replace(",", "."));
  const valid = Number.isFinite(weightValue) && weightValue >= 0.4 && weightValue <= 20;
  const mealsValue = Math.min(6, Math.max(1, Number(meals) || 3));

  const result = useMemo(() => {
    if (!valid) return null;
    return calculatePortion({
      weightKg: weightValue,
      ageGroup,
      activity,
      neutered,
      kcalPer100g: foodType === "dry" ? 370 : 90,
      mealsPerDay: mealsValue,
    });
  }, [activity, ageGroup, foodType, mealsValue, neutered, valid, weightValue]);

  return (
    <Card id="porsiyon" className="scroll-mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary-strong">
            <Utensils className="h-4 w-4" aria-hidden="true" />
          </span>
          Mama porsiyon hesaplayıcı
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Kilo, yaş ve aktiviteye göre günlük mama miktarı. Sonuç tahminidir.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="calc-weight">Kilo (kg)</Label>
            <Input
              id="calc-weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0.4"
              max="20"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calc-meals">Öğün sayısı</Label>
            <Select
              id="calc-meals"
              value={meals}
              onChange={(event) => setMeals(event.target.value)}
            >
              {[2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} öğün
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calc-age">Yaş grubu</Label>
            <Select
              id="calc-age"
              value={ageGroup}
              onChange={(event) => setAgeGroup(event.target.value as AgeGroup)}
            >
              {AGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calc-activity">Aktivite</Label>
            <Select
              id="calc-activity"
              value={activity}
              onChange={(event) => setActivity(event.target.value as ActivityLevel)}
            >
              {ACTIVITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calc-food">Mama türü</Label>
            <Select
              id="calc-food"
              value={foodType}
              onChange={(event) => setFoodType(event.target.value as FoodType)}
            >
              <option value="dry">Kuru mama (~370 kcal/100 g)</option>
              <option value="wet">Yaş mama (~90 kcal/100 g)</option>
            </Select>
          </div>
          <div className="flex items-end justify-between gap-2 pb-1">
            <span className="text-xs font-semibold">Kısır</span>
            <Switch
              checked={neutered}
              onCheckedChange={setNeutered}
              label="Kısırlaştırma durumu"
            />
          </div>
        </div>

        <div className="rounded-xl bg-primary/10 p-3.5">
          {result ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary-strong">
                Günlük mama
              </p>
              <p className="font-display text-3xl font-extrabold">
                {formatNumber(result.gramsPerDay)} g
              </p>
              <p className="text-xs text-muted-foreground">
                {result.mealsPerDay} öğün × ~{formatNumber(result.gramsPerMeal)} g ·{" "}
                {formatNumber(result.der)} kcal/gün
              </p>
            </>
          ) : (
            <p className="text-xs text-danger">
              0,4 - 20 kg arasında geçerli bir kilo girin.
            </p>
          )}
        </div>

        <FieldHint>
          Formül: RER = 70 × kg^0,75, ardından yaş/kısır/aktivite katsayısı.
          Mamadaki kalori değeri farklıysa paket üzerindeki miktarı esas alın.
        </FieldHint>
        <p className="rounded-lg bg-muted/60 p-2 text-[10px] leading-relaxed text-muted-foreground">
          <Info className="me-1 inline h-3 w-3" aria-hidden="true" />
          Ani mama değişikliği yapmayın; 7 günlük geçiş planını uygulayın.
        </p>
      </CardContent>
    </Card>
  );
}

/** Su ihtiyacı: 40-60 ml/kg */
function WaterCalculator() {
  const [weight, setWeight] = useState("4.5");
  const value = Number(weight.replace(",", "."));
  const valid = Number.isFinite(value) && value >= 0.4 && value <= 20;
  const result = valid ? waterNeed(value) : null;

  return (
    <Card id="su" className="scroll-mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-300">
            <Droplets className="h-4 w-4" aria-hidden="true" />
          </span>
          Su ihtiyacı
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Kediler az su içer; günlük hedefi bilmek böbrek sağlığını korur.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="water-weight">Kilo (kg)</Label>
          <Input
            id="water-weight"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0.4"
            max="20"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </div>
        <div className="rounded-xl bg-sky-500/10 p-3.5">
          {result ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                Günlük su hedefi
              </p>
              <p className="font-display text-3xl font-extrabold">
                {result.min} - {result.max} ml
              </p>
              <p className="text-xs text-muted-foreground">
                Yaklaşık {result.cups} çay bardağı · yaş mama tüketimi bu miktarın
                bir kısmını karşılar.
              </p>
            </>
          ) : (
            <p className="text-xs text-danger">Geçerli bir kilo girin.</p>
          )}
        </div>
        <FieldHint>
          Su kabını günde en az bir kez tazeleyin; birden fazla noktada su
          bulundurun. Çeşme ve geniş kaplar tüketimi artırır.
        </FieldHint>
      </CardContent>
    </Card>
  );
}

/** Kedi yaşı → insan yaşı */
function AgeConverter() {
  const [years, setYears] = useState("3");
  const [months, setMonths] = useState("0");
  const yearsValue = Number(years.replace(",", ".")) || 0;
  const monthsValue = Number(months) || 0;
  const totalYears = Math.max(0, yearsValue + monthsValue / 12);
  const human = catToHumanAge(totalYears);

  return (
    <Card id="yas" className="scroll-mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300">
            <Activity className="h-4 w-4" aria-hidden="true" />
          </span>
          Kedi yaşı → insan yaşı
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          İlk yıl 15, ikinci yıl +9, sonrası her yıl +4 insan yılı sayılır.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cat-years">Yıl</Label>
            <Input
              id="cat-years"
              type="number"
              inputMode="numeric"
              min="0"
              max="30"
              value={years}
              onChange={(event) => setYears(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-months">Ay</Label>
            <Select
              id="cat-months"
              value={months}
              onChange={(event) => setMonths(event.target.value)}
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index} value={index}>
                  {index} ay
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="rounded-xl bg-violet-500/10 p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            İnsan yaşı karşılığı
          </p>
          <p className="font-display text-3xl font-extrabold">~{human} yaş</p>
          <p className="text-xs text-muted-foreground">
            {totalYears < 1
              ? "Yavru dönemi: 4 öğün ve yavru maması önerilir."
              : totalYears < 8
                ? "Yetişkin dönem: yılda bir sağlık kontrolü."
                : "Yaşlı dönem: 6 ayda bir kontrol ve böbrek takibi önerilir."}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
          {[
            [1, 15],
            [2, 24],
            [5, 36],
            [10, 56],
            [15, 76],
            [20, 96],
          ].map(([cat, person]) => (
            <div key={cat} className="rounded-lg bg-muted/60 px-1.5 py-1.5">
              <p className="font-bold">{cat} yaş</p>
              <p className="text-muted-foreground">~{person} insan</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** BCS (vücut kondisyon skoru) ve ideal kilo tahmini */
function BcsCalculator() {
  const [weight, setWeight] = useState("5.2");
  const [score, setScore] = useState("7");
  const value = Number(weight.replace(",", "."));
  const scoreValue = Number(score);
  const valid = Number.isFinite(value) && value >= 0.4 && value <= 20;
  const level = BCS_LEVELS.find((item) => item.score === scoreValue) ?? BCS_LEVELS[2];
  const ideal = valid ? idealWeightEstimate(value, scoreValue) : null;

  return (
    <Card id="bcs" className="scroll-mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/20 text-emerald-700 dark:text-emerald-300">
            <Scale className="h-4 w-4" aria-hidden="true" />
          </span>
          Obezite kontrolü (BCS)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          1-9 arası vücut kondisyon skoru; 5 idealdir.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="bcs-weight">Kilo (kg)</Label>
            <Input
              id="bcs-weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0.4"
              max="20"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bcs-score">BCS puanı</Label>
            <Select
              id="bcs-score"
              value={score}
              onChange={(event) => setScore(event.target.value)}
            >
              {BCS_LEVELS.map((item) => (
                <option key={item.score} value={item.score}>
                  {item.score} · {item.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div
          className={`rounded-xl p-3.5 ${
            level.tone === "success"
              ? "bg-accent/15"
              : level.tone === "warning"
                ? "bg-amber-500/10"
                : "bg-destructive/10"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-extrabold">{level.label}</p>
            <Badge variant={level.tone === "success" ? "success" : level.tone === "warning" ? "secondary" : "destructive"}>
              BCS {level.score}
            </Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {level.description}
          </p>
          {ideal ? (
            <p className="mt-2 text-xs font-semibold">
              Tahmini ideal kilo: ~{ideal.toLocaleString("tr-TR")} kg. Hedefe
              veteriner gözetiminde, yavaş ilerleyin.
            </p>
          ) : (
            <p className="mt-2 text-xs font-semibold">
              {scoreValue <= 5
                ? "Kilo ideal aralıkta görünüyor; düzenli takip yeterli."
                : "Kilo değerlendirmesi için puanı güncelleyin."}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-1" aria-hidden="true">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
            <span
              key={item}
              className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                item === Number(score)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {item}
            </span>
          ))}
        </div>
        <FieldHint>
          Değerlendirme için kaburgaları hafifçe hissedin ve kediyi yukarıdan
          inceleyin. Obezite; diyabet, eklem ve kalp hastalığı riskini artırır.
        </FieldHint>
      </CardContent>
    </Card>
  );
}

export { PortionCalculator };

/** Hesaplayıcı bölüm başlığı */
export function CalculatorTeaser() {
  return (
    <Card className="gradient-cream">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary-strong">
          <Calculator className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="text-xs leading-relaxed text-muted-foreground">
          <p className="font-bold text-foreground">Hesaplayıcılar</p>
          <p className="mt-0.5">
            Mama porsiyonu, su ihtiyacı, yaş çevirici ve BCS kontrolü tek yerde.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
