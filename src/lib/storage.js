const PREFIX = 'thermo_data_'

export function getMonthData(monthKey) {
  try {
    const raw = localStorage.getItem(PREFIX + monthKey)
    if (!raw) return { month: monthKey, quickchecker_ref: 1500, std_tolerance: 5, entries: [] }
    return JSON.parse(raw)
  } catch {
    return { month: monthKey, quickchecker_ref: 1500, std_tolerance: 5, entries: [] }
  }
}

export function saveEntry(monthKey, entry) {
  const data = getMonthData(monthKey)
  const idx = data.entries.findIndex(e => e.id === entry.id)
  if (idx >= 0) {
    data.entries[idx] = entry
  } else {
    data.entries.push(entry)
  }
  localStorage.setItem(PREFIX + monthKey, JSON.stringify(data))
}

export function resetMonth(monthKey) {
  localStorage.removeItem(PREFIX + monthKey)
}

export function getStoredMonths() {
  return Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .map(k => k.replace(PREFIX, ''))
    .sort()
}

export function buildEntryId(date, group) {
  return `${date}_${group}`
}
