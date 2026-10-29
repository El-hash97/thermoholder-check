// Run: node scripts/check-display-value.mjs
import assert from 'node:assert/strict'
import { displayValue } from '../src/lib/displayValue.js'

assert.deepEqual(displayValue('+3', 1500), { text: '1503', status: 'normal' })
assert.deepEqual(displayValue('-2', 1500), { text: '1498', status: 'normal' })
assert.deepEqual(displayValue('7', 1500), { text: '1507', status: 'oos' })
assert.deepEqual(displayValue('-6', 1480), { text: '1474', status: 'oos' })
assert.deepEqual(displayValue('OK', 1500), { text: '1500', status: 'normal' })
assert.deepEqual(displayValue('Error', 1500), { text: 'Err', status: 'error' })
assert.deepEqual(displayValue('', 1500), { text: '----', status: 'none' })
assert.deepEqual(displayValue(undefined, 1500), { text: '----', status: 'none' })
assert.deepEqual(displayValue('X', 1500), { text: '----', status: 'none' })
// "low" / "high": OOS, labelled LOW / HIGH, a stable stand-in of -6..-12 / +6..+12.
const { getStatus, deviation, valueKey, summarize } = await import('../src/lib/status.js')
const { buildPoints } = await import('../src/lib/chartData.js')
for (const raw of ['low', 'Low', 'LOW', ' low ']) assert.deepEqual(getStatus(raw), { status: 'oos', label: 'LOW', color: 'status-oos' })
for (const raw of ['high', 'High', 'HIGH']) assert.deepEqual(getStatus(raw), { status: 'oos', label: 'HIGH', color: 'status-oos' })
assert.equal(getStatus('lo').status, 'none')
assert.equal(summarize({ a: 'low', b: 'high', c: '+3' }).oos, 2)
const keys = []
for (const date of ['2026-10-24', '2026-10-28', '2026-11-02']) for (const group of ['red', 'white']) for (const unit of ['TH1', 'TH5', 'TH11', 'TH_Master']) keys.push(valueKey(date, group, unit))
const lows = keys.map(k => deviation('low', k)), highs = keys.map(k => deviation('High', k))
assert.ok(lows.every(n => Number.isInteger(n) && n >= -12 && n <= -6), `low out of range: ${lows}`)
assert.ok(highs.every(n => Number.isInteger(n) && n >= 6 && n <= 12), `high out of range: ${highs}`)
assert.ok(new Set(lows).size > 2, 'low values should vary between readings')
assert.equal(deviation('low', keys[3]), deviation('LOW', keys[3]), 'stable for the same reading')
const k = valueKey('2026-10-28', 'red', 'TH1')
assert.deepEqual(displayValue('low', 1500, k), { text: String(1500 + deviation('low', k)), status: 'oos' })
const [point] = buildPoints([{ date: '2026-10-28', group: 'red', values: { TH1: 'low' } }])
assert.deepEqual([point.value, point.status], [deviation('low', k), 'oos'])
console.log('displayValue ok · low/high ok', { lows: lows.slice(0, 6), highs: highs.slice(0, 6) })
