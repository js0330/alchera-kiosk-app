import { useState } from 'react'
import { X } from 'lucide-react'

export type DemoSelection = 'normal' | 'caution' | 'resolved'

interface DemoControlsProps {
  onSelect: (next: DemoSelection) => void
}

const OPTIONS: { key: DemoSelection; label: string }[] = [
  { key: 'normal', label: 'NORMAL' },
  { key: 'caution', label: 'CAUTION' },
  { key: 'resolved', label: 'RESOLVED' },
]

export default function DemoControls({ onSelect }: DemoControlsProps) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Show demo controls"
        className="fixed bottom-6 right-6 z-50 h-4 w-4 rounded-full bg-black/10 transition-colors hover:bg-black/25"
      />
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 rounded-2xl border border-border-gray bg-white/95 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between gap-6">
        <span className="text-xs font-bold uppercase tracking-widest text-text-light">Demo Controls</span>
        <button onClick={() => setOpen(false)} aria-label="Hide demo controls" className="text-text-light">
          <X size={16} />
        </button>
      </div>
      <div className="flex gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => onSelect(option.key)}
            className="rounded-xl border border-border-gray bg-bg-panel px-4 py-2 text-sm font-bold text-primary-navy transition-colors hover:bg-primary-blue hover:text-white"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
