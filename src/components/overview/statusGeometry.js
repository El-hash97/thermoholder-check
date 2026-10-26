// Static geometry for the Overview status UI: the contact-block KPI card, and
// a stand that holds just the holders in one status.
import * as k from './iso/iso-kit.mjs'
import { UNITS } from '../../constants/units.js'
import { handleSvg, manualSvg, digitalSvg, faceMatrix } from './holderGeometry.js'
import { loft, quad } from './turntableGeometry.js'
import { tubePieces, tubeSvg } from './iso/tube.mjs'

const S = (paths, style) => k.solidSvg(paths, style)
const L = (d, style) => k.lineSvg(d, style)

// ---------- KPI card: a holder's contact block, display on its face ----------

const BLOCK = { x: -17, y: -11, w: 34, d: 11, r: 1.2 }
const BLOCK_H = 26
const STUB = [[0, -28, 13], [0, -40, 13]]

function kpiBlock() {
  const width = 200
  const height = 130
  const P = k.fitProjection([...k.boxCorners(BLOCK, 0, BLOCK_H), STUB[1]], width, height, { pad: 8, azimuth: 62 })
  const body = [
    `<path class="iso-halo" d="${k.haloOf(k.insetPlan(BLOCK, 2), 0, 2, P)}"/>`,
    ...tubePieces(STUB, 1.8, P, { maxLength: 40, caps: [false, true] }).map((piece) => tubeSvg(piece, { tone: 'hi' })),
    loft(quad(BLOCK.y, 15, 2, 24), quad(STUB[0][1], 2.6, 10.4, 15.6), P),
    '<g class="th-steel">',
    S(k.slabOf(BLOCK, 0, BLOCK_H, P, 3, 0.7), { tone: 'hi', crease: 'lo', inner: L(k.sideSeam(BLOCK, 2.4, P, 3), { tone: 'faint' }) }),
    k.dotsSvg(k.corners(BLOCK, 2.2).map((p) => k.iso([p[0], p[1], BLOCK_H], P)), { size: 0.4 }),
    S(k.slabOf({ x: -16, y: -0.2, w: 32, d: 0.8, r: 0.5 }, 1, BLOCK_H - 2, P, 2, 0.3), { tone: 'mid', crease: 'none' }),
    '</g>',
  ].join('')
  return { width, height, body, face: k.sideMatrix([BLOCK.x, 0.6], BLOCK_H, P, 'left') }
}

export const KPI = kpiBlock()

// ---------- Status stand: only the holders in one status ----------

const PITCH = 34
const PLATE_Z = 4
const STEP_Z = 26 // the raised back step, so back displays clear the front row
const WIDTH = 640
const HEIGHT = 360

function collar(cx, cy, z, P) {
  return S(k.cylinder(cx, cy + 3, 6, z, 3, P, 24, 0.4), { tone: 'mid' })
}

const cache = new Map()

// Units in sheet order. Up to 8 in one row; more go on two rows, the first half
// on the raised back step.
export function groupFigure(ids) {
  const key = ids.join(',')
  if (cache.has(key)) return cache.get(key)
  const units = UNITS.filter((u) => ids.includes(u.id))
  const two = units.length > 8
  const perRow = two ? Math.ceil(units.length / 2) : units.length
  const span = Math.max(perRow, 4) * PITCH
  const rows = two ? [units.slice(0, perRow), units.slice(perRow)] : [units]
  const rowSpec = two ? [{ cy: -34, s: STEP_Z }, { cy: 0, s: PLATE_Z }] : [{ cy: 0, s: PLATE_Z }]
  const plate = { x: -span / 2 - 10, y: two ? -56 : -20, w: span + 20, d: two ? 78 : 42, r: 4 }
  const step = { x: plate.x + 4, y: -50, w: plate.w - 8, d: 30, r: 2 }
  const tops = [...k.boxCorners(plate, 0, PLATE_Z)]
  rows.forEach((row, r) => tops.push([-span / 2, rowSpec[r].cy - 9, rowSpec[r].s + 15 + 32], [span / 2, rowSpec[r].cy - 9, rowSpec[r].s + 15 + 32]))
  const P = k.fitProjection(tops, WIDTH, HEIGHT, { pad: 20, azimuth: 70 })

  const base = [
    `<path class="iso-halo" d="${k.haloOf(plate, 0, PLATE_Z, P)}"/>`,
    S(k.slabOf(plate, 0, PLATE_Z, P, 6, 1), { tone: 'mid', crease: 'lo', inner: L(k.sideSeam(plate, 1.2, P, 6), { tone: 'faint' }) }),
    L(k.planOutline(k.insetPlan(plate, 4), PLATE_Z, P, 4), { tone: 'lo' }),
    k.dotsSvg(k.corners(plate, 2.4).map((p) => k.iso([p[0], p[1], PLATE_Z], P)), { size: 0.5 }),
    two ? S(k.slabOf(step, PLATE_Z, STEP_Z - PLATE_Z, P, 3, 0.6), { tone: 'mid', crease: 'lo' }) : '',
  ].join('')

  const holders = rows.flatMap((row, r) => {
    const { cy, s } = rowSpec[r]
    const start = -((row.length - 1) * PITCH) / 2
    return row.map((unit, i) => {
      const cx = start + i * PITCH
      const z0 = s + 3 + 15
      const digital = unit.type === 'Digital'
      return {
        ...unit,
        tag: unit.id === 'TH_Master' ? 'MASTER' : unit.id.replace('TH', ''),
        digital,
        row: r,
        body: collar(cx, cy, s, P) + handleSvg(cx, cy, z0, P) + (digital ? digitalSvg : manualSvg)(cx, cy, z0, P),
        face: faceMatrix(cx, cy, z0, digital, P),
        depth: k.depthOf([cx, cy, z0], P),
      }
    })
  })
  holders.sort((a, b) => a.row - b.row || a.depth - b.depth)
  const figure = { width: WIDTH, height: HEIGHT, base, holders }
  cache.set(key, figure)
  return figure
}
