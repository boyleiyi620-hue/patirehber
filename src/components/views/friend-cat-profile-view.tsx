"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Cat as CatIcon } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { WeightChart } from "@/components/cats/weight-chart";
import { BreedDetailDialog } from "@/components/guide/breed-detail";
import { getBreed } from "@/lib/utils";
import { getFriendCatDetail, type FriendCatDetail } from "@/lib/friends";
import { breedName, getCatAge, formatDateLong } from "@/lib/utils";

export function FriendCatProfileView({ catId }: { catId: string }) {
  const [detail, setDetail] = useState<FriendCatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("genel");
  const [breedOpen, setBreedOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const d = await getFriendCatDetail(catId);
        if (!cancelled) setDetail(d);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Yuklenemedi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [catId]);

  if (loading) return <p className="text-sm text-muted-foreground">Yukleniyor…</p>;
  if (error || !detail) {
    return (
      <div className="py-10 text-center">
        <EmptyState emoji="🐈" title="Kedi bulunamadi" description={error ?? "Bu kediye erisim yok."} />
        <Link href="/friends" className="mt-3 inline-block text-sm font-bold text-primary-strong hover:underline">
          Arkadaslara don
        </Link>
      </div>
    );
  }

  const { cat } = detail;
  const breed = getBreed(cat.breedId);
  const age = getCatAge(cat.birthDate);

  return (
    <div>
      <PageHeader
        emoji="🐱"
        title={cat.name}
        subtitle={`${breed?.name ?? "Irk"} · ${age.label} · (arkadas kedisi)`}
        action={
          <Link href="/friends">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Geri
            </Button>
          </Link>
        }
      />

      <Tabs
        items={[
          { value: "genel", label: "Genel" },
          { value: "bakim", label: "Bakim" },
          { value: "asi", label: "Asilar" },
          { value: "kilo", label: "Kilo" },
          { value: "galeri", label: "Galeri" },
          { value: "saglik", label: "Saglik" },
        ]}
        value={tab}
        onValueChange={setTab}
        ariaLabel="Kedi profili sekmeleri"
      />

      <div className="mt-4 space-y-4">
        {tab === "genel" ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5">
                  <CatIcon className="h-4 w-4 text-primary-strong" aria-hidden="true" />
                  {cat.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Info label="Irk" value={breed?.name ?? "—"} />
                <Info label="Yas" value={age.label} />
                <Info label="Kilo" value={`${cat.weight} kg`} />
                <Info label="Cinsiyet" value={cat.gender === "female" ? "Disi" : "Erkek"} />
                <Info label="Kisir" value={cat.neutered ? "Evet" : "Hayir"} />
                <Info label="Aktivite" value={cat.activity} />
                {cat.color ? <Info label="Renk" value={cat.color} /> : null}
                {cat.microchip ? <Info label="Mikrocip" value={cat.microchip} /> : null}
                {cat.allergies ? <Info label="Alerjiler" value={cat.allergies} /> : null}
                {cat.medications ? <Info label="Ilaclar" value={cat.medications} /> : null}
              </CardContent>
            </Card>
            {breed ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>
                    <button type="button" onClick={() => setBreedOpen(true)} className="hover:underline">
                      {breed.name} — irk rehberini ac
                    </button>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{breed.description}</p>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Bakim notlari</p>
                    <ul className="mt-1.5 space-y-1.5">
                      {breed.careNotes.map((n) => (
                        <li key={n} className="flex gap-1.5 text-xs">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Saglik riskleri</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {breed.healthRisks.map((r) => (
                        <Badge key={r} variant="destructive">{r}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
            {cat.notes ? (
              <Card>
                <CardHeader className="pb-2"><CardTitle>Notlar</CardTitle></CardHeader>
                <CardContent><p className="text-sm whitespace-pre-wrap">{cat.notes}</p></CardContent>
              </Card>
            ) : null}
            {cat.healthNotes ? (
              <Card>
                <CardHeader className="pb-2"><CardTitle>Saglik notlari</CardTitle></CardHeader>
                <CardContent><p className="text-sm whitespace-pre-wrap">{cat.healthNotes}</p></CardContent>
              </Card>
            ) : null}
          </>
        ) : null}

        {tab === "bakim" ? (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle>Gunluk beslenme</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Su ihtiyaci: <span className="font-bold">{Math.round(cat.weight * 50)} - {Math.round(cat.weight * 60)} ml</span></p>
                <p className="text-muted-foreground">Kum kabini gunde 2 kez temizleyin; suyu her gun tazeleyin.</p>
              </CardContent>
            </Card>
            {breed ? (
              <Card>
                <CardHeader className="pb-2"><CardTitle>Tuy ve hijyen</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="font-semibold">Tuy:</span> {breed.coat}</p>
                  <p><span className="font-semibold">Tarama:</span> {breed.grooming}</p>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}

        {tab === "asi" ? (
          <Card>
            <CardHeader className="pb-2"><CardTitle>Asi gecmisi ({detail.vaccinations.length})</CardTitle></CardHeader>
            <CardContent>
              {detail.vaccinations.length === 0 ? (
                <EmptyState emoji="💉" title="Asi kaydi yok" />
              ) : (
                <ul className="space-y-2">
                  {detail.vaccinations.map((v) => (
                    <li key={v.id} className="rounded-xl border border-border/70 p-3 text-sm">
                      <p className="font-bold">{v.name}</p>
                      <p className="text-xs text-muted-foreground">Yapildi: {formatDateLong(v.date)}</p>
                      {v.nextDate ? <p className="text-xs text-muted-foreground">Sonraki: {formatDateLong(v.nextDate)}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        {tab === "kilo" ? (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle>Kilo grafigi</CardTitle></CardHeader>
              <CardContent>
                <WeightChart entries={detail.weightHistory} />
              </CardContent>
            </Card>
            {detail.weightHistory.length > 0 ? (
              <Card>
                <CardHeader className="pb-2"><CardTitle>Olcum gecmisi</CardTitle></CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border/60">
                    {[...detail.weightHistory].reverse().map((w) => (
                      <li key={w.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-muted-foreground">{formatDateLong(w.date)}</span>
                        <span className="font-bold">{w.kg} kg</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}

        {tab === "galeri" ? (
          <Card>
            <CardHeader className="pb-2"><CardTitle>Fotograf galerisi ({cat.gallery.length})</CardTitle></CardHeader>
            <CardContent>
              {cat.gallery.length === 0 ? (
                <EmptyState emoji="📸" title="Galeri bos" />
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {cat.gallery.map((photo, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={photo} alt={`${cat.name} ${i + 1}`} className="aspect-square w-full rounded-xl object-cover" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {tab === "saglik" ? (
          <Card>
            <CardHeader className="pb-2"><CardTitle>Saglik gecmisi ({detail.healthEntries.length})</CardTitle></CardHeader>
            <CardContent>
              {detail.healthEntries.length === 0 ? (
                <EmptyState emoji="🩺" title="Kayit yok" />
              ) : (
                <ul className="space-y-2">
                  {detail.healthEntries.map((h) => (
                    <li key={h.id} className="rounded-xl border border-border/70 p-3 text-sm">
                      <p className="font-bold">{h.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDateLong(h.date)} · {h.type}</p>
                      {h.note ? <p className="mt-1 text-xs text-muted-foreground">{h.note}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {breed ? <BreedDetailDialog breed={breed} open={breedOpen} onOpenChange={setBreedOpen} /> : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xs font-semibold">{value}</p>
    </div>
  );
}
