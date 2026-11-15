import { createClient } from "@/lib/supabase/client";
import type { Cat } from "@/lib/types";

function generateCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function getMyFriendCode(userId: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("friend_code").eq("id", userId).single();
  if (data?.friend_code) return data.friend_code as string;
  const code = generateCode();
  await supabase.from("profiles").update({ friend_code: code }).eq("id", userId);
  return code;
}

export async function sendFriendRequest(userId: string, code: string): Promise<void> {
  const supabase = createClient();
  const trimmed = code.trim().toUpperCase();
  const { data: target, error: findError } = await supabase.from("profiles").select("id").eq("friend_code", trimmed).single();
  if (findError || !target) throw new Error("Bu kodla kullanici bulunamadi.");
  if (target.id === userId) throw new Error("Kendinize arkadaslik istegi gonderemezsiniz.");
  const { error } = await supabase.from("friendships").insert({ requester_id: userId, addressee_id: target.id, status: "pending" });
  if (error) {
    if (error.code === "23505") throw new Error("Bu kullaniciya zaten istek gonderilmis.");
    throw new Error(error.message);
  }
}

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export async function listFriendships(userId: string): Promise<FriendshipRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("friendships").select("*").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (error) throw new Error(error.message);
  return (data ?? []) as FriendshipRow[];
}

export async function acceptFriendship(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function rejectFriendship(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("friendships").update({ status: "rejected" }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function removeFriendship(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("friendships").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export interface FriendProfile {
  id: string;
  display_name: string | null;
  friend_code: string | null;
}

export async function getFriendProfile(userId: string): Promise<FriendProfile> {
  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("id,display_name,friend_code").eq("id", userId).single();
  if (error) throw new Error(error.message);
  return data as FriendProfile;
}

export async function getFriendCats(userId: string): Promise<Cat[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("cats").select("*").eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((c: any) => ({
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
    vaccinations: [],
    weightHistory: [],
    createdAt: c.created_at,
  }));
}
