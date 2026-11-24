"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Circle,
  ListChecks,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Label, FieldHint } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { dateKey, formatDateWithWeekday, taskCompletedOn, taskProgressOn, todayKey } from "@/lib/utils";

const EMOJI_PRESETS = ["✅", "🍽️", "💧", "🧹", "🎮", "💊", "✂️", "🏥", "🧼", "🐾", "⭐", "📅"];

const TASK_KINDS: { id: string; label: string; emoji: string }[] = [
  { id: "food", label: "Mama", emoji: "🍽️" },
  { id: "water", label: "Su", emoji: "💧" },
  { id: "litter", label: "Kum", emoji: "🧹" },
  { id: "play", label: "Oyun", emoji: "🎮" },
  { id: "medication", label: "İlaç", emoji: "💊" },
  { id: "grooming", label: "Bakım", emoji: "✂️" },
  { id: "vet", label: "Veteriner", emoji: "🏥" },
  { id: "custom", label: "Diğer", emoji: "📌" },
];

type Filter = "today" | "all" | "done";

export function TasksView() {
  const {
    tasks,
    cats,
    activeCatId,
    activeDate,
    addTask,
    tapTask,
    undoTask,
    updateTask,
    deleteTask,
    t,
    notify,
  } = useApp();

  const [filter, setFilter] = useState<Filter>("today");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("✅");
  const [kind, setKind] = useState("custom");
  const [target, setTarget] = useState(1);
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">("none");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [catId, setCatId] = useState<string | null>(activeCatId);
  const [note, setNote] = useState("");

  const resetForm = () => {
    setTitle("");
    setEmoji("✅");
    setKind("custom");
    setTarget(1);
    setRepeat("none");
    setPriority("medium");
    setDueDate("");
    setCatId(activeCatId);
    setNote("");
    setEditing(null);
  };

  const openNew = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    setEditing(id);
    setTitle(task.title);
    setEmoji(task.emoji);
    setKind(task.kind);
    setTarget(task.target);
    setRepeat(task.repeat ?? "none");
    setPriority(task.priority ?? "medium");
    setDueDate(task.dueDate ?? "");
    setCatId(task.catId);
    setNote(task.note ?? "");
    setOpen(true);
  };

  const submit = () => {
    const clean = title.trim();
    if (!clean) {
      notify("Görev başlığı gerekli.");
      return;
    }
    if (editing) {
      updateTask(editing, {
        title: clean,
        emoji,
        kind: kind as (typeof tasks)[number]["kind"],
        target,
        catId,
        note: note.trim() || undefined,
        repeat,
        priority,
        dueDate: dueDate || undefined,
      });
      notify("Görev güncellendi.");
    } else {
      addTask({
        title: clean,
        emoji,
        kind: kind as (typeof tasks)[number]["kind"],
        target,
        catId,
        note: note.trim() || undefined,
        repeat,
        priority,
        dueDate: dueDate || undefined,
      });
    }
    setOpen(false);
    resetForm();
  };

  const relevantTasks = useMemo(() => tasks.filter((task) => {
    const createdDate = dateKey(new Date(task.createdAt));
    if (activeDate === todayKey()) {
      if (createdDate > activeDate) return false;
      const completedDate = task.completedAt ? dateKey(new Date(task.completedAt)) : undefined;
      const hasTodayProgress = task.progressByDate?.some((entry) => entry.date === activeDate) ?? false;
      if (completedDate && completedDate !== activeDate && !hasTodayProgress && (!task.repeat || task.repeat === "none")) return false;
      return true;
    }
    return task.dueDate === activeDate ||
      createdDate === activeDate ||
      (task.completedAt ? dateKey(new Date(task.completedAt)) === activeDate : false) ||
      Boolean(task.progressByDate?.some((entry) => entry.date === activeDate)) ||
      (task.repeat !== "none" && task.repeat !== undefined && createdDate <= activeDate);
  }), [activeDate, tasks]);

  const filtered = useMemo(() => {
    const sorted = [...relevantTasks].sort((a, b) => {
      const aDone = taskCompletedOn(a, activeDate) ? 1 : 0;
      const bDone = taskCompletedOn(b, activeDate) ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    if (filter === "done") return sorted.filter((task) => taskCompletedOn(task, activeDate));
    if (filter === "today") return sorted.filter((task) => !taskCompletedOn(task, activeDate));
    return sorted;
  }, [relevantTasks, filter, activeDate]);

  const todayCount = relevantTasks.filter((task) => !taskCompletedOn(task, activeDate)).length;
  const doneCount = relevantTasks.filter((task) => taskCompletedOn(task, activeDate)).length;

  return (
    <div className="space-y-5">
      <PageHeader
        emoji="✅"
        title="Görevler"
        tourTarget="tasks-overview"
        subtitle={
          activeDate !== todayKey()
            ? `${formatDateWithWeekday(activeDate)} · ${todayCount} aktif · ${doneCount} tamamlandı`
            : tasks.length
              ? `${todayCount} aktif · ${doneCount} tamamlandı`
              : "Kendine bakım görevleri oluştur"
        }
        action={
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Yeni
          </Button>
        }
      />

      {/* Filtreler */}
      <div className="flex gap-2" role="tablist" aria-label="Görev filtresi">
        {(
          [
            { id: "today", label: "Aktif" },
            { id: "all", label: "Tümü" },
            { id: "done", label: "Tamamlanan" },
          ] as { id: Filter; label: string }[]
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              filter === item.id
                ? "border-primary bg-primary/10 text-primary-strong"
                : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="📋"
          title={
            filter === "done"
              ? "Henüz tamamlanan görev yok"
              : "Görev yok"
          }
          description={
            filter === "done"
              ? "Görevleri tamamladıkça burada görünür."
              : "Sağ üstteki “Yeni” butonuyla ilk görevini ekle."
          }
          action={
            filter !== "done" ? (
              <Button onClick={openNew}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Görev ekle
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-2.5" aria-label="Görev listesi">
          {filtered.map((task) => {
            const cat = cats.find((c) => c.id === task.catId);
            const done = taskCompletedOn(task, activeDate);
            const progress = taskProgressOn(task, activeDate);
            return (
              <li key={task.id}>
                <Card
                  className={`transition-all ${done ? "opacity-75" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => (done ? undoTask(task.id) : tapTask(task.id))}
                        aria-label={
                          done
                            ? "Görevi geri al"
                            : task.target > 1
                              ? `Görevi ilerlet (${progress}/${task.target})`
                              : "Görevi tamamla"
                        }
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl transition active:scale-95 ${
                          done
                            ? "bg-accent/20 text-emerald-700 dark:text-emerald-300"
                            : "bg-primary/10 text-primary-strong hover:bg-primary/15"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <span aria-hidden="true">{task.emoji}</span>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-bold leading-tight ${
                              done ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(task.id)}
                              aria-label="Düzenle"
                              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              aria-label="Sil"
                              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-danger"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        {task.target > 1 && !done ? (
                          <div className="mt-2">
                            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                              <span>
                                İlerleme {progress}/{task.target}
                              </span>
                              <span>
                                {Math.round((progress / task.target) * 100)}%
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {Array.from({ length: task.target }).map((_, i) => (
                                <span
                                  key={i}
                                  className={`h-1.5 flex-1 rounded-full transition ${
                                    i < progress
                                      ? "bg-primary"
                                      : "bg-muted"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {cat ? (
                            <Badge variant="secondary" className="text-[10px]">
                              {cat.name}
                            </Badge>
                          ) : (
                            <Badge variant="muted" className="text-[10px]">
                              Tüm kediler
                            </Badge>
                          )}
                          <Badge variant="muted" className="text-[10px]">
                            {TASK_KINDS.find((k) => k.id === task.kind)?.label ??
                              "Görev"}
                          </Badge>
                          {done ? (
                            <button
                              type="button"
                              onClick={() => undoTask(task.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-strong hover:underline"
                            >
                              <RotateCcw className="h-3 w-3" aria-hidden="true" />
                              Geri al
                            </button>
                          ) : null}
                        </div>
                        {task.note ? (
                          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                            {task.note}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/* Sabit ekle butonu */}
      <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-30 mx-auto flex max-w-md justify-center px-4 md:bottom-6">
        <Button
          onClick={openNew}
          className="shadow-glow"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Görev ekle
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
        title={editing ? "Görevi düzenle" : "Yeni görev"}
        description="Görev başlığını ve hedef sayısını belirle."
        footer={
          <>
            <Button variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>
              Vazgeç
            </Button>
            <Button onClick={submit}>{editing ? "Kaydet" : "Ekle"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Şablonlar</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {[
                { t: "Mama kabını yıka", e: "🍽️", k: "food" },
                { t: "Su kabını tazele", e: "💧", k: "water" },
                { t: "Kum temizle", e: "🧹", k: "litter" },
                { t: "Oyun oynat", e: "🎮", k: "play" },
                { t: "İlaç ver", e: "💊", k: "medication" },
                { t: "Tüy tara", e: "✂️", k: "grooming" },
              ].map((tpl) => (
                <button
                  key={tpl.t}
                  type="button"
                  onClick={() => {
                    setTitle(tpl.t);
                    setEmoji(tpl.e);
                    setKind(tpl.k);
                  }}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold transition hover:border-primary/40 hover:bg-primary/5"
                >
                  {tpl.e} {tpl.t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="task-title">Başlık</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Mama kabını yıka"
              maxLength={80}
            />
          </div>

          <div>
            <Label>Emoji</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {EMOJI_PRESETS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`grid h-9 w-9 place-items-center rounded-xl border text-lg transition ${
                    emoji === e
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                  aria-label={`Emoji ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="task-kind">Tür</Label>
            <Select
              id="task-kind"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                const k = TASK_KINDS.find((x) => x.id === e.target.value);
                if (k && emoji === "✅") setEmoji(k.emoji);
              }}
            >
              {TASK_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.emoji} {k.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="task-target">Hedef (kaç kez)</Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTarget((v) => Math.max(1, v - 1))}
                className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-lg font-bold"
                aria-label="Azalt"
              >
                −
              </button>
              <div className="flex-1 text-center text-lg font-extrabold tabular-nums">
                {target}
              </div>
              <button
                type="button"
                onClick={() => setTarget((v) => Math.min(10, v + 1))}
                className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-lg font-bold"
                aria-label="Arttır"
              >
                +
              </button>
            </div>
            <FieldHint>
              1 seçersen tek dokunuşta tamamlanır; daha fazlası her dokunuşta bir artar.
            </FieldHint>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="task-priority">Öncelik</Label>
              <Select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
              >
                <option value="low">Düşük</option>
                <option value="medium">Orta</option>
                <option value="high">Yüksek</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-due">Son tarih</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="task-repeat">Tekrar</Label>
            <Select
              id="task-repeat"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as "none" | "daily" | "weekly")}
            >
              <option value="none">Tek seferlik</option>
              <option value="daily">Her gün</option>
              <option value="weekly">Her hafta</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="task-cat">Kedi</Label>
            <Select
              id="task-cat"
              value={catId ?? ""}
              onChange={(e) => setCatId(e.target.value || null)}
            >
              <option value="">Tüm kediler</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="task-note">Not (isteğe bağlı)</Label>
            <Textarea
              id="task-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
