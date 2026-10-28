import { MARATHON_MILES } from "@/lib/geo";
import type { Spot } from "@/data/spots";

export type Pace = { fast: number; goal: number; slow: number };

export type RunnerProfile = {
  slug: string;
  name: string;
  bib?: string;
  gunTime: string;
  corralDelayMin: number;
  pace: Pace;
  color: string;
};

export type Anchor = { mile: number; seenAt: string };

export type Estimate =
  | { status: "pre"; startsAt: Date }
  | { status: "running" | "finished"; mile: number; lo: number; hi: number; anchor: Anchor | null };

export const startTime = (r: RunnerProfile) => new Date(new Date(r.gunTime).getTime() + r.corralDelayMin * 60_000);

const clampMile = (m: number) => Math.min(Math.max(m, 0), MARATHON_MILES);

// Latest sighting or mat crossing between the gun and now.
export function latestAnchor(now: Date, r: RunnerProfile, sightings: Anchor[]): Anchor | null {
  const gun = new Date(r.gunTime).getTime();
  return (
    sightings
      .filter((s) => {
        const t = new Date(s.seenAt).getTime();
        return t >= gun && t <= now.getTime();
      })
      .sort((a, b) => new Date(b.seenAt).getTime() - new Date(a.seenAt).getTime())[0] ?? null
  );
}

// Dead reckoning from the latest anchor (or the start mat), with a fast/slow band around goal pace.
export function estimate(now: Date, r: RunnerProfile, sightings: Anchor[] = []): Estimate {
  const start = startTime(r);
  const anchor = latestAnchor(now, r, sightings);
  if (!anchor && now < start) return { status: "pre", startsAt: start };
  const baseMile = anchor ? anchor.mile : 0;
  const baseTime = anchor ? new Date(anchor.seenAt).getTime() : start.getTime();
  const elapsed = Math.max(0, (now.getTime() - baseTime) / 1000);
  const mile = clampMile(baseMile + elapsed / r.pace.goal);
  return {
    status: mile >= MARATHON_MILES ? "finished" : "running",
    mile,
    lo: clampMile(baseMile + elapsed / r.pace.slow),
    hi: clampMile(baseMile + elapsed / r.pace.fast),
    anchor,
  };
}

// When to be at a spot: earliest assumes the gun and fast pace, latest assumes the corral delay and slow pace.
export function spotWindow(r: RunnerProfile, spot: Pick<Spot, "mileFrom" | "mileTo">, now = new Date(), sightings: Anchor[] = []) {
  const anchor = latestAnchor(now, r, sightings);
  if (anchor && anchor.mile < spot.mileFrom) {
    const t = new Date(anchor.seenAt).getTime();
    return {
      earliest: new Date(t + (spot.mileFrom - anchor.mile) * r.pace.fast * 1000),
      latest: new Date(t + (spot.mileTo - anchor.mile) * r.pace.slow * 1000),
    };
  }
  const gun = new Date(r.gunTime).getTime();
  return {
    earliest: new Date(gun + spot.mileFrom * r.pace.fast * 1000),
    latest: new Date(startTime(r).getTime() + spot.mileTo * r.pace.slow * 1000),
  };
}

export function projectedFinish(r: RunnerProfile, now?: Date | null, sightings: Anchor[] = []) {
  const anchor = now ? latestAnchor(now, r, sightings) : null;
  if (anchor) return new Date(new Date(anchor.seenAt).getTime() + (MARATHON_MILES - anchor.mile) * r.pace.goal * 1000);
  return new Date(startTime(r).getTime() + MARATHON_MILES * r.pace.goal * 1000);
}

const TZ = "America/New_York";

export const fmtClock = (d: Date) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }).replace(" AM", " a.m.").replace(" PM", " p.m.");

export const fmtShort = (d: Date) => fmtClock(d).replace(/ [ap]\.m\./, "");

export const fmtPace = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

export const fmtDuration = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export function parseDuration(input: string): number | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 3 || digits.length > 5) return null;
  const padded = digits.padStart(5, "0");
  const h = Number(padded.slice(0, 1));
  const m = Number(padded.slice(1, 3));
  const s = Number(padded.slice(3, 5));
  if (m > 59 || s > 59) return null;
  return h * 3600 + m * 60 + s;
}
