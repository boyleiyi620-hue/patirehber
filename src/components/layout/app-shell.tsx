"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { usePathname } from "next/navigation";
import { BottomNav } from "./bottom-nav";
import { GuidedTours } from "@/components/tours/guided-tours";
import { AlarmOverlay } from "@/components/alarm-overlay";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/empty-state";
import { formatDateWithWeekday } from "@/lib/utils";

function LoadingScreen() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-nav pt-6 md:max-w-5xl md:px-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="mt-6 h-40 w-full rounded-3xl" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
      <p className="sr-only" role="status">
        Uygulama yükleniyor
      </p>
    </div>
  );
}

function ErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-4 py-10 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-danger">
        <AlertTriangle className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="mt-4 font-display text-xl font-extrabold">
        Veriler yüklenemedi
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Tekrar dene
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Yeniden denemek verileri tekrar yükler; kayıtları silmez.
      </p>
    </div>
  );
}

/** Ortak uygulama iskeleti: yükleme/hata durumları, alt menü ve toast */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    status,
    error,
    retry,
    storageError,
    dismissStorageError,
    syncError,
    retrySync,
    toast,
    dismissToast,
    activeDate,
    isHistoricalDate,
    returnToToday,
  } = useApp();

  if (pathname.startsWith("/auth")) return <>{children}</>;
  if (status === "loading") return <LoadingScreen />;
  if (status === "error") {
    return (
      <ErrorScreen
        message={error ?? "Beklenmeyen bir hata oluştu."}
        onRetry={retry}
      />
    );
  }

  return (
    <div className="relative min-h-dvh">
      {/* Arka planda yumuşak turuncu ışık */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-primary/10 to-transparent"
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[110] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground"
      >
        İçeriğe geç
      </a>

      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl px-4 pb-nav pt-5 sm:px-5 md:max-w-5xl md:px-6 md:pt-8 animate-fade-in"
      >
        {isHistoricalDate ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-amber-950 shadow-card dark:bg-amber-950/40 dark:text-amber-100">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide">Çalışma günü · {formatDateWithWeekday(activeDate)}</p>
              <p className="mt-0.5 text-[11px]">Günlük bakım ve görev kayıtları bu tarihe yazılacak.</p>
            </div>
            <Button size="sm" variant="outline" onClick={returnToToday}>Bugüne dön</Button>
          </div>
        ) : null}
        {children}
      </main>

      {storageError ? (
        <div
          role="alert"
          className="fixed inset-x-3 top-3 z-50 mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive-soft px-4 py-3 text-xs text-danger shadow-soft"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="flex-1 leading-relaxed">{storageError}</p>
          <button
            type="button"
            onClick={dismissStorageError}
            className="rounded-md px-1 font-bold underline-offset-2 hover:underline"
          >
            Kapat
          </button>
        </div>
      ) : null}

      {syncError ? (
        <div
          role="alert"
          className="fixed inset-x-3 top-20 z-50 mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-xs text-amber-900 shadow-soft dark:bg-amber-950/60 dark:text-amber-100"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="flex-1 leading-relaxed">
            Bulut eşitlemesi tamamlanamadı. Bu cihazdaki veriler korunuyor; bağlantı düzelince tekrar eşitleyebilirsin. {syncError}
          </p>
          <Button size="sm" variant="outline" onClick={retrySync}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Yeniden eşitle
          </Button>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div
            role="status"
            aria-live="polite"
            className="animate-fade-in-up rounded-full border border-border/60 bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-soft"
          >
            {toast}
          </div>
        </div>
      ) : null}

      <AlarmOverlay />
      {pathname !== "/onboarding" && pathname !== "/auth" ? <BottomNav /> : null}
      {pathname !== "/onboarding" && !pathname.startsWith("/auth") ? <GuidedTours /> : null}
    </div>
  );
}

/** Dashboard başlığındaki marka alanı */
export function BrandMark() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="PatiRehber ana sayfa"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-lg shadow-sm">
        🐾
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight">
        Pati<span className="text-primary-strong">Rehber</span>
      </span>
    </Link>
  );
}

export { LoadingScreen, ErrorScreen };
