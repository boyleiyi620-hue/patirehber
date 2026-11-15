"use client";

import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { useApp } from "./providers/app-provider";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * "Ana ekrana ekle" akışı.
 * Chrome/Edge/Android'de yükleme istemini, iOS'ta paylaş menüsü yönergesini gösterir.
 */
export function InstallPrompt({ compact = false }: { compact?: boolean }) {
  const { settings, updateSettings, notify } = useApp();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-expect-error — Safari'ye özgü alan
        Boolean(window.navigator.standalone),
    );

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      notify("PatiRehber ana ekrana eklendi 🐾");
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [notify]);

  if (installed || isStandalone || settings.installDismissed) return null;
  if (!deferred && !isIOS) return null;

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
    } else {
      setDeferred(null);
    }
  };

  const dismiss = () => updateSettings({ installDismissed: true });

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2">
        <Smartphone className="h-4 w-4 shrink-0 text-primary-strong" aria-hidden="true" />
        <p className="text-xs text-muted-foreground">
          PatiRehber&apos;i ana ekranına ekle, çevrimdışı da kullan.
        </p>
        {deferred ? (
          <Button size="sm" className="ms-auto h-8 shrink-0" onClick={install}>
            Ekle
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary-strong">
          {isIOS ? (
            <Share className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Download className="h-5 w-5" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">PatiRehber&apos;i yükle</p>
          {isIOS ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Safari&apos;de <strong>Paylaş</strong> düğmesine dokun, ardından{" "}
              <strong>Ana Ekrana Ekle</strong> seçeneğini seç.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Ana ekranına ekle; uygulama tam ekran açılır ve çevrimdışı çalışır.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            {deferred ? (
              <Button size="sm" onClick={install}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Ana ekrana ekle
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Şimdi değil
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Kurulum önerisini kapat"
          className="rounded-full p-1 text-muted-foreground transition hover:bg-muted"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </CardContent>
    </Card>
  );
}
