// One thermoholder head, built for any projection P. Shared by the cart figure
// and the turntable detail figure. The head is a box whose display faces +y;
// (cx, cy) is its plan centre and z the underside of the box.
import * as k from './iso/iso-kit.mjs'

const S = (paths, style) => k.solidSvg(paths, style)
const L = (d, style) => k.lineSvg(d, style)

export function handleSvg(cx, cy, z, P) {
  return [
    S(k.cylinder(cx, cy + 3, 3.8, z - 15, 15, P, 22), { tone: 'lo', crease: 'none', inner: L(k.sideArc(cx, cy + 3, 3.8, z - 11, P, 14), { tone: 'faint' }) }),
    S(k.cylinder(cx, cy + 3, 4.8, z - 1.6, 1.6, P, 24), { tone: 'mid' }),
  ].join('')
}

// `faceOut` slides the face plate forward (+y) off the case, for the exploded view.
export function manualSvg(cx, cy, z, P, lit = false, faceOut = 0) {
  const box = { x: cx - 14, y: cy - 8, w: 28, d: 16, r: 1.4 }
  const plate = { x: cx - 13, y: cy + 7.8 + faceOut, w: 26, d: 1, r: 0.5 }
  const top = z + 30
  return [
    '<g class="th-steel">',
    S(k.slabOf(box, z, 30, P, 3, 0.7), { tone: 'hi', crease: 'lo', lit, inner: L(k.sideSeam(box, z + 2.4, P, 3), { tone: 'faint' }) }),
    k.dotsSvg(k.corners(box, 2.4).map((p) => k.iso([p[0], p[1], top], P)), { size: 0.4 }),
    S(k.cylinder(cx + 6, cy - 3, 1.8, top, 1.6, P, 16), { tone: 'mid' }),
    k.towardViewer(P)[1] > 0 ? S(k.slabOf(plate, z + 1, 28, P, 2, 0.3), { tone: 'mid', crease: 'none', lit }) : '',
    '</g>',
  ].join('')
}

export function digitalSvg(cx, cy, z, P, lit = false, faceOut = 0) {
  const box = { x: cx - 15, y: cy - 9, w: 30, d: 18, r: 3.6 }
  const plate = { x: cx - 13.5, y: cy + 8.8 + faceOut, w: 27, d: 0.9, r: 0.8 }
  return [
    '<g class="th-rubber">',
    S(k.slabOf(box, z, 32, P, 5, 1.2), { tone: 'hi', crease: 'lo', lit, inner: L(k.sideSeam(box, z + 3, P, 5), { tone: 'faint' }) }),
    k.towardViewer(P)[1] > 0 ? S(k.slabOf(plate, z + 1.5, 29, P, 3, 0.3), { tone: 'mid', crease: 'none', lit }) : '',
    '</g>',
  ].join('')
}

// Face plane: local (u, v) = (x from the box's left edge, depth below its top), in world units.
export function faceMatrix(cx, cy, z, digital, P) {
  return digital
    ? k.sideMatrix([cx - 15, cy + 9.7], z + 32, P, 'left')
    : k.sideMatrix([cx - 14, cy + 8.8], z + 30, P, 'left')
}
