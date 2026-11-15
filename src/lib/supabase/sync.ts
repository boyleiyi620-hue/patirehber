import { createClient } from "./client";
import type { AppData, Cat, DailyLog, HealthEntry, Reminder, Task } from "@/lib/types";

const supabase = createClient();

export async function loadUserData(userId: string): Promise<AppData | null> {
  const [profile, cats, reminders, logs, tasks, health, vaccs, weights] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("cats").select("*").eq("user_id", userId),
    supabase.from("reminders").select("*").eq("user_id", userId),
    supabase.from("daily_logs").select("*").eq("user_id", userId),
    supabase.from("tasks").select("*").eq("user_id", userId),
    supabase.from("health_entries").select("*").eq("user_id", userId),
    supabase.from("vaccinations").select("*").eq("user_id", userId),
    supabase.from("weight_entries").select("*").eq("user_id", userId),
  ]);

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

export async function saveUserData(userId: string, data: AppData): Promise<void> {
  const supabase = createClient();
  // Profile
  await supabase.from("profiles").upsert({
    id: userId,
    display_name: data.settings.userName,
    theme: data.settings.theme,
    language: data.settings.language,
    meals_per_day: data.settings.mealsPerDay,
    daily_portion_grams: data.settings.dailyPortionGrams,
    onboarded: data.settings.onboarded,
    updated_at: new Date().toISOString(),
  });

  // Cats: upsert all
  if (data.cats.length) {
    await supabase.from("cats").upsert(
      data.cats.map((c) => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        breed_id: c.breedId,
        birth_date: c.birthDate,
        gender: c.gender,
        weight: c.weight,
        neutered: c.neutered,
        activity: c.activity,
        photo: c.photo ?? null,
        gallery: c.gallery,
        health_notes: c.healthNotes,
        notes: c.notes,
        color: c.color ?? null,
        microchip: c.microchip ?? null,
        insurance: c.insurance ?? null,
        allergies: c.allergies ?? null,
        medications: c.medications ?? null,
        vet_name: c.vet?.name ?? null,
        vet_clinic: c.vet?.clinic ?? null,
        vet_phone: c.vet?.phone ?? null,
        vet_address: c.vet?.address ?? null,
        adopted_at: c.adoptedAt ?? null,
        created_at: c.createdAt,
        updated_at: new Date().toISOString(),
      })),
    );
  }

  // Reminders
  if (data.reminders.length) {
    await supabase.from("reminders").upsert(
      data.reminders.map((r) => ({
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
      })),
    );
  }

  // Daily logs
  if (data.logs.length) {
    await supabase.from("daily_logs").upsert(
      data.logs.map((l) => ({
        id: l.id,
        user_id: userId,
        cat_id: l.catId,
        date: l.date,
        meals_given: l.mealsGiven,
        water_changed: l.waterChanged,
        litter_cleaned: l.litterCleaned,
        play_minutes: l.playMinutes,
        note: l.note ?? null,
      })),
      { onConflict: "user_id,cat_id,date" },
    );
  }

  // Tasks
  if (data.tasks.length) {
    await supabase.from("tasks").upsert(
      data.tasks.map((t) => ({
        id: t.id,
        user_id: userId,
        cat_id: t.catId,
        title: t.title,
        emoji: t.emoji,
        kind: t.kind,
        target: t.target,
        progress: t.progress,
        note: t.note ?? null,
        repeat: t.repeat ?? "none",
        priority: t.priority ?? "medium",
        due_date: t.dueDate ?? null,
        created_at: t.createdAt,
        completed_at: t.completedAt ?? null,
      })),
    );
  }

  // Health entries
  if (data.healthEntries.length) {
    await supabase.from("health_entries").upsert(
      data.healthEntries.map((h) => ({
        id: h.id,
        user_id: userId,
        cat_id: h.catId,
        date: h.date,
        type: h.type,
        title: h.title,
        note: h.note ?? null,
        created_at: h.createdAt,
      })),
    );
  }

  // Vaccinations: stored in vaccinations table, need to sync per cat
  const vaccRows: any[] = [];
  data.cats.forEach((c) => {
    c.vaccinations.forEach((v) => {
      vaccRows.push({
        id: v.id,
        user_id: userId,
        cat_id: c.id,
        name: v.name,
        date: v.date,
        next_date: v.nextDate ?? null,
      });
    });
  });
  if (vaccRows.length) {
    await supabase.from("vaccinations").upsert(vaccRows);
  }

  // Weight entries
  const weightRows: any[] = [];
  data.cats.forEach((c) => {
    c.weightHistory.forEach((w) => {
      weightRows.push({
        id: w.id,
        user_id: userId,
        cat_id: c.id,
        date: w.date,
        kg: w.kg,
      });
    });
  });
  if (weightRows.length) {
    await supabase.from("weight_entries").upsert(weightRows);
  }
}

export async function deleteCatRemote(userId: string, catId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("cats").delete().eq("id", catId).eq("user_id", userId);
}
