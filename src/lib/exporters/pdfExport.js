import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { UNITS, QUICK_CHECKER_REF, STD_TOLERANCE } from '../../constants/units.js'
import { getDaysInMonth } from '../dateUtils.js'
import { getStatus } from '../status.js'

const STATUS_COLORS = {
  normal: [34, 197, 94],
  oos:    [239, 68, 68],
  error:  [249, 115, 22],
  none:   [100, 116, 139],
}

export function exportPDF(data) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const monthKey = data.month

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PT. Toyota Motor Manufacturing Indonesia', 14, 14)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Casting Dept — EPSD Sunter 2 | Thermoholder Check Sheet | Bulan: ${monthKey}`, 14, 20)
  doc.text(`Quick Checker Ref: ${QUICK_CHECKER_REF}°C | Standar: ±${STD_TOLERANCE}°C`, 14, 26)

  const days = getDaysInMonth(monthKey)
  const head = [['Unit', 'Tipe', ...days.map(d => d.slice(8))]]
  const body = UNITS.map(unit => {
    const row = [unit.label, unit.type]
    days.forEach(date => {
      const dayEntries = (data.entries || []).filter(e => e.date === date)
      const vals = dayEntries.map(e => e.values?.[unit.id] ?? 'X')
      row.push(vals[0] ?? 'X')
    })
    return row
  })

  autoTable(doc, {
    head,
    body,
    startY: 30,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [148, 163, 184] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index >= 2) {
        const val = data.cell.raw
        const { status } = getStatus(val)
        data.cell.styles.fillColor = STATUS_COLORS[status]
        data.cell.styles.textColor = [255, 255, 255]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  doc.save(`thermoholder_${monthKey}.pdf`)
}
