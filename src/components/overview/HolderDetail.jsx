import { useEffect, useRef, useState } from 'react'
import { X, ZoomIn, ZoomOut, Pause, Play, RotateCcw, Boxes } from 'lucide-react'
import PartsDialog from './PartsDialog.jsx'
import { STD_TOLERANCE } from '../../constants/units.js'
import { parseValue } from '../../lib/chartData.js'
import { valueKey } from '../../lib/status.js'
import { displayDate } from '../../lib/dateUtils.js'
import { WIDTH, HEIGHT, frameAt } from './turntableGeometry.js'
import { ManualFace, DigitalFace } from './HolderFace.jsx'

export const STATUS_TEXT = { normal: 'Normal', oos: 'Out of Std', error: 'Error', none: 'Not Available' }
export const STATUS_CLASS = {
  normal: 'bg-green-50 border-green-300 text-green-700',
  oos: 'bg-red-50 border-red-300 text-red-700',
  error: 'bg-orange-50 border-orange-300 text-orange-600',
  none: 'bg-slate-100 border-slate-300 text-slate-500',
}

const MODEL = {
  Manual: {
    name: 'Manual thermoholder',
    series: 'Heraeus Electro-Nite Digilance',
    housing: 'Stainless steel case',
    display: 'Red 7-segment LED display',
    text:
      'A Heraeus Electro-Nite Digilance thermoholder: the hand-held instrument used for spot temperature readings of molten metal. ' +
      'The operator fits a disposable temtip on the bent end of the steel lance and dips it into the bath. The thermocouple inside the temtip sends its signal ' +
      'up the lance to the head, which holds the reading on its red 7-segment display. A column of status LEDs and a red push button sit beside the display.',
  },
  Digital: {
    name: 'Digital thermoholder',
    series: 'Heraeus Electro-Nite',
    housing: 'Black rubber housing',
    display: 'Backlit LCD with time stamp',
    text:
      'A Heraeus Electro-Nite digital thermoholder in a shock-absorbing rubber housing. It does the same job as the manual model: ' +
      'the thermocouple in a disposable temtip on the end of the lance is dipped into the molten metal, and the head shows the temperature on a backlit LCD ' +
      'together with the time of the reading. It is operated with up/down, confirm and cancel keys.',
  },
}

const PARTS = [
  ['Head', 'Measuring electronics, display and controls.'],
  ['Handle', 'Grip under the head.'],
  ['Contact block', 'Square block on the back of the head that tapers in a wedge into the lance.'],
  ['Lance', 'Long straight steel tube that bends down at the end (shortened in the drawing).'],
  ['Temtip', 'Disposable cardboard probe with a thermocouple, pushed over the lance end and dipped into the molten metal.'],
]

export function Trend({ points }) {
  if (points.length < 2) return <p className="text-xs text-slate-400">Not enough data for a trend.</p>
  const W = 220, H = 64, PAD = 6
  const max = Math.max(8, ...points.map(p => Math.abs(p.value)))
  const x = (i) => PAD + (i * (W - PAD * 2)) / (points.length - 1)
  const y = (v) => H / 2 - (v / max) * (H / 2 - PAD)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" role="img" aria-label="Deviation over the last checks">
      <rect x={PAD} y={y(5)} width={W - PAD * 2} height={y(-5) - y(5)} className="fill-green-100" />
      <line x1={PAD} x2={W - PAD} y1={y(0)} y2={y(0)} className="stroke-slate-300" strokeDasharray="3 3" />
      <polyline points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')} className="fill-none stroke-slate-500" strokeWidth="1.5" />
      {points.map((p, i) => (
        <circle key={p.date} cx={x(i)} cy={y(p.value)} r="2.6" className={Math.abs(p.value) > 5 ? 'fill-red-500' : 'fill-green-600'} />
      ))}
    </svg>
  )
}

const ZOOM = [0.8, 3]
const SPEED = 18 // degrees per second
const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v))

function verdict(status, checker) {
  if (status === 'normal') return `Within ±${STD_TOLERANCE} °C of the ${checker} °C quick checker. Holder OK.`
  if (status === 'oos') return `More than ${STD_TOLERANCE} °C away from the ${checker} °C quick checker. Holder out of standard.`
  if (status === 'error') return 'The holder showed an error during the check.'
  return 'No check result recorded for this holder.'
}

