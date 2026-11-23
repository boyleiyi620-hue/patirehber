"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Syringe,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/layout/page-header";
import { CatAvatar } from "@/components/layout/cat-avatar";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label, FieldHint } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { SearchSelect } from "@/components/ui/search-select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { breeds } from "@/lib/breeds";
import { optimizeImageFile } from "@/lib/image";
import type { ActivityLevel, Cat, Gender } from "@/lib/types";
import {
  breedName,
  dateKey,
  getCatAge,
  todayKey,
  uid,
} from "@/lib/utils";

type DraftVaccine = {
  id: string;
  name: string;
  date: string;
  nextDate: string;
};

const STEPS = [
  { title: "Temel bilgiler", hint: "İsim, cinsiyet ve ırk" },
  { title: "Yaş & vücut", hint: "Doğum tarihi, kilo, aktivite" },
  { title: "Fotoğraf & sağlık", hint: "Fotoğraf ve sağlık notları" },
  { title: "Aşı takvimi", hint: "Aşıları ekle ve özeti onayla" },
];

const activityOptions: Array<{ value: ActivityLevel; label: string; hint: string }> = [
  { value: "low", label: "Sakin", hint: "Az hareket, çoğunlukla uyur" },
  { value: "medium", label: "Orta", hint: "Günlük oyun ve keşif" },
  { value: "high", label: "Çok aktif", hint: "Sürekli hareket, tırmanma" },
];

