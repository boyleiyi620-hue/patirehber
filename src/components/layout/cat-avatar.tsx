import { cn } from "@/lib/utils";

const gradients = [
  "from-orange-200 to-amber-100 text-orange-700",
  "from-emerald-200 to-lime-100 text-emerald-700",
  "from-sky-200 to-cyan-100 text-sky-700",
  "from-violet-200 to-fuchsia-100 text-violet-700",
  "from-rose-200 to-pink-100 text-rose-700",
  "from-teal-200 to-emerald-100 text-teal-700",
];

const sizes = {
  sm: "h-10 w-10 text-lg",
  md: "h-14 w-14 text-2xl",
  lg: "h-20 w-20 text-3xl",
  xl: "h-28 w-28 text-5xl",
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 1_000_000;
  }
  return hash;
}

/**
 * Kedi avatarı: fotoğraf varsa gösterir, yoksa isme göre renkli,
 * sevimli bir yer tutucu üretir.
 */
export function CatAvatar({
  name,
  photo,
  size = "md",
  className,
  ring = false,
}: {
  name: string;
  photo?: string;
  size?: keyof typeof sizes;
  className?: string;
  ring?: boolean;
}) {
  const gradient = gradients[hashString(name) % gradients.length];
  const initial = name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "🐾";

  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- LocalStorage data URL
      <img
        src={photo}
        alt={`${name} fotoğrafı`}
        className={cn(
          "shrink-0 rounded-2xl object-cover",
          sizes[size],
          ring && "ring-2 ring-primary/30 ring-offset-2 ring-offset-card",
          className,
        )}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br font-display font-extrabold",
        gradient,
        sizes[size],
        ring && "ring-2 ring-primary/30 ring-offset-2 ring-offset-card",
        className,
      )}
    >
      <span className="absolute -bottom-1 -end-1 text-[1.6em] opacity-25">🐾</span>
      <span className="relative">{initial}</span>
    </div>
  );
}
