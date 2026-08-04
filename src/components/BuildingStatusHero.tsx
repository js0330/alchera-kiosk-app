import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import type { FacilityStatus } from '../types'

interface BuildingStatusHeroProps {
  status: FacilityStatus
}

const CONFIG: Record<
  FacilityStatus,
  { icon: typeof CheckCircle2; word: string; message: string; bg: string; fg: string }
> = {
  normal: {
    icon: CheckCircle2,
    word: '안전',
    message: '건물 내 모든 공용공간의 공기질이 정상이에요',
    bg: 'bg-status-normal/10',
    fg: 'text-status-normal',
  },
  caution: {
    icon: AlertCircle,
    word: '환기 중',
    message: '일부 공간이 환기 중이에요. 아래에서 자세히 확인해보세요',
    bg: 'bg-status-caution/10',
    fg: 'text-status-caution',
  },
  danger: {
    icon: AlertTriangle,
    word: '주의 필요',
    message: '일부 공간의 이용을 자제해주세요. 아래에서 확인해보세요',
    bg: 'bg-status-danger/10',
    fg: 'text-status-danger',
  },
}

export default function BuildingStatusHero({ status }: BuildingStatusHeroProps) {
  const config = CONFIG[status]
  const Icon = config.icon

  return (
    <div className={`flex flex-col items-center gap-4 rounded-2xl p-10 text-center ${config.bg}`}>
      <Icon size={96} className={config.fg} strokeWidth={1.5} />
      <p className={`text-mega ${config.fg}`}>{config.word}</p>
      <p className="text-label text-text-gray">{config.message}</p>
    </div>
  )
}
