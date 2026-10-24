// One thermoholder with its lance lying in two cradles on a turntable.
// The turn is drawn as the kit camera orbiting the turntable's axis, so every
// frame rebuilds the paths at azimuth A0 + angle. Origin = turntable centre.
import * as k from './iso/iso-kit.mjs'
import * as G from './iso/lathe.mjs'
import { tubePieces, tubeSvg } from './iso/tube.mjs'
import { handleSvg, manualSvg, digitalSvg, faceMatrix } from './holderGeometry.js'

export const WIDTH = 640
export const HEIGHT = 420
const A0 = 62

const PLINTH_R = 96
const PLATTER_R = 90
const TOP = 10
const PZ = 44 // lance axis height
const HY = 62 // head plan centre (y)
const TIP_Y = -70 // where the lance meets the contact block
const CRADLES = [20, -40]
const POLE_R = 1.6

const ring = (r, z) => Array.from({ length: 24 }, (_, i) => [r * Math.cos((i * Math.PI) / 12), r * Math.sin((i * Math.PI) / 12), z])
const P0 = k.fitProjection([...ring(PLINTH_R, 0), ...ring(PLINTH_R, 64)], WIDTH, HEIGHT, { pad: 18, azimuth: A0 })

const S = (paths, style) => k.solidSvg(paths, style)
const L = (d, style) => k.lineSvg(d, style)

function base(P) {
  const at = (p) => k.iso(p, P)
  const out = [`<path class="iso-halo" d="${k.cylinder(0, 0, PLINTH_R, 0, 6, P, 72).fill}"/>`]
  out.push(S(k.cylinder(0, 0, PLINTH_R, 0, 6, P, 96, 0.8), { tone: 'mid', crease: 'lo' }))
  out.push(S(k.cylinder(0, 0, PLATTER_R, 6, TOP - 6, P, 96, 0.8), { tone: 'mid', crease: 'lo', inner: L(k.sideArc(0, 0, PLATTER_R, 8, P, 72), { tone: 'faint' }) }))
  out.push(L(k.ring(0, 0, PLATTER_R - 10, TOP, P, 96), { tone: 'faint' }))
  const ticks = k.radialTicks(0, 0, PLATTER_R - 1.2, 72, 6, TOP, [1.4, 3.2], P)
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }))
  out.push(L(k.lineOnTop([0, PLATTER_R - 1.2], [0, PLATTER_R - 6], TOP, P), { tone: 'hi' }))
  out.push(S(k.cylinder(0, 0, 6, TOP, 1.2, P, 32, 0.4), { tone: 'mid' }))
  out.push(k.dotsSvg(k.circleRing(0, 0, 4, 6).map(([x, y]) => at([x, y, TOP + 1.2])), { size: 0.45 }))
  // Fixed index on the plinth: always faces the viewer, so the turn reads against it.
  const [vx, vy] = k.towardViewer(P)
  out.push(L(k.lineOnTop([vx * (PLATTER_R + 1), vy * (PLATTER_R + 1)], [vx * (PLINTH_R - 0.8), vy * (PLINTH_R - 0.8)], 6, P), { tone: 'lit' }))
  return out.join('')
}

function cradle(yc, P) {
  const saddleTop = PZ - POLE_R
  const foot = { x: -6, y: yc - 5, w: 12, d: 10, r: 1 }
  return [
    S(k.slabOf(foot, TOP, 1.2, P, 2, 0.3), { tone: 'mid' }),
    k.dotsSvg(k.corners(foot, 1.8).map((p) => k.iso([p[0], p[1], TOP + 1.2], P)), { size: 0.4 }),
    S(k.slabOf({ x: -2, y: yc - 2, w: 4, d: 4, r: 0.5 }, TOP + 1.2, saddleTop - 3 - TOP - 1.2, P, 2), { tone: 'mid' }),
    S(k.slabOf({ x: -5, y: yc - 3, w: 10, d: 6, r: 0.8 }, saddleTop - 3, 3, P, 2, 0.3), { tone: 'mid' }),
    L(k.lineOnTop([-5, yc], [5, yc], saddleTop, P), { tone: 'faint' }),
  ].join('')
}

export function frameAt(angle, digital) {
  const P = { ...P0, azimuth: A0 + angle }
  const h = digital ? 32 : 30
  const z0 = PZ - h / 2
  const back = HY - (digital ? 9 : 8)
  const items = []
  const put = (point, svg) => items.push({ depth: k.depthOf(point, P), svg })

  CRADLES.forEach((yc) => put([0, yc, PZ - POLE_R], cradle(yc, P)))
  const neck = G.frameAlong([0, back, PZ], [0, -1, 0])
  put([0, back - 5, PZ], S(G.solidOf([[0, 8], [5, 5, 1], [9, 3.2], [12, 3.2]], neck, P), { tone: 'mid', crease: 'none' }))
  const from = back - 11
  const pieces = tubePieces([[0, from, PZ], [0, TIP_Y - 1, PZ]], POLE_R, P, {
    maxLength: 16,
    caps: false,
    breaks: CRADLES.flatMap((yc) => [from - (yc + 3), from - (yc - 3)]),
  })
  pieces.forEach((piece) => put(piece.mid, tubeSvg(piece, { tone: 'hi' })))
  const tip = G.frameAlong([0, TIP_Y, PZ], [0, -1, 0])
  put([0, TIP_Y - 8, PZ], S(G.solidOf([[0, 2.6], [7, 2.6], [8, 3.4], [15, 3.4], [17, 2.2, 1]], tip, P), { tone: 'mid', crease: 'none', inner: L(G.arcOf(tip, 11.5, 3.4, P), { tone: 'faint' }) }))
  items.sort((a, b) => a.depth - b.depth)
  const rest = items.map((item) => item.svg).join('')

  const head = handleSvg(0, HY, z0, P) + (digital ? digitalSvg : manualSvg)(0, HY, z0, P)
  // Seen from the display side the whole lance is behind the head; from the back it is all in front.
  const frontOn = k.towardViewer(P)[1] > 0
  return {
    before: base(P) + (frontOn ? rest : '') + head,
    after: frontOn ? '' : rest,
    face: faceMatrix(0, HY, z0, digital, P),
    faceOn: frontOn,
  }
}
