export const race = {
  name: "TCS New York City Marathon",
  shortName: "NYC Marathon",
  date: "2026-11-01",
  // Clocks fall back at 2 a.m. race morning, so race-day times are EST.
  utcOffset: "-05:00",
  trackingUrl: "https://liveresults.nyrr.org/e/NYRR-NY2026",
};

export const site = {
  name: "find the runners",
  tagline: "Start a group, add your runners by bib, share one link. Everyone follows the same stars around the NYC Marathon.",
};

// Wave start times from nyrr.org/tcsnycmarathon/the-start (subject to change).
export const waves = [
  { wave: 1, time: "09:10" },
  { wave: 2, time: "09:45" },
  { wave: 3, time: "10:20" },
  { wave: 4, time: "10:55" },
  { wave: 5, time: "11:30" },
];

export const raceTime = (hhmm: string) => `${race.date}T${hhmm}:00${race.utcOffset}`;
