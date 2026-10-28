"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { groupPath, useCode, useGroup } from "@/lib/group";
import { useNow } from "@/lib/store";
import { SpotForm } from "@/components/SpotForm";
import { Feed } from "@/components/Feed";
import { NotFound, validCode } from "@/components/GroupShell";
import { LocalModeNote, PageHeader, SectionHead } from "@/components/ui";
import { Hi } from "@/components/Stickers";

export default function SpottedPage() {
  const code = useCode();
  const now = useNow();
  const g = useGroup(validCode(code) ? code : undefined);
  const [photoFirst, setPhotoFirst] = useState(false);
  const [defaultRunner, setDefaultRunner] = useState<string | undefined>();
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setPhotoFirst(q.get("photo") === "1");
    setDefaultRunner(q.get("runner") ?? undefined);
  }, []);
  const tags = useMemo(() => g.profiles.map((r) => ({ slug: r.slug, name: r.name })), [g.profiles]);
  if (!validCode(code)) return <NotFound reason="bad" />;
  if (g.missing) return <NotFound reason="missing" />;

  return (
    <main>
      <PageHeader
        eyebrow="sightings"
        title={
          <>
            spotted <Hi tone="pink">someone</Hi>?
          </>
        }
        subtitle="post it. a sighting moves that runner's star on the map, so people further up the course know who's coming."
      />
      <LocalModeNote />
      <div className="px-5">
        {g.loading ? null : tags.length === 0 ? (
          <p className="display text-[20px] lowercase">
            no runners to tag yet.{" "}
            <Link href={groupPath(code, "/add")} className="underline decoration-pink decoration-4 underline-offset-4">
              add one
            </Link>
            .
          </p>
        ) : (
          <SpotForm code={code} runners={tags} photoFirst={photoFirst} defaultRunner={defaultRunner} />
        )}
      </div>
      <section className="mt-12">
        <SectionHead no="ii." title="the feed" aside={<span className="display rounded-full border-2 border-ink bg-paper px-2.5 py-0.5 text-[12px] tabular">{g.posts.length} posted</span>} />
        {!g.loading && <Feed posts={g.posts} runners={g.profiles} now={now} />}
        <p className="mx-5 mt-8 text-center text-[11.5px] text-ink/70 lowercase">keep it to your runners; strangers in the background didn&apos;t sign up for this.</p>
      </section>
    </main>
  );
}
