import { UNITS } from '../constants/units.js'
import { getStatus } from './status.js'

export function parseValue(raw) {
  const v = String(raw ?? '').trim()
  if (v.toLowerCase() === 'ok') return 0
  return Number(v)
}

export function buildPoints(entries) {
  const points = []
  ;(entries || []).forEach(entry => {
    UNITS.forEach(unit => {
      const raw = entry.values?.[unit.id]
      const { status } = getStatus(raw)
      if (status !== 'normal' && status !== 'oos') return
      points.push({
        unit: unit.label,
        value: parseValue(raw),
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

export function buildTicks(maxAbs) {
  const ticks = []
  for (let t = -maxAbs; t <= maxAbs; t += 5) ticks.push(t)
  return ticks
}

export function formatCompactTick(label) {
  return label.replace(/^TH\s*/, '')
}
