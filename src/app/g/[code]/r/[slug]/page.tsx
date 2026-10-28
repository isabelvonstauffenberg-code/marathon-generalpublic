"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Camera } from "lucide-react";
import { firstName, groupPath, sightingsFor, useCode, useGroup } from "@/lib/group";
import { fmtClock } from "@/lib/model";
import { isMat, matLabel } from "@/lib/official";
import { useNow } from "@/lib/store";
import { RunnerCard, RunnerLive } from "@/components/RunnerLive";
import { SpotTimeline } from "@/components/SpotTimeline";
import { Feed } from "@/components/Feed";
import { NotFound, OfficialNote, validCode } from "@/components/GroupShell";
import { LocalModeNote, PageHeader, SectionHead } from "@/components/ui";

export default function RunnerPage() {
  const code = useCode();
  const { slug } = useParams<{ slug: string }>();
  const now = useNow();
  const g = useGroup(validCode(code) ? code : undefined);
  if (!validCode(code)) return <NotFound reason="bad" />;
  if (g.missing) return <NotFound reason="missing" />;
  if (g.loading) return null;
  const r = g.profiles.find((p) => p.slug === slug);
  if (!r)
    return (
      <main>
        <PageHeader back={groupPath(code)} title="no runner here." subtitle="they may have been added on another device in preview mode." />
      </main>
    );
  const mine = sightingsFor(g.sightings, r.slug);
  const mats = mine.filter(isMat).sort((a, b) => a.seen_at.localeCompare(b.seen_at));
  const posts = g.posts.filter((s) => s.runner_slug === r.slug);

  return (
    <main>
      <PageHeader back={groupPath(code)} eyebrow={g.name} title={r.name.toLowerCase()} subtitle={r.bib ? `bib ${r.bib}` : "no bib, so pace and sightings only."} />
      <LocalModeNote />
      <div className="px-5">
        <RunnerCard r={r} sightings={mine} now={now} code={code} linked={false} />
      </div>
      <div className="mt-6">
        <RunnerLive runners={[r]} sightings={g.sightings} now={now} code={code} focusId={r.slug} cards={false} />
      </div>
      {r.bib && <OfficialNote />}
      {mats.length > 0 && (
        <section className="mt-10">
          <SectionHead no="i." title="official mat times" />
          <ul className="mx-5 divide-y-2 divide-ink/15 rounded-[24px] border-[2.5px] border-ink bg-paper px-4">
            {mats.map((m) => (
              <li key={m.id} className="flex items-baseline justify-between py-2.5">
                <span className="display text-[15px] lowercase">{matLabel(m)}</span>
                <span className="display text-[14px] tabular">{fmtClock(new Date(m.seen_at))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="mt-10">
        <SectionHead no="ii." title="where to stand" />
        <SpotTimeline runners={[r]} now={now} sightings={g.sightings} />
      </section>
      <section className="mt-10">
        <SectionHead
          no="iii."
          title="photos"
          aside={
            <Link href={groupPath(code, `/spotted?runner=${r.slug}`)} className="press display inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-pink px-3 py-1 text-[12px] lowercase">
              <Camera size={14} strokeWidth={2.6} /> spotted {firstName(r.name).toLowerCase()}
            </Link>
          }
        />
        <Feed posts={posts} runners={g.profiles} now={now} />
      </section>
    </main>
  );
}
