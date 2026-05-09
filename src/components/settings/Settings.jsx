import { useState } from 'react'
import { QUICK_CHECKER_REF, STD_TOLERANCE } from '../../constants/units.js'
import { getStoredMonths } from '../../lib/storage.js'
import ResetConfirmDialog from './ResetConfirmDialog.jsx'

const VERSION = '1.0.0'

export default function Settings({ monthKey, onReset }) {
  const [showReset, setShowReset] = useState(false)
  const storedMonths = getStoredMonths()

  function handleConfirmReset() {
    onReset()
    setShowReset(false)
  }

  return (
    <div className="flex flex-col gap-4 pb-24 mx-3">
      <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Reference Standard</h2>
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Quick Checker Ref</span>
          <span className="font-mono font-bold text-white">{QUICK_CHECKER_REF}°C</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Standard Tolerance</span>
          <span className="font-mono font-bold text-white">±{STD_TOLERANCE}°C</span>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">App Information</h2>
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Version</span>
          <span className="text-slate-400">{VERSION}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Active Month</span>
          <span className="font-mono text-slate-200">{monthKey}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Stored Data</span>
          <span className="text-slate-400">{storedMonths.length} month(s)</span>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Reset Data</h2>
        <p className="text-slate-400 text-sm mb-3">
          Delete all check sheet data for <strong className="text-slate-200">{monthKey}</strong>. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowReset(true)}
          className="w-full py-3 rounded-xl bg-red-800 hover:bg-red-700 text-white font-medium text-sm touch-target"
        >
          Reset This Month Data
        </button>
      </div>

      {showReset && (
        <ResetConfirmDialog
          monthKey={monthKey}
          onConfirm={handleConfirmReset}
          onCancel={() => setShowReset(false)}
        />
      )}
    </div>
  )
}
