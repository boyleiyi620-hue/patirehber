"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon, LockKeyhole, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getFriendCatDetail, type FriendCatDetail } from "@/lib/friends";
import { breedName, formatDateLong, getCatAge, taskCompletedOn, taskProgressOn } from "@/lib/utils";

export function FriendCatProfileView({ friendId, catId }: { friendId: string; catId: string }) {
  const [detail, setDetail] = useState<FriendCatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getFriendCatDetail(friendId, catId);
        if (!cancelled) setDetail(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Yüklenemedi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [friendId, catId]);

  if (loading) return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;
  if (error || !detail) {
    return (
      <div className="py-10 text-center">
        <EmptyState emoji="🐈" title="Kedi bulunamadı" description={error ?? "Bu kediye erişim yok."} />
        <Link href="/friends" className="mt-3 inline-block text-sm font-bold text-primary-strong hover:underline">Arkadaşlara dön</Link>
      </div>
    );
  }

  const { cat } = detail;
  const age = getCatAge(cat.birthDate);
  const photos = [...new Set([cat.photo, ...cat.gallery].filter((photo): photo is string => Boolean(photo)))];
  const logs = [...detail.dailyLogs].sort((a, b) => b.date.localeCompare(a.date));
  const health = [...detail.healthEntries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <PageHeader
        emoji="🐱"
        title={cat.name}
        subtitle={`${breedName(cat.breedId)} · ${age.label} · arkadaş kedisi`}
        action={<Link href="/friends"><Button variant="outline" size="sm"><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />Geri</Button></Link>}
      />

      <div className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-xs text-muted-foreground">
        <LockKeyhole className="h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />
        Arkadaş görünümü salt okunurdur. Bilgiler düzenlenemez veya silinemez.
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Profil bilgileri</CardTitle></CardHeader>
        <CardContent>
          {cat.photo ? <button type="button" onClick={() => setLightbox(cat.photo ?? null)} className="mb-4 block w-full overflow-hidden rounded-2xl bg-muted" aria-label={`${cat.name} profil fotoğrafını büyüt`}><img src={cat.photo} alt={`${cat.name} profil fotoğrafı`} className="max-h-72 w-full object-cover" /></button> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Ad" value={cat.name} />
            <Info label="Irk" value={breedName(cat.breedId)} />
            <Info label="Yaş" value={`${age.label} · doğum ${formatDateLong(cat.birthDate)}`} />
            <Info label="Cinsiyet" value={cat.gender === "female" ? "Dişi" : "Erkek"} />
            <Info label="Kilo" value={`${cat.weight} kg`} />
            <Info label="Kısırlaştırma" value={cat.neutered ? "Kısırlaştırılmış" : "Kısırlaştırılmamış"} />
            <Info label="Aktivite" value={cat.activity === "high" ? "Çok aktif" : cat.activity === "low" ? "Sakin" : "Orta"} />
            <Info label="Renk / tüy" value={cat.color} />
            <Info label="Sahiplenme tarihi" value={cat.adoptedAt ? formatDateLong(cat.adoptedAt) : undefined} />
            <Info label="Mikroçip" value={cat.microchip} />
            <Info label="Sigorta" value={cat.insurance} />
            <Info label="Bilinen alerjiler" value={cat.allergies} />
            <Info label="Düzenli ilaçlar" value={cat.medications} />
          </div>
          {cat.vet ? (
            <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3">
              <p className="text-xs font-extrabold">Veteriner bilgileri</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Info label="Veteriner" value={cat.vet.name} />
                <Info label="Klinik" value={cat.vet.clinic} />
                <Info label="Telefon" value={cat.vet.phone} />
                <Info label="Adres" value={cat.vet.address} />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Notlar ve sağlık bilgileri</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <TextBlock title="Genel notlar" text={cat.notes} />
          <TextBlock title="Sağlık notları" text={cat.healthNotes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary-strong" aria-hidden="true" />Fotoğraf galerisi <span className="text-xs font-medium text-muted-foreground">{photos.length}</span></CardTitle></CardHeader>
        <CardContent>
          {photos.length ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((photo, index) => (
                <button key={`${index}-${photo.slice(0, 20)}`} type="button" onClick={() => setLightbox(photo)} aria-label={`${cat.name} fotoğraf ${index + 1} büyüt`} className="overflow-hidden rounded-xl border border-border/60 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <img src={photo} alt={`${cat.name} fotoğraf ${index + 1}`} className="aspect-square w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Henüz fotoğraf eklenmemiş.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Günlük bakım geçmişi</CardTitle><p className="text-xs text-muted-foreground">Mama, su, kum, oyun ve günlük notlar.</p></CardHeader>
        <CardContent>
          {logs.length ? <ul className="space-y-2">{logs.map((log) => (
            <li key={log.id} className="rounded-xl border border-border/60 p-3">
              <p className="text-xs font-bold">{formatDateLong(log.date)}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{log.mealsGiven} öğün mama · Su {log.waterChanged ? "değiştirildi" : "değiştirilmedi"} · Kum {log.litterCleaned ? "temizlendi" : "temizlenmedi"} · {log.playMinutes} dk oyun</p>
              {log.note ? <p className="mt-1 whitespace-pre-wrap text-xs">{log.note}</p> : null}
            </li>
          ))}</ul> : <p className="text-sm text-muted-foreground">Günlük bakım kaydı yok.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Görevler</CardTitle></CardHeader>
        <CardContent>
          {detail.tasks.length ? <ul className="space-y-2">{detail.tasks.map((task) => {
            const entries = [...(task.progressByDate ?? [])].sort((a, b) => b.date.localeCompare(a.date));
            const legacyDate = task.completedAt ? task.completedAt.slice(0, 10) : undefined;
            return <li key={task.id} className="rounded-xl border border-border/60 p-3">
              <div className="flex items-start gap-2"><span aria-hidden="true">{task.emoji}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{task.title}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{task.kind} · hedef {task.target}{task.repeat && task.repeat !== "none" ? ` · tekrar: ${task.repeat === "daily" ? "günlük" : "haftalık"}` : ""}</p></div></div>
              {entries.length ? <ul className="mt-2 space-y-1 border-s border-border ps-3">{entries.map((entry) => <li key={entry.date} className="text-[11px] text-muted-foreground">{formatDateLong(entry.date)} · {taskCompletedOn(task, entry.date) ? "tamamlandı" : "ilerleme"} {taskProgressOn(task, entry.date)}/{task.target}</li>)}</ul> : legacyDate ? <p className="mt-2 text-[11px] text-muted-foreground">{formatDateLong(legacyDate)} · tamamlandı</p> : <p className="mt-2 text-[11px] text-muted-foreground">Henüz ilerleme kaydı yok.</p>}
              {task.note ? <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{task.note}</p> : null}
            </li>;
          })}</ul> : <p className="text-sm text-muted-foreground">Görev kaydı yok.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Hatırlatıcılar</CardTitle></CardHeader>
        <CardContent>
          {detail.reminders.length ? <ul className="space-y-2">{detail.reminders.map((reminder) => (
            <li key={reminder.id} className="flex items-start gap-2 rounded-xl border border-border/60 p-3">
              <span className="mt-0.5" aria-hidden="true">⏰</span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{reminder.title}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{reminder.time} · {reminder.days.length === 7 ? "Her gün" : reminder.days.join(", ")}{reminder.catId ? ` · ${cat.name}` : " · tüm kediler"}</p>{reminder.note ? <p className="mt-1 text-xs text-muted-foreground">{reminder.note}</p> : null}{reminder.history.length ? <p className="mt-1 text-[10px] text-muted-foreground">Tamamlanan: {[...reminder.history].sort().reverse().slice(0, 10).map(formatDateLong).join(" · ")}</p> : null}</div><span className="text-[10px] font-semibold text-muted-foreground">{reminder.enabled ? "Açık" : "Kapalı"}</span>
            </li>
          ))}</ul> : <p className="text-sm text-muted-foreground">Hatırlatıcı yok.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Sağlık kayıtları</CardTitle><p className="text-xs text-muted-foreground">Semptomlar, veteriner ziyaretleri, ilaçlar ve notlar.</p></CardHeader>
        <CardContent>
          {health.length ? <ul className="space-y-2">{health.map((entry) => <li key={entry.id} className="rounded-xl border border-border/60 p-3"><p className="text-sm font-bold">{entry.title}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{formatDateLong(entry.date)} · {entry.type === "vet-visit" ? "Veteriner ziyareti" : entry.type === "medication" ? "İlaç" : entry.type === "symptom" ? "Semptom" : "Not"}</p>{entry.note ? <p className="mt-1 whitespace-pre-wrap text-xs">{entry.note}</p> : null}</li>)}</ul> : <p className="text-sm text-muted-foreground">Sağlık kaydı yok.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardHeader className="pb-2"><CardTitle>Aşı geçmişi</CardTitle></CardHeader><CardContent>
          {cat.vaccinations.length ? <ul className="space-y-2">{[...cat.vaccinations].sort((a, b) => b.date.localeCompare(a.date)).map((vaccine) => <li key={vaccine.id} className="flex items-start gap-2 rounded-xl border border-border/60 p-3"><span aria-hidden="true">💉</span><div><p className="text-sm font-bold">{vaccine.name}</p><p className="text-[11px] text-muted-foreground">Yapıldı: {formatDateLong(vaccine.date)}{vaccine.nextDate ? ` · Sonraki: ${formatDateLong(vaccine.nextDate)}` : ""}</p></div></li>)}</ul> : <p className="text-sm text-muted-foreground">Aşı kaydı yok.</p>}
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle>Kilo geçmişi</CardTitle></CardHeader><CardContent>
          {cat.weightHistory.length ? <ul className="space-y-2">{[...cat.weightHistory].sort((a, b) => b.date.localeCompare(a.date)).map((weight) => <li key={weight.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3"><span className="text-xs text-muted-foreground">{formatDateLong(weight.date)}</span><span className="text-sm font-bold">{weight.kg} kg</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Kilo geçmişi yok.</p>}
        </CardContent></Card>
      </div>

      {lightbox ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={`${cat.name} fotoğrafı`} onClick={() => setLightbox(null)}>
          <button type="button" onClick={() => setLightbox(null)} className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white" aria-label="Fotoğrafı kapat"><X className="h-5 w-5" aria-hidden="true" /></button>
          <img src={lightbox} alt={`${cat.name} fotoğrafı büyütülmüş`} className="max-h-[90vh] max-w-full rounded-xl object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-0.5 whitespace-pre-wrap break-words text-xs font-semibold">{value || "Belirtilmemiş"}</p></div>;
}

function TextBlock({ title, text }: { title: string; text?: string }) {
  return <div className="rounded-xl border border-border/60 bg-muted/20 p-3"><p className="text-xs font-bold">{title}</p><p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{text || "Kayıt yok."}</p></div>;
}
