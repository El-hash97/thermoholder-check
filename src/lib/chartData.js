import { UNITS } from '../constants/units.js'
import { getStatus, deviation, valueKey } from './status.js'

export const parseValue = deviation

export function buildPoints(entries) {
  const points = []
  ;(entries || []).forEach(entry => {
    UNITS.forEach(unit => {
      const raw = entry.values?.[unit.id]
      const { status } = getStatus(raw)
      if (status !== 'normal' && status !== 'oos') return
      points.push({
        unit: unit.label,
        value: parseValue(raw, valueKey(entry.date, entry.group, unit.id)),
        group: entry.group,
        status,
      })
    })
  })
  return points
}

export function computeMaxAbs(points) {
  const maxAbs = points.reduce((m, p) => Math.max(m, Math.abs(p.value)), 0)
  const padded = Math.ceil((maxAbs + 2) / 5) * 5
  return Math.max(10, padded)
}

// Y-axis half-range for the trend chart: fixed at 12 unless data exceeds it,
// in which case it expands just enough to fit the data with a little headroom.
export function computeTrendAxisMax(points, floor = 12) {
  const maxAbs = points.reduce((m, p) => Math.max(m, Math.abs(p.value)), 0)
  return maxAbs > floor ? Math.ceil(maxAbs) + 1 : floor
}

export function buildTicks(maxAbs) {
  const ticks = []
  for (let t = -maxAbs; t <= maxAbs; t += 5) ticks.push(t)
  return ticks
}

export function formatCompactTick(label) {
  return label.replace(/^TH\s*/, '')
}

export function buildTrendPoints(entries, dates, group) {
  const points = []
  dates.forEach(date => {
    entries
      .filter(e => e.date === date && e.group === group)
      .forEach(entry => {
        UNITS.forEach(unit => {
          const raw = entry.values?.[unit.id]
          const { status } = getStatus(raw)
          if (status !== 'normal' && status !== 'oos') return
          points.push({
            date,
            unit: unit.id,
            unitLabel: unit.label,
            value: parseValue(raw, valueKey(date, group, unit.id)),
            status,
          })
        })
      })
  })
  return points
}
