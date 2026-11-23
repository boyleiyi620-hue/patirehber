"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AppData,
  Cat,
  DailyLog,
  HealthEntry,
  Language,
  Reminder,
  ReminderType,
  Settings,
  Task,
  TaskKind,
  Vaccination,
  WeightEntry,
} from "@/lib/types";
import { defaultSettings } from "@/lib/demo-data";
import { defaultRemindersForCat } from "@/lib/reminders";
import { clearStoredData, loadData, saveData } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { loadUserData, saveUserData } from "@/lib/supabase/sync";
import { translate } from "@/lib/i18n";
import {
  addDays,
  dateKey,
  emptyLog,
  findLog,
  parseDateKey,
  taskCompletedOn,
  taskProgressOn,
  todayKey,
  uid,
} from "@/lib/utils";

export type AppStatus = "loading" | "ready" | "error";

export type NewReminderInput = {
  catId: string | null;
  type: ReminderType;
  title: string;
  time: string;
  days: number[];
  note?: string;
  enabled?: boolean;
};

export type NewTaskInput = {
  catId: string | null;
  title: string;
  emoji?: string;
  kind?: TaskKind;
  target?: number;
  note?: string;
  repeat?: "none" | "daily" | "weekly";
  priority?: "low" | "medium" | "high";
  dueDate?: string;
};

type TodayPatch = Partial<
  Pick<DailyLog, "mealsGiven" | "waterChanged" | "litterCleaned" | "playMinutes">
>;

interface AppContextValue {
  status: AppStatus;
  data: AppData | null;
  user: any;
  cats: Cat[];
  reminders: Reminder[];
  logs: DailyLog[];
  tasks: Task[];
  healthEntries: HealthEntry[];
  settings: Settings;
  activeCat: Cat | null;
  activeCatId: string | null;
  activeDate: string;
  isHistoricalDate: boolean;
  setActiveDate: (date: string) => void;
  returnToToday: () => void;
  todayLog: DailyLog | undefined;
  lang: Language;
  error: string | null;
  storageError: string | null;
  syncError: string | null;
  toast: string | null;
  t: (key: string) => string;

  // Genel
  notify: (message: string) => void;
  dismissToast: () => void;
  dismissStorageError: () => void;
  retry: () => void;
  retrySync: () => void;

  // Ayarlar & kedi
  updateSettings: (patch: Partial<Settings>) => void;
  setActiveCat: (catId: string) => void;
  addCat: (cat: Cat) => void;
  updateCat: (catId: string, patch: Partial<Cat>) => void;
  deleteCat: (catId: string) => void;
  addWeight: (catId: string, kg: number, date?: string) => void;
  deleteWeight: (catId: string, entryId: string) => void;
  addVaccination: (catId: string, vaccination: Omit<Vaccination, "id">) => void;
  deleteVaccination: (catId: string, vaccinationId: string) => void;
  addGalleryPhoto: (catId: string, photo: string) => void;
  removeGalleryPhoto: (catId: string, index: number) => void;

  // Günlük bakım
  updateTodayLog: (patch: TodayPatch, catId?: string) => void;
  addMeal: () => void;
  undoMeal: () => void;
  toggleWater: () => void;
  toggleLitter: () => void;
  addPlay: (minutes: number) => void;

