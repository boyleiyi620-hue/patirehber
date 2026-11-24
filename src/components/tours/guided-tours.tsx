"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/components/providers/app-provider";
import { createClient } from "@/lib/supabase/client";

type TourKind = "update" | "app";
type TourStep = {
  title: string;
  description: string;
  href?: string;
  target?: string;
};
type Box = { left: number; top: number; width: number; height: number };

const UPDATE_FLAG = "patirehber_update_tour_2026_11_24_seen";
const APP_FLAG = "patirehber_full_tour_seen";
const APP_PENDING_FLAG = "patirehber_full_tour_pending";
const UPDATE_LOCAL_PREFIX = "patirehber:tour:update:2026-11-24:";
const APP_LOCAL_PREFIX = "patirehber:tour:app:v1:";

const updateSteps: TourStep[] = [
  {
    title: "Yeni güncelleme",
    description:
      "Takvimde geçmiş günleri düzenleyebilir, arkadaşlarının paylaştığı kedi profillerindeki sağlık bilgileri ve galeriyi görebilir, kedine özel bakım rehberini kullanabilirsin. Bu kısa turda yenilikleri göstereceğim.",
  },
  {
    title: "Geçmiş gün takvimi",
    description:
      "Takvimden geçmiş bir günü seç; o güne ait bakım ve görev kayıtlarını görüntüle, eksikleri seçtiğin tarihe ekle.",
    href: "/calendar",
    target: "calendar-history",
  },
  {
    title: "Arkadaşlarınla paylaş",
    description:
      "Arkadaş koduyla bağlantı kur; arkadaşlarının kedi profillerindeki sağlık bilgilerini ve galeri fotoğraflarını görüntüle.",
    href: "/friends",
    target: "friends-overview",
  },
  {
    title: "Kediye özel bakım rehberi",
    description:
      "Rehberde kedine uygun bakım önerilerini bul. Kontrol listelerindeki tikler kediye ve seçtiğin güne göre saklanır.",
    href: "/guide",
    target: "guide-overview",
  },
];

const appSteps: TourStep[] = [
  {
    title: "PatiRehber'e hoş geldin!",
    description:
      "Uygulamanın temel bölümlerini birlikte gezelim. Ekranın herhangi bir yerine dokunman bir sonraki adıma geçirir; başka kontroller çalışmaz.",
  },
  {
    title: "Ana sayfa",
    description:
      "Günlük bakım özetini, görevlerini ve hızlı işlemlerini burada görürsün.",
    href: "/",
    target: "dashboard-overview",
  },
  {
    title: "Kedilerim",
    description:
      "Kedi profillerini oluşturabilir; kilo, aşı ve diğer bilgilerini yönetebilirsin.",
    href: "/cats",
    target: "cats-overview",
  },
  {
    title: "Bakım rehberi",
    description:
      "Beslenme, sağlık, davranış, ırklar ve hesaplayıcılar burada. Kedine özel kontrol listelerini de kullanabilirsin.",
    href: "/guide",
    target: "guide-overview",
  },
  {
    title: "Takvim",
    description:
      "Bakım geçmişini gün gün incele; geçmiş bir tarihi seçip o günün kayıtlarını da düzenleyebilirsin.",
    href: "/calendar",
    target: "calendar-history",
  },
  {
    title: "Görevler",
    description:
      "Bakım görevleri oluştur, günlük veya tekrarlayan işleri takip et.",
    href: "/tasks",
    target: "tasks-overview",
  },
  {
    title: "Hatırlatıcılar",
    description:
      "Mama, ilaç, aşı ve rutin bakım için hatırlatıcılar planla.",
    href: "/reminders",
    target: "reminders-overview",
  },
  {
    title: "Arkadaşlar",
    description:
      "Arkadaş koduyla bağlantı kur; arkadaşlarının paylaştığı kedi profillerini sağlık bilgileri ve galeriyle birlikte görüntüle.",
    href: "/friends",
    target: "friends-overview",
  },
  {
    title: "Raporlar",
    description:
      "Bakım alışkanlıklarını ve kedinin gelişimini özetleyen raporlara bak.",
    href: "/reports",
    target: "reports-overview",
  },
  {
    title: "Acil durum rehberi",
    description:
      "Zehirlenme şüphesi ve diğer acil durumlarda kontrol listesini aç.",
    href: "/emergency",
    target: "emergency-overview",
  },
  {
    title: "Oyunlar",
    description:
      "Kedi bilgisi ve hafıza oyunlarıyla kısa bir mola ver.",
    href: "/games",
    target: "games-overview",
  },
  {
    title: "Arama",
    description:
      "Kediler, görevler, hatırlatıcılar ve rehber içerikleri arasında ara.",
    href: "/search",
    target: "search-overview",
  },
  {
    title: "Ayarlar",
    description:
      "Profilini, görünümü, bildirimleri ve veri yedeklerini buradan yönetebilirsin.",
    href: "/settings",
    target: "settings-overview",
  },
];

