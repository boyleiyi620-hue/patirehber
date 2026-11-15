/**
 * Bildirim yardımcıları.
 * Push altyapısına hazırdır: service worker `push` olayını dinler,
 * şimdilik yerel (local) zamanlanmış bildirimler kullanılır.
 */

export type NotificationPermissionState =
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return "denied";
  }
}

/** Service worker üzerinden (varsa) veya doğrudan bildirim gösterir */
export async function showNotification(
  title: string,
  body: string,
  tag?: string,
): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  try {
    const registration = await navigator.serviceWorker?.getRegistration();
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
    new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
      tag,
    });
    return true;
  } catch {
    return false;
  }
}

export function isQuietHour(date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 22 || hour < 8;
}

/** Bildirim izni durumunu Türkçe etikete çevirir */
export function permissionLabel(state: NotificationPermissionState): string {
  switch (state) {
    case "granted":
      return "İzin verildi";
    case "denied":
      return "Reddedildi — tarayıcı ayarlarından açın";
    case "unsupported":
      return "Bu tarayıcı bildirimi desteklemiyor";
    default:
      return "Henüz izin verilmedi";
  }
}
