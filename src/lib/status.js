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
  const num = Number(v)
  if (!isNaN(num) && /^[+-]?\d+$/.test(v)) {
    if (num >= -5 && num <= 5) {
      return { status: STATUS.NORMAL, label: v, color: 'status-normal' }
    }
    return { status: STATUS.OOS, label: v, color: 'status-oos' }
  }
  return { status: STATUS.NONE, label: v, color: 'status-none' }
}

export function summarize(values) {
  const counts = { normal: 0, oos: 0, error: 0, none: 0 }
  Object.values(values).forEach(v => {
    const { status } = getStatus(v)
    counts[status]++
  })
  return counts
}
