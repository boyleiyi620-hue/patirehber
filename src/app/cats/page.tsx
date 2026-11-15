import type { Metadata } from "next";
import { CatsView } from "@/components/views/cats-view";

export const metadata: Metadata = {
  title: "Kedilerim",
  description:
    "Kedi profillerini yönet, birden fazla kedi ekle, kilo ve aşı geçmişini tek yerde takip et.",
};

export default function CatsPage() {
  return <CatsView />;
}