function stepsFor(kind: TourKind): TourStep[] {
  return kind === "update" ? updateSteps : appSteps;
}

function hasLocalMarker(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function GuidedTours() {
  const { user, status } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [tour, setTour] = useState<TourKind | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetBox, setTargetBox] = useState<Box | null>(null);
  const [bubbleBox, setBubbleBox] = useState<Box | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const startedFor = useRef<string | null>(null);
  const shouldRunAppTour = useRef(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const lastAdvance = useRef(0);
  const metadataWrite = useRef<Promise<void>>(Promise.resolve());

  const steps = useMemo(() => (tour ? stepsFor(tour) : []), [tour]);
  const step = steps[stepIndex];

  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    if (!user?.id) {
      startedFor.current = null;
      shouldRunAppTour.current = false;
      setTour(null);
      return;
    }
    if (startedFor.current === user.id) return;
    startedFor.current = user.id;

    const metadata = user.user_metadata ?? {};
    const updateSeen = metadata[UPDATE_FLAG] === true ||
      hasLocalMarker(`${UPDATE_LOCAL_PREFIX}${user.id}`);
    const appSeen = metadata[APP_FLAG] === true ||
      hasLocalMarker(`${APP_LOCAL_PREFIX}${user.id}`);
    shouldRunAppTour.current = metadata[APP_PENDING_FLAG] === true && !appSeen;

    if (!updateSeen) {
      setTour("update");
      setStepIndex(0);
    } else if (shouldRunAppTour.current) {
      setTour("app");
      setStepIndex(0);
    }
  }, [status, user]);

  useEffect(() => {
    if (!tour || !step?.href || pathname === step.href) return;
    router.replace(step.href);
  }, [pathname, router, step, tour]);

  useEffect(() => {
    if (!tour || !step?.target || (step.href && pathname !== step.href)) {
      setTargetBox(null);
      return;
    }

    setTargetBox(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let cancelled = false;

    const locate = () => {
      if (cancelled) return;
      const target = document.querySelector<HTMLElement>(`[data-tour-target="${step.target}"]`) ??
        document.querySelector<HTMLElement>("main");
      if (!target && attempts < 30) {
        attempts += 1;
        timer = setTimeout(locate, 100);
        return;
      }
      if (!target) return;

      target.scrollIntoView({ block: "start", behavior: "smooth" });
      timer = setTimeout(() => {
        if (cancelled) return;
        const rect = target.getBoundingClientRect();
        setTargetBox({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      }, 300);
    };

    timer = setTimeout(locate, 80);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pathname, step, tour]);

  useEffect(() => {
    if (!tour || !bubbleRef.current) {
      setBubbleBox(null);
      return;
    }
    const rect = bubbleRef.current.getBoundingClientRect();
    setBubbleBox({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
  }, [stepIndex, targetBox, tour, viewport]);

  const saveCompletion = (kind: TourKind) => {
    if (!user?.id) return;
    const localKey = kind === "update"
      ? `${UPDATE_LOCAL_PREFIX}${user.id}`
      : `${APP_LOCAL_PREFIX}${user.id}`;
    try {
      window.localStorage.setItem(localKey, "1");
    } catch {
      // Hesap metadata'sı yine de tamamlanma işaretini saklar.
    }
    metadataWrite.current = metadataWrite.current
      .catch(() => undefined)
      .then(async () => {
        const supabase = createClient();
        const { data: { user: latestUser } } = await supabase.auth.getUser();
        const metadata = latestUser?.user_metadata ?? user.user_metadata ?? {};
        const data = kind === "update"
          ? { ...metadata, [UPDATE_FLAG]: true }
          : { ...metadata, [UPDATE_FLAG]: true, [APP_FLAG]: true, [APP_PENDING_FLAG]: false };
        const { error } = await supabase.auth.updateUser({ data });
        if (error) console.warn("Tur durumu hesaba kaydedilemedi:", error.message);
      })
      .catch((error: unknown) => {
        console.warn("Tur durumu hesaba kaydedilemedi:", error);
      });
  };

  const finishTour = () => {
    if (!tour) return;
    saveCompletion(tour);
    if (tour === "update" && shouldRunAppTour.current) {
      shouldRunAppTour.current = false;
      setTour("app");
      setStepIndex(0);
      return;
    }
    setTour(null);
    setTargetBox(null);
    setBubbleBox(null);
    router.replace("/");
  };

  const advance = () => {
    const now = Date.now();
    if (now - lastAdvance.current < 300) return;
    lastAdvance.current = now;
    if (stepIndex < steps.length - 1) {
      setStepIndex((current) => current + 1);
    } else {
      finishTour();
    }
  };

  if (!tour || !step || viewport.width === 0 || viewport.height === 0) return null;

  const padding = 8;
  const focus = targetBox
    ? {
        left: Math.max(0, targetBox.left - padding),
        top: Math.max(0, targetBox.top - padding),
        width: Math.min(viewport.width, targetBox.width + padding * 2),
        height: Math.min(viewport.height, targetBox.height + padding * 2),
      }
    : null;
  const bubbleIsAboveTarget = !!(focus && focus.top + focus.height / 2 > viewport.height * 0.58);
  const bubbleStyle: React.CSSProperties = focus
    ? bubbleIsAboveTarget
      ? { top: "calc(5rem + env(safe-area-inset-top))" }
      : { bottom: "calc(6.5rem + env(safe-area-inset-bottom))" }
    : { top: "50%", transform: "translateY(-50%)" };

  let arrowPath = "";
  if (focus && bubbleBox) {
    const targetX = focus.left + focus.width / 2;
    const targetY = bubbleIsAboveTarget ? focus.top : focus.top + focus.height;
    const bubbleX = bubbleBox.left + bubbleBox.width / 2;
    const bubbleY = bubbleIsAboveTarget ? bubbleBox.top + bubbleBox.height : bubbleBox.top;
    const curveY = (bubbleY + targetY) / 2;
    arrowPath = `M ${bubbleX} ${bubbleY} Q ${bubbleX} ${curveY} ${targetX} ${targetY}`;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Bir sonraki tanıtım adımına geç"
      onClick={advance}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          advance();
        }
      }}
      onTouchMove={(event) => event.preventDefault()}
      className="fixed inset-0 z-[100] cursor-pointer select-none touch-none outline-none"
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 h-full w-full"
        width={viewport.width}
        height={viewport.height}
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      >
        <defs>
          <mask id="pati-tour-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
            <rect width={viewport.width} height={viewport.height} fill="white" />
            {focus ? (
              <rect
                x={focus.left}
                y={focus.top}
                width={focus.width}
                height={focus.height}
                rx="16"
                fill="black"
              />
            ) : null}
          </mask>
          <marker id="pati-tour-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M 0 0 L 9 4.5 L 0 9 z" fill="#f97316" />
          </marker>
        </defs>
        <rect
          width={viewport.width}
          height={viewport.height}
          fill="rgba(20, 15, 11, 0.76)"
          mask="url(#pati-tour-mask)"
        />
        {focus ? (
          <rect
            x={focus.left}
            y={focus.top}
            width={focus.width}
            height={focus.height}
            rx="16"
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
          />
        ) : null}
        {arrowPath ? (
          <path d={arrowPath} fill="none" stroke="#f97316" strokeWidth="3" markerEnd="url(#pati-tour-arrow)" />
        ) : null}
      </svg>

      <div
        ref={bubbleRef}
        style={bubbleStyle}
        className="fixed inset-x-4 z-[101] mx-auto max-h-[70dvh] max-w-sm overflow-auto rounded-3xl border border-primary/30 bg-card p-5 text-card-foreground shadow-2xl ring-1 ring-black/5"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary-strong">
            {tour === "update" ? "Yeni güncelleme" : "Uygulama turu"}
          </span>
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary-strong">
            {stepIndex + 1} / {steps.length}
          </span>
        </div>
        <h2 className="font-display text-lg font-extrabold leading-tight">{step.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
        <p className="mt-4 border-t border-border pt-3 text-center text-[11px] font-bold text-primary-strong">
          Ekranın herhangi bir yerine dokunarak devam et
        </p>
      </div>
    </div>
  );
}
