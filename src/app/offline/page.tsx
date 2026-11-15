import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Çevrimdışı",
  description: "İnternet bağlantısı yok. PatiRehber önbelleğe alınmış sayfalarla çalışmaya devam eder.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col justify-center py-8">
      <Card className="text-center">
        <CardContent className="flex flex-col items-center p-6">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary-strong">
            <WifiOff className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-display text-xl font-extrabold">
            Şu anda çevrimdışısın
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Endişelenme, kayıtlı verilerin cihazında güvende. Daha önce açtığın
            sayfalara göz atabilir, bağlantı gelince kaldığın yerden devam
            edebilirsin.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <ButtonLink href="/">Ana sayfaya dön</ButtonLink>
            <ButtonLink href="/guide" variant="outline">
              Rehberi aç
            </ButtonLink>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Mama, su ve kum kayıtları çevrimdışıyken de kaydedilir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
