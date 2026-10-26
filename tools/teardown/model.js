// Thermoholder parts breakdown, one model for the manual and the digital head.
// World: z up; the lance runs along +x from the back of the head; the display
// faces -x. Units about 5 mm (concept). See evidence.md for what is estimated.
self.DrawingModels ??= {};

(() => {
  const G = TechnicalGeometry;
  const CAMERA = {azimuth: -130, elevation: 22, roll: 0};
  const DIP = 35 * Math.PI / 180;
  const D = [Math.cos(DIP), 0, -Math.sin(DIP)]; // lance end direction after the bend
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const mul = (a, k) => a.map(v => v * k);

  // Face features use the app's face coordinates: u right, v down from the
  // top-left of the box front. Seen from the front, world +y runs to the left.
  const faceAt = (W, H) => (u, v, x) => [x, W / 2 - u, H / 2 - v];
  const faceBox = (p, at, [u0, v0, u1, v1], [x0, x1]) => {
    const a = at(u0, v0, x0), b = at(u1, v1, x1);
    G.box(p, [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])], [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])]);
  };
  const faceRect = (p, at, [u0, v0, u1, v1], x) =>
    G.polyline(p, [at(u0, v0, x), at(u1, v0, x), at(u1, v1, x), at(u0, v1, x)], {closed: true, role: 'detail'});
  const dots = (p, at, points, r, x) => points.forEach(([u, v]) => G.circle(p, at(u, v, x), r, [-1, 0, 0], {role: 'detail', segments: 36}));

  // A turned part along any axis: lathe on local x, then a rigid frame (x = axis, y = world y).
  function lathed(id, name, profile, origin, axis, options = {}) {
    const p = G.part(id, name);
    const zAxis = [-axis[2], 0, axis[0]]; // axis × [0, 1, 0], for axes in the xz plane
    G.merge(p, G.transform(G.lathe(G.piece(), profile, options), {origin, xAxis: axis, yAxis: [0, 1, 0], zAxis}));
    return p;
  }

  function head(digital) {
    const W = digital ? 30 : 28, H = digital ? 32 : 30, depth = digital ? 18 : 16;
    const plateT = digital ? 0.9 : 1;
    const at = faceAt(W, H);
    const parts = [];

    const caseP = G.part('case', digital ? 'Rubber housing' : 'Stainless case');
    G.box(caseP, [0, -W / 2, -H / 2], [depth, W / 2, H / 2], {radius: digital ? 3.6 : 1.4});
    if (!digital) {
      G.merge(caseP, G.transform(G.lathe(G.piece(), [[0, 0], [0, 1.8], [1.6, 1.8], [1.6, 0]]), {origin: [depth - 4, -6, H / 2 - 0.05], ...G.along('z')}));
      for (const [x, y] of [[2.4, 11.6], [2.4, -11.6], [depth - 2.4, 11.6], [depth - 2.4, -11.6]]) G.circle(caseP, [x, y, H / 2 + 0.05], 0.45, [0, 0, 1], {role: 'detail', segments: 24});
    }
    parts.push(caseP);

    const plate = G.part('faceplate', 'Face plate', [-14, 0, 0]);
    const px = -plateT;
    G.box(plate, [px, -W / 2 + 1, -H / 2 + (digital ? 1.5 : 1)], [0.05, W / 2 - 1, H / 2 - (digital ? 1.5 : 1)]);
    const front = px - 0.05;
    if (digital) {
      faceRect(plate, at, [5.5, 5, 25.5, 15.5], front);
      dots(plate, at, [[3.2, 8], [3.2, 10.4], [3.2, 12.8]], 0.7, front);
      dots(plate, at, [[3, 3], [27, 3], [3, 29], [27, 29]], 0.6, front);
    } else {
      faceRect(plate, at, [6, 6, 25, 13.5], front);
      dots(plate, at, [0, 1, 2, 3, 4].map(i => [3.4, 7 + i * 2.6]), 0.85, front);
      dots(plate, at, [[2.4, 2.4], [25.6, 2.4], [2.4, 27.6], [25.6, 27.6]], 0.55, front);
    }
    parts.push(plate);

    const out = [-46, 0, 0];
    const lens = G.part('window', digital ? 'LCD window' : 'Display window', out);
    faceBox(lens, at, digital ? [6.3, 5.8, 24.7, 14.7] : [6.8, 6.8, 24.2, 12.7], [px - 0.8, px]);
    lens.transparent = true;
    parts.push(lens);

    if (digital) {
      const keys = G.part('keypad', 'Keypad', out);
      for (const r of [[6, 17, 9.6, 20.4], [6, 21.2, 9.6, 24.6], [11, 21.2, 15, 24.6], [15.8, 21.2, 19.8, 24.6]]) {
        const k = G.piece();
        faceBox(k, at, r, [px - 1.1, px]);
        G.merge(keys, k);
      }
      parts.push(keys);
    } else {
      const button = G.part('button', 'Push button', out);
      faceBox(button, at, [20, 16.2, 23.6, 19.8], [px - 1.2, px]);
      parts.push(button);
    }

    const label = G.part('label', 'Unit number label', digital ? [-64, 0, 0] : out);
    faceBox(label, at, digital ? [18.6, 16.4, 26.6, 20.6] : [8, 15.8, 18, 20.4], [px - 0.4, px]);
    parts.push(label);

    const handle = lathed('handle', 'Handle', [[0, 0], [0, 3.8], [13.4, 3.8], [13.4, 4.8], [15, 4.8], [15, 0]], [6, 0, -H / 2 - 15], [0, 0, 1]);
    handle.explosion = [0, 0, -16];
    parts.push(handle);

    return {parts, depth, H};
  }

  function lanceAndTip(depth) {
    const parts = [];
    const block = G.part('block', 'Contact block', [24, 0, 0]);
    G.box(block, [depth, -10, -9], [depth + 7, 10, 9], {radius: 1});
    parts.push(block);

    // Taper: a loft from the block's back face to the lance diameter.
    const x0 = depth + 7, x1 = depth + 25;
    const angles = G.ringAngles(18, 14, 2, {corner: 3, side: 3});
    const taper = G.part('taper', 'Taper');
    G.merge(taper, G.transform(G.loft(G.piece(), [G.roundedRing(18, 14, 2, {angles, z: x0}), G.roundedRing(4.8, 4.8, 2.4, {angles, z: x1})], {lines: 'ends'}), G.plane('yz')));
    taper.explosion = [44, 0, 0];
    parts.push(taper);

    // Lance: straight, then a 35° bend of radius 14, then a short leg.
    const start = x1 - 1, bendX = depth + 70, R = 14;
    const path = [[start, 0, 0], [bendX, 0, 0]];
    for (let i = 1; i <= 12; i++) {
      const t = DIP * i / 12;
      path.push([bendX + R * Math.sin(t), 0, -R + R * Math.cos(t)]);
    }
    const end = add(path[path.length - 1], mul(D, 16));
    path.push(end);
    const section = Array.from({length: 24}, (_, i) => [1.6 * Math.cos(i * Math.PI / 12), 1.6 * Math.sin(i * Math.PI / 12)]);
    const lance = G.part('lance', 'Lance');
    G.sweep(lance, path, section);
    lance.explosion = [62, 0, 0];
    parts.push(lance);

    // Temtip, coaxial with the lance end, each piece exploded further along it.
    const tip = (id, name, profile, gap, options) => {
      const p = lathed(id, name, profile, end, D, options);
      p.explosion = add(lance.explosion, mul(D, gap));
      parts.push(p);
    };
    tip('tube', 'Temtip tube', [[-3, 0], [-3, 3], [17, 3], [17, 0]], 12);
    tip('band', 'Brass band', [[14.6, 0], [14.6, 3.35], [16.2, 3.35], [16.2, 0]], 22);
    tip('body', 'Temtip sensor body', [[17, 0], [17, 3.6], [17.8, 4.6], [31.2, 4.6], [32, 3.8], [32, 0]], 30);
    tip('cap', 'Temtip cap', [[32, 0], [32, 2.5], [36.8, 2.5], [37.6, 1.6], [38, 0]], 38, {creaseAngle: 25});

    return {parts, end};
  }

  function model(digital) {
    return (parameters, options) => {
      const h = head(digital);
      const l = lanceAndTip(h.depth);
      const trails = [
        {a: [h.depth, 0, 0], b: [h.depth + 24, 0, 0], from: 'case', to: 'lance'},
        {a: [6, 0, -h.H / 2], b: [6, 0, -h.H / 2], from: 'handle', to: 'case'},
        {a: l.end, b: l.end, from: 'lance', to: 'cap'},
      ];
      const parts = [...h.parts, ...l.parts];
      const result = TechnicalProjection.render(parts, {...options, camera: CAMERA, trails});
      if (!options.anchors) return result;
      // Label anchors for the app's hand-laid label lanes (render-app-svg.cjs):
      // a point on each part, in assembled model coordinates, and its lane.
      const W = digital ? 30 : 28, H = h.H, px = digital ? -0.9 : -1, d = h.depth;
      const along = (s) => add(l.end, mul(D, s));
      const spots = {
        faceplate: [[px, W / 2 - 1, 6], 'left'],
        window: [[px - 0.8, W / 2 - 6.5, 6], 'left'],
        label: [[px - 0.4, digital ? -3.6 : 6, digital ? -0.4 : -3], 'left'],
        button: [[px - 1.2, -6, -3], 'left'],
        keypad: [[px - 1.1, W / 2 - 6, -3], 'left'],
        handle: [[6, 3.8, -H / 2 - 9], 'left'],
        case: [[d / 2, 0, H / 2], 'top'],
        block: [[d + 3.5, 0, 9], 'top'],
        taper: [[d + 10, 0, 6.2], 'top'],
        lance: [[d + 40, 0, 1.6], 'top'],
        tube: [along(6).map((v, i) => v + [0, 0, 3][i]), 'right'],
        band: [along(15.4).map((v, i) => v + [0, 0, 3.35][i]), 'right'],
        body: [along(24).map((v, i) => v + [0, 0, 4.6][i]), 'right'],
        cap: [along(35).map((v, i) => v + [0, 0, 2.5][i]), 'right'],
      };
      const camera = TechnicalProjection.createCamera(CAMERA);
      const amount = options.explosion ?? 1;
      result.anchors = parts.filter((p) => spots[p.id]).map((p) => {
        const [point, lane] = spots[p.id];
        const [x, y] = camera.project(add(point, mul(p.explosion, amount)));
        return {id: p.id, name: p.name, lane, at: [x * result.scale + result.offset[0], y * result.scale + result.offset[1]]};
      });
      return result;
    };
  }

  self.DrawingModels['manual-thermoholder'] = model(false);
  self.DrawingModels['digital-thermoholder'] = model(true);
})();
