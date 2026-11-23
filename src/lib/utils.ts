import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { breeds } from "./breeds";
import type {
  AppData,
  Badge,
  Cat,
  DailyLog,
  Reminder,
  ReminderType,
  Task,
} from "./types";

/** Tailwind sınıflarını güvenli biçimde birleştirir (shadcn/ui standardı) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Çakışmayacak kısa kimlik üretir */
export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* -------------------------------------------------------------------------- */
/*                                    TARİH                                   */
/* -------------------------------------------------------------------------- */

const TR_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const TR_DAYS = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

const TR_DAYS_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

/** Yerel saat dilimine göre YYYY-MM-DD anahtarı */
export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

/** YYYY-MM-DD → yerel Date (00:00) */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** "15 Kasım 2026" */
export function formatDateLong(key: string | Date): string {
  const d = typeof key === "string" ? parseDateKey(key) : key;
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "15 Kasım 2026, Pazar" */
export function formatDateWithWeekday(key: string | Date): string {
  const d = typeof key === "string" ? parseDateKey(key) : key;
  return `${formatDateLong(d)}, ${TR_DAYS[d.getDay()]}`;
}

/** "15 Kas" */
export function formatDateShort(key: string | Date): string {
  const d = typeof key === "string" ? parseDateKey(key) : key;
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** "5 dk önce" / "2 gün önce" */
export function timeAgo(isoOrKey: string): string {
  const then =
    isoOrKey.includes("T") ? new Date(isoOrKey) : parseDateKey(isoOrKey);
  const diffMs = Date.now() - then.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} gün önce`;
  return formatDateShort(then);
}

export function weekdayShort(day: number): string {
  return TR_DAYS_SHORT[day];
}

export function weekdayLong(day: number): string {
  return TR_DAYS[day];
}

/* -------------------------------------------------------------------------- */
/*                                    YAŞ                                     */
/* -------------------------------------------------------------------------- */

export interface CatAge {
  years: number;
  months: number;
  totalMonths: number;
  label: string;
  group: "kitten" | "adult" | "senior";
}

/** Doğum tarihinden yaş bilgisi üretir */
export function getCatAge(birthDate: string): CatAge {
  const birth = parseDateKey(birthDate);
  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  months = Math.max(0, months);
  const years = Math.floor(months / 12);
  const restMonths = months % 12;

  let label: string;
  if (months < 1) label = "Yeni doğan";
  else if (years < 1) label = `${months} aylık`;
  else if (restMonths === 0) label = `${years} yaşında`;
  else label = `${years} yaş ${restMonths} ay`;

  return {
    years,
    months,
    totalMonths: months,
    label,
    group: months < 12 ? "kitten" : years < 8 ? "adult" : "senior",
  };
}

/**
 * Kedi yaşı → insan yaşı (AAFP yaklaşımı)
 * İlk yıl ≈ 15, ikinci yıl ≈ +9, sonrası yılda ≈ +4 insan yılı.
 */
export function catToHumanAge(catYears: number): number {
  if (catYears <= 0) return 0;
  if (catYears < 1) return Math.round(15 * catYears);
  if (catYears < 2) return Math.round(15 + 9 * (catYears - 1));
  return Math.round(24 + 4 * (catYears - 2));
}

/* -------------------------------------------------------------------------- */
/*                                  IRKLAR                                    */
/* -------------------------------------------------------------------------- */

export function getBreed(breedId: string) {
  return breeds.find((b) => b.id === breedId);
}

export function breedName(breedId: string): string {
  return getBreed(breedId)?.name ?? "Melez / Tekir";
}

/* -------------------------------------------------------------------------- */
/*                              HATIRLATICILAR                                */
/* -------------------------------------------------------------------------- */

export const REMINDER_META: Record<
  ReminderType,
  { label: string; emoji: string; hint: string; tone: string }
> = {
  food: {
    label: "Mama",
    emoji: "🍽️",
    hint: "Öğün saati",
    tone: "bg-primary/10 text-primary-strong",
  },
  water: {
    label: "Su",
    emoji: "💧",
    hint: "Su kabını tazele",
    tone: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  },
  litter: {
    label: "Kum",
    emoji: "🧹",
    hint: "Kum kabını temizle",
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  },
  medication: {
    label: "İlaç / Vitamin",
    emoji: "💊",
    hint: "İlaç veya takviye",
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
  },
  parasite: {
    label: "Pire / Parazit",
    emoji: "🐛",
    hint: "Damla ve parazit tedavisi",
    tone: "bg-lime-500/10 text-lime-700 dark:text-lime-300",
  },
  vet: {
    label: "Veteriner",
    emoji: "🏥",
    hint: "Aşı ve kontrol randevusu",
    tone: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  },
  weight: {
    label: "Kilo",
    emoji: "⚖️",
    hint: "Kilo ölçümü",
    tone: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  },
  play: {
    label: "Oyun",
    emoji: "🎾",
    hint: "Birlikte oyun zamanı",
    tone: "bg-accent/20 text-emerald-700 dark:text-emerald-300",
  },
  special: {
    label: "Özel gün",
    emoji: "🎉",
    hint: "Doğum günü / yıl dönümü",
    tone: "bg-pink-500/10 text-pink-600 dark:text-pink-300",
  },
};

export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]; // Pazartesi → Pazar

/** Hatırlatıcı bugün geçerli mi? */
export function isReminderDueOn(reminder: Reminder, date: Date): boolean {
  return reminder.days.includes(date.getDay());
}

/** Bugün tamamlandı mı? */
export function isCompletedToday(reminder: Reminder): boolean {
  return reminder.lastCompleted === todayKey();
}

/** Hatırlatıcı belirli bir tarihte tamamlandı mı? */
export function isReminderCompletedOn(reminder: Reminder, date: string): boolean {
  return reminder.lastCompleted === date || reminder.history.includes(date);
}

/**
 * Bir sonraki gerçekleşme zamanı.
 * Bugün saati geçmişse bir sonraki uygun güne atlar.
 */
export function nextReminderDate(reminder: Reminder, from = new Date()): Date | null {
  if (reminder.days.length === 0) return null;
  const [h, m] = reminder.time.split(":").map(Number);
  for (let i = 0; i < 8; i += 1) {
    const day = addDays(from, i);
    if (!isReminderDueOn(reminder, day)) continue;
    const candidate = new Date(day);
    candidate.setHours(h || 0, m || 0, 0, 0);
    if (candidate.getTime() >= from.getTime() - 60_000) return candidate;
    if (i === 0 && isCompletedToday(reminder)) continue;
  }
  // Bugünün saati geçmiş olsa da listede görünsün
  const fallbackDay = addDays(from, 1);
  for (let i = 1; i < 8; i += 1) {
    const day = addDays(from, i);
    if (isReminderDueOn(reminder, day)) {
      const candidate = new Date(day);
      candidate.setHours(h || 0, m || 0, 0, 0);
      return candidate;
    }
  }
  return fallbackDay ? null : null;
}

/** "Bugün 08:00" · "Yarın 19:00" · "Cuma 09:00" */
export function formatOccurrence(date: Date): string {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const time = `${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}`;
  if (dateKey(date) === dateKey(today)) return `Bugün ${time}`;
  if (dateKey(date) === dateKey(tomorrow)) return `Yarın ${time}`;
  return `${TR_DAYS[date.getDay()]} ${time}`;
}

export function formatTimeRange(time: string): string {
  const [h, m] = time.split(":");
  const hour = Number(h);
  const suffix = hour < 6 ? "gece" : hour < 12 ? "sabah" : hour < 18 ? "öğleden sonra" : "akşam";
  return `${h}:${m} · ${suffix}`;
}

/** Hatırlatıcının günlerini okunur biçime çevirir */
export function describeDays(days: number[]): string {
  if (days.length === 7) return "Her gün";
  if (days.length === 0) return "Gün seçilmedi";
  const sorted = [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (
    sorted.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => sorted.includes(d))
  ) {
    return "Hafta içi";
  }
  if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) {
    return "Hafta sonu";
  }
  return sorted.map((d) => TR_DAYS_SHORT[d]).join(", ");
}

/* -------------------------------------------------------------------------- */
/*                              GÜNLÜK KAYITLAR                               */
/* -------------------------------------------------------------------------- */

export function emptyLog(date: string, catId: string): DailyLog {
  return {
    id: `${date}:${catId}`,
    date,
    catId,
    mealsGiven: 0,
    waterChanged: false,
    litterCleaned: false,
    playMinutes: 0,
  };
}

export function findLog(
  logs: DailyLog[],
  catId: string,
  date = todayKey(),
): DailyLog | undefined {
  return logs.find((l) => l.catId === catId && l.date === date);
}

/** Görevin belirtilen gündeki ilerlemesi; eski kayıtlar bugüne uyarlanır. */
export function taskProgressOn(task: Task, date: string): number {
  const entry = task.progressByDate?.find((item) => item.date === date);
  if (entry) return Math.min(task.target, entry.progress);
  if (task.completedAt && dateKey(new Date(task.completedAt)) === date) {
    return Math.min(task.target, task.progress);
  }
  return date === todayKey() ? Math.min(task.target, task.progress) : 0;
}

/** Görev o gün tamamlandı mı? */
export function taskCompletedOn(task: Task, date: string): boolean {
  const entry = task.progressByDate?.find((item) => item.date === date);
  if (entry) return Boolean(entry.completedAt) || entry.progress >= task.target;
  return Boolean(
    task.completedAt &&
      dateKey(new Date(task.completedAt)) === date &&
      task.progress >= task.target,
  );
}

/** 0-100 arası günlük bakım puanı */
export function dayScore(log: DailyLog | undefined, mealsTarget: number): number {
  if (!log) return 0;
  const meals = Math.min(1, log.mealsGiven / Math.max(1, mealsTarget)) * 45;
  const water = log.waterChanged ? 20 : 0;
  const litter = log.litterCleaned ? 20 : 0;
  const play = log.playMinutes >= 15 ? 15 : log.playMinutes > 0 ? 8 : 0;
  return Math.round(meals + water + litter + play);
}

/** Bir kedi için son N günün serisi (grafikler ve raporlar) */
export function buildSeries(
  logs: DailyLog[],
  catId: string,
  mealsTarget: number,
  days = 7,
  throughDate = todayKey(),
) {
  const endDate = parseDateKey(throughDate);
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(endDate, -(days - 1 - index));
    const key = dateKey(date);
    const log = logs.find((l) => l.catId === catId && l.date === key);
    return {
      date: key,
      dayLabel: TR_DAYS_SHORT[date.getDay()],
      dayLong: TR_DAYS[date.getDay()],
      meals: log?.mealsGiven ?? 0,
      water: log?.waterChanged ?? false,
      litter: log?.litterCleaned ?? false,
      play: log?.playMinutes ?? 0,
      score: dayScore(log, mealsTarget),
      hasLog: Boolean(log),
    };
  });
}

/**
 * Üst üste bakım günü serisi.
 * Gün "tam" sayılır: mama hedefi tamam + su + kum (puan ≥ 80).
 */
export function computeStreak(
  logs: DailyLog[],
  catId: string,
  mealsTarget: number,
  throughDate = todayKey(),
): number {
  const map = new Map(logs.filter((l) => l.catId === catId).map((l) => [l.date, l]));
  const base = parseDateKey(throughDate);
  const selectedDay = map.get(dateKey(base));
  // Seçilen gün henüz tamamlanmadıysa bir önceki günden saymaya başla.
  if (!selectedDay || dayScore(selectedDay, mealsTarget) < 80) {
    base.setDate(base.getDate() - 1);
  }
  let streak = 0;
  for (let i = 0; i < 366; i += 1) {
    const key = dateKey(base);
    const log = map.get(key);
    if (log && dayScore(log, mealsTarget) >= 80) {
      streak += 1;
      base.setDate(base.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/** Tüm kedilerde en iyi aktif seri */
export function bestStreak(data: AppData): number {
  return data.cats.reduce(
    (max, cat) =>
      Math.max(max, computeStreak(data.logs, cat.id, data.settings.mealsPerDay)),
    0,
  );
}

/** Son 7 günün toplamları */
export function weekSummary(logs: DailyLog[], catId: string, mealsTarget: number) {
  const series = buildSeries(logs, catId, mealsTarget, 7);
  return {
    series,
    meals: series.reduce((s, d) => s + d.meals, 0),
    waterDays: series.filter((d) => d.water).length,
    litterDays: series.filter((d) => d.litter).length,
    playMinutes: series.reduce((s, d) => s + d.play, 0),
    avgScore: Math.round(
      series.reduce((s, d) => s + d.score, 0) / Math.max(1, series.length),
    ),
  };
}

/* -------------------------------------------------------------------------- */
/*                                ROZETLER                                    */
/* -------------------------------------------------------------------------- */

export function computeBadges(data: AppData): Badge[] {
  const totalMeals = data.logs.reduce((sum, l) => sum + l.mealsGiven, 0);
  const totalWeights = data.cats.reduce(
    (sum, c) => sum + c.weightHistory.length,
    0,
  );
  const totalVaccines = data.cats.reduce(
    (sum, c) => sum + c.vaccinations.length,
    0,
  );
  const streak = bestStreak(data);
  const maxReminderStreak = data.reminders.reduce(
    (max, r) => Math.max(max, r.streak),
    0,
  );
  const hasPhoto = data.cats.some((c) => Boolean(c.photo));

  const raw: Omit<Badge, "earned">[] = [
    {
      id: "first-cat",
      title: "İlk Pati",
      description: "İlk kedi profilini oluştur.",
      emoji: "🐾",
      progress: { current: Math.min(data.cats.length, 1), target: 1 },
    },
    {
      id: "duo",
      title: "İki Kuyruk",
      description: "İkinci kediyi ekle.",
      emoji: "🐈‍⬛",
      progress: { current: Math.min(data.cats.length, 2), target: 2 },
    },
    {
      id: "streak-3",
      title: "3 Gün Üst Üste",
      description: "3 gün boyunca tam bakım yap.",
      emoji: "🔥",
      progress: { current: Math.min(streak, 3), target: 3 },
    },
    {
      id: "streak-7",
      title: "Haftalık Kahraman",
      description: "7 günlük bakım serisi yakala.",
      emoji: "🏅",
      progress: { current: Math.min(streak, 7), target: 7 },
    },
    {
      id: "streak-30",
      title: "Pati Ustası",
      description: "30 günlük bakım serisi yakala.",
      emoji: "👑",
      progress: { current: Math.min(streak, 30), target: 30 },
    },
    {
      id: "photo",
      title: "Fotojenik",
      description: "Kedine bir profil fotoğrafı ekle.",
      emoji: "📸",
      progress: { current: hasPhoto ? 1 : 0, target: 1 },
    },
    {
      id: "meals-100",
      title: "100 Öğün",
      description: "Toplam 100 öğün kaydı oluştur.",
      emoji: "🍽️",
      progress: { current: Math.min(totalMeals, 100), target: 100 },
    },
    {
      id: "vaccine",
      title: "Aşı Takipçisi",
      description: "3 aşı kaydı ekle.",
      emoji: "💉",
      progress: { current: Math.min(totalVaccines, 3), target: 3 },
    },
    {
      id: "scale",
      title: "Kilo Takibi",
      description: "5 kilo ölçümü kaydet.",
      emoji: "⚖️",
      progress: { current: Math.min(totalWeights, 5), target: 5 },
    },
    {
      id: "reminder",
      title: "Düzenli Pati",
      description: "Bir hatırlatıcıda 7 günlük seri yap.",
      emoji: "⏰",
      progress: { current: Math.min(maxReminderStreak, 7), target: 7 },
    },
  ];

  return raw.map((badge) => ({
    ...badge,
    earned: (badge.progress?.current ?? 0) >= (badge.progress?.target ?? 1),
  }));
}

/** Bakım puanına göre kısa motivasyon mesajı */
export function scoreMessage(score: number): string {
  if (score >= 90) return "Mükemmel! Patiler mutlu 🐾";
  if (score >= 70) return "Harika gidiyorsun, bugün neredeyse tamam!";
  if (score >= 40) return "İyi başlangıç — birkaç görev daha kaldı.";
  if (score > 0) return "Bugün henüz başladın, küçük adımlarla devam!";
  return "Bugünün ilk görevini tamamlayarak başla.";
}

/* -------------------------------------------------------------------------- */
/*                                  YARDIMCI                                  */
/* -------------------------------------------------------------------------- */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function activeCat(data: AppData | null): Cat | null {
  if (!data || data.cats.length === 0) return null;
  return (
    data.cats.find((c) => c.id === data.settings.activeCatId) ?? data.cats[0]
  );
}

/** JSON dosyası indirir (veri dışa aktarma) */
export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

/** İlk açılış tarihine göre kullanıcıya hitap */
export function greetingForHour(hour = new Date().getHours()): string {
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}
