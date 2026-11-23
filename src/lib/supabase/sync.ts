import { createClient } from "./client";
import type { AppData, Cat, DailyLog, HealthEntry, Reminder, Task } from "@/lib/types";
import { idsToDelete } from "./reconcile";

type SyncTable =
  | "cats"
  | "reminders"
  | "daily_logs"
  | "tasks"
  | "health_entries"
  | "vaccinations"
  | "weight_entries";

type Row = Record<string, unknown>;

function throwOnError(error: { message: string } | null, operation: string): void {
  if (error) throw new Error(`${operation}: ${error.message}`);
}

function batches<T>(items: T[], size = 100): T[][] {
  const result: T[][] = [];
  for (let offset = 0; offset < items.length; offset += size) {
    result.push(items.slice(offset, offset + size));
  }
  return result;
}

export async function loadUserData(userId: string): Promise<AppData | null> {
  const supabase = createClient();
  const [profile, cats, reminders, logs, tasks, health, vaccs, weights] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("cats").select("*").eq("user_id", userId),
    supabase.from("reminders").select("*").eq("user_id", userId),
    supabase.from("daily_logs").select("*").eq("user_id", userId),
    supabase.from("tasks").select("*").eq("user_id", userId),
    supabase.from("health_entries").select("*").eq("user_id", userId),
    supabase.from("vaccinations").select("*").eq("user_id", userId),
    supabase.from("weight_entries").select("*").eq("user_id", userId),
  ]);

  const resultErrors = [
    ["Profil", profile.error],
    ["Kediler", cats.error],
    ["Hatırlatıcılar", reminders.error],
    ["Günlük kayıtlar", logs.error],
    ["Görevler", tasks.error],
    ["Sağlık kayıtları", health.error],
    ["Aşı kayıtları", vaccs.error],
    ["Kilo kayıtları", weights.error],
  ] as const;
  for (const [label, error] of resultErrors) throwOnError(error, `${label} yüklenemedi`);

  const profileData = profile.data;
  const catRows = cats.data ?? [];

  const mappedCats: Cat[] = catRows.map((c: any) => ({
    id: c.id,
    name: c.name,
    breedId: c.breed_id,
    birthDate: c.birth_date ?? new Date().toISOString().slice(0, 10),
    gender: c.gender ?? "female",
    weight: Number(c.weight ?? 4),
    neutered: !!c.neutered,
    activity: c.activity ?? "medium",
    photo: c.photo ?? undefined,
    gallery: c.gallery ?? [],
    healthNotes: c.health_notes ?? "",
    notes: c.notes ?? "",
    color: c.color ?? undefined,
    microchip: c.microchip ?? undefined,
    insurance: c.insurance ?? undefined,
    allergies: c.allergies ?? undefined,
    medications: c.medications ?? undefined,
    vet: c.vet_name || c.vet_clinic || c.vet_phone || c.vet_address
      ? { name: c.vet_name ?? "", clinic: c.vet_clinic ?? "", phone: c.vet_phone ?? "", address: c.vet_address ?? undefined }
      : undefined,
    adoptedAt: c.adopted_at ?? undefined,
    vaccinations: (vaccs.data ?? [])
      .filter((v: any) => v.cat_id === c.id)
      .map((v: any) => ({ id: v.id, name: v.name, date: v.date, nextDate: v.next_date ?? undefined })),
    weightHistory: (weights.data ?? [])
      .filter((w: any) => w.cat_id === c.id)
      .map((w: any) => ({ id: w.id, date: w.date, kg: Number(w.kg) })),
    createdAt: c.created_at,
  }));

  const mappedReminders: Reminder[] = (reminders.data ?? []).map((r: any) => ({
    id: r.id,
    catId: r.cat_id,
    type: r.type,
    title: r.title,
    time: r.time,
    days: r.days ?? [0, 1, 2, 3, 4, 5, 6],
    enabled: r.enabled,
    lastCompleted: r.last_completed ?? undefined,
    streak: r.streak ?? 0,
    history: r.history ?? [],
    note: r.note ?? undefined,
    snoozedUntil: r.snoozed_until ?? undefined,
  }));

  const mappedLogs: DailyLog[] = (logs.data ?? []).map((l: any) => ({
    id: l.id,
    date: l.date,
    catId: l.cat_id,
    mealsGiven: l.meals_given ?? 0,
    waterChanged: !!l.water_changed,
    litterCleaned: !!l.litter_cleaned,
    playMinutes: l.play_minutes ?? 0,
    note: l.note ?? undefined,
  }));

  const mappedTasks: Task[] = (tasks.data ?? []).map((t: any) => ({
    id: t.id,
    catId: t.cat_id,
    title: t.title,
    emoji: t.emoji ?? "✅",
    kind: t.kind ?? "custom",
    target: t.target ?? 1,
    progress: t.progress ?? 0,
    progressByDate: t.progress_by_date ?? [],
    note: t.note ?? undefined,
    repeat: t.repeat ?? "none",
    priority: t.priority ?? "medium",
    dueDate: t.due_date ?? undefined,
    createdAt: t.created_at,
    completedAt: t.completed_at ?? undefined,
  }));

  const mappedHealth: HealthEntry[] = (health.data ?? []).map((h: any) => ({
    id: h.id,
    catId: h.cat_id,
    date: h.date,
    type: h.type ?? "note",
    title: h.title,
    note: h.note ?? undefined,
    createdAt: h.created_at,
  }));

  const settings = {
    theme: (profileData?.theme as any) ?? "system",
    language: (profileData?.language as any) ?? "tr",
    userName: profileData?.display_name ?? "Kedi Dostu",
    activeCatId: mappedCats[0]?.id ?? null,
    mealsPerDay: profileData?.meals_per_day ?? 3,
    dailyPortionGrams: profileData?.daily_portion_grams ?? 55,
    notifications: { enabled: false, food: true, water: true, litter: true, health: true, quietHours: true },
    onboarded: profileData?.onboarded ?? (mappedCats.length > 0),
    installDismissed: false,
    guideFavorites: [],
  };

  return {
    version: 2,
    settings,
    cats: mappedCats,
    reminders: mappedReminders,
    logs: mappedLogs,
    tasks: mappedTasks,
    healthEntries: mappedHealth,
    meta: { createdAt: new Date().toISOString(), lastOpenedAt: new Date().toISOString() },
  };
}

