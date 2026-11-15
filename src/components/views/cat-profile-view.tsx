"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Cake,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Droplets,
  HeartPulse,
  ImagePlus,
  Info,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  Trash2,
  Utensils,
  Weight,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/providers/app-provider";
import { CatAvatar } from "@/components/layout/cat-avatar";
import { WeightChart } from "@/components/cats/weight-chart";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Label, FieldHint } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { getBreed } from "@/lib/utils";
import { BreedDetailDialog } from "@/components/guide/breed-detail";
import { breeds } from "@/lib/breeds";
import { calculatePortion, waterNeed } from "@/lib/calculators";
import { optimizeImageFile } from "@/lib/image";
import type { ActivityLevel, Cat, Gender, HealthEntry } from "@/lib/types";
import {
  breedName,
  computeStreak,
  dayScore,
  findLog,
  formatDateLong,
  formatDateWithWeekday,
  getCatAge,
  parseDateKey,
  todayKey,
} from "@/lib/utils";

const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  low: "Sakin",
  medium: "Orta",
  high: "Çok aktif",
};

/** Yıl dönümüne kalan gün sayısı */
function daysUntilAnniversary(dateString?: string): number | null {
  if (!dateString) return null;
  const source = parseDateKey(dateString);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next = new Date(now.getFullYear(), source.getMonth(), source.getDate());
  if (next < startOfToday) next.setFullYear(now.getFullYear() + 1);
  return Math.round((next.getTime() - startOfToday.getTime()) / 86_400_000);
}

export function CatProfileView({ catId }: { catId: string }) {
  const { cats } = useApp();
  const cat = cats.find((item) => item.id === catId);

  if (!cat) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <EmptyState
          emoji="🐈"
          title="Kedi bulunamadı"
          description="Bu profil silinmiş veya bağlantı hatalı olabilir."
          action={<ButtonLink href="/cats">Kedilerime dön</ButtonLink>}
        />
      </div>
    );
  }

  return <CatProfileInner key={cat.id} cat={cat} />;
}

