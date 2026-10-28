"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";

/** Groups aren't listed anywhere, so the link is the only way back in. */
export function LinkReminder({ code }: { code: string }) {
  const [url, setUrl] = useState(`/g/${code}`);
  const [copied, setCopied] = useState(false);
  useEffect(() => setUrl(`${window.location.origin}/g/${code}`), [code]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this link", url);
    }
  };
  return (
    <div className="mx-5 mb-6 rounded-[26px] border-[2.5px] border-ink bg-lime p-4">
      <p className="display flex items-center gap-2 text-[18px] leading-none lowercase">
        <Link2 size={18} strokeWidth={2.8} /> copy this link to share it
      </p>
      <p className="mt-2 text-[12px] leading-[1.55] lowercase">your group isn&apos;t listed anywhere, so only people with the link can find it. send it to your crew and bookmark it yourself.</p>
      <div className="mt-3 flex gap-2">
        <span className="mono min-w-0 flex-1 truncate rounded-[16px] border-2 border-ink bg-paper px-3 py-2 text-[12px]">{url}</span>
        <button type="button" onClick={copy} className="press display shrink-0 rounded-[16px] border-[2.5px] border-ink bg-ink px-4 text-[15px] text-sun lowercase hover:bg-pink hover:text-ink">
          {copied ? "copied!" : "copy"}
        </button>
      </div>
    </div>
  );
}
