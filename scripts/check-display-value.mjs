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
console.log('displayValue ok')
