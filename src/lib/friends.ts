import { createClient } from "@/lib/supabase/client";
import type { Cat, DailyLog, HealthEntry, Reminder, Task } from "@/lib/types";

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export interface FriendProfile {
  id: string;
  display_name: string | null;
}

export type FriendCat = Pick<Cat, "id" | "name" | "breedId" | "birthDate">;

export interface FriendCatDetail {
  cat: Cat;
  dailyLogs: DailyLog[];
  tasks: Task[];
  reminders: Reminder[];
  healthEntries: HealthEntry[];
}

export async function getMyFriendCode(_userId: string): Promise<string> {
  const { data, error } = await createClient().rpc("get_my_friend_code");
  if (error) throw new Error(error.message);
  if (typeof data !== "string" || !data) throw new Error("Arkadaş kodu alınamadı.");
  return data;
}

export async function sendFriendRequest(_userId: string, code: string): Promise<void> {
  const { error } = await createClient().rpc("send_friend_request", {
    p_code: code.trim().toUpperCase(),
  });
  if (error) {
    if (error.code === "P0002") throw new Error("Bu kodla kullanıcı bulunamadı.");
    if (error.code === "23505") throw new Error("Bu kullanıcıyla istek veya arkadaşlık zaten var.");
    if (error.code === "22023") throw new Error("Kendi kodunu kullanamazsın.");
    throw new Error(error.message);
  }
}

export async function listFriendships(userId: string): Promise<FriendshipRow[]> {
  const { data, error } = await createClient()
    .from("friendships")
    .select("id,requester_id,addressee_id,status,created_at")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) throw new Error(error.message);
  return (data ?? []) as FriendshipRow[];
}

export async function acceptFriendship(id: string): Promise<void> {
  const { error } = await createClient().rpc("respond_to_friend_request", {
    p_friendship_id: id,
    p_accept: true,
  });
  if (error) throw new Error(error.message);
}

export async function rejectFriendship(id: string): Promise<void> {
  const { error } = await createClient().rpc("respond_to_friend_request", {
    p_friendship_id: id,
    p_accept: false,
  });
  if (error) throw new Error(error.message);
}

export async function removeFriendship(id: string): Promise<void> {
  const { error } = await createClient().from("friendships").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getFriendProfile(userId: string): Promise<FriendProfile> {
  const { data, error } = await createClient().rpc("get_friend_profile", {
    target_user_id: userId,
  });
  if (error) throw new Error(error.message);
  const profile = Array.isArray(data) ? data[0] : null;
  if (!profile) throw new Error("Arkadaş profili bulunamadı.");
  return profile as FriendProfile;
}

export async function getFriendCats(userId: string): Promise<FriendCat[]> {
  const { data, error } = await createClient().rpc("get_friend_cats", {
    target_user_id: userId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    breedId: row.breed_id,
    birthDate: row.birth_date ?? new Date().toISOString().slice(0, 10),
  }));
}

export async function getFriendCatDetail(
  friendId: string,
  catId: string,
): Promise<FriendCatDetail> {
  const { data, error } = await createClient().rpc("get_friend_cat_detail", {
    target_user_id: friendId,
    target_cat_id: catId,
  });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object" || !(data as any).cat) {
    throw new Error("Bu kediye erişim yok veya kedi bulunamadı.");
  }

  const result = data as any;
  const row = result.cat;
  const cat: Cat = {
    id: row.id,
    name: row.name,
    breedId: row.breed_id,
    birthDate: row.birth_date ?? new Date().toISOString().slice(0, 10),
    gender: row.gender === "male" ? "male" : "female",
    weight: Number(row.weight ?? 0),
    neutered: Boolean(row.neutered),
    activity: row.activity ?? "medium",
    photo: row.photo ?? undefined,
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    healthNotes: row.health_notes ?? "",
    notes: row.notes ?? "",
    color: row.color ?? undefined,
    microchip: row.microchip ?? undefined,
    insurance: row.insurance ?? undefined,
    allergies: row.allergies ?? undefined,
    medications: row.medications ?? undefined,
    vet: row.vet_name || row.vet_clinic || row.vet_phone || row.vet_address
      ? { name: row.vet_name ?? "", clinic: row.vet_clinic ?? "", phone: row.vet_phone ?? "", address: row.vet_address ?? undefined }
      : undefined,
    adoptedAt: row.adopted_at ?? undefined,
    vaccinations: (result.vaccinations ?? []).map((item: any) => ({
      id: item.id, name: item.name, date: item.date, nextDate: item.next_date ?? undefined,
    })),
    weightHistory: (result.weight_entries ?? []).map((item: any) => ({
      id: item.id, date: item.date, kg: Number(item.kg),
    })),
    createdAt: row.created_at,
  };

  const dailyLogs: DailyLog[] = (result.daily_logs ?? []).map((item: any) => ({
    id: item.id,
    catId: item.cat_id,
    date: item.date,
    mealsGiven: item.meals_given ?? 0,
    waterChanged: Boolean(item.water_changed),
    litterCleaned: Boolean(item.litter_cleaned),
    playMinutes: item.play_minutes ?? 0,
    note: item.note ?? undefined,
  }));
  const tasks: Task[] = (result.tasks ?? []).map((item: any) => ({
    id: item.id,
    catId: item.cat_id,
    title: item.title,
    emoji: item.emoji ?? "✅",
    kind: item.kind ?? "custom",
    target: item.target ?? 1,
    progress: item.progress ?? 0,
    progressByDate: item.progress_by_date ?? [],
    note: item.note ?? undefined,
    repeat: item.repeat ?? "none",
    priority: item.priority ?? "medium",
    dueDate: item.due_date ?? undefined,
    createdAt: item.created_at,
    completedAt: item.completed_at ?? undefined,
  }));
  const reminders: Reminder[] = (result.reminders ?? []).map((item: any) => ({
    id: item.id,
    catId: item.cat_id,
    type: item.type,
    title: item.title,
    time: item.time,
    days: item.days ?? [],
    enabled: Boolean(item.enabled),
    lastCompleted: item.last_completed ?? undefined,
    streak: item.streak ?? 0,
    history: item.history ?? [],
    note: item.note ?? undefined,
  }));
  const healthEntries: HealthEntry[] = (result.health_entries ?? []).map((item: any) => ({
    id: item.id,
    catId: item.cat_id,
    date: item.date,
    type: item.type ?? "note",
    title: item.title,
    note: item.note ?? undefined,
    createdAt: item.created_at,
  }));

  return { cat, dailyLogs, tasks, reminders, healthEntries };
}
