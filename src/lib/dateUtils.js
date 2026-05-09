export function getMonthKey(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function formatDate(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().slice(0, 10)
}

export function getCurrentShift() {
  const hour = new Date().getHours()
  if (hour >= 7 && hour < 15) return 'day'
  if (hour >= 15 && hour < 23) return 'night'
  return 'day'
}

export function getWeekDates(referenceDate = new Date()) {
  const d = typeof referenceDate === 'string' ? new Date(referenceDate) : new Date(referenceDate)
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return formatDate(date)
  })
}

export function getDaysInMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number)
  const count = new Date(year, month, 0).getDate()
  return Array.from({ length: count }, (_, i) =>
    `${yearMonth}-${String(i + 1).padStart(2, '0')}`,
  )
}

export function displayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

