# OK/NG Scatter Chart — Design

**Date:** 2026-07-16
**Status:** Approved

## Problem

The Dashboard's Daily tab and the app's "share photo" feature (`ShareCard`) show
per-unit status as colored table cells / grid chips only. There's no at-a-glance
visual for how far each unit's reading sits from the ±5°C tolerance band. The user
wants a chart where each unit is a dot positioned in a green "OK" area or a red
"NG" area, added to both the Dashboard and the shared photo.

## Current state (relevant findings)

- Deviation values are ints; `getStatus()` in `src/lib/status.js` classifies
  `-5..+5` as `normal` (OK), anything else numeric as `oos` (NG), plus `error` and
  `none` (blank/`X`) as separate non-numeric statuses.
- Existing status colors used throughout the app: `#16a34a` (green/normal),
  `#dc2626` (red/oos), `#ea580c` (orange/error), `#475569` (slate/none). These are
  reused as-is — this is a *status* palette, not a new categorical one.
- `recharts` is already a project dependency (used nowhere yet).
- `ExportMenu.jsx` + `ShareCard.jsx` exist but **`ExportMenu` is not rendered
  anywhere** — the only working "share" today is `InputCheckSheet`'s own Share
  button, which renders `ShareCard` with a single `{date, group, values}` entry.
- `DailyView.jsx` owns its own `date` state locally and is the only Dashboard tab
  in scope (Weekly/Monthly are unaffected).

## Design

### 1. New component: `src/components/dashboard/OkNgScatterChart.jsx`

A `recharts` `ScatterChart`, presentational only.

- **Props:** `entries` (array of `{ group: 'red'|'white', values: {unitId: value} }`
  for a single date), `compact` (bool, default `false`), `width`/`height` (pixel
  numbers, required when `compact` is true).
- **Data prep:** for each unit in `UNITS` × each entry in `entries`, compute
  `getStatus(value)`. Only include points where `status` is `normal` or `oos`
  (numeric) — `error`/`none` units are omitted from the chart (they remain visible
  in the existing table/grid below it).
- **Axes:** X = unit, `type="category"`. Y = numeric deviation value. Y domain is
  `[-maxAbs, maxAbs]` where `maxAbs = max(10, ceil to nearest 5 of max(|value|) + 2)`
  so the tolerance band and any outliers are always both visible.
- **Zones:** a green `ReferenceArea` from y=-5 to y=5 labeled "OK"; red
  `ReferenceArea`s from y=5 to y=maxAbs and y=-maxAbs to y=-5, both labeled "NG".
  Fill colors are the existing `#16a34a` / `#dc2626` at reduced opacity (~0.15);
  zone label text uses the app's existing muted text color, not the zone color
  (labels are never color-only).
- **Marks:** two `Scatter` series, one per group:
  - Red group → circle marker.
  - White group → diamond marker.
  Each dot's fill is solid `#16a34a` (normal) or `#dc2626` (oos) — shape carries
  group identity, fill carries OK/NG, so identity is never color-alone.
- **Legend:** below the chart — a zone swatch pair ("● OK" green, "● NG" red) and
  a shape pair ("○ Red team", "◇ White team"), all with text labels.
- **Full mode (Dashboard):** unit tick labels shown (`TH1`...`TH15`, `TH Master`);
  wrapped in a horizontally-scrollable container with a `min-width` sized for 16
  categories (~40px/unit), matching the existing scroll pattern already used by
  `DailyView`/`WeeklyView`/`MonthlyView` tables.
- **Compact mode (ShareCard):** fixed pixel `width`/`height` (no
  `ResponsiveContainer`, to avoid html2canvas capture-timing issues), no per-unit
  X tick labels (the existing per-unit grid below it in `ShareCard` already gives
  exact values) — just the colored zones, dots, and the OK/NG + shape legend.
- **Empty state:** if there are no plottable (numeric) points, render a centered
  muted "No data" placeholder instead of an empty chart, consistent with other
  empty states in the app.

### 2. Dashboard wiring

- `Dashboard.jsx`: lift `date` state (currently local to `DailyView`) up here;
  compute `dayEntries = entries.filter(e => e.date === date)`. Pass `date` +
  `onDateChange` down to `DailyView`. When `tab === 'daily'`, render `ExportMenu`
  (see below) under the Daily card, passing `date` and `dayEntries`.
- `DailyView.jsx`: accept `date`/`onDateChange` as props instead of local
  `useState`; existing `shiftDate` logic now calls `onDateChange`. Insert
  `<OkNgScatterChart entries={...} />` between `SummaryCards` and the unit table,
  built from the same `dayEntries` already computed for the table.

### 3. Share photo wiring

- `ExportMenu.jsx`: change props from `data` to `date` + `entries` (drop the old
  `lastEntry` derivation — no longer needed since the caller now supplies the
  exact entries for the viewed date). Renders `<ShareCard date={date}
  entries={entries} />` in its modal, unchanged Share button/flow otherwise.
- `ShareCard.jsx`: change prop contract from a single `entry` to `date` +
  `entries` (array of 1–2 `{group, values}`).
  - Header: date + a badge per group present (reusing the existing Red/White
    badge colors from `DailyView`'s table header) instead of a single
    shift/group line.
  - Summary counts: aggregate `summarize()` across all entries' values combined
    (same `unitId_group` keying `DailyView` already uses for its own counts), so
    counts reflect every group shown.
  - Per-unit grid: extended to show one chip per group per unit (was one chip per
    unit) when 2 entries are present, otherwise unchanged (1 chip) for the
    single-entry case.
  - Add `<OkNgScatterChart entries={entries} compact width={320} height={150} />`
    between the summary counts and the per-unit grid.
- `InputCheckSheet.jsx`: update its existing `<ShareCard entry={{date, group,
  values}} />` call to `<ShareCard date={date} entries={[{group, values}]} />`.
  Its own Share button/flow is otherwise unchanged — it now simply renders a
  1-entry chart (Red or White only, whichever is being edited).

## Out of scope

- Weekly/Monthly tabs — no chart or share changes there.
- No new color palette — reuses the app's existing status colors exactly.
- No changes to how values are entered, validated, or stored.
