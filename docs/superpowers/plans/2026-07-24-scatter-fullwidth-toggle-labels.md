# Trend Scatter Chart — Full Width, Toggle, Value Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Weekly/Monthly trend scatter chart (`UnitTrendScatterChart`) so it fills the full card width, switches between Red/White team via an in-chart toggle instead of stacking both, and shows every point's OK/NG numeric value as an always-visible label.

**Architecture:** `UnitTrendScatterChart.jsx` is rewritten in place: its `recharts` `ScatterChart` moves from a fixed pixel width inside a horizontal-scroll wrapper to `ResponsiveContainer` (`width="100%"`), the component takes over group selection internally (drops the `group`/`title` props, adds a `Red`/`White` toggle + `activeGroup` state), and its point-shape renderer grows a `<text>` value label alongside the existing circle/triangle marker. `WeeklyView.jsx` and `MonthlyView.jsx` each go from rendering two stacked instances (looping `GROUPS`) to rendering one instance with the new two-prop signature. No new dependencies; `ResponsiveContainer` is already part of the installed `recharts` package.

**Tech Stack:** React 18, `recharts` 2.12 (already a dependency), Tailwind CSS, Vite. No test framework exists in this project (no vitest/jest) — verification here is `npm run build` (compile check) plus manual browser check via `npm run dev:web`, matching the pattern used by the prior trend-chart plan.

## Global Constraints

- No new npm dependency — `ResponsiveContainer` is already exported by the installed `recharts` package.
- Dark-theme only app (no light/dark toggle) — colors only need to work on the existing slate-800/900 surfaces.
- The chart must reach the full width of its containing card with **no horizontal scroll**, for both Weekly (7 dates) and Monthly (up to 31 dates) — density on Monthly is mitigated by shrinking marker radius and label font size, not by reintroducing scroll or hiding labels.
- Every plotted point always shows its numeric value as a label — no tap-to-reveal, no toggle to hide labels.
- The Red/White toggle always starts on `'red'` and is **not** persisted across re-mounts (switching week/month or dashboard tab resets it to Red). No state is lifted to `WeeklyView`/`MonthlyView`/`Dashboard`.
- Do not edit `Dashboard.jsx`'s shared card padding (`mx-3 p-4`, wraps Daily too) — the full-width effect is achieved with a local negative margin inside `UnitTrendScatterChart.jsx` only.
- `OkNgScatterChart.jsx` (Daily tab) is out of scope — do not touch it.
- Unit color/order stays fixed by index into `UNITS` (`UNIT_COLORS`, from `src/lib/unitColors.js`) — no changes to that module.
- `buildTrendPoints`, `computeMaxAbs`, `buildTicks` in `src/lib/chartData.js` are reused unchanged — no changes to that module.

---

### Task 1: Rework `UnitTrendScatterChart` (full-width, toggle, value labels) + Weekly integration

