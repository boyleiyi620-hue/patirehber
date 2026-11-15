import { cn } from "@/lib/utils";

/** Günlük bakım puanı için SVG halka göstergesi */
export function ScoreRing({
  value,
  size = 72,
  stroke = 7,
  className,
  label = "Bakım puanı",
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  label?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safeValue / 100);
  const color =
    safeValue >= 80
      ? "hsl(var(--accent))"
      : safeValue >= 45
        ? "hsl(var(--primary))"
        : "hsl(var(--muted-foreground))";

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: 100 üzerinden ${safeValue}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-display text-lg font-extrabold leading-none">
        {safeValue}
      </span>
    </div>
  );
}
