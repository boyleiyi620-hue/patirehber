import type { Metadata } from "next";
import { CatProfileView } from "@/components/views/cat-profile-view";

export const metadata: Metadata = {
  title: "Kedi Profili",
  description:
    "Kedi profil bilgileri, ırka özel bakım notları, beslenme planı, aşı takvimi, kilo grafiği ve fotoğraf galerisi.",
};

export default function CatProfilePage({ params }: { params: { id: string } }) {
  return <CatProfileView catId={params.id} />;
}
