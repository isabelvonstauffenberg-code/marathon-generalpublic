import { PageHeader } from "@/components/ui";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Groups",
    body: (
      <p>
        Starting a group creates a short random code, and the group lives at its own link. There are no accounts: anyone with the link can see the group, add runners and post sightings or
        photos. Without the link, a group can&apos;t be found or listed.
      </p>
    ),
  },
  {
    title: "Where the stars come from",
    body: (
      <p>
        Each star is an estimate of where a runner is right now. When you add someone, you give their start time and goal finish time. The page assumes a 5-minute walk from the gun to the start
        mat, then moves them along the course at an even pace. The shaded band runs from 4% faster to 4% slower than goal pace.
      </p>
    ),
  },
  {
    title: "Official times",
    body: (
      <>
        <p>NYRR&apos;s live tracker is run by RTRT.me, and the page reads the same data straight from the browser, with no backend:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>When you enter a bib, it looks it up on RTRT&apos;s API to fill in the runner&apos;s name and get their runner ID.</li>
          <li>On race day it fetches each runner&apos;s splits. Each split gives a timing point (START, 5K, 13M, HALF, FINISH and so on) and the exact time they crossed it, which is converted to a course mile.</li>
          <li>The 2026 course has 37 timing mats: one at every mile, every 5K, the half and the finish.</li>
          <li>The page checks for new splits every 60 seconds while it&apos;s open. In last year&apos;s data, splits showed up about 10 seconds after the runner crossed the mat.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Re-projection",
    body: (
      <p>
        The latest mat crossing or friend sighting becomes an anchor. From there, the star moves forward at the runner&apos;s goal pace, and the band widens from that point at ±4%. Each new mat
        snaps the star back to an official position.
      </p>
    ),
  },
  {
    title: "Stack",
    body: <p>Next.js on Vercel, MapLibre with OpenFreeMap tiles for the map, and Supabase for shared groups, runners, sightings and photos.</p>,
  },
  {
    title: "Caveats",
    body: (
      <p>
        RTRT&apos;s API is undocumented and unofficial, and this site isn&apos;t affiliated with NYRR. If the feed goes down, stars fall back to goal pace and sightings. Anything posted in a group is
        visible to anyone with its link.
      </p>
    ),
  },
];

export default function HowPage() {
  return (
    <main>
      <PageHeader back="/" title="how this works" />
      <p className="display mx-5 -mt-3 mb-6 inline-block rounded-full border-2 border-ink bg-ink px-3.5 py-1 text-[13px] text-sun">Created with Devin</p>
      <div className="mx-5 space-y-4">
        {sections.map((s) => (
          <section key={s.title} className="rounded-[24px] border-[2.5px] border-ink bg-paper p-5">
            <h2 className="display text-[19px] leading-tight">{s.title}</h2>
            <div className="mt-2 text-[13px] leading-[1.65]">{s.body}</div>
          </section>
        ))}
      </div>
    </main>
  );
}
