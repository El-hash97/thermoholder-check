import { UNITS, QUICK_CHECKER_REF, STD_TOLERANCE } from '../../constants/units.js'
import { getStatus, summarize } from '../status.js'
import { displayDate } from '../dateUtils.js'
import { buildPoints, computeMaxAbs, buildTicks, formatCompactTick } from '../chartData.js'

const SCALE = 2
const CARD_W = 360
const PAD = 16
const CONTENT_W = CARD_W - PAD * 2

const CARD_BG = '#0f172a'
const FONT = 'sans-serif'

const STATUS_BG = {
  normal: '#16a34a',
  oos:    '#dc2626',
  error:  '#ea580c',
  none:   '#475569',
}

const GROUP_BADGE = {
  red:   { label: 'RED',   bg: '#be123c' },
  white: { label: 'WHITE', bg: '#64748b' },
}

const OK_COLOR = '#16a34a'
const NG_COLOR = '#dc2626'
const GROUP_SHAPE = { red: 'circle', white: 'diamond' }
const GROUP_LABEL = { red: 'Red team', white: 'White team' }

// ---- layout constants (logical / CSS px, before SCALE) ----
const HEADER_TITLE_H = 18
const HEADER_DATE_GAP = 2
const HEADER_DATE_ROW_H = 14
const HEADER_H = HEADER_TITLE_H + HEADER_DATE_GAP + HEADER_DATE_ROW_H
const HEADER_MB = 8

const SUMMARY_GAP = 4
const SUMMARY_CARD_W = (CONTENT_W - SUMMARY_GAP * 3) / 4
const SUMMARY_CARD_H = 36
const SUMMARY_MB = 8

const CHART_W = CONTENT_W
const CHART_H = 160
const LEGEND_GAP = 8
const LEGEND_H = 14
const CHART_BLOCK_H = CHART_H + LEGEND_GAP + LEGEND_H
const CHART_MB = 8

