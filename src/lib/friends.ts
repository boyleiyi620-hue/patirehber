import { createClient } from "@/lib/supabase/client";
import type { Cat } from "@/lib/types";

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
  cat: FriendCat;
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
  const cats = await getFriendCats(friendId);
  const cat = cats.find((item) => item.id === catId);
  if (!cat) throw new Error("Bu kediye erişim yok veya kedi bulunamadı.");
  return { cat };
}
