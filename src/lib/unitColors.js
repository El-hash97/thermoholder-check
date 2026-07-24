import { UNITS } from '../constants/units.js'

export const UNIT_COLORS = UNITS.map((_, i) =>
  `hsl(${Math.round((i * 137.508) % 360)}, 65%, 60%)`
)