const GRID_GAP = 2
const GRID_COLS = 4
const GRID_CELL_W = (CONTENT_W - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS
const GRID_CELL_PAD_X = 4
const GRID_CELL_PAD_Y = 3
const GRID_LABEL_H = 11
const GRID_LABEL_MB = 2
const GRID_PILL_H = 15
const GRID_CELL_H = GRID_CELL_PAD_Y * 2 + GRID_LABEL_H + GRID_LABEL_MB + GRID_PILL_H
const GRID_ROWS = Math.ceil(UNITS.length / GRID_COLS)
const GRID_H = GRID_ROWS * GRID_CELL_H + (GRID_ROWS - 1) * GRID_GAP
const GRID_MB = 8

const FOOTER_H = 12

const CONTENT_H =
  HEADER_H + HEADER_MB +
  SUMMARY_CARD_H + SUMMARY_MB +
  CHART_BLOCK_H + CHART_MB +
  GRID_H + GRID_MB +
  FOOTER_H

const CARD_H = PAD * 2 + CONTENT_H

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function fillRoundRect(ctx, x, y, w, h, r, color) {
  roundRectPath(ctx, x, y, w, h, r)
  ctx.fillStyle = color
  ctx.fill()
}

function drawText(ctx, str, x, y, { size, weight = 400, color, align = 'left', baseline = 'middle' }) {
  ctx.font = `${weight} ${size}px ${FONT}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = baseline
  ctx.fillText(str, x, y)
}

function drawHeader(ctx, { date, entries }, x, y) {
  drawText(ctx, 'Thermoholder Check Sheet', x, y + HEADER_TITLE_H / 2, {
    size: 15, weight: 700, color: '#f1f5f9', align: 'left',
  })

  const rowY = y + HEADER_TITLE_H + HEADER_DATE_GAP
  const rowCenterY = rowY + HEADER_DATE_ROW_H / 2

  ctx.font = `400 12px ${FONT}`
  const dateStr = displayDate(date)
  const dateW = ctx.measureText(dateStr).width
  drawText(ctx, dateStr, x, rowCenterY, { size: 12, color: '#cbd5e1', align: 'left' })

  let bx = x + dateW + 6
  entries.forEach(e => {
    const badge = GROUP_BADGE[e.group] ?? { label: String(e.group).toUpperCase(), bg: '#475569' }
    ctx.font = `700 10px ${FONT}`
    const textW = ctx.measureText(badge.label).width
    const boxW = textW + 12
    const boxH = 12
    fillRoundRect(ctx, bx, rowCenterY - boxH / 2, boxW, boxH, 4, badge.bg)
    drawText(ctx, badge.label, bx + boxW / 2, rowCenterY, { size: 10, weight: 700, color: '#fff', align: 'center' })
    bx += boxW + 6
  })
}

function drawSummary(ctx, counts, x, y) {
  const items = [
    ['Normal', counts.normal, '#16a34a'],
    ['OOS', counts.oos, '#dc2626'],
    ['Error', counts.error, '#ea580c'],
    ['Tdk Ada', counts.none, '#475569'],
  ]
  items.forEach(([label, count, color], i) => {
    const cx = x + i * (SUMMARY_CARD_W + SUMMARY_GAP)
    fillRoundRect(ctx, cx, y, SUMMARY_CARD_W, SUMMARY_CARD_H, 6, '#1e293b')
    const centerX = cx + SUMMARY_CARD_W / 2
    drawText(ctx, String(count), centerX, y + 4 + 9, { size: 18, weight: 700, color, align: 'center' })
    drawText(ctx, label, centerX, y + SUMMARY_CARD_H - 4 - 5, { size: 10, color: '#94a3b8', align: 'center' })
  })
}

function hexAlpha(hex, alpha) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}

function drawChart(ctx, entries, x0, y0) {
  const points = buildPoints(entries)
  const marginTop = 10, marginRight = 16, marginBottom = 8, marginLeft = 8
  const yAxisW = 28, xAxisH = 20

  const plotLeft = x0 + marginLeft + yAxisW
  const plotRight = x0 + CHART_W - marginRight
  const plotTop = y0 + marginTop
  const plotBottom = y0 + CHART_H - marginBottom - xAxisH
  const plotW = plotRight - plotLeft
  const plotH = plotBottom - plotTop
  const n = UNITS.length

  if (points.length === 0) {
    drawText(ctx, 'No data', x0 + CHART_W / 2, y0 + CHART_H / 2, { size: 12, color: '#64748b', align: 'center' })
    return { groupsPresent: [] }
  }

  const maxAbs = computeMaxAbs(points)
  const ticks = buildTicks(maxAbs)
  const mapY = v => plotTop + (maxAbs - v) / (2 * maxAbs) * plotH
  const mapX = i => plotLeft + (i + 0.5) * (plotW / n)

  const okTop = mapY(5), okBottom = mapY(-5)
  ctx.fillStyle = hexAlpha(OK_COLOR, 0.15)
  ctx.fillRect(plotLeft, okTop, plotW, okBottom - okTop)

  const ngUpperTop = mapY(maxAbs), ngUpperBottom = mapY(5)
  ctx.fillStyle = hexAlpha(NG_COLOR, 0.12)
  ctx.fillRect(plotLeft, ngUpperTop, plotW, ngUpperBottom - ngUpperTop)

  const ngLowerTop = mapY(-5), ngLowerBottom = mapY(-maxAbs)
  ctx.fillStyle = hexAlpha(NG_COLOR, 0.12)
  ctx.fillRect(plotLeft, ngLowerTop, plotW, ngLowerBottom - ngLowerTop)

  ctx.strokeStyle = '#1e293b'
  ctx.lineWidth = 1
  ticks.forEach(t => {
    const ty = mapY(t)
    ctx.beginPath()
    ctx.moveTo(plotLeft, ty)
    ctx.lineTo(plotRight, ty)
    ctx.stroke()
  })
  for (let i = 0; i <= n; i++) {
    const vx = plotLeft + i * (plotW / n)
    ctx.beginPath()
    ctx.moveTo(vx, plotTop)
    ctx.lineTo(vx, plotBottom)
    ctx.stroke()
  }

  ctx.strokeStyle = '#334155'
  ctx.beginPath()
  ctx.moveTo(plotLeft, plotBottom)
  ctx.lineTo(plotRight, plotBottom)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(plotLeft, plotTop)
  ctx.lineTo(plotLeft, plotBottom)
  ctx.stroke()

  ctx.save()
  ctx.setLineDash([3, 3])
  ctx.strokeStyle = '#334155'
  ctx.beginPath()
  ctx.moveTo(plotLeft, mapY(0))
  ctx.lineTo(plotRight, mapY(0))
  ctx.stroke()
  ctx.restore()

  drawText(ctx, 'OK', plotLeft + 4, (okTop + okBottom) / 2, { size: 10, color: '#86efac', align: 'left' })
  drawText(ctx, 'NG', plotLeft + 4, ngUpperTop + 8, { size: 10, color: '#fca5a5', align: 'left' })
  drawText(ctx, 'NG', plotLeft + 4, ngLowerBottom - 8, { size: 10, color: '#fca5a5', align: 'left' })

  UNITS.forEach((u, i) => {
    drawText(ctx, formatCompactTick(u.label), mapX(i), plotBottom + 12, { size: 8, color: '#94a3b8', align: 'center' })
  })
  ticks.forEach(t => {
    drawText(ctx, String(t), plotLeft - 4, mapY(t), { size: 10, color: '#94a3b8', align: 'right' })
  })

  const unitIndex = Object.fromEntries(UNITS.map((u, i) => [u.label, i]))
  points.forEach(p => {
    const cx = mapX(unitIndex[p.unit])
    const cy = mapY(p.value)
    const fill = p.status === 'normal' ? OK_COLOR : NG_COLOR
    ctx.fillStyle = fill
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 1
    if (GROUP_SHAPE[p.group] === 'diamond') {
      const r = 5
      ctx.beginPath()
      ctx.moveTo(cx, cy - r)
      ctx.lineTo(cx + r, cy)
      ctx.lineTo(cx, cy + r)
      ctx.lineTo(cx - r, cy)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  })

  const groupsPresent = [...new Set(points.map(p => p.group))]
  return { groupsPresent }
}

function drawLegend(ctx, groupsPresent, x, y) {
  let cx = x
  const cy = y + LEGEND_H / 2
  const swatch = (color, shape) => {
    ctx.fillStyle = color
    if (shape === 'diamond') {
      const r = 4
      ctx.beginPath()
      ctx.moveTo(cx + r, cy - r)
      ctx.lineTo(cx + r * 2, cy)
      ctx.lineTo(cx + r, cy + r)
      ctx.lineTo(cx, cy)
      ctx.closePath()
      ctx.fill()
    } else if (shape === 'circle') {
      ctx.beginPath()
      ctx.arc(cx + 4, cy, 4, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillRect(cx, cy - 4, 8, 8)
    }
    cx += 8 + 4
  }

  ctx.font = `400 10px ${FONT}`
  ctx.textBaseline = 'middle'

  swatch(OK_COLOR, 'square')
  drawText(ctx, 'OK (±5°C)', cx, cy, { size: 10, color: '#94a3b8', align: 'left' })
  cx += ctx.measureText('OK (±5°C)').width + 16

  swatch(NG_COLOR, 'square')
  drawText(ctx, 'NG', cx, cy, { size: 10, color: '#94a3b8', align: 'left' })
  cx += ctx.measureText('NG').width + 16

  if (groupsPresent.includes('red')) {
    swatch('#cbd5e1', 'circle')
    drawText(ctx, `${GROUP_LABEL.red} (circle)`, cx, cy, { size: 10, color: '#94a3b8', align: 'left' })
    cx += ctx.measureText(`${GROUP_LABEL.red} (circle)`).width + 16
  }
  if (groupsPresent.includes('white')) {
    swatch('#cbd5e1', 'diamond')
    drawText(ctx, `${GROUP_LABEL.white} (diamond)`, cx, cy, { size: 10, color: '#94a3b8', align: 'left' })
  }
}

function drawThGrid(ctx, entries, x0, y0) {
  UNITS.forEach((unit, idx) => {
    const col = idx % GRID_COLS
    const row = Math.floor(idx / GRID_COLS)
    const cx = x0 + col * (GRID_CELL_W + GRID_GAP)
    const cy = y0 + row * (GRID_CELL_H + GRID_GAP)

    fillRoundRect(ctx, cx, cy, GRID_CELL_W, GRID_CELL_H, 4, '#1e293b')
    drawText(ctx, unit.label, cx + GRID_CELL_PAD_X, cy + GRID_CELL_PAD_Y + GRID_LABEL_H / 2, {
      size: 9, weight: 600, color: '#e2e8f0', align: 'left',
    })

    const pillRowY = cy + GRID_CELL_PAD_Y + GRID_LABEL_H + GRID_LABEL_MB
    const innerW = GRID_CELL_W - GRID_CELL_PAD_X * 2
    const pillGap = 2
    const n = entries.length || 1
    const pillW = (innerW - pillGap * (n - 1)) / n

    entries.forEach((e, i) => {
      const { status, label } = getStatus(e.values?.[unit.id] ?? 'X')
      const px = cx + GRID_CELL_PAD_X + i * (pillW + pillGap)
      fillRoundRect(ctx, px, pillRowY, pillW, GRID_PILL_H, 3, STATUS_BG[status])
      drawText(ctx, label, px + pillW / 2, pillRowY + GRID_PILL_H / 2, {
        size: 9, color: '#fff', align: 'center',
      })
    })
  })
}

export function renderShareCardCanvas({ date, entries = [] }) {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W * SCALE
  canvas.height = CARD_H * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  ctx.fillStyle = CARD_BG
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const allVals = {}
  entries.forEach(e => {
    UNITS.forEach(u => { allVals[`${u.id}_${e.group}`] = e.values?.[u.id] ?? 'X' })
  })
  const counts = summarize(allVals)

  let y = PAD
  drawHeader(ctx, { date, entries }, PAD, y)
  y += HEADER_H + HEADER_MB

  drawSummary(ctx, counts, PAD, y)
  y += SUMMARY_CARD_H + SUMMARY_MB

  const { groupsPresent } = drawChart(ctx, entries, PAD, y)
  drawLegend(ctx, groupsPresent, PAD, y + CHART_H + LEGEND_GAP)
  y += CHART_BLOCK_H + CHART_MB

  drawThGrid(ctx, entries, PAD, y)
  y += GRID_H + GRID_MB

  drawText(ctx, `Quick Checker: ${QUICK_CHECKER_REF}°C | Standar: ±${STD_TOLERANCE}°C`, CARD_W / 2, y + FOOTER_H / 2, {
    size: 10, color: '#64748b', align: 'center',
  })

  return canvas
}