export default function HolderDetail({ holder, reading, raw, entry, date, group, checker, time, trend, onClose }) {
  const before = useRef(null)
  const after = useRef(null)
  const face = useRef(null)
  const stage = useRef(null)
  const dialog = useRef(null)
  const state = useRef({ angle: 0, spinning: true, drag: null, idle: 0 })
  const [zoom, setZoom] = useState(1.2)
  const [spinning, setSpinning] = useState(true)
  const [angle, setAngle] = useState(0)
  const [parts, setParts] = useState(false)
  const model = MODEL[holder.type]
  const Face = holder.digital ? DigitalFace : ManualFace

  useEffect(() => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const s = state.current
    let frame = 0, last = 0, shown = null
    const draw = () => {
      const a = ((s.angle % 360) + 360) % 360
      if (shown === Math.round(a * 4)) return
      shown = Math.round(a * 4)
      const f = frameAt(a, holder.digital)
      before.current.innerHTML = f.before
      after.current.innerHTML = f.after
      face.current.setAttribute('transform', f.face)
      face.current.style.display = f.faceOn ? '' : 'none'
      setAngle(Math.round(a))
    }
    const tick = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 0
      last = now
      if (s.spinning && !s.drag && !still && now > s.idle) s.angle += SPEED * dt
      draw()
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [holder.digital])

  useEffect(() => { state.current.spinning = spinning }, [spinning])
  useEffect(() => { dialog.current.focus({ preventScroll: true }) }, [])

  useEffect(() => {
    const el = stage.current
    const onWheel = (e) => {
      e.preventDefault()
      setZoom(z => clamp(z * Math.exp(-e.deltaY * 0.0015), ZOOM))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      const s = state.current
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') { s.angle += 15; s.idle = performance.now() + 2500 }
      else if (e.key === 'ArrowRight') { s.angle -= 15; s.idle = performance.now() + 2500 }
      else if (e.key === '+' || e.key === '=') setZoom(z => clamp(z * 1.25, ZOOM))
      else if (e.key === '-') setZoom(z => clamp(z / 1.25, ZOOM))
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const onPointerDown = (e) => {
    state.current.drag = { x: e.clientX, y: e.clientY, angle: state.current.angle, moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    const s = state.current
    if (!s.drag) return
    if (Math.hypot(e.clientX - s.drag.x, e.clientY - s.drag.y) > 5) s.drag.moved = true
    s.angle = s.drag.angle - (e.clientX - s.drag.x) * 0.6
  }
  // A tap (no drag) on the turning holder opens its parts breakdown.
  const onPointerUp = (e) => {
    const tapped = e.type === 'pointerup' && state.current.drag && !state.current.drag.moved
    state.current.drag = null
    state.current.idle = performance.now() + 2500
    if (tapped) setParts(true)
  }

  const vw = WIDTH / zoom, vh = HEIGHT / zoom
  const viewBox = `${(WIDTH - vw) / 2} ${(HEIGHT - vh) * 0.45} ${vw} ${vh}`
  const number = /^\d+$/.test(reading.text)
  const deviation = parseValue(raw, valueKey(date, group, holder.id))

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/70 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${holder.label} detail`}
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[94vh] overflow-y-auto overflow-x-hidden grid lg:grid-cols-[1.35fr_1fr] outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onClick={e => e.stopPropagation()}
      >
        <figure className="iso th-fig m-0 relative" data-theme="dark">
          <div className="iso-plate rounded-t-2xl lg:rounded-tr-none overflow-hidden h-full flex flex-col justify-center" style={{ padding: '44px 8px 56px' }}>
            <div className="iso-plate-corners" aria-hidden="true">
              <span className="iso-plate-corner" data-corner="fig">Fig 2</span>
              <span className="iso-plate-corner" data-corner="title">{holder.label} · {holder.type}</span>
              <span className="iso-plate-corner" data-corner="hint">Tap for parts · drag to turn</span>
              <span className="iso-plate-corner" data-corner="readout">turn {angle}° · {zoom.toFixed(1)}×</span>
            </div>
            <div
              ref={stage}
              className="touch-none cursor-pointer active:cursor-grabbing select-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <svg className="iso-svg" viewBox={viewBox} role="img" aria-label={`${holder.label}, a ${model.name.toLowerCase()} with its lance, turning on a display turntable. Its display reads ${reading.text}.`}>
                <g ref={before} />
                <g ref={face} className="th-face">
                  <Face unit={holder} reading={reading} time={time} />
                </g>
                <g ref={after} />
              </svg>
            </div>
            <div className="absolute right-3 top-9 flex flex-col gap-1.5">
              {[
                { label: 'Show parts', Icon: Boxes, on: () => setParts(true) },
                { label: 'Zoom in', Icon: ZoomIn, on: () => setZoom(z => clamp(z * 1.25, ZOOM)) },
                { label: 'Zoom out', Icon: ZoomOut, on: () => setZoom(z => clamp(z / 1.25, ZOOM)) },
                { label: 'Reset view', Icon: RotateCcw, on: () => { setZoom(1.2); state.current.angle = 0 } },
                { label: spinning ? 'Pause turntable' : 'Spin turntable', Icon: spinning ? Pause : Play, on: () => setSpinning(v => !v) },
              ].map(({ label, Icon, on }) => (
                <button key={label} onClick={on} aria-label={label} title={label}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center">
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </div>
        </figure>

        <div className="p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{holder.label}</h2>
              <p className="text-sm text-slate-500">{model.name} · {model.series}</p>
            </div>
            <span className="ml-auto text-xs font-semibold rounded-full px-2.5 py-1 bg-slate-800 text-white">{holder.type}</span>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <X size={20} />
            </button>
          </div>

          <section className={`border rounded-xl p-3 ${STATUS_CLASS[reading.status]}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider">Check result</h3>
              <span className="text-xs font-bold">{STATUS_TEXT[reading.status]}</span>
            </div>
            <p className="text-3xl font-bold tabular-nums text-slate-900 mt-1">
              {reading.text}{number && <span className="text-base font-semibold text-slate-500"> °C</span>}
            </p>
            <p className="text-sm text-slate-700 mt-1">{verdict(reading.status, checker)}</p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm mt-3 text-slate-700">
              <dt className="text-slate-500">Date</dt><dd className="font-medium">{date ? displayDate(date) : '—'}</dd>
              <dt className="text-slate-500">Group</dt><dd className="font-medium capitalize">{group}</dd>
              <dt className="text-slate-500">Checked at</dt><dd className="font-medium tabular-nums">{entry ? time : '—'}</dd>
              <dt className="text-slate-500">Input (deviation)</dt><dd className="font-medium tabular-nums">{raw || '—'}</dd>
              <dt className="text-slate-500">Reading</dt>
              <dd className="font-medium tabular-nums">{number ? `${checker} ${deviation < 0 ? '−' : '+'} ${Math.abs(deviation)} = ${reading.text} °C` : reading.text}</dd>
              <dt className="text-slate-500">Tolerance</dt><dd className="font-medium tabular-nums">±{STD_TOLERANCE} °C</dd>
            </dl>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Last {trend.length} checks · {group} group</h3>
            <Trend points={trend} />
          </section>

        </div>

        <section className="lg:col-span-2 border-t border-slate-200 p-4 sm:p-5 grid gap-x-8 gap-y-3 lg:grid-cols-[1.35fr_1fr] font-serif text-[15px] leading-relaxed text-slate-700">
          <div className="flex flex-col gap-2">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-500">About this thermoholder</h3>
            <p>{model.text}</p>
            <p className="text-xs text-slate-500">
              Check method: the quick checker feeds the holder a {checker} °C reference signal; the holder passes when it reads within ±{STD_TOLERANCE} °C.
            </p>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 content-start">
            <dt className="text-slate-500">Type</dt><dd>{holder.type}</dd>
            <dt className="text-slate-500">Housing</dt><dd>{model.housing}</dd>
            <dt className="text-slate-500">Display</dt><dd>{model.display}</dd>
            {PARTS.map(([name, text]) => (
              <div key={name} className="contents"><dt className="text-slate-500">{name}</dt><dd>{text}</dd></div>
            ))}
          </dl>
        </section>
      </div>
      {parts && <PartsDialog holder={holder} onClose={() => setParts(false)} />}
    </div>
  )
}
