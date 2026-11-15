import type { Metadata } from "next";
import { FriendCatProfileView } from "@/components/views/friend-cat-profile-view";

export const metadata: Metadata = {
  title: "Kedi Profili",
};

export default function FriendCatPage({ params }: { params: { id: string; catId: string } }) {
  return <FriendCatProfileView catId={params.catId} />;
}
