import { getStatus } from '../../lib/status.js'

const BG = {
  normal: 'bg-green-600 text-white',
  oos:    'bg-red-600 text-white',
  error:  'bg-orange-500 text-white',
  none:   'bg-slate-700 text-slate-400',
}

export default function StatusCell({ value, onClick, small }) {
  const { status, label } = getStatus(value)
  return (
    <div
      onClick={onClick}
      title={label}
      className={`${BG[status]} ${small ? 'text-[10px] h-6' : 'text-xs h-8'} 
        flex items-center justify-center rounded font-mono font-semibold
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      {label}
    </div>
  )
}
