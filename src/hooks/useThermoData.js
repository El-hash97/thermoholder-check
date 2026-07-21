import { useState, useCallback, useEffect } from 'react'
import { getMonthData, saveEntry, resetMonth, buildEntryId } from '../lib/storage.js'
import { formatDate } from '../lib/dateUtils.js'

function emptyMonth(monthKey) {
  return { month: monthKey, quickchecker_ref: 1500, std_tolerance: 5, entries: [] }
}

export function useThermoData(monthKey) {
  const [data, setData] = useState(() => emptyMonth(monthKey))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const fresh = await getMonthData(monthKey)
      setData(fresh)
      setError(null)
    } catch (err) {
      setError(err)
    }
  }, [monthKey])

  useEffect(() => {
    setLoading(true)
    getMonthData(monthKey)
      .then(fresh => setData(fresh))
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [monthKey])

  const submitEntry = useCallback(async (date, group, values) => {
    const id = buildEntryId(date, group)
    const entry = { id, date, group, timestamp: new Date().toISOString(), values }
    const saved = await saveEntry(monthKey, entry)
    await refresh()
    return saved
  }, [monthKey, refresh])

  const reset = useCallback(async () => {
    await resetMonth(monthKey)
    await refresh()
  }, [monthKey, refresh])

  const getTodayEntries = useCallback(() => {
    const today = formatDate()
    return data.entries.filter(e => e.date === today)
  }, [data])

  return { data, loading, error, submitEntry, reset, getTodayEntries }
}
