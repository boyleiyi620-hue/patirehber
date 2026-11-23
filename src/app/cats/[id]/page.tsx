import type { Metadata } from "next";
import { CatProfileView } from "@/components/views/cat-profile-view";

export const metadata: Metadata = {
  title: "Kedi Profili",
  description:
    "Kedi profil bilgileri, ırka özel bakım notları, beslenme planı, aşı takvimi, kilo grafiği ve fotoğraf galerisi.",
};

export default async function CatProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CatProfileView catId={id} />;
}
