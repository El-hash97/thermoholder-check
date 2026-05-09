import * as XLSX from 'xlsx'
import { UNITS, QUICK_CHECKER_REF, STD_TOLERANCE } from '../../constants/units.js'
import { getDaysInMonth } from '../dateUtils.js'

export function exportExcel(data) {
  const monthKey = data.month
  const days = getDaysInMonth(monthKey)

  const header = ['Unit', 'Tipe', ...days.map(d => d.slice(8))]
  const rows = UNITS.map(unit => {
    const row = [unit.label, unit.type]
    days.forEach(date => {
      const dayEntries = (data.entries || []).filter(e => e.date === date)
      row.push(dayEntries[0]?.values?.[unit.id] ?? 'X')
    })
    return row
  })

  const ws = XLSX.utils.aoa_to_sheet([
    [`TMMIN Casting Dept — Thermoholder Check Sheet — ${monthKey}`],
    [`Quick Checker: ${QUICK_CHECKER_REF}°C | Standar: ±${STD_TOLERANCE}°C`],
    [],
    header,
    ...rows,
  ])

  ws['!cols'] = [{ wch: 12 }, { wch: 8 }, ...days.map(() => ({ wch: 5 }))]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, monthKey)
  XLSX.writeFile(wb, `thermoholder_${monthKey}.xlsx`)
}
