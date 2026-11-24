"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  BookOpen,
  Heart,
  Search,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, GuideBlocks } from "@/components/ui/accordion";
import { EmptyState } from "@/components/ui/empty-state";
import { BreedExplorer } from "@/components/guide/breed-explorer";
import { Calculators, CalculatorTeaser } from "@/components/guide/calculators";
import { guideCategories, getGuideCategory } from "@/lib/guide-data";
import { formatDateWithWeekday, getBreed, guideChecklistItemId } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";

type CatGuideTab = "likes" | "dislikes" | "care" | "health";

const CAT_GUIDE_TABS: { id: CatGuideTab; label: string }[] = [
  { id: "likes", label: "Sevdikleri" },
  { id: "dislikes", label: "Sevmedikleri" },
  { id: "care", label: "Bakım" },
  { id: "health", label: "Sağlık" },
];

function GuideChecklistList({
  items,
  checkedItemIds,
  onToggleItem,
}: {
  items: string[];
  checkedItemIds: ReadonlySet<string>;
  onToggleItem: (itemId: string) => void;
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, index) => {
        const itemId = guideChecklistItemId(item, index);
        return (
          <li key={itemId} className="text-sm">
            <label className="flex cursor-pointer items-start gap-2 rounded-lg p-1 -m-1">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                checked={checkedItemIds.has(itemId)}
                onChange={() => onToggleItem(itemId)}
              />
              <span>{item}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

const CHIPS = [
  ...guideCategories.map((category) => ({
    id: category.id,
    title: category.title,
    emoji: category.emoji,
  })),
  { id: "saved", title: "Kaydedilenler", emoji: "🔖" },
  { id: "calculators", title: "Hesaplayıcılar", emoji: "🧮" },
];

export function GuideView() {
  const {
    t,
    settings,
    updateSettings,
    cats,
    activeCat,
    activeDate,
    isHistoricalDate,
    setActiveDate,
    returnToToday,
    guideChecklistEntries,
    toggleGuideChecklistItem,
  } = useApp();

  const toggleFavorite = (sectionId: string) => {
    const current = settings.guideFavorites ?? [];
    const next = current.includes(sectionId)
      ? current.filter((id) => id !== sectionId)
      : [...current, sectionId];
    updateSettings({ guideFavorites: next });
  };
  const [active, setActive] = useState("nutrition");
  const [query, setQuery] = useState("");
  const [catId, setCatId] = useState<string | null>(null);
  const [catTab, setCatTab] = useState<CatGuideTab>("likes");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    const kategori = params.get("kategori");
    if (cat) setCatId(cat);
    else if (kategori && CHIPS.some((chip) => chip.id === kategori)) setActive(kategori);
  }, []);

  const category = getGuideCategory(active);

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    if (q.length < 2) return [];
    return guideCategories.flatMap((cat) =>
      cat.sections
        .filter((section) => {
          const haystack = [
            section.title,
            section.summary,
            ...section.blocks.flatMap((block) => {
              if (block.type === "list") return block.items;
              if (block.type === "table") return [...block.headers, ...block.rows.flat()];
              if (block.type === "p" || block.type === "tip" || block.type === "warn")
                return [block.text];
              return [];
            }),
          ]
            .join(" ")
            .toLocaleLowerCase("tr-TR");
          return haystack.includes(q);
        })
        .map((section) => ({ category: cat, section })),
    );
  }, [query]);

  const searching = query.trim().length >= 2;

  // Kediye özel rehber modu: mevcut cat-profile bağlantısı /guide?cat=... ile gelir.
  if (catId) {
    const cat = cats.find((item) => item.id === catId);
    if (!cat) {
      return (
        <div>
          <PageHeader emoji="🐾" title="Kediye özel rehber" subtitle="Kedi bulunamadı." />
          <ButtonLink href="/guide" variant="outline" size="sm">
            Rehbere dön
          </ButtonLink>
        </div>
      );
    }

    const breed = getBreed(cat.breedId);
    const age = Math.max(0, Math.floor(
      (new Date(`${activeDate}T12:00:00`).getTime() - new Date(`${cat.birthDate}T12:00:00`).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    ));
    const likes =
      breed && (breed.activity === "Yüksek" || breed.activity === "Çok yüksek")
        ? ["İnteraktif oyun (tüy çubuğu, lazer)", "Tırmanma ve zıplama", "Pencere izleme", "Bulmaca mama kapları", "Kovalamaca oyunları"]
        : breed && (breed.activity === "Düşük" || breed.activity === "Düşük-Orta")
          ? ["Sakin ortam", "Yumuşak yatak", "Kucağa oturma", "Nazik tımar", "Güneşli pencere"]
          : ["Düzenli oyun", "Tırmalama direği", "Kucak ve sevme", "Güneşli pencere", "Kokulu oyuncaklar"];
    const dislikes =
      breed && breed.coat.toLowerCase().includes("uzun")
        ? ["Sık tarama (başlangıçta)", "Gürültülü ortam", "Ani değişimler", "Yalnızlık", "Kirli kum kabı"]
        : ["Banyo", "Kucağa zorlama", "Gürültü", "Yabancılar (ilk temasta)", "Ani sesler"];
    const relevant = guideCategories.filter((category) =>
      ["nutrition", "health", "dos", "donts"].includes(category.id),
    );
    const checkedIdsForSection = (sectionId: string) =>
      new Set(
        guideChecklistEntries
          .filter(
            (entry) =>
              entry.catId === cat.id &&
              entry.date === activeDate &&
              entry.sectionId === sectionId,
          )
          .map((entry) => entry.itemId),
      );

    return (
      <div className="space-y-4">
        <PageHeader
          emoji="🐾"
          title={`${cat.name} için özel rehber`}
          subtitle={`${breed?.name ?? "Bilinmeyen ırk"} · ${cat.weight} kg · ${age} yaş`}
          action={
            <ButtonLink href="/guide" variant="outline" size="sm">
              Tüm rehber
            </ButtonLink>
          }
        />

        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-2xl">
                🐱
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-extrabold">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  {breed?.name ?? "Irk seçilmemiş"} · {breed?.origin ?? ""} · {breed?.activity ?? "Orta"} aktivite
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{breed?.coat ?? "Tüy bilgisi yok"}</Badge>
                  <Badge variant="secondary">{breed?.grooming ?? "Tarama: haftalık"}</Badge>
                  <Badge variant="secondary">{breed?.lifespan ?? "Yaşam süresi"}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-xs font-medium">{formatDateWithWeekday(activeDate)} · Tikler {cat.name} profiline kaydedilir.</p>
          {isHistoricalDate ? <button type="button" onClick={returnToToday} className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold">Bugüne dön</button> : null}
        </div>

        <div className="flex gap-2" role="tablist" aria-label="Kediye özel rehber sekmeleri">
          {CAT_GUIDE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={catTab === tab.id}
              onClick={() => setCatTab(tab.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                catTab === tab.id
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {catTab === "likes" ? (
          <Card className="border-accent/30 bg-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-accent" aria-hidden="true" />
                {cat.name} bunları sever
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GuideChecklistList
                items={likes}
                checkedItemIds={checkedIdsForSection("cat-guide:likes")}
                onToggleItem={(itemId) => toggleGuideChecklistItem(cat.id, "cat-guide:likes", itemId)}
              />
              <p className="mt-3 text-[11px] text-muted-foreground">
                Beğendiği aktiviteleri günlük rutine ekleyin; oyun ve zenginleştirme stresi azaltır, obeziteyi önler.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {catTab === "dislikes" ? (
          <Card className="border-destructive/25 bg-destructive/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1.5 text-danger">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {cat.name} bunlardan hoşlanmaz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GuideChecklistList
                items={dislikes}
                checkedItemIds={checkedIdsForSection("cat-guide:dislikes")}
                onToggleItem={(itemId) => toggleGuideChecklistItem(cat.id, "cat-guide:dislikes", itemId)}
              />
              <p className="mt-3 text-[11px] text-muted-foreground">
                Bu durumlardan kaçının veya kademeli alıştırma yapın; stres ve tırmalama gibi davranış sorunlarını azaltır.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {catTab === "care" ? (
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Bakım notları</CardTitle>
              </CardHeader>
              <CardContent>
                <GuideChecklistList
                  items={breed?.careNotes ?? ["Düzenli tarama, tırnak bakımı ve diş temizliği yapın."]}
                  checkedItemIds={checkedIdsForSection("cat-guide:care-notes")}
                  onToggleItem={(itemId) => toggleGuideChecklistItem(cat.id, "cat-guide:care-notes", itemId)}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Tüy ve hijyen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-semibold">Tüy:</span> {breed?.coat ?? "Kısa tüylü"}</p>
                <p><span className="font-semibold">Tarama:</span> {breed?.grooming ?? "Haftada 1-2 kez"}</p>
                <p className="text-muted-foreground">
                  Kum kabını günde 2 kez temizleyin; su kabını her gün tazeleyin; tırnakları 2-3 haftada bir kesin.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {catTab === "health" ? (
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Sağlık riskleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {(breed?.healthRisks ?? ["Düzenli veteriner kontrolü"]).map((risk) => (
                    <Badge key={risk} variant="destructive">{risk}</Badge>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Bu riskler genel bilgilendirmedir; veterinerinizle düzenli kontrol planı oluşturun.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Uyumluluk ve ortam</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Aktivite seviyesi: <span className="font-semibold">{breed?.activity ?? "Orta"}</span></p>
                <p className="text-muted-foreground">
                  {breed?.activity === "Yüksek" || breed?.activity === "Çok yüksek"
                    ? "Geniş ve zenginleştirilmiş ortam gerekir; apartman dairesinde sıkılabilir."
                    : "Apartman yaşamına uyumludur; pencere ve tırmanma alanı yeterlidir."}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            İlgili rehber bölümleri
          </p>
          {relevant.map((category) => (
            <div key={category.id} className="space-y-2">
              <p className="text-sm font-bold">{category.emoji} {category.title}</p>
              <Accordion>
                {category.sections.map((section) => (
                  <AccordionItem
                    key={section.id}
                    title={section.title}
                    subtitle={section.summary}
                    defaultOpen={false}
                    tone={category.id === "donts" ? "danger" : category.id === "dos" ? "success" : "default"}
                  >
                    <GuideBlocks
                      blocks={section.blocks}
                      checklist={{
                        checkedItemIds: checkedIdsForSection(section.id),
                        onToggleItem: (itemId) => toggleGuideChecklistItem(cat.id, section.id, itemId),
                      }}
                    />
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
          PatiRehber içerikleri genel bilgilendirme amaçlıdır ve veteriner hekim tavsiyesi yerine geçmez.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        emoji="📚"
        title={t("guide.title")}
        tourTarget="guide-overview"
        subtitle="Beslenmeden davranışa, 51 ırk rehberinden acil durumlara kadar ihtiyacın olan her şey."
        action={
          <ButtonLink href="/emergency" variant="destructive-soft" size="sm">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Acil durum
          </ButtonLink>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-3">
        <div className="min-w-0">
          <p className="text-xs font-bold">Günlük rehber işaretleri</p>
          <p className="text-[11px] text-muted-foreground">{activeCat ? `${activeCat.name} · ` : "Kedi seçilmedi · "}{formatDateWithWeekday(activeDate)} için</p>
        </div>
        <div className="flex items-center gap-2">
          <Input aria-label="Rehber tarihi" type="date" value={activeDate} max={new Date().toLocaleDateString("en-CA")} onChange={(event) => setActiveDate(event.target.value)} className="h-9 w-[145px] text-xs" />
          {isHistoricalDate ? <button type="button" onClick={returnToToday} className="whitespace-nowrap rounded-lg border px-2.5 py-2 text-xs font-semibold hover:bg-muted">Bugüne dön</button> : null}
        </div>
      </div>

      {/* Arama */}
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rehberde ara: mama geçişi, kum, aşı, zambak…"
          aria-label="Rehberde ara"
          className="pe-10 ps-10"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Aramayı temizle"
            className="absolute end-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* Kategori seçimi */}
      <div
        className="no-scrollbar -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1"
        role="tablist"
        aria-label="Rehber kategorileri"
      >
        {CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={active === chip.id}
            onClick={() => {
              setActive(chip.id);
              setQuery("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition ${
              active === chip.id && !searching
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <span aria-hidden="true">{chip.emoji}</span>
            {chip.title}
          </button>
        ))}
      </div>

      {searching ? (
        <section aria-label="Arama sonuçları" className="animate-fade-in">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground" role="status">
              “{query}” için {results.length} sonuç
            </p>
            <Badge variant="outline">
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              Bilgi bankası
            </Badge>
          </div>
          {results.length === 0 ? (
            <EmptyState
              emoji="🔍"
              title="Sonuç bulunamadı"
              description="Farklı bir kelime deneyin veya kategori kartlarından göz atın."
            />
          ) : (
            <div className="space-y-2.5">
              {results.map(({ category: cat, section }) => (
                <div key={`${cat.id}-${section.id}`}>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary-strong">
                    {cat.emoji} {cat.title}
                  </p>
                  <Accordion>
                    <AccordionItem
                      title={section.title}
                      subtitle={section.summary}
                      defaultOpen
                      tone={
                        cat.id === "donts"
                          ? "danger"
                          : cat.id === "dos"
                            ? "success"
                            : "default"
                      }
                    >
                      <div className="mb-3 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(section.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          {(settings.guideFavorites ?? []).includes(section.id) ? (
                            <Bookmark className="h-3.5 w-3.5 fill-current text-primary-strong" aria-hidden="true" />
                          ) : (
                            <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {(settings.guideFavorites ?? []).includes(section.id)
                            ? "Kaydedildi"
                            : "Kaydet"}
                        </button>
                      </div>
                      <GuideBlocks blocks={section.blocks} checklist={activeCat ? { checkedItemIds: new Set(guideChecklistEntries.filter((entry) => entry.catId === activeCat.id && entry.date === activeDate && entry.sectionId === section.id).map((entry) => entry.itemId)), onToggleItem: (itemId) => toggleGuideChecklistItem(activeCat.id, section.id, itemId) } : undefined} />
                      <button
                        type="button"
                        onClick={() => {
                          setActive(cat.id);
                          setQuery("");
                        }}
                        className="mt-3 text-[11px] font-bold text-primary-strong hover:underline"
                      >
                        {cat.title} bölümüne git →
                      </button>
                    </AccordionItem>
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : active === "calculators" ? (
        <section aria-label="Hesaplayıcılar" className="animate-fade-in">
          <div className="mb-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-display text-base font-bold">🧮 Hesaplayıcılar</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Sonuçlar tahminidir; mama paketindeki kalori değerini ve
              veterinerinizin önerilerini esas alın.
            </p>
          </div>
          <Calculators />
        </section>
      ) : active === "breeds" ? (
        <section aria-label="Irk rehberi" className="animate-fade-in">
          <div className="mb-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
            <p className="font-display text-base font-bold">🐾 Irk rehberi</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              51 ırkın özellikleri, tüy bakımı, aktivite ihtiyacı ve sağlık
              riskleri. Kedi profiline ırk eklediğinde bakım notları otomatik
              görünür.
            </p>
          </div>
          <BreedExplorer />
        </section>
      ) : active === "saved" ? (
        <section aria-label="Kaydedilenler" className="animate-fade-in space-y-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="font-display text-base font-bold">🔖 Kaydedilenler</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Rehberden kaydettiğin bölümler burada. Bir bölümü kaydetmek için içindeki
              &quot;Kaydet&quot; butonunu kullan.
            </p>
          </div>
          {(() => {
            const saved = (settings.guideFavorites ?? [])
              .map((id) => {
                for (const cat of guideCategories) {
                  const sec = cat.sections.find((s) => s.id === id);
                  if (sec) return { cat, section: sec };
                }
                return null;
              })
              .filter((x): x is { cat: (typeof guideCategories)[number]; section: (typeof guideCategories)[number]["sections"][number] } => !!x);
            if (saved.length === 0) {
              return (
                <EmptyState
                  emoji="🔖"
                  title="Henüz kaydedilen yok"
                  description="Beğendiğin bölümleri kaydederek burada hızlıca bulabilirsin."
                />
              );
            }
            return (
              <Accordion>
                {saved.map(({ cat, section }) => (
                  <AccordionItem
                    key={section.id}
                    title={section.title}
                    subtitle={`${cat.emoji} ${cat.title} · ${section.summary}`}
                    defaultOpen={false}
                  >
                    <div className="mb-3 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(section.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      >
                        <Bookmark className="h-3.5 w-3.5 fill-current text-primary-strong" aria-hidden="true" />
                        Çıkar
                      </button>
                    </div>
                    <GuideBlocks blocks={section.blocks} checklist={activeCat ? { checkedItemIds: new Set(guideChecklistEntries.filter((entry) => entry.catId === activeCat.id && entry.date === activeDate && entry.sectionId === section.id).map((entry) => entry.itemId)), onToggleItem: (itemId) => toggleGuideChecklistItem(activeCat.id, section.id, itemId) } : undefined} />
                  </AccordionItem>
                ))}
              </Accordion>
            );
          })()}
        </section>
      ) : category ? (
        <section
          aria-label={category.title}
          className="animate-fade-in space-y-3"
        >
          <div
            className={`rounded-2xl border p-4 ${
              category.id === "donts"
                ? "border-destructive/25 bg-destructive-soft"
                : category.id === "dos"
                  ? "border-accent/30 bg-accent/10"
                  : "border-border/70 bg-card"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${category.tint}`}
              >
                {category.emoji}
              </span>
              <div>
                <p className="font-display text-base font-bold">{category.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {category.description}
                </p>
              </div>
            </div>
            {category.id === "donts" ? (
              <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-destructive/10 px-2.5 py-2 text-[11px] font-semibold text-danger">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Bu maddelerden biri tüketildiyse vakit kaybetmeden veterinerinizi
                arayın.
              </p>
            ) : null}
          </div>

          <Accordion>
            {category.sections.map((section, index) => (
              <AccordionItem
                key={section.id}
                title={section.title}
                subtitle={section.summary}
                icon={category.emoji}
                defaultOpen={index === 0}
                tone={
                  category.id === "donts"
                    ? "danger"
                    : category.id === "dos"
                      ? "success"
                      : "default"
                }
              >
                <GuideBlocks blocks={section.blocks} checklist={activeCat ? { checkedItemIds: new Set(guideChecklistEntries.filter((entry) => entry.catId === activeCat.id && entry.date === activeDate && entry.sectionId === section.id).map((entry) => entry.itemId)), onToggleItem: (itemId) => toggleGuideChecklistItem(activeCat.id, section.id, itemId) } : undefined} />
              </AccordionItem>
            ))}
          </Accordion>

          {category.id !== "breeds" && category.id !== "calculators" ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setActive("calculators");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full text-start"
              >
                <CalculatorTeaser />
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <p className="mt-6 text-center text-[10px] leading-relaxed text-muted-foreground">
        PatiRehber içerikleri genel bilgilendirme amaçlıdır ve veteriner hekim
        tavsiyesi yerine geçmez. Acil durumlarda en yakın kliniğe başvurun.
      </p>
    </div>
  );
}
