"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Gamepad2, RotateCcw, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type GameTab = "memory" | "quiz";

const MEMORY_EMOJIS = ["🐱", "🐾", "🧶", "🐟", "🥛", " mouse".trim(), "🐱", "🐾", "🧶", "🐟", "🥛", "🐭"];

const QUIZ_QUESTIONS = [
  { q: "Kediler günde ortalama kaç saat uyur?", options: ["8-10", "12-16", "20-22"], correct: 1, explain: "Kediler günde 12-16 saat uyur; yavrular ve yaşlılar daha fazla uyuyabilir." },
  { q: "Kediler için en toksik bitkilerden biri?", options: ["Nane", "Zambak (Lily)", "Catnip"], correct: 1, explain: "Zambak (Lily) kediler için son derece toksiktir; böbrek yetmezliğine yol açabilir." },
  { q: "Yetişkin kedi günde kaç öğün mama yemeli?", options: ["1", "2-3", "6"], correct: 1, explain: "Yetişkin kediler için günde 2-3 öğün idealdir; serbest besleme obezite riskini artırır." },
  { q: "Kediler suyu nasıl tercih eder?", options: ["Durgun", "Akarsu", "Buzlu"], correct: 1, explain: "Kediler akan suyu tercih eder; kedi çeşmesi su alımını artırır." },
  { q: "Normal kedi vücut ısısı (°C)?", options: ["36-37", "38-39", "40-41"], correct: 1, explain: "Normal kedi vücut ısısı 38-39 °C arasındadır." },
  { q: "Kedilerde ideal BCS (vücut kondisyon skoru)?", options: ["3", "5", "9"], correct: 1, explain: "BCS 5 idealdir; kaburgalar hafif bastırarak hissedilir." },
  { q: "Kedi tırnakları ne sıklıkla kesilmeli?", options: ["Her gün", "2-4 haftada bir", "Yılda bir"], correct: 1, explain: "Tırnaklar 2-4 haftada bir kontrol edilip kesilmelidir." },
  { q: "Hangi mama geçişi daha güvenli?", options: ["Aniden", "7-10 günde kademeli", "Hiç değiştirmeme"], correct: 1, explain: "Mama geçişi 7-10 günde kademeli yapılmalıdır." },
  { q: "Kedilerde günlük su ihtiyacı (ml/kg)?", options: ["10-20", "40-60", "100-120"], correct: 1, explain: "Sağlıklı kedi günde yaklaşık 40-60 ml/kg su almalıdır." },
  { q: "Hangi besin kediler için zehirlidir?", options: ["Tavuk", "Soğan/Sarımsak", "Pirinç"], correct: 1, explain: "Soğan ve sarımsak kedilerde anemiye yol açabilir." },
  { q: "Kedi kumu kaç cm derinlikte olmalı?", options: ["1-2 cm", "5-7 cm", "15 cm"], correct: 1, explain: "Kum derinliği 5-7 cm idealdir; kazma davranışını destekler." },
  { q: "İlk aşı (karma) ne zaman yapılmalı?", options: ["Doğumda", "6-8 haftalık", "1 yaşında"], correct: 1, explain: "İlk karma aşı 6-8 haftalıkken başlar." },
  { q: "Kısırlaştırma sonrası mama nasıl ayarlanmalı?", options: ["Aynı", "Kalori azaltılmalı", "İki katına çıkarılmalı"], correct: 1, explain: "Kısırlaştırma metabolizmayı yavaşlatır; kalori azaltılmalı ve kilo takibi yapılmalıdır." },
  { q: "Kedilerde obezite sınırı (BCS)?", options: ["5", "7", "9"], correct: 2, explain: "BCS 9 morbid obezitedir; 7+ kilo kontrolü gerektirir." },
  { q: "Hangi oyun kedi için en uygun zenginleştirmedir?", options: ["Sürekli lazer", "Tüy çubuğu + tırmanma", "Gürültülü oyuncak"], correct: 1, explain: "Tüy çubuğu avlanma içgüdüsünü tatmin eder; tırmanma alanı enerji atımı sağlar." },
  { q: "Kedi stresinin en sık belirtisi?", options: ["Uyuma", "Tuvalet dışı yapma", "Miyavlama"], correct: 1, explain: "Tuvalet alışkanlığında değişim stres veya sağlık sorunu işaretidir." },
  { q: "Yaşlı kedi (kaç yaş üstü) daha sık veteriner kontrolü ister?", options: ["3+", "7+", "12+"], correct: 1, explain: "7 yaş üstü kedilerde yıllık/biannual kontrol önerilir." },
  { q: "Kedi mamasındaki temel protein kaynağı ne olmalı?", options: ["Tahıl", "Et/balık", "Sebze"], correct: 1, explain: "Kediler obligat karnivordur; hayvansal protein temeldir." },
  { q: "Kedi taşıma kabı nasıl olmalı?", options: ["Açık üst", "Sağlam, havalandırmalı", "Çok büyük"], correct: 1, explain: "Sağlam ve havalandırmalı taşıma kabı güvenli seyahat sağlar." },
  { q: "Kedilerde parazit içten (barsak) taraması ne sıklıkla?", options: ["Yılda bir", "Her ay", "Hiç"], correct: 0, explain: "Dışkı tahlili yılda en az bir kez önerilir; veteriner planına göre." },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function GamesView() {
  const [tab, setTab] = useState<GameTab>("memory");

  return (
    <div className="space-y-5">
      <PageHeader
        emoji="🎮"
        title="Oyunlar"
        subtitle="Kedi bilginizi test edin, hafızanızı güçlendirin."
      />

      <div className="flex gap-2" role="tablist" aria-label="Oyun seçimi">
        {[
          { id: "memory", label: "Hafıza" },
          { id: "quiz", label: "Bilgi yarışması" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id as GameTab)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.id
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "memory" ? <MemoryGame /> : <QuizGame />}
    </div>
  );
}

/* --------------------------- Memory Game --------------------------- */
function MemoryGame() {
  const [cards, setCards] = useState(() => shuffle(MEMORY_EMOJIS.map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }))));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);

  const reset = useCallback(() => {
    setCards(shuffle(MEMORY_EMOJIS.map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false }))));
    setFlipped([]);
    setMoves(0);
    setLocked(false);
    setWon(false);
  }, []);

  useEffect(() => {
    if (flipped.length === 2) {
      setLocked(true);
      const [a, b] = flipped;
      setMoves((m) => m + 1);
      if (cards[a].emoji === cards[b].emoji) {
        setCards((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
        setFlipped([]);
        setLocked(false);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 900);
      }
    }
  }, [flipped, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.matched)) setWon(true);
  }, [cards]);

  const handleFlip = (index: number) => {
    if (locked || flipped.includes(index) || cards[index].matched) return;
    setFlipped((prev) => [...prev, index]);
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, flipped: true } : c)));
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-primary-strong" aria-hidden="true" />
            <p className="text-sm font-bold">Hafıza oyunu</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
            <span>Hamle: {moves}</span>
            <Button size="sm" variant="ghost" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Yeniden
            </Button>
          </div>
        </div>

        {won ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-accent/15 p-6 text-center bounce-in">
            <Trophy className="h-8 w-8 text-amber-500" aria-hidden="true" />
            <p className="font-display text-lg font-extrabold">Tebrikler!</p>
            <p className="text-xs text-muted-foreground">{moves} hamlede tamamladın.</p>
            <Button onClick={reset}>Tekrar oyna</Button>
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {cards.map((card, index) => {
            const show = card.flipped || card.matched || flipped.includes(index);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleFlip(index)}
                disabled={card.matched}
                aria-label={show ? card.emoji : "Kapalı kart"}
                className={cn(
                  "aspect-square rounded-2xl text-2xl transition-all duration-300 active:scale-95",
                  show
                    ? card.matched
                      ? "bg-accent/20 ring-2 ring-accent"
                      : "bg-primary/10 ring-2 ring-primary/40"
                    : "bg-muted hover:bg-muted/80",
                )}
              >
                {show ? card.emoji : "❓"}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* --------------------------- Quiz Game --------------------------- */
type QuizQuestion = (typeof QUIZ_QUESTIONS)[number];

function prepareQuestions() {
  return shuffle(QUIZ_QUESTIONS).map((q) => {
    const options = shuffle(q.options.map((text, i) => ({ text, correct: i === q.correct })));
    return { ...q, options };
  });
}

function QuizGame() {
  const [questions, setQuestions] = useState<ReturnType<typeof prepareQuestions>>(() => prepareQuestions());
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("patirehber:quiz-best");
      if (raw) setBest(Number(raw));
    } catch {}
  }, []);

  const q = questions[index];

  const handleAnswer = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (q.options[i].correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setDone(true);
      const finalScore = score + (selected !== null && q.options[selected]?.correct ? 0 : 0);
      // score already updated
      if (best === null || score > best) {
        setBest(score);
        try {
          localStorage.setItem("patirehber:quiz-best", String(score));
        } catch {}
      }
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  const reset = () => {
    setQuestions(prepareQuestions());
    setIndex(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <Trophy className="h-10 w-10 text-amber-500 bounce-in" aria-hidden="true" />
          <p className="font-display text-xl font-extrabold">Yarışma bitti!</p>
          <p className="text-sm text-muted-foreground">
            {score}/{questions.length} doğru · %{percent}
          </p>
          <div className="text-3xl">
            {percent >= 80 ? "🏆" : percent >= 50 ? "🎉" : "🐾"}
          </div>
          {best !== null ? (
            <p className="text-xs font-semibold text-muted-foreground">
              En iyi skor: {best}/{questions.length}
            </p>
          ) : null}
          <Button onClick={reset}>Tekrar oyna</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>
            Soru {index + 1}/{questions.length}
          </span>
          <span>Skor: {score}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
        <p className="font-display text-base font-bold leading-snug">{q.q}</p>
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const isCorrect = opt.correct;
            const isSelected = selected === i;
            const showResult = selected !== null;
            return (
              <button
                key={`${q.q}-${opt.text}-${i}`}
                type="button"
                onClick={() => handleAnswer(i)}
                disabled={selected !== null}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start text-sm font-semibold transition active:scale-[0.99]",
                  showResult
                    ? isCorrect
                      ? "border-accent bg-accent/15 text-emerald-800 dark:text-emerald-200"
                      : isSelected
                        ? "border-destructive bg-destructive/10 text-danger"
                        : "border-border bg-card text-muted-foreground"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                    showResult && isCorrect
                      ? "bg-accent text-accent-foreground"
                      : showResult && isSelected
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt.text}</span>
                {showResult && isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden="true" />
                ) : null}
                {showResult && isSelected && !isCorrect ? (
                  <XCircle className="h-4 w-4 text-danger" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
        {selected !== null ? (
          <>
            <div className="rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
              <span className="font-bold text-foreground">Açıklama: </span>
              {q.explain}
            </div>
            <Button onClick={next} className="w-full">
              {index + 1 >= questions.length ? "Sonuçları gör" : "Sonraki soru"}
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
