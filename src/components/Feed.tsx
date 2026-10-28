"use client";

import { spotById } from "@/data/spots";
import { fmtClock, type RunnerProfile } from "@/lib/model";
import type { Sighting } from "@/lib/store";
import { timeAgo } from "@/components/ui";
import { Star } from "@/components/Stickers";

export function Feed({ posts, runners, now, limit }: { posts: Sighting[]; runners: RunnerProfile[]; now: Date | null; limit?: number }) {
  const bySlug = new Map(runners.map((r) => [r.slug, r]));
  // One card per post: a photo tagged with several runners is stored once per runner.
  const seen = new Set<string>();
  const cards = posts
    .filter((s) => {
      const key = `${s.seen_at}|${s.name}|${s.spot_id}|${s.photo_url ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((s) => ({
      s,
      who: posts.filter((x) => x.seen_at === s.seen_at && x.name === s.name && x.spot_id === s.spot_id && x.photo_url === s.photo_url).map((x) => bySlug.get(x.runner_slug)),
    }))
    .slice(0, limit);

  if (cards.length === 0)
    return (
      <div className="mx-5 flex items-center gap-4 rounded-[28px] border-[2.5px] border-dashed border-ink bg-sun-soft p-5">
        <Star size={54} fill="#ffffff" strokeWidth={7} className="float shrink-0" style={{ ["--r" as string]: "-10deg" }} />
        <p className="display text-[20px] leading-[1.1] lowercase">no sightings yet. they&apos;re out there somewhere.</p>
      </div>
    );

  return (
    <ul className="rise mx-6 grid grid-cols-2 gap-x-5 gap-y-7">
      {cards.map(({ s, who }, i) => {
        const spot = spotById(s.spot_id);
        const names = who.map((r) => r?.name ?? "a runner").join(" & ");
        const color = who[0]?.color ?? "#ff3ec8";
        return (
          <li key={s.id} className={`sticker relative rounded-[22px] bg-paper p-2 pb-3 transition-transform duration-500 hover:rotate-0 ${i % 2 ? "rotate-[2deg]" : "-rotate-[2deg]"}`}>
            <Star size={30} fill={color} strokeWidth={8} className="absolute -top-3 -right-3 z-10 rotate-12" />
            {s.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.photo_url} alt={`${names} spotted by ${s.name}`} className="aspect-square w-full rounded-[14px] border-2 border-ink object-cover" />
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center rounded-[14px] border-2 border-ink" style={{ background: color }}>
                <span className="tag !text-[10px]">mile</span>
                <span className="display text-[52px] leading-none">{spot ? spot.mileFrom : s.mile}</span>
              </div>
            )}
            <p className="display mt-2 line-clamp-2 px-1 text-[15px] leading-tight lowercase">
              {names} · {spot ? spot.name : `mile ${s.mile}`}
            </p>
            <p className="mt-0.5 truncate px-1 text-[10.5px] text-ink/70 lowercase">
              {fmtClock(new Date(s.seen_at))}, by {s.name}
            </p>
            {now && <p className="tag mt-1 px-1 !text-[9.5px] text-pink">{timeAgo(s.seen_at, now)}</p>}
          </li>
        );
      })}
    </ul>
  );
}
