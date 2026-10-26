// Everything drawn on a holder's front face, in face-plane units
// (u right from the box's left edge, v down from its top). See cartGeometry.js.

const SEG_W = 3
const SEG_H = 4.6
const T = 0.6
const MID = SEG_H / 2
const SEGMENTS = {
  a: [0.35, 0, SEG_W - 0.7, T],
  b: [SEG_W - T, 0.35, T, MID - 0.55],
  c: [SEG_W - T, MID + 0.2, T, MID - 0.55],
  d: [0.35, SEG_H - T, SEG_W - 0.7, T],
  e: [0, MID + 0.2, T, MID - 0.55],
  f: [0, 0.35, T, MID - 0.55],
  g: [0.35, MID - T / 2, SEG_W - 0.7, T],
}
const GLYPHS = {
  0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg',
  6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', E: 'adefg', r: 'eg', ' ': '',
}

export function SevenSeg({ text, x, y, pitch, tone, size = 4, dot = true }) {
  const cells = text.padStart(size, ' ').slice(-size).split('')
  const number = dot && /^\d+$/.test(text)
  return (
    <g transform={`translate(${x} ${y})`}>
      {cells.map((ch, i) => (
        <g key={i} transform={`translate(${i * pitch} 0) skewX(-6)`}>
          {Object.entries(SEGMENTS).map(([name, [sx, sy, w, h]]) => (
            <rect
              key={name}
              x={sx} y={sy} width={w} height={h} rx={0.2}
              className={(GLYPHS[ch] ?? '').includes(name) ? `th-seg-on th-seg-${tone}` : 'th-seg-off'}
            />
          ))}
          <circle cx={SEG_W + 0.4} cy={SEG_H - 0.3} r={0.32} className={number && i === size - 1 ? `th-seg-on th-seg-${tone}` : 'th-seg-off'} />
        </g>
      ))}
    </g>
  )
}

const LED_COLORS = ['green', 'amber', 'red', 'off', 'off']
const ledOn = { normal: 'green', error: 'amber', oos: 'red' }

function Led({ u, v, r, color, on }) {
  return <circle cx={u} cy={v} r={r} className={on ? `th-led th-led-${color}` : 'th-led'} />
}

function Label({ u, v, w, h, tag }) {
  return (
    <g>
      <rect x={u} y={v} width={w} height={h} rx={0.3} className="th-label" />
      <rect x={u + 0.5} y={v + 0.5} width={w - 1} height={h - 1} className="th-label-rule" />
      <text x={u + w / 2} y={v + h / 2 + (tag.length > 2 ? 0.6 : 0.95)} fontSize={tag.length > 2 ? 1.7 : 2.7} className="th-label-text">
        {tag}
      </text>
    </g>
  )
}

const segTone = { normal: 'red', oos: 'red', error: 'amber', none: 'dim' }

export function ManualFace({ unit, reading }) {
  const { text, status } = reading
  return (
    <g>
      <text x={15} y={4.4} fontSize={2.4} className="th-brand">Heraeus</text>
      <rect x={6} y={6} width={19} height={7.5} rx={0.6} className="th-bezel" />
      <rect x={6.8} y={6.8} width={17.4} height={5.9} rx={0.3} className="th-window-red" />
      <SevenSeg text={text} x={8.2} y={7.45} pitch={3.9} tone={segTone[status]} />
      {LED_COLORS.map((color, i) => (
        <Led key={i} u={3.4} v={7 + i * 2.6} r={0.85} color={color} on={ledOn[status] === color} />
      ))}
      <Label u={8} v={15.8} w={10} h={4.6} tag={unit.tag} />
      <rect x={20} y={16.2} width={3.6} height={3.6} rx={0.4} className="th-button-red" />
      <text x={15} y={25.8} fontSize={1.7} className="th-maker">Electro-Nite</text>
      {[[2.4, 2.4], [25.6, 2.4], [2.4, 27.6], [25.6, 27.6]].map(([u, v]) => (
        <circle key={`${u}-${v}`} cx={u} cy={v} r={0.55} className="th-screw" />
      ))}
    </g>
  )
}

export function DigitalFace({ unit, reading, time }) {
  const { text, status } = reading
  return (
    <g>
      <text x={25.6} y={4} fontSize={2.2} className="th-brand th-brand-end">Heraeus</text>
      <rect x={5.5} y={5} width={20} height={10.5} rx={1} className="th-bezel" />
      <rect x={6.3} y={5.8} width={18.4} height={8.9} rx={0.5} className="th-window-lcd" />
      <rect x={7.1} y={6.5} width={2.2} height={1.1} rx={0.2} className="th-lcd-line" />
      <text x={23.9} y={7.6} fontSize={1.2} className={`th-lcd-small th-lcd-${status}`}>{time}</text>
      <text x={14.6} y={13.4} fontSize={5.6} className={`th-lcd-digits th-lcd-${status}`}>{text}</text>
      {text !== '----' && text !== 'Err' && <text x={22.4} y={10.2} fontSize={1.5} className={`th-lcd-small th-lcd-${status}`}>°C</text>}
      <rect x={26.3} y={7.6} width={1.4} height={1.6} className={status === 'oos' ? 'th-led th-led-red' : 'th-led'} />
      {['green', 'amber', 'red'].map((color, i) => (
        <Led key={color} u={3.2} v={8 + i * 2.4} r={0.7} color={color} on={ledOn[status] === color} />
      ))}
      <rect x={6} y={17} width={3.6} height={3.4} rx={0.4} className="th-key" />
      <path d="M7.8 17.8 L8.9 19.5 L6.7 19.5 Z" className="th-key-glyph" />
      <rect x={6} y={21.2} width={3.6} height={3.4} rx={0.4} className="th-key" />
      <path d="M7.8 23.8 L8.9 22.1 L6.7 22.1 Z" className="th-key-glyph" />
      <rect x={11} y={21.2} width={4} height={3.4} rx={0.4} className="th-key-ok" />
      <path d="M12 22.9 L12.8 23.7 L14.1 22" className="th-key-mark" />
      <rect x={15.8} y={21.2} width={4} height={3.4} rx={0.4} className="th-button-red" />
      <path d="M17 22.1 L18.6 23.7 M18.6 22.1 L17 23.7" className="th-key-mark" />
      <Label u={18.6} v={16.4} w={8} h={4.2} tag={unit.tag} />
      <text x={15} y={28.6} fontSize={1.5} className="th-maker">Electro-Nite</text>
      {[[3, 3], [27, 3], [3, 29], [27, 29]].map(([u, v]) => (
        <circle key={`${u}-${v}`} cx={u} cy={v} r={0.6} className="th-screw th-screw-dark" />
      ))}
    </g>
  )
}
