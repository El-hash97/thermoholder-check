# Weekly/Monthly Trend Scatter Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-day, per-unit OK/NG deviation scatter chart (one per group: Red, White) above the existing heatmap table on both the Weekly and Monthly Dashboard tabs.

**Architecture:** Two new pure-logic modules (a fixed 16-color unit palette, and a date-range point builder) feed a new presentational `recharts` component, `UnitTrendScatterChart`, which is rendered twice (once per group) inside `WeeklyView.jsx` and `MonthlyView.jsx`. No new dependencies; follows the exact patterns already established by `OkNgScatterChart.jsx` (the Daily tab's chart).

**Tech Stack:** React 18, `recharts` 2.12 (already a dependency), Tailwind CSS, Vite. No test framework exists in this project (no vitest/jest) — verification is via a throwaway Node ESM script for pure logic (this project's `package.json` has `"type": "module"`, so plain `node` runs ESM directly) and via `npm run build` + manual browser check for UI.

## Global Constraints

- No new npm dependency — reuse `recharts`, already installed.
- Dark-theme only app (no light/dark mode toggle) — colors only need to work on the existing slate-800/900 surfaces.
- Identity is never color-alone (existing app convention from `OkNgScatterChart`) — the 16-unit palette is mitigated by a tooltip (exact unit/date/value) and a click-to-highlight legend, per the approved spec `docs/superpowers/specs/2026-07-24-weekly-monthly-trend-scatter-design.md`.
- Only `normal`/`oos` (numeric-comparable) points are plotted; `error`/`none` values are omitted from the chart (still visible in the existing table below it).
- Out of scope: PDF export (`exportWeeklyPDF`/`exportMonthlyPDF`) and `ShareCard` — do not touch them.
- Unit color/order is fixed by index into `UNITS` from `src/constants/units.js` — never reassigned based on filtered/visible data.

---

### Task 1: Unit color palette

**Files:**
- Create: `src/lib/unitColors.js`

**Interfaces:**
- Produces: `UNIT_COLORS` — an array of 16 CSS color strings (`hsl(...)`), index-parallel to `UNITS` in `src/constants/units.js` (i.e. `UNIT_COLORS[i]` is the color for `UNITS[i]`).

- [ ] **Step 1: Write the implementation**

```js
// src/lib/unitColors.js
import { UNITS } from '../constants/units.js'

export const UNIT_COLORS = UNITS.map((_, i) =>
  `hsl(${Math.round((i * 137.508) % 360)}, 65%, 60%)`
)
```

- [ ] **Step 2: Write a throwaway verification script**

Create a temporary file at the repo root:

```js
// _verify-task1.mjs
import { UNIT_COLORS } from './src/lib/unitColors.js'
import { UNITS } from './src/constants/units.js'

console.log('count:', UNIT_COLORS.length, 'expected:', UNITS.length)
console.log('unique:', new Set(UNIT_COLORS).size === UNIT_COLORS.length)
console.log('first 3:', UNIT_COLORS.slice(0, 3))
```

- [ ] **Step 3: Run it and verify output**

Run: `node _verify-task1.mjs`

Expected output:
```
count: 16 expected: 16
unique: true
first 3: [ 'hsl(0, 65%, 60%)', 'hsl(138, 65%, 60%)', 'hsl(275, 65%, 60%)' ]
```

- [ ] **Step 4: Delete the throwaway script**

Run: `rm _verify-task1.mjs` (bash) or `Remove-Item _verify-task1.mjs` (PowerShell)

- [ ] **Step 5: Commit**

```bash
git add src/lib/unitColors.js
git commit -m "feat: add fixed 16-color palette for per-unit chart identity"
```

---

### Task 2: Trend point builder

**Files:**
- Modify: `src/lib/chartData.js` (append new function; existing `buildPoints`, `computeMaxAbs`, `buildTicks`, `formatCompactTick`, `parseValue` are untouched and reused)

**Interfaces:**
- Consumes: `UNITS` from `src/constants/units.js` (already imported in this file), `getStatus` from `src/lib/status.js` (already imported), `parseValue` (already defined in this file).
- Produces: `buildTrendPoints(entries, dates, group)` → `Array<{ date: string, unit: string, unitLabel: string, value: number, status: 'normal'|'oos' }>`, exported from `src/lib/chartData.js`.

- [ ] **Step 1: Add the function**

Append to `src/lib/chartData.js`:

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

- [ ] **Step 2: Write a throwaway verification script**

Create a temporary file at the repo root:

```js
// _verify-task2.mjs
import { buildTrendPoints } from './src/lib/chartData.js'

const entries = [
  { date: '2026-07-20', group: 'red',   values: { TH1: '3', TH2: '12', TH3: 'X' } },
  { date: '2026-07-20', group: 'white', values: { TH1: '-2' } },
  { date: '2026-07-21', group: 'red',   values: { TH1: 'Error' } },
]

const points = buildTrendPoints(entries, ['2026-07-20', '2026-07-21'], 'red')
console.log(JSON.stringify(points))
```

- [ ] **Step 3: Run it and verify output**

Run: `node _verify-task2.mjs`

Expected output (order matches `UNITS` order, then date order; white-group entry and the `error`/`X` values are excluded; `2026-07-21` contributes nothing since its only value is `Error`):
```
[{"date":"2026-07-20","unit":"TH1","unitLabel":"TH 1","value":3,"status":"normal"},{"date":"2026-07-20","unit":"TH2","unitLabel":"TH 2","value":12,"status":"oos"}]
```

- [ ] **Step 4: Delete the throwaway script**

Run: `rm _verify-task2.mjs` (bash) or `Remove-Item _verify-task2.mjs` (PowerShell)

- [ ] **Step 5: Commit**

```bash
git add src/lib/chartData.js
git commit -m "feat: add buildTrendPoints for date-range unit deviation series"
```

---

### Task 3: UnitTrendScatterChart component + Weekly integration

**Files:**
- Create: `src/components/dashboard/UnitTrendScatterChart.jsx`
- Modify: `src/components/dashboard/WeeklyView.jsx`

**Interfaces:**
- Consumes: `UNIT_COLORS` (Task 1), `buildTrendPoints`, `computeMaxAbs`, `buildTicks` (Task 2 / existing `chartData.js`), `UNITS` and `GROUPS` from `src/constants/units.js`.
- Produces: default export `UnitTrendScatterChart({ entries, dates, group, title })` — a React component — from `src/components/dashboard/UnitTrendScatterChart.jsx`. `entries` is the full app entries array (component filters internally by `date`/`group`), `dates` is an array of `'YYYY-MM-DD'` strings, `group` is `'red'|'white'`, `title` is a display string.

- [ ] **Step 1: Create the component**

```jsx
// src/components/dashboard/UnitTrendScatterChart.jsx
import { useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, ReferenceArea, ReferenceLine,
  Tooltip, CartesianGrid,
} from 'recharts'
import { UNITS } from '../../constants/units.js'
import { UNIT_COLORS } from '../../lib/unitColors.js'
import { buildTrendPoints, computeMaxAbs, buildTicks } from '../../lib/chartData.js'

const OK_COLOR = '#16a34a'
const NG_COLOR = '#dc2626'

function PointShape({ cx, cy, fill, status, dimmed }) {
  const opacity = dimmed ? 0.15 : 1
  if (status === 'oos') {
    const r = 5
    return (
      <path
        d={`M ${cx} ${cy - r} L ${cx + r} ${cy + r} L ${cx - r} ${cy + r} Z`}
        fill={fill}
        opacity={opacity}
        stroke="#0f172a"
        strokeWidth={1}
      />
    )
  }
  return <circle cx={cx} cy={cy} r={5} fill={fill} opacity={opacity} stroke="#0f172a" strokeWidth={1} />
}

function renderShape(color, selectedUnit, unitId) {
  return (props) => (
    <PointShape
      cx={props.cx}
      cy={props.cy}
      fill={color}
      status={props.payload.status}
      dimmed={selectedUnit != null && selectedUnit !== unitId}
    />
  )
}

export default function UnitTrendScatterChart({ entries, dates, group, title }) {
  const [selectedUnit, setSelectedUnit] = useState(null)
  const points = buildTrendPoints(entries, dates, group)

  if (points.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-slate-300">{title}</p>
        <div className="flex items-center justify-center text-xs text-slate-500" style={{ height: 160 }}>
          No data
        </div>
      </div>
    )
  }

  const maxAbs = computeMaxAbs(points)
  const chartHeight = 220
  const chartWidth = Math.max(dates.length * 28, 320)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-slate-300">{title}</p>
      <div className="overflow-x-auto">
        <ScatterChart
          width={chartWidth}
          height={chartHeight}
          margin={{ top: 10, right: 16, bottom: 24, left: 8 }}
        >
          <CartesianGrid stroke="#1e293b" />
          <XAxis
            dataKey="date"
            type="category"
            allowDuplicatedCategory={false}
            domain={dates}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickFormatter={d => d.slice(8)}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
            interval={0}
            height={20}
          />
          <YAxis
            dataKey="value"
            type="number"
            domain={[-maxAbs, maxAbs]}
            ticks={buildTicks(maxAbs)}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
            width={28}
          />
          <ReferenceArea
            y1={-5} y2={5} fill={OK_COLOR} fillOpacity={0.15}
            label={{ value: 'OK', position: 'insideLeft', fill: '#86efac', fontSize: 10 }}
          />
          <ReferenceArea
            y1={5} y2={maxAbs} fill={NG_COLOR} fillOpacity={0.12}
            label={{ value: 'NG', position: 'insideTopLeft', fill: '#fca5a5', fontSize: 10 }}
          />
          <ReferenceArea
            y1={-maxAbs} y2={-5} fill={NG_COLOR} fillOpacity={0.12}
            label={{ value: 'NG', position: 'insideBottomLeft', fill: '#fca5a5', fontSize: 10 }}
          />
          <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            formatter={(value, _name, props) => [
              `${value} (${props.payload.status === 'normal' ? 'OK' : 'NG'})`,
              `${props.payload.unitLabel} · ${props.payload.date}`,
            ]}
            labelFormatter={() => ''}
          />
          {UNITS.map((unit, i) => {
            const unitPoints = points.filter(p => p.unit === unit.id)
            if (unitPoints.length === 0) return null
            return (
              <Scatter
                key={unit.id}
                data={unitPoints}
                shape={renderShape(UNIT_COLORS[i], selectedUnit, unit.id)}
              />
            )
          })}
        </ScatterChart>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 px-1">
        {UNITS.map((unit, i) => (
          <button
            key={unit.id}
            onClick={() => setSelectedUnit(prev => prev === unit.id ? null : unit.id)}
            className={`flex items-center gap-1 px-1 rounded ${selectedUnit === unit.id ? 'bg-slate-700 text-slate-200' : ''}`}
          >
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: UNIT_COLORS[i] }} />
            {unit.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-slate-300" /> OK (circle)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 inline-block bg-slate-300" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} /> NG (triangle)
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`

Expected: exits 0, output ends with a `vite v5...  built in ...ms` success line, no errors mentioning `UnitTrendScatterChart`.

- [ ] **Step 3: Wire it into WeeklyView**

In `src/components/dashboard/WeeklyView.jsx`, change the imports at the top from:

```jsx
import { UNITS } from '../../constants/units.js'
```

to:

```jsx
import { UNITS, GROUPS } from '../../constants/units.js'
import UnitTrendScatterChart from './UnitTrendScatterChart.jsx'
```

Then, in the returned JSX, insert a new block immediately after the "Status legend" `<div>` (the one listing Normal/OOS/Error/Not Available) and immediately before the `<div className="overflow-x-auto">` that wraps the `<table>`:

```jsx
      <div className="flex flex-col gap-4">
        {GROUPS.map(g => (
          <UnitTrendScatterChart
            key={g.id}
            entries={entries}
            dates={weekDates}
            group={g.id}
            title={`${g.label} team`}
          />
        ))}
      </div>
```

- [ ] **Step 4: Verify the build compiles**

Run: `npm run build`

Expected: exits 0, same success output as Step 2, no errors mentioning `WeeklyView`.

- [ ] **Step 5: Manual browser verification**

Run: `npm run dev:web`

Open the printed local URL (e.g. `http://localhost:5173`), go to the Weekly tab. Confirm:
- Two charts appear above the table, titled "Red team" and "White team".
- If there's no data for the current week, each chart shows a "No data" placeholder instead of an empty/broken chart.
- If there is data, dots of different colors appear, hovering a dot shows a tooltip with unit/date/value, and clicking a unit chip in the legend row dims the other units' dots.
- No errors in the browser devtools console.

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/UnitTrendScatterChart.jsx src/components/dashboard/WeeklyView.jsx
git commit -m "feat: add per-unit trend scatter charts to Weekly dashboard tab"
```

---

### Task 4: Monthly integration

**Files:**
- Modify: `src/components/dashboard/MonthlyView.jsx`

**Interfaces:**
- Consumes: `UnitTrendScatterChart` (Task 3), `GROUPS` from `src/constants/units.js`, the existing local `days` array (from `getDaysInMonth(monthKey)`, already computed in this file).

- [ ] **Step 1: Wire it into MonthlyView**

In `src/components/dashboard/MonthlyView.jsx`, change the imports at the top from:

```jsx
import { UNITS, GROUPS } from '../../constants/units.js'
```

to (add the new component import; `GROUPS` is already imported in this file):

```jsx
import { UNITS, GROUPS } from '../../constants/units.js'
import UnitTrendScatterChart from './UnitTrendScatterChart.jsx'
```

Then, in the returned JSX, insert a new block immediately after the "Legend" `<div>` (the one listing R/W badges plus Normal/OOS/Error/Not Available) and immediately before the `<div className="overflow-x-auto">` that wraps the `<table>`:

```jsx
      <div className="flex flex-col gap-4">
        {GROUPS.map(g => (
          <UnitTrendScatterChart
            key={g.id}
            entries={entries}
            dates={days}
            group={g.id}
            title={`${g.label} team`}
          />
        ))}
      </div>
```

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`

Expected: exits 0, `vite v5...  built in ...ms` success line, no errors mentioning `MonthlyView`.

- [ ] **Step 3: Manual browser verification**

Run: `npm run dev:web`

Open the printed local URL, go to the Monthly tab. Confirm:
- Two charts appear above the table, titled "Red team" and "White team".
- The chart area scrolls horizontally to accommodate up to 31 dates (drag/swipe or use a mouse to scroll within the chart), matching the existing table's horizontal-scroll behavior.
- Tooltip, legend highlight, and "No data" empty state behave the same as verified on the Weekly tab.
- No errors in the browser devtools console.

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/MonthlyView.jsx
git commit -m "feat: add per-unit trend scatter charts to Monthly dashboard tab"
```
