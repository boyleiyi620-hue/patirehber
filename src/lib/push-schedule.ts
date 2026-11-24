export interface PushReminderCandidate {
  id: string;
  type: string;
  title: string;
  time: string;
  days: number[] | null;
  enabled: boolean;
  last_completed: string | null;
  snoozed_until: number | string | null;
}

export interface PushNotificationPreferences {
  enabled: boolean;
  food: boolean;
  water: boolean;
  litter: boolean;
  health: boolean;
  quietHours: boolean;
}

export interface LocalClock {
  date: string;
  weekday: number;
  time: string;
  hour: number;
}

const WEEKDAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function localClockAt(date: Date, timeZone: string): LocalClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  const hour = Number(value("hour")) % 24;
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    weekday: WEEKDAYS[value("weekday")] ?? 0,
    time: `${String(hour).padStart(2, "0")}:${value("minute")}`,
    hour,
  };
}

function epochMilliseconds(value: number | string | null): number | null {
  if (value === null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function typeEnabled(type: string, preferences: PushNotificationPreferences): boolean {
  if (type === "food") return preferences.food;
  if (type === "water") return preferences.water;
  if (type === "litter") return preferences.litter;
  if (["medication", "parasite", "vet", "weight"].includes(type)) {
    return preferences.health;
  }
  return true;
}

export function shouldSendReminderNow(
  reminder: PushReminderCandidate,
  preferences: PushNotificationPreferences,
  clock: LocalClock,
  now: Date,
): boolean {
  if (!preferences.enabled || !reminder.enabled || !typeEnabled(reminder.type, preferences)) return false;
  if (preferences.quietHours && (clock.hour >= 22 || clock.hour < 8)) return false;
  if (reminder.time !== clock.time || !(reminder.days ?? []).includes(clock.weekday)) return false;
  if (reminder.last_completed === clock.date) return false;
  const snoozedUntil = epochMilliseconds(reminder.snoozed_until);
  if (snoozedUntil !== null && snoozedUntil > now.getTime()) return false;
  return true;
}
