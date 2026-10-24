import { useMemo, useState } from 'react'
import './iso/iso.css'
import './overview.css'
import { GROUPS } from '../../constants/units.js'
import { displayValue } from '../../lib/displayValue.js'
import { parseValue } from '../../lib/chartData.js'
import { displayDate } from '../../lib/dateUtils.js'
import { WIDTH, HEIGHT, LAYERS, BACK_HOLDERS, FRONT_HOLDERS } from './cartGeometry.js'
import { ManualFace, DigitalFace } from './HolderFace.jsx'
import HolderDetail, { Trend, STATUS_TEXT, STATUS_CLASS } from './HolderDetail.jsx'

const ALL = [...BACK_HOLDERS, ...FRONT_HOLDERS]

const html = (markup) => ({ __html: markup })
const timeOf = (iso) => (iso ? new Date(iso).toTimeString().slice(0, 5) : '--:--')

function Holder({ holder, reading, time, lifted, selected, onHover, onSelect }) {
  const Face = holder.digital ? DigitalFace : ManualFace
  return (
    <g
      className="th-holder"
      style={{ transform: lifted ? holder.lift : 'none' }}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${holder.label}: ${reading.text}, ${STATUS_TEXT[reading.status]}`}
      onPointerEnter={() => onHover(holder.id)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(holder.id)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect(holder.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(holder.id)
        }
      }}
    >
      <g dangerouslySetInnerHTML={html(selected ? holder.bodyLit : holder.body)} />
      <g className="th-face" transform={holder.face}>
        <Face unit={holder} reading={reading} time={time} />
      </g>
    </g>
  )
}

export default function OverviewView({ data }) {
  const entries = data?.entries ?? []
  const ref = data?.quickchecker_ref ?? 1500
  const latest = useMemo(
    () => [...entries].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))[0],
    [entries],
  )
  const dates = useMemo(() => [...new Set(entries.map(e => e.date))].sort().reverse(), [entries])

  const [pick, setPick] = useState(null)
  const date = pick?.date ?? latest?.date ?? ''
  const group = pick?.group ?? latest?.group ?? 'red'
  const [hover, setHover] = useState(null)
  const [selected, setSelected] = useState('TH_Master')
  const [open, setOpen] = useState(false)

  const entry = entries.find(e => e.date === date && e.group === group)
  const readings = Object.fromEntries(ALL.map(h => [h.id, displayValue(entry?.values?.[h.id], ref)]))
  const time = timeOf(entry?.timestamp)

  const counts = { normal: 0, oos: 0, error: 0, none: 0 }
  ALL.forEach(h => counts[readings[h.id].status]++)

  const focus = ALL.find(h => h.id === (open ? selected : hover ?? selected))
  const focusReading = readings[focus.id]
  const raw = entry?.values?.[focus.id] ?? ''

  const trend = entries
    .filter(e => e.group === group && e.date <= (date || '9999'))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map(e => ({ date: e.date, raw: e.values?.[focus.id] }))
    .filter(p => ['normal', 'oos'].includes(displayValue(p.raw, ref).status))
    .slice(-7)
    .map(p => ({ date: p.date, value: parseValue(p.raw) }))

  const holderProps = (h) => ({
    holder: h,
    reading: readings[h.id],
    time,
    lifted: h.id === hover || h.id === selected,
    selected: h.id === selected,
    onHover: setHover,
    onSelect: (id) => {
      setSelected(id)
      setOpen(true)
    },
  })

  return (
    <div className="flex flex-col gap-3 pb-24 px-3 lg:px-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl p-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="text-xs uppercase tracking-wider text-slate-500">Date</span>
          <select
            value={date}
            onChange={e => setPick({ date: e.target.value, group })}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white touch-target"
            disabled={!dates.length}
          >
            {!dates.length && <option value="">No entries this month</option>}
            {dates.map(d => <option key={d} value={d}>{displayDate(d)}</option>)}
          </select>
        </label>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {GROUPS.map(g => (
            <button
              key={g.id}
              onClick={() => setPick({ date, group: g.id })}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold touch-target transition-colors
                ${group === g.id ? (g.id === 'red' ? 'bg-rose-600 text-white' : 'bg-slate-600 text-white') : 'text-slate-500 hover:text-slate-700'}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        {dates.length > 0 && !entry && (
          <span className="text-xs font-medium text-amber-600">No {group} entry on this date</span>
        )}
        <span className="text-xs text-slate-500 ml-auto">
          Quick checker <b className="text-slate-800 tabular-nums">{ref}</b> °C
        </span>
      </div>

      <figure className="iso th-fig m-0" data-theme="dark">
        <div className="iso-plate rounded-xl overflow-hidden">
          <div className="iso-plate-corners" aria-hidden="true">
            <span className="iso-plate-corner" data-corner="fig">Fig 1</span>
            <span className="iso-plate-corner" data-corner="title">QC cart · 16 thermoholders</span>
            <span className="iso-plate-corner" data-corner="hint">Tap a holder for detail</span>
            <span className="iso-plate-corner" data-corner="readout">
              {focus.label} · {focusReading.text}{/^\d+$/.test(focusReading.text) ? ' °C' : ''}
            </span>
          </div>
          <div className="overflow-x-auto -mx-3 px-3">
            <svg
              className="iso-svg min-w-[560px]"
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              role="group"
              aria-label={`QC cart with 16 thermoholders reading the quick checker at ${ref} °C${entry ? ` for ${displayDate(date)}, ${group} group` : ', no entry selected'}.`}
            >
              <g dangerouslySetInnerHTML={html(LAYERS.base)} />
              {BACK_HOLDERS.map(h => <Holder key={h.id} {...holderProps(h)} />)}
              <g dangerouslySetInnerHTML={html(LAYERS.middle)} />
              {FRONT_HOLDERS.map(h => <Holder key={h.id} {...holderProps(h)} />)}
              <g dangerouslySetInnerHTML={html(LAYERS.top)} />
            </svg>
          </div>
        </div>
      </figure>

      <div className="grid grid-cols-4 gap-2">
        {Object.keys(counts).map(s => (
          <div key={s} className={`border rounded-xl p-2 flex flex-col items-center ${STATUS_CLASS[s]}`}>
            <span className="text-xl font-bold">{counts[s]}</span>
            <span className="text-[11px] text-center leading-tight">{STATUS_TEXT[s]}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 grid gap-4 sm:grid-cols-[1fr_240px]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{focus.label}</h2>
            <span className="text-xs text-slate-500">{focus.type}</span>
            <span className={`ml-auto text-xs font-semibold border rounded-full px-2 py-0.5 ${STATUS_CLASS[focusReading.status]}`}>
              {STATUS_TEXT[focusReading.status]}
            </span>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div><dt className="text-xs text-slate-500">Input</dt><dd className="font-semibold tabular-nums">{raw || '—'}</dd></div>
            <div><dt className="text-xs text-slate-500">Display</dt><dd className="font-semibold tabular-nums">{focusReading.text}</dd></div>
            <div><dt className="text-xs text-slate-500">Checked</dt><dd className="font-semibold tabular-nums">{entry ? time : '—'}</dd></div>
          </dl>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Last {trend.length} checks · {group} group</p>
          <Trend points={trend} />
        </div>
      </div>

      {open && (
        <HolderDetail
          holder={focus}
          reading={focusReading}
          raw={raw}
          entry={entry}
          date={date}
          group={group}
          checker={ref}
          time={time}
          trend={trend}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
