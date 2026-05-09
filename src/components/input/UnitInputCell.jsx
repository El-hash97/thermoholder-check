import { getStatus } from '../../lib/status.js'

const BG = {
  normal: 'border-green-500 bg-green-900/30 text-green-300',
  oos:    'border-red-500 bg-red-900/30 text-red-300',
  error:  'border-orange-500 bg-orange-900/30 text-orange-300',
  none:   'border-slate-600 bg-slate-800 text-slate-400',
}

function parseNumeric(val) {
  const v = String(val ?? '').trim()
  if (v.toLowerCase() === 'ok') return 0
  const n = parseInt(v, 10)
  return isNaN(n) ? null : n
}

function formatNum(n) {
  if (n === 0) return '0'
  return n > 0 ? `+${n}` : `${n}`
}

export default function UnitInputCell({ unit, value, onChange }) {
  const { status } = getStatus(value)
  const colorClass = BG[status]

  function step(delta) {
    const current = parseNumeric(value)
    const next = current === null ? delta : current + delta
    onChange(unit.id, formatNum(next))
  }

  return (
    <div className="flex items-center gap-2 py-1">
      <label className="w-20 text-sm text-slate-300 shrink-0">{unit.label}</label>
      <span className="text-[10px] text-slate-500 w-10 shrink-0">{unit.type}</span>

      <button
        type="button"
        onPointerDown={e => { e.preventDefault(); step(-1) }}
        className="w-9 h-11 rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-200 text-xl font-bold shrink-0 flex items-center justify-center select-none"
      >−</button>

      <input
        type="text"
        inputMode="text"
        value={value}
        onChange={e => onChange(unit.id, e.target.value)}
        placeholder="OK / X"
        className={`flex-1 min-w-0 rounded-lg border px-2 py-3 text-base font-mono text-center
          focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${colorClass}`}
      />

      <button
        type="button"
        onPointerDown={e => { e.preventDefault(); step(+1) }}
        className="w-9 h-11 rounded-lg bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-200 text-xl font-bold shrink-0 flex items-center justify-center select-none"
      >+</button>
    </div>
  )
}
