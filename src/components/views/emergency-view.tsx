"use client";

import {
  AlertOctagon,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Flame,
  HeartPulse,
  Home,
  Package,
  Phone,
  ShieldAlert,
  Siren,
  Stethoscope,
  Thermometer,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const SYMPTOMS = [
  "Zorla nefes alma, morarma veya sürekli öksürük",
  "Nöbet, titreme, kasılma veya bilinç kaybı",
  "Sürekli kusma, kanlı ishal veya karın şişliği",
  "İdrar yapamama (özellikle erkek kedilerde)",
  "Sarı/mavi diş eti, solgunluk veya ani halsizlik",
  "Ağızda yanık, aşırı salya veya yutma güçlüğü",
  "Ani felç, denge kaybı veya topallık",
];

const POISONS: Array<{
  title: string;
  tone: "danger" | "warning";
  items: Array<{ name: string; note: string }>;
}> = [
  {
    title: "Yiyecekler",
    tone: "danger",
    items: [
      { name: "Çikolata, kakao, kahve", note: "Teobromin ve kafein kalp ritmini bozar." },
      { name: "Soğan, sarımsak, pırasa", note: "Kansızlığa yol açar; çiğ veya pişmiş fark etmez." },
      { name: "Üzüm ve kuru üzüm", note: "Böbrek yetmezliği riski; az miktarı bile tehlikeli." },
      { name: "Süt ve süt ürünleri", note: "Laktoz intoleransı; ishal ve gaz yapar." },
      { name: "Çiğ balık ve çiğ et", note: "Bakteri, parazit ve B1 vitamini eksikliği riski." },
      { name: "Alkol ve hamur mayası", note: "Mide şişmesi ve alkol zehirlenmesi." },
      { name: "Ksilitol (şekersiz şeker)", note: "Kan şekeri düşüklüğü ve karaciğer hasarı." },
      { name: "Makadamya fıstığı", note: "Kas zayıflığı ve titreme." },
    ],
  },
  {
    title: "Bitkiler",
    tone: "danger",
    items: [
      { name: "Zambak (lily)", note: "Az miktarda bile akut böbrek yetmezliği; poleni ve suyu da risklidir." },
      { name: "Sümbül, lale, nergis", note: "Soyları özellikle toksik; kusma ve titreme." },
      { name: "Difenbahya (dieffenbachia)", note: "Ağız ve boğazda yanma, solunum zorluğu." },
      { name: "Sarmaşık ve filodendron", note: "Ağız irritasyonu ve salya." },
      { name: "Siklamen, açelya, yüksük otu", note: "Kalp ve sinir sistemi üzerinde toksik etki." },
    ],
  },
  {
    title: "Ev kimyasalları",
    tone: "warning",
    items: [
      { name: "Çamaşır suyu ve deterjan", note: "Ağız ve sindirim yolu yanıkları; buharı da zararlı." },
      { name: "Antifriz (etilen glikol)", note: "Tatlı olduğu için içilebilir; böbrek hasarı çok hızlı." },
      { name: "Fare ve böcek ilaçları", note: "Kan pıhtılaşması ve nörolojik belirtiler." },
      { name: "Uçucu yağlar ve difüzör sıvıları", note: "Solunum ve karaciğer toksisitesi." },
      { name: "Kuru temizleme sıvıları, tiner", note: "Solunum ve cilt yanıkları." },
    ],
  },
  {
    title: "İlaçlar",
    tone: "warning",
    items: [
      { name: "Parasetamol (ağrı kesici)", note: "Kediler için ölümcül; tek tablet bile risk." },
      { name: "İbuprofen ve aspirin", note: "Mide kanaması ve böbrek hasarı." },
      { name: "Köpek parazit ürünleri", note: "Kedilerde nörolojik zehirlenme; asla kullanmayın." },
      { name: "İnsan vitaminleri ve takviyeler", note: "Doz ve içerik kedi metabolizmasına uygun değil." },
    ],
  },
];

const FIRST_AID = [
  {
    icon: <ShieldAlert className="h-4 w-4" aria-hidden="true" />,
    title: "1. Sakin kal ve uzaklaştır",
    text: "Kediyi toksik maddeden uzaklaştır, ambalajını kaldır. Panik yaptırmadan sakin bir taşıma kabına al.",
  },
  {
    icon: <Package className="h-4 w-4" aria-hidden="true" />,
    title: "2. Ambalajı ve bilgiyi sakla",
    text: "Yediği maddenin paketini, bitkisini veya ilacın kutusunu yanına al. Miktar ve zamanı not et.",
  },
  {
    icon: <Ban className="h-4 w-4" aria-hidden="true" />,
    title: "3. Kusmayı tetiklemeye çalışma",
    text: "Veteriner söylemedikçe kusturma. Tuzlu su, süt veya zeytinyağı verme; bazı maddelerde bu durumu kötüleştirir.",
  },
  {
    icon: <Phone className="h-4 w-4" aria-hidden="true" />,
    title: "4. Veterinerini ara",
    text: "Kliniği ara, maddeyi ve belirtileri anlat. Yola çıkarken aramak zaman kazandırır.",
  },
  {
    icon: <Thermometer className="h-4 w-4" aria-hidden="true" />,
    title: "5. Sıcak ve güvende tut",
    text: "Taşıma kabında battaniye kullan. Bilinci kapalıysa ağzına bir şey verme, başını yana çevir.",
  },
  {
    icon: <Siren className="h-4 w-4" aria-hidden="true" />,
    title: "6. Vakit kaybetme",
    text: "Zehirlenmede ilk saatler kritiktir. En yakın nöbetçi kliniğe git; yolda durumu izle.",
  },
];

export function EmergencyView() {
  const { activeCat } = useApp();
  const vetPhone = activeCat?.vet?.phone?.replace(/\s/g, "");

  return (
    <div>
      <PageHeader
        emoji="🆘"
        title="Acil Durum"
        tourTarget="emergency-overview"
        subtitle="Zehirlenme şüphesinde hızlı karar vermen için kontrol listesi."
        backHref="/"
        backLabel="Ana sayfa"
        action={
          <ButtonLink href="/guide?kategori=donts" variant="destructive-soft" size="sm">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Zehir listesi
          </ButtonLink>
        }
      />

      {/* Kırmızı uyarı bandı */}
      <div
        role="alert"
        className="animate-fade-in-up overflow-hidden rounded-3xl border border-destructive/30 bg-destructive-soft p-4"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-destructive/15 text-danger">
            <AlertOctagon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-base font-extrabold text-danger">
              Bu bir veteriner muayenesi yerine geçmez
            </p>
            <p className="mt-1 text-xs leading-relaxed text-danger/90">
              Zehirlenme, solunum güçlüğü, nöbet veya idrar yapamama gibi
              durumlarda bekleme. En yakın kliniği hemen ara veya doğrudan git.
            </p>
          </div>
        </div>
      </div>

      {/* Hızlı arama */}
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5">
            <Stethoscope className="h-4 w-4 text-primary-strong" aria-hidden="true" />
            Veterinerine ulaş
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {activeCat
              ? `${activeCat.name} profilindeki veteriner bilgileri`
              : "Kedi profiline veteriner bilgisi ekleyerek buradan tek dokunuşla arayabilirsin."}
          </p>
        </CardHeader>
        <CardContent>
          {activeCat?.vet?.name || activeCat?.vet?.clinic ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary-strong">
                  <Home className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {activeCat.vet?.name || "Veteriner"}
                  </p>
                  {activeCat.vet?.clinic ? (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {activeCat.vet.clinic}
                    </p>
                  ) : null}
                  {activeCat.vet?.phone ? (
                    <p className="mt-0.5 text-xs font-semibold">
                      {activeCat.vet.phone}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {vetPhone ? (
                  <a
                    href={`tel:${vetPhone}`}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground shadow-sm transition hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    Veterineri ara
                  </a>
                ) : (
                  <ButtonLink
                    href={`/cats/${activeCat.id}`}
                    variant="outline"
                    className="flex-1"
                  >
                    Telefon ekle
                  </ButtonLink>
                )}
                <ButtonLink href="/cats" variant="outline">
                  Kedi profili
                </ButtonLink>
              </div>
            </div>
          ) : (
            <EmptyState
              emoji="📞"
              title="Kayıtlı veteriner yok"
              description="Kedi profilini düzenleyip veteriner adı, klinik ve telefon bilgilerini ekle."
              action={<ButtonLink href="/cats">Kedilerime git</ButtonLink>}
            />
          )}

          <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-strong" aria-hidden="true" />
            <p>
              Klinik kapalıysa en yakın nöbetçi veteriner kliniğini araştır.
              Acil durumlarda 112 üzerinden yönlendirme isteyebilirsin; ancak
              hayvan hekimi müdahalesi için kliniğe gitmek gerekir.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* İlk adımlar */}
      <section className="mt-4" aria-labelledby="first-aid-heading">
        <h2
          id="first-aid-heading"
          className="mb-2 flex items-center gap-1.5 font-display text-base font-bold"
        >
          <HeartPulse className="h-4 w-4 text-danger" aria-hidden="true" />
          Şüphe varsa ilk 6 adım
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {FIRST_AID.map((step) => (
            <Card key={step.title}>
              <CardContent className="flex items-start gap-2.5 p-3.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-danger">
                  {step.icon}
                </span>
                <div>
                  <p className="text-xs font-bold">{step.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Acil belirtiler */}
      <Card className="mt-4 border-destructive/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-danger">
            <Flame className="h-4 w-4" aria-hidden="true" />
            Vakit kaybetmeden kliniğe
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Aşağıdaki belirtilerden biri varsa telefonla arayıp yola çık.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {SYMPTOMS.map((symptom) => (
              <li key={symptom} className="flex gap-2 text-xs leading-relaxed">
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger"
                  aria-hidden="true"
                />
                {symptom}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Zehir listesi */}
      <section className="mt-4" aria-labelledby="poison-heading">
        <h2
          id="poison-heading"
          className="mb-2 flex items-center gap-1.5 font-display text-base font-bold"
        >
          <Ban className="h-4 w-4 text-danger" aria-hidden="true" />
          Kediler için tehlikeli maddeler
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {POISONS.map((group) => (
            <Card
              key={group.title}
              className={
                group.tone === "danger"
                  ? "border-destructive/20"
                  : "border-amber-500/25"
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-sm">
                  {group.title}
                  <Badge
                    variant={group.tone === "danger" ? "destructive" : "secondary"}
                  >
                    {group.items.length} madde
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.name} className="flex gap-2">
                      <Ban
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-xs font-semibold">{item.name}</p>
                        <p className="text-[10px] leading-relaxed text-muted-foreground">
                          {item.note}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Yapılmaması gerekenler */}
      <Card className="mt-4 bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5">
            <AlertOctagon className="h-4 w-4 text-danger" aria-hidden="true" />
            Zehirlenmede yapılmaması gerekenler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {[
              "Veteriner söylemedikçe kusturmaya çalışma.",
              "Süt, yoğurt, zeytinyağı veya tuzlu su verme.",
              "İnsan ilacı veya ağrı kesici verme.",
              "Kediyi yalnız bırakıp belirtilerin geçmesini bekleme.",
              "Ağzına zorla su dökme; boğulma riski vardır.",
            ].map((item) => (
              <li key={item} className="flex gap-2 text-xs leading-relaxed">
                <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/10 p-2.5 text-[11px] leading-relaxed text-emerald-900 dark:text-emerald-100">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Doğru yapılan: maddeyi tanımla, ambalajı sakla, kliniği ara ve
              yola çık. İlk saatler tedavi şansını belirgin biçimde artırır.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-bold">Acil durum bilgilerini hazır tut</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Kedi profilindeki veteriner telefonunu ve klinik adresini güncel
              tut; acil anda zaman kaybetme.
            </p>
          </div>
          <ButtonLink href={activeCat ? `/cats/${activeCat.id}` : "/cats"} size="sm">
            Profili düzenle
          </ButtonLink>
        </CardContent>
      </Card>

      <p className="mt-5 text-center text-[10px] leading-relaxed text-muted-foreground">
        Bu sayfadaki bilgiler genel bilgilendirme amaçlıdır. Tanı ve tedavi için
        veteriner hekiminize başvurun.
      </p>
    </div>
  );
}
