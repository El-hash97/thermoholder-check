import {
  ScatterChart, Scatter, XAxis, YAxis, ReferenceArea, ReferenceLine,
  Tooltip, CartesianGrid,
} from 'recharts'
import { UNITS } from '../../constants/units.js'
import { buildPoints, computeMaxAbs, buildTicks, formatCompactTick } from '../../lib/chartData.js'

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
        className="flex items-center justify-center text-xs text-slate-400"
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
      <CartesianGrid stroke="#e2e8f0" />
      <XAxis
        dataKey="unit"
        type="category"
        allowDuplicatedCategory={false}
        domain={UNITS.map(u => u.label)}
        tick={{ fill: '#64748b', fontSize: compact ? 8 : 10 }}
        tickFormatter={compact ? formatCompactTick : undefined}
        axisLine={{ stroke: '#cbd5e1' }}
        tickLine={false}
        interval={0}
        height={20}
      />
      <YAxis
        dataKey="value"
        type="number"
        domain={[-maxAbs, maxAbs]}
        ticks={buildTicks(maxAbs)}
        tick={{ fill: '#64748b', fontSize: 10 }}
        axisLine={{ stroke: '#cbd5e1' }}
        tickLine={false}
        width={28}
      />
      <ReferenceArea
        y1={-5} y2={5} fill={OK_COLOR} fillOpacity={0.12}
        label={{ value: 'OK', position: 'insideLeft', fill: '#16a34a', fontSize: 10 }}
      />
      <ReferenceArea
        y1={5} y2={maxAbs} fill={NG_COLOR} fillOpacity={0.1}
        label={{ value: 'NG', position: 'insideTopLeft', fill: '#dc2626', fontSize: 10 }}
      />
      <ReferenceArea
        y1={-maxAbs} y2={-5} fill={NG_COLOR} fillOpacity={0.1}
        label={{ value: 'NG', position: 'insideBottomLeft', fill: '#dc2626', fontSize: 10 }}
      />
      <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
      {!compact && (
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
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
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 px-1">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: OK_COLOR }} /> OK (±5°C)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: NG_COLOR }} /> NG
        </span>
        {groupsPresent.includes('red') && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-slate-400" /> {GROUP_LABEL.red} (circle)
          </span>
        )}
        {groupsPresent.includes('white') && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 inline-block bg-slate-400" style={{ transform: 'rotate(45deg)' }} /> {GROUP_LABEL.white} (diamond)
          </span>
        )}
      </div>
    </div>
  )
}
