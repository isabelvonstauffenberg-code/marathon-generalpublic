"use client";

import { spots, type Spot } from "@/data/spots";
import { fmtClock, spotWindow, type RunnerProfile } from "@/lib/model";
import { firstName, sightingsFor, toAnchors } from "@/lib/group";
import type { Sighting } from "@/lib/store";
import { Pill, Train } from "@/components/ui";

const clock = (d: Date) => {
  const [t, ampm] = fmtClock(d).split(" ");
  return [t, ampm.replace(/\./g, "")] as const;
};

export function SpotTimeline({
  runners,
  now,
  sightings = [],
  limit,
  action,
}: {
  runners: RunnerProfile[];
  now: Date | null;
  sightings?: Sighting[];
  limit?: number;
  action?: (spot: Spot) => React.ReactNode;
}) {
  const at = now ?? new Date();
  const solo = runners.length === 1;
  const rows = spots
    .map((s) => ({ spot: s, wins: runners.map((r) => ({ r, win: spotWindow(r, s, at, toAnchors(sightingsFor(sightings, r.slug))) })) }))
    .filter(({ wins }) => !limit || !now || wins.some(({ win }) => win.latest > now))
    .slice(0, limit);

  if (rows.length === 0) return <p className="display mx-5 text-[20px] lowercase">no more spots ahead. head for the finish!</p>;

  return (
    <ol className="rise mx-5 space-y-3">
      {rows.map(({ spot, wins }) => {
        const live = now && wins.some(({ win }) => now >= win.earliest && now <= win.latest);
        const past = now && wins.every(({ win }) => now > win.latest);
        const range = spot.mileFrom !== spot.mileTo;
        const long = range && String(spot.mileFrom).length + String(spot.mileTo).length > 3;
        return (
          <li
            key={spot.id}
            className={`relative rounded-[26px] border-[2.5px] border-ink p-3.5 transition ${live ? "bg-paper shadow-[0_0_0_4px_var(--pink)]" : "bg-paper"} ${past ? "opacity-45 saturate-50" : ""}`}
          >
            <div className="grid grid-cols-[62px_1fr_auto] gap-x-3">
              <div className={`flex h-[62px] w-[62px] flex-col items-center justify-center rounded-[20px] border-[2.5px] border-ink ${live ? "bg-pink" : "bg-sun"}`}>
                <p className="tag !text-[9px] leading-none">mile</p>
                <p className={`display mt-0.5 leading-[0.95] whitespace-nowrap tabular ${long ? "text-[17px]" : range ? "text-[22px]" : "text-[28px]"}`}>
                  {range ? `${spot.mileFrom}–${spot.mileTo}` : spot.mileFrom}
                </p>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="display text-[18px] leading-[1.05] lowercase">{spot.name}</h3>
                  {live && <Pill tone="accent">here now!</Pill>}
                </div>
                <p className="mt-1 text-[11.5px] leading-snug text-ink/70 lowercase">
                  {spot.area}, {spot.vibe.toLowerCase()}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {spot.trains.map((t) => (
                    <Train key={t} line={t} size={19} />
                  ))}
                </div>
              </div>
              <div className="space-y-2 text-right">
                {wins.map(({ r, win }) => (
                  <div key={r.slug}>
                    {!solo && (
                      <p className="display flex items-center justify-end gap-1 text-[11px] leading-none lowercase">
                        <span className="inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-ink" style={{ background: r.color }} />
                        {firstName(r.name)}
                      </p>
                    )}
                    <p className={`display mt-0.5 leading-none whitespace-nowrap tabular ${solo ? "text-[24px]" : "text-[20px]"}`}>
                      {clock(win.earliest)[0]}
                      <span className="ml-0.5 text-[11px]">{clock(win.earliest)[1]}</span>
                    </p>
                    <p className="tag mt-0.5 !text-[9.5px] text-ink/65 tabular">til {clock(win.latest).join(" ")}</p>
                  </div>
                ))}
              </div>
            </div>
            {action && <div className="mt-3 flex items-center justify-end gap-2 border-t-2 border-dashed border-ink/30 pt-2.5 pl-[74px]">{action(spot)}</div>}
          </li>
        );
      })}
    </ol>
  );
}