  // Hatırlatıcılar
  addReminder: (input: NewReminderInput) => string | null;
  updateReminder: (id: string, patch: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  completeReminder: (id: string) => void;
  snoozeReminder: (id: string, minutes?: number) => void;

  // Görevler
  addTask: (input: NewTaskInput) => string | null;
  tapTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  undoTask: (id: string) => void;
  purgeExpiredTasks: () => void;

  // Sağlık günlüğü
  addHealthEntry: (entry: Omit<HealthEntry, "id" | "createdAt">) => void;
  deleteHealthEntry: (id: string) => void;

  // Veri yönetimi
  importData: (data: AppData) => void;
  resetData: (mode: "demo" | "empty") => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const DEFAULT_SETTINGS = defaultSettings();

/** Günlük kaydı oluşturur veya günceller */
function upsertLog(
  logs: DailyLog[],
  catId: string,
  patch: TodayPatch,
  key: string,
): DailyLog[] {
  const existing = logs.find((log) => log.date === key && log.catId === catId);
  if (existing) {
    return logs.map((log) =>
      log.id === existing.id ? { ...log, ...patch } : log,
    );
  }
  return [...logs, { ...emptyLog(key, catId), ...patch }];
}

/** Takvim geçmişini koru; çalışma tarihi eski olsa bile kayıt silinmesin. */
function preserveLogs(logs: DailyLog[]): DailyLog[] {
  return logs;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [activeDate, setActiveDateState] = useState(todayKey);
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<AppStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncQueue = useRef<Promise<void>>(Promise.resolve());

  /* ------------------------------ İlk yükleme (Supabase) ------------------- */
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(u);
      if (!u) {
        // Not logged in; middleware redirects to /auth. Stay loading-ish but ready with null.
        setStatus("ready");
        return;
      }
      try {
        const remote = await loadUserData(u.id);
        if (cancelled) return;
        if (remote) {
          setData(remote);
        } else {
          // New user: empty data (onboarding will create first cat)
          const emptySettings = defaultSettings();
          setData({
            version: 2,
            settings: emptySettings,
            cats: [],
            reminders: [],
            logs: [],
            tasks: [],
            healthEntries: [],
            meta: { createdAt: new Date().toISOString(), lastOpenedAt: new Date().toISOString() },
          });
        }
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error
          ? `Veriler yüklenemedi. İnternet bağlantınızı kontrol edin. (${e.message})`
          : "Veriler yüklenemedi. İnternet bağlantınızı kontrol edin.");
        setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ----------------------------- Oturum değişimi ---------------------------- */
  useEffect(() => {
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setData(null);
        setSyncError(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  /* ----------------------------- Otomatik kayıt ---------------------------- */
  useEffect(() => {
    if (status !== "ready" || !data) return;
    const result = saveData(data);
    setStorageError(result.ok ? null : (result.error ?? "Veri kaydedilemedi."));
  }, [data, status, user]);

  /* --------------------------- Güvenli bulut eşitleme ---------------------- */
  useEffect(() => {
    if (status !== "ready" || !data || !user) return;
    const snapshot = data;
    let active = true;
    syncQueue.current = syncQueue.current
      .catch(() => undefined)
      .then(() => saveUserData(user.id, snapshot))
      .then(() => {
        if (active) setSyncError(null);
      })
      .catch((e) => {
        if (active) {
          setSyncError(e instanceof Error ? e.message : "Bilinmeyen eşitleme hatası.");
        }
      });
    return () => { active = false; };
  }, [data, status, user, syncGeneration]);

  /* --------------------------------- Tema --------------------------------- */
  const themeMode = data?.settings.theme;
  useEffect(() => {
    if (typeof window === "undefined" || !themeMode) return;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const dark = themeMode === "dark" || (themeMode === "system" && media.matches);
      root.classList.toggle("dark", dark);
      root.style.colorScheme = dark ? "dark" : "light";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", dark ? "#12100E" : "#FAF6F1");
    };

    apply();
    if (themeMode === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, [themeMode]);

  /* -------------------------------- Yardımcı ------------------------------- */
  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const dismissToast = useCallback(() => setToast(null), []);
  const dismissStorageError = useCallback(() => setStorageError(null), []);

  const setActiveDate = useCallback((date: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    if (dateKey(parseDateKey(date)) !== date || date > todayKey()) return;
    setActiveDateState(date);
  }, []);

  const returnToToday = useCallback(() => setActiveDateState(todayKey()), []);

  const retry = useCallback(() => {
    if (typeof window !== "undefined") window.location.reload();
  }, []);

  const retrySync = useCallback(() => setSyncGeneration((generation) => generation + 1), []);

  const updater = useCallback(
    (fn: (prev: AppData) => AppData) => {
      setData((prev) => (prev ? fn(prev) : prev));
    },
    [],
  );

  /* -------------------------------- Ayarlar -------------------------------- */
  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      updater((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...patch,
          notifications: patch.notifications
            ? { ...prev.settings.notifications, ...patch.notifications }
            : prev.settings.notifications,
        },
      }));
    },
    [updater],
  );

  const setActiveCat = useCallback(
    (catId: string) => {
      updater((prev) =>
        prev.cats.some((cat) => cat.id === catId)
          ? { ...prev, settings: { ...prev.settings, activeCatId: catId } }
          : prev,
      );
    },
    [updater],
  );

  /* --------------------------------- Kediler -------------------------------- */
  const addCat = useCallback(
    (cat: Cat) => {
      updater((prev) => ({
        ...prev,
        cats: [...prev.cats, cat],
        // Yeni kedi için temel mama/su/kum/oyun hatırlatıcıları
        reminders: [...prev.reminders, ...defaultRemindersForCat(cat.id)],
        settings: {
          ...prev.settings,
          activeCatId: cat.id,
          onboarded: true,
        },
      }));
      notify(`${cat.name} profili oluşturuldu 🐾`);
    },
    [notify, updater],
  );

  const updateCat = useCallback(
    (catId: string, patch: Partial<Cat>) => {
      updater((prev) => ({
        ...prev,
        cats: prev.cats.map((cat) =>
          cat.id === catId ? { ...cat, ...patch, id: cat.id } : cat,
        ),
      }));
    },
    [updater],
  );

  const deleteCat = useCallback(
    (catId: string) => {
      updater((prev) => {
        const cats = prev.cats.filter((cat) => cat.id !== catId);
        return {
          ...prev,
          cats,
          reminders: prev.reminders.filter((reminder) => reminder.catId !== catId),
          logs: prev.logs.filter((log) => log.catId !== catId),
          tasks: prev.tasks.filter((task) => task.catId !== catId),
          healthEntries: prev.healthEntries.filter((entry) => entry.catId !== catId),
          settings: {
            ...prev.settings,
            activeCatId:
              prev.settings.activeCatId === catId
                ? (cats[0]?.id ?? null)
                : prev.settings.activeCatId,
          },
        };
      });
      notify("Kedi profili silindi.");
    },
    [notify, updater],
  );

  const addWeight = useCallback(
    (catId: string, kg: number, date = activeDate) => {
      if (!Number.isFinite(kg) || kg <= 0) return;
      updater((prev) => ({
        ...prev,
        cats: prev.cats.map((cat) => {
          if (cat.id !== catId) return cat;
          const entry: WeightEntry = { id: uid("w"), date, kg: Math.round(kg * 100) / 100 };
          const history = [
            ...cat.weightHistory.filter((item) => item.date !== date),
            entry,
          ].sort((a, b) => a.date.localeCompare(b.date));
          return { ...cat, weight: kg, weightHistory: history };
        }),
      }));
      notify("Kilo kaydedildi.");
    },
    [activeDate, notify, updater],
  );

  const deleteWeight = useCallback(
    (catId: string, entryId: string) => {
      updater((prev) => ({
        ...prev,
        cats: prev.cats.map((cat) => {
          if (cat.id !== catId) return cat;
          const history = cat.weightHistory.filter((item) => item.id !== entryId);
          return {
            ...cat,
            weightHistory: history,
            weight: history.length ? history[history.length - 1].kg : cat.weight,
          };
        }),
      }));
    },
    [updater],
  );

  const addVaccination = useCallback(
    (catId: string, vaccination: Omit<Vaccination, "id">) => {
      updater((prev) => ({
        ...prev,
        cats: prev.cats.map((cat) =>
          cat.id === catId
            ? {
                ...cat,
                vaccinations: [
                  ...cat.vaccinations,
                  { ...vaccination, id: uid("v") },
                ].sort((a, b) => a.date.localeCompare(b.date)),
              }
            : cat,
        ),
      }));
      notify("Aşı kaydı eklendi.");
    },
    [notify, updater],
  );

  const deleteVaccination = useCallback(
    (catId: string, vaccinationId: string) => {
      updater((prev) => ({
        ...prev,
        cats: prev.cats.map((cat) =>
          cat.id === catId
            ? {
                ...cat,
                vaccinations: cat.vaccinations.filter(
                  (item) => item.id !== vaccinationId,
                ),
              }
            : cat,
        ),
      }));
    },
    [updater],
  );

  const addGalleryPhoto = useCallback(
    (catId: string, photo: string) => {
      updater((prev) => ({
        ...prev,
        cats: prev.cats.map((cat) =>
          cat.id === catId
            ? { ...cat, gallery: [...cat.gallery, photo].slice(-12) }
            : cat,
        ),
      }));
    },
    [updater],
  );

  const removeGalleryPhoto = useCallback(
    (catId: string, index: number) => {
      updater((prev) => ({
        ...prev,
        cats: prev.cats.map((cat) =>
          cat.id === catId
            ? { ...cat, gallery: cat.gallery.filter((_, i) => i !== index) }
            : cat,
        ),
      }));
    },
    [updater],
  );

  /* ------------------------------ Günlük kayıt ----------------------------- */
  const updateTodayLog = useCallback(
    (patch: TodayPatch, catId?: string) => {
      updater((prev) => {
        const target = catId ?? prev.settings.activeCatId ?? prev.cats[0]?.id;
        if (!target) return prev;
        return {
          ...prev,
          logs: preserveLogs(upsertLog(prev.logs, target, patch, activeDate)),
        };
      });
    },
    [activeDate, updater],
  );

  const addMeal = useCallback(() => {
    updater((prev) => {
      const catId = prev.settings.activeCatId ?? prev.cats[0]?.id;
      if (!catId) return prev;
      const current = findLog(prev.logs, catId, activeDate);
      const next = Math.min(
        prev.settings.mealsPerDay,
        (current?.mealsGiven ?? 0) + 1,
      );
      return {
        ...prev,
        logs: preserveLogs(upsertLog(prev.logs, catId, { mealsGiven: next }, activeDate)),
      };
    });
  }, [activeDate, updater]);

  const undoMeal = useCallback(() => {
    updater((prev) => {
      const catId = prev.settings.activeCatId ?? prev.cats[0]?.id;
      if (!catId) return prev;
      const current = findLog(prev.logs, catId, activeDate);
      return {
        ...prev,
        logs: preserveLogs(
          upsertLog(prev.logs, catId, {
            mealsGiven: Math.max(0, (current?.mealsGiven ?? 0) - 1),
          }, activeDate),
        ),
      };
    });
  }, [activeDate, updater]);

  const toggleWater = useCallback(() => {
    updater((prev) => {
      const catId = prev.settings.activeCatId ?? prev.cats[0]?.id;
      if (!catId) return prev;
      const current = findLog(prev.logs, catId, activeDate);
      return {
        ...prev,
        logs: preserveLogs(
          upsertLog(prev.logs, catId, { waterChanged: !current?.waterChanged }, activeDate),
        ),
      };
    });
  }, [activeDate, updater]);

  const toggleLitter = useCallback(() => {
    updater((prev) => {
      const catId = prev.settings.activeCatId ?? prev.cats[0]?.id;
      if (!catId) return prev;
      const current = findLog(prev.logs, catId, activeDate);
      return {
        ...prev,
        logs: preserveLogs(
          upsertLog(prev.logs, catId, { litterCleaned: !current?.litterCleaned }, activeDate),
        ),
      };
    });
  }, [activeDate, updater]);

  const addPlay = useCallback(
    (minutes: number) => {
      updater((prev) => {
        const catId = prev.settings.activeCatId ?? prev.cats[0]?.id;
        if (!catId) return prev;
        const current = findLog(prev.logs, catId, activeDate);
        return {
          ...prev,
          logs: preserveLogs(
            upsertLog(prev.logs, catId, {
              playMinutes: (current?.playMinutes ?? 0) + Math.max(0, minutes),
            }, activeDate),
          ),
        };
      });
    },
    [activeDate, updater],
  );

  /* ------------------------------ Hatırlatıcı ------------------------------ */
  const addReminder = useCallback(
    (input: NewReminderInput): string | null => {
      const id = uid("rem");
      updater((prev) => ({
        ...prev,
        reminders: [
          ...prev.reminders,
          {
            id,
            catId: input.catId,
            type: input.type,
            title: input.title.trim() || "Hatırlatıcı",
            time: input.time,
            days: input.days.length ? input.days : [0, 1, 2, 3, 4, 5, 6],
            enabled: input.enabled ?? true,
            streak: 0,
            history: [],
            note: input.note?.trim() || undefined,
          },
        ],
      }));
      notify("Hatırlatıcı eklendi.");
      return id;
    },
    [notify, updater],
  );

  const updateReminder = useCallback(
    (id: string, patch: Partial<Reminder>) => {
      updater((prev) => ({
        ...prev,
        reminders: prev.reminders.map((reminder) =>
          reminder.id === id ? { ...reminder, ...patch, id } : reminder,
        ),
      }));
    },
    [updater],
  );

  const deleteReminder = useCallback(
    (id: string) => {
      updater((prev) => ({
        ...prev,
        reminders: prev.reminders.filter((reminder) => reminder.id !== id),
      }));
      notify("Hatırlatıcı silindi.");
    },
    [notify, updater],
  );

  const toggleReminder = useCallback(
    (id: string) => {
      updater((prev) => ({
        ...prev,
        reminders: prev.reminders.map((reminder) =>
          reminder.id === id
            ? { ...reminder, enabled: !reminder.enabled }
            : reminder,
        ),
      }));
    },
    [updater],
  );

  const completeReminder = useCallback(
    (id: string) => {
      updater((prev) => {
        const reminder = prev.reminders.find((item) => item.id === id);
        if (!reminder) return prev;
        if (reminder.history.includes(activeDate) || reminder.lastCompleted === activeDate) return prev;

        const yesterday = dateKey(addDays(parseDateKey(activeDate), -1));
        const history = [...new Set([...reminder.history, activeDate])].sort();
        const streak = activeDate === todayKey()
          ? (reminder.lastCompleted === yesterday ? reminder.streak + 1 : 1)
          : reminder.streak;
        const lastCompleted = !reminder.lastCompleted || activeDate > reminder.lastCompleted
          ? activeDate
          : reminder.lastCompleted;

        let logs = prev.logs;
        const catId = reminder.catId ?? prev.settings.activeCatId;
        if (catId) {
          const target = prev.cats.find((cat) => cat.id === catId);
          if (target) {
            const current = findLog(logs, catId, activeDate) ?? emptyLog(activeDate, catId);
            if (reminder.type === "food") {
              logs = upsertLog(logs, catId, {
                mealsGiven: Math.min(prev.settings.mealsPerDay, current.mealsGiven + 1),
              }, activeDate);
            } else if (reminder.type === "water") {
              logs = upsertLog(logs, catId, { waterChanged: true }, activeDate);
            } else if (reminder.type === "litter") {
              logs = upsertLog(logs, catId, { litterCleaned: true }, activeDate);
            } else if (reminder.type === "play") {
              logs = upsertLog(logs, catId, {
                playMinutes: current.playMinutes + 15,
              }, activeDate);
            }
          }
        }

        return {
          ...prev,
          logs: preserveLogs(logs),
          reminders: prev.reminders.map((item) =>
            item.id === id
              ? { ...item, lastCompleted, streak, history, snoozedUntil: undefined }
              : item,
          ),
        };
      });
      notify("Tamamlandı olarak işaretlendi ✓");
    },
    [activeDate, notify, updater],
  );

  const snoozeReminder = useCallback(
    (id: string, minutes = 30) => {
      updater((prev) => ({
        ...prev,
        reminders: prev.reminders.map((reminder) =>
          reminder.id === id
            ? { ...reminder, snoozedUntil: Date.now() + minutes * 60_000 }
            : reminder,
        ),
      }));
      notify(`${minutes} dakika ertelendi.`);
    },
    [notify, updater],
  );

  /* ------------------------------ Görevler ---------------------------------- */
  const TASK_EXPIRY_MS = 24 * 60 * 60 * 1000;

  const isTaskExpired = useCallback((task: Task) => {
    if (!task.completedAt) return false;
    const completed = new Date(task.completedAt).getTime();
    if (Number.isNaN(completed)) return false;
    return Date.now() - completed > TASK_EXPIRY_MS;
  }, [TASK_EXPIRY_MS]);

  const purgeExpiredTasks = useCallback(() => {
    updater((prev) => {
      const now = Date.now();
      const kept: Task[] = [];
      const toAdd: Task[] = [];
      for (const task of prev.tasks) {
        if (!isTaskExpired(task)) {
          kept.push(task);
          continue;
        }
        // Tamamlanan kaydı geçmiş için sakla; tekrarlayan görev için yeni bir örnek aç.
        if (task.repeat && task.repeat !== "none") {
          const days = task.repeat === "daily" ? 1 : 7;
          const nextDate = new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
          kept.push({ ...task, repeat: "none" });
          toAdd.push({
            ...task,
            id: uid("task"),
            progress: 0,
            progressByDate: [],
            completedAt: undefined,
            createdAt: nextDate,
            dueDate: dateKey(new Date(nextDate)),
          });
        } else {
          kept.push(task);
        }
      }
      if (toAdd.length === 0 && kept.length === prev.tasks.length) return prev;
      return { ...prev, tasks: [...toAdd, ...kept] };
    });
  }, [isTaskExpired, updater]);

  const addTask = useCallback(
    (input: NewTaskInput): string | null => {
      const title = input.title.trim();
      if (!title) return null;
      const id = uid("task");
      const target = Math.min(10, Math.max(1, Math.floor(input.target ?? 1)));
      const task: Task = {
        id,
        catId: input.catId,
        title: title.slice(0, 80),
        emoji: (input.emoji ?? "✅").slice(0, 4) || "✅",
        kind: input.kind ?? "custom",
        target,
        progress: 0,
        progressByDate: [{ date: activeDate, progress: 0 }],
        note: input.note?.trim().slice(0, 500) || undefined,
        repeat: input.repeat ?? "none",
        priority: input.priority ?? "medium",
        dueDate: input.dueDate,
        createdAt: activeDate === todayKey()
          ? new Date().toISOString()
          : (() => {
              const selectedDay = parseDateKey(activeDate);
              selectedDay.setHours(12, 0, 0, 0);
              return selectedDay.toISOString();
            })(),
      };
      updater((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }));
      notify("Görev eklendi.");
      return id;
    },
    [activeDate, notify, updater],
  );

  const tapTask = useCallback(
    (id: string) => {
      updater((prev) => {
        const task = prev.tasks.find((item) => item.id === id);
        if (!task || taskCompletedOn(task, activeDate)) return prev;
        const nextProgress = Math.min(task.target, taskProgressOn(task, activeDate) + 1);
        const completed = nextProgress >= task.target;
        const completedAt = completed ? new Date().toISOString() : undefined;
        const progressByDate = [
          ...(task.progressByDate ?? []).filter((item) => item.date !== activeDate),
          { date: activeDate, progress: nextProgress, completedAt },
        ];
        const isCurrentDay = activeDate === todayKey();
        return {
          ...prev,
          tasks: prev.tasks.map((item) => item.id === id
            ? {
                ...item,
                progressByDate,
                ...(isCurrentDay ? { progress: nextProgress, completedAt } : {}),
              }
            : item),
        };
      });
    },
    [activeDate, updater],
  );

  const undoTask = useCallback(
    (id: string) => {
      updater((prev) => {
        const task = prev.tasks.find((item) => item.id === id);
        if (!task) return prev;
        const nextProgress = Math.max(0, taskProgressOn(task, activeDate) - 1);
        const progressByDate = [
          ...(task.progressByDate ?? []).filter((item) => item.date !== activeDate),
          { date: activeDate, progress: nextProgress },
        ];
        const isCurrentDay = activeDate === todayKey();
        return {
          ...prev,
          tasks: prev.tasks.map((item) => item.id === id
            ? {
                ...item,
                progressByDate,
                ...(isCurrentDay ? { progress: nextProgress, completedAt: undefined } : {}),
              }
            : item),
        };
      });
    },
    [activeDate, updater],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      updater((prev) => ({
        ...prev,
        tasks: prev.tasks.map((task) =>
          task.id === id ? { ...task, ...patch, id } : task,
        ),
      }));
    },
    [updater],
  );

