"use client";

import Link from "next/link";
import { trainColor } from "@/data/spots";
import { isShared } from "@/lib/store";
import { Star } from "@/components/Stickers";

export function Wordmark() {
  return (
    <Link href="/" className="wiggle display inline-flex items-center gap-1 text-[17px] leading-none lowercase">
      find the runners
      <Star size={18} fill="#ff3ec8" strokeWidth={8} />
    </Link>
  );
}

export function PageHeader({ eyebrow, title, subtitle, back, no, action }: { eyebrow?: string; title: React.ReactNode; subtitle?: React.ReactNode; back?: string; no?: string; action?: React.ReactNode }) {
  return (
    <header className="rise px-5 pt-5 pb-7">
      <div className="flex items-center justify-between gap-3">
        {back ? (
          <Link href={back} className="press tag inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-3 py-1.5 !text-[11px]">
            <span aria-hidden>←</span> back
          </Link>
        ) : (
          <Wordmark />
        )}
        <span className="flex items-center gap-2.5">
        {action}
        {eyebrow && (
          <span className="stamp display inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-pink px-3 py-1 text-[12.5px] lowercase" style={{ ["--r" as string]: "4deg" }}>
            {no && <span className="mono text-[10px] font-semibold">{no}</span>}
            {eyebrow}
          </span>
        )}
        </span>
      </div>
      <h1 className="display mt-7 text-[52px] leading-[0.94] lowercase">{title}</h1>
      {subtitle && <p className="mt-5 max-w-[34ch] text-[13.5px] leading-[1.6] text-ink/80 lowercase">{subtitle}</p>}
    </header>
  );
}

const SECTION_STARS = ["#ff3ec8", "#22b5ff", "#3ee04f", "#ffffff"];

export function SectionHead({ no, title, aside }: { no: string; title: React.ReactNode; aside?: React.ReactNode }) {
  const tint = SECTION_STARS[(no.length + no.charCodeAt(0)) % SECTION_STARS.length];
  return (
    <div className="mx-5 mb-4 flex items-end justify-between gap-3">
      <h2 className="flex items-center gap-2">
        <Star size={30} fill={tint} strokeWidth={7} className="wiggle shrink-0 -rotate-12" />
        <span className="display text-[32px] leading-none lowercase">{title}</span>
      </h2>
      {aside}
    </div>
  );
}

export function Train({ line, size = 20 }: { line: string; size?: number }) {
  const bg = trainColor[line] ?? "#888";
  const dark = ["N", "Q", "R", "W"].includes(line);
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border-[1.5px] border-ink font-[family-name:var(--font-round)] font-black"
      style={{ width: size, height: size, fontSize: size * 0.52, background: bg, color: dark ? "#111" : "#fff" }}
      aria-label={`${line} train`}
    >
      {line}
    </span>
  );
}

export function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "accent" | "green" | "muted" }) {
  const tones = {
    default: "bg-ink text-sun",
    accent: "bg-pink text-ink",
    green: "bg-lime text-ink",
    muted: "bg-paper text-ink",
  };
  return <span className={`display inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-0.5 text-[11.5px] leading-[1.25] lowercase ${tones[tone]}`}>{children}</span>;
}

export function LocalModeNote() {
  if (isShared()) return null;
  return (
    <p className="mx-5 mb-6 flex items-start gap-2.5 rounded-[18px] border-2 border-dashed border-ink bg-sun-soft px-4 py-3 text-[11.5px] leading-[1.55] lowercase">
      <Star size={18} fill="#fff" strokeWidth={8} gloss={false} className="mt-0.5 shrink-0" />
      <span>
        <b className="display text-[13px]">preview mode.</b> anything you add stays on this device until shared storage is connected, so the link won&apos;t show your runners to anyone else yet.
      </span>
    </p>
  );
}

export const inputClass =
  "w-full rounded-[18px] border-[2.5px] border-ink bg-paper px-4 py-3.5 text-[14px] outline-none transition-shadow placeholder:text-ink/35 focus:shadow-[0_0_0_4px_var(--pink)] [&:is(select)]:pr-10";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="display mb-2 block text-[16px] lowercase">{label}</span>
      {children}
      {hint && <span className="mt-2 block text-[11.5px] leading-snug text-ink/65 lowercase">{hint}</span>}
    </label>
  );
}

export function PrimaryButton({ children, disabled, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`press group display flex w-full items-center justify-between gap-3 rounded-full border-[2.5px] border-ink bg-ink py-2 pr-2 pl-6 text-[19px] text-sun lowercase hover:bg-pink hover:text-ink disabled:pointer-events-none disabled:border-dashed disabled:bg-paper/40 disabled:text-ink/45 [&:disabled>span:last-child]:opacity-40 [&:disabled>span:last-child]:grayscale ${className}`}
    >
      <span className="flex min-w-0 items-center gap-2 truncate">{children}</span>
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sun transition-transform duration-500 group-hover:rotate-[144deg]">
        <Star size={30} fill="#ff3ec8" strokeWidth={7} />
      </span>
    </button>
  );
}

export function Chip({ on, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { on: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className={`press display rounded-full border-[2.5px] border-ink px-4 py-2 text-[14px] lowercase ${on ? "bg-ink text-sun" : "bg-paper text-ink hover:bg-bubble"}`}
    >
      {children}
    </button>
  );
}

// Honeypot: bots fill every field, people never see this one.
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      tabIndex={-1}
      autoComplete="off"
      aria-hidden
      className="absolute -left-[9999px] h-0 w-0 opacity-0"
      name="website"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function timeAgo(iso: string, now: Date) {
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m ago`;
}
