# OK/NG Scatter Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a recharts scatter chart to the Dashboard's Daily tab and to the shared photo (`ShareCard`), plotting each unit as a dot in a green "OK" band (±5°C) or a red "NG" band, and wire up the currently-unused `ExportMenu`/`ShareCard` share flow into the Dashboard.

**Architecture:** One new presentational component (`OkNgScatterChart`) computes plot points from existing `entries` data using the existing `getStatus()` classifier and renders a `recharts` `ScatterChart` with colored `ReferenceArea` bands. It's consumed by `DailyView` (live, scrollable) and by `ShareCard` (fixed-size `compact` mode, for image capture). `Dashboard.jsx` lifts date state so both the chart and the newly-wired `ExportMenu` share the same viewed date/entries.

**Tech Stack:** React 18, `recharts` (already a dependency, currently unused anywhere in the app), Tailwind CSS, `html2canvas` (existing image export).

## Global Constraints

- Reuse the app's existing status colors exactly: `#16a34a` (OK/normal), `#dc2626` (NG/oos) — no new palette.
- No new npm dependencies — `recharts` is already installed.
- Only units with a numeric status (`normal` or `oos`) are plotted; `error`/`none` (blank/`X`) units are omitted from the chart.
- Weekly and Monthly tabs are unaffected — this feature is Daily-tab and share-photo only.
- No changes to how values are entered, validated, or stored (`InputCheckSheet`, `useThermoData`, `storage.js` stay untouched except the one `ShareCard` call-site prop update in Task 2).
- This project has no automated test framework configured (no `vitest`/`jest`, no `*.test.*` files under `src`). Verification for every task is manual: run `npm run dev` and check the actual behavior in a browser, per the project's existing convention — do not add a test framework as part of this plan.

---

### Task 1: `OkNgScatterChart` component + Daily tab integration

**Files:**
- Create: `src/components/dashboard/OkNgScatterChart.jsx`
- Modify: `src/components/dashboard/Dashboard.jsx`
- Modify: `src/components/dashboard/DailyView.jsx`

**Interfaces:**
- Produces: `OkNgScatterChart({ entries, compact = false, width, height })` — a default export React component. `entries` is an array of `{ group: 'red' | 'white', values: { [unitId]: string|number } }`. In non-`compact` mode it self-sizes (ignores `width`, defaults `height` to 200) and is horizontally scrollable. In `compact` mode, `width` and `height` are required pixel numbers and it renders at a fixed size with no per-unit X labels (for image capture).
- Consumes (Task 1): `UNITS` from `src/constants/units.js`, `getStatus` from `src/lib/status.js`.

- [ ] **Step 1: Create the chart component**

Create `src/components/dashboard/OkNgScatterChart.jsx`:

