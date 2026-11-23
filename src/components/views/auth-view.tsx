"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cat, Mail, Lock, User, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function AuthView() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        // Auto-confirm açık: doğrudan giriş yap
        window.location.href = "/";
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const sendPasswordReset = async () => {
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError("Önce e-posta adresini gir.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=%2Fauth%2Freset`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("E-posta adresin kayıtlıysa parola yenileme bağlantısı gönderildi.");
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-2xl shadow-glow">
          🐾
        </div>
        <h1 className="font-display text-2xl font-extrabold">PatiRehber</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kedi bakımını tek yerden yönet.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex gap-1 rounded-xl border border-border/70 bg-card p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                mode === "login" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Giriş yap
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                mode === "register" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Kayıt ol
            </button>
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "register" ? (
              <div>
                <Label htmlFor="name">Adınız</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="ps-10"
                    required
                  />
                </div>
              </div>
            ) : null}
            <div>
              <Label htmlFor="email">E-posta</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                  className="ps-10"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "En az 10 karakter" : "Şifren"}
                  className="ps-10"
                  required
                  minLength={mode === "register" ? 10 : undefined}
                />
              </div>
            </div>

            {error ? (
              <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-xs text-danger">{error}</p>
            ) : null}
            {message ? (
              <p className="rounded-lg bg-accent/15 p-2 text-xs text-emerald-700 dark:text-emerald-300">{message}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "İşleniyor…" : mode === "login" ? "Giriş yap" : "Kayıt ol"}
            </Button>
          </form>

          {mode === "login" ? (
            <button
              type="button"
              onClick={() => void sendPasswordReset()}
              disabled={loading}
              className="w-full text-center text-xs font-semibold text-primary-strong underline-offset-2 hover:underline disabled:opacity-60"
            >
              Şifremi unuttum
            </button>
          ) : null}

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-card px-2 text-[10px] uppercase tracking-wide text-muted-foreground">veya</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Google ile devam et
          </Button>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">
        Kayıt olarak Kullanım Koşulları ve Gizlilik Politikasını kabul etmiş olursunuz.
        Verileriniz Supabase üzerinde güvenle saklanır.
      </p>
    </div>
  );
}