async function upsertRows(
  supabase: ReturnType<typeof createClient>,
  table: SyncTable,
  rows: Row[],
  onConflict?: string,
): Promise<void> {
  for (const batch of batches(rows)) {
    const { error } = await supabase.from(table).upsert(batch as any, onConflict ? { onConflict } : undefined);
    throwOnError(error, `${table} kaydedilemedi`);
  }
}

async function removeStaleRows(
  supabase: ReturnType<typeof createClient>,
  table: SyncTable,
  userId: string,
  retainedIds: string[],
): Promise<void> {
  const { data, error } = await supabase.from(table).select("id").eq("user_id", userId);
  throwOnError(error, `${table} kayıtları okunamadı`);

  const staleIds = idsToDelete(
    (data ?? []).map((row: { id: string }) => row.id),
    retainedIds,
  );
  for (const batch of batches(staleIds)) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("user_id", userId)
      .in("id", batch);
    throwOnError(deleteError, `${table} eski kayıtları silinemedi`);
  }
}

export async function saveUserData(userId: string, data: AppData): Promise<void> {
  const supabase = createClient();
  const stamp = new Date().toISOString();

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    display_name: data.settings.userName,
    theme: data.settings.theme,
    language: data.settings.language,
    meals_per_day: data.settings.mealsPerDay,
    daily_portion_grams: data.settings.dailyPortionGrams,
    onboarded: data.settings.onboarded,
    updated_at: stamp,
  });
  throwOnError(profileError, "Profil kaydedilemedi");

  const catRows: Row[] = data.cats.map((cat) => ({
    id: cat.id,
    user_id: userId,
    name: cat.name,
    breed_id: cat.breedId,
    birth_date: cat.birthDate,
    gender: cat.gender,
    weight: cat.weight,
    neutered: cat.neutered,
    activity: cat.activity,
    photo: cat.photo ?? null,
    gallery: cat.gallery,
    health_notes: cat.healthNotes,
    notes: cat.notes,
    color: cat.color ?? null,
    microchip: cat.microchip ?? null,
    insurance: cat.insurance ?? null,
    allergies: cat.allergies ?? null,
    medications: cat.medications ?? null,
    vet_name: cat.vet?.name ?? null,
    vet_clinic: cat.vet?.clinic ?? null,
    vet_phone: cat.vet?.phone ?? null,
    vet_address: cat.vet?.address ?? null,
    adopted_at: cat.adoptedAt ?? null,
    created_at: cat.createdAt,
    updated_at: stamp,
  }));
  await upsertRows(supabase, "cats", catRows);

  const reminderRows: Row[] = data.reminders.map((r) => ({
    id: r.id,
    user_id: userId,
    cat_id: r.catId,
    type: r.type,
    title: r.title,
    time: r.time,
    days: r.days,
    enabled: r.enabled,
    last_completed: r.lastCompleted ?? null,
    streak: r.streak,
    history: r.history,
    note: r.note ?? null,
    snoozed_until: r.snoozedUntil ?? null,
  }));
  const logRows: Row[] = data.logs.map((l) => ({
    id: l.id,
    user_id: userId,
    cat_id: l.catId,
    date: l.date,
    meals_given: l.mealsGiven,
    water_changed: l.waterChanged,
    litter_cleaned: l.litterCleaned,
    play_minutes: l.playMinutes,
    note: l.note ?? null,
  }));
  const taskRows: Row[] = data.tasks.map((t) => ({
    id: t.id,
    user_id: userId,
    cat_id: t.catId,
    title: t.title,
    emoji: t.emoji,
    kind: t.kind,
    target: t.target,
    progress: t.progress,
    progress_by_date: t.progressByDate ?? [],
    note: t.note ?? null,
    repeat: t.repeat ?? "none",
    priority: t.priority ?? "medium",
    due_date: t.dueDate ?? null,
    created_at: t.createdAt,
    completed_at: t.completedAt ?? null,
  }));
  const healthRows: Row[] = data.healthEntries.map((h) => ({
    id: h.id,
    user_id: userId,
    cat_id: h.catId,
    date: h.date,
    type: h.type,
    title: h.title,
    note: h.note ?? null,
    created_at: h.createdAt,
  }));
  const vaccinationRows: Row[] = data.cats.flatMap((cat) =>
    cat.vaccinations.map((v) => ({
      id: v.id,
      user_id: userId,
      cat_id: cat.id,
      name: v.name,
      date: v.date,
      next_date: v.nextDate ?? null,
    })),
  );
  const weightRows: Row[] = data.cats.flatMap((cat) =>
    cat.weightHistory.map((w) => ({
      id: w.id,
      user_id: userId,
      cat_id: cat.id,
      date: w.date,
      kg: w.kg,
    })),
  );

  // Persist every current row before reconciling deletions. Any upsert error
  // aborts here, so an incomplete snapshot can never erase remote data.
  const writeResults = await Promise.allSettled([
    upsertRows(supabase, "reminders", reminderRows),
    upsertRows(supabase, "daily_logs", logRows, "user_id,cat_id,date"),
    upsertRows(supabase, "tasks", taskRows),
    upsertRows(supabase, "health_entries", healthRows),
    upsertRows(supabase, "vaccinations", vaccinationRows),
    upsertRows(supabase, "weight_entries", weightRows),
  ]);
  const failedWrite = writeResults.find((result) => result.status === "rejected");
  if (failedWrite?.status === "rejected") {
    throw failedWrite.reason instanceof Error
      ? failedWrite.reason
      : new Error("Bazı kayıtlar Supabase'e yazılamadı.");
  }

  const currentIds = {
    reminders: reminderRows.map((row) => String(row.id)),
    daily_logs: logRows.map((row) => String(row.id)),
    tasks: taskRows.map((row) => String(row.id)),
    health_entries: healthRows.map((row) => String(row.id)),
    vaccinations: vaccinationRows.map((row) => String(row.id)),
    weight_entries: weightRows.map((row) => String(row.id)),
    cats: catRows.map((row) => String(row.id)),
  };

  // Remove children first, then cats. Empty lists intentionally clear that
  // table for this owner; the UI reaches this code only after explicit reset.
  for (const table of ["reminders", "daily_logs", "tasks", "health_entries", "vaccinations", "weight_entries", "cats"] as const) {
    await removeStaleRows(supabase, table, userId, currentIds[table]);
  }
}
