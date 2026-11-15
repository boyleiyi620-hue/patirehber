"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cat, ChevronRight, Check, SkipForward } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { createClient } from "@/lib/supabase/client";
import { saveUserData } from "@/lib/supabase/sync";
import { breeds } from "@/lib/breeds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivityLevel, Gender } from "@/lib/types";
import { getCatAge } from "@/lib/utils";
import { uid } from "@/lib/utils";

const STEPS = 4;

export function OnboardingView() {
  const router = useRouter();
  const { addCat, updateSettings, settings, data, user } = useApp();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [breedId, setBreedId] = useState("tekir");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [weight, setWeight] = useState("4");
  const [neutered, setNeutered] = useState(false);
  const [activity, setActivity] = useState<ActivityLevel>("medium");
  const [color, setColor] = useState("");

  const skip = async () => {
    updateSettings({ onboarded: true });
    try {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        await supabase.from("profiles").update({ onboarded: true }).eq("id", u.id);
      }
    } catch (e) {
      console.error("onboarded update failed", e);
    }
    window.location.href = "/";
  };

  const finish = async () => {
    const catName = name.trim() || "Kedim";
    const cat = {
      id: uid("cat"),
      name: catName,
      breedId,
      birthDate: birthDate || new Date().toISOString().slice(0, 10),
      gender,
      weight: Number(weight) || 4,
      neutered,
      activity,
      color: color.trim() || undefined,
      photo: undefined,
      gallery: [],
      healthNotes: "",
      notes: "",
      vaccinations: [],
      weightHistory: [],
      createdAt: new Date().toISOString(),
    };
    addCat(cat as any);
    updateSettings({ onboarded: true, userName: settings.userName || "Kedi Dostu" });
    setTimeout(() => { window.location.href = "/"; }, 2500);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-2xl shadow-glow bounce-in">
          🐾
        </div>
        <h1 className="font-display text-2xl font-extrabold">Hoş geldin!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          İlk kedinizi oluşturalım. İstediğiniz zaman atlayabilirsiniz.
        </p>
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: STEPS }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full transition-all",
                i + 1 <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          {step === 1 ? (
            <>
              <div>
                <Label htmlFor="onb-name">Kedinizin adı</Label>
                <Input
                  id="onb-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn. Mırmır"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="onb-breed">Irk</Label>
                <Select
                  id="onb-breed"
                  value={breedId}
                  onChange={(e) => setBreedId(e.target.value)}
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
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div>
                <Label htmlFor="onb-birth">Doğum tarihi</Label>
                <Input
                  id="onb-birth"
                  type="date"
                  value={birthDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="onb-gender">Cinsiyet</Label>
                <Select
                  id="onb-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                >
                  <option value="female">Dişi</option>
                  <option value="male">Erkek</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="onb-color">Tüy rengi/desen (isteğe bağlı)</Label>
                <Input
                  id="onb-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Örn. Tekir"
                />
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div>
                <Label htmlFor="onb-weight">Kilo (kg)</Label>
                <Input
                  id="onb-weight"
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                <span className="text-sm font-semibold">Kısırlaştırıldı</span>
                <button
                  type="button"
                  onClick={() => setNeutered((v) => !v)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold transition",
                    neutered ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {neutered ? "Evet" : "Hayır"}
                </button>
              </div>
              <div>
                <Label htmlFor="onb-activity">Aktivite</Label>
                <Select
                  id="onb-activity"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value as ActivityLevel)}
                >
                  <option value="low">Sakin</option>
                  <option value="medium">Orta</option>
                  <option value="high">Çok aktif</option>
                </Select>
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <div className="text-center space-y-3">
              <div className="text-5xl">🎉</div>
              <p className="font-display text-lg font-extrabold">Hazırsınız!</p>
              <p className="text-sm text-muted-foreground">
                {name.trim() || "Kediniz"} profili oluşturulacak ve mama, su, kum, aşı hatırlatıcıları otomatik planlanacak.
              </p>
            </div>
          ) : null}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                updateSettings({ onboarded: true });
                (async () => {
                  try {
                    const supabase = createClient();
                    const { data: { user: u } } = await supabase.auth.getUser();
                    if (u) {
                      await supabase.from("profiles").update({ onboarded: true }).eq("id", u.id);
                    }
                  } catch (e) {
                    console.error("onboarded update failed", e);
                  }
                  window.location.href = "/";
                })();
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
            >
              <SkipForward className="h-4 w-4" aria-hidden="true" />
              Atla
            </button>
            {step < STEPS ? (
              <Button onClick={() => setStep((s) => s + 1)} className="flex-1">
                Devam
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button onClick={finish} className="flex-1">
                <Check className="h-4 w-4" aria-hidden="true" />
                Başla
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}  const skip = () => {
    window.location.href = "/";
  };


