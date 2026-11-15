"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  Trash2,
  Utensils,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Label, FieldHint } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  REMINDER_META,
  WEEKDAYS,
  weekdayShort,
} from "@/lib/utils";
import type { Reminder, ReminderType } from "@/lib/types";

const TYPE_OPTIONS = Object.keys(REMINDER_META) as ReminderType[];

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Doluysa düzenleme, boşsa yeni kayıt */
  reminder?: Reminder | null;
}

/** Hatırlatıcı ekleme / düzenleme formu */
export function ReminderDialog({ open, onOpenChange, reminder }: ReminderDialogProps) {
  const { cats, activeCatId, settings, addReminder, updateReminder, deleteReminder, notify } =
    useApp();

  const [type, setType] = useState<ReminderType>("food");
  const [title, setTitle] = useState("Mama zamanı");
  const [catId, setCatId] = useState<string>(activeCatId ?? "all");
  const [time, setTime] = useState("09:00");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [note, setNote] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setConfirmDelete(false);
    if (reminder) {
      setType(reminder.type);
      setTitle(reminder.title);
      setCatId(reminder.catId ?? "all");
      setTime(reminder.time);
      setDays(reminder.days);
      setNote(reminder.note ?? "");
      setEnabled(reminder.enabled);
    } else {
      setType("food");
      setTitle("Mama zamanı");
      setCatId(activeCatId ?? "all");
      setTime("09:00");
      setDays([0, 1, 2, 3, 4, 5, 6]);
      setNote("");
      setEnabled(true);
    }
  }, [activeCatId, open, reminder]);

  const toggleDay = (day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day],
    );
  };

  const save = () => {
    if (title.trim().length < 2) {
      setError("Hatırlatıcı başlığı en az 2 karakter olmalı.");
      return;
    }
    if (days.length === 0) {
      setError("En az bir gün seçin.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setError("Geçerli bir saat seçin.");
      return;
    }

    const targetCat = catId === "all" ? null : catId;
    if (reminder) {
      updateReminder(reminder.id, {
        type,
        title: title.trim(),
        catId: targetCat,
        time,
        days,
        note: note.trim() || undefined,
        enabled,
      });
      notify("Hatırlatıcı güncellendi.");
    } else {
      addReminder({
        type,
        title: title.trim(),
        catId: targetCat,
        time,
        days,
        note: note.trim() || undefined,
        enabled,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={reminder ? "Hatırlatıcıyı düzenle" : "Yeni hatırlatıcı"}
      description={
        reminder
          ? "Saat, gün ve bildirim tercihlerini güncelle."
          : "Mama, su, kum, ilaç veya özel günler için hatırlatıcı oluştur."
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          {reminder ? (
            confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    deleteReminder(reminder.id);
                    onOpenChange(false);
                  }}
                >
                  Evet, sil
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Vazgeç
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-destructive/10"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Sil
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button size="sm" onClick={save}>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {reminder ? "Güncelle" : "Oluştur"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 p-2 text-xs text-danger"
          >
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reminder-type">Tür</Label>
            <Select
              id="reminder-type"
              value={type}
              onChange={(event) => {
                const next = event.target.value as ReminderType;
                setType(next);
                if (!reminder) {
                  setTitle(
                    next === "special"
                      ? "Özel gün"
                      : `${REMINDER_META[next].label} zamanı`,
                  );
                }
              }}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {REMINDER_META[option].emoji} {REMINDER_META[option].label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reminder-time">Saat</Label>
            <Input
              id="reminder-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reminder-title">Başlık</Label>
          <Input
            id="reminder-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={60}
            placeholder="Örn. Sabah maması"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reminder-cat">Kedi</Label>
          <Select
            id="reminder-cat"
            value={catId}
            onChange={(event) => setCatId(event.target.value)}
          >
            <option value="all">Tüm kediler</option>
            {cats.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Günler</legend>
          <div className="flex gap-1">
            {WEEKDAYS.map((day) => {
              const selected = days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  aria-label={`${weekdayShort(day)} günü`}
                  onClick={() => toggleDay(day)}
                  className={`h-9 flex-1 rounded-lg text-xs font-bold transition ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {weekdayShort(day)}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Her gün", value: [0, 1, 2, 3, 4, 5, 6] },
              { label: "Hafta içi", value: [1, 2, 3, 4, 5] },
              { label: "Hafta sonu", value: [0, 6] },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setDays(preset.value)}
                className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary-strong"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="reminder-note">Not (isteğe bağlı)</Label>
          <Textarea
            id="reminder-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Örn. Pire damlasını ensesine uygula."
            rows={2}
            maxLength={400}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold">Hatırlatıcı aktif</p>
            <p className="text-[11px] text-muted-foreground">
              Kapalıysa bildirim gönderilmez.
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            label="Hatırlatıcı aktif"
          />
        </div>

        {type === "food" ? (
          <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-2.5 text-[11px] text-muted-foreground">
            <Utensils className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-strong" aria-hidden="true" />
            <p>
              {settings.mealsPerDay} öğün planını tamamlamak için birden fazla mama
              hatırlatıcısı ekleyebilirsin. Porsiyon hesabı için sayfanın altındaki
              hesaplayıcıyı kullan.
            </p>
          </div>
        ) : null}

        <FieldHint>
          <Bell className="me-1 inline h-3 w-3" aria-hidden="true" />
          Bildirimler yalnızca izin verildiğinde ve uygulama açıkken gönderilir.
          Push altyapısı hazırdır; backend eklendiğinde arka plan bildirimleri de
          çalışır.
        </FieldHint>
      </div>
    </Dialog>
  );
}
