"use client";

import { useCode, useGroup } from "@/lib/group";
import { useNow } from "@/lib/store";
import { SpotTimeline } from "@/components/SpotTimeline";
import { NotFound, validCode } from "@/components/GroupShell";
import { LocalModeNote, PageHeader } from "@/components/ui";
import { Hi } from "@/components/Stickers";

export default function StandPage() {
  const code = useCode();
  const now = useNow();
  const g = useGroup(validCode(code) ? code : undefined);
  if (!validCode(code)) return <NotFound reason="bad" />;
  if (g.missing) return <NotFound reason="missing" />;
  return (
    <main>
      <PageHeader
        eyebrow="where to stand"
        title={
          <>
            pick a <Hi tone="sky">spot</Hi>
          </>
        }
        subtitle="arrival windows for every runner at each cheer spot. earliest is fast pace from the gun; latest is slow pace from the back of the wave. sightings and mat times tighten them up."
      />
      <LocalModeNote />
      {g.loading ? null : g.profiles.length === 0 ? (
        <p className="display mx-5 text-[20px] lowercase">add a runner first and the windows show up here.</p>
      ) : (
        <SpotTimeline runners={g.profiles} now={now} sightings={g.sightings} />
      )}
    </main>
  );
}
