/**
 * PatiRehber — veri modelleri
 * Hesap verileri Supabase ile eşitlenir; LocalStorage cihazdaki yerel kopyadır.
 */

export type ThemeMode = "light" | "dark" | "system";
export type Language = "tr" | "en";
export type Gender = "female" | "male";
export type ActivityLevel = "low" | "medium" | "high";

/** Veteriner bilgileri */
export interface VetInfo {
  name: string;
  clinic: string;
  phone: string;
  address?: string;
}

/** Aşı kaydı — `nextDate` bir sonraki doz / hatırlatma tarihi */
export interface Vaccination {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  nextDate?: string; // YYYY-MM-DD
}

/** Kilo ölçümü */
export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  kg: number;
}

/** Sağlık günlüğü kaydı */
export interface HealthEntry {
  id: string;
  catId: string;
  date: string; // YYYY-MM-DD
  type: "symptom" | "vet-visit" | "medication" | "note";
  title: string;
  note?: string;
  createdAt: string; // ISO
}

/** Kedi profili */
export interface Cat {
  id: string;
  name: string;
  breedId: string;
  birthDate: string; // YYYY-MM-DD
  gender: Gender;
  weight: number; // kg
  neutered: boolean;
  activity: ActivityLevel;
  photo?: string; // data URL (küçültülmüş)
  gallery: string[]; // data URL listesi
  healthNotes: string;
  notes: string;
  vaccinations: Vaccination[];
  weightHistory: WeightEntry[];
  vet?: VetInfo;
  adoptedAt?: string; // YYYY-MM-DD — sahiplenme tarihi
  color?: string; // tüy/renk tanımı
  microchip?: string; // mikroçip numarası
  insurance?: string; // sigorta / poliçe bilgisi
  allergies?: string; // bilinen alerjiler
  medications?: string; // düzenli kullanılan ilaçlar
  createdAt: string; // ISO
}

/** Görev türü — ikon ve renk seçimi için */
export type TaskKind =
  | "food"
  | "water"
  | "litter"
  | "play"
  | "medication"
  | "grooming"
  | "vet"
  | "custom";

/**
 * Bakım görevi.
 * `target` 1 ise tek dokunuşta tamamlanır; >1 ise her dokunuşta `progress` artar.
 * Tamamlanan görev kayıtları takvim geçmişi için korunur.
 */
export interface Task {
  id: string;
  catId: string | null; // null → tüm kediler
  title: string;
  emoji: string;
  kind: TaskKind;
  target: number; // 1-10
  progress: number; // 0..target
  progressByDate?: TaskDayProgress[];
  note?: string;
  repeat?: "none" | "daily" | "weekly";
  priority?: "low" | "medium" | "high";
  dueDate?: string; // YYYY-MM-DD
  createdAt: string; // ISO
  completedAt?: string; // ISO — tamamlandığı an
}

/** Bir görevin seçilen günde kaydedilen ilerlemesi */
export interface TaskDayProgress {
  date: string; // YYYY-MM-DD
  progress: number;
  completedAt?: string; // gerçek tamamlanma anı
}

export type ReminderType =
  | "food"
  | "water"
  | "litter"
  | "medication"
  | "parasite"
  | "vet"
  | "weight"
  | "play"
  | "special";

/** Hatırlatıcı / zamanlayıcı */
export interface Reminder {
  id: string;
  catId: string | null; // null → tüm kediler
  type: ReminderType;
  title: string;
  time: string; // HH:mm
  days: number[]; // 0 = Pazar ... 6 = Cumartesi (tümü: 0-6)
  enabled: boolean;
  lastCompleted?: string; // YYYY-MM-DD
  streak: number;
  history: string[]; // tamamlanan günler (YYYY-MM-DD)
  note?: string;
  snoozedUntil?: number; // epoch ms — "ertele" sonrası
}

/** Günlük bakım kaydı */
export interface DailyLog {
  id: string; // `${date}:${catId}`
  date: string; // YYYY-MM-DD
  catId: string;
  mealsGiven: number;
  waterChanged: boolean;
  litterCleaned: boolean;
  playMinutes: number;
  note?: string;
}

export interface NotificationPrefs {
  enabled: boolean;
  food: boolean;
  water: boolean;
  litter: boolean;
  health: boolean;
  /** 22:00 - 08:00 arasında bildirim gönderme */
  quietHours: boolean;
}

export interface Settings {
  theme: ThemeMode;
  language: Language;
  userName: string;
  activeCatId: string | null;
  mealsPerDay: number;
  /** Günlük tahmini mama miktarı (gram) — raporlar ve porsiyon hesabı için */
  dailyPortionGrams: number;
  notifications: NotificationPrefs;
  onboarded: boolean;
  installDismissed: boolean;
  /** Rehberde kaydedilen (favori) bölüm id'leri */
  guideFavorites: string[];
}

export interface AppData {
  version: number;
  settings: Settings;
  cats: Cat[];
  reminders: Reminder[];
  logs: DailyLog[];
  tasks: Task[];
  healthEntries: HealthEntry[];
  meta: {
    createdAt: string;
    lastOpenedAt: string;
  };
}

/** Rehber içeriği blokları */
export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "tip"; text: string }
  | { type: "warn"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] };

export interface GuideSection {
  id: string;
  title: string;
  summary: string;
  blocks: GuideBlock[];
}

export interface GuideCategory {
  id: string;
  title: string;
  emoji: string;
  description: string;
  /** Tailwind sınıf parçaları (kart rengi) */
  tint: string;
  sections: GuideSection[];
}

/** Irk verisi */
export type BreedActivityLevel =
  | "Düşük"
  | "Düşük-Orta"
  | "Orta"
  | "Orta-Yüksek"
  | "Yüksek"
  | "Çok yüksek";

export interface Breed {
  id: string;
  name: string;
  origin: string;
  lifespan: string;
  weight: string;
  coat: string;
  grooming: string;
  activity: BreedActivityLevel;
  description: string;
  traits: string[];
  careNotes: string[];
  healthRisks: string[];
}

/** Oyunlaştırma rozeti */
export interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  earned: boolean;
  progress?: { current: number; target: number };
}

/** Hesaplayıcı girdileri */
export type FoodType = "dry" | "wet";
export type AgeGroup = "kitten" | "adult" | "senior";
export type CalcActivity = "low" | "medium" | "high";
