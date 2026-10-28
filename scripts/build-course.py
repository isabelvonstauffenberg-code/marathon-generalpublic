"""Builds src/data/course.json from the 2014 datanews NYC Marathon trace, patched for the 2026 Bronx change.

2026 change (NYRR): after Alexander Ave, runners stay on Alexander to E 141st St, left on E 141st,
left on Third Ave, right on E 138th St to the Madison Ave Bridge.
"""
import json
import pathlib

here = pathlib.Path(__file__).parent
coords = json.load(open(here / "route-2014.geojson"))["features"][0]["geometry"]["coordinates"]

ALEXANDER_138 = [-73.92516, 40.81007]
assert abs(coords[66][0] - ALEXANDER_138[0]) < 1e-4, coords[66]
new_bronx = [
    [-73.92375, 40.81206],  # Alexander Ave & E 141st St
    [-73.92476, 40.81232],  # E 141st St & Third Ave
    [-73.92712, 40.81094],  # Third Ave & E 138th St
]
patched = coords[:67] + new_bronx + coords[72:]
out = {"source": "datanews/ny-marathon (2014) with 2026 Bronx reroute", "coordinates": [[round(x, 6), round(y, 6)] for x, y in patched]}
(here.parent / "src/data/course.json").write_text(json.dumps(out))
print(len(patched), "points")
