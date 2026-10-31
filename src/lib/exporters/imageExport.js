export function formatDateForShare(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return String(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function buildShareCaption({ date, group, entries } = {}) {
  const parts = ['Thermoholder Check Sheet']

  const dateText = formatDateForShare(date)
  if (dateText) {
    parts.push(dateText)
  }

  let shiftLabel = ''
  if (group) {
    const g = String(group).toLowerCase()
    shiftLabel = g === 'red' ? 'Red Shift' : g === 'white' ? 'White Shift' : `${group} Shift`
  } else if (Array.isArray(entries) && entries.length > 0) {
    const groups = [...new Set(entries.map(e => e?.group?.toLowerCase()).filter(Boolean))]
    if (groups.includes('red') && groups.includes('white')) {
      shiftLabel = 'Red & White Shift'
    } else if (groups.includes('red')) {
      shiftLabel = 'Red Shift'
    } else if (groups.includes('white')) {
      shiftLabel = 'White Shift'
    } else if (groups.length > 0) {
      shiftLabel = `${groups.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(' & ')} Shift`
    }
  }

  if (shiftLabel) {
    parts.push(shiftLabel)
  }

  return parts.join(' - ')
}

export function buildShareFilename({ date, group, entries } = {}) {
  let shiftSlug = ''
  if (group) {
    shiftSlug = `_${String(group).toLowerCase()}`
  } else if (Array.isArray(entries) && entries.length > 0) {
    const groups = [...new Set(entries.map(e => e?.group?.toLowerCase()).filter(Boolean))].sort()
    if (groups.length > 0) {
      shiftSlug = `_${groups.join('_')}`
    }
  }
  const dateSlug = date ? `_${date}` : ''
  return `thermoholder${dateSlug}${shiftSlug}.jpg`
}

export async function shareCanvas(canvas, filenameOrOptions = {}, extraOptions = {}) {
  let opts = {}
  if (typeof filenameOrOptions === 'string') {
    opts = { filename: filenameOrOptions, ...extraOptions }
  } else if (filenameOrOptions && typeof filenameOrOptions === 'object') {
    opts = { ...filenameOrOptions }
  }

  const {
    filename = 'thermoholder-share.jpg',
    title = 'Thermoholder Check Sheet',
    text = title,
  } = opts

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95))
  const file = new File([blob], filename, { type: 'image/jpeg' })

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text })
      return
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err)
      }
      return
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function shareToWhatsApp(text) {
  const encoded = encodeURIComponent(text)
  window.open(`https://wa.me/?text=${encoded}`, '_blank')
}

