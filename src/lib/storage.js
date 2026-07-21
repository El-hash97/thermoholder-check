export async function getMonthData(monthKey) {
  const res = await fetch(`/api/month?month=${encodeURIComponent(monthKey)}`)
  if (!res.ok) throw new Error('Failed to load month data')
  return res.json()
}

export async function saveEntry(monthKey, entry) {
  const res = await fetch('/api/entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month: monthKey, entry }),
  })
  if (!res.ok) throw new Error('Failed to save entry')
  return res.json()
}

export async function resetMonth(monthKey) {
  const res = await fetch('/api/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month: monthKey }),
  })
  if (!res.ok) throw new Error('Failed to reset month')
}

export async function getStoredMonths() {
  const res = await fetch('/api/months')
  if (!res.ok) throw new Error('Failed to load months')
  return res.json()
}

export function buildEntryId(date, group) {
  return `${date}_${group}`
}
