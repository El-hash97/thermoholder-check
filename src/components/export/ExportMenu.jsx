import { useState } from 'react'
import { Share2, X } from 'lucide-react'
import { captureAndShare } from '../../lib/exporters/imageExport.js'
import ShareCard from './ShareCard.jsx'

export default function ExportMenu({ date, entries }) {
  const [loading, setLoading] = useState(null)
  const [showShare, setShowShare] = useState(false)

  const hasData = (entries?.length ?? 0) > 0

  async function handle() {
    setLoading('image')
    try {
      setShowShare(true)
      await new Promise(r => setTimeout(r, 300))
      await captureAndShare('share-card')
      setShowShare(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Share</p>
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

      {showShare && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="flex flex-col items-center gap-3">
            <ShareCard date={date} entries={entries} />
            <button onClick={() => setShowShare(false)} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
              <X size={16}/> Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
