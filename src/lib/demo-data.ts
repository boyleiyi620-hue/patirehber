import type {
  AppData,
  Cat,
  DailyLog,
  Reminder,
  Settings,
  WeightEntry,
} from "./types";
import { addDays, dateKey, uid } from "./utils";

/** Varsayılan kullanıcı ayarları */
export function defaultSettings(): Settings {
  return {
    theme: "system",
    language: "tr",
    userName: "Kedi Dostu",
    activeCatId: null,
    mealsPerDay: 3,
    dailyPortionGrams: 55,
    notifications: {
      enabled: false,
      food: true,
      water: true,
      litter: true,
      health: true,
      quietHours: true,
    },
    onboarded: false,
    installDismissed: false,
    guideFavorites: [],
  };
}

/** Son N gün için gerçekçi demo bakım kayıtları */
function buildDemoLogs(catId: string): DailyLog[] {
  const logs: DailyLog[] = [];
  const today = new Date();

  // Son 6 gün: tam bakım (seri oluşsun)
  for (let i = 6; i >= 1; i -= 1) {
    const date = dateKey(addDays(today, -i));
    logs.push({
      id: `${date}:${catId}`,
      date,
      catId,
      mealsGiven: 3,
      waterChanged: true,
      litterCleaned: true,
      playMinutes: 20 + ((i * 5) % 15),
    });
  }

  // Bugün: mama 2/3, su değişti, kum bekliyor, oyun yapıldı
  const todayK = dateKey(today);
  logs.push({
    id: `${todayK}:${catId}`,
    date: todayK,
    catId,
    mealsGiven: 2,
    waterChanged: true,
    litterCleaned: false,
    playMinutes: 15,
  });

  // Grafikte çeşitlilik için daha eski günler
  for (let i = 13; i >= 7; i -= 1) {
    const date = dateKey(addDays(today, -i));
    const full = i % 3 !== 0;
    logs.push({
      id: `${date}:${catId}`,
      date,
      catId,
      mealsGiven: full ? 3 : 2,
      waterChanged: full,
      litterCleaned: i % 4 !== 0,
      playMinutes: full ? 15 + (i % 4) * 5 : 5,
    });
  }
  return logs;
}

function buildDemoCat(): Cat {
  const now = new Date();
  const birth = new Date(now.getFullYear() - 3, now.getMonth() - 4, 15);
  const weights: WeightEntry[] = [
    { id: uid("w"), date: dateKey(addDays(now, -150)), kg: 4.2 },
    { id: uid("w"), date: dateKey(addDays(now, -120)), kg: 4.3 },
    { id: uid("w"), date: dateKey(addDays(now, -90)), kg: 4.4 },
    { id: uid("w"), date: dateKey(addDays(now, -60)), kg: 4.5 },
    { id: uid("w"), date: dateKey(addDays(now, -30)), kg: 4.7 },
    { id: uid("w"), date: dateKey(addDays(now, -7)), kg: 4.6 },
  ];

  return {
    id: "cat_demo_mirmir",
    name: "Mırmır",
    breedId: "tekir",
    birthDate: dateKey(birth),
    gender: "female",
    weight: 4.6,
    neutered: true,
    activity: "medium",
    gallery: [],
    healthNotes:
      "Mevsimsel alerji (ilkbaharda hapşırma). İlaç kullanımı yok. Diş kontrolü 6 ayda bir yapılıyor.",
    notes:
      "Kapı zilinden korkuyor; ziyaretçi geldiğinde yatak odasına kaçıyor. Sevdiği oyuncak: tüy çubuğu.",
    vaccinations: [
      {
        id: uid("v"),
        name: "Karma (FVRCP)",
        date: dateKey(addDays(now, -240)),
        nextDate: dateKey(addDays(now, 125)),
      },
      {
        id: uid("v"),
        name: "Kuduz",
        date: dateKey(addDays(now, -210)),
        nextDate: dateKey(addDays(now, 155)),
      },
      {
        id: uid("v"),
        name: "İç/Dış Parazit",
        date: dateKey(addDays(now, -60)),
        nextDate: dateKey(addDays(now, 30)),
      },
    ],
    weightHistory: weights,
    vet: {
      name: "Dr. Elif Yılmaz",
      clinic: "Pati Veteriner Kliniği",
      phone: "0532 000 00 00",
    },
    adoptedAt: dateKey(new Date(now.getFullYear() - 3, 4, 20)),
    createdAt: new Date().toISOString(),
  };
}

function buildDemoReminders(catId: string): Reminder[] {
  const everyDay = [0, 1, 2, 3, 4, 5, 6];
  const recent = Array.from({ length: 5 }, (_, i) =>
    dateKey(addDays(new Date(), -(i + 1))),
  );

  const make = (
    type: Reminder["type"],
    title: string,
    time: string,
    extra: Partial<Reminder> = {},
  ): Reminder => ({
    id: uid("rem"),
    catId,
    type,
    title,
    time,
    days: everyDay,
    enabled: true,
    streak: 0,
    history: [],
    ...extra,
  });

  return [
    make("food", "Sabah maması", "08:00", { streak: 5, history: recent }),
    make("food", "Öğle maması", "13:00", { streak: 5, history: recent }),
    make("food", "Akşam maması", "19:00", { streak: 3, history: recent.slice(0, 3) }),
    make("water", "Su kabını tazele", "10:00", { streak: 5, history: recent }),
    make("litter", "Kum temizliği (sabah)", "09:00", {
      streak: 5,
      history: recent,
    }),
    make("litter", "Kum temizliği (akşam)", "21:00", {
      streak: 2,
      history: recent.slice(0, 2),
    }),
    make("play", "Oyun zamanı", "20:00", { streak: 4, history: recent.slice(0, 4) }),
    make("parasite", "Pire damlası", "11:00", {
      days: [1],
      note: "Ayda 1 kez, pazartesi günleri uygula.",
      streak: 1,
    }),
    make("vet", "Aşı & kontrol randevusu", "15:00", {
      days: [3],
      note: "Yıllık kontrol için kliniği arayın.",
    }),
    make("weight", "Kilo ölçümü", "12:00", {
      days: [0],
      note: "Aç karnına, aynı tartıda ölçün.",
    }),
  ];
}

/** İlk açılışta yüklenen demo veri seti */
export function createInitialData(): AppData {
  const cat = buildDemoCat();
  const settings = defaultSettings();
  settings.activeCatId = cat.id;
  settings.onboarded = false;

  return {
    version: 1,
    settings,
    cats: [cat],
    reminders: buildDemoReminders(cat.id),
    logs: buildDemoLogs(cat.id),
    tasks: [],
    healthEntries: [],
    guideChecklistEntries: [],
    meta: {
      createdAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
    },
  };
}
