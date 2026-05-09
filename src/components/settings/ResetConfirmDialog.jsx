import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ResetConfirmDialog({ monthKey, onConfirm, onCancel }) {
  const [step, setStep] = useState(1)
  const [typed, setTyped] = useState('')

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-400 shrink-0" size={24} />
          <h2 className="text-lg font-bold text-white">Reset Data {monthKey}?</h2>
        </div>

        {step === 1 && (
          <>
            <p className="text-slate-300 text-sm mb-5">
              All check sheet data for <strong>{monthKey}</strong> will be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-200 text-sm font-medium">Cancel</button>
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-medium">Continue</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-slate-300 text-sm mb-3">
              Type <strong className="text-red-400">RESET</strong> to confirm:
            </p>
            <input
              autoFocus
              value={typed}
              onChange={e => setTyped(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white text-base mb-4 focus:outline-none focus:border-red-500"
              placeholder="RESET"
            />
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-200 text-sm font-medium">Cancel</button>
              <button
                onClick={() => typed === 'RESET' && onConfirm()}
                disabled={typed !== 'RESET'}
                className="flex-1 py-3 rounded-xl bg-red-700 text-white text-sm font-medium disabled:opacity-40"
              >
                Delete Data
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
