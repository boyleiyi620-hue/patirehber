import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import * as webpush from "web-push";
import { localClockAt, shouldSendReminderNow, type PushNotificationPreferences, type PushReminderCandidate } from "@/lib/push-schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 500;

async function fetchAll<T>(makeQuery: (start: number, end: number) => any): Promise<T[]> {
  const rows: T[] = [];
  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await makeQuery(start, start + PAGE_SIZE - 1);
    if (error) throw new Error("Push dispatch data query failed");
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

function secureMatch(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

function validTimeZone(value: string | null | undefined): string {
  if (!value || value.length > 100) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
}

function reminderMessage(type: string, title: string, time: string) {
  const labels: Record<string, string> = {
    food: "Mama zamanı",
    water: "Suyunu tazeleme zamanı",
    litter: "Kum kabını temizleme zamanı",
    medication: "İlaç hatırlatıcısı",
    parasite: "Parazit koruma hatırlatıcısı",
    vet: "Veteriner kontrolü hatırlatıcısı",
    weight: "Kilo takibi zamanı",
    play: "Oyun zamanı",
    special: "Özel hatırlatıcı",
  };
  return { title: `PatiRehber · ${title}`, body: `${labels[type] ?? "Bakım hatırlatıcısı"} · ${time}` };
}

export async function POST(request: Request) {
  const cronSecret = process.env.PUSH_CRON_SECRET;
  const provided = request.headers.get("x-push-cron-secret") ?? "";
  if (!cronSecret || !secureMatch(provided, cronSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!supabaseUrl || !supabaseSecret || !vapidPublicKey || !vapidPrivateKey) {
    return Response.json({ error: "Push delivery is not configured" }, { status: 503 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseSecret, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "https://patirehber-five.vercel.app",
      vapidPublicKey,
      vapidPrivateKey,
    );

    const profiles = await fetchAll<any>((start, end) =>
      supabase.from("profiles")
        .select("id,notifications_enabled,notification_food,notification_water,notification_litter,notification_health,notification_quiet_hours")
        .eq("notifications_enabled", true)
        .range(start, end),
    );
    const userIds = profiles.map((profile) => profile.id as string);
    if (!userIds.length) return Response.json({ sent: 0, checked: 0 });

    const profileByUser = new Map<string, any>(profiles.map((profile) => [profile.id, profile]));
    const [subscriptions, reminders] = await Promise.all([
      fetchAll<any>((start, end) => supabase.from("push_subscriptions")
        .select("id,user_id,endpoint,p256dh,auth,timezone")
        .in("user_id", userIds)
        .range(start, end)),
      fetchAll<any>((start, end) => supabase.from("reminders")
        .select("id,user_id,type,title,time,days,enabled,last_completed,snoozed_until")
        .in("user_id", userIds)
        .eq("enabled", true)
        .range(start, end)),
    ]);
    const remindersByUser = new Map<string, PushReminderCandidate[]>();
    for (const reminder of reminders) {
      const list = remindersByUser.get(reminder.user_id) ?? [];
      list.push(reminder as PushReminderCandidate);
      remindersByUser.set(reminder.user_id, list);
    }

    const now = new Date();
    let sent = 0;
    let checked = 0;
    let failed = 0;
    for (const subscription of subscriptions) {
      const timezone = validTimeZone(subscription.timezone);
      const clock = localClockAt(now, timezone);
      const profile = profileByUser.get(subscription.user_id);
      if (!profile) continue;
      const preferences: PushNotificationPreferences = {
        enabled: profile.notifications_enabled === true,
        food: profile.notification_food !== false,
        water: profile.notification_water !== false,
        litter: profile.notification_litter !== false,
        health: profile.notification_health !== false,
        quietHours: profile.notification_quiet_hours !== false,
      };
      for (const reminder of remindersByUser.get(subscription.user_id) ?? []) {
        checked += 1;
        if (!shouldSendReminderNow(reminder, preferences, clock, now)) continue;

        const { data: delivery, error: insertError } = await supabase
          .from("push_deliveries")
          .insert({ subscription_id: subscription.id, reminder_id: reminder.id, local_date: clock.date })
          .select("id")
          .maybeSingle();
        if (insertError?.code === "23505") continue;
        if (insertError || !delivery) {
          failed += 1;
          continue;
        }

        const message = reminderMessage(reminder.type, reminder.title, reminder.time);
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        };
        try {
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({ ...message, tag: `reminder-${reminder.id}`, url: "/reminders" }),
            { TTL: 600, urgency: "normal" },
          );
          sent += 1;
        } catch (error) {
          await supabase.from("push_deliveries").delete().eq("id", delivery.id);
          const statusCode = (error as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
          } else {
            failed += 1;
          }
        }
      }
    }

    return Response.json({ sent, checked, failed });
  } catch {
    return Response.json({ error: "Push dispatch failed" }, { status: 500 });
  }
}
