import {
  ScatterChart, Scatter, XAxis, YAxis, ReferenceArea, ReferenceLine,
  Tooltip, CartesianGrid,
} from 'recharts'
import { UNITS } from '../../constants/units.js'
import { getStatus } from '../../lib/status.js'

const OK_COLOR = '#16a34a'
const NG_COLOR = '#dc2626'

const GROUP_SHAPE = {
  red:   'circle',
  white: 'diamond',
}

const GROUP_LABEL = {
  red:   'Red team',
  white: 'White team',
}

function buildPoints(entries) {
  const points = []
  ;(entries || []).forEach(entry => {
    UNITS.forEach(unit => {
      const raw = entry.values?.[unit.id]
      const { status } = getStatus(raw)
      if (status !== 'normal' && status !== 'oos') return
      points.push({
        unit: unit.label,
        value: Number(raw),
        group: entry.group,
        status,
      })
    })
  })
  return points
}

function computeMaxAbs(points) {
  const maxAbs = points.reduce((m, p) => Math.max(m, Math.abs(p.value)), 0)
  const padded = Math.ceil((maxAbs + 2) / 5) * 5
  return Math.max(10, padded)
}

function formatCompactTick(label) {
  return label.replace(/^TH\s*/, '')
}

function DotShape({ cx, cy, fill, shape }) {
  if (shape === 'diamond') {
    const r = 5
    return (
      <path
        d={`M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`}
        fill={fill}
        stroke="#0f172a"
        strokeWidth={1}
      />
    )
  }
  return <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#0f172a" strokeWidth={1} />
}

function renderShape(group) {
  return (props) => (
    <DotShape
      cx={props.cx}
      cy={props.cy}
      fill={props.payload.status === 'normal' ? OK_COLOR : NG_COLOR}
      shape={GROUP_SHAPE[group]}
    />
  )
}

export default function OkNgScatterChart({ entries, compact = false, width, height }) {
  const points = buildPoints(entries)

  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-500"
        style={{ height: height ?? 160 }}
      >
        No data
      </div>
    )
  }

  const maxAbs = computeMaxAbs(points)
  const redPoints   = points.filter(p => p.group === 'red')
  const whitePoints = points.filter(p => p.group === 'white')
  const groupsPresent = [...new Set(points.map(p => p.group))]

  const chartHeight = height ?? 200
  const chartWidth  = compact ? width : Math.max(width ?? 0, UNITS.length * 40)

  const chart = (
    <ScatterChart
      width={chartWidth}
      height={chartHeight}
      margin={{ top: 10, right: 16, bottom: compact ? 8 : 24, left: 8 }}
    >
      <CartesianGrid stroke="#1e293b" />
      <XAxis
        dataKey="unit"
        type="category"
        allowDuplicatedCategory={false}
        tick={{ fill: '#94a3b8', fontSize: compact ? 8 : 10 }}
        tickFormatter={compact ? formatCompactTick : undefined}
        axisLine={{ stroke: '#334155' }}
        tickLine={false}
        interval={0}
        height={20}
      />
      <YAxis
        dataKey="value"
        type="number"
        domain={[-maxAbs, maxAbs]}
        tick={{ fill: '#94a3b8', fontSize: 10 }}
        axisLine={{ stroke: '#334155' }}
        tickLine={false}
        width={28}
      />
      <ReferenceArea
        y1={-5} y2={5} fill={OK_COLOR} fillOpacity={0.15}
        label={{ value: 'OK', position: 'insideTopLeft', fill: '#86efac', fontSize: 10 }}
      />
      <ReferenceArea
        y1={5} y2={maxAbs} fill={NG_COLOR} fillOpacity={0.12}
        label={{ value: 'NG', position: 'insideTopLeft', fill: '#fca5a5', fontSize: 10 }}
      />
      <ReferenceArea
        y1={-maxAbs} y2={-5} fill={NG_COLOR} fillOpacity={0.12}
        label={{ value: 'NG', position: 'insideBottomLeft', fill: '#fca5a5', fontSize: 10 }}
      />
      <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
      {!compact && (
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
          formatter={(value, _name, props) => [
            `${value} (${props.payload.status === 'normal' ? 'OK' : 'NG'})`,
            props.payload.unit,
          ]}
          labelFormatter={() => ''}
        />
      )}
      {redPoints.length > 0 && <Scatter data={redPoints} shape={renderShape('red')} />}
      {whitePoints.length > 0 && <Scatter data={whitePoints} shape={renderShape('white')} />}
    </ScatterChart>
  )

  return (
    <div className="flex flex-col gap-2">
      {compact ? chart : <div className="overflow-x-auto">{chart}</div>}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: OK_COLOR }} /> OK (±5°C)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: NG_COLOR }} /> NG
        </span>
        {groupsPresent.includes('red') && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-slate-300" /> {GROUP_LABEL.red} (circle)
          </span>
        )}
        {groupsPresent.includes('white') && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 inline-block bg-slate-300" style={{ transform: 'rotate(45deg)' }} /> {GROUP_LABEL.white} (diamond)
          </span>
        )}
      </div>
    </div>
  )
}
