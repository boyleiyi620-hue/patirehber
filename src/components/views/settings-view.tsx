"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  Database,
  Download,
  Heart,
  Info,
  Languages,
  Laptop,
  Moon,
  Palette,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Upload,
  User,
  Utensils,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { InstallPrompt } from "@/components/install-prompt";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/input";
import { Label, FieldHint } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  getNotificationPermission,
  permissionLabel,
  requestNotificationPermission,
} from "@/lib/notifications";
import { parseImportedData, STORAGE_KEY } from "@/lib/storage";
import { contentLanguageNotes } from "@/lib/i18n";
import { downloadJson, formatDateLong } from "@/lib/utils";
import type { Language, ThemeMode } from "@/lib/types";

const THEMES: Array<{ value: ThemeMode; label: string; icon: React.ReactNode }> = [
  { value: "light", label: "Açık", icon: <Sun className="h-4 w-4" aria-hidden="true" /> },
  { value: "dark", label: "Koyu", icon: <Moon className="h-4 w-4" aria-hidden="true" /> },
  {
    value: "system",
    label: "Sistem",
    icon: <Laptop className="h-4 w-4" aria-hidden="true" />,
  },
];

export function SettingsView() {
  const {
    data,
    cats,
    reminders,
    logs,
    settings,
    updateSettings,
    importData,
    resetData,
    notify,
    t,
  } = useApp();

  const [nameDraft, setNameDraft] = useState(settings.userName);
  const [nameSaved, setNameSaved] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetMode, setResetMode] = useState<"empty">("empty");
  const [importError, setImportError] = useState<string | null>(null);
  const [permission, setPermission] = useState(getNotificationPermission());
  const fileRef = useRef<HTMLInputElement>(null);

  const saveName = () => {
    const next = nameDraft.trim();
    if (next.length < 2) {
      notify("İsim en az 2 karakter olmalı.");
      return;
    }
    updateSettings({ userName: next });
    setNameSaved(true);
    notify("Profil güncellendi.");
    window.setTimeout(() => setNameSaved(false), 2000);
  };

  const askPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      updateSettings({ notifications: { ...settings.notifications, enabled: true } });
      notify("Bildirim izni verildi 🔔");
    } else if (result === "denied") {
      notify("Bildirim izni reddedildi.");
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const exportData = () => {
    if (!data) return;
    downloadJson(`patirehber-yedek-${new Date().toISOString().slice(0, 10)}.json`, data);
    notify("Yedek dosyası indirildi.");
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = parseImportedData(text);
      if (!parsed) {
        setImportError(
          "Dosya okunamadı veya geçersiz. PatiRehber'den dışa aktarılmış bir JSON dosyası seçin.",
        );
        return;
      }
      importData(parsed);
    } catch {
      setImportError("Dosya okunamadı. Lütfen tekrar deneyin.");
    }
  };

  const confirmReset = () => {
    resetData(resetMode);
    setResetOpen(false);
  };

  const sizeKb = (() => {
    if (!data) return 0;
    try {
      return Math.round(JSON.stringify(data).length / 1024);
    } catch {
      return 0;
    }
  })();

  return (
    <div>
      <PageHeader
        emoji="⚙️"
        title={t("settings.title")}
        subtitle="Profil, görünüm, bildirim ve veri tercihlerini yönet."
      />

      <div className="space-y-4">
        {/* Profil */}
        <SettingsCard
          icon={<User className="h-4 w-4" aria-hidden="true" />}
          title={t("settings.profile")}
          description="Ana sayfada kullanılan selamlama adı."
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Adın</Label>
              <div className="flex gap-2">
                <Input
                  id="profile-name"
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  maxLength={40}
                  placeholder="Örn. Ayşe"
                />
                <Button onClick={saveName}>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Kaydet
                </Button>
              </div>
              <FieldHint>
                {nameSaved
                  ? "Kaydedildi ✓"
                  : "Bu isim hesabına kaydedilir ve eşitlenir."}
              </FieldHint>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="meals-per-day">Günlük öğün hedefi</Label>
                <Select
                  id="meals-per-day"
                  value={String(settings.mealsPerDay)}
                  onChange={(event) =>
                    updateSettings({ mealsPerDay: Number(event.target.value) })
                  }
                >
                  {[1, 2, 3, 4, 5, 6].map((value) => (
                    <option key={value} value={value}>
                      {value} öğün
                    </option>
                  ))}
                </Select>
                <FieldHint>Bakım puanı bu hedefe göre hesaplanır.</FieldHint>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="portion-grams">Günlük mama (gram)</Label>
                <Input
                  id="portion-grams"
                  type="number"
                  inputMode="numeric"
                  min={10}
                  max={400}
                  value={settings.dailyPortionGrams}
                  onChange={(event) =>
                    updateSettings({
                      dailyPortionGrams: Math.max(
                        10,
                        Math.min(400, Number(event.target.value) || 10),
                      ),
                    })
                  }
                />
                <FieldHint>Raporlarda mama tüketim tahmini için kullanılır.</FieldHint>
              </div>
            </div>
          </div>
        </SettingsCard>

        {/* Görünüm */}
        <SettingsCard
          icon={<Palette className="h-4 w-4" aria-hidden="true" />}
          title={t("settings.appearance")}
          description="Tema ve dil tercihleri."
        >
          <div className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">{t("settings.theme")}</legend>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((theme) => (
                  <button
                    key={theme.value}
                    type="button"
                    role="radio"
                    aria-checked={settings.theme === theme.value}
                    onClick={() => updateSettings({ theme: theme.value })}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition ${
                      settings.theme === theme.value
                        ? "border-primary bg-primary/10 text-primary-strong"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {theme.icon}
                    {theme.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="flex items-center gap-1.5 text-sm font-semibold">
                <Languages className="h-4 w-4 text-primary-strong" aria-hidden="true" />
                {t("settings.language")}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "tr" as Language, label: "Türkçe", flag: "🇹🇷" },
                    { value: "en" as Language, label: "English", flag: "🇬🇧" },
                  ] as const
                ).map((language) => (
                  <button
                    key={language.value}
                    type="button"
                    role="radio"
                    aria-checked={settings.language === language.value}
                    onClick={() => updateSettings({ language: language.value })}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                      settings.language === language.value
                        ? "border-primary bg-primary/10 text-primary-strong"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <span aria-hidden="true">{language.flag}</span>
                    {language.label}
                  </button>
                ))}
              </div>
              <FieldHint>{contentLanguageNotes[settings.language]}</FieldHint>
            </fieldset>
          </div>
        </SettingsCard>

        {/* Bildirimler */}
        <SettingsCard
          icon={<Bell className="h-4 w-4" aria-hidden="true" />}
          title={t("settings.notifications")}
          description="Hangi hatırlatıcılar için bildirim almak istediğini seç."
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold">Bildirimler</p>
                <p className="text-[11px] text-muted-foreground">
                  {permissionLabel(permission)}
                </p>
              </div>
              <Switch
                checked={settings.notifications.enabled}
                onCheckedChange={(checked) =>
                  updateSettings({
                    notifications: { ...settings.notifications, enabled: checked },
                  })
                }
                label="Bildirimler açık"
              />
            </div>

            {permission !== "granted" ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
                <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-muted-foreground">
                  Yerel hatırlatma bildirimleri için tarayıcı izni gerekir.
                </p>
                {permission === "default" ? (
                  <Button size="sm" onClick={askPermission}>
                    İzin ver
                  </Button>
                ) : (
                  <Badge variant="outline">Tarayıcı ayarları</Badge>
                )}
              </div>
            ) : null}

            <div className="space-y-1">
              <ToggleRow
                title="Mama hatırlatıcıları"
                description="Öğün saatlerinde bildirim"
                checked={settings.notifications.food}
                onChange={(checked) =>
                  updateSettings({
                    notifications: { ...settings.notifications, food: checked },
                  })
                }
                label="Mama bildirimleri"
              />
              <ToggleRow
                title="Su hatırlatıcıları"
                description="Su kabını tazeleme zamanı"
                checked={settings.notifications.water}
                onChange={(checked) =>
                  updateSettings({
                    notifications: { ...settings.notifications, water: checked },
                  })
                }
                label="Su bildirimleri"
              />
              <ToggleRow
                title="Kum temizliği"
                description="Sabah ve akşam temizlik hatırlatması"
                checked={settings.notifications.litter}
                onChange={(checked) =>
                  updateSettings({
                    notifications: { ...settings.notifications, litter: checked },
                  })
                }
                label="Kum bildirimleri"
              />
              <ToggleRow
                title="Sağlık hatırlatıcıları"
                description="İlaç, parazit, aşı, veteriner ve kilo"
                checked={settings.notifications.health}
                onChange={(checked) =>
                  updateSettings({
                    notifications: { ...settings.notifications, health: checked },
                  })
                }
                label="Sağlık bildirimleri"
              />
              <ToggleRow
                title="Sessiz saatler (22:00 - 08:00)"
                description="Gece bildirim gönderilmez"
                checked={settings.notifications.quietHours}
                onChange={(checked) =>
                  updateSettings({
                    notifications: {
                      ...settings.notifications,
                      quietHours: checked,
                    },
                  })
                }
                label="Sessiz saatler"
              />
            </div>
          </div>
        </SettingsCard>

        {/* Kurulum */}
        <SettingsCard
          icon={<Smartphone className="h-4 w-4" aria-hidden="true" />}
          title={t("settings.install")}
          description={t("settings.install.desc")}
        >
          <InstallPrompt />
          {settings.installDismissed ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => updateSettings({ installDismissed: false })}
            >
              Kurulum önerisini tekrar göster
            </Button>
          ) : null}
        </SettingsCard>

        {/* Veri */}
        <SettingsCard
          icon={<Database className="h-4 w-4" aria-hidden="true" />}
          title={t("settings.data")}
          description="Verilerin hesabında eşitlenir; bu cihazda çevrimdışı kullanım için bir kopyası tutulur."
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Kedi" value={String(cats.length)} />
              <Stat label="Hatırlatıcı" value={String(reminders.length)} />
              <Stat label="Günlük kayıt" value={String(logs.length)} />
              <Stat label="Boyut" value={`${sizeKb} KB`} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                JSON dışa aktar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                Yedekten yükle
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) => {
                  void handleImport(event.target.files?.[0]);
                  event.target.value = "";
                }}
                aria-label="Yedek dosyası seç"
              />
            </div>

            {importError ? (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-2.5 py-2 text-[11px] leading-relaxed text-danger"
              >
                {importError}
              </p>
            ) : null}

            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-xs font-semibold">Yedek hakkında</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                Dışa aktarılan dosya tüm kedi profillerini, hatırlatıcıları ve
                bakım kayıtlarını içerir. Fotoğraflar veri boyutunu artırabilir.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/25 bg-destructive-soft px-3 py-2.5">
              <div>
                <p className="text-xs font-bold text-danger">
                  Verileri sıfırla
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Bu hesaptaki tüm kedi ve bakım kayıtlarını sil.
                </p>
              </div>
              <Button
                variant="destructive-soft"
                size="sm"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Sıfırla
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="mt-2 w-full"
              >
                Çıkış yap
              </Button>
            </div>
          </div>
        </SettingsCard>

        {/* Hakkında */}
        <SettingsCard
          icon={<Info className="h-4 w-4" aria-hidden="true" />}
          title={t("settings.about")}
          description="PatiRehber hakkında bilmen gerekenler."
        >
          <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl gradient-primary text-lg">
                🐾
              </span>
              <div>
                <p className="font-display text-base font-extrabold text-foreground">
                  PatiRehber
                </p>
                <p className="text-[11px]">Sürüm 1.0.0 · Kedi bakım rehberi</p>
              </div>
              <Badge variant="success" className="ms-auto">
                PWA
              </Badge>
            </div>

            <p>
              PatiRehber; mama, su, kum, aşı, kilo ve hatırlatıcı takibini tek
              yerde toplar. Giriş yaptığında veriler hesabınla Supabase üzerinde
              eşitlenir; çevrimdışı kullanım ve uygulama ayarları için bu cihazda
              da bir kopya tutulur.
            </p>

            <dl className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/50 p-2.5">
                <dt className="text-[10px] font-bold uppercase tracking-wide">
                  Depolama anahtarı
                </dt>
                <dd className="mt-0.5 font-mono text-[10px] break-all">{STORAGE_KEY}</dd>
              </div>
              <div className="rounded-xl bg-muted/50 p-2.5">
                <dt className="text-[10px] font-bold uppercase tracking-wide">
                  İlk açılış
                </dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {data ? formatDateLong(new Date(data.meta.createdAt)) : "—"}
                </dd>
              </div>
            </dl>

            <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/10 p-2.5 text-[11px] text-emerald-900 dark:text-emerald-100">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                <strong>Gizlilik:</strong> Arkadaşlarla yalnızca kedi adı, ırkı ve
                yaşı paylaşılır. Fotoğraf, sağlık geçmişi, kilo, mikroçip, notlar
                ve veteriner bilgileri özeldir. JSON yedeğini güvenli yerde tut.
              </p>
            </div>

            <p className="text-[10px]">
              İçerikler genel bilgilendirme amaçlıdır ve veteriner hekim
              tavsiyesi yerine geçmez. Acil durumlarda en yakın kliniğe
              başvurun.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <ButtonLink href="/emergency" variant="destructive-soft" size="sm">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Acil durum rehberi
              </ButtonLink>
              <ButtonLink href="/reports" variant="outline" size="sm">
                Raporlar
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>
        </SettingsCard>
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        Sevgiyle yapıldı
        <Heart className="h-3 w-3 text-primary-strong" aria-hidden="true" />
        PatiRehber
      </p>

      {/* Sıfırlama onayı */}
      <Dialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Verileri sıfırla"
        description="Bu işlem geri alınamaz; bu hesaptaki kayıtlar cihazdan ve bulut hesabından silinir. Önce yedek almanı öneririz."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={confirmReset}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Tüm verileri sil
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Tüm kedi profilleri, hatırlatıcılar ve bakım kayıtları bu cihazdan ve bulut hesabından kalıcı olarak silinecek.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3">
              <span className="text-xs">
                <span className="block font-bold">Tüm veriler silinecek</span>
                <span className="text-muted-foreground">
                  Tüm kedi profilleri, hatırlatıcılar ve bakım kayıtları kalıcı olarak silinecek.
                </span>
              </span>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function SettingsCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="animate-fade-in-up">
      <CardHeader className="flex-row items-start gap-2.5 pb-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-strong">
          {icon}
        </span>
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  label,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition hover:bg-muted/50">
      <div className="min-w-0">
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} label={label} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-2 py-2 text-center">
      <p className="font-display text-base font-extrabold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
