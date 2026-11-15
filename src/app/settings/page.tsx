import type { Metadata } from "next";
import { SettingsView } from "@/components/views/settings-view";

export const metadata: Metadata = {
  title: "Ayarlar",
  description:
    "Profil, tema, dil, bildirim tercihleri, JSON veri yedekleme ve sıfırlama ayarları.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
