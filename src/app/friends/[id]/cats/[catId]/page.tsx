import type { Metadata } from "next";
import { FriendCatProfileView } from "@/components/views/friend-cat-profile-view";

export const metadata: Metadata = {
  title: "Kedi Profili",
};

export default async function FriendCatPage({
  params,
}: {
  params: Promise<{ id: string; catId: string }>;
}) {
  const { id, catId } = await params;
  return <FriendCatProfileView friendId={id} catId={catId} />;
}