```jsx
import {
  ScatterChart, Scatter, XAxis, YAxis, ReferenceArea, ReferenceLine,
  Tooltip, CartesianGrid,
} from 'recharts'
import { UNITS } from '../../constants/units.js'
import { getStatus } from '../../lib/status.js'

const OK_COLOR = '#16a34a'
const NG_COLOR = '#dc2626'

const GROUP_SHAPE = {
  red:   'circle',
  white: 'diamond',
}

const GROUP_LABEL = {
  red:   'Red team',
  white: 'White team',
}

function buildPoints(entries) {
  const points = []
  ;(entries || []).forEach(entry => {
    UNITS.forEach(unit => {
      const raw = entry.values?.[unit.id]
      const { status } = getStatus(raw)
      if (status !== 'normal' && status !== 'oos') return
      points.push({
        unit: unit.label,
        value: Number(raw),
        group: entry.group,
        status,
      })
    })
  })
  return points
}

function computeMaxAbs(points) {
  const maxAbs = points.reduce((m, p) => Math.max(m, Math.abs(p.value)), 0)
  const padded = Math.ceil((maxAbs + 2) / 5) * 5
  return Math.max(10, padded)
}

function DotShape({ cx, cy, fill, shape }) {
  if (shape === 'diamond') {
    const r = 5
    return (
      <path
        d={`M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`}
        fill={fill}
        stroke="#0f172a"
        strokeWidth={1}
      />
    )
  }
  return <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#0f172a" strokeWidth={1} />
}

function renderShape(group) {
  return (props) => (
    <DotShape
      cx={props.cx}
      cy={props.cy}
      fill={props.payload.status === 'normal' ? OK_COLOR : NG_COLOR}
      shape={GROUP_SHAPE[group]}
    />
  )
}

export default function OkNgScatterChart({ entries, compact = false, width, height }) {
  const points = buildPoints(entries)

  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-500"
        style={{ height: height ?? 160 }}
      >
        No data
      </div>
    )
  }

  const maxAbs = computeMaxAbs(points)
  const redPoints   = points.filter(p => p.group === 'red')
  const whitePoints = points.filter(p => p.group === 'white')
  const groupsPresent = [...new Set(points.map(p => p.group))]

  const chartHeight = height ?? 200
  const chartWidth  = compact ? width : Math.max(width ?? 0, UNITS.length * 40)

  const chart = (
    <ScatterChart
      width={chartWidth}
      height={chartHeight}
      margin={{ top: 10, right: 16, bottom: compact ? 4 : 24, left: 8 }}
    >
      <CartesianGrid stroke="#1e293b" />
      <XAxis
        dataKey="unit"
        type="category"
        allowDuplicatedCategory={false}
        tick={compact ? false : { fill: '#94a3b8', fontSize: 10 }}
        axisLine={{ stroke: '#334155' }}
        tickLine={false}
        interval={0}
      />
      <YAxis
        dataKey="value"
        type="number"
        domain={[-maxAbs, maxAbs]}
        tick={{ fill: '#94a3b8', fontSize: 10 }}
        axisLine={{ stroke: '#334155' }}
        tickLine={false}
        width={28}
      />
      <ReferenceArea
        y1={-5} y2={5} fill={OK_COLOR} fillOpacity={0.15}
        label={{ value: 'OK', position: 'insideTopLeft', fill: '#86efac', fontSize: 10 }}
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
      {!compact && (
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
          formatter={(value, _name, props) => [
            `${value} (${props.payload.status === 'normal' ? 'OK' : 'NG'})`,
            props.payload.unit,
          ]}
          labelFormatter={() => ''}
        />
      )}
      {redPoints.length > 0 && <Scatter data={redPoints} shape={renderShape('red')} />}
      {whitePoints.length > 0 && <Scatter data={whitePoints} shape={renderShape('white')} />}
    </ScatterChart>
  )

  return (
    <div className="flex flex-col gap-2">
      {compact ? chart : <div className="overflow-x-auto">{chart}</div>}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: OK_COLOR }} /> OK (±5°C)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: NG_COLOR }} /> NG
        </span>
        {groupsPresent.includes('red') && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-slate-300" /> {GROUP_LABEL.red} (circle)
          </span>
        )}
        {groupsPresent.includes('white') && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 inline-block bg-slate-300" style={{ transform: 'rotate(45deg)' }} /> {GROUP_LABEL.white} (diamond)
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Lift `date` state into `Dashboard.jsx` and pass it to `DailyView`**

Modify `src/components/dashboard/Dashboard.jsx` — replace the whole file with:

```jsx
import { useState } from 'react'
import AlertBanner from '../layout/AlertBanner.jsx'
import DailyView from './DailyView.jsx'
import WeeklyView from './WeeklyView.jsx'
import MonthlyView from './MonthlyView.jsx'
import { formatDate } from '../../lib/dateUtils.js'

