"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  BookOpen,
  Search,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, GuideBlocks } from "@/components/ui/accordion";
import { EmptyState } from "@/components/ui/empty-state";
import { BreedExplorer } from "@/components/guide/breed-explorer";
import { Calculators, CalculatorTeaser } from "@/components/guide/calculators";
import { guideCategories, getGuideCategory } from "@/lib/guide-data";
import { useApp } from "@/components/providers/app-provider";

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
  const { t, settings, updateSettings } = useApp();

  const toggleFavorite = (sectionId: string) => {
    const current = settings.guideFavorites ?? [];
    const next = current.includes(sectionId)
      ? current.filter((id) => id !== sectionId)
      : [...current, sectionId];
    updateSettings({ guideFavorites: next });
  };
  const [active, setActive] = useState("nutrition");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("kategori");
    if (param && CHIPS.some((chip) => chip.id === param)) setActive(param);
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

  return (
    <div>
      <PageHeader
        emoji="📚"
        title={t("guide.title")}
        subtitle="Beslenmeden davranışa, 51 ırk rehberinden acil durumlara kadar ihtiyacın olan her şey."
        action={
          <ButtonLink href="/emergency" variant="destructive-soft" size="sm">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Acil durum
          </ButtonLink>
        }
      />

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
                      <GuideBlocks blocks={section.blocks} />
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
                    <GuideBlocks blocks={section.blocks} />
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
                <GuideBlocks blocks={section.blocks} />
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
