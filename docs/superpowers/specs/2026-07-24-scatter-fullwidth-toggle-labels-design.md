# Trend Scatter Chart — Full Width, Red/White Toggle, Value Labels — Design

**Date:** 2026-07-24
**Status:** Approved

## Problem

The trend scatter charts added to Weekly/Monthly (`UnitTrendScatterChart.jsx`,
see [2026-07-24-weekly-monthly-trend-scatter-design.md](2026-07-24-weekly-monthly-trend-scatter-design.md))
have three usability issues the user flagged after using them:

1. The chart is rendered at a fixed pixel width (`dates.length * 28`, min 320)
   inside `overflow-x-auto`. On a real device this is often narrower than the
   available card width, leaving dead space on the right instead of filling it.
2. Red and White team charts are rendered stacked (one `UnitTrendScatterChart`
   per `GROUPS` entry), doubling vertical space and forcing the user to scroll
   past one team to compare with the other.
3. Points only reveal their exact value via tooltip (hover/tap-and-hold) — the
   user wants every OK/NG value visible as a number at a glance, not just as a
   dot position.

The user also wants the chart taller/bigger overall now that it's not sharing
space with a second stacked chart.

## Current state (relevant findings)

- `UnitTrendScatterChart.jsx` (`src/components/dashboard/`) takes `entries`,
  `dates`, `group`, `title` and renders one team's chart. `WeeklyView.jsx` and
  `MonthlyView.jsx` both loop over `GROUPS` (`constants/units.js`) and render
  one instance per group, stacked in a `flex flex-col gap-4`.
- The chart uses a raw `recharts` `ScatterChart` with explicit `width`/`height`
  (no `ResponsiveContainer`), wrapped in `overflow-x-auto` — same pattern as
  `OkNgScatterChart.jsx` (Daily tab), which is explicitly **out of scope** here
  (not mentioned in the request, and Daily's X axis is unit-based, not date
  trend, so the crowding problem doesn't apply there).
- `Dashboard.jsx` wraps all three tabs (Daily/Weekly/Monthly) in one shared
  card: `<div className="mx-3 bg-slate-800 rounded-xl p-4">`. Editing this
  card's padding would affect Daily too, which the user did not ask to change.
  To keep the change scoped to Weekly/Monthly, the fix happens inside
  `WeeklyView.jsx`/`MonthlyView.jsx` instead (negative margin on the chart's
  own wrapper to bleed past the inherited padding).
- Per-unit highlight (`selectedUnit` state, click a legend chip to dim other
  15 units) already exists and must keep working — value labels dim together
  with their point.
- Monthly can have up to 31 dates × 16 units of simultaneously-visible points;
  the user explicitly accepted that always-on labels will still be dense on
  crowded months, mitigated only by shrinking font/marker size, not by hiding
  labels or reintroducing scroll.

## Design

### 1. Responsive full-width sizing

- Replace the fixed `width={chartWidth}` `ScatterChart` with `recharts`'
  `ResponsiveContainer` (`width="100%"`, `height={chartHeight}`), removing the
  `Math.max(dates.length * 28, 320)` calculation entirely — the plot now
  always fills whatever width its container gives it, for both 7-date (Weekly)
  and up-to-31-date (Monthly) ranges.
- `chartHeight` increases from `220` to `300`.
- The chart's outer wrapper in `UnitTrendScatterChart.jsx` gets `-mx-4` to
  offset the parent card's `p-4` (set in `Dashboard.jsx`), so the plot reaches
  the card's true right edge ("full sampai kanan") without editing the shared
  `Dashboard.jsx` card. Internal chart margins (`right: 16` etc.) stay as
  breathing room inside that bled-out area.
- The `overflow-x-auto` wrapper is removed — no horizontal scroll, per the
  user's explicit choice to keep it full-width even when Monthly gets dense.

### 2. Red/White toggle replaces stacked charts

- `UnitTrendScatterChart` changes its props: drops `group` and `title`, keeps
  `entries`/`dates`. It now owns an internal `activeGroup` state
  (`useState('red')`) instead of the parent looping over `GROUPS`.
- A segmented toggle (two buttons, "Red" / "White") renders above the chart,
  styled like the existing legend chips (`bg-slate-700` active state, same
  `touch-target` sizing) — not a native `<input type="radio">`, for visual
  consistency with the rest of the dashboard's button-based toggles (e.g. the
  Daily/Weekly/Monthly tab bar in `Dashboard.jsx`).
- `activeGroup` always starts at `'red'` and is **not** persisted across
  re-mounts — per the user's choice, switching weeks/months or tabs resets to
  Red. No new state is lifted to `WeeklyView`/`MonthlyView`/`Dashboard`.
- `WeeklyView.jsx` / `MonthlyView.jsx` stop looping over `GROUPS` for this
  component and render a single `<UnitTrendScatterChart entries={entries}
  dates={weekDates|days} />`.
- `title` prop is dropped; a static heading ("Unit trend") replaces the
  per-group title, or the toggle buttons themselves serve as the title context
  (no separate `<p>` needed since "Red"/"White" is now visible via the active
  toggle button).

### 3. Per-point value labels

- Each point now renders its numeric value as a `<text>` label positioned
  above the marker (`y = cy - r - 4`), in addition to the existing
  circle/triangle shape.
- Label color matches status: `#4ade80` (green, OK) / `#f87171` (red, NG) —
  distinct from the marker's unit-identity fill color, so the label reads as
  a status indicator, matching the OK/NG reference-area color convention
  already used in this chart.
- Label opacity dims together with its point's marker opacity when another
  unit is selected via the legend (`selectedUnit` highlight logic extends to
  the label, not just the shape).
- **Density mitigation for Monthly:** when `dates.length > 10`, marker radius
  drops from `5` to `3.5` and label `fontSize` drops from `10` to `7`. This is
  a readability mitigation, not a fix — the user explicitly accepted that
  many simultaneous points on a crowded month will still visually overlap,
  in exchange for keeping the chart full-width/scroll-free.

### 4. Unchanged

- Unit legend (16 clickable chips) and the OK (circle) / NG (triangle) shape
  legend below the chart stay as-is.
- `buildTrendPoints`, `computeMaxAbs`, `buildTicks`, `UNIT_COLORS` — no data
  or color logic changes.
- `OkNgScatterChart.jsx` (Daily tab) — untouched.
- PDF export and share-card flows — untouched.

## Out of scope

- No change to `Dashboard.jsx`'s shared card padding (affects Daily too) —
  the full-width effect is achieved locally via negative margin instead.
- No persistence of the Red/White toggle choice across navigation.
- No further overlap-prevention for Monthly beyond the font/marker shrink
  (e.g. no label collision detection/repositioning) — explicitly accepted
  trade-off.
