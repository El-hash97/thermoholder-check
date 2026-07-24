// src/components/dashboard/UnitTrendScatterChart.jsx
import { useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, ReferenceArea, ReferenceLine,
  Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { UNITS, GROUPS } from '../../constants/units.js'
import { UNIT_COLORS } from '../../lib/unitColors.js'
import { buildTrendPoints, computeMaxAbs, buildTicks } from '../../lib/chartData.js'

const OK_COLOR = '#16a34a'
const NG_COLOR = '#dc2626'
const OK_LABEL_COLOR = '#4ade80'
const NG_LABEL_COLOR = '#f87171'

function PointShape({ cx, cy, fill, status, value, dimmed, r, fontSize }) {
  const opacity = dimmed ? 0.15 : 1
  const labelColor = status === 'oos' ? NG_LABEL_COLOR : OK_LABEL_COLOR
  return (
    <g>
      {status === 'oos' ? (
        <path
          d={`M ${cx} ${cy - r} L ${cx + r} ${cy + r} L ${cx - r} ${cy + r} Z`}
          fill={fill}
          opacity={opacity}
          stroke="#0f172a"
          strokeWidth={1}
        />
      ) : (
        <circle cx={cx} cy={cy} r={r} fill={fill} opacity={opacity} stroke="#0f172a" strokeWidth={1} />
      )}
      <text x={cx} y={cy - r - 4} textAnchor="middle" fontSize={fontSize} fill={labelColor} opacity={opacity}>
        {value}
      </text>
    </g>
  )
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12, padding: '6px 10px', color: '#e2e8f0' }}>
      <div>{p.unitLabel} · {p.date}</div>
      <div>{p.value} ({p.status === 'normal' ? 'OK' : 'NG'})</div>
    </div>
  )
}

function renderShape(color, selectedUnit, unitId, r, fontSize) {
  return (props) => (
    <PointShape
      cx={props.cx}
      cy={props.cy}
      fill={color}
      status={props.payload.status}
      value={props.payload.value}
      dimmed={selectedUnit != null && selectedUnit !== unitId}
      r={r}
      fontSize={fontSize}
    />
  )
}

export default function UnitTrendScatterChart({ entries, dates }) {
  const [activeGroup, setActiveGroup] = useState('red')
  const [selectedUnit, setSelectedUnit] = useState(null)
  const points = buildTrendPoints(entries, dates, activeGroup)
  const maxAbs = computeMaxAbs(points)

  const dense = dates.length > 10
  const pointRadius = dense ? 3.5 : 5
  const labelFontSize = dense ? 7 : 10
  const chartHeight = 300

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 text-xs">
        {GROUPS.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={`px-3 py-1.5 rounded-lg font-medium touch-target transition-colors ${
              activeGroup === g.id ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {points.length === 0 ? (
        <div className="flex items-center justify-center text-xs text-slate-500" style={{ height: 160 }}>
          No data
        </div>
      ) : (
        <div className="-mx-4">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ScatterChart margin={{ top: 10, right: 16, bottom: 24, left: 8 }}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis
                dataKey="date"
                type="category"
                allowDuplicatedCategory={false}
                domain={dates}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={d => d.slice(8)}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                interval={0}
                height={20}
              />
              <YAxis
                dataKey="value"
                type="number"
                domain={[-maxAbs, maxAbs]}
                ticks={buildTicks(maxAbs)}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                width={28}
              />
              <ReferenceArea
                y1={-5} y2={5} fill={OK_COLOR} fillOpacity={0.15}
                label={{ value: 'OK', position: 'insideLeft', fill: '#86efac', fontSize: 10 }}
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
                    shape={renderShape(UNIT_COLORS[i], selectedUnit, unit.id, pointRadius, labelFontSize)}
                  />
                )
              })}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 px-1">
        {UNITS.map((unit, i) => (
          <button
            key={unit.id}
            onClick={() => setSelectedUnit(prev => prev === unit.id ? null : unit.id)}
            className={`flex items-center gap-1 px-1 rounded ${selectedUnit === unit.id ? 'bg-slate-700 text-slate-200' : ''}`}
          >
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: UNIT_COLORS[i] }} />
            {unit.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-slate-300" /> OK (circle)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 inline-block bg-slate-300" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} /> NG (triangle)
        </span>
      </div>
    </div>
  )
}
