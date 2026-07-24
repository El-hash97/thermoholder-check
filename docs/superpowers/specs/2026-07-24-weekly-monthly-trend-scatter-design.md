# Weekly/Monthly Trend Scatter Charts — Design

**Date:** 2026-07-24
**Status:** Approved

## Problem

The Dashboard's Weekly and Monthly tabs (`WeeklyView.jsx`, `MonthlyView.jsx`) only
show a colored heatmap-style table (one cell per unit × date × group, colored by
status). There's no way to see actual deviation *values* trending over a week or
month — only pass/fail color. The Daily tab already has `OkNgScatterChart` for
this, but the 2026-07-16 scatter chart spec explicitly scoped Weekly/Monthly out.
The user now wants a per-day, per-unit OK/NG scatter chart added to both tabs,
with each of the 16 thermoholder units getting its own dot color.

## Current state (relevant findings)

- `src/lib/chartData.js` has `buildPoints(entries)` (single-date, no date field),
  `computeMaxAbs(points)`, `buildTicks(maxAbs)` — the latter two are date-agnostic
  and reusable as-is.
- `src/components/dashboard/OkNgScatterChart.jsx` is the existing Daily scatter:
  X = unit (category), Y = deviation value, color = OK/NG status, shape = group
  (red team = circle, white team = diamond). Only `normal`/`oos` (numeric) points
  are plotted; `error`/`none` are omitted from the chart (still visible in tables).
- `WeeklyView.jsx` / `MonthlyView.jsx` currently render only the heatmap table,
  built from `groupStatus()` helpers that classify each unit/date/group cell into
  `normal | oos | error | none` for coloring — no numeric values are shown today
  in these two tabs.
- `getWeekDates(refDate)` returns 7 date strings (Mon–Sun); `getDaysInMonth(monthKey)`
  returns up to 31 date strings. Both are already used to build the table headers.
- The app is dark-theme only (slate-800/900 surfaces), no light/dark toggle, so
  the new palette only needs to be tuned for one (dark) surface.
- **Accessibility trade-off (discussed with user):** a true colorblind-safe
  categorical palette tops out around 8 hues; 16 simultaneously-distinct,
  CVD-safe scatter colors are not achievable. User explicitly accepted a
  best-effort 16-hue palette (not guaranteed CVD-safe) mitigated by: (a) a
  tooltip that always names the exact unit/date/value, and (b) a clickable
  legend that highlights one unit at a time (dims the other 15) so the reader
  never has to disambiguate 16 simultaneous colors by eye alone.

## Design

### 1. Data prep — `src/lib/chartData.js`

Add `buildTrendPoints(entries, dates, group)`:

```js
export function buildTrendPoints(entries, dates, group) {
  const points = []
  dates.forEach(date => {
    entries
      .filter(e => e.date === date && e.group === group)
      .forEach(entry => {
        UNITS.forEach(unit => {
          const raw = entry.values?.[unit.id]
          const { status } = getStatus(raw)
          if (status !== 'normal' && status !== 'oos') return
          points.push({
            date,
            unit: unit.id,
            unitLabel: unit.label,
            value: parseValue(raw),
            status,
          })
        })
      })
  })
  return points
}
```

Reuses `computeMaxAbs`/`buildTicks` unchanged (they only read `.value`).

### 2. Unit color palette — `src/lib/unitColors.js` (new)

Fixed-order color per unit, assigned by index into `UNITS` (never reassigned or
cycled based on filtered/visible data, per the app's existing "identity is never
color-alone" convention from the Daily scatter chart):

```js
export const UNIT_COLORS = UNITS.map((_, i) =>
  `hsl(${Math.round((i * 137.508) % 360)}, 65%, 60%)`
)
```

Golden-angle hue stepping spreads adjacent-index hues apart (avoids neighboring
units in the legend getting near-identical hues), at a fixed saturation/lightness
tuned for visibility on the app's dark slate surfaces.

### 3. New component — `src/components/dashboard/UnitTrendScatterChart.jsx`

Presentational, `recharts` `ScatterChart`.

- **Props:** `entries`, `dates` (array of date strings), `group` (`'red'|'white'`),
  `title` (string, e.g. "Red team").
- **Data:** `buildTrendPoints(entries, dates, group)`.
- **Axes:** X = `date`, `type="category"`, domain = `dates`, tick label = day-of-month
  digits (`d.slice(8)`, same format already used in the table headers). Y = `value`,
  domain `[-maxAbs, maxAbs]` with `ReferenceArea`/`ReferenceLine` OK/NG zones,
  identical styling to `OkNgScatterChart`.
- **Marks:** one `<Scatter>` per unit (16 series), `data` filtered to that unit's
  points, `fill` = `UNIT_COLORS[index]`. Shape per point: circle for `status ===
  'normal'`, triangle for `status === 'oos'` (new `TriangleShape`, sibling to the
  existing `DotShape` diamond/circle in `OkNgScatterChart` — kept local to this
  file since the encoding differs from the Daily chart's group-shape convention).
- **Highlight interaction:** local `useState` `selectedUnit` (unit id or `null`).
  Each unit's `Scatter` shape renderer drops fill-opacity to `0.15` when
  `selectedUnit` is set and doesn't match that unit; full opacity otherwise.
- **Legend:**
  - Row 1: 16 clickable chips (color swatch + unit label, `touch-target` sized),
    `onClick` toggles `selectedUnit` (click again to deselect / show all).
  - Row 2: static shape legend — "● OK" / "▲ NG" — plus the existing OK/NG color
    swatches, matching `OkNgScatterChart`'s bottom legend style.
- **Tooltip:** on hover/tap, shows unit label, date, value, and OK/NG — the
  disambiguation channel for when colors are hard to tell apart.
- **Empty state:** centered muted "No data" placeholder if `buildTrendPoints`
  returns zero points, consistent with `OkNgScatterChart`.
- **Sizing:** horizontally scrollable, non-responsive fixed pixel width (same
  pattern as `OkNgScatterChart` / the existing tables) —
  `chartWidth = Math.max(dates.length * 28, 320)`, `chartHeight = 220`.

### 4. Integration

- `WeeklyView.jsx`: render two `<UnitTrendScatterChart>` (Red, then White) between
  the header/legend block and the existing table, passing `entries`,
  `dates={weekDates}`.
- `MonthlyView.jsx`: same, passing `dates={days}`. Existing table, tooltip-on-tap
  cell detail, and PDF export button are unchanged.
- Both iterate `GROUPS` from `constants/units.js` rather than hardcoding
  `'red'`/`'white'` twice, so a future group addition only touches `GROUPS`.

## Out of scope

- PDF export (`exportWeeklyPDF`/`exportMonthlyPDF`) and the share-photo card
  (`ShareCard`) are not touched — charts are on-screen only for now.
- No change to the existing heatmap tables, status classification, or data entry.
- No new dependency — reuses `recharts`, already a project dependency.
