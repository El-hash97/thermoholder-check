import { useState, useEffect } from 'react'
import { UNITS } from '../../constants/units.js'
import { formatDate } from '../../lib/dateUtils.js'
import DateGroupPicker from './DateShiftGroupPicker.jsx'
import UnitInputCell from './UnitInputCell.jsx'
import { Save, Share2, X } from 'lucide-react'
import { captureAndShare } from '../../lib/exporters/imageExport.js'
import ShareCard from '../export/ShareCard.jsx'

const emptyValues = () => Object.fromEntries(UNITS.map(u => [u.id, '']))

export default function InputCheckSheet({ data, onSubmit }) {
  const [date,   setDate]   = useState(formatDate())
  const [group,  setGroup]  = useState('red')
  const [values, setValues] = useState(emptyValues())
  const [saved,    setSaved]    = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [sharing,   setSharing]  = useState(false)

  useEffect(() => {
    const id = `${date}_${group}`
    const existing = data?.entries?.find(e => e.id === id)
    setValues(existing ? { ...emptyValues(), ...existing.values } : emptyValues())
    setSaved(false)
  }, [date, group, data])

  function handleChange(field, val) {
    if (field === 'date')  { setDate(val);  return }
    if (field === 'group') { setGroup(val); return }
  }

  function handleSubmit() {
    onSubmit(date, group, values)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleShare() {
    setSharing(true)
    setShowShare(true)
    try {
      await new Promise(r => setTimeout(r, 300))
      await captureAndShare('share-card')
    } catch (e) {
      console.error(e)
    } finally {
      setSharing(false)
      setShowShare(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <DateGroupPicker date={date} group={group} onChange={handleChange} />

      <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            TH Values — Team <span className="text-rose-400">{group.toUpperCase()}</span>
          </h2>
          <span className="text-xs text-slate-500">QC: 1500°C · Std: ±5°C</span>
        </div>
        {UNITS.map(unit => (
          <UnitInputCell
            key={unit.id}
            unit={unit}
            value={values[unit.id] ?? ''}
            onChange={(id, val) => setValues(prev => ({ ...prev, [id]: val }))}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center justify-center gap-2 px-5 py-4 rounded-xl text-base font-semibold touch-target transition-colors bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-60"
        >
          <Share2 size={20} />
        </button>
        <button
          onClick={handleSubmit}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-base font-semibold touch-target transition-colors
            ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
        >
          <Save size={20} />
          {saved ? 'Saved!' : 'Save Data'}
        </button>
      </div>

      {showShare && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="flex flex-col items-center gap-3">
            <ShareCard entry={{ date, group, values }} />
            <button onClick={() => setShowShare(false)} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
              <X size={16} /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
