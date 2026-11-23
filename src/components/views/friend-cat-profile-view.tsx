"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Cat as CatIcon } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getFriendCatDetail, type FriendCatDetail } from "@/lib/friends";
import { breedName, getCatAge } from "@/lib/utils";

export function FriendCatProfileView({
  friendId,
  catId,
}: {
  friendId: string;
  catId: string;
}) {
  const [detail, setDetail] = useState<FriendCatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <Link href="/friends" className="mt-3 inline-block text-sm font-bold text-primary-strong hover:underline">
          Arkadaşlara dön
        </Link>
      </div>
    );
  }

  const { cat } = detail;
  const age = getCatAge(cat.birthDate);

  return (
    <div>
      <PageHeader
        emoji="🐱"
        title={cat.name}
        subtitle={`${breedName(cat.breedId)} · ${age.label} · arkadaş kedisi`}
        action={
          <Link href="/friends">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Geri
            </Button>
          </Link>
        }
      />

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5">
            <CatIcon className="h-4 w-4 text-primary-strong" aria-hidden="true" />
            Paylaşılan temel bilgiler
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Ad" value={cat.name} />
          <Info label="Irk" value={breedName(cat.breedId)} />
          <Info label="Yaş" value={age.label} />
        </CardContent>
      </Card>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Fotoğraflar, sağlık kayıtları, kilo geçmişi, mikroçip, notlar ve veteriner bilgileri arkadaşlara gösterilmez.
      </p>
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
