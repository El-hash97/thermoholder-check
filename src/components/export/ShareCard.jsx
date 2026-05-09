import { UNITS, QUICK_CHECKER_REF, STD_TOLERANCE } from '../../constants/units.js'
import { getStatus } from '../../lib/status.js'
import { summarize } from '../../lib/status.js'
import { displayDate } from '../../lib/dateUtils.js'

const BG = {
  normal: '#16a34a',
  oos:    '#dc2626',
  error:  '#ea580c',
  none:   '#475569',
}

export default function ShareCard({ entry, id = 'share-card' }) {
  if (!entry) return null
  const counts = summarize(entry.values || {})

  return (
    <div
      id={id}
      style={{ background: '#0f172a', fontFamily: 'sans-serif', padding: '16px', width: '360px', borderRadius: '12px' }}
    >
      <div style={{ marginBottom: '8px' }}>
        <div style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: 700 }}>
          Thermoholder Check Sheet
        </div>
        <div style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '2px' }}>
          {displayDate(entry.date)} · {entry.shift?.toUpperCase()} · {entry.group?.toUpperCase()}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '8px' }}>
        {[['Normal', counts.normal, '#16a34a'],['OOS', counts.oos, '#dc2626'],['Error', counts.error, '#ea580c'],['Tdk Ada', counts.none, '#475569']].map(([l, c, color]) => (
          <div key={l} style={{ background: '#1e293b', borderRadius: '6px', padding: '4px', textAlign: 'center' }}>
            <div style={{ color, fontSize: '18px', fontWeight: 700 }}>{c}</div>
            <div style={{ color: '#94a3b8', fontSize: '10px' }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', marginBottom: '8px' }}>
        {UNITS.map(u => {
          const { status, label } = getStatus(entry.values?.[u.id] ?? 'X')
          return (
            <div key={u.id} style={{ background: BG[status], borderRadius: '4px', padding: '3px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontSize: '10px', fontWeight: 600 }}>{u.label}</span>
              <span style={{ color: '#fff', fontSize: '10px', fontFamily: 'monospace' }}>{label}</span>
            </div>
          )
        })}
      </div>

      <div style={{ color: '#64748b', fontSize: '10px', textAlign: 'center' }}>
        Quick Checker: {QUICK_CHECKER_REF}°C | Standar: ±{STD_TOLERANCE}°C
      </div>
    </div>
  )
}
