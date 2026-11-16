"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, BellRing } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { isReminderDueOn, isCompletedToday } from "@/lib/utils";
import type { Reminder } from "@/lib/types";

function playAlarm() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [0, 0.35, 0.7].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.32);
    });
  } catch {}
}

export function AlarmOverlay() {
  const { reminders, settings, completeReminder, snoozeReminder } = useApp();
  const [alarm, setAlarm] = useState<Reminder | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const triggeredRef = useRef<Set<string>>(new Set());
  const lastMinuteRef = useRef<string>("");

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const minuteKey = `${now.getHours()}:${now.getMinutes()}`;
      if (minuteKey !== lastMinuteRef.current) {
        lastMinuteRef.current = minuteKey;
        triggeredRef.current.clear();
      }

      const due = reminders.find((r) => {
        if (!r.enabled) return false;
        if (isCompletedToday(r)) return false;
        if (r.snoozedUntil && r.snoozedUntil > Date.now()) return false;
        if (!isReminderDueOn(r, now)) return false;
        const [h, m] = r.time.split(":").map(Number);
        if (h !== now.getHours() || m !== now.getMinutes()) return false;
        if (triggeredRef.current.has(r.id)) return false;
        return true;
      });

      if (due) {
        triggeredRef.current.add(due.id);
        setAlarm(due);
        playAlarm();
        // system notification
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification(`PatiRehber: ${due.title}`, {
              body: due.note || "Hatirlatma zamani geldi.",
              icon: "/icons/icon-192.png",
              tag: due.id,
            });
          } catch {}
        }
      }
    };

    check();
    const id = setInterval(check, 20000);
    return () => clearInterval(id);
  }, [reminders]);

  if (!alarm) return null;

  const dismiss = () => setAlarm(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const end = e.changedTouches[0].clientY;
    if (touchStart - end > 60) {
      dismiss();
    }
    setTouchStart(null);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-background/95 p-6 text-center backdrop-blur-md"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mt-10 space-y-3">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary/15 text-primary-strong">
          <BellRing className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="font-display text-2xl font-extrabold">{alarm.title}</p>
        <p className="text-sm text-muted-foreground">
          {alarm.note || "Hatirlatma zamani geldi."}
        </p>
        <p className="text-xs text-muted-foreground">
          {alarm.time} · {alarm.catId ? "Kediye ozel" : "Tum kediler"}
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={() => {
              snoozeReminder(alarm.id, 5);
              dismiss();
            }}
            className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold"
          >
            5 dk ertele
          </button>
          <button
            type="button"
            onClick={() => {
              completeReminder(alarm.id);
              dismiss();
            }}
            className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            Tamamla
          </button>
        </div>
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <ArrowUp className="h-6 w-6 animate-bounce" aria-hidden="true" />
          <span className="text-[11px] font-semibold">Kapatmak icin yukari kaydir</span>
        </div>
      </div>
    </div>
  );
}
