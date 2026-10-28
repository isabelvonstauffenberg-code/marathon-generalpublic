"use client";

import { groupPath, useCode, useGroup } from "@/lib/group";
import { AddRunnerForm } from "@/components/AddRunnerForm";
import { NotFound, validCode } from "@/components/GroupShell";
import { LocalModeNote, PageHeader } from "@/components/ui";
import { Hi } from "@/components/Stickers";

export default function AddPage() {
  const code = useCode();
  const g = useGroup(validCode(code) ? code : undefined);
  if (!validCode(code)) return <NotFound reason="bad" />;
  if (g.missing) return <NotFound reason="missing" />;
  return (
    <main>
      <PageHeader
        back={groupPath(code)}
        eyebrow={g.name || "add"}
        title={
          <>
            add a <Hi tone="lime">runner</Hi>
          </>
        }
        subtitle="bib first. we look it up in the official tracker and only keep the name."
      />
      <LocalModeNote />
      <div className="px-5">{!g.loading && <AddRunnerForm code={code} existing={g.runners} />}</div>
    </main>
  );
}
