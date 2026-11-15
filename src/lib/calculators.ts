import type { ActivityLevel, AgeGroup } from "./types";
import { clamp } from "./utils";

/** Dinlenme enerji ihtiyacı (kcal/gün) — RER = 70 × kg^0.75 */
export function restingEnergy(weightKg: number): number {
  const safe = clamp(weightKg, 0.3, 20);
  return 70 * Math.pow(safe, 0.75);
}

const AGE_FACTORS: Record<AgeGroup, number> = {
  kitten: 2.5,
  adult: 1.2,
  senior: 1.15,
};

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  low: 0.9,
  medium: 1,
  high: 1.15,
};

export interface PortionInput {
  weightKg: number;
  ageGroup: AgeGroup;
  activity: ActivityLevel;
  neutered: boolean;
  /** 100 gram mama başına kcal (kuru mama ~370, yaş mama ~90) */
  kcalPer100g?: number;
  mealsPerDay?: number;
}

export interface PortionResult {
  rer: number;
  der: number;
  gramsPerDay: number;
  gramsPerMeal: number;
  mealsPerDay: number;
  waterMinMl: number;
  waterMaxMl: number;
  factor: number;
}

/**
 * Günlük mama porsiyonu.
 * Yetişkin kısır kedilerde enerji ihtiyacı %15-20 daha düşüktür.
 */
export function calculatePortion({
  weightKg,
  ageGroup,
  activity,
  neutered,
  kcalPer100g = 370,
  mealsPerDay = 3,
}: PortionInput): PortionResult {
  const rer = restingEnergy(weightKg);
  let factor = AGE_FACTORS[ageGroup];
  if (ageGroup === "adult") {
    factor = (neutered ? 1.2 : 1.4) * ACTIVITY_FACTORS[activity];
  } else if (ageGroup === "senior") {
    factor = (neutered ? 1.1 : 1.2) * ACTIVITY_FACTORS[activity];
  }
  factor = clamp(factor, 0.9, 3);
  const der = rer * factor;
  const gramsPerDay = (der / Math.max(60, kcalPer100g)) * 100;
  const meals = clamp(Math.round(mealsPerDay), 1, 6);
  return {
    rer,
    der,
    gramsPerDay,
    gramsPerMeal: gramsPerDay / meals,
    mealsPerDay: meals,
    waterMinMl: weightKg * 40,
    waterMaxMl: weightKg * 60,
    factor,
  };
}

/** Günlük su ihtiyacı (ml) — genel kabul 40-60 ml/kg */
export function waterNeed(weightKg: number) {
  return {
    min: Math.round(clamp(weightKg, 0.3, 20) * 40),
    max: Math.round(clamp(weightKg, 0.3, 20) * 60),
    cups: Math.round((clamp(weightKg, 0.3, 20) * 50) / 200),
  };
}

export const BCS_LEVELS = [
  {
    score: 1,
    label: "Aşırı zayıf",
    description: "Kaburgalar, omurga ve kalça kemikleri belirgin; kas kaybı var.",
    tone: "destructive" as const,
  },
  {
    score: 3,
    label: "Zayıf",
    description: "Kaburgalar kolayca hissedilir, belirgin bel çizgisi.",
    tone: "warning" as const,
  },
  {
    score: 5,
    label: "İdeal",
    description: "Kaburgalar hafif basınçla hissedilir, bel çizgisi görünür.",
    tone: "success" as const,
  },
  {
    score: 7,
    label: "Kilo fazlası",
    description: "Kaburgalar zor hissedilir, bel çizgisi kaybolmuş.",
    tone: "warning" as const,
  },
  {
    score: 9,
    label: "Obez",
    description: "Kaburgalar hissedilmez, karın belirgin sarkık.",
    tone: "destructive" as const,
  },
];

/** Yaş aralığına göre önerilen öğün sayısı */
export function recommendedMeals(ageGroup: AgeGroup): number {
  if (ageGroup === "kitten") return 4;
  if (ageGroup === "senior") return 2;
  return 3;
}

/** İdeal kilo tahmini: BCS 5 için yaklaşık %10-15 düşüş hedeflenir */
export function idealWeightEstimate(currentKg: number, bcs: number): number | null {
  if (bcs < 6) return null;
  const excess = bcs >= 9 ? 0.25 : bcs >= 8 ? 0.2 : 0.1;
  return Math.round((currentKg / (1 + excess)) * 10) / 10;
}
