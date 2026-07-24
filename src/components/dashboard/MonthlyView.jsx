import { useState } from 'react'
import { getDaysInMonth } from '../../lib/dateUtils.js'
import { UNITS, GROUPS } from '../../constants/units.js'
import { getStatus } from '../../lib/status.js'
import { exportMonthlyPDF } from '../../lib/exporters/pdfExport.js'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import UnitTrendScatterChart from './UnitTrendScatterChart.jsx'

const BG = {
  normal: 'bg-green-600',
  oos:    'bg-red-600',
  error:  'bg-orange-500',
  none:   'bg-slate-700',
}

export default function MonthlyView({ entries }) {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [tooltip, setTooltip] = useState(null)

  const monthKey = `${year}-${String(month).padStart(2, '0')}`
  const days = getDaysInMonth(monthKey)

  function shiftMonth(delta) {
    let m = month + delta, y = year
    if (m < 1)  { m = 12; y-- }
    if (m > 12) { m = 1;  y++ }
    setMonth(m); setYear(y)
  }

  function groupStatus(unitId, date, group) {
    const entry = entries.find(e => e.date === date && e.group === group)
    if (!entry) return 'none'
    return getStatus(entry.values?.[unitId] ?? 'X').status
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button onClick={() => shiftMonth(-1)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 touch-target">
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium text-slate-200">{monthKey}</span>
        <button onClick={() => shiftMonth(1)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 touch-target">
          <ChevronRight size={20} />
        </button>
      </div>

      <button
        onClick={() => exportMonthlyPDF(entries, days, monthKey)}
        title="Export to PDF"
        className="fixed bottom-20 right-4 w-13 h-13 p-3 rounded-full bg-green-600 hover:bg-green-500 active:bg-green-700 shadow-lg z-10 touch-target flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>

      {tooltip && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-3 text-xs">
          <p className="font-semibold text-slate-200">{tooltip.unit} · {tooltip.date}</p>
          {GROUPS.map(g => {
            const entry = entries.find(e => e.date === tooltip.date && e.group === g.id)
            const val = entry?.values?.[tooltip.unitId] ?? 'X'
            const st = getStatus(val).status
            return (
              <p key={g.id} className="text-slate-400 mt-0.5">
                {g.label}: <span className={`font-mono font-bold ${st === 'normal' ? 'text-green-400' : st === 'oos' ? 'text-red-400' : st === 'error' ? 'text-orange-400' : 'text-slate-500'}`}>{val || 'X'}</span>
              </p>
            )
          })}
          <button onClick={() => setTooltip(null)} className="mt-2 text-slate-500 hover:text-slate-300 text-[11px]">Close</button>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
        <div className="flex gap-[3px] items-center">
          <span className="w-4 h-3 rounded-sm bg-rose-700 flex items-center justify-center text-[8px] text-white font-bold">R</span>
          <span className="w-4 h-3 rounded-sm bg-slate-500 flex items-center justify-center text-[8px] text-white font-bold">W</span>
        </div>
        <span className="text-slate-600">|</span>
        {[['bg-green-600','Normal'],['bg-red-600','OOS'],['bg-orange-500','Error'],['bg-slate-700','Not Available']].map(([bg,l]) => (
          <span key={l} className="flex items-center gap-1"><span className={`${bg} w-2.5 h-2.5 rounded-sm inline-block`}/>{l}</span>
        ))}
      </div>

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

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-[10px] text-slate-400 font-medium pr-1 w-14 sticky left-0 bg-slate-800">Unit</th>
              {days.map(d => (
                <th key={d} className="text-center text-[10px] text-slate-500 font-medium px-px min-w-[28px]">
                  {d.slice(8)}<br/>
                  <span className="flex gap-[2px] justify-center mt-0.5">
                    <span className="w-3 h-2.5 rounded-sm bg-rose-700 flex items-center justify-center text-[7px] text-white font-bold leading-none">R</span>
                    <span className="w-3 h-2.5 rounded-sm bg-slate-500 flex items-center justify-center text-[7px] text-white font-bold leading-none">W</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {UNITS.map(unit => (
              <tr key={unit.id}>
                <td className="text-[10px] text-slate-300 pr-1 py-px sticky left-0 bg-slate-800">{unit.label}</td>
                {days.map(d => (
                  <td key={d} className="py-px px-px">
                    <div
                      className="flex gap-[1px] cursor-pointer hover:opacity-80"
                      onClick={() => setTooltip({ unit: unit.label, unitId: unit.id, date: d })}
                    >
                      <div className={`${BG[groupStatus(unit.id, d, 'red')]} flex-1 h-4 rounded-l-sm`} title={`${unit.label} · ${d} · Red`} />
                      <div className={`${BG[groupStatus(unit.id, d, 'white')]} flex-1 h-4 rounded-r-sm`} title={`${unit.label} · ${d} · White`} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