function CatProfileInner({ cat }: { cat: Cat }) {
  const router = useRouter();
  const {
    activeCatId,
    setActiveCat,
    logs,
    settings,
    reminders,
    updateCat,
    addWeight,
    deleteWeight,
    addVaccination,
    deleteVaccination,
    addGalleryPhoto,
    removeGalleryPhoto,
    deleteCat,
    healthEntries,
    addHealthEntry,
    deleteHealthEntry,
    notify,
  } = useApp();

  const [tab, setTab] = useState("genel");
  const [breedOpen, setBreedOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [vaccineOpen, setVaccineOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Düzenleme formu
  const [editName, setEditName] = useState(cat.name);
  const [editBirth, setEditBirth] = useState(cat.birthDate);
  const [editGender, setEditGender] = useState<Gender>(cat.gender);
  const [editWeight, setEditWeight] = useState(String(cat.weight));
  const [editNeutered, setEditNeutered] = useState(cat.neutered);
  const [editActivity, setEditActivity] = useState<ActivityLevel>(cat.activity);
  const [editAdopted, setEditAdopted] = useState(cat.adoptedAt ?? "");
  const [editVetName, setEditVetName] = useState(cat.vet?.name ?? "");
  const [editVetClinic, setEditVetClinic] = useState(cat.vet?.clinic ?? "");
  const [editVetPhone, setEditVetPhone] = useState(cat.vet?.phone ?? "");
  const [editVetAddress, setEditVetAddress] = useState(cat.vet?.address ?? "");
  const [editBreedId, setEditBreedId] = useState(cat.breedId);
  const [editColor, setEditColor] = useState(cat.color ?? "");
  const [editMicrochip, setEditMicrochip] = useState(cat.microchip ?? "");
  const [editInsurance, setEditInsurance] = useState(cat.insurance ?? "");
  const [editAllergies, setEditAllergies] = useState(cat.allergies ?? "");
  const [editMedications, setEditMedications] = useState(cat.medications ?? "");
  const [editPhoto, setEditPhoto] = useState<string | undefined>(cat.photo);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Aşı formu
  const [vName, setVName] = useState("Karma (FVRCP)");
  const [vDate, setVDate] = useState(todayKey());
  const [vNext, setVNext] = useState("");
  const [vError, setVError] = useState<string | null>(null);

  // Kilo formu
  const [weightInput, setWeightInput] = useState("");
  const [weightError, setWeightError] = useState<string | null>(null);

  // Galeri
  const [galleryBusy, setGalleryBusy] = useState(false);

  // Sağlık günlüğü formu
  const [healthType, setHealthType] = useState<"symptom" | "vet-visit" | "medication" | "note">("note");
  const [healthTitle, setHealthTitle] = useState("");
  const [healthDate, setHealthDate] = useState(todayKey());
  const [healthNote, setHealthNote] = useState("");

  // Notlar
  const [notesDraft, setNotesDraft] = useState(cat.notes);
  const [healthDraft, setHealthDraft] = useState(cat.healthNotes);
  const [notesSaved, setNotesSaved] = useState(false);

  const age = getCatAge(cat.birthDate);
  const breed = getBreed(cat.breedId);
  const isActive = activeCatId === cat.id;
  const log = findLog(logs, cat.id);
  const score = dayScore(log, settings.mealsPerDay);
  const streak = computeStreak(logs, cat.id, settings.mealsPerDay);
  const catReminders = reminders.filter((reminder) => reminder.catId === cat.id);
  const portion = calculatePortion({
    weightKg: cat.weight,
    ageGroup: age.group,
    activity: cat.activity,
    neutered: cat.neutered,
    mealsPerDay: settings.mealsPerDay,
  });
  const water = waterNeed(cat.weight);
  const birthdayIn = daysUntilAnniversary(cat.birthDate);
  const adoptionIn = daysUntilAnniversary(cat.adoptedAt);

  const sortedVaccines = [...cat.vaccinations].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const overdueVaccines = cat.vaccinations.filter(
    (vaccine) => vaccine.nextDate && vaccine.nextDate < todayKey(),
  );

  const openEdit = () => {
    setEditName(cat.name);
    setEditBirth(cat.birthDate);
    setEditGender(cat.gender);
    setEditWeight(String(cat.weight));
    setEditNeutered(cat.neutered);
    setEditActivity(cat.activity);
    setEditAdopted(cat.adoptedAt ?? "");
    setEditVetName(cat.vet?.name ?? "");
    setEditVetClinic(cat.vet?.clinic ?? "");
    setEditVetPhone(cat.vet?.phone ?? "");
    setEditVetAddress(cat.vet?.address ?? "");
    setEditBreedId(cat.breedId);
    setEditColor(cat.color ?? "");
    setEditMicrochip(cat.microchip ?? "");
    setEditInsurance(cat.insurance ?? "");
    setEditAllergies(cat.allergies ?? "");
    setEditMedications(cat.medications ?? "");
    setEditPhoto(cat.photo);
    setEditError(null);
    setEditOpen(true);
  };

  const saveEdit = () => {
    const weightValue = Number(editWeight.replace(",", "."));
    if (editName.trim().length < 2) {
      setEditError("Ad en az 2 karakter olmalı.");
      return;
    }
    if (!editBirth || editBirth > todayKey()) {
      setEditError("Geçerli bir doğum tarihi seçin.");
      return;
    }
    if (!Number.isFinite(weightValue) || weightValue < 0.4 || weightValue > 20) {
      setEditError("Kilo 0,4 - 20 kg arasında olmalı.");
      return;
    }
    updateCat(cat.id, {
      name: editName.trim(),
      breedId: editBreedId,
      birthDate: editBirth,
      gender: editGender,
      weight: weightValue,
      neutered: editNeutered,
      activity: editActivity,
      adoptedAt: editAdopted || undefined,
      color: editColor.trim() || undefined,
      microchip: editMicrochip.trim() || undefined,
      insurance: editInsurance.trim() || undefined,
      allergies: editAllergies.trim() || undefined,
      medications: editMedications.trim() || undefined,
      photo: editPhoto,
      vet:
        editVetName || editVetClinic || editVetPhone || editVetAddress
          ? {
              name: editVetName.trim(),
              clinic: editVetClinic.trim(),
              phone: editVetPhone.trim(),
              address: editVetAddress.trim() || undefined,
            }
          : undefined,
    });
    if (Math.abs(weightValue - cat.weight) > 0.001) addWeight(cat.id, weightValue);
    setEditOpen(false);
    notify("Profil güncellendi.");
  };

  const handleEditPhoto = async (file?: File) => {
    if (!file) return;
    setEditBusy(true);
    try {
      setEditPhoto(await optimizeImageFile(file));
    } catch (error) {
      notify(error instanceof Error ? error.message : "Fotoğraf yüklenemedi.");
    } finally {
      setEditBusy(false);
    }
  };

  const saveVaccine = () => {
    if (vName.trim().length < 2) {
      setVError("Aşı adı girin.");
      return;
    }
    if (!vDate) {
      setVError("Aşı tarihini seçin.");
      return;
    }
    addVaccination(cat.id, {
      name: vName.trim(),
      date: vDate,
      nextDate: vNext || undefined,
    });
    setVaccineOpen(false);
    setVError(null);
    setVNext("");
    setVDate(todayKey());
    setVName("Karma (FVRCP)");
  };

  const saveWeight = () => {
    const value = Number(weightInput.replace(",", "."));
    if (!Number.isFinite(value) || value < 0.4 || value > 20) {
      setWeightError("0,4 - 20 kg arasında bir değer girin.");
      return;
    }
    addWeight(cat.id, value);
    setWeightInput("");
    setWeightError(null);
  };

  const handleGalleryUpload = async (file?: File) => {
    if (!file) return;
    setGalleryBusy(true);
    try {
      addGalleryPhoto(cat.id, await optimizeImageFile(file, 900, 0.8));
    } catch (error) {
      notify(error instanceof Error ? error.message : "Fotoğraf yüklenemedi.");
    } finally {
      setGalleryBusy(false);
    }
  };

  const saveNotes = () => {
    updateCat(cat.id, { notes: notesDraft, healthNotes: healthDraft });
    setNotesSaved(true);
    notify("Notlar kaydedildi.");
    window.setTimeout(() => setNotesSaved(false), 2000);
  };

  const recommendations: string[] = [];
  if (age.group === "kitten") {
    recommendations.push(
      "Yavru döneminde 4 öğün ve yüksek proteinli yavru maması önerilir; aşı serisini tamamlayın.",
    );
  } else if (age.group === "senior") {
    recommendations.push(
      "7 yaş üstü kedilerde yılda iki kez veteriner kontrolü ve böbrek değerleri takibi önerilir.",
    );
  } else {
    recommendations.push(
      "Yetişkin dönemde yılda bir kez aşı ve diş kontrolü yaptırın.",
    );
  }
  if (cat.neutered) {
    recommendations.push(
      "Kısır kedilerde enerji ihtiyacı düşer; porsiyonu ideal kiloya göre ayarlayın.",
    );
  }
  if (cat.activity === "low") {
    recommendations.push(
      "Günde en az 2 kez 10-15 dakikalık oyunla hareketi artırın.",
    );
  }
  if (age.group !== "kitten") {
    recommendations.push(
      "Ayda bir kilo ölçümü yapın; ani değişimleri veterinerinize bildirin.",
    );
  }
  if (overdueVaccines.length > 0) {
    recommendations.push(
      `${overdueVaccines.length} aşının tarihi geçmiş görünüyor. Kliniğinizi arayın.`,
    );
  }
  if (breed?.healthRisks.length) {
    recommendations.push(
      `${breed.name} ırkında ${breed.healthRisks.slice(0, 2).join(" ve ")} riskleri izlenmelidir.`,
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/cats"
        className="inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-muted-foreground transition hover:text-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Kedilerim
      </Link>

      {/* Profil başlığı */}
      <section
        aria-label={`${cat.name} profili`}
        className="animate-fade-in-up overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card"
      >
        <div className="gradient-cream p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <CatAvatar name={cat.name} photo={cat.photo} size="xl" ring />
              <label
                htmlFor="profile-photo"
                className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-card transition hover:bg-primary/90"
                aria-label="Profil fotografini degistir"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
              </label>
              <input
                id="profile-photo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const optimized = await optimizeImageFile(file);
                    updateCat(cat.id, { photo: optimized });
                    notify("Profil fotografi guncellendi.");
                  } catch (error) {
                    notify(error instanceof Error ? error.message : "Fotograf yuklenemedi.");
                  }
                  event.target.value = "";
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-extrabold tracking-tight">
                  {cat.name}
                </h1>
                {isActive ? <Badge variant="default">Aktif kedi</Badge> : null}
                {cat.neutered ? <Badge variant="success">Kısır</Badge> : null}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {breedName(cat.breedId)} · {age.label} ·{" "}
                {cat.gender === "female" ? "Dişi" : "Erkek"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                <span className="rounded-full bg-card/80 px-2 py-0.5">
                  {cat.weight.toLocaleString("tr-TR")} kg
                </span>
                <span className="rounded-full bg-card/80 px-2 py-0.5">
                  {ACTIVITY_LABEL[cat.activity]} aktivite
                </span>
                <span className="rounded-full bg-card/80 px-2 py-0.5">
                  Bugün {score}/100
                </span>
                <span className="rounded-full bg-card/80 px-2 py-0.5">
                  🔥 {streak} gün seri
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Düzenle
              </Button>
              {!isActive ? (
                <Button size="sm" onClick={() => setActiveCat(cat.id)}>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Aktif yap
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {(birthdayIn !== null && birthdayIn <= 30) ||
        (adoptionIn !== null && adoptionIn <= 30) ? (
          <div className="flex flex-wrap gap-2 border-t border-border/60 bg-primary/5 px-5 py-2.5 text-[11px] font-semibold text-primary-strong">
            {birthdayIn !== null && birthdayIn <= 30 ? (
              <span className="inline-flex items-center gap-1">
                <Cake className="h-3.5 w-3.5" aria-hidden="true" />
                {birthdayIn === 0
                  ? "Bugün doğum günü! 🎉"
                  : `Doğum gününe ${birthdayIn} gün`}
              </span>
            ) : null}
            {adoptionIn !== null && adoptionIn <= 30 ? (
              <span className="inline-flex items-center gap-1">
                <HeartPulse className="h-3.5 w-3.5" aria-hidden="true" />
                Sahiplenme yıl dönümüne {adoptionIn} gün
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      <Tabs
        ariaLabel={`${cat.name} profil sekmeleri`}
        value={tab}
        onValueChange={setTab}
        items={[
          { value: "genel", label: "Genel", icon: <Info className="h-3.5 w-3.5" aria-hidden="true" /> },
          { value: "bakim", label: "Bakım", icon: <HeartPulse className="h-3.5 w-3.5" aria-hidden="true" /> },
          { value: "asi", label: "Aşılar", icon: <Syringe className="h-3.5 w-3.5" aria-hidden="true" /> },
          { value: "kilo", label: "Kilo", icon: <Weight className="h-3.5 w-3.5" aria-hidden="true" /> },
          { value: "galeri", label: "Galeri", icon: <Camera className="h-3.5 w-3.5" aria-hidden="true" /> },
          { value: "notlar", label: "Notlar", icon: <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> },
          { value: "zaman", label: "Zaman çizelgesi", icon: <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> },
          { value: "saglik", label: "Sağlık günlüğü", icon: <HeartPulse className="h-3.5 w-3.5" aria-hidden="true" /> },
        ]}
      />

      <TabPanel value="genel" activeValue={tab} label="Genel bilgiler">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Genel bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-3 gap-y-3">
              <InfoItem label="Doğum tarihi" value={formatDateLong(cat.birthDate)} />
              <InfoItem label="Yaş" value={age.label} />
              <InfoItem
                label="Cinsiyet"
                value={cat.gender === "female" ? "Dişi" : "Erkek"}
              />
              <InfoItem label="Kısır" value={cat.neutered ? "Evet" : "Hayır"} />
              <InfoItem label="Kilo" value={`${cat.weight.toLocaleString("tr-TR")} kg`} />
              <InfoItem label="Aktivite" value={ACTIVITY_LABEL[cat.activity]} />
              <InfoItem label="Irk" value={getBreed(cat.breedId)?.name ?? cat.breedId} />
              <InfoItem label="Tuy rengi" value={cat.color ?? "Belirtilmedi"} />
              <InfoItem label="Mikrocip" value={cat.microchip ?? "Belirtilmedi"} />
              <InfoItem label="Sigorta" value={cat.insurance ?? "Belirtilmedi"} />
              <InfoItem
                label="Sahiplenme"
                value={cat.adoptedAt ? formatDateLong(cat.adoptedAt) : "Belirtilmedi"}
              />
              <InfoItem
                label="Alerjiler"
                value={cat.allergies ?? "Belirtilmedi"}
              />
              <InfoItem
                label="Duzenli ilaclar"
                value={cat.medications ?? "Belirtilmedi"}
              />
              <InfoItem
                label="Profil tarihi"
                value={formatDateLong(new Date(cat.createdAt))}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Sağlık notları</CardTitle>
              </CardHeader>
              <CardContent>
                {cat.healthNotes ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {cat.healthNotes}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Henüz sağlık notu eklenmemiş. Notlar sekmesinden
                    ekleyebilirsin.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-primary-strong" aria-hidden="true" />
                  Veteriner
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cat.vet?.name || cat.vet?.clinic ? (
                  <div className="space-y-1.5 text-sm">
                    {cat.vet.name ? <p className="font-semibold">{cat.vet.name}</p> : null}
                    {cat.vet.clinic ? (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {cat.vet.clinic}
                      </p>
                    ) : null}
                    {cat.vet.phone ? (
                      <a
                        href={`tel:${cat.vet.phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary-strong transition hover:bg-primary/15"
                      >
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                        {cat.vet.phone}
                      </a>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Veteriner bilgileri eklenmemiş. Düzenle düğmesinden
                    ekleyebilirsin.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {breed ? (
          <Card className="mt-4">
            <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
              <div>
                <CardTitle className="flex items-center gap-1.5">
                  <span aria-hidden="true">🐾</span>
                  <button
                    type="button"
                    onClick={() => setBreedOpen(true)}
                    className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {breed.name} — ırk rehberini aç
                  </button>
                </CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {breed.description}
                </p>
              </div>
              <Badge variant="outline">{breed.activity} aktivite</Badge>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Bakım notları
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {breed.careNotes.map((note) => (
                    <li key={note} className="flex gap-1.5 text-xs leading-relaxed">
                      <ShieldCheck
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
                        aria-hidden="true"
                      />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Sağlık riskleri
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {breed.healthRisks.map((risk) => (
                      <Badge key={risk} variant="destructive">
                        {risk}
                      </Badge>
                    ))}
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Yaşam süresi</dt>
                    <dd className="font-semibold">{breed.lifespan}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Kilo aralığı</dt>
                    <dd className="font-semibold">{breed.weight}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tüy</dt>
                    <dd className="font-semibold">{breed.coat}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tarama</dt>
                    <dd className="font-semibold">{breed.grooming}</dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-4 border-accent/30 bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
              Kişiselleştirilmiş öneriler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {recommendations.map((item) => (
                <li key={item} className="flex gap-2 text-xs leading-relaxed">
                  <CheckCircle2
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Bu öneriler ırk, yaş ve profil bilgilerinden otomatik üretilir;
              hekim tavsiyesi yerine geçmez.
            </p>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value="bakim" activeValue={tab} label="Bakım planı">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5">
                <Utensils className="h-4 w-4 text-primary-strong" aria-hidden="true" />
                Günlük beslenme planı
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {cat.weight} kg · {age.group === "kitten" ? "yavru" : age.group === "senior" ? "yaşlı" : "yetişkin"} ·{" "}
                {cat.neutered ? "kısır" : "kısırlaştırılmamış"}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-primary-strong">
                  Tahmini günlük mama
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold">
                  {Math.round(portion.gramsPerDay)} g
                </p>
                <p className="text-xs text-muted-foreground">
                  {portion.mealsPerDay} öğün × ~{Math.round(portion.gramsPerMeal)} g
                  · {Math.round(portion.der)} kcal/gün
                </p>
              </div>
              <div className="rounded-xl bg-sky-500/10 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                  Günlük su ihtiyacı
                </p>
                <p className="mt-1 text-lg font-extrabold">
                  {water.min} - {water.max} ml
                </p>
                <p className="text-xs text-muted-foreground">
                  Yaş mama su alımını destekler; su kabını her gün tazeleyin.
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Öğün planı</span>
                  <span className="font-bold">{settings.mealsPerDay} öğün</span>
                </div>
                <Progress
                  value={Math.min(settings.mealsPerDay, catReminders.filter((r) => r.type === "food").length)}
                  max={settings.mealsPerDay}
                  label="Tanımlı mama hatırlatıcısı"
                />
                <p className="text-[10px] text-muted-foreground">
                  Hatırlatıcılar sekmesinden öğün saatlerini düzenleyebilirsin.
                </p>
              </div>
              <ButtonLink href="/guide?kategori=nutrition" variant="outline" size="sm" className="w-full">
                Porsiyon hesaplayıcıyı aç
              </ButtonLink>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5">
                  <Droplets className="h-4 w-4 text-sky-500" aria-hidden="true" />
                  Tüy ve hijyen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs leading-relaxed">
                <p>
                  <span className="font-semibold">Tarama:</span>{" "}
                  {breed?.grooming ?? "Haftada 1-2 kez"}
                </p>
                <p>
                  <span className="font-semibold">Tüy tipi:</span>{" "}
                  {breed?.coat ?? "Kısa tüylü"}
                </p>
                <p className="text-muted-foreground">
                  Tırnakları 2-3 haftada bir kesin; kum kabını günde 2 kez
                  temizleyin. Diş fırçalamayı haftada 2-3 kez yapın.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5">
                  <Syringe className="h-4 w-4 text-rose-500" aria-hidden="true" />
                  Aşı durumu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">
                    {cat.vaccinations.length} kayıt
                  </p>
                  {overdueVaccines.length > 0 ? (
                    <Badge variant="destructive">
                      {overdueVaccines.length} gecikmiş
                    </Badge>
                  ) : (
                    <Badge variant="success">Güncel görünüyor</Badge>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Bir sonraki aşı tarihini kaçırmamak için hatırlatıcı ekleyin.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => {
                    setTab("asi");
                    setVaccineOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Aşı kaydı ekle
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle>Günlük bakım kontrol listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {[
                "Taze su ve temiz su kabı",
                "Ölçülü öğünler (porsiyona göre)",
                "Kum kabı temizliği (sabah/akşam)",
                "10-15 dakika aktif oyun",
                "Diş ve tüy kontrolü",
                "Davranış ve iştah gözlemi",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] text-muted-foreground">
              Hatırlatıcılar toplam {catReminders.length} görev içeriyor.{" "}
              <Link href="/reminders" className="font-bold text-primary-strong hover:underline">
                Yönet
              </Link>
            </p>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value="asi" activeValue={tab} label="Aşı geçmişi">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
            <div>
              <CardTitle>Aşı geçmişi</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {cat.vaccinations.length} kayıt · tarihi geçenler kırmızı işaretli
              </p>
            </div>
            <Button size="sm" onClick={() => setVaccineOpen(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Aşı ekle
            </Button>
          </CardHeader>
          <CardContent>
            {sortedVaccines.length === 0 ? (
              <EmptyState
                emoji="💉"
                title="Aşı kaydı yok"
                description="Karma, kuduz ve parazit kayıtlarını ekleyerek takvimi takip et."
                action={
                  <Button size="sm" onClick={() => setVaccineOpen(true)}>
                    İlk aşıyı ekle
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-2">
                {sortedVaccines.map((vaccine) => {
                  const overdue = vaccine.nextDate && vaccine.nextDate < todayKey();
                  const soon =
                    vaccine.nextDate &&
                    !overdue &&
                    daysUntilAnniversary(vaccine.nextDate) !== null &&
                    (daysUntilAnniversary(vaccine.nextDate) ?? 999) <= 30;
                  return (
                    <li
                      key={vaccine.id}
                      className="flex items-start gap-3 rounded-xl border border-border/70 p-3"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-300">
                        <Syringe className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">{vaccine.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Yapıldı: {formatDateLong(vaccine.date)}
                        </p>
                        {vaccine.nextDate ? (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Sonraki: {formatDateLong(vaccine.nextDate)}
                          </p>
                        ) : null}
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {overdue ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                              Gecikmiş
                            </Badge>
                          ) : soon ? (
                            <Badge variant="secondary">Yaklaşıyor</Badge>
                          ) : (
                            <Badge variant="success">Tamamlandı</Badge>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteVaccination(cat.id, vaccine.id)}
                        aria-label={`${vaccine.name} kaydını sil`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
              Aşı takvimi genel bilgilendirmedir. Hekiminiz kedinin yaşam tarzına
              göre farklı bir plan önerebilir.
            </p>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value="kilo" activeValue={tab} label="Kilo takibi">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Kilo ölçümü ekle</CardTitle>
              <p className="text-xs text-muted-foreground">
                Aç karnına, aynı tartıda ve aynı saatte ölçmek en doğrusudur.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="weight-input" className="sr-only">
                    Yeni kilo (kg)
                  </Label>
                  <Input
                    id="weight-input"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0.4"
                    max="20"
                    placeholder={`${cat.weight} kg`}
                    value={weightInput}
                    onChange={(event) => setWeightInput(event.target.value)}
                  />
                </div>
                <Button onClick={saveWeight}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Ekle
                </Button>
              </div>
              {weightError ? (
                <p role="alert" className="mt-1.5 text-xs text-danger">
                  {weightError}
                </p>
              ) : (
                <FieldHint>
                  Mevcut kayıt: {cat.weight.toLocaleString("tr-TR")} kg · İdeal
                  aralık ırka göre değişir.
                </FieldHint>
              )}

              <div className="mt-4 rounded-xl bg-muted/50 p-3">
                <p className="text-xs font-bold">Obezite kontrolü (BCS)</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Vücut kondisyon skoru 1-9 arasındadır; 5 idealdir. Kaburgaları
                  hafif bastırarak hissedebiliyorsan kilo dengededir.
                </p>
                <ButtonLink href="/guide?kategori=nutrition" size="sm" variant="ghost" className="mt-1 -ms-2">
                  BCS tablosu
                </ButtonLink>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Kilo grafiği</CardTitle>
            </CardHeader>
            <CardContent>
              <WeightChart entries={cat.weightHistory} />
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle>Ölçüm geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            {cat.weightHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground">Kayıt yok.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {[...cat.weightHistory].reverse().map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="text-xs text-muted-foreground">
                      {formatDateLong(entry.date)}
                    </span>
                    <span className="text-sm font-bold tabular-nums">
                      {entry.kg.toLocaleString("tr-TR")} kg
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteWeight(cat.id, entry.id)}
                      aria-label={`${formatDateLong(entry.date)} kilo kaydını sil`}
                      className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value="galeri" activeValue={tab} label="Fotoğraf galerisi">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
            <div>
              <CardTitle>Fotoğraf galerisi</CardTitle>
              <p className="text-xs text-muted-foreground">
                {cat.gallery.length}/12 fotoğraf · anılar cihazında saklanır
              </p>
            </div>
            <label
              htmlFor="gallery-upload"
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              {galleryBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Fotoğraf ekle
            </label>
            <input
              id="gallery-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={galleryBusy || cat.gallery.length >= 12}
              onChange={(event) => {
                void handleGalleryUpload(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </CardHeader>
          <CardContent>
            {cat.gallery.length === 0 ? (
              <EmptyState
                emoji="📸"
                title="Galeri boş"
                description="Kedinin fotoğraflarını ekleyerek büyümesini ve anılarını arşivleyebilirsin."
                action={
                  <label
                    htmlFor="gallery-upload"
                    className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                  >
                    <ImagePlus className="h-4 w-4" aria-hidden="true" />
                    İlk fotoğrafı ekle
                  </label>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {cat.gallery.map((photo, index) => (
                  <div key={`${index}-${photo.slice(-12)}`} className="group relative">
                    <button
                      type="button"
                      onClick={() => setLightbox(photo)}
                      className="block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Fotoğraf ${index + 1} büyüt`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- LocalStorage data URL */}
                      <img
                        src={photo}
                        alt={`${cat.name} galeri fotoğrafı ${index + 1}`}
                        className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryPhoto(cat.id, index)}
                      aria-label={`Fotoğraf ${index + 1} sil`}
                      className="absolute end-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value="notlar" activeValue={tab} label="Notlar">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Genel notlar</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="cat-notes" className="sr-only">
                Kedi hakkında notlar
              </Label>
              <Textarea
                id="cat-notes"
                value={notesDraft}
                onChange={(event) => setNotesDraft(event.target.value)}
                placeholder="Sevdiği oyuncaklar, alışkanlıkları, kişiliği…"
                rows={6}
                maxLength={3000}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Sağlık notları</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="cat-health-notes" className="sr-only">
                Sağlık notları
              </Label>
              <Textarea
                id="cat-health-notes"
                value={healthDraft}
                onChange={(event) => setHealthDraft(event.target.value)}
                placeholder="Alerji, ilaçlar, geçirilmiş hastalıklar…"
                rows={6}
                maxLength={3000}
              />
            </CardContent>
          </Card>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={saveNotes}>
            <Check className="h-4 w-4" aria-hidden="true" />
            Notları kaydet
          </Button>
          {notesSaved ? (
            <span role="status" className="text-xs font-semibold text-accent">
              Kaydedildi ✓
            </span>
          ) : null}
        </div>
      </TabPanel>
      <TabPanel value="zaman" activeValue={tab} label="Zaman çizelgesi">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Sağlık zaman çizelgesi</CardTitle>
            <p className="text-xs text-muted-foreground">
              Aşılar, kilo ölçümleri ve notlar kronolojik sırada.
            </p>
          </CardHeader>
          <CardContent>
            {(() => {
              const events: { date: string; label: string; detail?: string; emoji: string }[] = [];
              cat.vaccinations.forEach((v) => {
                events.push({ date: v.date, label: v.name, detail: v.nextDate ? `Sonraki: ${v.nextDate}` : undefined, emoji: "💉" });
              });
              cat.weightHistory.forEach((w) => {
                events.push({ date: w.date, label: `Kilo ölçümü: ${w.kg} kg`, emoji: "⚖️" });
              });
              if (cat.adoptedAt) events.push({ date: cat.adoptedAt, label: "Sahiplenme", emoji: "🏠" });
              events.push({ date: cat.birthDate, label: "Doğum", emoji: "🎂" });
              events.sort((a, b) => b.date.localeCompare(a.date));
              if (events.length === 0) {
                return <p className="text-xs text-muted-foreground">Kayıt yok.</p>;
              }
              return (
                <ol className="relative space-y-3 border-s-2 border-border/60 ps-4">
                  {events.map((ev, idx) => (
                    <li key={idx} className="relative">
                      <span className="absolute -start-[21px] top-1 grid h-4 w-4 place-items-center rounded-full bg-card text-[10px] ring-2 ring-border">
                        {ev.emoji}
                      </span>
                      <p className="text-xs font-bold">{ev.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDateLong(ev.date)}
                      </p>
                      {ev.detail ? (
                        <p className="text-[10px] text-muted-foreground">{ev.detail}</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              );
            })()}
          </CardContent>
        </Card>
      </TabPanel>


      {/* Profil silme */}
      <Card className="mt-5 border-destructive/25">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-bold text-danger">Tehlikeli işlem</p>
            <p className="text-[11px] text-muted-foreground">
              Profil, hatırlatıcılar ve bakım kayıtları kalıcı olarak silinir.
            </p>
          </div>
          <Button
            variant="destructive-soft"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Profili sil
          </Button>
        </CardContent>
      </Card>

      {/* Düzenleme dialogu */}
      <Dialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Profili düzenle"
        description={`${cat.name} bilgilerini güncelle.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Vazgeç
            </Button>
            <Button onClick={saveEdit}>
              <Check className="h-4 w-4" aria-hidden="true" />
              Kaydet
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {editError ? (
            <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-xs text-danger">
              {editError}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <CatAvatar name={editName || "Kedi"} photo={editPhoto} size="lg" />
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <label
                  htmlFor="edit-photo"
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 text-[11px] font-semibold transition hover:border-primary/40"
                >
                  {editBusy ? (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <ImagePlus className="h-3 w-3" aria-hidden="true" />
                  )}
                  Fotoğraf seç
                </label>
                <input
                  id="edit-photo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    void handleEditPhoto(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                {editPhoto ? (
                  <button
                    type="button"
                    onClick={() => setEditPhoto(undefined)}
                    className="rounded-lg px-2 text-[11px] font-semibold text-danger hover:bg-destructive/10"
                  >
                    Kaldır
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-breed">Irk</Label>
            <Select
              id="edit-breed"
              value={editBreedId}
              onChange={(event) => setEditBreedId(event.target.value)}
            >
              {breeds
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name, "tr"))
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Ad *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={40}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-birth">Doğum tarihi *</Label>
              <Input
                id="edit-birth"
                type="date"
                value={editBirth}
                max={todayKey()}
                onChange={(event) => setEditBirth(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-gender">Cinsiyet</Label>
              <Select
                id="edit-gender"
                value={editGender}
                onChange={(event) => setEditGender(event.target.value as Gender)}
              >
                <option value="female">Dişi</option>
                <option value="male">Erkek</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-weight">Kilo (kg)</Label>
              <Input
                id="edit-weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0.4"
                max="20"
                value={editWeight}
                onChange={(event) => setEditWeight(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-activity">Aktivite</Label>
              <Select
                id="edit-activity"
                value={editActivity}
                onChange={(event) =>
                  setEditActivity(event.target.value as ActivityLevel)
                }
              >
                <option value="low">Sakin</option>
                <option value="medium">Orta</option>
                <option value="high">Çok aktif</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-adopted">Sahiplenme tarihi</Label>
              <Input
                id="edit-adopted"
                type="date"
                value={editAdopted}
                max={todayKey()}
                onChange={(event) => setEditAdopted(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-color">Tuy rengi / deseni</Label>
              <Input
                id="edit-color"
                value={editColor}
                onChange={(event) => setEditColor(event.target.value)}
                placeholder="Orn. Tekir, beyaz"
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-microchip">Mikrocip no</Label>
              <Input
                id="edit-microchip"
                value={editMicrochip}
                onChange={(event) => setEditMicrochip(event.target.value)}
                placeholder="15 haneli numara"
                maxLength={40}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-insurance">Sigorta / poliçe</Label>
              <Input
                id="edit-insurance"
                value={editInsurance}
                onChange={(event) => setEditInsurance(event.target.value)}
                placeholder="Sirket ve poliçe no"
                maxLength={120}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-allergies">Alerjiler</Label>
            <Textarea
              id="edit-allergies"
              value={editAllergies}
              onChange={(event) => setEditAllergies(event.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Bilinen alerjiler (mama, polen, vb.)"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-medications">Duzenli ilaclar</Label>
            <Textarea
              id="edit-medications"
              value={editMedications}
              onChange={(event) => setEditMedications(event.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Kullanilan ilaclar ve dozlar"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
            <span className="text-sm font-semibold">Kısırlaştırıldı</span>
            <Switch
              checked={editNeutered}
              onCheckedChange={setEditNeutered}
              label="Kısırlaştırma durumu"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Veteriner bilgileri</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Veteriner adı"
                aria-label="Veteriner adı"
                value={editVetName}
                onChange={(event) => setEditVetName(event.target.value)}
              />
              <Input
                placeholder="Klinik adı"
                aria-label="Klinik adı"
                value={editVetClinic}
                onChange={(event) => setEditVetClinic(event.target.value)}
              />
              <Input
                placeholder="Telefon"
                aria-label="Veteriner telefonu"
                type="tel"
                value={editVetPhone}
                onChange={(event) => setEditVetPhone(event.target.value)}
              />
              <Input
                placeholder="Adres"
                aria-label="Veteriner adresi"
                value={editVetAddress}
                onChange={(event) => setEditVetAddress(event.target.value)}
                className="sm:col-span-2"
              />
            </div>
          </fieldset>
        </div>
      </Dialog>

      {/* Aşı ekleme dialogu */}
      <Dialog
        open={vaccineOpen}
        onOpenChange={setVaccineOpen}
        title="Aşı kaydı ekle"
        description="Aşı tarihini ve varsa sonraki doz tarihini gir."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setVaccineOpen(false)}>
              Vazgeç
            </Button>
            <Button onClick={saveVaccine}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ekle
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {vError ? (
            <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-xs text-danger">
              {vError}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="vaccine-name">Aşı adı *</Label>
            <Input
              id="vaccine-name"
              value={vName}
              onChange={(event) => setVName(event.target.value)}
              placeholder="Örn. Karma (FVRCP)"
              maxLength={60}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vaccine-date">Yapıldığı tarih *</Label>
              <Input
                id="vaccine-date"
                type="date"
                value={vDate}
                max={todayKey()}
                onChange={(event) => setVDate(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vaccine-next">Sonraki doz</Label>
              <Input
                id="vaccine-next"
                type="date"
                value={vNext}
                onChange={(event) => setVNext(event.target.value)}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Sonraki doz tarihi girersen aşı takibini kolayca yapabilirsin.
          </p>
        </div>
      </Dialog>

      {/* Silme onayı */}
      <Dialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`${cat.name} silinsin mi?`}
        description="Bu işlem geri alınamaz. Kediye ait hatırlatıcılar ve bakım kayıtları da silinir."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteCat(cat.id);
                router.push("/cats");
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Kalıcı olarak sil
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {cat.name} için {catReminders.length} hatırlatıcı ve{" "}
            {cat.weightHistory.length} kilo kaydı silinecek.
          </p>
        </div>
      </Dialog>

      {/* Galeri büyütme */}
      <TabPanel value="saglik" activeValue={tab} label="Sağlık günlüğü">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Sağlık günlüğü</CardTitle>
            <p className="text-xs text-muted-foreground">
              Semptomlar, veteriner ziyaretleri ve ilaç kayıtları.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2.5">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label htmlFor="health-type">Tür</Label>
                  <Select
                    id="health-type"
                    value={healthType}
                    onChange={(e) => setHealthType(e.target.value as HealthEntry["type"])}
                  >
                    <option value="symptom">Semptom</option>
                    <option value="vet-visit">Veteriner ziyareti</option>
                    <option value="medication">İlaç</option>
                    <option value="note">Not</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="health-date">Tarih</Label>
                  <Input
                    id="health-date"
                    type="date"
                    value={healthDate}
                    max={todayKey()}
                    onChange={(e) => setHealthDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="health-title">Başlık</Label>
                <Input
                  id="health-title"
                  value={healthTitle}
                  onChange={(e) => setHealthTitle(e.target.value)}
                  placeholder="Örn. Kusma, aşı, ilaç dozu"
                  maxLength={120}
                />
              </div>
              <div>
                <Label htmlFor="health-note">Not (isteğe bağlı)</Label>
                <Textarea
                  id="health-note"
                  value={healthNote}
                  onChange={(e) => setHealthNote(e.target.value)}
                  rows={2}
                  maxLength={1000}
                />
              </div>
              <Button
                onClick={() => {
                  if (!healthTitle.trim()) {
                    notify("Başlık gerekli.");
                    return;
                  }
                  addHealthEntry({
                    catId: cat.id,
                    date: healthDate,
                    type: healthType,
                    title: healthTitle.trim(),
                    note: healthNote.trim() || undefined,
                  });
                  setHealthTitle("");
                  setHealthNote("");
                  setHealthDate(todayKey());
                }}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Kayıt ekle
              </Button>
            </div>

            {healthEntries.filter((e) => e.catId === cat.id).length === 0 ? (
              <EmptyState
                emoji="🩺"
                title="Kayıt yok"
                description="Semptom, veteriner ziyareti veya ilaç kaydı ekleyerek sağlık geçmişini takip edin."
              />
            ) : (
              <ul className="space-y-2">
                {healthEntries
                  .filter((e) => e.catId === cat.id)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start gap-2.5 rounded-xl border border-border/60 p-3"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm">
                        {entry.type === "symptom"
                          ? "🤒"
                          : entry.type === "vet-visit"
                            ? "🏥"
                            : entry.type === "medication"
                              ? "💊"
                              : "📝"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold">{entry.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDateLong(entry.date)} ·{" "}
                          {entry.type === "symptom"
                            ? "Semptom"
                            : entry.type === "vet-visit"
                              ? "Veteriner"
                              : entry.type === "medication"
                                ? "İlaç"
                                : "Not"}
                        </p>
                        {entry.note ? (
                          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                            {entry.note}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteHealthEntry(entry.id)}
                        aria-label="Kaydı sil"
                        className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <BreedDetailDialog
        breed={breed ?? null}
        open={breedOpen}
        onOpenChange={setBreedOpen}
      />

      <Dialog
        open={Boolean(lightbox)}
        onOpenChange={(open) => {
          if (!open) setLightbox(null);
        }}
        title={`${cat.name} fotoğrafı`}
        className="sm:max-w-2xl"
      >
        {lightbox ? (
          // eslint-disable-next-line @next/next/no-img-element -- LocalStorage data URL
          <img
            src={lightbox}
            alt={`${cat.name} büyük fotoğraf`}
            className="max-h-[70dvh] w-full rounded-xl object-contain"
          />
        ) : null}
      </Dialog>

      {/* Altta her zaman gorunen galeri */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle>Fotograf galerisi</CardTitle>
            <p className="text-xs text-muted-foreground">
              {cat.gallery.length}/12 fotograf
            </p>
          </div>
          <label
            htmlFor="gallery-upload-bottom"
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {galleryBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Fotograf ekle
          </label>
          <input
            id="gallery-upload-bottom"
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={galleryBusy || cat.gallery.length >= 12}
            onChange={(event) => {
              void handleGalleryUpload(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </CardHeader>
        <CardContent>
          {cat.gallery.length === 0 ? (
            <EmptyState
              emoji="📸"
              title="Galeri bos"
              description="Kedinin fotograflarini ekleyerek anilarini arsivleyebilirsin."
            />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {cat.gallery.map((photo, index) => (
                <div key={`b-${index}-${photo.slice(-12)}`} className="group relative">
                  <button
                    type="button"
                    onClick={() => setLightbox(photo)}
                    className="block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Fotograf ${index + 1} buyut`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- LocalStorage data URL */}
                    <img
                      src={photo}
                      alt={`${cat.name} galeri fotografi ${index + 1}`}
                      className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => {
                        updateCat(cat.id, { photo });
                        notify("Profil fotografi olarak ayarlandi.");
                      }}
                      className="rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-black"
                    >
                      Profil yap
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryPhoto(cat.id, index)}
                      aria-label={`Fotograf ${index + 1} sil`}
                      className="grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-semibold">{value}</p>
    </div>
  );
}
