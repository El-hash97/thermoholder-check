import { AlertTriangle } from 'lucide-react'
import { getStatus, STATUS } from '../../lib/status.js'
import { UNITS } from '../../constants/units.js'

export default function AlertBanner({ entries }) {
  const problems = []

  entries.forEach(entry => {
    Object.entries(entry.values || {}).forEach(([unitId, val]) => {
      const { status } = getStatus(val)
      if (status === STATUS.OOS || status === STATUS.ERROR) {
        const unit = UNITS.find(u => u.id === unitId)
        problems.push({
          unit: unit?.label ?? unitId,
          group: entry.group,
          val,
          status,
        })
      }
    })
  })

  if (problems.length === 0) return null

  const oosCount   = problems.filter(p => p.status === STATUS.OOS).length
  const errorCount = problems.filter(p => p.status === STATUS.ERROR).length

  return (
    <div className="bg-red-50 border border-red-300 mx-3 mt-3 rounded-lg p-3 flex gap-3">
      <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
      <div>
        <p className="font-semibold text-red-800 text-sm">
          {oosCount > 0 && `${oosCount} Out of Standard`}
          {oosCount > 0 && errorCount > 0 && ' · '}
          {errorCount > 0 && `${errorCount} Error`}
          {' today'}
        </p>
        <p className="text-red-600 text-xs mt-0.5">
          {problems.slice(0, 6).map(p => p.unit).join(', ')}
          {problems.length > 6 && ` +${problems.length - 6} more`}
        </p>
      </div>
    </div>
  )
}
