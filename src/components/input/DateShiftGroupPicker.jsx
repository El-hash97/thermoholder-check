import { GROUPS } from '../../constants/units.js'
import { formatDate } from '../../lib/dateUtils.js'

export default function DateGroupPicker({ date, group, onChange }) {
  return (
    <div className="bg-white rounded-xl p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 uppercase tracking-wider">Date</label>
        <input
          type="date"
          value={date}
          max={formatDate()}
          onChange={e => onChange('date', e.target.value)}
          className="bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-base touch-target"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 uppercase tracking-wider">Team</label>
        <div className="flex gap-3">
          {GROUPS.map(g => (
            <button
              key={g.id}
              onClick={() => onChange('group', g.id)}
              className={`flex-1 py-3 rounded-xl text-base font-semibold touch-target transition-colors
                ${group === g.id
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