const TABS = [
  { id: 'daily',   label: 'Daily' },
  { id: 'weekly',  label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
]

export default function Dashboard({ data }) {
  const [tab, setTab]   = useState('daily')
  const [date, setDate] = useState(formatDate())
  const entries = data?.entries ?? []

  const today = formatDate()
  const todayEntries = entries.filter(e => e.date === today)

  return (
    <div className="flex flex-col gap-3 pb-24">
      <AlertBanner entries={todayEntries} />

      <div className="flex bg-slate-800 rounded-xl mx-3 mt-1 p-1 gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium touch-target transition-colors
              ${tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mx-3 bg-slate-800 rounded-xl p-4">
        {tab === 'daily'   && <DailyView entries={entries} date={date} onDateChange={setDate} />}
        {tab === 'weekly'  && <WeeklyView entries={entries} />}
        {tab === 'monthly' && <MonthlyView entries={entries} />}
      </div>

    </div>
  )
}
```

(This removes the pre-existing unused `SummaryCards`, `summarize`, and `UNITS` imports that the original file had but never referenced — dead code found while touching this file. The `ExportMenu` wiring is intentionally deferred to Task 3.)

- [ ] **Step 3: Update `DailyView` to accept `date`/`onDateChange` as props and render the chart**

Modify `src/components/dashboard/DailyView.jsx`:

Replace:
```jsx
import { useState } from 'react'
import { formatDate, displayDate } from '../../lib/dateUtils.js'
import { UNITS, GROUPS } from '../../constants/units.js'
import { summarize, getStatus } from '../../lib/status.js'
import SummaryCards from './SummaryCards.jsx'
import StatusCell from './StatusCell.jsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DailyView({ entries }) {
  const [date, setDate] = useState(formatDate())

  function shiftDate(delta) {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    setDate(d.toISOString().slice(0, 10))
  }
```

With:
```jsx
import { formatDate, displayDate } from '../../lib/dateUtils.js'
import { UNITS, GROUPS } from '../../constants/units.js'
import { summarize, getStatus } from '../../lib/status.js'
import SummaryCards from './SummaryCards.jsx'
import StatusCell from './StatusCell.jsx'
import OkNgScatterChart from './OkNgScatterChart.jsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DailyView({ entries, date, onDateChange }) {
  function shiftDate(delta) {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + delta)
    onDateChange(d.toISOString().slice(0, 10))
  }
```

Then insert the chart between `<SummaryCards counts={counts} />` and the unit table's `<div className="overflow-x-auto">`. Replace:
```jsx
      <SummaryCards counts={counts} />

      <div className="overflow-x-auto">
```

With:
```jsx
      <SummaryCards counts={counts} />

      <OkNgScatterChart entries={dayEntries} />

      <div className="overflow-x-auto">
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev` (leave it running for the rest of this plan)

Open the printed local URL. Go to the **Input** tab, pick today's date, group "Red", and set: `TH1 = 2`, `TH2 = 8`, `TH3 = -6`, `TH4 = 0` (leave the rest blank). Tap **Save Data**.

Go to the **Dashboard** tab (Daily sub-tab, default). Expected:
- A scatter chart appears between the 4 summary cards and the unit table.
- TH1 and TH4 render as green circles inside the shaded green band.
- TH2 and TH3 render as red circles inside the shaded red bands (TH2 above +5, TH3 below -5).
- Units with no value (TH5+) do not appear as dots.
- A legend below the chart shows "OK (±5°C)" green swatch, "NG" red swatch, and "Red team (circle)".
- Hovering a dot shows a tooltip with the unit name and value.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/OkNgScatterChart.jsx src/components/dashboard/Dashboard.jsx src/components/dashboard/DailyView.jsx
git commit -m "$(cat <<'EOF'
Add OK/NG scatter chart to Dashboard Daily tab

Plots each unit as a dot in a green OK band (+-5C) or red NG band using
recharts, driven by the date already selected in the Daily tab.
EOF
)"
```

---

### Task 2: `ShareCard` multi-entry contract + compact chart

**Files:**
- Modify: `src/components/export/ShareCard.jsx`
- Modify: `src/components/input/InputCheckSheet.jsx`

**Interfaces:**
- Consumes: `OkNgScatterChart` from Task 1 (`src/components/dashboard/OkNgScatterChart.jsx`), used with `compact width={328} height={150}`.
- Produces: `ShareCard({ date, entries = [], id = 'share-card' })` — replaces the old `ShareCard({ entry, id })` signature. `entries` is the same shape as `OkNgScatterChart`'s `entries` prop (array of `{ group, values }`, 1 or 2 items). Callers must be updated to the new prop shape (this task updates the only existing caller, `InputCheckSheet`; Task 3 adds the second caller).

- [ ] **Step 1: Rewrite `ShareCard` to accept `date` + `entries`**

Replace the full contents of `src/components/export/ShareCard.jsx` with:

```jsx
import { UNITS, QUICK_CHECKER_REF, STD_TOLERANCE } from '../../constants/units.js'
import { getStatus, summarize } from '../../lib/status.js'
import { displayDate } from '../../lib/dateUtils.js'
import OkNgScatterChart from '../dashboard/OkNgScatterChart.jsx'

const BG = {
  normal: '#16a34a',
  oos:    '#dc2626',
  error:  '#ea580c',
  none:   '#475569',
}

const GROUP_BADGE = {
  red:   { label: 'RED',   bg: '#be123c' },
  white: { label: 'WHITE', bg: '#64748b' },
}

export default function ShareCard({ date, entries = [], id = 'share-card' }) {
  if (!date || entries.length === 0) return null

  const allVals = {}
  entries.forEach(e => {
    UNITS.forEach(u => { allVals[`${u.id}_${e.group}`] = e.values?.[u.id] ?? 'X' })
  })
  const counts = summarize(allVals)

  return (
    <div
      id={id}
      style={{ background: '#0f172a', fontFamily: 'sans-serif', padding: '16px', width: '360px', borderRadius: '12px' }}
    >
      <div style={{ marginBottom: '8px' }}>
        <div style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: 700 }}>
          Thermoholder Check Sheet
        </div>
        <div style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{displayDate(date)}</span>
          {entries.map(e => (
            <span
              key={e.group}
              style={{ background: GROUP_BADGE[e.group]?.bg ?? '#475569', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}
            >
              {GROUP_BADGE[e.group]?.label ?? e.group.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '8px' }}>
        {[['Normal', counts.normal, '#16a34a'],['OOS', counts.oos, '#dc2626'],['Error', counts.error, '#ea580c'],['Tdk Ada', counts.none, '#475569']].map(([l, c, color]) => (
          <div key={l} style={{ background: '#1e293b', borderRadius: '6px', padding: '4px', textAlign: 'center' }}>
            <div style={{ color, fontSize: '18px', fontWeight: 700 }}>{c}</div>
            <div style={{ color: '#94a3b8', fontSize: '10px' }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <OkNgScatterChart entries={entries} compact width={328} height={150} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', marginBottom: '8px' }}>
        {UNITS.map(u => (
          <div key={u.id} style={{ background: '#1e293b', borderRadius: '4px', padding: '3px 4px' }}>
            <div style={{ color: '#e2e8f0', fontSize: '9px', fontWeight: 600, marginBottom: '2px' }}>{u.label}</div>
            <div style={{ display: 'flex', gap: '2px' }}>
              {entries.map(e => {
                const { status, label } = getStatus(e.values?.[u.id] ?? 'X')
                return (
                  <span
                    key={e.group}
                    style={{ background: BG[status], color: '#fff', fontSize: '9px', fontFamily: 'monospace', borderRadius: '3px', padding: '1px 3px', flex: 1, textAlign: 'center' }}
                  >
                    {label}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ color: '#64748b', fontSize: '10px', textAlign: 'center' }}>
        Quick Checker: {QUICK_CHECKER_REF}°C | Standar: ±{STD_TOLERANCE}°C
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `InputCheckSheet`'s call site to the new prop shape**

Modify `src/components/input/InputCheckSheet.jsx`. Replace:
```jsx
            <ShareCard entry={{ date, group, values }} />
```

With:
```jsx
            <ShareCard date={date} entries={[{ group, values }]} />
```

- [ ] **Step 3: Verify in browser**

The dev server from Task 1 should still be running (if not, run `npm run dev`).

Go to the **Input** tab (data from Task 1's verification should still be there: Red, today, TH1=2, TH2=8, TH3=-6, TH4=0). Tap the small Share icon button (left of "Save Data"). Expected:
- A modal opens showing the `ShareCard` at 360px wide with a "RED" badge next to the date.
- The 4 summary counts show Normal=2, OOS=2, Error=0, Tdk Ada=12.
- The compact scatter chart appears between the counts and the per-unit grid, showing the same 4 dots as in Task 1 (no unit tick labels, since compact mode omits them), with the OK/NG + shape legend below it.
- The per-unit grid below still shows one chip per unit (TH1=2 green, TH2=8 red, TH3=-6 red, TH4=0 green, rest gray "X").
- Close the modal with the **Close** button; it dismisses cleanly.

- [ ] **Step 4: Commit**

```bash
git add src/components/export/ShareCard.jsx src/components/input/InputCheckSheet.jsx
git commit -m "$(cat <<'EOF'
Support multi-group entries and OK/NG chart in ShareCard

ShareCard now takes date + an array of group entries instead of a
single entry, and renders the compact OK/NG scatter chart, so the
shared photo carries the same chart as the Dashboard.
EOF
)"
```

---

### Task 3: Wire `ExportMenu` into the Dashboard Daily tab

**Files:**
- Modify: `src/components/export/ExportMenu.jsx`
- Modify: `src/components/dashboard/Dashboard.jsx`

**Interfaces:**
- Consumes: `ShareCard({ date, entries })` from Task 2.
- Produces: `ExportMenu({ date, entries })` — replaces the old, never-rendered `ExportMenu({ data })` signature.

- [ ] **Step 1: Update `ExportMenu` to take `date` + `entries` directly**

Replace the full contents of `src/components/export/ExportMenu.jsx` with:

```jsx
import { useState } from 'react'
import { Share2, X } from 'lucide-react'
import { captureAndShare } from '../../lib/exporters/imageExport.js'
import ShareCard from './ShareCard.jsx'

