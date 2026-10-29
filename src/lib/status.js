export const STATUS = {
  NORMAL: 'normal',
  OOS:    'oos',
  ERROR:  'error',
  NONE:   'none',
}

export function getStatus(value) {
  if (value === '' || value === null || value === undefined) {
    return { status: STATUS.NONE, label: 'X', color: 'status-none' }
  }
  const v = String(value).trim()
  if (v === 'X' || v === '') {
    return { status: STATUS.NONE, label: 'X', color: 'status-none' }
  }
  if (v.toLowerCase() === 'ok') {
    return { status: STATUS.NORMAL, label: 'OK', color: 'status-normal' }
  }
  if (v.toLowerCase() === 'error') {
    return { status: STATUS.ERROR, label: 'Error', color: 'status-error' }
  }
  const side = lowHigh(v)
  if (side) {
    return { status: STATUS.OOS, label: side.toUpperCase(), color: 'status-oos' }
  }
  const num = Number(v)
  if (!isNaN(num) && /^[+-]?\d+$/.test(v)) {
    if (num >= -5 && num <= 5) {
      return { status: STATUS.NORMAL, label: v, color: 'status-normal' }
    }
    return { status: STATUS.OOS, label: v, color: 'status-oos' }
  }
  return { status: STATUS.NONE, label: v, color: 'status-none' }
}

// "low" / "high" (any case): the holder read below or above the checker's range.
export function lowHigh(value) {
  const m = String(value ?? '').trim().match(/^(low|high)$/i)
  return m ? m[1].toLowerCase() : null
}

// Identifies one reading: the same key always gives the same low/high stand-in value.
export const valueKey = (date, group, unitId) => `${date}|${group}|${unitId}`

// Deviation as a number: "OK" is 0; "low"/"high" stand in as -6..-12 / +6..+12,
// picked from a hash of `key` so a reading keeps its value on every render.
export function deviation(raw, key = '') {
  const v = String(raw ?? '').trim()
  if (v.toLowerCase() === 'ok') return 0
  const side = lowHigh(v)
  if (!side) return Number(v)
  let h = 2166136261 // FNV-1a
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0
  return (side === 'low' ? -1 : 1) * (6 + (h % 7))
}

export function summarize(values) {
  const counts = { normal: 0, oos: 0, error: 0, none: 0 }
  Object.values(values).forEach(v => {
    const { status } = getStatus(v)
    counts[status]++
  })
  return counts
}
