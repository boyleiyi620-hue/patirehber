"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function ResetPasswordView() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void createClient().auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError || !data.user) {
        setError("Parola yenileme bağlantısı geçersiz veya süresi dolmuş. Yeni bir bağlantı iste.");
      } else {
        setReady(true);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 10) {
      setError("Parola en az 10 karakter olmalı.");
      return;
    }
    if (password !== confirmation) {
      setError("Parolalar eşleşmiyor.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parola güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-2xl shadow-glow">🐾</div>
        <h1 className="font-display text-2xl font-extrabold">Yeni parola belirle</h1>
        <p className="mt-1 text-sm text-muted-foreground">Parolan en az 10 karakter olmalı.</p>
      </div>
      <Card>
        <CardContent className="space-y-4 p-5">
          {loading ? <p role="status" className="text-sm text-muted-foreground">Bağlantı doğrulanıyor…</p> : null}
          {ready ? (
            <form onSubmit={updatePassword} className="space-y-3">
              <div>
                <Label htmlFor="new-password">Yeni parola</Label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} required className="ps-10" />
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-password">Parolayı tekrar yaz</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={10} required className="mt-1" />
              </div>
              {error ? <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-xs text-danger">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Kaydediliyor…" : "Parolayı güncelle"}
              </Button>
            </form>
          ) : null}
          {!ready && error ? (
            <>
              <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-xs text-danger">{error}</p>
              <Button variant="outline" className="w-full" onClick={() => router.replace("/auth")}>Giriş sayfasına dön</Button>
            </>
          ) : null}
          {ready && error ? <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-xs text-danger">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
