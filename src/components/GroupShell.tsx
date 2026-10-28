"use client";

import Link from "next/link";
import { isCode } from "@/lib/store";
import { Star } from "@/components/Stickers";

export function NotFound({ reason }: { reason: "bad" | "missing" }) {
  return (
    <main className="px-5 pt-16">
      <Star size={90} fill="#ff3ec8" strokeWidth={6} className="float" />
      <h1 className="display mt-6 text-[44px] leading-[0.95] lowercase">{reason === "bad" ? "that link looks off." : "no group at this link."}</h1>
      <p className="mt-4 max-w-[34ch] text-[13.5px] leading-[1.6] lowercase">check you copied the whole thing, or start a new group.</p>
      <Link href="/" className="press display mt-6 inline-flex rounded-full border-[2.5px] border-ink bg-ink px-5 py-3 text-[17px] text-sun lowercase">
        start a group
      </Link>
    </main>
  );
}

export const validCode = (code: string | undefined): code is string => Boolean(code && isCode(code));

export function OfficialNote() {
  return (
    <p className="mx-5 mt-5 flex items-start gap-2 text-[11.5px] leading-[1.55] text-ink/75 lowercase">
      <span className="display shrink-0 rounded-full border-2 border-ink bg-lime px-2 text-[10.5px] leading-[1.4] text-ink">official mat times</span>
      <span>runners with a bib snap to real timing-mat crossings from the nyrr tracker on race day. best-effort: if it&apos;s down, stars fall back to pace and sightings.</span>
    </p>
  );
}
