import type { Metadata } from "next";
import { CatWizardView } from "@/components/views/cat-wizard-view";

export const metadata: Metadata = {
  title: "Yeni Kedi Ekle",
  description:
    "Adım adım kedi ekleme sihirbazı: ırk, doğum tarihi, kilo, fotoğraf, sağlık notları ve aşı takvimi.",
};

export default function NewCatPage() {
  return <CatWizardView />;
}
