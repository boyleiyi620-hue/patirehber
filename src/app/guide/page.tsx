import type { Metadata } from "next";
import { GuideView } from "@/components/views/guide-view";

export const metadata: Metadata = {
  title: "Bakım Rehberi",
  description:
    "Kedi beslenmesi, sağlık, kum bakımı, oyun, davranış ve ırk rehberi; porsiyon, su, yaş ve vücut kondisyonu hesaplayıcıları.",
};

export default function GuidePage() {
  return <GuideView />;
}
