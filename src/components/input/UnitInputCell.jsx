import { getStatus, deviation } from '../../lib/status.js'

const BG = {
  normal: 'border-green-400 bg-green-50 text-green-700',
  oos:    'border-red-400 bg-red-50 text-red-700',
  error:  'border-orange-400 bg-orange-50 text-orange-700',
  none:   'border-slate-300 bg-slate-50 text-slate-500',
}

// The number the −/+ buttons step from: OK is 0, "low"/"high" their stand-in value.
function parseNumeric(val, key) {
  const n = deviation(val, key)
  return Number.isInteger(n) ? n : null
}

function formatNum(n) {
  if (n === 0) return '0'
  return n > 0 ? `+${n}` : `${n}`
}

export default function UnitInputCell({ unit, value, valueKey = '', onChange }) {
  const { status } = getStatus(value)
  const colorClass = BG[status]

  function step(delta) {
    const current = parseNumeric(value, valueKey)
    const next = current === null ? delta : current + delta
    onChange(unit.id, formatNum(next))
  }

  return (
    <div className="flex items-center gap-2 py-1">
      <label className="w-20 text-sm text-slate-700 shrink-0">{unit.label}</label>
      <span className="text-[10px] text-slate-400 w-10 shrink-0">{unit.type}</span>

      <button
        type="button"
        onPointerDown={e => { e.preventDefault(); step(-1) }}
        className="w-9 h-11 rounded-lg bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 text-xl font-bold shrink-0 flex items-center justify-center select-none"
      >−</button>

      <input
        type="text"
        inputMode="text"
        value={value}
        onChange={e => onChange(unit.id, e.target.value)}
        placeholder="OK / X / low / high"
        className={`flex-1 min-w-0 rounded-lg border px-2 py-3 text-base font-mono text-center
          focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${colorClass}`}
      />

      <button
        type="button"
        onPointerDown={e => { e.preventDefault(); step(+1) }}
        className="w-9 h-11 rounded-lg bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 text-xl font-bold shrink-0 flex items-center justify-center select-none"
      >+</button>
    </div>
  )
}
