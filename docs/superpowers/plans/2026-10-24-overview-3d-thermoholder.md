# Overview: 3D Thermoholder Rack (draft, pending grill)

## Goal
New bottom-nav menu **Overview**. It shows an interactive isometric (3D-look) SVG of the
16 thermoholders (TH1–TH15 + TH Master) standing on a rack/cart. Each holder's red
7-segment display shows `quickchecker_ref + deviation` from the selected check-sheet entry
(e.g. ref 1500, input `+3` -> `1503`).

## Facts from the codebase
- Units: `src/constants/units.js` (16 units, TH14/TH15 `Digital`, rest `Manual`).
- Entry shape: `{ date, group, values: { TH1: '+3' | 'OK' | 'Error' | '' } }`.
- Ref per month: `data.quickchecker_ref` (default 1500), tolerance ±5 (`src/lib/status.js`).
- Nav: `BottomNav.jsx` + `page` state in `App.jsx`. Stack: React 18 + Vite + Tailwind, plain JS.
- References: `public/referensi/*.jpg` (Heraeus Electro-Nite holders; untracked, ~21 MB).

## Approach
- Anatomy kit (`iso-kit.mjs`, plain ESM) copied to `src/components/overview/iso/`.
- Geometry built once in a pure module (`thermoholderGeometry.js`): one Manual holder,
  one Digital holder, one rack. 16 instances = translate of the same paths.
- Display value from a pure function `displayValue(raw, ref)` + one runnable self-check.
- React: `OverviewView.jsx` renders the static SVG once; live parts (display digits, LEDs,
  hover/selection) written via refs/attributes.
- Size (anatomy): **Hero** (~80–150 parts, ~2–4 h).

## Phases
1. Geometry: Manual holder (case, bezel, display window, 5 LEDs, number label, red button,
   screws, Heraeus plate, handle/lance socket), Digital holder, rack/cart.
2. Data binding: entry picker (date + group), `displayValue`, status colour per holder.
3. Interaction: hover/tap highlight, selected holder readout card, reduced motion
   (idle tour dropped: it would change the detail panel under the user).
4. Nav: `Overview` tab in `BottomNav.jsx`, route in `App.jsx`.
5. Verify: desktop + 390 px phone screenshots, line-end check.

## Decisions (grill, 2026-10-24)
1. **Layout:** cart with 2 tiers, like `IMG_20250910_193439.jpg`. Front tier TH1–TH8.
   Raised back tier TH9–TH12, MASTER (centre), TH13–TH15.
2. **Data:** date + group (Red/White) picker. Default = latest entry (today, last group).
3. **Display:** number -> `ref + n` (`+3` -> `1503`); `OK` -> `1500`; `Error` -> `Err`
   (orange); empty -> `----` (dim). Status LED: green normal (±5), red out-of-std, orange error.
4. **Models:** 2 holder models. Manual = stainless box + red 7-seg LED display
   (`IMG_20260908_095003.jpg`). Digital TH14/TH15 = black rubber case + white LCD
   (`IMG_20260908_111922.jpg`). MASTER = Manual model with `MASTER` label.
5. **Interaction:** hover/tap lifts + highlights a holder. Detail panel under the card: unit,
   raw input, display value, status, 7-day mini trend. No camera rotation.
6. **Theme:** dark figure card inside the light app.
7. **References:** `public/referensi/` not committed; add to `.gitignore` (would ship 21 MB to dist).
8. **Nav:** Overview | Dashboard | Input | Settings. Overview is the default page.

## Out of scope
Camera rotation / true 3D mode, WebGL glow, editing values from Overview.
