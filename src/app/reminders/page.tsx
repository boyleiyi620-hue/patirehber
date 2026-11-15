import type { Metadata } from "next";
import { RemindersView } from "@/components/views/reminders-view";

export const metadata: Metadata = {
  title: "Hatırlatıcılar",
  description:
    "Mama, su, kum, ilaç, parazit, aşı ve kilo hatırlatıcılarını yönet; günlük serini ve tamamlama geçmişini takip et.",
};

export default function RemindersPage() {
  return <RemindersView />;
}
