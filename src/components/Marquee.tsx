const bits = ["sun nov 1", "five boroughs · 26.2 miles · go support!!", "one link, every runner", "bring snacks", "find the runners", "nyc marathon 2026", "wave your sign"];

export function Marquee() {
  const row = bits.map((b) => (
    <span key={b} className="flex items-center gap-4">
      <span>{b}</span>
      <span className="text-pink">★</span>
    </span>
  ));
  return (
    <div className="no-print overflow-hidden bg-ink py-2 text-sun" aria-hidden>
      <div className="marquee display flex w-max gap-4 text-[13px] tracking-[-0.01em] whitespace-nowrap">
        <div className="flex gap-4 pl-4">{row}</div>
        <div className="flex gap-4 pl-4">{row}</div>
      </div>
    </div>
  );
}
