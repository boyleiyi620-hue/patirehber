import type {
  AppData,
  Cat,
  DailyLog,
  Reminder,
  ReminderType,
  Settings,
  HealthEntry,
  GuideChecklistEntry,
  Task,
  TaskKind,
} from "./types";
import { defaultSettings } from "./demo-data";
import { dateKey, guideChecklistEntryId, parseDateKey, todayKey, uid } from "./utils";

export const STORAGE_KEY = "patirehber:data:v1";
export const DATA_VERSION = 2;

const REMINDER_TYPES: ReminderType[] = [
  "food",
  "water",
  "litter",
  "medication",
  "parasite",
  "vet",
  "weight",
  "play",
  "special",
];

const TASK_KINDS: TaskKind[] = [
  "food",
  "water",
  "litter",
  "play",
  "medication",
  "grooming",
  "vet",
  "custom",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asDateKey(value: unknown, fallback = todayKey()): string {
  const raw = asString(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : fallback;
}

/** Tek bir kedi kaydını güvenli biçimde normalize eder */
function normalizeCat(raw: unknown): Cat | null {
  if (!isRecord(raw)) return null;
  const name = asString(raw.name).trim().slice(0, 60);
  if (!name) return null;

  const weightHistory = Array.isArray(raw.weightHistory)
    ? raw.weightHistory
        .filter(isRecord)
        .map((entry) => ({
          id: asString(entry.id) || uid("w"),
          date: asDateKey(entry.date),
          kg: Math.max(0, asNumber(entry.kg)),
        }))
        .filter((entry) => entry.kg > 0)
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const vaccinations = Array.isArray(raw.vaccinations)
    ? raw.vaccinations
        .filter(isRecord)
        .map((entry) => ({
          id: asString(entry.id) || uid("v"),
          name: asString(entry.name).trim() || "Aşı",
          date: asDateKey(entry.date),
          nextDate: entry.nextDate ? asDateKey(entry.nextDate) : undefined,
        }))
    : [];

  const vetRaw = isRecord(raw.vet) ? raw.vet : null;
  const vet = vetRaw
    ? {
        name: asString(vetRaw.name),
        clinic: asString(vetRaw.clinic),
        phone: asString(vetRaw.phone),
        address: asString(vetRaw.address).slice(0, 200) || undefined,
      }
    : undefined;

  return {
    id: asString(raw.id) || uid("cat"),
    name,
    breedId: asString(raw.breedId, "tekir") || "tekir",
    birthDate: asDateKey(raw.birthDate, dateKey(new Date(2022, 0, 1))),
    gender: raw.gender === "male" ? "male" : "female",
    weight: Math.max(0, asNumber(raw.weight, 4)),
    neutered: asBoolean(raw.neutered),
    activity:
      raw.activity === "low" || raw.activity === "high"
        ? raw.activity
        : "medium",
    photo: asString(raw.photo) || undefined,
    gallery: Array.isArray(raw.gallery)
      ? raw.gallery.filter((item): item is string => typeof item === "string").slice(0, 12)
      : [],
    healthNotes: asString(raw.healthNotes).slice(0, 4000),
    notes: asString(raw.notes).slice(0, 4000),
    vaccinations,
    weightHistory,
    vet,
    adoptedAt: raw.adoptedAt ? asDateKey(raw.adoptedAt) : undefined,
    color: asString(raw.color).slice(0, 60) || undefined,
    microchip: asString(raw.microchip).slice(0, 40) || undefined,
    insurance: asString(raw.insurance).slice(0, 120) || undefined,
    allergies: asString(raw.allergies).slice(0, 500) || undefined,
    medications: asString(raw.medications).slice(0, 500) || undefined,
    createdAt: asString(raw.createdAt, new Date().toISOString()),
  };
}

/** Tek bir görev kaydını normalize eder */
function normalizeTask(raw: unknown, catIds: string[]): Task | null {
  if (!isRecord(raw)) return null;
  const title = asString(raw.title).trim().slice(0, 80);
  if (!title) return null;
  const kind = TASK_KINDS.includes(raw.kind as TaskKind)
    ? (raw.kind as TaskKind)
    : "custom";
  const target = Math.min(10, Math.max(1, Math.floor(asNumber(raw.target, 1))));
  const progress = Math.min(target, Math.max(0, Math.floor(asNumber(raw.progress, 0))));
  const progressByDate = Array.isArray(raw.progressByDate)
    ? raw.progressByDate.filter(isRecord).map((entry) => ({
        date: asDateKey(entry.date),
        progress: Math.min(target, Math.max(0, Math.floor(asNumber(entry.progress)))),
        completedAt: entry.completedAt ? asString(entry.completedAt) : undefined,
      }))
    : undefined;
  const catId = asString(raw.catId);
  const completedAt = raw.completedAt ? asString(raw.completedAt) : undefined;
  // Tamamlanmış sayılan: progress >= target (completedAt de set edilmiş olmalı)
  let completed = completedAt;
  if (progress >= target && !completed) completed = new Date().toISOString();
  let prog = progress;
  if (completed && prog < target) prog = target;
  return {
    id: asString(raw.id) || uid("task"),
    catId: catIds.includes(catId) ? catId : null,
    title,
    emoji: asString(raw.emoji).trim().slice(0, 4) || "✅",
    kind,
    target,
    progress: prog,
    progressByDate,
    note: asString(raw.note).slice(0, 500) || undefined,
    repeat:
      raw.repeat === "daily" || raw.repeat === "weekly" ? raw.repeat : "none",
    priority:
      raw.priority === "low" || raw.priority === "high" ? raw.priority : "medium",
    dueDate: raw.dueDate ? asDateKey(raw.dueDate) : undefined,
    createdAt: asString(raw.createdAt, new Date().toISOString()),
    completedAt: completed,
  };
}

function normalizeReminder(raw: unknown, catIds: string[]): Reminder | null {
  if (!isRecord(raw)) return null;
  const type = REMINDER_TYPES.includes(raw.type as ReminderType)
    ? (raw.type as ReminderType)
    : "food";
  const time = /^\d{2}:\d{2}$/.test(asString(raw.time))
    ? asString(raw.time)
    : "09:00";
  const days = Array.isArray(raw.days)
    ? raw.days
        .map((d) => asNumber(d, -1))
        .filter((d) => d >= 0 && d <= 6)
    : [0, 1, 2, 3, 4, 5, 6];
  const catId = asString(raw.catId);

  return {
    id: asString(raw.id) || uid("rem"),
    catId: catIds.includes(catId) ? catId : null,
    type,
    title: asString(raw.title).trim().slice(0, 80) || "Hatırlatıcı",
    time,
    days: days.length ? Array.from(new Set(days)) : [0, 1, 2, 3, 4, 5, 6],
    enabled: asBoolean(raw.enabled, true),
    lastCompleted: raw.lastCompleted
      ? asDateKey(raw.lastCompleted)
      : undefined,
    streak: Math.max(0, Math.floor(asNumber(raw.streak))),
    history: Array.isArray(raw.history)
      ? raw.history
          .filter((item): item is string => typeof item === "string")
          .slice()
      : [],
    note: asString(raw.note).slice(0, 500) || undefined,
    snoozedUntil:
      typeof raw.snoozedUntil === "number" ? raw.snoozedUntil : undefined,
  };
}

function normalizeLog(raw: unknown, catIds: string[]): DailyLog | null {
  if (!isRecord(raw)) return null;
  const catId = asString(raw.catId);
  if (!catIds.includes(catId)) return null;
  const date = asDateKey(raw.date);
  return {
    id: asString(raw.id) || `${date}:${catId}`,
    date,
    catId,
    mealsGiven: Math.max(0, Math.floor(asNumber(raw.mealsGiven))),
    waterChanged: asBoolean(raw.waterChanged),
    litterCleaned: asBoolean(raw.litterCleaned),
    playMinutes: Math.max(0, Math.floor(asNumber(raw.playMinutes))),
    note: asString(raw.note).slice(0, 500) || undefined,
  };
}


/** Tek bir sağlık günlüğü kaydını normalize eder */
function normalizeHealthEntry(raw: unknown, catIds: string[]): HealthEntry | null {
  if (!isRecord(raw)) return null;
  const catId = asString(raw.catId);
  if (!catIds.includes(catId)) return null;
  const title = asString(raw.title).trim().slice(0, 120);
  if (!title) return null;
  const type =
    raw.type === "symptom" || raw.type === "vet-visit" || raw.type === "medication"
      ? raw.type
      : "note";
  return {
    id: asString(raw.id) || uid("health"),
    catId,
    date: asDateKey(raw.date),
    type,
    title,
    note: asString(raw.note).slice(0, 1000) || undefined,
    createdAt: asString(raw.createdAt, new Date().toISOString()),
  };
}

/**
 * LocalStorage veya içe aktarılan JSON'u doğrular ve eksik alanları tamamlar.
 * Geçersiz veri için null döner.
 */
export function normalizeData(raw: unknown): AppData | null {
  if (!isRecord(raw)) return null;

  const settingsRaw = isRecord(raw.settings) ? raw.settings : {};
  const defaults = defaultSettings();
  const notificationsRaw = isRecord(settingsRaw.notifications)
    ? settingsRaw.notifications
    : {};

  if (!Array.isArray(raw.cats)) return null;

  const cats = raw.cats
    .map(normalizeCat)
    .filter((cat): cat is Cat => cat !== null);

  // Aynı id'ye sahip kopyaları temizle
  const seen = new Set<string>();
  const uniqueCats = cats.filter((cat) => {
    if (seen.has(cat.id)) return false;
    seen.add(cat.id);
    return true;
  });
  const catIds = uniqueCats.map((cat) => cat.id);

  const reminders = Array.isArray(raw.reminders)
    ? raw.reminders
        .map((r) => normalizeReminder(r, catIds))
        .filter((r): r is Reminder => r !== null)
    : [];

  const logs = Array.isArray(raw.logs)
    ? raw.logs
        .map((l) => normalizeLog(l, catIds))
        .filter((l): l is DailyLog => l !== null)
    : [];

  const tasks = Array.isArray(raw.tasks)
    ? raw.tasks
        .map((t) => normalizeTask(t, catIds))
        .filter((t): t is Task => t !== null)
    : [];

  const healthEntries = Array.isArray(raw.healthEntries)
    ? raw.healthEntries
        .map((h) => normalizeHealthEntry(h, catIds))
        .filter((h): h is HealthEntry => h !== null)
    : [];

  const guideChecklistEntries = Array.isArray(raw.guideChecklistEntries)
    ? Array.from(
        new Map(
          raw.guideChecklistEntries
            .filter(isRecord)
            .map((entry) => {
              const catId = asString(entry.catId);
              const date = asString(entry.date);
              const sectionId = asString(entry.sectionId).trim().slice(0, 160);
              const itemId = asString(entry.itemId).trim().slice(0, 240);
              if (
                !catIds.includes(catId) ||
                !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
                dateKey(parseDateKey(date)) !== date ||
                !sectionId ||
                !itemId
              ) return null;
              const normalized: GuideChecklistEntry = {
                id: guideChecklistEntryId(catId, date, sectionId, itemId),
                catId,
                date,
                sectionId,
                itemId,
              };
              return [normalized.id, normalized] as const;
            })
            .filter((entry): entry is readonly [string, GuideChecklistEntry] => entry !== null),
        ).values(),
      )
    : [];

  const activeCatId = asString(settingsRaw.activeCatId);
  const settings: Settings = {
    theme:
      settingsRaw.theme === "light" || settingsRaw.theme === "dark"
        ? settingsRaw.theme
        : "system",
    language: settingsRaw.language === "en" ? "en" : "tr",
    userName: asString(settingsRaw.userName, defaults.userName).slice(0, 40),
    activeCatId: catIds.includes(activeCatId)
      ? activeCatId
      : (catIds[0] ?? null),
    mealsPerDay: Math.min(6, Math.max(1, Math.floor(asNumber(settingsRaw.mealsPerDay, 3)))),
    dailyPortionGrams: Math.max(
      10,
      Math.min(400, Math.floor(asNumber(settingsRaw.dailyPortionGrams, 55))),
    ),
    notifications: {
      enabled: asBoolean(notificationsRaw.enabled),
      food: asBoolean(notificationsRaw.food, true),
      water: asBoolean(notificationsRaw.water, true),
      litter: asBoolean(notificationsRaw.litter, true),
      health: asBoolean(notificationsRaw.health, true),
      quietHours: asBoolean(notificationsRaw.quietHours, true),
    },
    onboarded: asBoolean(settingsRaw.onboarded),
    installDismissed: asBoolean(settingsRaw.installDismissed),
    guideFavorites: Array.isArray(settingsRaw.guideFavorites)
      ? settingsRaw.guideFavorites
          .filter((item): item is string => typeof item === "string")
          .slice(0, 200)
      : [],
  };

  const metaRaw = isRecord(raw.meta) ? raw.meta : {};

  return {
    version: DATA_VERSION,
    settings,
    cats: uniqueCats,
    reminders,
    logs,
    tasks,
    healthEntries,
    guideChecklistEntries,
    meta: {
      createdAt: asString(metaRaw.createdAt, new Date().toISOString()),
      lastOpenedAt: new Date().toISOString(),
    },
  };
}

/** LocalStorage'dan veri okur. Veri yoksa veya bozuksa null döner. */
export function loadData(): { data: AppData | null; corrupt: boolean } {
  if (typeof window === "undefined") return { data: null, corrupt: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: null, corrupt: false };
    const parsed: unknown = JSON.parse(raw);
    const data = normalizeData(parsed);
    return { data, corrupt: data === null };
  } catch {
    return { data: null, corrupt: true };
  }
}

/** Veriyi LocalStorage'a yazar. Kota/izin hatalarını çağırana bildirir. */
export function saveData(data: AppData): { ok: boolean; error?: string } {
  if (typeof window === "undefined") return { ok: false, error: "Tarayıcı ortamı yok" };
  try {
    const payload = JSON.stringify({ ...data, version: DATA_VERSION });
    window.localStorage.setItem(STORAGE_KEY, payload);
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof DOMException && error.name === "QuotaExceededError"
        ? "Depolama alanı doldu. Bazı fotoğrafları silmeyi deneyin."
        : "Veriler kaydedilemedi. Tarayıcı depolama izinlerini kontrol edin.";
    return { ok: false, error: message };
  }
}

export function clearStoredData(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* sessizce yut — kullanıcıya reset akışında bilgi verilir */
  }
}

/** İçe aktarılan JSON metnini doğrular */
export function parseImportedData(text: string): AppData | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return normalizeData(parsed);
  } catch {
    return null;
  }
}
