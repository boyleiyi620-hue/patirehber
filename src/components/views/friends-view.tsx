"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Copy, ArrowLeft, Cat as CatIcon } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useApp } from "@/components/providers/app-provider";
import { breedName, getCatAge } from "@/lib/utils";
import {
  getMyFriendCode,
  sendFriendRequest,
  listFriendships,
  acceptFriendship,
  rejectFriendship,
  removeFriendship,
  getFriendProfile,
  getFriendCats,
  type FriendCat,
  type FriendshipRow,
  type FriendProfile,
} from "@/lib/friends";

export function FriendsView() {
  const { user, notify } = useApp();
  const [myCode, setMyCode] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [friendships, setFriendships] = useState<FriendshipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [friendProfile, setFriendProfile] = useState<FriendProfile | null>(null);
  const [friendCats, setFriendCats] = useState<FriendCat[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const code = await getMyFriendCode(user.id);
      setMyCode(code);
      const fs = await listFriendships(user.id);
      setFriendships(fs);
    } catch (e: any) {
      setError(e?.message ?? "Yuklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleInvite = async () => {
    if (!user || !inviteCode.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendFriendRequest(user.id, inviteCode);
      setInviteCode("");
      notify("Arkadaslik istegi gonderildi.");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gonderilemedi.");
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptFriendship(id);
      notify("Arkadaslik kabul edildi.");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Kabul edilemedi.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectFriendship(id);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Reddedilemedi.");
    }
  };

  const openFriend = async (friendId: string) => {
    setDetailLoading(true);
    setSelectedId(friendId);
    try {
      const [p, c] = await Promise.all([getFriendProfile(friendId), getFriendCats(friendId)]);
      setFriendProfile(p);
      setFriendCats(c);
    } catch (e: any) {
      setError(e?.message ?? "Profil yuklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeFriend = () => {
    setSelectedId(null);
    setFriendProfile(null);
    setFriendCats([]);
  };

  if (!user) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Arkadaslar icin giris yapmalisin.
      </div>
    );
  }

  const pendingReceived = friendships.filter((f) => f.status === "pending" && f.addressee_id === user.id);
  const pendingSent = friendships.filter((f) => f.status === "pending" && f.requester_id === user.id);
  const accepted = friendships.filter((f) => f.status === "accepted");

  const otherId = (f: FriendshipRow) => (f.requester_id === user.id ? f.addressee_id : f.requester_id);

  if (selectedId) {
    return (
      <div className="space-y-4">
        <PageHeader
          emoji="👤"
          title={friendProfile?.display_name ?? "Arkadas"}
          subtitle="Arkadas profili ve kedileri"
          action={
            <Button variant="outline" size="sm" onClick={closeFriend}>
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Geri
            </Button>
          }
        />
        {detailLoading ? (
          <p className="text-sm text-muted-foreground">Yukleniyor…</p>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Profil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <p>
                  <span className="font-semibold">Ad:</span> {friendProfile?.display_name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Arkadaş profilleri yalnızca temel bilgileri paylaşır; sağlık ve iletişim bilgileri özeldir.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-1.5">
                  <CatIcon className="h-4 w-4 text-primary-strong" aria-hidden="true" />
                  Kedileri ({friendCats.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friendCats.length === 0 ? (
                  <EmptyState emoji="🐱" title="Kedi yok" description="Bu kullanicinin henuz kedisi yok." />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {friendCats.map((cat) => {
                      const age = getCatAge(cat.birthDate);
                      return (
                        <Link key={cat.id} href={`/friends/${selectedId}/cats/${cat.id}`} className="block">
                          <Card className="overflow-hidden card-hover">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-xl">🐱</div>
                              <div className="min-w-0 flex-1">
                                <p className="font-display text-base font-extrabold">{cat.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {breedName(cat.breedId)} · {age.label}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader emoji="👥" title="Arkadaslar" subtitle="Kodunla arkadas ekle, kedilerini gor." tourTarget="friends-overview" />

      {error ? (
        <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary-strong" aria-hidden="true" />
            Profilim
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">Ad:</span> {user.email ?? "Kullanici"}
          </p>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Arkadas kodun:</span>
            <Badge variant="secondary" className="font-mono text-sm">
              {loading ? "…" : myCode}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (myCode) {
                  navigator.clipboard?.writeText(myCode);
                  notify("Kod kopyalandi.");
                }
              }}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Bu kodu arkadasina gonder; o kodu girerek sana istek atabilir.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5">
            <UserPlus className="h-4 w-4 text-primary-strong" aria-hidden="true" />
            Arkadas ekle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Arkadas kodu (orn. ABCD1234)"
              aria-label="Arkadas kodu"
            />
            <Button onClick={handleInvite} disabled={sending || !inviteCode.trim()}>
              {sending ? "Gonderiliyor…" : "Davet gonder"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {pendingReceived.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Gelen istekler ({pendingReceived.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingReceived.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/70 p-3">
                <span className="text-sm font-semibold">{otherId(f)}</span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAccept(f.id)}>
                    Kabul
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(f.id)}>
                    Reddet
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {pendingSent.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Gonderilen istekler ({pendingSent.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingSent.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/70 p-3">
                <span className="text-sm font-semibold">{otherId(f)}</span>
                <Badge variant="secondary">Beklemede</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Arkadaslarim ({accepted.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Yukleniyor…</p>
          ) : accepted.length === 0 ? (
            <EmptyState emoji="👥" title="Henuz arkadas yok" description="Kod ile arkadas ekleyerek basla." />
          ) : (
            <div className="space-y-2">
              {accepted.map((f) => {
                const fid = otherId(f);
                return (
                  <div key={f.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/70 p-3">
                    <span className="text-sm font-semibold">{fid}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="soft" onClick={() => openFriend(fid)}>
                        Profili gor
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeFriendship(f.id).then(load)}>
                        Kaldir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
