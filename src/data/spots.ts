export type Spot = {
  id: string;
  name: string;
  area: string;
  borough: "Brooklyn" | "Queens" | "Manhattan" | "Bronx";
  mileFrom: number;
  mileTo: number;
  trains: string[];
  vibe: string;
};

// Cheer spots along the 2026 course. Mile ranges are where the spot sits on the course.
export const spots: Spot[] = [
  { id: "bay-ridge", name: "Fourth Ave, Bay Ridge", area: "Bay Ridge", borough: "Brooklyn", mileFrom: 4, mileTo: 6, trains: ["R"], vibe: "Still smiling" },
  { id: "atlantic", name: "Fourth Ave & Atlantic", area: "Downtown Brooklyn", borough: "Brooklyn", mileFrom: 8, mileTo: 8, trains: ["B", "D", "N", "Q", "R", "2", "3", "4", "5"], vibe: "The big stage" },
  { id: "fort-greene", name: "Lafayette Ave", area: "Fort Greene", borough: "Brooklyn", mileFrom: 8.5, mileTo: 9, trains: ["C", "G"], vibe: "Stoop champagne zone" },
  { id: "williamsburg", name: "Bedford Ave", area: "Williamsburg", borough: "Brooklyn", mileFrom: 11, mileTo: 11, trains: ["G", "L", "M", "J"], vibe: "Loud and narrow" },
  { id: "greenpoint", name: "Manhattan Ave near Nassau", area: "Greenpoint", borough: "Brooklyn", mileFrom: 12, mileTo: 12, trains: ["G"], vibe: "Cheer zone" },
  { id: "lic", name: "Long Island City", area: "Queens", borough: "Queens", mileFrom: 13, mileTo: 14, trains: ["7", "G", "E"], vibe: "Halfway, half alive" },
  { id: "first-ave-60s", name: "First Ave, 59th–70th", area: "Upper East Side", borough: "Manhattan", mileFrom: 16, mileTo: 16, trains: ["Q", "4", "5", "6"], vibe: "Wall of noise" },
  { id: "first-ave-90s", name: "First Ave, 90s–110s", area: "East Harlem", borough: "Manhattan", mileFrom: 17, mileTo: 18, trains: ["Q", "6"], vibe: "You can actually be seen" },
  { id: "bronx", name: "Mott Haven (new route)", area: "The Bronx", borough: "Bronx", mileFrom: 20, mileTo: 21, trains: ["6"], vibe: "Be the door in the wall" },
  { id: "fifth-ave-harlem", name: "Fifth Ave, 110th–120th", area: "Harlem", borough: "Manhattan", mileFrom: 22, mileTo: 22, trains: ["2", "3", "6"], vibe: "The hard bit" },
  { id: "museum-mile", name: "Museum Mile", area: "Fifth Ave", borough: "Manhattan", mileFrom: 23, mileTo: 24, trains: ["4", "5", "6"], vibe: "Uphill, sorry" },
  { id: "central-park-east", name: "Central Park, east side", area: "East Drive", borough: "Manhattan", mileFrom: 24, mileTo: 25, trains: ["4", "5", "6", "Q"], vibe: "Almost there" },
  { id: "cps", name: "Central Park South", area: "59th St", borough: "Manhattan", mileFrom: 26, mileTo: 26, trains: ["A", "B", "C", "D", "1", "N", "R"], vibe: "Arrive very early" },
];

export const spotById = (id: string) => spots.find((s) => s.id === id);

export const spotLabel = (s: Spot) =>
  s.mileFrom === s.mileTo ? `Mile ${s.mileFrom}` : `Mile ${s.mileFrom}–${s.mileTo}`;

// MTA bullet colours.
export const trainColor: Record<string, string> = {
  "1": "#EE352E", "2": "#EE352E", "3": "#EE352E",
  "4": "#00933C", "5": "#00933C", "6": "#00933C",
  "7": "#B933AD",
  A: "#0039A6", C: "#0039A6", E: "#0039A6",
  B: "#FF6319", D: "#FF6319", F: "#FF6319", M: "#FF6319",
  G: "#6CBE45",
  J: "#996633", Z: "#996633",
  L: "#A7A9AC",
  N: "#FCCC0A", Q: "#FCCC0A", R: "#FCCC0A", W: "#FCCC0A",
};
