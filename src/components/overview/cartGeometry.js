// Static isometric geometry for the Overview figure: a two-tier QC cart carrying
// the 16 thermoholders. Built once at module load; React only places it.
import * as k from './iso/iso-kit.mjs'
import * as G from './iso/lathe.mjs'
import { UNITS } from '../../constants/units.js'
import { handleSvg, manualSvg, digitalSvg, faceMatrix } from './holderGeometry.js'

export const WIDTH = 640
export const HEIGHT = 380

const PITCH = 34
const FRONT = { cy: 0, z: 40 }
const BACK = { cy: -32, z: 66 }
const DECK = { x: -152, y: -58, w: 316, d: 80, r: 4 }
const DECK_Z = 16
const DECK_H = 4
const DECK_TOP = DECK_Z + DECK_H
const BAR_X = [-148, 148]
const LIFT = 7

// Back tier left to right: TH9–TH12, MASTER, TH13–TH15. Front tier: TH1–TH8.
const BACK_IDS = ['TH9', 'TH10', 'TH11', 'TH12', 'TH_Master', 'TH13', 'TH14', 'TH15']
const FRONT_IDS = ['TH1', 'TH2', 'TH3', 'TH4', 'TH5', 'TH6', 'TH7', 'TH8']
const slotX = (i) => -119 + i * PITCH

const P = k.fitProjection(
  [
    ...k.boxCorners(DECK, 0, DECK_TOP),
    [BAR_X[0], BACK.cy - 9, BACK.z + 32 + LIFT],
    [BAR_X[1] + 6, -50, 96],
    [slotX(7) + 15, BACK.cy - 9, BACK.z + 32 + LIFT],
  ],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 70 },
)

const at = (point) => k.iso(point, P)
const S = (paths, style) => k.solidSvg(paths, style)
const L = (d, style) => k.lineSvg(d, style)
const D = (points, style) => k.dotsSvg(points, style)
const halo = (plan, z, h) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"/>`
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))

// ---------- cart ----------

function caster(x, y) {
  const out = []
  const plate = { x: x - 6, y: y - 6, w: 12, d: 12, r: 1.5 }
  out.push(S(G.disc(-2.6, 2.6, 6.2, G.frameAlong([x, y, 6.2], [1, 0, 0]), P), { tone: 'lo', crease: 'none' }))
  out.push(L(G.circleOf(G.frameAlong([x + 2.6, y, 6.2], [1, 0, 0]), 0, 2.4, P, 28), { tone: 'mid' }))
  out.push(D([at([x + 2.7, y, 6.2])], { size: 0.6, tone: 'mid' }))
  for (const side of [-1, 1]) {
    out.push(S(k.slabOf({ x: x + side * 3.4 - 0.6, y: y - 2.5, w: 1.2, d: 5, r: 0.4 }, 5.6, 7.4, P, 2), { tone: 'mid', crease: 'none' }))
  }
  out.push(S(k.cylinder(x, y, 2.4, 13, 1.6, P, 18), { tone: 'mid' }))
  out.push(S(k.slabOf(plate, 14.6, 1.4, P, 3, 0.3), { tone: 'mid' }))
  return out.join('')
}

function deck() {
  const out = [halo(DECK, 0, DECK_TOP)]
  byDepth(k.corners(DECK, 16)).forEach(([x, y]) => out.push(caster(x, y)))
  out.push(S(k.slabOf(DECK, DECK_Z, DECK_H, P, 6, 1), { tone: 'mid', crease: 'lo', inner: L(k.sideSeam(DECK, DECK_Z + 1, P, 6), { tone: 'faint' }) }))
  // Expanded-metal tray: grid lines run edge to edge inside the inset rim.
  const rim = k.insetPlan(DECK, 5)
  out.push(L(k.planOutline(rim, DECK_TOP, P, 4), { tone: 'lo' }))
  const grid = []
  for (let x = rim.x + 7; x < rim.x + rim.w - 3; x += 7) grid.push(k.lineOnTop([x, rim.y], [x, rim.y + rim.d], DECK_TOP, P))
  for (let y = rim.y + 7; y < rim.y + rim.d - 3; y += 7) grid.push(k.lineOnTop([rim.x, y], [rim.x + rim.w, y], DECK_TOP, P))
  out.push(L(grid.join(''), { tone: 'faint' }))
  out.push(D(k.corners(DECK, 2.6).map((p) => at([p[0], p[1], DECK_TOP])), { size: 0.5 }))
  // Engraved plate on the deck's front edge.
  out.push(k.faceTextSvg(k.sideMatrix([-20, DECK.y + DECK.d], DECK_Z + 3, P, 'left'), 'QC THERMOHOLDER CART', { size: 1.9, tone: 'lo', anchor: 'middle' }))
  // Spare lance tubes lying in the tray, behind the front tier.
  for (const [y, x0, x1] of [[-50, -128, -40], [-46, -20, 70]]) {
    const F = G.frameAlong([x0, y, DECK_TOP + 2], [1, 0, 0])
    out.push(S(G.disc(0, x1 - x0, 2, F, P), { tone: 'mid', crease: 'none' }))
    out.push(S(G.disc(x1 - x0, x1 - x0 + 6, 2.3, F, P), { tone: 'lo', crease: 'none' }))
  }
  return out.join('')
}

