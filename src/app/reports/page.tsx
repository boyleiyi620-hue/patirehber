import type { Metadata } from "next";
import { ReportsView } from "@/components/views/reports-view";

export const metadata: Metadata = {
  title: "Raporlar",
  description:
    "Haftalık ve aylık bakım puanı, mama tüketimi tahmini, kilo değişimi, rozetler ve kedi bazında karşılaştırma.",
};

export default function ReportsPage() {
  return <ReportsView />;
}
