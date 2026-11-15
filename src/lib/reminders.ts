import type { Reminder } from "./types";
import { uid } from "./utils";

const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

/**
 * Yeni bir kedi eklendiğinde oluşturulan temel bakım hatırlatıcıları.
 * Kullanıcı bunları Hatırlatıcılar sekmesinden düzenleyebilir veya kapatabilir.
 */
export function defaultRemindersForCat(catId: string): Reminder[] {
  const make = (
    type: Reminder["type"],
    title: string,
    time: string,
    note?: string,
  ): Reminder => ({
    id: uid("rem"),
    catId,
    type,
    title,
    time,
    days: [...EVERY_DAY],
    enabled: true,
    streak: 0,
    history: [],
    note,
  });

  return [
    make("food", "Sabah maması", "08:00", "Güne hafif bir öğünle başla."),
    make("food", "Öğle maması", "13:00"),
    make("food", "Akşam maması", "19:00", "Günün son öğünü."),
    make("water", "Su kabını tazele", "10:00"),
    make("litter", "Kum temizliği (sabah)", "09:00"),
    make("litter", "Kum temizliği (akşam)", "21:00"),
    make("play", "Oyun zamanı", "20:00", "10-15 dakika avlanma oyunu."),
  ];
}
