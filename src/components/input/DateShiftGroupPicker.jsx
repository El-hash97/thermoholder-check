import { GROUPS } from '../../constants/units.js'
import { formatDate } from '../../lib/dateUtils.js'

export default function DateGroupPicker({ date, group, onChange }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400 uppercase tracking-wider">Date</label>
        <input
          type="date"
          value={date}
          max={formatDate()}
          onChange={e => onChange('date', e.target.value)}
          className="bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-base touch-target"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-400 uppercase tracking-wider">Team</label>
        <div className="flex gap-3">
          {GROUPS.map(g => (
            <button
              key={g.id}
              onClick={() => onChange('group', g.id)}
              className={`flex-1 py-3 rounded-xl text-base font-semibold touch-target transition-colors
                ${group === g.id
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
