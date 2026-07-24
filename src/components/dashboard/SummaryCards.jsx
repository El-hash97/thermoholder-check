export default function SummaryCards({ counts }) {
  const cards = [
    { label: 'Normal',       key: 'normal', bg: 'bg-green-50 border-green-300',  text: 'text-green-600' },
    { label: 'Out of Std',   key: 'oos',    bg: 'bg-red-50 border-red-300',      text: 'text-red-600' },
    { label: 'Error',        key: 'error',  bg: 'bg-orange-50 border-orange-300', text: 'text-orange-500' },
    { label: 'Not Available', key: 'none',   bg: 'bg-slate-100 border-slate-300',  text: 'text-slate-500' },
  ]
  return (
    <div className="grid grid-cols-4 gap-2">
      {cards.map(c => (
        <div key={c.key} className={`${c.bg} border rounded-xl p-3 flex flex-col items-center`}>
          <span className={`text-2xl font-bold ${c.text}`}>{counts[c.key] ?? 0}</span>
          <span className="text-[11px] text-slate-500 text-center leading-tight mt-0.5">{c.label}</span>
        </div>
      ))}
    </div>
  )
}
