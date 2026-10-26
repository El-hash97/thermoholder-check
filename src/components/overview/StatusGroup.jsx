import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { UNITS } from '../../constants/units.js'
import { KPI, groupFigure } from './statusGeometry.js'
import { SevenSeg, ManualFace, DigitalFace } from './HolderFace.jsx'

export const KPI_STATUS = [
  { id: 'normal', label: 'NORMAL', title: 'Normal', tone: 'green' },
  { id: 'oos', label: 'OOS', title: 'Out of Std', tone: 'red' },
  { id: 'error', label: 'ERROR', title: 'Error', tone: 'amber' },
  { id: 'none', label: 'N/A', title: 'Not Available', tone: 'slate' },
]

const html = (markup) => ({ __html: markup })
const PAPER = { '--anatomy-paper': '#131313', background: '#131313' }

// A KPI card drawn as a thermoholder contact block: the count on its display.
export function KpiBlock({ status, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${status.title}: ${count} thermoholder${count === 1 ? '' : 's'}. Show them.`}
      className="iso th-fig th-kpi rounded-xl p-1 sm:p-2 touch-target"
      data-theme="dark"
      style={PAPER}
    >
      <svg className="iso-svg" viewBox={`0 0 ${KPI.width} ${KPI.height}`} aria-hidden="true">
        <g dangerouslySetInnerHTML={html(KPI.body)} />
        <g className="th-face" transform={KPI.face}>
          <circle cx={4} cy={5} r={1.3} className={count ? `th-led th-led-${status.tone}` : 'th-led'} />
          <rect x={9} y={3} width={21} height={10.5} rx={0.7} className="th-bezel" />
          <rect x={9.8} y={3.8} width={19.4} height={8.9} rx={0.4} className="th-window-red" />
          <g transform="translate(13.6 4.55) scale(1.6)">
            <SevenSeg text={String(count)} x={0} y={0} pitch={3.9} tone={status.tone} size={2} dot={false} />
          </g>
          <text x={17} y={21.2} fontSize={4.2} className="th-kpi-label">{status.label}</text>
          {[[2.5, 2.5], [31.5, 2.5], [2.5, 23.5], [31.5, 23.5]].map(([u, v]) => (
            <circle key={`${u}-${v}`} cx={u} cy={v} r={0.6} className="th-screw" />
          ))}
        </g>
      </svg>
    </button>
  )
}

// The holders in one status, standing on a plate. Tapping one opens its detail.
export function StatusDialog({ status, readings, time, onPick, onClose }) {
  const dialog = useRef(null)
  const ids = UNITS.filter((u) => readings[u.id].status === status.id).map((u) => u.id)
  const figure = ids.length ? groupFigure(ids) : null

  useEffect(() => { dialog.current.focus({ preventScroll: true }) }, [])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/70 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${status.title} thermoholders`}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[94vh] overflow-y-auto overflow-x-hidden outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 sm:px-5 pt-4 pb-3">
          <h2 className="text-lg font-bold text-slate-900">{status.title}</h2>
          <span className="text-sm text-slate-500">{ids.length} thermoholder{ids.length === 1 ? '' : 's'}</span>
          <button onClick={onClose} aria-label="Close" className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={20} />
          </button>
        </div>

        <figure className="iso th-fig m-0" data-theme="dark">
          <div className="iso-plate overflow-hidden" style={{ padding: '40px 8px 44px' }}>
            <div className="iso-plate-corners" aria-hidden="true">
              <span className="iso-plate-corner" data-corner="fig">Fig 3</span>
              <span className="iso-plate-corner" data-corner="title">{status.title} · {ids.length}</span>
              {figure && <span className="iso-plate-corner" data-corner="hint">Tap a holder for detail</span>}
            </div>
            {figure ? (
              <svg className="iso-svg" viewBox={`0 0 ${figure.width} ${figure.height}`} role="group" aria-label={`${ids.length} ${status.title.toLowerCase()} thermoholders on a stand`}>
                <g dangerouslySetInnerHTML={html(figure.base)} />
                {figure.holders.map((h) => {
                  const Face = h.digital ? DigitalFace : ManualFace
                  const reading = readings[h.id]
                  return (
                    <g
                      key={h.id}
                      className="th-holder"
                      role="button"
                      tabIndex={0}
                      aria-label={`${h.label}: ${reading.text}. Open detail.`}
                      onClick={() => onPick(h.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(h.id) } }}
                    >
                      <g dangerouslySetInnerHTML={html(h.body)} />
                      <g className="th-face" transform={h.face}>
                        <Face unit={h} reading={reading} time={time} />
                      </g>
                    </g>
                  )
                })}
              </svg>
            ) : (
              <p className="text-center text-sm text-slate-400 py-16">No thermoholder is {status.title.toLowerCase()} on this check.</p>
            )}
          </div>
        </figure>

        {ids.length > 0 && (
          <ul className="flex flex-wrap gap-2 p-4 sm:p-5">
            {ids.map((id) => {
              const unit = UNITS.find((u) => u.id === id)
              return (
                <li key={id}>
                  <button
                    onClick={() => onPick(id)}
                    className="text-sm rounded-lg border border-slate-200 hover:border-slate-400 px-2.5 py-1.5 touch-target"
                  >
                    <span className="font-semibold text-slate-800">{unit.label}</span>
                    <span className="text-slate-500 tabular-nums"> · {readings[id].text}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
