"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CourseMap, type MapRunner } from "@/components/CourseMap";
import { estimate, fmtClock, fmtPace, projectedFinish, spotWindow, type Estimate, type RunnerProfile } from "@/lib/model";
import { firstName, groupPath, sightingsFor, toAnchors } from "@/lib/group";
import type { Sighting } from "@/lib/store";
import { spots, spotById } from "@/data/spots";
import { MARATHON_MILES } from "@/lib/geo";
import { timeAgo } from "@/components/ui";
import { Star } from "@/components/Stickers";
import { isMat, matLabel } from "@/lib/official";

const BOROUGHS = [
  { at: 0, label: "SI" },
  { at: 2, label: "BK" },
  { at: 13.1, label: "QN" },
  { at: 15.6, label: "MN" },
  { at: 19.9, label: "BX" },
  { at: 21.1, label: "" },
];

const short = (d: Date) => fmtClock(d).replace(" a.m.", "am").replace(" p.m.", "pm");

export function statusLine(r: RunnerProfile, est: Estimate, sightings: Sighting[], now: Date) {
  const n = firstName(r.name);
  if (est.status === "pre") return `hasn't started yet. starts around ${fmtClock(est.startsAt).replace(/\.$/, "")}.`;
  if (est.status === "finished") return `finished, probably. go find ${n} near the finish and scream.`;
  if (est.anchor) {
    const s = sightings.find((x) => x.seen_at === est.anchor!.seenAt);
    if (s && isMat(s)) return `crossed the ${matLabel(s).toLowerCase()} mat ${timeAgo(est.anchor.seenAt, now)} (official mat times). now around mile ${est.mile.toFixed(1)}.`;
    const where = s ? spotById(s.spot_id)?.name ?? `mile ${s.mile}` : `mile ${est.anchor.mile}`;
    return `spotted at ${where} ${timeAgo(est.anchor.seenAt, now)}${s ? ` by ${s.name}` : ""}. now around mile ${est.mile.toFixed(1)}.`;
  }
  return `somewhere in the glowy stretch on the map, if the pace holds.`;
}

const mileOf = (est: Estimate | null) => (est && est.status !== "pre" ? est.mile : 0);
const statusWord = (est: Estimate | null) => (est?.status === "running" ? "on the move" : est?.status === "finished" ? "finished!" : "pre-start");

export function toMapRunner(r: RunnerProfile, est: Estimate): MapRunner {
  return est.status === "pre" ? { id: r.slug, name: firstName(r.name), color: r.color, mile: 0 } : { id: r.slug, name: firstName(r.name), color: r.color, mile: est.mile, lo: est.lo, hi: est.hi };
}

export function BoroughTrack({ items }: { items: { color: string; progress: number }[] }) {
  return (
    <div className="relative mt-7 mb-1 px-3">
      <div className="relative h-[18px] rounded-full border-[2.5px] border-ink bg-paper">
        {BOROUGHS.slice(1).map((b, i) => (
          <div key={i} className="absolute top-0 bottom-0 w-[2px] bg-ink/25" style={{ left: `${(b.at / MARATHON_MILES) * 100}%` }} />
        ))}
        {items.map((it, i) => (
          <div key={i} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-1000" style={{ left: `${it.progress * 100}%`, zIndex: 2 + i }}>
            <Star size={26} fill={it.color} strokeWidth={8} className="float" style={{ ["--r" as string]: `${i % 2 ? 8 : -8}deg`, animationDelay: `${i * -1.1}s` }} />
          </div>
        ))}
      </div>
      <div className="relative mt-2 h-4">
        {BOROUGHS.map((b, i) =>
          b.label ? (
            <p key={i} className={`tag absolute !text-[10px] ${i === 0 ? "" : "-translate-x-1/2"}`} style={{ left: `${(b.at / MARATHON_MILES) * 100}%` }}>
              {b.label.toLowerCase()}
            </p>
          ) : null,
        )}
        <p className="display absolute right-0 translate-x-1/3 text-[11px]">26.2</p>
      </div>
    </div>
  );
}

function nextSpots(r: RunnerProfile, est: Estimate | null, now: Date, anchors: { mile: number; seenAt: string }[], count = 2) {
  const at = mileOf(est);
  return spots
    .filter((s) => s.mileTo > at)
    .map((s) => ({ spot: s, win: spotWindow(r, s, now, anchors) }))
    .filter(({ win }) => win.latest > now)
    .slice(0, count);
}

