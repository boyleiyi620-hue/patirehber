import { formatDateShort } from "@/lib/utils";
import type { WeightEntry } from "@/lib/types";

/** Kedi kilo geçmişi için SVG çizgi grafiği */
export function WeightChart({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
        <p className="text-sm font-semibold">Grafik için en az 2 ölçüm gerekli</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Düzenli kilo takibi, hastalıkların erken fark edilmesini sağlar.
        </p>
      </div>
    );
  }

  const width = 320;
  const height = 150;
  const padding = { top: 16, right: 12, bottom: 26, left: 32 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const weights = entries.map((entry) => entry.kg);
  const minRaw = Math.min(...weights);
  const maxRaw = Math.max(...weights);
  const span = Math.max(0.4, maxRaw - minRaw);
  const min = Math.max(0, minRaw - span * 0.2);
  const max = maxRaw + span * 0.2;

  const points = entries.map((entry, index) => {
    const x =
      padding.left +
      (entries.length === 1 ? innerWidth / 2 : (index / (entries.length - 1)) * innerWidth);
    const y =
      padding.top + innerHeight - ((entry.kg - min) / (max - min)) * innerHeight;
    return { x, y, entry };
  });

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding.left},${padding.top + innerHeight} ${line} ${points[points.length - 1].x},${padding.top + innerHeight}`;
  const delta = entries[entries.length - 1].kg - entries[0].kg;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {formatDateShort(entries[0].date)} — {formatDateShort(entries[entries.length - 1].date)}
        </span>
        <span
          className={`font-bold ${delta > 0 ? "text-primary-strong" : delta < 0 ? "text-sky-600 dark:text-sky-300" : "text-muted-foreground"}`}
        >
          {delta > 0 ? "+" : ""}
          {delta.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} kg
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Kilo grafiği: ${entries[0].kg} kg ile başlayıp ${entries[entries.length - 1].kg} kg ile bitiyor. ${entries.length} ölçüm.`}
      >
        <defs>
          <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((ratio) => {
          const value = min + (max - min) * (1 - ratio);
          const y = padding.top + innerHeight * ratio;
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="3 4"
              />
              <text
                x={padding.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="8"
                fill="hsl(var(--muted-foreground))"
              >
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}

        <polygon points={area} fill="url(#weight-fill)" />
        <polyline
          points={line}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((point, index) => (
          <g key={point.entry.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r={index === points.length - 1 ? 4.5 : 3.2}
              fill="hsl(var(--card))"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
            {(index === 0 || index === points.length - 1) ? (
              <text
                x={point.x}
                y={height - 8}
                textAnchor={index === 0 ? "start" : "end"}
                fontSize="8"
                fill="hsl(var(--muted-foreground))"
              >
                {formatDateShort(point.entry.date)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Yetişkin kedilerde ayda %1-2&apos;den fazla kilo kaybı veteriner kontrolü
        gerektirir.
      </p>
    </div>
  );
}
