// The Overview cart as one standalone SVG document (styles inlined), for
// drawing into the share JPG. Same geometry and faces as the live figure.
import { renderToStaticMarkup } from 'react-dom/server'
import { ISO_CSS } from './iso/iso-kit.mjs'
import overviewCss from './overview.css?raw'
import { WIDTH, HEIGHT, LAYERS, BACK_HOLDERS, FRONT_HOLDERS } from './cartGeometry.js'
import { ManualFace, DigitalFace } from './HolderFace.jsx'
import { displayValue } from '../../lib/displayValue.js'
import { valueKey } from '../../lib/status.js'

const html = (markup) => ({ __html: markup })

function StaticHolder({ holder, reading, time }) {
  const Face = holder.digital ? DigitalFace : ManualFace
  return (
    <g>
      <g dangerouslySetInnerHTML={html(holder.body)} />
      <g className="th-face" transform={holder.face}>
        <Face unit={holder} reading={reading} time={time} />
      </g>
    </g>
  )
}

export function cartSvgMarkup({ values = {}, checker, time = '--:--', background = '#131313', date = '', group = '' }) {
  const holder = (h) => <StaticHolder key={h.id} holder={h} reading={displayValue(values[h.id], checker, valueKey(date, group, h.id))} time={time} />
  return renderToStaticMarkup(
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="iso iso-svg th-fig"
      data-theme="dark"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH * 2}
      height={HEIGHT * 2}
      style={{ '--anatomy-paper': background, '--anatomy-card': background }}
    >
      <style dangerouslySetInnerHTML={html(ISO_CSS + overviewCss)} />
      <rect width={WIDTH} height={HEIGHT} fill={background} />
      <g dangerouslySetInnerHTML={html(LAYERS.base)} />
      {BACK_HOLDERS.map(holder)}
      <g dangerouslySetInnerHTML={html(LAYERS.middle)} />
      {FRONT_HOLDERS.map(holder)}
      <g dangerouslySetInnerHTML={html(LAYERS.top)} />
    </svg>,
  )
}

export async function cartImage(options) {
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cartSvgMarkup(options))
  await img.decode()
  return img
}
