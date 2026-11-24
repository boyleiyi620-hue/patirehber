"use client";

import { useEffect, useRef } from "react";
import { useApp } from "./app-provider";
import { isQuietHour, showNotification } from "@/lib/notifications";
import { REMINDER_META, todayKey } from "@/lib/utils";

/**
 * Uygulama açıkken çalışan hafif bildirim zamanlayıcısı.
 * Her 20 saniyede bir kontrol eder; aynı hatırlatıcı için günde bir bildirim gönderir.
 * (Arka plan push bildirimleri için service worker'daki `push` olayı hazırdır.)
 */
export function NotificationScheduler() {
  const { data, status, settings } = useApp();
  const fired = useRef<Set<string>>(new Set());
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (status !== "ready" || !data) return;
    if (!settings.notifications.enabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    let cancelled = false;
    let serverPushActive = false;
    let pushModeResolved = false;

    const check = () => {
      if (cancelled || !pushModeResolved || serverPushActive) return;
      if (settings.notifications.quietHours && isQuietHour()) return;
      const now = new Date();
      const hhmm = `${`${now.getHours()}`.padStart(2, "0")}:${`${now.getMinutes()}`.padStart(2, "0")}`;
      const today = todayKey();

      for (const reminder of data.reminders) {
        if (!reminder.enabled) continue;
        if (reminder.time !== hhmm) continue;
        if (!reminder.days.includes(now.getDay())) continue;
        if (reminder.lastCompleted === today) continue;
        if (reminder.snoozedUntil && reminder.snoozedUntil > Date.now()) continue;

        const prefs = settings.notifications;
        if (
          (reminder.type === "food" && !prefs.food) ||
          (reminder.type === "water" && !prefs.water) ||
          (reminder.type === "litter" && !prefs.litter) ||
          (["medication", "parasite", "vet", "weight"].includes(reminder.type) &&
            !prefs.health)
        ) {
          continue;
        }

        const key = `${reminder.id}:${today}`;
        if (fired.current.has(key) || inFlight.current.has(key)) continue;
        inFlight.current.add(key);

        const meta = REMINDER_META[reminder.type];
        void showNotification(
          `PatiRehber · ${reminder.title}`,
          `${meta.emoji} ${meta.hint} · Saat ${reminder.time}`,
          key,
        ).then((shown) => {
          inFlight.current.delete(key);
          if (shown) fired.current.add(key);
        });
      }
    };

    void (async () => {
      try {
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const registration = await navigator.serviceWorker.getRegistration();
          serverPushActive = Boolean(await registration?.pushManager.getSubscription());
        }
      } catch {
        serverPushActive = false;
      }
      pushModeResolved = true;
      check();
    })();
    const interval = window.setInterval(check, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [data, settings.notifications, status]);

  return null;
}