export default function ExportMenu({ date, entries }) {
  const [loading, setLoading] = useState(null)
  const [showShare, setShowShare] = useState(false)

  const hasData = (entries?.length ?? 0) > 0

  async function handle() {
    setLoading('image')
    try {
      setShowShare(true)
      await new Promise(r => setTimeout(r, 300))
      await captureAndShare('share-card')
      setShowShare(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Share</p>
      <div className="flex gap-2">
        <button
          onClick={handle}
          disabled={loading !== null || !hasData}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white touch-target transition-colors bg-blue-700 hover:bg-blue-600 ${loading ? 'opacity-60' : ''} ${!hasData ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <Share2 size={16} />
          {loading ? '...' : 'Share'}
        </button>
      </div>

      {showShare && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="flex flex-col items-center gap-3">
            <ShareCard date={date} entries={entries} />
            <button onClick={() => setShowShare(false)} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
              <X size={16}/> Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

`hasData` guards against opening a blank share modal when the viewed date has no entries yet (`ShareCard` now returns `null` for an empty `entries` array).

- [ ] **Step 2: Render `ExportMenu` under the Daily tab in `Dashboard.jsx`**

Modify `src/components/dashboard/Dashboard.jsx`. Replace:
```jsx
import { useState } from 'react'
import AlertBanner from '../layout/AlertBanner.jsx'
import DailyView from './DailyView.jsx'
import WeeklyView from './WeeklyView.jsx'
import MonthlyView from './MonthlyView.jsx'
import { formatDate } from '../../lib/dateUtils.js'
```

With:
```jsx
import { useState } from 'react'
import AlertBanner from '../layout/AlertBanner.jsx'
import DailyView from './DailyView.jsx'
import WeeklyView from './WeeklyView.jsx'
import MonthlyView from './MonthlyView.jsx'
import ExportMenu from '../export/ExportMenu.jsx'
import { formatDate } from '../../lib/dateUtils.js'
```

Replace:
```jsx
  const today = formatDate()
  const todayEntries = entries.filter(e => e.date === today)

  return (
```

With:
```jsx
  const today = formatDate()
  const todayEntries = entries.filter(e => e.date === today)
  const dayEntries   = entries.filter(e => e.date === date)

  return (
```

Replace:
```jsx
      <div className="mx-3 bg-slate-800 rounded-xl p-4">
        {tab === 'daily'   && <DailyView entries={entries} date={date} onDateChange={setDate} />}
        {tab === 'weekly'  && <WeeklyView entries={entries} />}
        {tab === 'monthly' && <MonthlyView entries={entries} />}
      </div>

    </div>
  )
}
```

With:
```jsx
      <div className="mx-3 bg-slate-800 rounded-xl p-4">
        {tab === 'daily'   && <DailyView entries={entries} date={date} onDateChange={setDate} />}
        {tab === 'weekly'  && <WeeklyView entries={entries} />}
        {tab === 'monthly' && <MonthlyView entries={entries} />}
      </div>

      {tab === 'daily' && (
        <div className="mx-3 bg-slate-800 rounded-xl p-4">
          <ExportMenu date={date} entries={dayEntries} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

The dev server should still be running.

Go to the **Input** tab, switch group to "White", keep today's date, set `TH1 = -1`, `TH2 = 9` (leave rest blank), tap **Save Data**. This gives the day both a Red and a White entry.

Go to the **Dashboard** tab (Daily sub-tab). Expected:
- Below the unit table, a new "Share" section with a blue **Share** button appears (previously nothing was there — `ExportMenu` was never rendered before this task).
- The scatter chart above the table now shows both shapes: circles (Red: TH1, TH2, TH3, TH4) and diamonds (White: TH1, TH2), with TH2/White landing in the red NG band and TH1/White in the green OK band.
- Tap **Share**. A modal opens with the `ShareCard`, now showing **both** "RED" and "WHITE" badges next to the date, summary counts reflecting all 6 numeric entries across both groups, the compact chart showing both circles and diamonds, and the per-unit grid showing two chips per unit for TH1–TH4 (R and W side by side).
- Close the modal.
- Go back to the **Input** tab and confirm its own Share button (from Task 2) still works unchanged and still shows only the single group being edited (one shape only, no badge for the other group).

- [ ] **Step 4: Commit**

```bash
git add src/components/export/ExportMenu.jsx src/components/dashboard/Dashboard.jsx
git commit -m "$(cat <<'EOF'
Wire ExportMenu into Dashboard Daily tab

ExportMenu was defined but never rendered anywhere. It now lives under
the Daily tab, sharing the same date state as the chart and table, so
users can share a photo of the currently-viewed day's OK/NG chart.
EOF
)"
```
