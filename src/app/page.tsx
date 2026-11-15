import type { Metadata } from "next";
import { DashboardView } from "@/components/views/dashboard-view";

export const metadata: Metadata = {
  title: "Kedi Bakım Rehberi",
  description:
    "Kedinin mama, su, kum, oyun ve sağlık takibini tek ekrandan yönet. Hatırlatıcılar, haftalık grafik, günün ipucu ve acil durum rehberi.",
};

export default function HomePage() {
  return <DashboardView />;
}