// A square tube bar along x carrying one tier, with a post under each end.
function tier({ cy, z }) {
  const out = []
  const bar = { x: BAR_X[0] - 2.5, y: cy - 8, w: BAR_X[1] - BAR_X[0] + 5, d: 6, r: 0.8 }
  for (const x of BAR_X) {
    const post = { x: x - 2.5, y: cy - 7.5, w: 5, d: 5, r: 0.6 }
    out.push(S(k.slabOf(k.insetPlan(post, -1.2), DECK_TOP, 1.2, P, 2), { tone: 'mid' }))
    out.push(S(k.slabOf(post, DECK_TOP + 1.2, z - 4 - DECK_TOP - 1.2, P, 2, 0.3), { tone: 'mid' }))
  }
  out.push(S(k.slabOf(bar, z - 4, 4, P, 2, 0.4), { tone: 'mid' }))
  const bolts = []
  for (let i = 0; i < 8; i++) bolts.push(at([slotX(i) - 11, cy - 5, z]), at([slotX(i) + 11, cy - 5, z]))
  out.push(D(bolts, { size: 0.42 }))
  return out.join('')
}

function sideRail(x) {
  const rail = { x: x - 2.5, y: BACK.cy - 2.5, w: 5, d: FRONT.cy - BACK.cy - 5, r: 0.6 }
  return S(k.slabOf(rail, FRONT.z - 14, 3, P, 2, 0.3), { tone: 'mid' })
}

function handle() {
  const x = BAR_X[1] + 7
  const out = []
  for (const y of [-50, -16]) {
    out.push(S(k.cylinder(x, y, 3.2, DECK_TOP, 1.4, P, 18), { tone: 'mid' }))
    out.push(S(k.cylinder(x, y, 1.9, DECK_TOP + 1.4, 90 - DECK_TOP - 1.4, P, 18), { tone: 'mid', crease: 'none' }))
  }
  const F = G.frameAlong([x, -53, 91.5], [0, 1, 0])
  out.push(S(G.disc(0, 40, 1.9, F, P), { tone: 'mid', crease: 'none' }))
  out.push(S(G.disc(9, 31, 2.6, F, P), { tone: 'lo', crease: 'none', inner: L(G.ribsOf(F, 9, 31, 2.6, 18, P, { seams: true }), { tone: 'faint' }) }))
  return out.join('')
}

// ---------- holders ----------

function holder(id, row, i) {
  const unit = UNITS.find((u) => u.id === id)
  const cx = slotX(i)
  const { cy, z } = row
  const digital = unit.type === 'Digital'
  const head = digital ? digitalSvg : manualSvg
  const body = (lit) => handleSvg(cx, cy, z, P) + head(cx, cy, z, P, lit)
  const face = faceMatrix(cx, cy, z, digital, P)
  const [lx, ly] = k.axisVector(P, [0, 0, LIFT])
  return {
    ...unit,
    tag: id === 'TH_Master' ? 'MASTER' : id.replace('TH', ''),
    digital,
    body: body(false),
    bodyLit: body(true),
    face,
    lift: `translate(${lx.toFixed(2)}px, ${ly.toFixed(2)}px)`,
    depth: k.depthOf([cx, cy, z], P),
  }
}

const place = (ids, row) => ids.map((id, i) => holder(id, row, i)).sort((a, b) => a.depth - b.depth)

export const BACK_HOLDERS = place(BACK_IDS, BACK)
export const FRONT_HOLDERS = place(FRONT_IDS, FRONT)

export const LAYERS = {
  base: deck() + sideRail(BAR_X[0]) + tier(BACK),
  middle: tier(FRONT),
  top: sideRail(BAR_X[1]) + handle(),
}
