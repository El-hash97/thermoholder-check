import { useState } from 'react'
import { Share2, X } from 'lucide-react'
import { shareCanvas } from '../../lib/exporters/imageExport.js'
import { renderShareCardCanvas } from '../../lib/exporters/drawShareCard.js'

export default function ExportMenu({ date, entries }) {
  const [loading, setLoading] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const hasData = (entries?.length ?? 0) > 0

  async function handle() {
    setLoading('image')
    try {
      const canvas = renderShareCardCanvas({ date, entries })
      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.95))
      await shareCanvas(canvas)
      setPreviewUrl(null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Share</p>
      <div className="flex gap-2">
        <button
          onClick={handle}
          disabled={loading !== null || !hasData}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-white touch-target transition-colors bg-blue-700 hover:bg-blue-600 ${loading ? 'opacity-60' : ''} ${!hasData ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <Share2 size={16} />
          {loading ? '...' : 'Share'}
        </button>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="flex flex-col items-center gap-3">
            <img src={previewUrl} alt="Share preview" className="max-w-full max-h-[70vh] rounded-xl" />
            <button onClick={() => setPreviewUrl(null)} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
              <X size={16}/> Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
