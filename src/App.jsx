import { useState } from 'react'
import { getMonthKey } from './lib/dateUtils.js'
import { useThermoData } from './hooks/useThermoData.js'
import Header from './components/layout/Header.jsx'
import BottomNav from './components/layout/BottomNav.jsx'
import Dashboard from './components/dashboard/Dashboard.jsx'
import InputCheckSheet from './components/input/InputCheckSheet.jsx'
import Settings from './components/settings/Settings.jsx'
import { getStatus, STATUS } from './lib/status.js'

export default function App() {
  const [page,  setPage]  = useState('dashboard')
  const [group, setGroup] = useState('red')

  const monthKey = getMonthKey()
  const { data, loading, submitEntry, reset, getTodayEntries } = useThermoData(monthKey)

  const todayEntries = getTodayEntries()
  const alertCount = (() => {
    let count = 0
    todayEntries.forEach(e => {
      Object.values(e.values || {}).forEach(v => {
        const { status } = getStatus(v)
        if (status === STATUS.OOS || status === STATUS.ERROR) count++
      })
    })
    return count
  })()

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-100">
      <Header group={group} />
      <main className="pt-2 min-h-[calc(100vh-120px)]">
        {loading && (
          <div className="text-center text-slate-400 py-10">Loading...</div>
        )}
        {!loading && page === 'dashboard' && <Dashboard data={data} />}
        {!loading && page === 'input' && (
          <div className="px-3">
            <InputCheckSheet
              data={data}
              onSubmit={(date, g, values) => {
                submitEntry(date, g, values)
                setGroup(g)
              }}
            />
          </div>
        )}
        {!loading && page === 'settings' && (
          <Settings monthKey={monthKey} onReset={reset} />
        )}
      </main>
      <BottomNav active={page} onChange={setPage} alertCount={alertCount} />
    </div>
  )
}
