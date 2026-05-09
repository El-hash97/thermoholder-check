export default function SummaryCards({ counts }) {
  const cards = [
    { label: 'Normal',       key: 'normal', bg: 'bg-green-900/50 border-green-700',  text: 'text-green-400' },
    { label: 'Out of Std',   key: 'oos',    bg: 'bg-red-900/50 border-red-700',      text: 'text-red-400' },
    { label: 'Error',        key: 'error',  bg: 'bg-orange-900/50 border-orange-700', text: 'text-orange-400' },
    { label: 'Not Available', key: 'none',   bg: 'bg-slate-700/50 border-slate-600',  text: 'text-slate-400' },
  ]
  return (
    <div className="grid grid-cols-4 gap-2">
      {cards.map(c => (
        <div key={c.key} className={`${c.bg} border rounded-xl p-3 flex flex-col items-center`}>
          <span className={`text-2xl font-bold ${c.text}`}>{counts[c.key] ?? 0}</span>
          <span className="text-[11px] text-slate-400 text-center leading-tight mt-0.5">{c.label}</span>
        </div>
      ))}
    </div>
  )
}
