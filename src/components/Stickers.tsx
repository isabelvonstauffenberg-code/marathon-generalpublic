import { useId } from "react";

const INK = "#0b0b0b";

export function starPoints(cx = 50, cy = 53, outer = 44, inner = 24, points = 5) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI / points) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const STAR = starPoints();

/** Plain SVG string for DOM markers (MapLibre). */
export function starSvg(fill: string, size = 34) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="g${fill.slice(1)}" cx="34%" cy="28%" r="62%"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><polygon points="${STAR}" fill="${fill}" stroke="${INK}" stroke-width="9" stroke-linejoin="round" paint-order="stroke"/><polygon points="${STAR}" fill="url(#g${fill.slice(1)})"/><ellipse cx="37" cy="36" rx="8" ry="4.5" fill="#fff" opacity=".9" transform="rotate(-35 37 36)"/></svg>`;
}

/** Glossy puffy star sticker with a bold keyline. */
export function Star({
  size = 40,
  fill = "#fff200",
  stroke = INK,
  strokeWidth = 7,
  gloss = true,
  className = "",
  style,
  title,
}: {
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  gloss?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="-6 -6 112 112" className={className} style={style} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      {gloss && (
        <defs>
          <radialGradient id={`sg${id}`} cx="34%" cy="28%" r="65%">
            <stop offset="0" stopColor="#fff" stopOpacity="0.8" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`ss${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.55" stopColor={INK} stopOpacity="0" />
            <stop offset="1" stopColor={INK} stopOpacity="0.22" />
          </linearGradient>
        </defs>
      )}
      <polygon points={STAR} fill={fill} stroke={stroke} strokeWidth={strokeWidth * 2} strokeLinejoin="round" paintOrder="stroke" />
      {gloss && (
        <>
          <polygon points={STAR} fill={`url(#ss${id})`} />
          <polygon points={STAR} fill={`url(#sg${id})`} />
          <ellipse cx="37" cy="37" rx="9" ry="4.8" fill="#fff" opacity="0.95" transform="rotate(-38 37 37)" />
          <circle cx="52" cy="28" r="2.6" fill="#fff" opacity="0.9" />
        </>
      )}
    </svg>
  );
}

/** Four-point twinkle. */
export function Sparkle({ size = 18, fill = INK, className = "", style }: { size?: number; fill?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} aria-hidden>
      <path d="M12 0c.9 6.4 4.6 10.6 12 12-7.4 1.4-11.1 5.6-12 12-.9-6.4-4.6-10.6-12-12C7.4 10.6 11.1 6.4 12 0z" fill={fill} />
    </svg>
  );
}

/** Circular rotating text badge with a star in the middle. */
export function SpinBadge({ text, size = 96, fill = "#ff3ec8", starFill = "#fff200", className = "" }: { text: string; size?: number; fill?: string; starFill?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }} aria-label={text.replace(/\s*★\s*/g, " ").trim()}>
      <svg viewBox="0 0 100 100" className="spin-slow absolute inset-0" aria-hidden>
        <defs>
          <path id={`c${id}`} d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1-74 0" />
        </defs>
        <circle cx="50" cy="50" r="48" fill={fill} stroke={INK} strokeWidth="2.5" />
        <text fontSize="10.5" fontWeight="900" letterSpacing="1.2" fill={INK} style={{ fontFamily: "var(--font-round)" }}>
          <textPath href={`#c${id}`}>{text}</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Star size={size * 0.46} fill={starFill} strokeWidth={6} />
      </div>
    </div>
  );
}

/** Sticker-style highlighted word inside a headline. */
export function Hi({ children, tone = "pink", tilt = -2 }: { children: React.ReactNode; tone?: "pink" | "sky" | "lime" | "paper" | "ink" | "sun"; tilt?: number }) {
  const bg = { pink: "bg-pink text-ink", sky: "bg-sky text-ink", lime: "bg-lime text-ink", paper: "bg-paper text-ink", ink: "bg-ink text-sun", sun: "bg-sun text-ink" }[tone];
  return (
    <span className={`relative inline-block rounded-[0.32em] border-[2.5px] border-ink px-[0.14em] pb-[0.06em] leading-[1] ${bg}`} style={{ transform: `rotate(${tilt}deg)` }}>
      {children}
    </span>
  );
}
