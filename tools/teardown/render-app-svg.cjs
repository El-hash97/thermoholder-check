#!/usr/bin/env node
// Writes the labelled parts sheets the app shows in the thermoholder detail
// dialog, from the same model the viewer page uses. Run: node render-app-svg.cjs
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {RUNTIME, load} = require('./scripts/config.cjs');

const OUT = path.resolve(__dirname, '../../src/components/overview/teardown');
const INK = '#202020';

const {config, modelScripts} = load(path.join(__dirname, 'drawing.json'));
const context = {console, structuredClone};
context.self = context;
vm.createContext(context);
for (const file of [...RUNTIME, ...modelScripts]) vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename: file});
const SHEET = context.TechnicalSheet;

const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const sheet = (markup, title, [x, y, w, h]) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}" width="${w.toFixed(1)}mm" height="${h.toFixed(1)}mm" role="img">`
  + `<title>${escape(title)}</title>`
  + `<style>path{fill:none;stroke:${INK};stroke-linejoin:round}${SHEET.css('technical')}`
  + `[data-ink-fill]{fill:${INK};stroke:none}[data-annotation]{font-family:ui-sans-serif,system-ui,"Segoe UI",Arial,sans-serif;font-weight:600;letter-spacing:.02em}</style>`
  + `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="#fff"/>${markup}</svg>`;

// Every x,y pair the ink passes through, for the label lanes and the crop.
function inkPoints(markup) {
  const points = [];
  for (const [, d] of markup.matchAll(/ d="([^"]*)"/g)) {
    const numbers = d.match(/-?\d*\.?\d+(?:e-?\d+)?/g)?.map(Number) ?? [];
    for (let i = 0; i + 1 < numbers.length; i += 2) points.push([numbers[i], numbers[i + 1]]);
  }
  return points;
}

// Hand-laid label lanes: head parts on the left, the case, contact block, taper
// and lance on a lane above (vertical leaders), the temtip on the right.
const SIZE = 5.4, GAP = 10;
const textWidth = (name) => name.length * SIZE * 0.66;
function labels(anchors, ink) {
  const minX = Math.min(...ink.map(p => p[0])), maxX = Math.max(...ink.map(p => p[0])), minY = Math.min(...ink.map(p => p[1]));
  const out = [];
  const line = (pts) => `<path data-line-role="detail" fill="none" d="M${pts.map(p => p.map(n => n.toFixed(2)).join(' ')).join('L')}"/>`;
  const dot = ([x, y]) => `<circle data-ink-fill="" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r=".6"/>`;
  const text = (x, y, name, anchor) => `<text data-ink-fill="" data-annotation="" x="${x.toFixed(2)}" y="${(y + SIZE * .35).toFixed(2)}" font-size="${SIZE}" text-anchor="${anchor}">${escape(name.toUpperCase())}</text>`;
  const boxes = [];

  for (const [lane, dir] of [['left', -1], ['right', 1]]) {
    const list = anchors.filter(a => a.lane === lane).sort((a, b) => a.at[1] - b.at[1]);
    const ys = list.map(a => a.at[1]);
    for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + GAP);
    const column = dir < 0 ? Math.min(...list.map(a => a.at[0])) - 22 : Math.max(...list.map(a => a.at[0])) + 22;
    list.forEach((a, i) => {
      const elbow = column - dir * 5;
      out.push(line([a.at, [elbow, ys[i]], [column, ys[i]]]), dot(a.at), text(column + dir * 1.5, ys[i], a.name, dir < 0 ? 'end' : 'start'));
      const w = textWidth(a.name);
      boxes.push(dir < 0 ? [column - 1.5 - w, ys[i] - SIZE, column, ys[i] + SIZE] : [column, ys[i] - SIZE, column + 1.5 + w, ys[i] + SIZE]);
    });
  }

  // Top lane: staggered rows above the ink, leaders straight up from each anchor.
  const top = anchors.filter(a => a.lane === 'top').sort((a, b) => a.at[0] - b.at[0]);
  let lastRight = [-Infinity, -Infinity];
  top.forEach((a) => {
    const w = textWidth(a.name);
    const row = a.at[0] - w / 2 < lastRight[0] + 3 ? 1 : 0;
    const y = minY - 10 - row * GAP;
    lastRight[row] = a.at[0] + w / 2;
    if (row === 0) lastRight[1] = Math.max(lastRight[1], -Infinity);
    out.push(line([a.at, [a.at[0], y + 1.6]]), dot(a.at), text(a.at[0], y - 0.6, a.name, 'middle'));
    boxes.push([a.at[0] - w / 2, y - 0.6 - SIZE, a.at[0] + w / 2, y + SIZE]);
  });
  return {markup: `<g data-annotations="">${out.join('')}</g>`, boxes};
}

fs.mkdirSync(OUT, {recursive: true});
for (const drawing of config.drawings) {
  for (const [view, explosion] of [['exploded', 1], ['assembled', 0]]) {
    const result = context.DrawingModels[drawing.id]({}, {explosion, fitExplosion: explosion, isolated: null, fill: false, annotate: false, anchors: true});
    const ink = inkPoints(result.markup);
    // Assembled, the contact block and taper hide behind the case, so only the exploded sheet is labelled.
    const {markup, boxes} = explosion ? labels(result.anchors, ink) : {markup: '', boxes: []};
    const xs = [...ink.map(p => p[0]), ...boxes.flatMap(b => [b[0], b[2]])], ys = [...ink.map(p => p[1]), ...boxes.flatMap(b => [b[1], b[3]])];
    const pad = 6, x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, w = Math.max(...xs) + pad - x0, h = Math.max(...ys) + pad - y0;
    const file = path.join(OUT, `${drawing.id}-${view}.svg`);
    fs.writeFileSync(file, sheet(result.markup + markup, `${drawing.title}, ${view} (illustrative concept)`, [x0, y0, w, h]));
    console.log(path.relative(process.cwd(), file), `${w.toFixed(0)}×${h.toFixed(0)} mm`);
  }
}
