import { useState } from 'react'
import { getWeekDates, formatDate } from '../../lib/dateUtils.js'
import { UNITS } from '../../constants/units.js'
import { getStatus } from '../../lib/status.js'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function downloadWeekCSV(entries, weekDates) {
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const rows = [['Date','Day','Unit','Red Value','Red Status','White Value','White Status']]
  weekDates.forEach((d, i) => {
    UNITS.forEach(unit => {
      const redE   = entries.find(e => e.date === d && e.group === 'red')
      const whiteE = entries.find(e => e.date === d && e.group === 'white')
      const rv = redE?.values?.[unit.id]   ?? ''
      const wv = whiteE?.values?.[unit.id] ?? ''
      rows.push([d, labels[i], unit.label, rv, rv ? getStatus(rv).status : 'none', wv, wv ? getStatus(wv).status : 'none'])
    })
  })
  const csv  = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `weekly_${weekDates[0]}_${weekDates[6]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const BG = {
  normal: 'bg-green-600',
  oos:    'bg-red-600',
  error:  'bg-orange-500',
  none:   'bg-slate-700',
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function groupStatus(entries, unitId, date, group) {
  const matched = entries.filter(e => e.date === date && e.group === group)
  if (matched.length === 0) return 'none'
  const vals = matched.map(e => e.values?.[unitId] ?? 'X')
  if (vals.some(v => getStatus(v).status === 'oos'))    return 'oos'
  if (vals.some(v => getStatus(v).status === 'error'))  return 'error'
  if (vals.some(v => getStatus(v).status === 'normal')) return 'normal'
  return 'none'
}

export default function WeeklyView({ entries }) {
  const [refDate, setRefDate] = useState(formatDate())
  const weekDates = getWeekDates(refDate)

  function shiftWeek(delta) {
    const d = new Date(refDate + 'T00:00:00')
    d.setDate(d.getDate() + delta * 7)
    setRefDate(d.toISOString().slice(0, 10))
  }

  const startLabel = weekDates[0]?.slice(8)
  const endLabel   = weekDates[6]?.slice(8)
  const month      = weekDates[0]?.slice(0, 7)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button onClick={() => shiftWeek(-1)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 touch-target">
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium text-slate-200">
          {month} · {startLabel}–{endLabel}
        </span>
        <button onClick={() => shiftWeek(1)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 touch-target">
          <ChevronRight size={20} />
        </button>
      </div>

      <button
        onClick={() => downloadWeekCSV(entries, weekDates)}
        title="Export to CSV"
        className="fixed bottom-20 right-4 w-13 h-13 p-3 rounded-full bg-green-600 hover:bg-green-500 active:bg-green-700 shadow-lg z-10 touch-target flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>

      {/* Status legend */}
      <div className="flex gap-3 text-[11px] text-slate-400 flex-wrap">
        {[['bg-green-600','Normal'],['bg-red-600','OOS'],['bg-orange-500','Error'],['bg-slate-700','Not Available']].map(([bg, l]) => (
          <span key={l} className="flex items-center gap-1">
            <span className={`${bg} w-2.5 h-2.5 rounded-sm inline-block`}/>{l}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[11px] text-slate-400 font-medium pr-2 w-14">Unit</th>
              {weekDates.map((d, i) => (
                <th key={d} className="text-center text-[11px] text-slate-400 font-medium px-0.5 min-w-[36px]">
                  {DAY_LABELS[i]}<br/>
                  <span className="text-[10px]">{d.slice(8)}</span><br/>
                  <span className="flex gap-[2px] justify-center mt-0.5">
                    <span className="w-4 h-3 rounded-sm bg-rose-700 flex items-center justify-center text-[8px] text-white font-bold leading-none">R</span>
                    <span className="w-4 h-3 rounded-sm bg-slate-500 flex items-center justify-center text-[8px] text-white font-bold leading-none">W</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {UNITS.map(unit => (
              <tr key={unit.id}>
                <td className="text-[10px] text-slate-300 pr-2 py-0.5 leading-tight">{unit.label}</td>
                {weekDates.map(d => {
                  const redStatus   = groupStatus(entries, unit.id, d, 'red')
                  const whiteStatus = groupStatus(entries, unit.id, d, 'white')
                  return (
                    <td key={d} className="py-0.5 px-0.5">
                      <div className="flex gap-[2px]">
                        <div
                          className={`${BG[redStatus]} flex-1 h-4 rounded-l-sm`}
                          title={`${unit.label} · ${d} · Red · ${redStatus}`}
                        />
                        <div
                          className={`${BG[whiteStatus]} flex-1 h-4 rounded-r-sm`}
                          title={`${unit.label} · ${d} · White · ${whiteStatus}`}
                        />
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