  const deleteTask = useCallback(
    (id: string) => {
      updater((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((task) => task.id !== id),
      }));
      notify("Görev silindi.");
    },
    [notify, updater],
  );

  /* ----------------------------- Görev temizliği --------------------------- */
  useEffect(() => {
    if (status !== "ready") return;
    purgeExpiredTasks();
    const interval = window.setInterval(() => purgeExpiredTasks(), 60_000);
    return () => window.clearInterval(interval);
  }, [purgeExpiredTasks, status]);

  /* ------------------------------ Sağlık günlüğü ---------------------------- */
  const addHealthEntry = useCallback(
    (entry: Omit<HealthEntry, "id" | "createdAt">) => {
      const id = uid("health");
      updater((prev) => ({
        ...prev,
        healthEntries: [
          { ...entry, id, createdAt: new Date().toISOString() },
          ...prev.healthEntries,
        ],
      }));
      notify("Sağlık kaydı eklendi.");
    },
    [notify, updater],
  );

  const deleteHealthEntry = useCallback(
    (id: string) => {
      updater((prev) => ({
        ...prev,
        healthEntries: prev.healthEntries.filter((e) => e.id !== id),
      }));
      notify("Kayıt silindi.");
    },
    [notify, updater],
  );

  /* ------------------------------ Veri yönetimi ----------------------------- */
  const importData = useCallback(
    (imported: AppData) => {
      setData(imported);
      setStatus("ready");
      setError(null);
      notify("Veriler içe aktarıldı.");
    },
    [notify],
  );

  const resetData = useCallback(
    (_mode: "demo" | "empty") => {
      const empty: AppData = {
        version: 2,
        settings: defaultSettings(),
        cats: [],
        reminders: [],
        logs: [],
        tasks: [],
        healthEntries: [],
        meta: {
          createdAt: new Date().toISOString(),
          lastOpenedAt: new Date().toISOString(),
        },
      };
      setData(empty);
      clearStoredData();
      setStatus("ready");
      setError(null);
      notify("Tüm veriler silindi.");
    },
    [notify],
  );

  /* --------------------------------- Türetilen ------------------------------ */
  const settings = data?.settings ?? DEFAULT_SETTINGS;
  const cats = useMemo(() => data?.cats ?? [], [data]);
  const reminders = useMemo(() => data?.reminders ?? [], [data]);
  const logs = useMemo(() => data?.logs ?? [], [data]);
  const tasks = useMemo(() => data?.tasks ?? [], [data]);
  const healthEntries = useMemo(() => data?.healthEntries ?? [], [data]);
  const activeCat = useMemo(() => {
    if (!data || data.cats.length === 0) return null;
    return (
      data.cats.find((cat) => cat.id === data.settings.activeCatId) ??
      data.cats[0]
    );
  }, [data]);
  const activeCatId = activeCat?.id ?? null;
  const isHistoricalDate = activeDate !== todayKey();
  const todayLog = useMemo(
    () => (activeCatId ? findLog(logs, activeCatId, activeDate) : undefined),
    [activeCatId, activeDate, logs],
  );
  const lang = settings.language;
  const t = useCallback((key: string) => translate(lang, key), [lang]);

  const value: AppContextValue = {
    status,
    data,
    user,
    cats,
    reminders,
    logs,
    tasks,
    healthEntries,
    settings,
    activeCat,
    activeCatId,
    activeDate,
    isHistoricalDate,
    setActiveDate,
    returnToToday,
    todayLog,
    lang,
    error,
    storageError,
    syncError,
    toast,
    t,
    notify,
    dismissToast,
    dismissStorageError,
    retry,
    retrySync,
    updateSettings,
    setActiveCat,
    addCat,
    updateCat,
    deleteCat,
    addWeight,
    deleteWeight,
    addVaccination,
    deleteVaccination,
    addGalleryPhoto,
    removeGalleryPhoto,
    updateTodayLog,
    addMeal,
    undoMeal,
    toggleWater,
    toggleLitter,
    addPlay,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    completeReminder,
    snoozeReminder,
    addTask,
    tapTask,
    updateTask,
    deleteTask,
    undoTask,
    purgeExpiredTasks,
    addHealthEntry,
    deleteHealthEntry,
    importData,
    resetData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp, AppProvider içinde kullanılmalıdır.");
  }
  return context;
}
