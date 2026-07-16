import { UNITS, QUICK_CHECKER_REF, STD_TOLERANCE } from '../../constants/units.js'
import { getStatus, summarize } from '../../lib/status.js'
import { displayDate } from '../../lib/dateUtils.js'
import OkNgScatterChart from '../dashboard/OkNgScatterChart.jsx'

const BG = {
  normal: '#16a34a',
  oos:    '#dc2626',
  error:  '#ea580c',
  none:   '#475569',
}

const GROUP_BADGE = {
  red:   { label: 'RED',   bg: '#be123c' },
  white: { label: 'WHITE', bg: '#64748b' },
}

export default function ShareCard({ date, entries = [], id = 'share-card' }) {
  if (!date || entries.length === 0) return null

  const allVals = {}
  entries.forEach(e => {
    UNITS.forEach(u => { allVals[`${u.id}_${e.group}`] = e.values?.[u.id] ?? 'X' })
  })
  const counts = summarize(allVals)

  return (
    <div
      id={id}
      style={{ background: '#0f172a', fontFamily: 'sans-serif', padding: '16px', width: '360px', borderRadius: '12px' }}
    >
      <div style={{ marginBottom: '8px' }}>
        <div style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: 700 }}>
          Thermoholder Check Sheet
        </div>
        <div style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{displayDate(date)}</span>
          {entries.map(e => (
            <span
              key={e.group}
              style={{ background: GROUP_BADGE[e.group]?.bg ?? '#475569', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}
            >
              {GROUP_BADGE[e.group]?.label ?? e.group.toUpperCase()}
            </span>
          ))}
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

      <div style={{ marginBottom: '8px' }}>
        <OkNgScatterChart entries={entries} compact width={328} height={150} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', marginBottom: '8px' }}>
        {UNITS.map(u => (
          <div key={u.id} style={{ background: '#1e293b', borderRadius: '4px', padding: '3px 4px' }}>
            <div style={{ color: '#e2e8f0', fontSize: '9px', fontWeight: 600, marginBottom: '2px' }}>{u.label}</div>
            <div style={{ display: 'flex', gap: '2px' }}>
              {entries.map(e => {
                const { status, label } = getStatus(e.values?.[u.id] ?? 'X')
                return (
                  <span
                    key={e.group}
                    style={{ background: BG[status], color: '#fff', fontSize: '9px', fontFamily: 'monospace', borderRadius: '3px', padding: '1px 3px', flex: 1, textAlign: 'center' }}
                  >
                    {label}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ color: '#64748b', fontSize: '10px', textAlign: 'center' }}>
        Quick Checker: {QUICK_CHECKER_REF}°C | Standar: ±{STD_TOLERANCE}°C
      </div>
    </div>
  )
}