**Files:**
- Modify: `src/components/dashboard/UnitTrendScatterChart.jsx` (full rewrite of the file's contents)
- Modify: `src/components/dashboard/WeeklyView.jsx:3` (import), `WeeklyView.jsx:77-87` (chart render block)

**Interfaces:**
- Consumes: `UNIT_COLORS` from `src/lib/unitColors.js` (unchanged), `buildTrendPoints`/`computeMaxAbs`/`buildTicks` from `src/lib/chartData.js` (unchanged), `UNITS`/`GROUPS` from `src/constants/units.js` (unchanged — `GROUPS` is `[{id:'red',label:'Red'},{id:'white',label:'White'}]`), `ResponsiveContainer` from `recharts` (new import, already in the installed package).
- Produces: default export `UnitTrendScatterChart({ entries, dates })` — a React component — from `src/components/dashboard/UnitTrendScatterChart.jsx`. **Breaking change from the current signature:** the `group` and `title` props are removed; the component now renders both groups' data internally via its own `activeGroup` state and a visible toggle, so callers only ever pass `entries` (full app entries array) and `dates` (array of `'YYYY-MM-DD'` strings).

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `src/components/dashboard/UnitTrendScatterChart.jsx` with:

```jsx
// src/components/dashboard/UnitTrendScatterChart.jsx
import { useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, ReferenceArea, ReferenceLine,
  Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { UNITS, GROUPS } from '../../constants/units.js'
import { UNIT_COLORS } from '../../lib/unitColors.js'
import { buildTrendPoints, computeMaxAbs, buildTicks } from '../../lib/chartData.js'

const OK_COLOR = '#16a34a'
const NG_COLOR = '#dc2626'
const OK_LABEL_COLOR = '#4ade80'
const NG_LABEL_COLOR = '#f87171'

function PointShape({ cx, cy, fill, status, value, dimmed, r, fontSize }) {
  const opacity = dimmed ? 0.15 : 1
  const labelColor = status === 'oos' ? NG_LABEL_COLOR : OK_LABEL_COLOR
  return (
    <g>
      {status === 'oos' ? (
        <path
          d={`M ${cx} ${cy - r} L ${cx + r} ${cy + r} L ${cx - r} ${cy + r} Z`}
          fill={fill}
          opacity={opacity}
          stroke="#0f172a"
          strokeWidth={1}
        />
      ) : (
        <circle cx={cx} cy={cy} r={r} fill={fill} opacity={opacity} stroke="#0f172a" strokeWidth={1} />
      )}
      <text x={cx} y={cy - r - 4} textAnchor="middle" fontSize={fontSize} fill={labelColor} opacity={opacity}>
        {value}
      </text>
    </g>
  )
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12, padding: '6px 10px', color: '#e2e8f0' }}>
      <div>{p.unitLabel} · {p.date}</div>
      <div>{p.value} ({p.status === 'normal' ? 'OK' : 'NG'})</div>
    </div>
  )
}

function renderShape(color, selectedUnit, unitId, r, fontSize) {
  return (props) => (
    <PointShape
      cx={props.cx}
      cy={props.cy}
      fill={color}
      status={props.payload.status}
      value={props.payload.value}
      dimmed={selectedUnit != null && selectedUnit !== unitId}
      r={r}
      fontSize={fontSize}
    />
  )
}

export default function UnitTrendScatterChart({ entries, dates }) {
  const [activeGroup, setActiveGroup] = useState('red')
  const [selectedUnit, setSelectedUnit] = useState(null)
  const points = buildTrendPoints(entries, dates, activeGroup)
  const maxAbs = computeMaxAbs(points)

  const dense = dates.length > 10
  const pointRadius = dense ? 3.5 : 5
  const labelFontSize = dense ? 7 : 10
  const chartHeight = 300

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 text-xs">
        {GROUPS.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={`px-3 py-1.5 rounded-lg font-medium touch-target transition-colors ${
              activeGroup === g.id ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {points.length === 0 ? (
        <div className="flex items-center justify-center text-xs text-slate-500" style={{ height: 160 }}>
          No data
        </div>
      ) : (
        <div className="-mx-4">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ScatterChart margin={{ top: 10, right: 16, bottom: 24, left: 8 }}>
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
                content={<ChartTooltip />}
              />
              {UNITS.map((unit, i) => {
                const unitPoints = points.filter(p => p.unit === unit.id)
                if (unitPoints.length === 0) return null
                return (
                  <Scatter
                    key={unit.id}
                    data={unitPoints}
                    shape={renderShape(UNIT_COLORS[i], selectedUnit, unit.id, pointRadius, labelFontSize)}
                  />
                )
              })}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

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

Expected: exits 0, output ends with a `vite v5...  built in ...ms` success line. It's expected to still succeed even though `WeeklyView.jsx`/`MonthlyView.jsx` haven't been updated yet — JSX doesn't type-check unused/extra props, so the old `group`/`title` props passed by the not-yet-updated call sites are silently ignored at this point (they'll be removed in this task's Step 3 and in Task 2).

- [ ] **Step 3: Update WeeklyView's import**

In `src/components/dashboard/WeeklyView.jsx`, change line 3 from:

```jsx
import { UNITS, GROUPS } from '../../constants/units.js'
```

to (drop `GROUPS` — it was only used by the old per-group chart loop; the table below hardcodes `'red'`/`'white'` directly and never referenced `GROUPS`):

```jsx
import { UNITS } from '../../constants/units.js'
```

- [ ] **Step 4: Update WeeklyView's chart render block**

In the same file, replace this block (currently lines 77-87):

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

with:

```jsx
      <div className="flex flex-col gap-4">
        <UnitTrendScatterChart entries={entries} dates={weekDates} />
      </div>
```

- [ ] **Step 5: Verify the build compiles**

Run: `npm run build`

Expected: exits 0, same success output as Step 2, no errors mentioning `WeeklyView` or `GROUPS`.

- [ ] **Step 6: Manual browser verification**

Run: `npm run dev:web`

Open the printed local URL (e.g. `http://localhost:5173`), go to the Weekly tab. Confirm:
- One chart appears above the table (not two stacked), with a "Red" / "White" toggle above it; "Red" is active by default.
- The chart's plot area visibly extends to the right edge of the dashboard card (no dead space, no horizontal scrollbar).
- If there's data for the active group, every point shows a small number above it (its OK/NG value), colored green for OK / red for NG, in addition to the circle/triangle marker.
- Clicking "White" switches the chart to White team's data (or shows "No data" if none exists for the current week); the toggle button itself doesn't jump position.
- Clicking a unit chip in the legend row still dims the other units' dots **and** their value labels.
- Navigating to a different week and back resets the toggle to "Red".
- No errors in the browser devtools console.

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/UnitTrendScatterChart.jsx src/components/dashboard/WeeklyView.jsx
git commit -m "feat: full-width trend chart with red/white toggle and value labels"
```

---

### Task 2: Monthly integration

**Files:**
- Modify: `src/components/dashboard/MonthlyView.jsx:91-101` (chart render block only — the `GROUPS` import on line 3 stays, since it's still used by this file's tooltip-detail popup)

**Interfaces:**
- Consumes: `UnitTrendScatterChart` (Task 1) with its new two-prop signature `{ entries, dates }`.

- [ ] **Step 1: Update MonthlyView's chart render block**

In `src/components/dashboard/MonthlyView.jsx`, replace this block (currently lines 91-101):

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

with:

```jsx
      <div className="flex flex-col gap-4">
        <UnitTrendScatterChart entries={entries} dates={days} />
      </div>
```

Leave the `import { UNITS, GROUPS } from '../../constants/units.js'` line and the `GROUPS.map` inside the `tooltip &&` block (around line 65) untouched — both still use `GROUPS`.

- [ ] **Step 2: Verify the build compiles**

Run: `npm run build`

Expected: exits 0, `vite v5...  built in ...ms` success line, no errors mentioning `MonthlyView`.

- [ ] **Step 3: Manual browser verification**

Run: `npm run dev:web`

Open the printed local URL, go to the Monthly tab (a month with 28-31 days). Confirm:
- One chart appears above the table with the "Red" / "White" toggle, defaulting to "Red".
- The chart's plot area fills the full width of the card with **no horizontal scrollbar**, even with up to 31 dates on the X axis.
- Points and their value labels are visibly smaller/denser than on the Weekly tab (the `dates.length > 10` density mitigation), but each point's number is still legible without needing to zoom or scroll.
- Toggling to "White" and back, clicking a unit legend chip to dim others, and the "No data" empty state all behave the same as verified on the Weekly tab.
- Tapping a cell in the table below still opens the existing R/W detail popup (unrelated `GROUPS` usage, confirming it wasn't broken by leaving that import in place).
- No errors in the browser devtools console.

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/MonthlyView.jsx
git commit -m "feat: full-width trend chart with red/white toggle on Monthly tab"
```
