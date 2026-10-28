"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export function ShareButton({ title, code, className = "" }: { title: string; code: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}/g/${code}`;
    const data = { title: `${title} · find the runners`, text: `Follow our runners at the NYC Marathon: ${title}`, url };
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  return (
    <button
      type="button"
      onClick={share}
      className={`press display inline-flex items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-sky px-4 py-2 text-[15px] lowercase hover:bg-lime ${className}`}
    >
      <Share2 size={16} strokeWidth={2.6} /> {copied ? "link copied!" : "share link"}
    </button>
  );
}
