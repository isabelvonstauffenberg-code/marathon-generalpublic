"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Camera, Plus } from "lucide-react";
import { groupPath, rememberGroup, useCode, useGroup } from "@/lib/group";
import { useNow } from "@/lib/store";
import { RunnerLive } from "@/components/RunnerLive";
import { Feed } from "@/components/Feed";
import { ShareButton } from "@/components/ShareButton";
import { NotFound, OfficialNote, validCode } from "@/components/GroupShell";
import { LocalModeNote, PageHeader, SectionHead } from "@/components/ui";
import { Star } from "@/components/Stickers";
import { LinkReminder } from "@/components/LinkReminder";

export default function GroupPage() {
  const code = useCode();
  const now = useNow();
  const g = useGroup(validCode(code) ? code : undefined);
  useEffect(() => {
    if (g.name && validCode(code)) rememberGroup(code, g.name);
  }, [code, g.name]);
  if (!validCode(code)) return <NotFound reason="bad" />;
  if (g.missing) return <NotFound reason="missing" />;

  return (
    <main>
      <PageHeader eyebrow="live" title={g.name || "\u00a0"} subtitle="every runner's star on the course. tap a card for their spots and photos." action={<ShareButton title={g.name} code={code} className="!px-3 !py-1.5 !text-[13px]" />} />
      <LocalModeNote />
      <LinkReminder code={code} />
      <div className="mx-5 mb-6 grid grid-cols-2 gap-3">
        <Link href={groupPath(code, "/add")} className="press display flex items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-ink py-3.5 text-[17px] text-sun lowercase hover:bg-pink hover:text-ink">
          <Plus size={18} strokeWidth={3} /> add a runner
        </Link>
        <Link href={groupPath(code, "/spotted?photo=1")} className="press display flex items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-pink py-3.5 text-[17px] lowercase hover:bg-lime">
          <Camera size={18} strokeWidth={2.6} /> upload pictures
        </Link>
      </div>

      {g.loading ? null : g.profiles.length === 0 ? (
        <div className="mx-5 flex items-center gap-4 rounded-[28px] border-[2.5px] border-dashed border-ink bg-sun-soft p-5">
          <Star size={54} fill="#ff3ec8" strokeWidth={7} className="float shrink-0" style={{ ["--r" as string]: "-10deg" }} />
          <p className="display text-[20px] leading-[1.1] lowercase">no runners yet. add one by bib, then share the link.</p>
        </div>
      ) : (
        <>
          <RunnerLive runners={g.profiles} sightings={g.sightings} now={now} code={code} />
          <OfficialNote />
        </>
      )}

      <section className="mt-12">
        <SectionHead
          no="i."
          title="the feed"
          aside={
            <Link href={groupPath(code, "/spotted")} className="press display rounded-full border-2 border-ink bg-paper px-3 py-1 text-[12px] lowercase hover:bg-lime">
              post a sighting →
            </Link>
          }
        />
        <Feed posts={g.posts} runners={g.profiles} now={now} limit={6} />
      </section>
    </main>
  );
}