export function CatWizardView() {
  const router = useRouter();
  const { addCat } = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [breedId, setBreedId] = useState("tekir");
  const [birthDate, setBirthDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 2);
    return dateKey(date);
  });
  const [weight, setWeight] = useState("4");
  const [neutered, setNeutered] = useState(false);
  const [activity, setActivity] = useState<ActivityLevel>("medium");
  const [photo, setPhoto] = useState<string | undefined>();
  const [healthNotes, setHealthNotes] = useState("");
  const [vaccines, setVaccines] = useState<DraftVaccine[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const today = todayKey();
  const parsedWeight = Number(weight.replace(",", "."));
  const weightValid =
    Number.isFinite(parsedWeight) && parsedWeight >= 0.4 && parsedWeight <= 20;
  const agePreview = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
    return getCatAge(birthDate);
  }, [birthDate]);

  const breedOptions = useMemo(
    () =>
      breeds.map((breed) => ({
        value: breed.id,
        label: breed.name,
        meta: `${breed.origin} · ${breed.weight} · ${breed.activity} aktivite`,
        keywords: breed.traits.join(" "),
      })),
    [],
  );

  const validateStep = (index: number): string | null => {
    if (index === 0) {
      if (name.trim().length < 2) return "Kedinin adı en az 2 karakter olmalı.";
      if (!breeds.some((breed) => breed.id === breedId))
        return "Lütfen bir ırk seçin.";
    }
    if (index === 1) {
      if (!birthDate) return "Doğum tarihini seçin.";
      if (birthDate > today) return "Doğum tarihi bugünden ileri olamaz.";
      if (!weightValid) return "Kilo 0,4 ile 20 kg arasında olmalı.";
    }
    return null;
  };

  const next = () => {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(STEPS.length - 1, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setError(null);
    if (step === 0) {
      router.push("/cats");
      return;
    }
    setStep((prev) => Math.max(0, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePhoto = async (file?: File) => {
    if (!file) return;
    setPhotoBusy(true);
    setError(null);
    try {
      const optimized = await optimizeImageFile(file);
      setPhoto(optimized);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Fotoğraf yüklenemedi.",
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const addVaccine = (label: string) => {
    setVaccines((prev) => [
      ...prev,
      { id: uid("draft"), name: label, date: today, nextDate: "" },
    ]);
  };

  const save = () => {
    if (!weightValid) {
      setError("Kilo 0,4 ile 20 kg arasında olmalı.");
      setStep(1);
      return;
    }
    setSaving(true);
    const cat: Cat = {
      id: uid("cat"),
      name: name.trim(),
      breedId,
      birthDate,
      gender,
      weight: parsedWeight,
      neutered,
      activity,
      photo,
      gallery: [],
      healthNotes: healthNotes.trim(),
      notes: "",
      vaccinations: vaccines
        .filter((vaccine) => vaccine.name.trim() && vaccine.date)
        .map((vaccine) => ({
          id: uid("v"),
          name: vaccine.name.trim(),
          date: vaccine.date,
          nextDate: vaccine.nextDate || undefined,
        })),
      weightHistory: [
        { id: uid("w"), date: today, kg: parsedWeight },
      ],
      createdAt: new Date().toISOString(),
    };
    addCat(cat);
    router.push(`/cats/${cat.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        emoji="🐣"
        title="Yeni kedi ekle"
        subtitle="4 kısa adımda kedinin profilini oluştur."
        backHref="/cats"
        backLabel="Kedilerim"
      />

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>
            Adım {step + 1} / {STEPS.length} · {STEPS[step].title}
          </span>
          <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <Progress
          value={step + 1}
          max={STEPS.length}
          label={`Kedi ekleme adımı ${step + 1}`}
        />
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>{STEPS[step].title}</CardTitle>
          <p className="text-xs text-muted-foreground">{STEPS[step].hint}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-danger"
            >
              {error}
            </div>
          ) : null}

          {step === 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="cat-name">Kedinin adı *</Label>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Örn. Mırmır"
                  maxLength={40}
                  autoComplete="off"
                  aria-describedby="cat-name-hint"
                  autoFocus
                />
                <FieldHint id="cat-name-hint">
                  Profilde ve hatırlatıcılarda bu isim kullanılır.
                </FieldHint>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">Cinsiyet</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "female" as Gender, label: "Dişi", emoji: "♀" },
                      { value: "male" as Gender, label: "Erkek", emoji: "♂" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={gender === option.value}
                      onClick={() => setGender(option.value)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                        gender === option.value
                          ? "border-primary bg-primary/10 text-primary-strong"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <span aria-hidden="true" className="text-base">
                        {option.emoji}
                      </span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="cat-breed">Irk *</Label>
                <SearchSelect
                  id="cat-breed"
                  options={breedOptions}
                  value={breedId}
                  onChange={setBreedId}
                  placeholder="Irk seçin"
                  searchPlaceholder="Irk ara (örn. Van, British…)"
                  aria-label="Kedi ırkı"
                />
                <FieldHint>
                  51 ırk arasından arayabilirsin. Emin değilsen “Tekir (Melez)”
                  seçebilirsin.
                </FieldHint>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="cat-birth">Doğum tarihi *</Label>
                <Input
                  id="cat-birth"
                  type="date"
                  value={birthDate}
                  max={today}
                  onChange={(event) => setBirthDate(event.target.value)}
                  aria-describedby="cat-birth-hint"
                />
                <FieldHint id="cat-birth-hint">
                  {agePreview
                    ? `Yaklaşık yaş: ${agePreview.label} · insan yaşı karşılığı ~${Math.max(0, Math.round(agePreview.years * 4 + (agePreview.years < 2 ? 20 : 16)))}`
                    : "Kesin doğum tarihi bilinmiyorsa tahmini bir tarih seçin."}
                </FieldHint>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cat-weight">Kilo (kg) *</Label>
                <Input
                  id="cat-weight"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0.4"
                  max="20"
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  aria-describedby="cat-weight-hint"
                />
                <FieldHint id="cat-weight-hint" error={Boolean(weight) && !weightValid}>
                  {weightValid
                    ? "İdeal aralık çoğu yetişkin kedi için 3-5 kg'dır; ırkına göre değişebilir."
                    : "0,4 - 20 kg arasında bir değer girin."}
                </FieldHint>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-3.5 py-3">
                <div>
                  <p className="text-sm font-semibold">Kısırlaştırıldı mı?</p>
                  <p className="text-[11px] text-muted-foreground">
                    Kısır kedilerin enerji ihtiyacı daha düşüktür.
                  </p>
                </div>
                <Switch
                  checked={neutered}
                  onCheckedChange={setNeutered}
                  label="Kısırlaştırma durumu"
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">Aktivite seviyesi</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {activityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={activity === option.value}
                      onClick={() => setActivity(option.value)}
                      className={`rounded-xl border px-3 py-2.5 text-start transition ${
                        activity === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <span className="block text-sm font-bold">{option.label}</span>
                      <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                        {option.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="space-y-2">
                <Label>Profil fotoğrafı</Label>
                <div className="flex items-center gap-3">
                  {photo ? (
                    <div className="relative">
                      <CatAvatar name={name || "Kedi"} photo={photo} size="xl" />
                      <button
                        type="button"
                        onClick={() => setPhoto(undefined)}
                        className="absolute -end-1.5 -top-1.5 grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-danger shadow-sm transition hover:bg-destructive/10"
                        aria-label="Fotoğrafı kaldır"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground">
                      <Camera className="h-6 w-6" aria-hidden="true" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="cat-photo"
                      className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold transition hover:border-primary/40 hover:text-primary-strong"
                    >
                      {photoBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {photo ? "Fotoğrafı değiştir" : "Fotoğraf yükle"}
                    </label>
                    <input
                      id="cat-photo"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        void handlePhoto(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                      disabled={photoBusy}
                    />
                    <p className="text-[10px] leading-snug text-muted-foreground">
                      JPG/PNG · en fazla 12 MB. Fotoğraf cihazda küçültülür.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cat-health">Sağlık notları</Label>
                <Textarea
                  id="cat-health"
                  value={healthNotes}
                  onChange={(event) => setHealthNotes(event.target.value)}
                  placeholder="Alerji, kronik hastalık, kullandığı ilaçlar, geçirilmiş ameliyatlar…"
                  maxLength={3000}
                  rows={4}
                />
                <FieldHint>
                  {healthNotes.length}/3000 · İsteğe bağlı. Daha sonra profilden
                  güncelleyebilirsin.
                </FieldHint>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-bold">
                  <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                      Verilerin hesabınla eşitlenir
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Kayıtların Supabase hesabında ve bu cihazdaki yerel kopyada tutulur.
                  Arkadaşlara sağlık ve iletişim bilgileri gösterilmez.
                </p>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addVaccine("Karma (FVRCP)")}
                >
                  <Syringe className="h-3.5 w-3.5" aria-hidden="true" />
                  Karma ekle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addVaccine("Kuduz")}
                >
                  <Syringe className="h-3.5 w-3.5" aria-hidden="true" />
                  Kuduz ekle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addVaccine("İç/Dış Parazit")}
                >
                  <Syringe className="h-3.5 w-3.5" aria-hidden="true" />
                  Parazit ekle
                </Button>
              </div>

              {vaccines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5 text-center">
                  <p className="text-xs font-semibold">Henüz aşı eklenmedi</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    Aşı geçmişini şimdi ekleyebilir veya profilden sonra
                    kaydedebilirsin.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {vaccines.map((vaccine, index) => (
                    <div
                      key={vaccine.id}
                      className="space-y-2 rounded-xl border border-border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          value={vaccine.name}
                          onChange={(event) =>
                            setVaccines((prev) =>
                              prev.map((item) =>
                                item.id === vaccine.id
                                  ? { ...item, name: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Aşı adı"
                          aria-label={`${index + 1}. aşı adı`}
                          className="h-9"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setVaccines((prev) =>
                              prev.filter((item) => item.id !== vaccine.id),
                            )
                          }
                          aria-label={`${vaccine.name || "Aşı"} kaydını kaldır`}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label
                            htmlFor={`vaccine-date-${vaccine.id}`}
                            className="text-[11px] text-muted-foreground"
                          >
                            Tarih
                          </Label>
                          <Input
                            id={`vaccine-date-${vaccine.id}`}
                            type="date"
                            value={vaccine.date}
                            max={today}
                            onChange={(event) =>
                              setVaccines((prev) =>
                                prev.map((item) =>
                                  item.id === vaccine.id
                                    ? { ...item, date: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="mt-1 h-9"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor={`vaccine-next-${vaccine.id}`}
                            className="text-[11px] text-muted-foreground"
                          >
                            Sonraki doz
                          </Label>
                          <Input
                            id={`vaccine-next-${vaccine.id}`}
                            type="date"
                            value={vaccine.nextDate}
                            onChange={(event) =>
                              setVaccines((prev) =>
                                prev.map((item) =>
                                  item.id === vaccine.id
                                    ? { ...item, nextDate: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="mt-1 h-9"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5">
                <p className="text-xs font-extrabold">Özet</p>
                <dl className="mt-2 space-y-1 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Ad</dt>
                    <dd className="font-semibold">{name || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Irk</dt>
                    <dd className="font-semibold">{breedName(breedId)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Yaş</dt>
                    <dd className="font-semibold">{agePreview?.label ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Kilo</dt>
                    <dd className="font-semibold">
                      {weightValid ? `${parsedWeight} kg` : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Cinsiyet</dt>
                    <dd className="font-semibold">
                      {gender === "female" ? "Dişi" : "Erkek"}
                      {neutered ? " · Kısır" : ""}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Aşı kaydı</dt>
                    <dd className="font-semibold">{vaccines.length} adet</dd>
                  </div>
                </dl>
                <p className="mt-2.5 flex items-start gap-1 text-[10px] leading-relaxed text-muted-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" aria-hidden="true" />
                  Kaydettiğinde mama, su, kum ve oyun için 7 temel hatırlatıcı
                  otomatik oluşturulur. Tümünü daha sonra düzenleyebilirsin.
                </p>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={back}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {step === 0 ? "İptal" : "Geri"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>
            Devam
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            Kaydet ve profili aç
          </Button>
        )}
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Zorunlu alanlar * ile işaretlidir. Bilgileri daha sonra profilden
        düzenleyebilirsin.
      </p>
    </div>
  );
}
