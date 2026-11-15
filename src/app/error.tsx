"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="font-display text-xl font-extrabold">Bir şeyler ters gitti</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Beklenmeyen bir hata oluştu. Sayfayı yenileyerek tekrar deneyebilirsin.
      </p>
      <Button onClick={reset} className="mt-5">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Tekrar dene
      </Button>
    </div>
  );
}
