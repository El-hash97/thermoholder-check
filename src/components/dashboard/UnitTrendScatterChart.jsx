// src/components/dashboard/UnitTrendScatterChart.jsx
import { useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, ReferenceArea, ReferenceLine,
  Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { UNITS, GROUPS } from '../../constants/units.js'
import { UNIT_COLORS } from '../../lib/unitColors.js'
import { buildTrendPoints, computeMaxAbs } from '../../lib/chartData.js'

const OK_COLOR = '#16a34a'
const NG_COLOR = '#dc2626'

function PointShape({ cx, cy, fill, status, dimmed, r }) {
  const opacity = dimmed ? 0.15 : 1
  if (status === 'oos') {
    return (
      <path
        d={`M ${cx} ${cy - r} L ${cx + r} ${cy + r} L ${cx - r} ${cy + r} Z`}
        fill={fill}
        opacity={opacity}
        stroke="#0f172a"
        strokeWidth={1}
      />
    )
  }
  return <circle cx={cx} cy={cy} r={r} fill={fill} opacity={opacity} stroke="#0f172a" strokeWidth={1} />
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, padding: '6px 10px', color: '#1e293b' }}>
      <div>{p.unitLabel} · {p.date}</div>
      <div>{p.value} ({p.status === 'normal' ? 'OK' : 'NG'})</div>
    </div>
  )
}

function renderShape(color, selectedUnit, unitId, r) {
  return (props) => (
    <PointShape
      cx={props.cx}
      cy={props.cy}
      fill={color}
      status={props.payload.status}
      dimmed={selectedUnit != null && selectedUnit !== unitId}
      r={r}
    />
  )
}

export default function UnitTrendScatterChart({ entries, dates }) {
  const [activeGroup, setActiveGroup] = useState('red')
  const [selectedUnit, setSelectedUnit] = useState(null)
  const points = buildTrendPoints(entries, dates, activeGroup)
  const maxAbs = computeMaxAbs(points)
  const fineTicks = Array.from({ length: maxAbs * 2 + 1 }, (_, i) => i - maxAbs)

  const dense = dates.length > 10
  const pointRadius = dense ? 3.5 : 5
  const chartHeight = 480

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 text-xs">
        {GROUPS.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={`px-3 py-1.5 rounded-lg font-medium touch-target transition-colors ${
              activeGroup === g.id ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {points.length === 0 ? (
        <div className="flex items-center justify-center text-xs text-slate-400" style={{ height: 160 }}>
          No data
        </div>
      ) : (
        // -mx-4 offsets Dashboard.jsx's card p-4 so the chart reaches the card edge
        <div className="-mx-4">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ScatterChart margin={{ top: 10, right: 16, bottom: 24, left: 8 }}>
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                type="category"
                allowDuplicatedCategory={false}
                domain={dates}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={d => d.slice(8)}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                interval={0}
                height={20}
              />
              <YAxis
                dataKey="value"
                type="number"
                domain={[-maxAbs, maxAbs]}
                ticks={fineTicks}
                interval={0}
                tick={{ fill: '#64748b', fontSize: 8 }}
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
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={<ChartTooltip />}
              />
              {UNITS.map((unit, i) => {
                const unitPoints = points.filter(p => p.unit === unit.id)
                if (unitPoints.length === 0) return null
                return (
                  <Scatter
                    key={unit.id}
                    data={unitPoints}
                    shape={renderShape(UNIT_COLORS[i], selectedUnit, unit.id, pointRadius)}
                  />
                )
              })}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 px-1">
        {UNITS.map((unit, i) => (
          <button
            key={unit.id}
            onClick={() => setSelectedUnit(prev => prev === unit.id ? null : unit.id)}
            className={`flex items-center gap-1 px-1 rounded ${selectedUnit === unit.id ? 'bg-slate-200 text-slate-800' : ''}`}
          >
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: UNIT_COLORS[i] }} />
            {unit.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 px-1">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-slate-400" /> OK (circle)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 inline-block bg-slate-400" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} /> NG (triangle)
        </span>
      </div>
    </div>
  )
}
