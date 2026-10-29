import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { UNITS, QUICK_CHECKER_REF, STD_TOLERANCE } from '../../constants/units.js'
import { displayDate } from '../dateUtils.js'
import { getStatus, lowHigh } from '../status.js'

const STATUS_COLORS = {
  normal: [34, 197, 94],
  oos:    [239, 68, 68],
  error:  [249, 115, 22],
  none:   [100, 116, 139],
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function formatMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  return `${MONTH_NAMES_ID[m - 1]} ${y}`
}

function monthLabelForDates(dates) {
  const keys = [...new Set(dates.map(d => d.slice(0, 7)))]
  return keys.map(formatMonthLabel).join(' / ')
}

async function loadLogoDataUrl() {
  try {
    const res = await fetch('/logo.png')
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function drawHeader(doc, logo, periodLabel, checker) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const leftX = 14
  if (logo) doc.addImage(logo, 'PNG', leftX, 8, 16, 16)

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 41, 59)
  doc.text('Thermoholder Check Sheet', pageWidth / 2, 15, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(periodLabel, pageWidth - leftX, 15, { align: 'right' })

  doc.text(`Quick Checker Ref: ${checker}°C | Standar: ±${STD_TOLERANCE}°C`, pageWidth - leftX, 21, { align: 'right' })
}

const TYPE_ABBR = { Manual: 'Man', Digital: 'Dig' }

function abbrevValue(v) {
  const side = lowHigh(v)
  if (side) return side === 'low' ? 'LO' : 'HI'
  return String(v).toLowerCase() === 'error' ? 'Er' : v
}

const cellText = (v, compact) => (compact ? abbrevValue(v) : lowHigh(v) ? lowHigh(v).toUpperCase() : v)

function drawTable(doc, dates, monthLabel, entries, { compact = false } = {}) {
  const groupLabels = compact ? ['R', 'W'] : ['Red', 'White']
  const nameColWidth = compact ? 11 : 16
  const typeColWidth = compact ? 8 : 12

  const head = [
    [
      { content: 'TH',   rowSpan: 3, styles: { valign: 'middle', halign: 'left' } },
      { content: 'Tipe', rowSpan: 3, styles: { valign: 'middle' } },
      { content: monthLabel, colSpan: dates.length * 2, styles: { halign: 'center' } },
    ],
    dates.map(d => ({ content: d.slice(8), colSpan: 2, styles: { halign: 'center' } })),
    dates.flatMap(() => groupLabels),
  ]

  const body = UNITS.map(unit => {
    const row = [unit.label, compact ? (TYPE_ABBR[unit.type] ?? unit.type) : unit.type]
    dates.forEach(date => {
      const redE   = entries.find(e => e.date === date && e.group === 'red')
      const whiteE = entries.find(e => e.date === date && e.group === 'white')
      const rv = redE?.values?.[unit.id]   ?? 'X'
      const wv = whiteE?.values?.[unit.id] ?? 'X'
      row.push({ content: cellText(rv, compact), status: getStatus(rv).status })
      row.push({ content: cellText(wv, compact), status: getStatus(wv).status })
    })
    return row
  })

  autoTable(doc, {
    head,
    body,
    startY: 32,
    margin: { left: 8, right: 8 },
    theme: 'grid',
    styles: { fontSize: 6, cellPadding: 1, halign: 'center', valign: 'middle', lineColor: [148, 163, 184], lineWidth: 0.1 },
    headStyles: { fillColor: [30, 41, 59], textColor: [148, 163, 184], fontSize: 7, lineColor: [100, 116, 139] },
    columnStyles: {
      0: { halign: 'left', fontSize: 7, cellWidth: nameColWidth },
      1: { fontSize: 6, cellWidth: typeColWidth },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index >= 2) {
        const { status } = data.cell.raw
        data.cell.styles.fillColor = STATUS_COLORS[status]
        data.cell.styles.textColor = [255, 255, 255]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })
}

export async function exportWeeklyPDF(entries, weekDates, checker = QUICK_CHECKER_REF) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const logo = await loadLogoDataUrl()

  const periodLabel = `Laporan Mingguan · ${displayDate(weekDates[0])} – ${displayDate(weekDates[6])}`
  drawHeader(doc, logo, periodLabel, checker)
  drawTable(doc, weekDates, monthLabelForDates(weekDates), entries)

  doc.save(`thermoholder_weekly_${weekDates[0]}_${weekDates[6]}.pdf`)
}

export async function exportMonthlyPDF(entries, days, monthKey, checker = QUICK_CHECKER_REF) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const logo = await loadLogoDataUrl()

  const periodLabel = `Laporan Bulanan · ${formatMonthLabel(monthKey)}`
  drawHeader(doc, logo, periodLabel, checker)
  drawTable(doc, days, formatMonthLabel(monthKey), entries, { compact: true })

  doc.save(`thermoholder_monthly_${monthKey}.pdf`)
}
