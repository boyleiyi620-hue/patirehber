import type { Metadata } from "next";
import { FriendsView } from "@/components/views/friends-view";

export const metadata: Metadata = {
  title: "Arkadaslar",
  description: "Arkadas kodu ile arkadas ekle, profillerini ve kedilerini gor.",
};

export default function FriendsPage() {
  return <FriendsView />;
}
