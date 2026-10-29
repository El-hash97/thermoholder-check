import { getStatus, deviation, STATUS } from './status.js'

// What a thermoholder's display reads when the quick checker sends `ref`
// and the check sheet recorded `raw` as that unit's deviation. `key`
// (valueKey(date, group, unit)) fixes the stand-in value of "low"/"high".
export function displayValue(raw, ref = 1500, key = '') {
  const { status } = getStatus(raw)
  if (status === STATUS.ERROR) return { text: 'Err', status }
  if (status === STATUS.NONE) return { text: '----', status }
  return { text: String(ref + deviation(raw, key)), status }
}
