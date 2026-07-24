import { LayoutDashboard, ClipboardEdit, Settings } from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'input',     label: 'Input',     Icon: ClipboardEdit },
  { id: 'settings',  label: 'Settings',  Icon: Settings },
]

export default function BottomNav({ active, onChange, alertCount }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-20 flex">
      {NAV.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 flex flex-col items-center justify-center py-2 touch-target relative
            ${active === id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Icon size={22} />
          {id === 'dashboard' && alertCount > 0 && (
            <span className="absolute top-1 right-1/4 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
          <span className="text-[11px] mt-0.5">{label}</span>
        </button>
      ))}
    </nav>
  )
}
