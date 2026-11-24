import { createClient } from "@/lib/supabase/client";

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

export type PushSetupResult =
  | { ok: true; permission: "granted"; background: boolean; detail?: string }
  | { ok: false; permission: NotificationPermissionState; detail: string };

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

function decodeVapidKey(value: string): Uint8Array {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

/** Ask for permission and register this signed-in device for server-sent push. */
export async function enablePushNotifications(): Promise<PushSetupResult> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { ok: false, permission: "unsupported", detail: "Bu tarayıcı bildirimleri desteklemiyor." };
  }

  let permission: NotificationPermissionState = Notification.permission;
  if (permission === "default") permission = await requestNotificationPermission();
  if (permission !== "granted") {
    return {
      ok: false,
      permission,
      detail: permission === "denied"
        ? "Bildirim izni kapalı. Tarayıcı ayarlarından PatiRehber bildirimlerini açın."
        : "Bu cihaz bildirim izni vermedi.",
    };
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return {
      ok: true,
      permission: "granted",
      background: false,
      detail: "Bu tarayıcı arka plan push bildirimlerini desteklemiyor; uygulama açıkken hatırlatma gösterilecek.",
    };
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    return {
      ok: true,
      permission: "granted",
      background: false,
      detail: "Sunucu push anahtarı henüz ayarlı değil; uygulama açıkken hatırlatma gösterilecek.",
    };
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(vapidPublicKey).buffer as ArrayBuffer,
      });
    }

    const serialized = subscription.toJSON();
    if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) {
      return { ok: false, permission: "granted", detail: "Bu cihazın push aboneliği okunamadı. Tekrar deneyin." };
    }

    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { ok: false, permission: "granted", detail: "Bildirimleri hesaba bağlamak için tekrar giriş yapın." };
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: user.id,
      endpoint: serialized.endpoint,
      p256dh: serialized.keys.p256dh,
      auth: serialized.keys.auth,
      timezone: timezone.slice(0, 100),
      updated_at: new Date().toISOString(),
    }, { onConflict: "endpoint" });

    if (error) {
      await subscription.unsubscribe().catch(() => false);
      return {
        ok: false,
        permission: "granted",
        detail: "Push aboneliği kaydedilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.",
      };
    }

    return { ok: true, permission: "granted", background: true };
  } catch {
    return {
      ok: false,
      permission: "granted",
      detail: "Bu cihazda push bildirimi açılamadı. Uygulamayı güncelleyip tekrar deneyin.",
    };
  }
}

/** Remove the current browser's subscription; account preferences are saved separately. */
export async function disablePushNotifications(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", subscription.endpoint);
    if (error) throw error;
  }
  await subscription.unsubscribe();
}

/** Show a one-off/system notification (or use the service worker when available). */
export async function showNotification(title: string, body: string, tag?: string): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  try {
    const registration = "serviceWorker" in navigator
      ? await navigator.serviceWorker.getRegistration()
      : undefined;
    if (registration) {
      await registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag,
        lang: "tr",
        data: { url: "/reminders" },
      });
      return true;
    }
    new Notification(title, { body, icon: "/icons/icon-192.png", tag });
    return true;
  } catch {
    return false;
  }
}

export function isQuietHour(date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 22 || hour < 8;
}

export function permissionLabel(state: NotificationPermissionState): string {
  switch (state) {
    case "granted": return "İzin verildi";
    case "denied": return "Reddedildi — tarayıcı ayarlarından açın";
    case "unsupported": return "Bu tarayıcı bildirimi desteklemiyor";
    default: return "Henüz izin verilmedi";
  }
}
