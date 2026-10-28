"use client";

import { useEffect, useState } from "react";
import { Printer, Shuffle } from "lucide-react";
import { firstName, groupPath, useCode, useGroup } from "@/lib/group";
import { Chip, PageHeader } from "@/components/ui";
import { Hi, Star } from "@/components/Stickers";

const signsFor = (N: string): [string, string][] => [
  [`RUN ${N}`, "THE BAGELS ARE GETTING COLD"],
  [`GO ${N}`, "YOU'RE RUNNING BETTER THAN THE G TRAIN"],
  [`${N}!!!`, "TOUCH HERE FOR POWER"],
  [`${N}`, "YOU PAID TO DO THIS"],
  [`HEY ${N}`, "SMILE, YOU'RE ON CANDID CAMERA"],
  [`${N} 4EVER`, "26.2 MILES OF MAIN CHARACTER ENERGY"],
  [`GO ${N} GO`, "THE WALL IS A SOCIAL CONSTRUCT"],
  [`${N}`, "WORST PARADE EVER"],
  [`RUN ${N} RUN`, "I'D HAVE STAYED IN BED"],
  [`${N}`, "YOU'VE GOT STAMINA, CALL ME"],
  [`GO ${N}`, "BLINK IF YOU WANT ME TO CALL AN UBER"],
  [`${N}!`, "YOUR LEGS WILL FORGIVE YOU. EVENTUALLY."],
  [`${N}`, "HURRY UP, I'M HUNGRY"],
  [`SPEED UP ${N}`, "I'M COLD"],
  [`${N}`, "PAIN IS JUST THE FRENCH WORD FOR BREAD"],
  [`GO ${N}`, "YOU'RE NOT EVEN SWEATING. MUCH."],
  [`${N}`, "SOMEWHERE A COUCH IS PROUD OF YOU"],
  [`RUN ${N}`, "THERE'S A BRUNCH RESERVATION AT STAKE"],
  [`${N}`, "NEVER TRUST A FART AT MILE 20"],
  [`GO ${N}`, "YOU'RE DOING AMAZING SWEETIE"],
  [`${N}`, "THIS IS A LOT OF WORK FOR A FREE BANANA"],
  [`${N}`, "BEAT THE GUY IN THE BANANA SUIT"],
  [`RUN ${N} RUN`, "YOU'RE ALMOST THERE (WE LIED)"],
  [`${N}`, "26.2 BECAUSE 26.3 WOULD BE CRAZY"],
  [`${N}`, "RUN LIKE YOU STOLE SOMETHING"],
  [`GO ${N}`, "THE FINISH LINE HAS WI-FI"],
  [`${N}`, "IF IT WERE EASY IT'D BE CALLED YOUR MOM"],
  [`HI ${N}`, "I'M YOUR BIGGEST FAN AND ALSO COLD"],
  [`${N}`, "DON'T STOP, PEOPLE ARE WATCHING"],
  [`${N}`, "FIVE BOROUGHS, ONE FINISH LINE"],
];
const palettes = [
  { bg: "#fff200", fg: "#0b0b0b", sub: "#ff3ec8", star: "#ff3ec8" },
  { bg: "#ff3ec8", fg: "#0b0b0b", sub: "#ffffff", star: "#fff200" },
  { bg: "#0b0b0b", fg: "#fff200", sub: "#ffa6ec", star: "#ff3ec8" },
  { bg: "#22b5ff", fg: "#0b0b0b", sub: "#fff200", star: "#fff200" },
  { bg: "#3ee04f", fg: "#0b0b0b", sub: "#ffffff", star: "#ff3ec8" },
  { bg: "#ffffff", fg: "#0b0b0b", sub: "#ff3ec8", star: "#fff200" },
];

const SIGN_COUNT = signsFor("").length;

export default function SignPage() {
  const code = useCode();
  const g = useGroup(code);
  const names = [...new Set(g.profiles.map((r) => firstName(r.name)))];
  const [picked, setPicked] = useState<string | null>(null);
  const who = picked ?? names[0] ?? "runner";
  const signs = signsFor(who.toUpperCase());
  const [i, setI] = useState(0);
  const [p, setP] = useState(0);
  useEffect(() => {
    setI(Math.floor(Math.random() * SIGN_COUNT));
    setP(Math.floor(Math.random() * palettes.length));
  }, []);
  const [title, line] = signs[i];
  const pal = palettes[p];
  const shuffle = () => {
    setI((x) => (x + 1 + Math.floor(Math.random() * (SIGN_COUNT - 1))) % SIGN_COUNT);
    setP((x) => (x + 1) % palettes.length);
  };

  return (
    <main>
      <div className="no-print">
        <PageHeader
          back={code ? groupPath(code) : "/"}
          eyebrow="make a sign"
          title={
            <>
              hold it <Hi tone="lime">high</Hi>
            </>
          }
          subtitle={`shuffle until one makes you snort. print it. cheer their names.`}
        />
      </div>
      <div className="no-print mx-5 mb-5 flex flex-wrap gap-2">
        {names.map((n) => (
          <Chip key={n} on={who === n} onClick={() => setPicked(n)}>
            for {n}
          </Chip>
        ))}
      </div>
      <div className="px-5">
        <div
          key={`${i}-${p}-${who}`}
          className="pop relative flex aspect-[11/8.5] flex-col items-center justify-center overflow-hidden rounded-[30px] border-[3px] border-ink p-7 text-center print:aspect-auto print:h-[95vh] print:rounded-none print:border-0"
          style={{ background: pal.bg }}
        >
          <Star size={64} fill={pal.star} strokeWidth={6} className="absolute -top-3 -left-3 -rotate-12 print:!h-[200px] print:!w-[200px]" />
          <Star size={40} fill={pal.star} strokeWidth={7} className="absolute right-3 bottom-3 rotate-12 print:!h-[120px] print:!w-[120px]" />
          <p className="display text-[12.5vw] leading-[0.86] tracking-[-0.04em] uppercase sm:text-[64px] print:text-[150px]" style={{ color: pal.fg }}>
            {title}
          </p>
          <p className="display mt-4 text-[3.6vw] leading-tight tracking-[0.02em] sm:text-[18px] print:text-[46px]" style={{ color: pal.sub }}>
            {line}
          </p>
        </div>
      </div>
      <div className="no-print mt-5 grid grid-cols-2 gap-3 px-5">
        <button onClick={shuffle} className="press display flex items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-ink py-3.5 text-[18px] text-sun lowercase hover:bg-pink hover:text-ink">
          <Shuffle size={18} strokeWidth={2.6} /> shuffle
        </button>
        <button onClick={() => window.print()} className="press display flex items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-paper py-3.5 text-[18px] lowercase hover:bg-lime">
          <Printer size={18} strokeWidth={2.6} /> print
        </button>
      </div>
      <p className="no-print mx-5 mt-4 text-center text-[11.5px] text-ink/70 lowercase tabular">
        sign {i + 1} of {signs.length}. runners reserve the right to laugh, cry, or both.
      </p>
    </main>
  );
}
