export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center sticky top-0 z-20 relative">
      <img src="/logo.png" alt="Logo" className="h-11 w-auto object-contain rounded relative z-10" />
      <h1 className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900 leading-tight pointer-events-none">
        Thermoholder Check Sheet
      </h1>
    </header>
  )
}
