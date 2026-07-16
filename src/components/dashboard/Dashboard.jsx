import { useState } from 'react'
import AlertBanner from '../layout/AlertBanner.jsx'
import DailyView from './DailyView.jsx'
import WeeklyView from './WeeklyView.jsx'
import MonthlyView from './MonthlyView.jsx'
import ExportMenu from '../export/ExportMenu.jsx'
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
  const dayEntries   = entries.filter(e => e.date === date)

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

      {tab === 'daily' && (
        <div className="mx-3 bg-slate-800 rounded-xl p-4">
          <ExportMenu date={date} entries={dayEntries} />
        </div>
      )}
    </div>
  )
}
