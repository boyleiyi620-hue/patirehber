import type { Metadata } from "next";
import { EmergencyView } from "@/components/views/emergency-view";

export const metadata: Metadata = {
  title: "Acil Durum",
  description:
    "Kedi zehirlenmesinde ilk adımlar, tehlikeli yiyecek ve bitki listesi, acil veteriner belirtileri ve hızlı iletişim.",
  robots: { index: true, follow: true },
};

export default function EmergencyPage() {
  return <EmergencyView />;
}
