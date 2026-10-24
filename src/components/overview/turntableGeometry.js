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
// The lance runs straight past the turntable's rim, then bends 35° down, so the
// temtip hangs outside the base.
const BEND_Y = -100
const DIP = (35 * Math.PI) / 180
const DOWN = [0, -Math.cos(DIP), -Math.sin(DIP)]
const END = [0, BEND_Y + DOWN[1] * 14, PZ + DOWN[2] * 14] // lance end, inside the temtip
const TEMTIP = 32
const CRADLES = [20, -55]
const POLE_R = 1.6

const ring = (r, z) => Array.from({ length: 24 }, (_, i) => [r * Math.cos((i * Math.PI) / 12), r * Math.sin((i * Math.PI) / 12), z])
const REACH = -BEND_Y + (14 + TEMTIP) * Math.cos(DIP)
const P0 = k.fitProjection([...ring(PLINTH_R, 0), ...ring(PLINTH_R, 64), ...ring(REACH, 12), ...ring(REACH, PZ + 4)], WIDTH, HEIGHT, { pad: 14, azimuth: A0 })

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

// A convex loft between two parallel quads (same vertex order): the tapered
// wedge between the contact block and the lance. Faces shaded by facing, like the kit.
function loft(a, b, P) {
  const view = G.viewOf(P)
  const centre = G.mul3([...a, ...b].reduce(G.add3, [0, 0, 0]), 1 / 8)
  const faces = [a, [...b].reverse(), ...a.map((_, i) => [a[i], b[i], b[(i + 1) % 4], a[(i + 1) % 4]])]
  const flat = (ring) => k.pathOf(ring.map((p) => k.iso(p, P)), true)
  const out = []
  const edges = []
  for (const face of faces) {
    let n = G.cross3(G.sub3(face[1], face[0]), G.sub3(face[2], face[0]))
    const mid = G.mul3(face.reduce(G.add3, [0, 0, 0]), 0.25)
    if (G.dot3(n, G.sub3(mid, centre)) < 0) n = G.mul3(n, -1)
    if (G.dot3(n, view) <= 1e-6) continue
    const up = G.unit3(n)[2] > 0.6
    out.push(up ? `<path class="iso-top" d="${flat(face)}"/>` : `<path class="iso-shade" data-shade="${Math.min(3, G.toneOf(n, P))}" d="${flat(face)}"/>`)
    edges.push(flat(face))
  }
  const hull = k.pathOf(G.hullOf([...a, ...b].map((p) => k.iso(p, P))), true)
  return `<g class="iso-solid"><path class="iso-fill" d="${hull}"/>${out.join('')}<path class="iso-line iso-crease" data-tone="faint" d="${edges.join('')}"/><path class="iso-line iso-edge" data-tone="hi" d="${hull}"/></g>`
}

const quad = (y, x, z0, z1) => [[-x, y, z0], [x, y, z0], [x, y, z1], [-x, y, z1]]

export function frameAt(angle, digital) {
  const P = { ...P0, azimuth: A0 + angle }
  const h = digital ? 32 : 30
  const z0 = PZ - h / 2
  const back = HY - (digital ? 9 : 8)
  const items = []
  const put = (point, svg) => items.push({ point, depth: k.depthOf(point, P), svg })

  CRADLES.forEach((yc) => put([0, yc, PZ - POLE_R], cradle(yc, P)))

  // Contact block: a square block on the back of the head, tapering in a wedge to the lance.
  const block = { x: -10, y: back - 7, w: 20, d: 7.2, r: 1 }
  put([0, back - 3.5, PZ], S(k.slabOf(block, PZ - 9, 18, P, 2, 0.4), { tone: 'hi', crease: 'lo', inner: L(k.sideSeam(block, PZ - 6.5, P, 2), { tone: 'faint' }) }))
  const taperEnd = back - 25
  put([0, back - 14, PZ], loft(quad(back - 7, 9, PZ - 6, PZ + 8), quad(taperEnd, 2.4, PZ - 2.4, PZ + 2.4), P))

  // Lance: straight steel tube past the rim, then a 35° bend down to the probe end.
  const from = taperEnd + 1
  const route = G.fillet([[0, from, PZ], [0, BEND_Y, PZ], END], 12, 9)
  const pieces = tubePieces(route, POLE_R, P, {
    maxLength: 14,
    caps: false,
    breaks: CRADLES.flatMap((yc) => [from - (yc + 3), from - (yc - 3)]),
  })
  pieces.forEach((piece) => put(piece.mid, tubeSvg(piece, { tone: 'hi' })))

  // Temtip: the disposable immersion probe, a thick cardboard tube pushed over the
  // lance end, flat where the lance enters and rounded at the end that is dipped,
  // its off-white skin speckled with splashed slag.
  const F = G.frameAlong(END, DOWN)
  const along = (s) => G.add3(END, G.mul3(DOWN, s))
  const tip = TEMTIP - 3
  const speckles = Array.from({ length: 11 }, (_, i) => 3 + i * 2.4).flatMap((s, i) =>
    G.dotsOf(F, s, 4.7, 5 + (i % 3), P, { phase: (i * 2.39) % 6.28, fade: [0.04, 0.42] }),
  )
  put(along(tip / 2), `<g class="th-card">${S(G.solidOf([[-3, 4.7], [tip - 2.4, 4.7, 1], [tip - 0.6, 3.6, 1], [tip, 1.4, 1], [tip + 0.15, 0]], F, P), {
    tone: 'hi',
    crease: 'none',
    inner: L(G.arcOf(F, -1.8, 4.7, P), { tone: 'lo' }),
  })}${k.dotsSvg(speckles, { size: 0.42, tone: 'hi' })}</g>`)

  // Parts hanging past the rim on the far side are hidden behind the turntable.
  const view = k.towardViewer(P)
  const behind = (p) => Math.hypot(p[0], p[1]) > PLATTER_R - 2 && p[0] * view[0] + p[1] * view[1] < 0
  items.sort((a, b) => a.depth - b.depth)
  const join = (list) => list.map((item) => item.svg).join('')
  const hidden = join(items.filter((item) => behind(item.point)))
  const rest = join(items.filter((item) => !behind(item.point)))

  const head = handleSvg(0, HY, z0, P) + (digital ? digitalSvg : manualSvg)(0, HY, z0, P)
  // Seen from the display side the whole lance is behind the head; from the back it is all in front.
  const frontOn = view[1] > 0
  return {
    before: hidden + base(P) + (frontOn ? rest : '') + head,
    after: frontOn ? '' : rest,
    face: faceMatrix(0, HY, z0, digital, P),
    faceOn: frontOn,
  }
}
