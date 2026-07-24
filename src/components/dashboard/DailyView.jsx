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
    onDateChange(formatDate(d))
  }

  const dayEntries = entries.filter(e => e.date === date)

  function getVal(unitId, group) {
    const e = dayEntries.find(en => en.group === group)
    return e?.values?.[unitId] ?? 'X'
  }

  const submittedGroups = GROUPS.filter(g => dayEntries.some(e => e.group === g.id))
  const activeGroups = submittedGroups.length > 0 ? submittedGroups : []
  const allVals = {}
  UNITS.forEach(u => activeGroups.forEach(g => { allVals[`${u.id}_${g.id}`] = getVal(u.id, g.id) }))
  const counts = summarize(allVals)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={() => shiftDate(-1)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 touch-target">
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium text-slate-700">{displayDate(date)}</span>
        <button onClick={() => shiftDate(1)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 touch-target" disabled={date >= formatDate()}>
          <ChevronRight size={20} />
        </button>
      </div>

      <SummaryCards counts={counts} />

      <OkNgScatterChart entries={dayEntries} />

      <div className="overflow-x-auto">
        <table className="w-full text-xs table-fixed">
          <colgroup>
            <col className="w-20" />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr className="text-slate-500">
              <th className="text-left py-1 pr-2 font-medium">Unit</th>
              <th className="text-center py-1 px-1">
                <span className="inline-flex items-center justify-center w-full h-5 rounded bg-rose-700 text-white text-[11px] font-bold">Red</span>
              </th>
              <th className="text-center py-1 px-1">
                <span className="inline-flex items-center justify-center w-full h-5 rounded bg-slate-500 text-white text-[11px] font-bold">White</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {UNITS.map(unit => (
              <tr key={unit.id} className="border-t border-slate-200">
                <td className="py-1 pr-2 text-slate-700 font-medium">{unit.label}</td>
                {GROUPS.map(g => (
                  <td key={g.id} className="py-1 px-1">
                    <StatusCell value={getVal(unit.id, g.id)} />
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
