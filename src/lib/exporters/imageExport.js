import html2canvas from 'html2canvas'

export async function captureAndShare(elementId, filename = 'thermoholder-share.jpg') {
  const el = document.getElementById(elementId)
  if (!el) throw new Error('Element not found: ' + elementId)

  const canvas = await html2canvas(el, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
  })

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95))
  const file = new File([blob], filename, { type: 'image/jpeg' })

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Thermoholder Check Sheet' })
    return
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