export function RunnerCard({ r, sightings, now, code, linked = true }: { r: RunnerProfile; sightings: Sighting[]; now: Date | null; code: string; linked?: boolean }) {
  const anchors = toAnchors(sightings);
  const est = now ? estimate(now, r, anchors) : null;
  const upcoming = now ? nextSpots(r, est, now, anchors) : [];
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="display truncate text-[24px] leading-none lowercase">{r.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {r.bib && <span className="mono rounded-full border-2 border-ink bg-paper px-2 py-0.5 text-[10px] font-semibold">bib {r.bib}</span>}
            <span className="display rounded-full border-2 border-ink bg-paper px-2 py-0.5 text-[10px] leading-[1.3] lowercase">
              {est?.status === "running" && <span className="blink mr-1 inline-block h-1.5 w-1.5 rounded-full bg-cherry align-middle" />}
              {statusWord(est)}
            </span>
          </div>
        </div>
        <p className="display shrink-0 text-[56px] leading-[0.8] tracking-[-0.04em] tabular">
          {mileOf(est).toFixed(1)}
          <span className="ml-1 text-[15px] tracking-normal">mi</span>
        </p>
      </div>
      <p className="mt-3 text-[12px] leading-[1.5] lowercase">{est && now ? statusLine(r, est, sightings, now) : "\u00a0"}</p>
      <div className="mt-3 border-t-2 border-ink/80 pt-3">
        <p className="tag !text-[9.5px] text-ink/75">next spots</p>
        {upcoming.length === 0 ? (
          <p className="display mt-1 text-[14px] lowercase">{est?.status === "finished" ? "all done. head to the finish." : "no more cheer spots ahead."}</p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {upcoming.map(({ spot, win }) => (
              <li key={spot.id} className="flex items-baseline justify-between gap-2">
                <span className="display min-w-0 truncate text-[14px] lowercase">
                  <span className="mono mr-1.5 text-[10px] font-semibold">mi {spot.mileFrom}</span>
                  {spot.name}
                </span>
                <span className="display shrink-0 text-[13px] tabular">
                  {short(win.earliest)}–{short(win.latest)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex items-baseline justify-between gap-2 text-[11px] lowercase">
          <span>
            <span className="tag !text-[9.5px] text-ink/75">goal pace</span> <b className="display tabular">{fmtPace(r.pace.goal)}/mi</b>
          </span>
          <span>
            <span className="tag !text-[9.5px] text-ink/75">finish ≈</span> <b className="display tabular">{short(projectedFinish(r, now, anchors))}</b>
          </span>
        </div>
      </div>
    </>
  );
  const cls = "peel relative block rounded-[28px] border-[2.5px] border-ink p-4 pb-5";
  return linked ? (
    <Link href={groupPath(code, `/r/${r.slug}`)} className={`press ${cls}`} style={{ background: r.color }}>
      {body}
    </Link>
  ) : (
    <div className={cls} style={{ background: r.color }}>
      {body}
    </div>
  );
}

export function RunnerLive({
  runners,
  sightings,
  now,
  code,
  focusId,
  cards = true,
}: {
  runners: RunnerProfile[];
  sightings: Sighting[];
  now: Date | null;
  code: string;
  focusId?: string;
  cards?: boolean;
}) {
  const rows = useMemo(
    () =>
      runners.map((r) => {
        const mine = sightingsFor(sightings, r.slug);
        return { r, mine, est: now ? estimate(now, r, toAnchors(mine)) : null };
      }),
    [runners, sightings, now],
  );
  const mapRunners = rows.filter(({ est }) => est).map(({ r, est }) => toMapRunner(r, est!));

  return (
    <section className="rise px-5">
      <CourseMap runners={mapRunners} spots={spots} focusId={focusId} />
      <BoroughTrack items={rows.map(({ r, est }) => ({ color: r.color, progress: mileOf(est) / MARATHON_MILES }))} />
      {cards && (
        <div className="mt-6 space-y-4">
          {rows.map(({ r, mine }) => (
            <RunnerCard key={r.slug} r={r} sightings={mine} now={now} code={code} />
          ))}
        </div>
      )}
    </section>
  );
}
