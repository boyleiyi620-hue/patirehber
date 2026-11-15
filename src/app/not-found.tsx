import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl" aria-hidden="true">🐾</p>
      <h1 className="mt-3 font-display text-xl font-extrabold">Sayfa bulunamadı</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Aradığın sayfa taşınmış veya silinmiş olabilir.
      </p>
      <ButtonLink href="/" className="mt-5">
        Ana sayfaya dön
      </ButtonLink>
    </div>
  );
}
