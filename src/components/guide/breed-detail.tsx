"use client";

import {
  Activity,
  Heart,
  Baby,
  Dog,
  HeartPulse,
  Home,
  Ruler,
  Scissors,
  ShieldCheck,
  Timer,
  Volume2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import type { Breed } from "@/lib/types";

export function BreedDetailDialog({
  breed,
  open,
  onOpenChange,
}: {
  breed: Breed | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!breed) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={breed.name}
      description={`${breed.origin} · ${breed.lifespan} · ${breed.weight}`}
      className="sm:max-w-2xl"
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {breed.description}
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <InfoTile label="Tüy" value={breed.coat} />
          <InfoTile label="Aktivite" value={breed.activity} />
          <InfoTile label="Yaşam süresi" value={breed.lifespan} />
          <InfoTile label="Kilo" value={breed.weight} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailBlock
            icon={<Scissors className="h-3.5 w-3.5" aria-hidden="true" />}
            title="Tüy bakımı"
            tone="text-primary-strong"
          >
            <p className="text-sm">{breed.grooming}</p>
            {breed.coat.toLowerCase().includes("uzun") ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Uzun tüylü ırklarda günlük tarama, tüy yumağı ve cilt sorunlarını
                önler.
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Kısa tüylü ırklarda haftalık tarama yeterlidir; dökülme
                mevsimlerinde sıklığı artırın.
              </p>
            )}
          </DetailBlock>

          <DetailBlock
            icon={<Activity className="h-3.5 w-3.5" aria-hidden="true" />}
            title="Aktivite ve egzersiz"
            tone="text-emerald-700 dark:text-emerald-300"
          >
            <p className="text-sm">
              {breed.activity === "Yüksek" || breed.activity === "Çok yüksek"
                ? "Yüksek enerjili: günde en az 2-3 seans (30-45 dk) interaktif oyun."
                : breed.activity === "Düşük" || breed.activity === "Düşük-Orta"
                  ? "Sakin ırk: günde 1-2 kısa seans (10-15 dk) yeterlidir."
                  : "Orta enerji: günde 2 seans (15-20 dk) oyun ve tırmanma alanı."}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tırmanma ağacı, pencere izleme noktası ve avlanma oyunları (tüy
              çubuğu, lazer) zenginleştirme sağlar.
            </p>
          </DetailBlock>

          <DetailBlock
            icon={<Volume2 className="h-3.5 w-3.5" aria-hidden="true" />}
            title="Ses ve iletişim"
            tone="text-violet-600 dark:text-violet-300"
          >
            <p className="text-sm">
              {breed.traits.some((t) => /konuş|vokal|sesli/i.test(t))
                ? "Vokal bir ırk: miyavlama ve seslenme ile iletişim kurar."
                : "Genellikle sessizdir; miyavlama daha çok ihtiyaç (mama, su) içindir."}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Aşırı miyavlama stres, can sıkıntısı veya sağlık sorunu işaretidir.
            </p>
          </DetailBlock>

          <DetailBlock
            icon={<Home className="h-3.5 w-3.5" aria-hidden="true" />}
            title="Ev ortamı ve uyum"
            tone="text-sky-600 dark:text-sky-300"
          >
            <p className="text-sm">
              {breed.activity === "Yüksek"
                ? "Geniş ve zenginleştirilmiş bir ortam ister; apartman dairesinde sıkılabilir."
                : "Apartman yaşamına uyumludur; pencere ve tırmanma alanı yeterlidir."}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Tek kedi olarak da mutlu olabilir; sosyal ırklarda ikinci bir kedi
              şirketi azaltır.
            </p>
          </DetailBlock>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <Scissors className="h-3.5 w-3.5" aria-hidden="true" />
            Bakım notları
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {breed.careNotes.map((note) => (
              <li key={note} className="flex gap-2 text-xs leading-relaxed">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                />
                {note}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Beslenme önerileri
          </p>
          <ul className="mt-1.5 space-y-1.5 text-xs leading-relaxed">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Yaş ve aktiviteye uygun, yüksek proteinli mama tercih edin.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {breed.activity === "Yüksek"
                ? "Yüksek enerji için kalori değeri yüksek mama; porsiyonu aktiviteye göre ayarlayın."
                : "Kilo kontrolü için porsiyon ölçüsü ve düzenli tartım."}
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Yaşlılıkta böbrek ve eklem destekli mamaları veterinerinize danışın.
            </li>
          </ul>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <HeartPulse className="h-3.5 w-3.5 text-danger" aria-hidden="true" />
            Sağlık riskleri
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {breed.healthRisks.map((risk) => (
              <Badge key={risk} variant="destructive">
                {risk}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <Baby className="h-3.5 w-3.5" aria-hidden="true" />
            Uyumluluk
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge variant="secondary">
              Çocuklarla:{" "}
              {breed.activity === "Düşük" ? "Orta" : "İyi"}
            </Badge>
            <Badge variant="secondary">
              Köpeklerle: {breed.activity === "Yüksek" ? "İyi" : "Orta"}
            </Badge>
            <Badge variant="secondary">
              Çoklu kedi: {breed.activity === "Düşük" ? "İyi" : "Orta"}
            </Badge>
          </div>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-primary-strong" aria-hidden="true" />
            Sevdikleri / Sevmedikleri
          </p>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-accent/10 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Sever
              </p>
              <ul className="mt-1 space-y-1 text-xs leading-relaxed">
                {(breed.activity === "Yüksek" || breed.activity === "Çok yüksek"
                  ? ["İnteraktif oyun", "Tırmanma ve zıplama", "Pencere izleme", "Bulmaca mama kapları"]
                  : breed.activity === "Düşük" || breed.activity === "Düşük-Orta"
                    ? ["Sakin ortam", "Yumuşak yatak", "Kucağa oturma", "Nazik tımar"]
                    : ["Düzenli oyun", "Tırmalama direği", "Kucak ve sevme", "Güneşli pencere"]
                ).map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <span aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-destructive/10 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-danger">
                Sevmez
              </p>
              <ul className="mt-1 space-y-1 text-xs leading-relaxed">
                {(breed.coat.toLowerCase().includes("uzun")
                  ? ["Sık tarama (başlangıçta)", "Gürültülü ortam", "Ani değişimler", "Yalnızlık"]
                  : ["Banyo", "Kucağa zorlama", "Gürültü", "Yabancılar (ilk temasta)"]
                ).map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <span aria-hidden="true">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {breed.traits.map((trait) => (
            <span
              key={trait}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary-strong"
            >
              <Activity className="h-3 w-3" aria-hidden="true" />
              {trait}
            </span>
          ))}
        </div>

        <p className="rounded-lg bg-muted/60 p-2.5 text-[10px] leading-relaxed text-muted-foreground">
          Irk bilgileri genel bilgilendirme amaçlıdır. Sağlık riskleri açısından
          veterinerinizle düzenli kontrol planlayın.
        </p>
      </div>
    </Dialog>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}

function DetailBlock({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${tone}`}>
        {icon}
        {title}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
