import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react'
import type { FacilityStatus } from '../types'

interface StatusLegendBlocksProps {
  activeStatus: FacilityStatus
}

const BLOCKS: { status: FacilityStatus; label: string; description: string; icon: typeof ShieldCheck; bg: string }[] = [
  { status: 'normal', label: '정상', description: '안전합니다', icon: ShieldCheck, bg: 'bg-status-normal' },
  { status: 'caution', label: '주의', description: '환기 필요', icon: AlertTriangle, bg: 'bg-status-caution' },
  { status: 'danger', label: '위험', description: '즉시 조치 필요', icon: ShieldAlert, bg: 'bg-status-danger' },
]

export default function StatusLegendBlocks({ activeStatus }: StatusLegendBlocksProps) {
  return (
    <div className="flex flex-col gap-3">
      {BLOCKS.map((block) => {
        const Icon = block.icon
        const isActive = block.status === activeStatus
        return (
          <div
            key={block.status}
            className={`flex items-center gap-4 rounded-2xl px-6 py-4 text-white transition-opacity ${block.bg} ${
              isActive ? 'opacity-100' : 'opacity-45'
            }`}
          >
            <Icon size={36} strokeWidth={1.75} />
            <div className="flex-1">
              <p className="text-headline">{block.label}</p>
              <p className="text-base">{block.description}</p>
            </div>
            {isActive && (
              <span className="flex-shrink-0 rounded-full bg-white/20 px-3 py-1.5 text-base font-bold">현재 상태</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
