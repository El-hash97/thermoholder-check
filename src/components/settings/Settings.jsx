import { useState, useEffect } from 'react'
import { STD_TOLERANCE } from '../../constants/units.js'
import { getStoredMonths } from '../../lib/storage.js'
import ResetConfirmDialog from './ResetConfirmDialog.jsx'

const VERSION = '1.0.0'
const MIN = 500
const MAX = 2000

export default function Settings({ monthKey, checker, onSaveChecker, onReset }) {
  const [showReset, setShowReset] = useState(false)
  const [storedMonths, setStoredMonths] = useState([])
  const [draft, setDraft] = useState(String(checker))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    getStoredMonths().then(setStoredMonths).catch(() => setStoredMonths([]))
  }, [monthKey])

  useEffect(() => { setDraft(String(checker)) }, [checker])

  const value = Number(draft)
  const valid = /^\d+$/.test(draft.trim()) && value >= MIN && value <= MAX
  const changed = valid && value !== checker

  async function handleSaveChecker(e) {
    e.preventDefault()
    if (!changed) return
    setSaving(true)
    setMessage(null)
    try {
      await onSaveChecker(value)
      setMessage({ ok: true, text: `Saved. Quick checker is now ${value}°C for ${monthKey}.` })
    } catch (err) {
      setMessage({ ok: false, text: err.message })
    } finally {
      setSaving(false)
    }
  }

  function handleConfirmReset() {
    onReset()
    setShowReset(false)
  }

  return (
    <div className="flex flex-col gap-4 pb-24 mx-3 lg:mx-6">
      <div className="bg-white rounded-xl p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Reference Standard</h2>
        <form onSubmit={handleSaveChecker} className="flex flex-col gap-2">
          <label htmlFor="quick-checker" className="flex justify-between items-center gap-3">
            <span className="text-slate-600">Quick Checker Ref</span>
            <span className="flex items-center gap-1.5">
              <input
                id="quick-checker"
                type="number"
                inputMode="numeric"
                min={MIN}
                max={MAX}
                step={1}
                value={draft}
                onChange={e => { setDraft(e.target.value); setMessage(null) }}
                aria-invalid={!valid}
                className={`w-24 text-right font-mono font-bold text-slate-900 border rounded-lg px-2 py-1.5 touch-target
                  ${valid ? 'border-slate-300' : 'border-red-400 bg-red-50'}`}
              />
              <span className="font-mono font-bold text-slate-900">°C</span>
            </span>
          </label>
          {!valid && <p className="text-xs text-red-600">Enter a whole number from {MIN} to {MAX}.</p>}
          <p className="text-xs text-slate-500">
            Applies to <strong className="text-slate-700">{monthKey}</strong>. Thermoholder readings, the Overview displays and exports use this value; recorded deviations stay as entered.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="submit"
              disabled={!changed || saving}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium touch-target disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {changed && !saving && (
              <button type="button" onClick={() => setDraft(String(checker))} className="px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 touch-target">
                Cancel
              </button>
            )}
            {message && (
              <span role="status" className={`text-xs ${message.ok ? 'text-green-700' : 'text-red-600'}`}>{message.text}</span>
            )}
          </div>
        </form>
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Standard Tolerance</span>
          <span className="font-mono font-bold text-slate-900">±{STD_TOLERANCE}°C</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">App Information</h2>
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Version</span>
          <span className="text-slate-400">{VERSION}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Active Month</span>
          <span className="font-mono text-slate-700">{monthKey}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Stored Data</span>
          <span className="text-slate-400">{storedMonths.length} month(s)</span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Reset Data</h2>
        <p className="text-slate-500 text-sm mb-3">
          Delete all check sheet data for <strong className="text-slate-700">{monthKey}</strong>. This action cannot be undone.
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
