import { getStatus, STATUS } from './status.js'

// What a thermoholder's display reads when the quick checker sends `ref`
// and the check sheet recorded `raw` as that unit's deviation.
export function displayValue(raw, ref = 1500) {
  const { status } = getStatus(raw)
  const v = String(raw ?? '').trim()
  if (status === STATUS.ERROR) return { text: 'Err', status }
  if (status === STATUS.NONE) return { text: '----', status }
  if (v.toLowerCase() === 'ok') return { text: String(ref), status }
  return { text: String(ref + Number(v)), status }
}
