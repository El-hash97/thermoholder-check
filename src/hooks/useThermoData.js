import { useState, useCallback } from 'react'
import { getMonthData, saveEntry, resetMonth, buildEntryId } from '../lib/storage.js'
import { formatDate } from '../lib/dateUtils.js'

export function useThermoData(monthKey) {
  const [data, setData] = useState(() => getMonthData(monthKey))

  const submitEntry = useCallback((date, group, values) => {
    const id = buildEntryId(date, group)
    const entry = { id, date, group, timestamp: new Date().toISOString(), values }
    saveEntry(monthKey, entry)
    setData(getMonthData(monthKey))
    return entry
  }, [monthKey])

  const reset = useCallback(() => {
    resetMonth(monthKey)
    setData(getMonthData(monthKey))
  }, [monthKey])

  const getTodayEntries = useCallback(() => {
    const today = formatDate()
    return data.entries.filter(e => e.date === today)
  }, [data])

  return { data, submitEntry, reset, getTodayEntries }
}
